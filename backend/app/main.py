from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import redis.asyncio as aioredis
from typing import Dict, Any

from app.core.config import settings
from app.core.database import get_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    docs_url="/docs",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS Middleware config
# In production, this should be locked down to the frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, str]:
    """
    Simple liveness check returning OK.
    """
    return {"status": "ok", "project": settings.PROJECT_NAME}


@app.get("/health/ready", status_code=status.HTTP_200_OK)
async def readiness_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Readiness check confirming responsiveness of database and redis connections.
    """
    db_healthy = False
    redis_healthy = False
    details = {}

    # Check Database
    try:
        await db.execute(text("SELECT 1"))
        db_healthy = True
        details["database"] = "healthy"
    except Exception as e:
        details["database"] = f"unhealthy: {str(e)}"

    # Check Redis
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL)
        await redis_client.ping()
        await redis_client.close()
        redis_healthy = True
        details["redis"] = "healthy"
    except Exception as e:
        details["redis"] = f"unhealthy: {str(e)}"

    if not db_healthy or not redis_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "unhealthy", "components": details},
        )

    return {"status": "healthy", "components": details}
