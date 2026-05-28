import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_db, get_current_user, require_role
from app.core.config import settings
from app.models.user import User
from app.models.material import Material
from app.models.institution import Institution
from app.models.material_progress import MaterialProgress
from app.schemas.materials import (
    PresignUploadRequest,
    PresignUploadResponse,
    MaterialCreate,
    MaterialResponse,
    MaterialProgressUpdate,
    MaterialProgressResponse,
    MaterialWithProgressResponse,
)

router = APIRouter()


@router.post("/presign", response_model=PresignUploadResponse)
async def generate_presigned_url(
    req: PresignUploadRequest,
    current_user: User = Depends(require_role(["InstitutionAdmin", "SuperAdmin"])),
):
    """
    Generates a direct upload URL. Falls back to a local filesystem PUT mock route
    if AWS credentials are not configured in the active environment.
    """
    uuid_filename = f"{uuid.uuid4()}_{req.filename}"

    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        # Development fallback: FastAPI local server mock endpoint
        # The frontend will execute PUT to this endpoint
        upload_url = f"http://localhost:8000{settings.API_V1_STR}/materials/upload-mock/{uuid_filename}"
        s3_key = f"http://localhost:8000/static/uploads/{uuid_filename}"
        is_mock = True
    else:
        # Production: AWS S3 presigned PUT URL
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION_NAME,
            )
            s3_key = f"institutions/{current_user.institution_id or 'admin'}/materials/{uuid_filename}"
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

    return PresignUploadResponse(
        upload_url=upload_url, s3_key=s3_key, is_mock=is_mock
    )


@router.put("/upload-mock/{filename}", include_in_schema=False)
async def upload_mock_file(filename: str, request: Request):
    """
    Mock PUT endpoint for direct file uploads in development.
    Writes binary payloads to disk under static/uploads/ subdirectory.
    """
    upload_dir = os.path.join(os.getcwd(), "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, filename)

    try:
        body = await request.body()
        if len(body) > 52428800:  # 50MB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds the 50MB restriction",
            )

        with open(file_path, "wb") as f:
            f.write(body)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write mock upload locally: {str(e)}",
        )

    return {"status": "success", "file_url": f"http://localhost:8000/static/uploads/{filename}"}


@router.post("", response_model=MaterialResponse)
async def create_material(
    payload: MaterialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["InstitutionAdmin", "SuperAdmin"])),
):
    """
    Saves metadata reference for uploaded materials. Scopes to institution tenant context.
    """
    # SuperAdmin must have an institution_id to link, raise if absent
    inst_id = current_user.institution_id
    if not inst_id and current_user.role == "SuperAdmin":
        # In multi-tenant platforms, materials must belong to a specific institution.
        # SuperAdmins must simulate a tenant scope or select a tenant.
        # Fallback: find the first institution or raise error.
        stmt = select(Institution)
        res = await db.execute(stmt)
        first_inst = res.scalars().first()
        if not first_inst:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No institutions exist in the system to attach materials to.",
            )
        inst_id = first_inst.id

    new_material = Material(
        institution_id=inst_id,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        file_url=payload.file_url,
        uploader_id=current_user.id,
    )
    db.add(new_material)
    await db.commit()
    await db.refresh(new_material)
    return new_material


@router.get("", response_model=List[MaterialWithProgressResponse])
async def list_materials(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieves list of institutional course materials, joining user completion status for teachers.
    """
    if current_user.role == "SuperAdmin":
        stmt = select(Material)
    else:
        stmt = select(Material).where(Material.institution_id == current_user.institution_id)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    materials = result.scalars().all()

    response_list = []
    for material in materials:
        progress = None
        if current_user.role == "Teacher":
            prog_stmt = select(MaterialProgress).where(
                MaterialProgress.material_id == material.id,
                MaterialProgress.user_id == current_user.id,
            )
            prog_res = await db.execute(prog_stmt)
            progress = prog_res.scalars().first()

        response_list.append(
            MaterialWithProgressResponse(
                id=material.id,
                title=material.title,
                description=material.description,
                type=material.type,
                file_url=material.file_url,
                created_at=material.created_at,
                progress=MaterialProgressResponse.from_orm(progress) if progress else None,
            )
        )
    return response_list


@router.get("/{id}", response_model=MaterialWithProgressResponse)
async def get_material(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch material details and join user progress tracker context.
    """
    stmt = select(Material).where(Material.id == id)
    if current_user.role != "SuperAdmin":
        stmt = stmt.where(Material.institution_id == current_user.institution_id)
    result = await db.execute(stmt)
    material = result.scalars().first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found",
        )

    progress = None
    if current_user.role == "Teacher":
        prog_stmt = select(MaterialProgress).where(
            MaterialProgress.material_id == material.id,
            MaterialProgress.user_id == current_user.id,
        )
        prog_res = await db.execute(prog_stmt)
        progress = prog_res.scalars().first()

    return MaterialWithProgressResponse(
        id=material.id,
        title=material.title,
        description=material.description,
        type=material.type,
        file_url=material.file_url,
        created_at=material.created_at,
        progress=MaterialProgressResponse.from_orm(progress) if progress else None,
    )


@router.post("/{id}/progress", response_model=MaterialProgressResponse)
async def update_material_progress(
    id: uuid.UUID,
    payload: MaterialProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Logs latest coordinate position or reading completion state for the authenticated Teacher.
    """
    if current_user.role != "Teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Telemetry updates restricted to Teacher role users.",
        )

    # Verify material existence
    stmt = select(Material).where(
        Material.id == id,
        Material.institution_id == current_user.institution_id,
    )
    result = await db.execute(stmt)
    material = result.scalars().first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found in institution scopes.",
        )

    # Retrieve existing progress or insert new record
    prog_stmt = select(MaterialProgress).where(
        MaterialProgress.material_id == id,
        MaterialProgress.user_id == current_user.id,
    )
    prog_res = await db.execute(prog_stmt)
    progress = prog_res.scalars().first()

    if progress:
        progress.position = payload.position
        progress.completed = progress.completed or payload.completed
    else:
        progress = MaterialProgress(
            user_id=current_user.id,
            material_id=id,
            institution_id=current_user.institution_id,
            position=payload.position,
            completed=payload.completed,
        )
        db.add(progress)

    await db.commit()
    await db.refresh(progress)
    return progress
