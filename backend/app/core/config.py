import os
from typing import Optional
from pydantic import PostgresDsn, RedisDsn, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "EduSupervision"
    API_V1_STR: str = "/api/v1"

    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 6432  # Connects to PgBouncer by default
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "localpassword123"
    POSTGRES_DB: str = "edusupervision"
    DATABASE_URL: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info: ValidationInfo) -> str:
        if isinstance(v, str) and v:
            if v.startswith("postgresql://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            return v
        
        # Build asyncpg connection URL
        user = info.data.get("POSTGRES_USER")
        pwd = info.data.get("POSTGRES_PASSWORD")
        server = info.data.get("POSTGRES_SERVER")
        port = info.data.get("POSTGRES_PORT")
        db = info.data.get("POSTGRES_DB")
        return f"postgresql+asyncpg://{user}:{pwd}@{server}:{port}/{db}"

    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"

    # Asymmetric JWT RS256 Keys
    # For local development, these can fall back to placeholders, but in prod they must be valid PEMs.
    JWT_PRIVATE_KEY: str = ""
    JWT_PUBLIC_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Service-to-Service auth
    SERVICE_KEY: str = "local_development_secret_key_123"

    # AI/ML API Key
    GEMINI_API_KEY: Optional[str] = None

    # Storage Settings (AWS S3)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION_NAME: str = "us-east-1"
    S3_BUCKET_NAME: str = "edusupervision-uploads"

    # Environment
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
