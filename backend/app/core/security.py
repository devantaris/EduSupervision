import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

from app.core.config import settings

# Password hashing context using pbkdf2_sha256
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Global in-memory cache for auto-generated keys in dev/test environment
_DEV_PRIVATE_KEY: Optional[str] = None
_DEV_PUBLIC_KEY: Optional[str] = None


def get_rs256_keys() -> tuple[str, str]:
    """
    Returns the RS256 Private and Public keys in PEM format.
    Falls back to generating a fresh in-memory key pair if none are configured.
    """
    global _DEV_PRIVATE_KEY, _DEV_PUBLIC_KEY

    # Use configured keys if available
    if settings.JWT_PRIVATE_KEY and settings.JWT_PUBLIC_KEY:
        return settings.JWT_PRIVATE_KEY, settings.JWT_PUBLIC_KEY

    # Generate in-memory keys for development
    if _DEV_PRIVATE_KEY is None or _DEV_PUBLIC_KEY is None:
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        # Serialize private key to PEM
        pem_private = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        # Serialize public key to PEM
        pem_public = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        _DEV_PRIVATE_KEY = pem_private.decode("utf-8")
        _DEV_PUBLIC_KEY = pem_public.decode("utf-8")

    return _DEV_PRIVATE_KEY, _DEV_PUBLIC_KEY


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a hashed bcrypt password.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generates a secure bcrypt password hash.
    """
    return pwd_context.hash(password)


def create_jwt_token(
    subject: str | uuid.UUID,
    role: str,
    institution_id: Optional[str | uuid.UUID],
    expires_delta: timedelta,
    token_type: str = "access",
) -> str:
    """
    Creates a signed RS256 JWT token with custom claims.
    """
    private_key, _ = get_rs256_keys()
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    
    claims = {
        "sub": str(subject),
        "role": role,
        "institution_id": str(institution_id) if institution_id else None,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    
    encoded_jwt = jwt.encode(claims, private_key, algorithm="RS256")
    return encoded_jwt


def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and verifies a JWT token signature and expiry using the RS256 public key.
    Returns the payload if valid, otherwise returns None.
    """
    _, public_key = get_rs256_keys()
    try:
        payload = jwt.decode(token, public_key, algorithms=["RS256"])
        return payload
    except JWTError:
        return None
