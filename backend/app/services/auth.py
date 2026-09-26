import random
import string
import uuid
from datetime import datetime, timedelta
from typing import Optional

from sqlmodel import Session, select

from ..models import OTPToken, User, UserCreate, UserUpdate
from ..core.config import settings
from ..core.security import create_access_token, hash_password, verify_password


# ── Read ──────────────────────────────────────────────────────────────────────

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).first()


def get_user_by_id(session: Session, user_id: uuid.UUID) -> Optional[User]:
    return session.get(User, user_id)


# ── Create ────────────────────────────────────────────────────────────────────

def create_user(session: Session, data: UserCreate) -> User:
    if get_user_by_email(session, data.email):
        raise ValueError("Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        role=data.role,
        password_hash=hash_password(data.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# ── Auth ──────────────────────────────────────────────────────────────────────

def authenticate_user(
    session: Session, email: str, password: str
) -> Optional[User]:
    user = get_user_by_email(session, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user


def create_token_for_user(user: User) -> str:
    return create_access_token({"sub": str(user.id), "role": user.role})


# ── Update ────────────────────────────────────────────────────────────────────

def update_user(session: Session, user: User, data: UserUpdate) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def update_password(
    session: Session, user: User, current_password: str, new_password: str
) -> User:
    if not verify_password(current_password, user.password_hash):
        raise ValueError("Current password is incorrect")
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# ── OTP ───────────────────────────────────────────────────────────────────────

def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def create_otp_for_user(session: Session, user: User) -> str:
    """Invalidates old OTPs, creates a new one. Returns the raw OTP string."""
    # Mark all unused tokens as used
    old_tokens = session.exec(
        select(OTPToken)
        .where(OTPToken.user_id == user.id)
        .where(OTPToken.is_used == False)
    ).all()
    for t in old_tokens:
        t.is_used = True
        session.add(t)

    otp = _generate_otp()
    token = OTPToken(
        user_id=user.id,
        token=otp,
        expires_at=datetime.utcnow()
        + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    session.add(token)
    session.commit()
    return otp


def verify_otp(session: Session, email: str, otp: str) -> bool:
    user = get_user_by_email(session, email)
    if not user:
        return False
    token = session.exec(
        select(OTPToken)
        .where(OTPToken.user_id == user.id)
        .where(OTPToken.token == otp)
        .where(OTPToken.is_used == False)
        .where(OTPToken.expires_at > datetime.utcnow())
    ).first()
    return token is not None


def reset_password_with_otp(
    session: Session, email: str, otp: str, new_password: str
) -> bool:
    user = get_user_by_email(session, email)
    if not user:
        return False

    token = session.exec(
        select(OTPToken)
        .where(OTPToken.user_id == user.id)
        .where(OTPToken.token == otp)
        .where(OTPToken.is_used == False)
        .where(OTPToken.expires_at > datetime.utcnow())
    ).first()

    if not token:
        return False

    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    token.is_used = True  # Consume OTP
    session.add(user)
    session.add(token)
    session.commit()
    return True
