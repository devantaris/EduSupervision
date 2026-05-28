import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.models.base import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    teacher_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    institution_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    file_mime: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # status: pending, processing, evaluated, failed
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, index=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # pgvector embedding: 768 dimensions for text-embedding-004
    embedding: Mapped[list[float] | None] = mapped_column(Vector(768), nullable=True)
    
    # MinHash signature for Layer 1 plagiarism detection (integer array)
    minhash_sig: Mapped[list[int] | None] = mapped_column(ARRAY(INTEGER), nullable=True)
    
    # cached final score JSON for faster lookups
    score_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    institution: Mapped["Institution"] = relationship(
        "Institution", back_populates="submissions"
    )
    assignment: Mapped["Assignment"] = relationship(
        "Assignment", back_populates="submissions"
    )
    teacher: Mapped["User"] = relationship(
        "User", back_populates="submissions"
    )
    evaluation: Mapped["AIEvaluation" | None] = relationship(
        "AIEvaluation", back_populates="submission", uselist=False, cascade="all, delete-orphan"
    )
ColorMap = {"evaluated": "green", "processing": "blue", "pending": "yellow", "failed": "red"}
