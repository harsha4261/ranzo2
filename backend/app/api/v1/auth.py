from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_token_payload, get_current_user_id, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import (
    CheckPhoneRequest,
    CheckPhoneResponse,
    LoginOTPRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    SendOTPRequest,
    TokenResponse,
    VerifyOTPRequest,
)
from app.schemas.enums import OTPPurpose
from app.services import otp_service, user_service

router = APIRouter()


@router.post("/check-phone", response_model=CheckPhoneResponse, summary="Check if phone is registered")
async def check_phone(
    body: CheckPhoneRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Step 1 of registration: verify whether a phone number already has an account.
    The frontend uses this to decide whether to show Register or Login.
    """
    exists = await user_service.phone_exists(body.phone, db)
    return CheckPhoneResponse(
        exists=exists,
        message="Phone already registered" if exists else "Phone is available",
    )


@router.post("/send-otp", response_model=MessageResponse, summary="Send OTP to phone")
async def send_otp(
    body: SendOTPRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Send a 6-digit OTP (TTL = 60 s). Printed to console in dev mode.
    - `register` → phone must NOT exist
    - `login` / `forgot_password` → phone MUST exist
    """
    if body.purpose == OTPPurpose.register:
        if await user_service.phone_exists(body.phone, db):
            raise HTTPException(status.HTTP_409_CONFLICT, "Phone number is already registered")
    else:
        if not await user_service.phone_exists(body.phone, db):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Phone number is not registered")

    await otp_service.send_otp(body.phone, body.purpose, db)
    return MessageResponse(message=f"OTP sent to {body.phone}")


@router.post("/verify-otp", response_model=MessageResponse, summary="Verify OTP code")
async def verify_otp(
    body: VerifyOTPRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Verify the OTP. On success the OTP is marked verified for 5 minutes,
    allowing the user to complete registration or password reset.
    """
    ok = await otp_service.verify_otp(body.phone, body.code, body.purpose, db)
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OTP")
    return MessageResponse(message="OTP verified successfully")


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    body: RegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Register flow:
    1. send-otp (purpose=register)
    2. verify-otp
    3. register  ← this endpoint

    Requires a verified OTP within the last 5 minutes.
    Creates the user + all 4 empty role profiles, returns a JWT.
    """
    # Guard: OTP must have been verified recently
    if not await otp_service.is_phone_otp_verified(body.phone, OTPPurpose.register, db):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Phone not OTP-verified. Please verify your number first.",
        )

    # Race-condition guard
    if await user_service.phone_exists(body.phone, db):
        raise HTTPException(status.HTTP_409_CONFLICT, "Phone number is already registered")

    user = await user_service.create_user(body.name, body.phone, body.password, db)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse, summary="Login with phone + password")
async def login(
    body: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await user_service.get_user_by_phone(body.phone, db)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid phone or password")
    return TokenResponse(access_token=create_access_token(str(user["_id"])))


@router.post("/login-otp", response_model=TokenResponse, summary="Login with phone + OTP")
async def login_otp(
    body: LoginOTPRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    OTP login flow:
    1. send-otp (purpose=login)
    2. login-otp  ← this endpoint (verifies OTP inline)
    """
    ok = await otp_service.verify_otp(body.phone, body.code, OTPPurpose.login, db)
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OTP")

    user = await user_service.get_user_by_phone(body.phone, db)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    return TokenResponse(access_token=create_access_token(str(user["_id"])))


@router.post("/reset-password", response_model=MessageResponse, summary="Reset password via OTP")
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Forgot-password flow:
    1. send-otp (purpose=forgot_password)
    2. verify-otp
    3. reset-password  ← this endpoint
    """
    if not await otp_service.is_phone_otp_verified(body.phone, OTPPurpose.forgot_password, db):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Phone not OTP-verified. Please verify your number first.",
        )

    user = await user_service.get_user_by_phone(body.phone, db)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": hash_password(body.new_password)}},
    )
    return MessageResponse(message="Password reset successfully")


@router.post("/logout", response_model=MessageResponse, summary="Logout and revoke this token")
async def logout(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Logout endpoint. Revokes this specific token server-side (via its `jti`)
    so it can no longer be used even if the frontend fails to delete it.
    The frontend must still delete the token from local storage after this call.
    """
    jti = payload.get("jti")
    if jti:
        await db.revoked_tokens.update_one(
            {"_id": jti},
            {"$setOnInsert": {"user_id": payload["sub"], "revoked_at": datetime.now(timezone.utc)}},
            upsert=True,
        )
    return MessageResponse(message="Logged out successfully. Please delete your token from local storage.")
