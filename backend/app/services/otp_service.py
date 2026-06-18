"""
OTP service — generates, stores, and verifies one-time passwords.

Dev mode: OTP codes are printed to the console.
To integrate a real SMS provider (MSG91 / Twilio), replace the print block
in `send_otp()` with your provider's SDK call.
"""
import random
import string
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.models.otp import OTPDocument
from app.schemas.enums import OTPPurpose


def _generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def send_otp(
    phone: str, purpose: OTPPurpose, db: AsyncIOMotorDatabase
) -> str:
    """
    Generate a new OTP, invalidate any previous unused OTPs for the same
    phone+purpose, persist to DB, and print the code to console.
    Returns the generated code (useful for testing).
    """
    # Invalidate prior unused OTPs for this phone+purpose
    await db.otps.update_many(
        {"phone": phone, "purpose": purpose.value, "used": False},
        {"$set": {"used": True}},
    )

    code = _generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.OTP_TTL_SECONDS)

    otp_doc = OTPDocument(
        phone=phone,
        code=code,
        purpose=purpose.value,
        expires_at=expires_at,
    )
    await db.otps.insert_one(otp_doc.to_db())

    # ── DEV MODE: print to console ───────────────────────────────
    print(f"\n{'━'*42}")
    print(f"  📱  OTP  |  {phone}  |  [{purpose.value}]")
    print(f"  🔑  Code : {code}")
    print(f"  ⏱  Expires: {expires_at.strftime('%H:%M:%S UTC')}")
    print(f"{'━'*42}\n")
    # ─────────────────────────────────────────────────────────────

    return code


async def verify_otp(
    phone: str, code: str, purpose: OTPPurpose, db: AsyncIOMotorDatabase
) -> bool:
    """
    Verify an OTP code.
    On success, marks the OTP as used=True and verified=True with a timestamp.
    Returns False if code is wrong, already used, or expired.
    """
    now = datetime.now(timezone.utc)
    otp_doc = await db.otps.find_one(
        {
            "phone": phone,
            "code": code,
            "purpose": purpose.value,
            "used": False,
            "expires_at": {"$gt": now},
        }
    )
    if not otp_doc:
        return False

    await db.otps.update_one(
        {"_id": otp_doc["_id"]},
        {"$set": {"used": True, "verified": True, "verified_at": now}},
    )
    return True


async def is_phone_otp_verified(
    phone: str, purpose: OTPPurpose, db: AsyncIOMotorDatabase
) -> bool:
    """
    Check whether the phone has a recently verified OTP for the given purpose.
    "Recently" = within OTP_VERIFICATION_WINDOW_SECONDS (default 5 min).
    Used to gate registration and password-reset endpoints.
    """
    window_start = datetime.now(timezone.utc) - timedelta(
        seconds=settings.OTP_VERIFICATION_WINDOW_SECONDS
    )
    doc = await db.otps.find_one(
        {
            "phone": phone,
            "purpose": purpose.value,
            "verified": True,
            "verified_at": {"$gte": window_start},
        }
    )
    return doc is not None
