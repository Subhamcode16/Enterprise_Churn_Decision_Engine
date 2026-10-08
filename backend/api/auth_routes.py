"""
VALENCE Authentication Endpoints
Operator & Executive registration, JWT login, and session validation.
"""

import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from src.database import get_db, User, AuditLog
from src.auth import (
    generate_salt, 
    hash_password, 
    verify_password, 
    create_access_token, 
    get_current_user
)
from src.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 character secure password")
    full_name: str = Field("Enterprise Operator", min_length=2)
    role: str = Field("operator", pattern="^(admin|operator|executive)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SSOLoginRequest(BaseModel):
    provider: str = Field(..., pattern="^(google|apple|x|twitter|email|sso)$", description="SSO Identity Provider")
    email: EmailStr
    full_name: Optional[str] = None
    provider_user_id: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_days: int = 7
    user: dict


class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    auth_provider: Optional[str] = "email"
    is_active: bool
    created_at: str
    last_login: Optional[str] = None


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register_user(request: Request, req: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new enterprise operator with salt-hashed password and issues JWT"""
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    salt = generate_salt()
    hashed = hash_password(req.password, salt)

    user = User(
        tenant_id="default_tenant",
        email=req.email.lower(),
        hashed_password=hashed,
        salt=salt,
        full_name=req.full_name,
        role=req.role,
        is_active=True,
        last_login=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log audit event
    audit = AuditLog(
        user_id=user.id,
        tenant_id=user.tenant_id,
        user_email=user.email,
        action="USER_REGISTERED",
        resource=f"/api/auth/register?role={user.role}",
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_days": 7,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login_user(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates operator credentials and issues an HMAC-SHA256 JWT access token"""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.salt, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact your system administrator.",
        )

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Log audit event
    audit = AuditLog(
        user_id=user.id,
        tenant_id=user.tenant_id or "default_tenant",
        user_email=user.email,
        action="USER_LOGIN_SUCCESS",
        resource="/api/auth/login",
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_days": 7,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "auth_provider": getattr(user, "auth_provider", "email"),
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
    }


@router.post("/sso", response_model=AuthResponse)
@limiter.limit("20/minute")
def sso_login(request: Request, req: SSOLoginRequest, db: Session = Depends(get_db)):
    """
    Unified 1-Click Single Sign-On (Google, Apple, X/Twitter, Enterprise SSO).
    Authenticates or auto-provisions user account and issues JWT access token.
    """
    provider_clean = "x" if req.provider == "twitter" else req.provider.lower()
    email_clean = req.email.lower().strip()

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        # Auto-provision new enterprise user via SSO
        salt = generate_salt()
        hashed = hash_password(secrets.token_urlsafe(32), salt)
        user = User(
            tenant_id="default_tenant",
            email=email_clean,
            hashed_password=hashed,
            salt=salt,
            full_name=req.full_name or f"{provider_clean.capitalize()} Operator",
            role="operator",
            auth_provider=provider_clean,
            provider_user_id=req.provider_user_id,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            last_login=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        action_name = f"USER_SSO_REGISTER_{provider_clean.upper()}"
    else:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account has been deactivated. Please contact your system administrator.",
            )
        user.auth_provider = provider_clean
        if req.provider_user_id:
            user.provider_user_id = req.provider_user_id
        if req.full_name and (not user.full_name or user.full_name == "Enterprise Operator"):
            user.full_name = req.full_name
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        action_name = f"USER_SSO_LOGIN_{provider_clean.upper()}"

    # Record Audit Log
    audit = AuditLog(
        user_id=user.id,
        tenant_id=user.tenant_id or "default_tenant",
        user_email=user.email,
        action=action_name,
        resource=f"/api/auth/sso?provider={provider_clean}",
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)
    db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "provider": provider_clean
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_days": 7,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "auth_provider": user.auth_provider or provider_clean,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
    }


@router.get("/me", response_model=UserProfileResponse)
@limiter.limit("60/minute")
def get_user_profile(request: Request, current_user: User = Depends(get_current_user)):
    """Retrieves authenticated operator profile and role privileges"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name or "Enterprise Operator",
        "role": current_user.role,
        "auth_provider": getattr(current_user, "auth_provider", "email"),
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else datetime.now(timezone.utc).isoformat(),
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None
    }
