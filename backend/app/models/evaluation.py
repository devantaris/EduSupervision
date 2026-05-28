import uuid
from datetime import datetime
from sqlalchemy import Numeric, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base


class AIEvaluation(Base):
    __tablename__ = "ai_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    submission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("submissions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    
    # scores format: [ { criterion: str, score_assigned: float, justification: str, evidence_quote: str } ]
    scores: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)
    overall_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    feedback: Mapped[str] = mapped_column(Text, nullable=False)
    
    # recommendations format: [ { area: str, action: str, priority: str } ]
    recommendations: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)
    
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    submission: Mapped["Submission"] = relationship(
        "Submission", back_populates="evaluation"
    )
classScale = {"overall_score": 100}
