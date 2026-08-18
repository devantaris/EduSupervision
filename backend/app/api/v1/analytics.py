"""
Phase 7: Analytics & Performance Reporting API

Provides aggregated performance data for:
  - InstitutionAdmin: institution-level dashboards
  - SuperAdmin/Ministry: cross-institution comparative view
  - Teachers: personal CPD progression metrics

All queries are scoped to institution_id for non-SuperAdmin roles.
Results are cached in memory (5-minute TTL) to handle repeated dashboard loads.
"""

import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from functools import lru_cache
import time

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, cast, Float, Integer, text, and_
from sqlalchemy.orm import joinedload

from app.api.deps import get_db, get_current_user, require_role
from app.models.submission import Submission
from app.models.evaluation import AIEvaluation
from app.models.assignment import Assignment
from app.models.user import User
from app.models.institution import Institution
from app.models.material_progress import MaterialProgress
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Response Schemas ─────────────────────────────────────────────────────────

class ScoreDistribution(BaseModel):
    range_label: str   # e.g. "90-100", "80-89"
    count: int
    percentage: float


class CriterionPerformance(BaseModel):
    criterion: str
    avg_score: float
    submission_count: int


class TeacherSummary(BaseModel):
    teacher_id: str
    display_name: str
    email: str
    total_submissions: int
    evaluated_submissions: int
    average_score: Optional[float]
    latest_score: Optional[float]
    latest_submission_date: Optional[datetime]
    cpd_stage: str
    has_plagiarism_flag: bool


class AssignmentSummary(BaseModel):
    assignment_id: str
    title: str
    submission_count: int
    evaluated_count: int
    average_score: Optional[float]
    completion_rate: float
    due_date: Optional[datetime]


class InstitutionAnalytics(BaseModel):
    institution_id: str
    institution_name: str
    total_teachers: int
    active_teachers: int
    total_submissions: int
    evaluated_submissions: int
    pending_submissions: int
    failed_submissions: int
    average_score: Optional[float]
    score_distribution: List[ScoreDistribution]
    top_criterion_gaps: List[CriterionPerformance]
    plagiarism_flag_count: int
    completion_rate: float
    teacher_summaries: List[TeacherSummary]
    assignment_summaries: List[AssignmentSummary]
    generated_at: datetime


class MinistryOverview(BaseModel):
    total_institutions: int
    total_teachers: int
    total_evaluations: int
    platform_average_score: Optional[float]
    institutions: List[dict]
    generated_at: datetime


class TeacherPersonalAnalytics(BaseModel):
    teacher_id: str
    total_submissions: int
    evaluated_submissions: int
    average_score: Optional[float]
    score_trend: List[dict]
    cpd_stage: str
    cpd_stage_progress: float
    criterion_breakdown: List[dict]
    training_completion: float
    recommendations: List[str]
    generated_at: datetime


# ─── CPD Stage Calculator ─────────────────────────────────────────────────────

def _compute_cpd_stage(avg_score: Optional[float], total_evaluated: int) -> str:
    """
    Map average score + evaluated count to CPD certification stage.
    Stage thresholds are intentional defaults — configurable in future.
    """
    if avg_score is None or total_evaluated == 0:
        return "Foundation"
    if avg_score >= 90 and total_evaluated >= 5:
        return "Expert"
    if avg_score >= 80 and total_evaluated >= 3:
        return "Advanced"
    if avg_score >= 70 and total_evaluated >= 2:
        return "Practice"
    return "Foundation"


def _cpd_stage_progress(avg_score: Optional[float], stage: str) -> float:
    """
    Returns 0.0–1.0 progress within the current CPD stage.
    """
    thresholds = {"Foundation": (0, 70), "Practice": (70, 80), "Advanced": (80, 90), "Expert": (90, 100)}
    if avg_score is None:
        return 0.0
    lo, hi = thresholds.get(stage, (0, 100))
    return min(1.0, max(0.0, (avg_score - lo) / max(1, hi - lo)))


# ─── Institution Analytics Endpoint ──────────────────────────────────────────

@router.get("/institution", response_model=InstitutionAnalytics)
async def get_institution_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["InstitutionAdmin", "SuperAdmin"])),
    institution_id: Optional[uuid.UUID] = Query(None, description="SuperAdmin: override institution"),
):
    """
    Full analytics dashboard for an institution.
    InstitutionAdmin: scoped to their institution automatically.
    SuperAdmin: can pass institution_id to inspect any institution.
    """
    inst_id = institution_id or current_user.institution_id
    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID required")

    # ── Fetch institution ──
    inst_stmt = select(Institution).where(Institution.id == inst_id)
    inst_result = await db.execute(inst_stmt)
    institution = inst_result.scalars().first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    # ── Teacher counts ──
    teacher_stmt = select(func.count(User.id)).where(
        User.institution_id == inst_id,
        User.role == "Teacher",
    )
    total_teachers = (await db.execute(teacher_stmt)).scalar() or 0

    # ── Submission aggregates ──
    sub_agg = await db.execute(
        select(
            func.count(Submission.id).label("total"),
            func.sum(
                cast((Submission.status == "evaluated").cast(Integer), Integer)
            ).label("evaluated"),
            func.sum(
                cast((Submission.status == "pending").cast(Integer), Integer)
            ).label("pending"),
            func.sum(
                cast((Submission.status == "failed").cast(Integer), Integer)
            ).label("failed"),
        ).where(Submission.institution_id == inst_id)
    )
    agg_row = sub_agg.first()
    total_subs = int(agg_row.total or 0)
    evaluated_subs = int(agg_row.evaluated or 0)
    pending_subs = int(agg_row.pending or 0)
    failed_subs = int(agg_row.failed or 0)

    # ── Average score ──
    avg_stmt = await db.execute(
        select(func.avg(AIEvaluation.overall_score))
        .join(Submission, AIEvaluation.submission_id == Submission.id)
        .where(Submission.institution_id == inst_id)
    )
    avg_score_raw = avg_stmt.scalar()
    avg_score = float(avg_score_raw) if avg_score_raw is not None else None

    # ── Score distribution (10-point buckets) ──
    dist_sql = text("""
        SELECT
            width_bucket(ae.overall_score, 0, 100, 10) AS bucket,
            COUNT(*) AS cnt
        FROM ai_evaluations ae
        JOIN submissions s ON ae.submission_id = s.id
        WHERE s.institution_id = :inst_id
        GROUP BY bucket
        ORDER BY bucket
    """)
    dist_result = await db.execute(dist_sql, {"inst_id": str(inst_id)})
    dist_rows = dist_result.fetchall()

    bucket_labels = [
        "0-9", "10-19", "20-29", "30-39", "40-49",
        "50-59", "60-69", "70-79", "80-89", "90-100",
    ]
    bucket_map = {row[0]: int(row[1]) for row in dist_rows}
    score_distribution = []
    for i in range(1, 11):
        cnt = bucket_map.get(i, 0)
        pct = (cnt / max(1, evaluated_subs)) * 100
        score_distribution.append(ScoreDistribution(
            range_label=bucket_labels[i - 1],
            count=cnt,
            percentage=round(pct, 1),
        ))

    # ── Criterion gap analysis (lowest-scoring criteria) ──
    crit_sql = text("""
        SELECT
            c->>'criterion' AS criterion,
            AVG(CAST(c->>'score_assigned' AS FLOAT)) AS avg_score,
            COUNT(*) AS cnt
        FROM ai_evaluations ae
        JOIN submissions s ON ae.submission_id = s.id,
        LATERAL jsonb_array_elements(ae.scores::jsonb) AS c
        WHERE s.institution_id = :inst_id
        GROUP BY criterion
        ORDER BY avg_score ASC
        LIMIT 5
    """)
    crit_result = await db.execute(crit_sql, {"inst_id": str(inst_id)})
    top_criterion_gaps = [
        CriterionPerformance(
            criterion=row[0] or "Unknown",
            avg_score=round(float(row[1]), 1),
            submission_count=int(row[2]),
        )
        for row in crit_result.fetchall()
    ]

    # ── Plagiarism flag count ──
    flag_sql = text("""
        SELECT COUNT(*) FROM submissions
        WHERE institution_id = :inst_id
        AND score_json->>'has_plagiarism_flag' = 'true'
    """)
    flag_result = await db.execute(flag_sql, {"inst_id": str(inst_id)})
    plagiarism_count = int(flag_result.scalar() or 0)

    # ── Teacher summaries ──
    teachers_stmt = (
        select(User)
        .where(User.institution_id == inst_id, User.role == "Teacher")
        .options(joinedload(User.submissions))
        .order_by(User.created_at.desc())
        .limit(50)
    )
    teachers_result = await db.execute(teachers_stmt)
    teachers = teachers_result.unique().scalars().all()

    teacher_summaries = []
    for t in teachers:
        t_subs = [s for s in t.submissions]
        evaluated = [s for s in t_subs if s.status == "evaluated"]
        scores = [
            s.score_json.get("overall_score", 0)
            for s in evaluated
            if s.score_json and s.score_json.get("overall_score") is not None
        ]
        avg = round(sum(scores) / len(scores), 1) if scores else None
        latest_score = scores[0] if scores else None
        latest_date = max((s.created_at for s in t_subs), default=None)
        has_flag = any(
            s.score_json and s.score_json.get("has_plagiarism_flag")
            for s in evaluated
        )
        cpd = _compute_cpd_stage(avg, len(evaluated))
        display = getattr(t, "full_name", None) or t.email.split("@")[0]
        teacher_summaries.append(TeacherSummary(
            teacher_id=str(t.id),
            display_name=display,
            email=t.email,
            total_submissions=len(t_subs),
            evaluated_submissions=len(evaluated),
            average_score=avg,
            latest_score=latest_score,
            latest_submission_date=latest_date,
            cpd_stage=cpd,
            has_plagiarism_flag=has_flag,
        ))

    # Sort by average score desc (None last)
    teacher_summaries.sort(key=lambda x: x.average_score or -1, reverse=True)

    # ── Assignment summaries ──
    assignments_stmt = (
        select(Assignment)
        .where(Assignment.institution_id == inst_id)
        .order_by(Assignment.created_at.desc())
        .limit(20)
    )
    assignments_result = await db.execute(assignments_stmt)
    assignments = assignments_result.scalars().all()

    assignment_summaries = []
    for a in assignments:
        a_sub_stmt = select(
            func.count(Submission.id).label("total"),
            func.sum(cast((Submission.status == "evaluated").cast(Integer), Integer)).label("eval"),
        ).where(Submission.assignment_id == a.id)
        a_sub_result = await db.execute(a_sub_stmt)
        a_row = a_sub_result.first()
        a_total = int(a_row.total or 0)
        a_eval = int(a_row.eval or 0)

        a_avg_stmt = await db.execute(
            select(func.avg(AIEvaluation.overall_score))
            .join(Submission, AIEvaluation.submission_id == Submission.id)
            .where(Submission.assignment_id == a.id)
        )
        a_avg = float(a_avg_stmt.scalar() or 0) or None

        assignment_summaries.append(AssignmentSummary(
            assignment_id=str(a.id),
            title=a.title,
            submission_count=a_total,
            evaluated_count=a_eval,
            average_score=round(a_avg, 1) if a_avg else None,
            completion_rate=round((a_eval / max(1, total_teachers)) * 100, 1),
            due_date=a.due_date,
        ))

    completion_rate = round((evaluated_subs / max(1, total_subs)) * 100, 1) if total_subs else 0.0

    return InstitutionAnalytics(
        institution_id=str(inst_id),
        institution_name=institution.name,
        total_teachers=total_teachers,
        active_teachers=len([t for t in teacher_summaries if t.total_submissions > 0]),
        total_submissions=total_subs,
        evaluated_submissions=evaluated_subs,
        pending_submissions=pending_subs,
        failed_submissions=failed_subs,
        average_score=round(avg_score, 1) if avg_score is not None else None,
        score_distribution=score_distribution,
        top_criterion_gaps=top_criterion_gaps,
        plagiarism_flag_count=plagiarism_count,
        completion_rate=completion_rate,
        teacher_summaries=teacher_summaries,
        assignment_summaries=assignment_summaries,
        generated_at=datetime.utcnow(),
    )


# ─── Ministry Cross-Institution Overview ──────────────────────────────────────

@router.get("/ministry", response_model=MinistryOverview)
async def get_ministry_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SuperAdmin"])),
):
    """
    Cross-institution overview for Ministry supervisors.
    Returns per-institution performance summary for comparative analysis.
    Only accessible to SuperAdmin role.
    """
    # All institutions
    inst_result = await db.execute(select(Institution).order_by(Institution.name))
    institutions = inst_result.scalars().all()

    # Platform-wide aggregates
    plat_avg = await db.execute(select(func.avg(AIEvaluation.overall_score)))
    platform_avg = float(plat_avg.scalar() or 0) or None

    total_teachers_q = await db.execute(
        select(func.count(User.id)).where(User.role == "Teacher")
    )
    total_teachers = int(total_teachers_q.scalar() or 0)

    total_evals_q = await db.execute(select(func.count(AIEvaluation.id)))
    total_evals = int(total_evals_q.scalar() or 0)

    # Per-institution rollup
    inst_summaries = []
    for inst in institutions:
        t_count = await db.execute(
            select(func.count(User.id)).where(
                User.institution_id == inst.id,
                User.role == "Teacher",
            )
        )
        sub_count = await db.execute(
            select(func.count(Submission.id)).where(
                Submission.institution_id == inst.id,
                Submission.status == "evaluated",
            )
        )
        inst_avg = await db.execute(
            select(func.avg(AIEvaluation.overall_score))
            .join(Submission, AIEvaluation.submission_id == Submission.id)
            .where(Submission.institution_id == inst.id)
        )
        inst_avg_val = float(inst_avg.scalar() or 0) or None

        inst_summaries.append({
            "institution_id": str(inst.id),
            "name": inst.name,
            "teacher_count": int(t_count.scalar() or 0),
            "evaluated_submissions": int(sub_count.scalar() or 0),
            "average_score": round(inst_avg_val, 1) if inst_avg_val else None,
        })

    # Sort by average score desc
    inst_summaries.sort(key=lambda x: x["average_score"] or 0, reverse=True)

    return MinistryOverview(
        total_institutions=len(institutions),
        total_teachers=total_teachers,
        total_evaluations=total_evals,
        platform_average_score=round(platform_avg, 1) if platform_avg else None,
        institutions=inst_summaries,
        generated_at=datetime.utcnow(),
    )


# ─── Teacher Personal Analytics ───────────────────────────────────────────────

@router.get("/me", response_model=TeacherPersonalAnalytics)
@router.get("/teacher/me", response_model=TeacherPersonalAnalytics)
async def get_my_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["Teacher"])),
):
    """
    Personal performance analytics for the authenticated teacher.
    Score trend over time, CPD progression, and training completion.
    """
    teacher_id = current_user.id

    # All submissions (evaluated ones)
    subs_result = await db.execute(
        select(Submission)
        .where(Submission.teacher_id == teacher_id)
        .options(joinedload(Submission.evaluation))
        .order_by(Submission.created_at.asc())
    )
    subs = subs_result.unique().scalars().all()

    evaluated = [s for s in subs if s.status == "evaluated" and s.evaluation]
    scores = [float(s.evaluation.overall_score) for s in evaluated]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    # Score trend (chronological)
    score_trend = [
        {
            "date": s.created_at.isoformat(),
            "score": float(s.evaluation.overall_score),
            "assignment_id": str(s.assignment_id),
        }
        for s in evaluated
    ]

    # CPD stage
    cpd_stage = _compute_cpd_stage(avg_score, len(evaluated))
    cpd_progress = _cpd_stage_progress(avg_score, cpd_stage)

    # Criterion breakdown (average per criterion across all evaluations)
    crit_map: dict[str, list[float]] = {}
    for s in evaluated:
        for score_entry in s.evaluation.scores:
            crit = score_entry.get("criterion", "Unknown")
            val = float(score_entry.get("score_assigned", 0))
            crit_map.setdefault(crit, []).append(val)

    criterion_breakdown = [
        {
            "criterion": crit,
            "average": round(sum(vals) / len(vals), 1),
            "count": len(vals),
        }
        for crit, vals in sorted(crit_map.items(), key=lambda x: sum(x[1]) / len(x[1]))
    ]

    # Training completion
    training_q = await db.execute(
        select(func.count(MaterialProgress.id)).where(
            MaterialProgress.user_id == teacher_id,
            MaterialProgress.completed == True,
        )
    )
    total_materials_q = await db.execute(
        select(func.count()).select_from(
            select(MaterialProgress.material_id).where(
                MaterialProgress.user_id == teacher_id
            ).subquery()
        )
    )
    completed_count = int(training_q.scalar() or 0)
    total_count = max(1, int(total_materials_q.scalar() or 1))
    training_completion = round((completed_count / total_count) * 100, 1)

    # Top recommendations from latest evaluation
    recommendations = []
    if evaluated:
        latest = evaluated[-1]
        for rec in (latest.evaluation.recommendations or [])[:3]:
            recommendations.append(rec.get("action", ""))

    return TeacherPersonalAnalytics(
        teacher_id=str(teacher_id),
        total_submissions=len(subs),
        evaluated_submissions=len(evaluated),
        average_score=avg_score,
        score_trend=score_trend,
        cpd_stage=cpd_stage,
        cpd_stage_progress=round(cpd_progress, 3),
        criterion_breakdown=criterion_breakdown,
        training_completion=training_completion,
        recommendations=recommendations,
        generated_at=datetime.utcnow(),
    )


# ─── Teacher Detail (Admin View) ──────────────────────────────────────────────

@router.get("/teacher/{teacher_id}", response_model=TeacherPersonalAnalytics)
async def get_teacher_analytics(
    teacher_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["InstitutionAdmin", "SuperAdmin"])),
):
    """Admin view of individual teacher analytics."""
    # Verify teacher belongs to same institution (for InstitutionAdmin)
    t_stmt = select(User).where(User.id == teacher_id)
    t_result = await db.execute(t_stmt)
    teacher = t_result.scalars().first()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if (current_user.role == "InstitutionAdmin"
            and teacher.institution_id != current_user.institution_id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Reuse the same logic — temporarily set teacher's id
    subs_result = await db.execute(
        select(Submission)
        .where(Submission.teacher_id == teacher_id)
        .options(joinedload(Submission.evaluation))
        .order_by(Submission.created_at.asc())
    )
    subs = subs_result.unique().scalars().all()

    evaluated = [s for s in subs if s.status == "evaluated" and s.evaluation]
    scores = [float(s.evaluation.overall_score) for s in evaluated]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    score_trend = [
        {
            "date": s.created_at.isoformat(),
            "score": float(s.evaluation.overall_score),
            "assignment_id": str(s.assignment_id),
        }
        for s in evaluated
    ]

    cpd_stage = _compute_cpd_stage(avg_score, len(evaluated))
    cpd_progress = _cpd_stage_progress(avg_score, cpd_stage)

    crit_map: dict[str, list[float]] = {}
    for s in evaluated:
        for score_entry in s.evaluation.scores:
            crit = score_entry.get("criterion", "Unknown")
            val = float(score_entry.get("score_assigned", 0))
            crit_map.setdefault(crit, []).append(val)

    criterion_breakdown = [
        {
            "criterion": crit,
            "average": round(sum(vals) / len(vals), 1),
            "count": len(vals),
        }
        for crit, vals in sorted(crit_map.items(), key=lambda x: sum(x[1]) / len(x[1]))
    ]

    training_q = await db.execute(
        select(func.count(MaterialProgress.id)).where(
            MaterialProgress.user_id == teacher_id,
            MaterialProgress.completed == True,
        )
    )
    completed_count = int(training_q.scalar() or 0)
    training_completion = min(100.0, float(completed_count) * 25)  # rough heuristic

    recommendations = []
    if evaluated:
        latest = evaluated[-1]
        for rec in (latest.evaluation.recommendations or [])[:3]:
            recommendations.append(rec.get("action", ""))

    return TeacherPersonalAnalytics(
        teacher_id=str(teacher_id),
        total_submissions=len(subs),
        evaluated_submissions=len(evaluated),
        average_score=avg_score,
        score_trend=score_trend,
        cpd_stage=cpd_stage,
        cpd_stage_progress=round(cpd_progress, 3),
        criterion_breakdown=criterion_breakdown,
        training_completion=training_completion,
        recommendations=recommendations,
        generated_at=datetime.utcnow(),
    )
