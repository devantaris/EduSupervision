import logging
from app.core.celery import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
)
def send_onboarding_email(email: str, invite_link: str) -> str:
    """
    Asynchronous task to dispatch teacher invitation and onboarding emails.
    Uses Resend if configured, falls back to console logger in dev.
    """
    logger.info(f"Preparing onboarding invitation for {email}...")
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; background-color: #070a10; color: #f5f2eb; padding: 40px; border-radius: 8px;">
        <h2 style="color: #dfc397; font-family: Georgia, serif;">Welcome to EduSupervision</h2>
        <p>You have been invited by your institutional administrator to onboard as an educator on the EduSupervision platform.</p>
        <p style="margin: 30px 0;">
            <a href="{invite_link}" style="background-color: #991b1b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete Profile Setup</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px;">This invitation link will expire in 72 hours.</p>
    </div>
    """

    if settings.RESEND_API_KEY:
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            params = {
                "from": settings.EMAIL_FROM,
                "to": [email],
                "subject": "Welcome to EduSupervision — Complete Your Onboarding",
                "html": html_content,
            }
            resend.Emails.send(params)
            logger.info(f"Successfully sent onboarding email via Resend to {email}")
            return f"Invitation sent via Resend to {email}"
        except Exception as e:
            logger.error(f"Resend dispatch failed: {e}. Falling back to console log.")

    # Fallback / Dev Log
    email_content = f"""
    ==================================================
    OUTBOUND EMAIL TRIGGERED
    To: {email}
    Subject: Welcome to EduSupervision!
    Link: {invite_link}
    ==================================================
    """
    print(email_content)
    logger.info(f"Successfully logged onboarding email to {email}")
    return f"Invitation processed for {email}"


@celery_app.task(
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def send_admin_credentials_email(email: str, temp_password: str) -> str:
    """
    Asynchronous task to send generated credentials to new Institution Administrators.
    """
    logger.info(f"Preparing administrator account activation details for {email}...")

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background-color: #070a10; color: #f5f2eb; padding: 40px; border-radius: 8px;">
        <h2 style="color: #dfc397; font-family: Georgia, serif;">Institution Administrator Onboarding</h2>
        <p>A new educational tenant has been successfully provisioned for you on the EduSupervision platform.</p>
        <div style="background-color: #0c0f16; border: 1px solid rgba(223,195,151,0.2); padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Username:</strong> {email}</p>
            <p><strong>Temporary Password:</strong> {temp_password}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">Please sign in and change your temporary password immediately.</p>
    </div>
    """

    if settings.RESEND_API_KEY:
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            params = {
                "from": settings.EMAIL_FROM,
                "to": [email],
                "subject": "Institution Administrator Onboarding — EduSupervision",
                "html": html_content,
            }
            resend.Emails.send(params)
            logger.info(f"Successfully sent admin credentials via Resend to {email}")
            return f"Admin email sent via Resend to {email}"
        except Exception as e:
            logger.error(f"Resend dispatch failed: {e}. Falling back to console log.")

    email_content = f"""
    ==================================================
    OUTBOUND EMAIL TRIGGERED
    To: {email}
    Subject: Institution Administrator Onboarding
    Password: {temp_password}
    ==================================================
    """
    print(email_content)
    logger.info(f"Successfully logged admin credentials email to {email}")
    return f"Admin email processed for {email}"
