import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


from app.core.utils import utcnow


class UserRole(str, Enum):
    manager = "manager"
    staff = "staff"


# ── DB Model ────────────────────────────────────────────────────────────────

class UserBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(unique=True, index=True)
    role: UserRole = Field(default=UserRole.staff)


class User(UserBase, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    password_hash: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


# ── Request / Response Schemas ───────────────────────────────────────────────

class UserCreate(UserBase):
    """POST /auth/signup"""
    password: str = Field(min_length=8)


class UserRead(UserBase):
    """Returned in responses — never exposes password_hash"""
    id: uuid.UUID
    is_active: bool
    created_at: datetime


class UserUpdate(SQLModel):
    """PATCH /profile"""
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None


class PasswordUpdate(SQLModel):
    """PATCH /profile/password"""
    current_password: str
    new_password: str = Field(min_length=8)


# ── OTP Token ────────────────────────────────────────────────────────────────

class OTPToken(SQLModel, table=True):
    __tablename__ = "otp_tokens"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    token: str = Field(max_length=6)
    expires_at: datetime
    is_used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utcnow)


# ── Auth Schemas ─────────────────────────────────────────────────────────────

class LoginRequest(SQLModel):
    """POST /auth/login"""
    email: str
    password: str


class TokenResponse(SQLModel):
    """Response for login"""
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class OTPRequest(SQLModel):
    """POST /auth/reset/request"""
    email: str


class OTPVerify(SQLModel):
    """POST /auth/reset/verify"""
    email: str
    otp: str = Field(max_length=6)


class PasswordReset(SQLModel):
    """POST /auth/reset/confirm"""
    email: str
    otp: str = Field(max_length=6)
    new_password: str = Field(min_length=8)
