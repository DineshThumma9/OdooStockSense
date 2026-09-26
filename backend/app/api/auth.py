from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session

from ..core.db import get_session
from ..core.deps import get_current_user
from ..models import (
    User,
    UserCreate,
    UserRead,
    UserUpdate,
    PasswordUpdate,
    LoginRequest,
    TokenResponse,
    OTPRequest,
    OTPVerify,
    PasswordReset,
)
from ..services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, session: Session = Depends(get_session)):
    try:
        user = auth_service.create_user(session, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    token = auth_service.create_token_for_user(user)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, session: Session = Depends(get_session)):
    user = auth_service.authenticate_user(session, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = auth_service.create_token_for_user(user)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/logout")
def logout():
    # JWT is stateless — client discards the token
    return {"message": "Logged out successfully"}


@router.post("/reset/request")
def request_otp(
    data: OTPRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    user = auth_service.get_user_by_email(session, data.email)
    if not user:
        # Don't reveal if email exists — always return 200
        return {"message": "If that email is registered, an OTP was sent"}

    otp = auth_service.create_otp_for_user(session, user)

    # Send email in background (non-blocking)
    background_tasks.add_task(_send_otp_email, user.email, otp)
    return {"message": "If that email is registered, an OTP was sent"}


@router.post("/reset/verify")
def verify_otp(data: OTPVerify, session: Session = Depends(get_session)):
    valid = auth_service.verify_otp(session, data.email, data.otp)
    return {"valid": valid}


@router.post("/reset/confirm")
def reset_password(data: PasswordReset, session: Session = Depends(get_session)):
    success = auth_service.reset_password_with_otp(
        session, data.email, data.otp, data.new_password
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )
    return {"message": "Password reset successful"}


# ── Profile ───────────────────────────────────────────────────────────────────

profile_router = APIRouter(prefix="/profile", tags=["Profile"])


@profile_router.get("", response_model=UserRead)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@profile_router.patch("", response_model=UserRead)
def update_profile(
    data: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    updated = auth_service.update_user(session, current_user, data)
    return UserRead.model_validate(updated)


@profile_router.patch("/password")
def change_password(
    data: PasswordUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        auth_service.update_password(
            session, current_user, data.current_password, data.new_password
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {"message": "Password updated"}


# ── Email helper (replace with fastapi-mail in production) ───────────────────

def _send_otp_email(email: str, otp: str) -> None:
    """Background task: send OTP email. Wire up fastapi-mail here."""
    # TODO: integrate fastapi-mail with SMTP settings from config
    print(f"[OTP EMAIL] To: {email} | OTP: {otp}")
