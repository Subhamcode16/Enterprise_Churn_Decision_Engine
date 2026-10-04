"""
VALENCE Authentication & Security Module
NIST PBKDF2-HMAC-SHA256 password hashing, HMAC-SHA256 JWT tokens, and RBAC guards.
"""

import os
import hmac
import hashlib
import json
import base64
import time
import secrets
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from src.database import get_db, User, AuditLog

SECRET_KEY = os.getenv("SESSION_SECRET", os.getenv("JWT_SECRET", "valence_production_secret_key_2026_9837a4b1c2e3f4"))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
PBKDF2_ITERATIONS = 100_000

security_scheme = HTTPBearer(auto_error=False)


def generate_salt() -> str:
    """Generates a secure 32-byte hex salt"""
    return secrets.token_hex(32)


def hash_password(password: str, salt: str) -> str:
    """Hashes password using NIST-approved PBKDF2-HMAC-SHA256 with 100,000 iterations"""
    pwd_bytes = password.encode("utf-8")
    salt_bytes = salt.encode("utf-8")
    key = hashlib.pbkdf2_hmac("sha256", pwd_bytes, salt_bytes, PBKDF2_ITERATIONS)
    return base64.b64encode(key).decode("utf-8")


def verify_password(password: str, salt: str, hashed_password: str) -> bool:
    """Constant-time password verification preventing timing attacks"""
    computed = hash_password(password, salt)
    return hmac.compare_digest(computed, hashed_password)


def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def base64url_decode(data: str) -> bytes:
    padding = "=" * (4 - len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates an HMAC-SHA256 JWT access token with 7-day expiration"""
    to_encode = data.copy()
    expire_time = time.time() + (expires_delta.total_seconds() if expires_delta else ACCESS_TOKEN_EXPIRE_DAYS * 86400)
    to_encode.update({"exp": int(expire_time), "iat": int(time.time()), "iss": "valence_retention_core"})

    header = {"alg": ALGORITHM, "typ": "JWT"}
    header_b64 = base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = base64url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))

    signature_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signature_input, hashlib.sha256).digest()
    signature_b64 = base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates JWT token signature and expiration"""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Malformed token format")

        header_b64, payload_b64, signature_b64 = parts
        signature_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signature_input, hashlib.sha256).digest()
        actual_sig = base64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Invalid token signature")

        payload = json.loads(base64url_decode(payload_b64).decode("utf-8"))
        if payload.get("exp") and time.time() > payload["exp"]:
            raise ValueError("Token has expired")

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """FastAPI Dependency: Verifies Bearer Token and resolves active User"""
    if not credentials or not credentials.credentials:
        # Fallback for development if no token provided
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive or not found")

    return user


def require_admin_role(current_user: User = Depends(get_current_user)) -> User:
    """FastAPI Dependency: Restricts endpoint exclusively to admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required for this resource",
        )
    return current_user
