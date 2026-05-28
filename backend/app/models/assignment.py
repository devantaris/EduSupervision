import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    institution_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # rubric format: { criteria: [ { name: str, weight: float, description: str } ] }
    rubric: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    max_score: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    creator_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    institution: Mapped["Institution"] = relationship(
        "Institution", back_populates="assignments"
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User", back_populates="created_assignments"
    )
    submissions: Mapped[list["Submission"]] = relationship(
        "Submission", back_populates="assignment", cascade="all, delete-orphan"
    )
