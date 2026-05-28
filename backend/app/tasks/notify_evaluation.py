"""
Evaluation completion email notification task.
Dispatched by Stage 6 of the AI evaluation pipeline.

In development: prints a formatted email mock to stdout.
In production: replace with SendGrid or AWS SES call.
"""
import logging
from app.core.celery import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.notify_evaluation.send_evaluation_email",
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    time_limit=30,
    queue="notifications",
)
def send_evaluation_email(
    teacher_email: str,
    teacher_name: str,
    assignment_title: str,
    overall_score: float,
    submission_id: str,
) -> str:
    """
    Notify teacher that their evaluation is complete.
    
    Future: replace print block with:
      import sendgrid
      sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
      ...
    """
    score_label = (
        "Outstanding" if overall_score >= 90
        else "Proficient" if overall_score >= 75
        else "Developing" if overall_score >= 60
        else "Needs Improvement"
    )

    email_body = f"""
    ==================================================
    OUTBOUND EMAIL (MOCK DISPATCH)
    To: {teacher_email}
    Subject: Your submission has been evaluated — EduSupervision

    Dear {teacher_name},

    Your submission for "{assignment_title}" has been evaluated by our AI assessment engine.

    Overall Score: {overall_score:.1f}/100 ({score_label})

    To view your detailed evaluation report including criterion-by-criterion
    scores, justifications, evidence quotes, and professional development
    recommendations, please log in to your EduSupervision portal:

    http://localhost:3000/teacher/assignments/{submission_id}

    This is an automated notification. Please do not reply to this email.

    The EduSupervision Team
    ==================================================
    """
    print(email_body)
    logger.info(f"Evaluation email dispatched to {teacher_email} (score: {overall_score:.1f})")
    return f"Email sent to {teacher_email}"


@celery_app.task(
    name="app.tasks.notify_evaluation.send_plagiarism_flag_alert",
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    queue="notifications",
)
def send_plagiarism_flag_alert(
    admin_email: str,
    institution_name: str,
    submission_id: str,
    flag_count: int,
) -> str:
    """
    Alert institution admin when a plagiarism similarity flag is raised.
    All flags require human review before any action is taken.
    """
    email_body = f"""
    ==================================================
    OUTBOUND EMAIL (MOCK DISPATCH)
    To: {admin_email}
    Subject: ⚠ Similarity Flag Raised — {institution_name}

    A submission in your institution has been flagged for similarity
    review by the AI plagiarism detection system.

    Institution: {institution_name}
    Submission ID: {submission_id}
    Similarity flags raised: {flag_count}

    IMPORTANT: These flags are for human review only.
    The AI system never makes a final plagiarism determination.
    Please review the submission and apply your institution's
    academic integrity policy accordingly.

    Review here: http://localhost:3000/admin/evaluations/{submission_id}
    ==================================================
    """
    print(email_body)
    logger.info(f"Plagiarism flag alert sent to {admin_email} for submission {submission_id}")
    return f"Flag alert sent to {admin_email}"
