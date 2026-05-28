import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl


class PresignUploadRequest(BaseModel):
    filename: str = Field(..., max_length=255)
    content_type: str = Field(..., max_length=100)
    size: int = Field(..., gt=0, le=52428800)  # max 50MB


class PresignUploadResponse(BaseModel):
    upload_url: str
    s3_key: str
    is_mock: bool


class MaterialCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    type: str = Field(..., pattern="^(video|pdf|document)$")
    file_url: str = Field(..., max_length=512)


class MaterialResponse(BaseModel):
    id: uuid.UUID
    institution_id: uuid.UUID
    title: str
    description: Optional[str]
    type: str
    file_url: str
    uploader_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialProgressUpdate(BaseModel):
    position: float = Field(default=0.0, ge=0.0)
    completed: bool = Field(default=False)


class MaterialProgressResponse(BaseModel):
    material_id: uuid.UUID
    position: float
    completed: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class MaterialWithProgressResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    type: str
    file_url: str
    created_at: datetime
    progress: Optional[MaterialProgressResponse] = None

    class Config:
        from_attributes = True
