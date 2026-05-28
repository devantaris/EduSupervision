import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # role: SuperAdmin, InstitutionAdmin, Teacher
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # status: pending_verification, active, suspended
    status: Mapped[str] = mapped_column(String(50), default="pending_verification", nullable=False)
    
    # institution_id: Mapped[uuid.UUID | None] is fine since uuid.UUID is a type, not a string forward reference.
    # However, to be consistent and fully safe, we can use Optional[uuid.UUID] here too.
    institution_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("institutions.id", ondelete="CASCADE"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    institution: Mapped[Optional["Institution"]] = relationship(
        "Institution", back_populates="users"
    )
    profile: Mapped[Optional["Profile"]] = relationship(
        "Profile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    uploaded_materials: Mapped[list["Material"]] = relationship(
        "Material", back_populates="uploader", cascade="all, delete"
    )
    created_assignments: Mapped[list["Assignment"]] = relationship(
        "Assignment", back_populates="creator", cascade="all, delete"
    )
    submissions: Mapped[list["Submission"]] = relationship(
        "Submission", back_populates="teacher", cascade="all, delete"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", back_populates="user", cascade="all, delete"
    )
