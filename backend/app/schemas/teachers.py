import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class InstitutionCreate(BaseModel):
    name: str
    code: str
    admin_email: EmailStr


class InstitutionOut(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True


class TeacherInvite(BaseModel):
    emails: List[EmailStr]


class TeacherRegister(BaseModel):
    first_name: str
    last_name: str
    password: str
    employee_id: Optional[str] = None


class TeacherOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    status: str
    first_name: str
    last_name: str
    employee_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TeacherListResponse(BaseModel):
    teachers: List[TeacherOut]
    total: int
