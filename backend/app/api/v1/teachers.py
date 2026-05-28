import uuid
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy import func

from app.api.deps import get_db, require_role, get_current_user
from app.core.config import settings
from app.core.security import get_password_hash, create_jwt_token, verify_jwt_token
from app.models.institution import Institution
from app.models.user import User
from app.models.profile import Profile
from app.schemas.teachers import (
    InstitutionCreate, InstitutionOut,
    TeacherInvite, TeacherRegister,
    TeacherOut, TeacherListResponse
)
from app.tasks.mail import send_onboarding_email, send_admin_credentials_email

router = APIRouter()


@router.post("/institutions", response_model=InstitutionOut, status_code=status.HTTP_201_CREATED)
async def create_institution(
    payload: InstitutionCreate,
    db: AsyncSession = Depends(get_db),
    # Only platform-wide SuperAdmin can provision institutions
    current_user: User = Depends(require_role(["SuperAdmin"]))
):
    """
    SuperAdmin endpoint to provision a new institution and its primary administrator.
    """
    # 1. Verify institution code is unique
    stmt = select(Institution).where(Institution.code == payload.code)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Institution code '{payload.code}' is already registered",
        )

    # 2. Verify admin email is unique
    stmt = select(User).where(User.email == payload.admin_email)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{payload.admin_email}' is already associated with an account",
        )

    # 3. Create Institution
    new_institution = Institution(
        name=payload.name,
        code=payload.code
    )
    db.add(new_institution)
    await db.flush()  # Populates new_institution.id

    # 4. Create primary Administrator Account
    temp_password = f"TempPass{uuid.uuid4().hex[:6]}!"
    hashed_pwd = get_password_hash(temp_password)

    new_admin = User(
        email=payload.admin_email,
        password_hash=hashed_pwd,
        role="InstitutionAdmin",
        status="active",
        institution_id=new_institution.id
    )
    db.add(new_admin)
    await db.flush()

    # 5. Create default Profile for Administrator
    admin_profile = Profile(
        user_id=new_admin.id,
        first_name="Institution",
        last_name="Administrator"
    )
    db.add(admin_profile)

    # 6. Trigger credentials notification email via Celery background task
    send_admin_credentials_email.delay(payload.admin_email, temp_password)

    return new_institution


@router.post("/teachers/invite", status_code=status.HTTP_200_OK)
async def invite_teachers(
    payload: TeacherInvite,
    db: AsyncSession = Depends(get_db),
    # Only InstitutionAdmin can invite teachers to their institution
    current_user: User = Depends(require_role(["InstitutionAdmin"]))
):
    """
    InstitutionAdmin endpoint to bulk invite multiple teachers via email.
    Creates pending user shells and queues onboarding email links.
    """
    institution_id = current_user.institution_id
    if not institution_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user is not scoped to an institution",
        )

    invited_count = 0
    skipped_count = 0

    for email in payload.emails:
        # Check if email is already in system
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        existing_user = result.scalars().first()

        if existing_user:
            skipped_count += 1
            continue

        # Create temporary user shell
        new_teacher = User(
            email=email,
            password_hash="INVITED_PLACEHOLDER_TEMP_JWT",
            role="Teacher",
            status="pending_verification",
            institution_id=institution_id
        )
        db.add(new_teacher)
        await db.flush()

        # Generate unique onboarding token (72-hour expiration)
        invite_delta = timedelta(hours=72)
        invite_token = create_jwt_token(
            subject=new_teacher.id,
            role="Teacher",
            institution_id=institution_id,
            expires_delta=invite_delta,
            token_type="invite"
        )

        # Build activation link URL (Next.js route)
        frontend_url = settings.ENVIRONMENT == "production" and "https://edusupervision.app" or "http://localhost:3000"
        onboarding_link = f"{frontend_url}/register/{invite_token}"

        # Dispatch welcome/activation email asynchronously via Celery
        send_onboarding_email.delay(email, onboarding_link)
        invited_count += 1

    return {
        "status": "success",
        "detail": f"Successfully invited {invited_count} teachers. Skipped {skipped_count} existing accounts."
    }


@router.post("/teachers/register/{token}", response_model=TeacherOut)
async def register_invited_teacher(
    token: str,
    payload: TeacherRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Public registration endpoint. Activates user account and populates profile using an invite token.
    """
    # 1. Decode and verify invite token signature and type
    claims = verify_jwt_token(token)
    if not claims or claims.get("type") != "invite":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or corrupted registration link",
        )

    user_id = claims.get("sub")

    # 2. Fetch the corresponding User shell
    stmt = select(User).where(User.id == user_id).options(joinedload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invited user shell not found",
        )

    if user.status == "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account has already been activated",
        )

    # 3. Update password and activate account
    user.password_hash = get_password_hash(payload.password)
    user.status = "active"

    # 4. Create or update profile details
    if user.profile:
        user.profile.first_name = payload.first_name
        user.profile.last_name = payload.last_name
        user.profile.employee_id = payload.employee_id
    else:
        new_profile = Profile(
            user_id=user.id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            employee_id=payload.employee_id
        )
        db.add(new_profile)

    await db.flush()

    # Build response Out schema
    profile_first = payload.first_name
    profile_last = payload.last_name
    
    return TeacherOut(
        id=user.id,
        email=user.email,
        role=user.role,
        status=user.status,
        first_name=profile_first,
        last_name=profile_last,
        employee_id=payload.employee_id,
        created_at=user.created_at
    )


@router.get("/teachers", response_model=TeacherListResponse)
async def list_teachers(
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    # Only InstitutionAdmin can retrieve the teacher roster
    current_user: User = Depends(require_role(["InstitutionAdmin"]))
):
    """
    InstitutionAdmin endpoint to retrieve a list of all teachers registered in their institution.
    """
    institution_id = current_user.institution_id
    if not institution_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user is not scoped to an institution",
        )

    offset = (page - 1) * limit

    # Query matching teachers with profiles joined
    stmt = (
        select(User)
        .where(User.role == "Teacher", User.institution_id == institution_id)
        .options(joinedload(User.profile))
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    teachers = result.scalars().all()

    # Query total count for pagination
    count_stmt = (
        select(func.count(User.id))
        .where(User.role == "Teacher", User.institution_id == institution_id)
    )
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    # Build response Out schemas
    teachers_out = []
    for t in teachers:
        first_name = t.profile.first_name if t.profile else ""
        last_name = t.profile.last_name if t.profile else ""
        employee_id = t.profile.employee_id if t.profile else None
        
        teachers_out.append(
            TeacherOut(
                id=t.id,
                email=t.email,
                role=t.role,
                status=t.status,
                first_name=first_name,
                last_name=last_name,
                employee_id=employee_id,
                created_at=t.created_at
            )
        )

    return TeacherListResponse(teachers=teachers_out, total=total)

