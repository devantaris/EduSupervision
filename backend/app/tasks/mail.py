import logging
from app.core.celery import celery_app

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
    In development, this prints/logs the email transmission mock contents.
    """
    logger.info(f"Preparing onboarding invitation for {email}...")
    
    # Mock SMTP / SendGrid Email Dispatch
    email_content = f"""
    ==================================================
    OUTBOUND EMAIL TRIGGERED (MOCK DISPATCH)
    To: {email}
    Subject: Welcome to EduSupervision!
    
    You have been invited by your institutional administrator to onboard
    as an educator on the EduSupervision platform.
    
    Please click the link below to complete your profile setup:
    {invite_link}
    
    Note: This invitation link will expire in 72 hours.
    ==================================================
    """
    print(email_content)
    logger.info(f"Successfully sent onboarding email to {email}")
    return f"Invitation sent to {email}"


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
    
    email_content = f"""
    ==================================================
    OUTBOUND EMAIL TRIGGERED (MOCK DISPATCH)
    To: {email}
    Subject: Institution Administrator Onboarding - EduSupervision
    
    A new school district / educational tenant has been successfully
    provisioned for you on the EduSupervision platform.
    
    Here are your administrative login credentials:
    Username: {email}
    Temporary Password: {temp_password}
    
    Please sign in and change your temporary password immediately.
    ==================================================
    """
    print(email_content)
    logger.info(f"Successfully sent admin credentials email to {email}")
    return f"Admin email sent to {email}"
