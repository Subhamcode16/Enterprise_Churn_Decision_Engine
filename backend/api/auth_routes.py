"""
VALENCE Authentication Endpoints
Operator & Executive registration, JWT login, and session validation.
"""

from datetime import datetime, timezone
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
    is_active: bool
    created_at: str


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
            "role": user.role
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
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else datetime.now(timezone.utc).isoformat()
    }
