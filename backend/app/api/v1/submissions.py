import uuid
import os
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.api.deps import get_db, require_role, get_current_user
from app.core.config import settings
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.evaluation import AIEvaluation
from app.models.user import User
from app.schemas.assignments import (
    SubmissionPresignRequest, SubmissionPresignResponse,
    SubmissionConfirmRequest, SubmissionOut, SubmissionListResponse,
    SubmissionDetailOut, EvaluationOut,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Pre-sign Upload URL ──────────────────────────────────────────────────────

@router.post("/presign", response_model=SubmissionPresignResponse)
async def presign_submission_upload(
    req: SubmissionPresignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Teacher"])),
):
    """
    Teacher requests a direct upload URL for their submission file.
    Falls back to local mock endpoint when AWS credentials are absent.
    """
    # Verify assignment exists and belongs to teacher's institution
    stmt = select(Assignment).where(
        Assignment.id == req.assignment_id,
        Assignment.institution_id == current_user.institution_id,
    )
    result = await db.execute(stmt)
    assignment = result.scalars().first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or not accessible",
        )

    uuid_filename = f"{uuid.uuid4()}_{req.filename}"

    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        # Development mock: teacher PUT directly to our local FastAPI endpoint
        upload_url = f"http://localhost:8000{settings.API_V1_STR}/submissions/upload-mock/{uuid_filename}"
        s3_key = f"http://localhost:8000/static/uploads/{uuid_filename}"
        is_mock = True
    else:
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION_NAME,
            )
            s3_key = (
                f"institutions/{current_user.institution_id}"
                f"/submissions/{req.assignment_id}/{uuid_filename}"
            )
            upload_url = s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": s3_key,
                    "ContentType": req.content_type,
                },
                ExpiresIn=3600,
            )
            is_mock = False
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"S3 presigned URL generation failed: {str(e)}",
            )

    return SubmissionPresignResponse(upload_url=upload_url, s3_key=s3_key, is_mock=is_mock)


@router.put("/upload-mock/{filename}", include_in_schema=False)
async def upload_mock_submission(filename: str, request: Request):
    """Mock PUT endpoint for dev: saves submission file locally."""
    upload_dir = os.path.join(os.getcwd(), "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    try:
        body = await request.body()
        if len(body) > 52428800:  # 50MB
            raise HTTPException(status_code=400, detail="File exceeds 50MB limit")
        with open(file_path, "wb") as f:
            f.write(body)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Local upload failed: {str(e)}")
    return {"status": "success", "file_url": f"http://localhost:8000/static/uploads/{filename}"}


# ─── Confirm Submission → Trigger AI Pipeline ─────────────────────────────────

@router.post("/confirm", response_model=SubmissionOut, status_code=status.HTTP_202_ACCEPTED)
async def confirm_submission(
    payload: SubmissionConfirmRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Teacher"])),
):
    """
    Teacher confirms upload is complete. Persists submission record and
    dispatches the AI evaluation Celery pipeline.
    Returns HTTP 202 immediately — evaluation runs asynchronously.
    """
    # Verify assignment
    stmt = select(Assignment).where(
        Assignment.id == payload.assignment_id,
        Assignment.institution_id == current_user.institution_id,
    )
    result = await db.execute(stmt)
    assignment = result.scalars().first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Guard: prevent double submission for same assignment
    existing_stmt = select(Submission).where(
        Submission.teacher_id == current_user.id,
        Submission.assignment_id == payload.assignment_id,
        Submission.status.in_(["pending", "processing", "evaluated"]),
    )
    existing_result = await db.execute(existing_stmt)
    if existing_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A submission for this assignment already exists.",
        )

    # Create submission record
    new_submission = Submission(
        assignment_id=payload.assignment_id,
        teacher_id=current_user.id,
        institution_id=current_user.institution_id,
        s3_key=payload.s3_key,
        file_mime=payload.file_mime,
        status="pending",
    )
    db.add(new_submission)
    await db.commit()
    await db.refresh(new_submission)

    # Dispatch AI evaluation pipeline via Celery
    try:
        from app.tasks.evaluation_worker import run_evaluation_pipeline
        run_evaluation_pipeline.apply_async(
            args=[str(new_submission.id)],
            queue="ai_heavy",
        )
        logger.info(f"Dispatched evaluation pipeline for submission {new_submission.id}")
    except Exception as e:
        logger.warning(f"Celery dispatch failed (running in mock mode): {e}")
        # In dev without Celery running, mark as pending — admin can re-trigger later
        pass

    return new_submission


# ─── Teacher Submission List ──────────────────────────────────────────────────

@router.get("", response_model=SubmissionListResponse)
async def list_submissions(
    assignment_id: Optional[uuid.UUID] = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Teacher: lists their own submissions.
    Admin: lists all submissions in their institution (filtered by assignment_id if provided).
    """
    offset = (page - 1) * limit

    if current_user.role == "Teacher":
        stmt = select(Submission).where(Submission.teacher_id == current_user.id)
    else:
        stmt = select(Submission).where(
            Submission.institution_id == current_user.institution_id
        )

    if assignment_id:
        stmt = stmt.where(Submission.assignment_id == assignment_id)

    stmt = stmt.order_by(Submission.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    submissions = result.scalars().all()

    count_stmt = select(func.count(Submission.id))
    if current_user.role == "Teacher":
        count_stmt = count_stmt.where(Submission.teacher_id == current_user.id)
    else:
        count_stmt = count_stmt.where(
            Submission.institution_id == current_user.institution_id
        )
    if assignment_id:
        count_stmt = count_stmt.where(Submission.assignment_id == assignment_id)

    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    return SubmissionListResponse(submissions=list(submissions), total=total)


# ─── Single Submission Detail ─────────────────────────────────────────────────

@router.get("/{submission_id}", response_model=SubmissionDetailOut)
async def get_submission(
    submission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full submission detail including AI evaluation results.
    Teacher can only view their own submissions.
    Admin can view all submissions in their institution.
    """
    stmt = (
        select(Submission)
        .where(Submission.id == submission_id)
        .options(joinedload(Submission.evaluation), joinedload(Submission.assignment))
    )
    if current_user.role == "Teacher":
        stmt = stmt.where(Submission.teacher_id == current_user.id)
    else:
        stmt = stmt.where(Submission.institution_id == current_user.institution_id)

    result = await db.execute(stmt)
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    evaluation_out = None
    if submission.evaluation:
        ev = submission.evaluation
        evaluation_out = EvaluationOut(
            id=ev.id,
            submission_id=ev.submission_id,
            scores=ev.scores,
            overall_score=float(ev.overall_score),
            feedback=ev.feedback,
            recommendations=ev.recommendations,
            tokens_used=ev.tokens_used,
            evaluated_at=ev.evaluated_at,
        )

    return SubmissionDetailOut(
        id=submission.id,
        assignment_id=submission.assignment_id,
        assignment_title=submission.assignment.title if submission.assignment else "",
        teacher_id=submission.teacher_id,
        status=submission.status,
        s3_key=submission.s3_key,
        file_mime=submission.file_mime,
        score_json=submission.score_json,
        evaluation=evaluation_out,
        created_at=submission.created_at,
        updated_at=submission.updated_at,
    )


# ─── Admin SSE Status Endpoint ────────────────────────────────────────────────

@router.get("/{submission_id}/status")
async def get_submission_status(
    submission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lightweight polling endpoint for submission evaluation status."""
    stmt = select(Submission.status, Submission.score_json).where(
        Submission.id == submission_id
    )
    if current_user.role == "Teacher":
        stmt = stmt.where(Submission.teacher_id == current_user.id)
    else:
        stmt = stmt.where(Submission.institution_id == current_user.institution_id)

    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")

    return {"status": row[0], "score_json": row[1]}
