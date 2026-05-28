from celery import Celery
from app.core.config import settings

# Initialize Celery app
# PostgreSQL database is used as the result backend for durability and auditability
celery_app = Celery(
    "edusupervision_tasks",
    broker=settings.REDIS_URL,
    backend=f"db+{settings.DATABASE_URL}",
)

# Apply performance and reliability configurations
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    
    # ACK only after completion to prevent job loss on worker crash
    task_acks_late=True,
    
    # Prefetch multiplier of 1 prevents workers from hoarding tasks
    worker_prefetch_multiplier=1,
    
    # Configure task routing
    task_routes={
        "app.tasks.evaluation_worker.*": {"queue": "ai_heavy"},
        "app.tasks.notifications.*": {"queue": "notifications"},
    },
)
