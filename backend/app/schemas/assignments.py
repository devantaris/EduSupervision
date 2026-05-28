import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Rubric Criterion ────────────────────────────────────────────────────────

class RubricCriterion(BaseModel):
    id: str
    label: str
    weight: float = Field(..., ge=0, le=100)
    description: Optional[str] = None


# ─── Assignment Schemas ───────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="")
    due_date: Optional[datetime] = None
    max_score: int = Field(default=100, ge=1, le=1000)
    rubric_criteria: List[RubricCriterion] = Field(default_factory=list)


class AssignmentOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    due_date: Optional[datetime]
    max_score: int
    rubric_criteria: List[dict]
    created_at: datetime
    status: str = "active"

    model_config = {"from_attributes": True}


class AssignmentListResponse(BaseModel):
    assignments: List[AssignmentOut]
    total: int


# ─── Submission Schemas ───────────────────────────────────────────────────────

class SubmissionPresignRequest(BaseModel):
    filename: str
    content_type: str
    assignment_id: uuid.UUID


class SubmissionPresignResponse(BaseModel):
    upload_url: str
    s3_key: str
    is_mock: bool = False


class SubmissionConfirmRequest(BaseModel):
    s3_key: str
    file_mime: str
    assignment_id: uuid.UUID


class SubmissionOut(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID
    teacher_id: uuid.UUID
    status: str
    s3_key: str
    file_mime: str
    score_json: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubmissionListResponse(BaseModel):
    submissions: List[SubmissionOut]
    total: int


# ─── Evaluation Score Detail ──────────────────────────────────────────────────

class CriterionScore(BaseModel):
    criterion: str
    score_assigned: float
    justification: str
    evidence_quote: str


class Recommendation(BaseModel):
    area: str
    action: str
    priority: str  # "high" | "medium" | "low"


class EvaluationOut(BaseModel):
    id: uuid.UUID
    submission_id: uuid.UUID
    scores: List[dict]
    overall_score: float
    feedback: str
    recommendations: List[dict]
    tokens_used: int
    evaluated_at: datetime

    model_config = {"from_attributes": True}


class SubmissionDetailOut(BaseModel):
    """Full submission detail including evaluation results."""
    id: uuid.UUID
    assignment_id: uuid.UUID
    assignment_title: str
    teacher_id: uuid.UUID
    status: str
    s3_key: str
    file_mime: str
    score_json: Optional[dict] = None
    evaluation: Optional[EvaluationOut] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
