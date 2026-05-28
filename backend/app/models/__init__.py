from app.models.base import Base
from app.models.institution import Institution
from app.models.user import User
from app.models.profile import Profile
from app.models.material import Material
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.evaluation import AIEvaluation
from app.models.audit_log import AuditLog

__all__ = [
    "Base",
    "Institution",
    "User",
    "Profile",
    "Material",
    "Assignment",
    "Submission",
    "AIEvaluation",
    "AuditLog",
]
