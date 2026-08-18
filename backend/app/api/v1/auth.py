from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from app.api.deps import get_db, get_redis
from app.core.config import settings
from app.core.security import verify_password, create_jwt_token, verify_jwt_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, MessageResponse, UserOut

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates user credentials and returns an RS256 access/refresh token pair.
    """
    # Fetch user along with profile details
    stmt = select(User).where(User.email == credentials.email).options(joinedload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended by administrator",
        )

    # Calculate token durations
    access_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    # Issue token pair
    access_token = create_jwt_token(
        subject=user.id,
        role=user.role,
        institution_id=user.institution_id,
        expires_delta=access_delta,
        token_type="access",
    )
    refresh_token = create_jwt_token(
        subject=user.id,
        role=user.role,
        institution_id=user.institution_id,
        expires_delta=refresh_delta,
        token_type="refresh",
    )

    # Get first/last name safely from profile
    first_name = user.profile.first_name if user.profile else ""
    last_name = user.profile.last_name if user.profile else ""

    user_out = UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        first_name=first_name,
        last_name=last_name,
        institution_id=user.institution_id,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_out,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis)
):
    """
    Validates a refresh token, revokes it to prevent replay attacks, and issues a new pair.
    """
    token = payload.refresh_token

    # 1. Verify JWT signature & structure
    claims = verify_jwt_token(token)
    if not claims or claims.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # 2. Check Redis denylist to prevent replay attacks (graceful fallback if Redis is offline)
    try:
        is_revoked = await redis.get(f"revoked_token:{token}")
        if is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )
    except HTTPException:
        raise
    except Exception:
        pass

    # 3. Retrieve user from DB
    user_id = claims.get("sub")
    stmt = select(User).where(User.id == user_id).options(joinedload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or suspended",
        )

    # 4. Invalidate old refresh token (Store in Redis with remaining expiration time)
    try:
        exp_timestamp = claims.get("exp")
        now_timestamp = int(datetime.now(timezone.utc).timestamp())
        remaining_seconds = exp_timestamp - now_timestamp
        if remaining_seconds > 0:
            await redis.setex(f"revoked_token:{token}", remaining_seconds, "1")
    except Exception:
        pass

    # 5. Generate new pair
    access_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    new_access = create_jwt_token(
        subject=user.id,
        role=user.role,
        institution_id=user.institution_id,
        expires_delta=access_delta,
        token_type="access",
    )
    new_refresh = create_jwt_token(
        subject=user.id,
        role=user.role,
        institution_id=user.institution_id,
        expires_delta=refresh_delta,
        token_type="refresh",
    )

    first_name = user.profile.first_name if user.profile else ""
    last_name = user.profile.last_name if user.profile else ""

    user_out = UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        first_name=first_name,
        last_name=last_name,
        institution_id=user.institution_id,
    )

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_out,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: RefreshRequest,
    redis: aioredis.Redis = Depends(get_redis)
):
    """
    Revokes the refresh token by placing it in the Redis denylist.
    """
    token = payload.refresh_token

    claims = verify_jwt_token(token)
    if claims and claims.get("type") == "refresh":
        exp_timestamp = claims.get("exp")
        now_timestamp = int(datetime.now(timezone.utc).timestamp())
        remaining_seconds = exp_timestamp - now_timestamp
        if remaining_seconds > 0:
            await redis.setex(f"revoked_token:{token}", remaining_seconds, "1")

    return MessageResponse(message="Successfully logged out")
