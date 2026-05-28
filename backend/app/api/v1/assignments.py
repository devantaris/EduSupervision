import uuid
import os
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.api.deps import get_db, require_role, get_current_user
from app.core.config import settings
from app.models.assignment import Assignment
from app.models.user import User
from app.schemas.assignments import (
    AssignmentCreate, AssignmentOut, AssignmentListResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Helper ───────────────────────────────────────────────────────────────────

def _assignment_to_out(a: Assignment) -> AssignmentOut:
    """Convert SQLAlchemy Assignment → AssignmentOut Pydantic model."""
    rubric_criteria = []
    if a.rubric and isinstance(a.rubric, dict):
        rubric_criteria = a.rubric.get("criteria", [])

    # Determine status based on due_date
    status = "active"
    if a.due_date:
        now = datetime.utcnow().replace(tzinfo=a.due_date.tzinfo)
        if a.due_date.replace(tzinfo=None) < datetime.utcnow():
            status = "closed"

    return AssignmentOut(
        id=a.id,
        title=a.title,
        description=a.description,
        due_date=a.due_date,
        max_score=a.max_score,
        rubric_criteria=rubric_criteria,
        created_at=a.created_at,
        status=status,
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    payload: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["InstitutionAdmin", "SuperAdmin"])),
):
    """
    InstitutionAdmin creates a rubric-graded assignment for their institution.
    Rubric criteria are stored as a JSON object: { criteria: [...] }.
    """
    institution_id = current_user.institution_id
    if not institution_id and current_user.role == "SuperAdmin":
        # SuperAdmin must select an institution; for now raise a clear error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SuperAdmin must specify an institution_id to create assignments.",
        )

    # Normalize rubric criteria from Pydantic models to dicts
    rubric_criteria_dicts = [c.model_dump() for c in payload.rubric_criteria]

    new_assignment = Assignment(
        institution_id=institution_id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        max_score=payload.max_score,
        rubric={"criteria": rubric_criteria_dicts},
        creator_id=current_user.id,
    )
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)
    return _assignment_to_out(new_assignment)


@router.get("", response_model=AssignmentListResponse)
async def list_assignments(
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all assignments for the authenticated user's institution.
    Both admins and teachers can view assignments.
    """
    institution_id = current_user.institution_id
    if not institution_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not scoped to an institution.",
        )

    offset = (page - 1) * limit

    stmt = (
        select(Assignment)
        .where(Assignment.institution_id == institution_id)
        .order_by(Assignment.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    assignments = result.scalars().all()

    count_stmt = select(func.count(Assignment.id)).where(
        Assignment.institution_id == institution_id
    )
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    return AssignmentListResponse(
        assignments=[_assignment_to_out(a) for a in assignments],
        total=total,
    )


@router.get("/{assignment_id}", response_model=AssignmentOut)
async def get_assignment(
    assignment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single assignment by ID, scoped to institution."""
    stmt = select(Assignment).where(
        Assignment.id == assignment_id,
        Assignment.institution_id == current_user.institution_id,
    )
    result = await db.execute(stmt)
    assignment = result.scalars().first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return _assignment_to_out(assignment)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["InstitutionAdmin", "SuperAdmin"])),
):
    """Delete an assignment. Cascades to all submissions and evaluations."""
    stmt = select(Assignment).where(
        Assignment.id == assignment_id,
        Assignment.institution_id == current_user.institution_id,
    )
    result = await db.execute(stmt)
    assignment = result.scalars().first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    await db.delete(assignment)
    await db.commit()
