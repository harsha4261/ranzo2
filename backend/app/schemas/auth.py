import re

from pydantic import BaseModel, field_validator

from app.schemas.enums import OTPPurpose

# ── Reusable validators ──────────────────────────────

_PHONE_RE = re.compile(r"^\d{10}$")
_UPPER_RE = re.compile(r"[A-Z]")
_LOWER_RE = re.compile(r"[a-z]")
_DIGIT_RE = re.compile(r"\d")
_SPECIAL_RE = re.compile(r'[!@#$%^&*()\-_=+\[\]{}|;:\'",.<>?/`~\\]')


def _validate_phone(v: str) -> str:
    v = v.strip()
    if not _PHONE_RE.fullmatch(v):
        raise ValueError("Phone must be exactly 10 digits (0–9 only)")
    return v


def _validate_password(v: str) -> str:
    errors: list[str] = []
    if len(v) < 8:
        errors.append("at least 8 characters")
    if not _UPPER_RE.search(v):
        errors.append("one uppercase letter")
    if not _LOWER_RE.search(v):
        errors.append("one lowercase letter")
    if not _DIGIT_RE.search(v):
        errors.append("one digit")
    if not _SPECIAL_RE.search(v):
        errors.append("one special character")
    if errors:
        raise ValueError("Password requires: " + ", ".join(errors))
    return v


# ── Request schemas ──────────────────────────────────

class CheckPhoneRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)


class SendOTPRequest(BaseModel):
    phone: str
    purpose: OTPPurpose

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)


class VerifyOTPRequest(BaseModel):
    phone: str
    code: str
    purpose: OTPPurpose

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)


class RegisterRequest(BaseModel):
    name: str
    phone: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not 3 <= len(v) <= 30:
            raise ValueError("Name must be between 3 and 30 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password(v)


class LoginRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)


class LoginOTPRequest(BaseModel):
    phone: str
    code: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)


class ResetPasswordRequest(BaseModel):
    phone: str
    new_password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password(v)


# ── Response schemas ─────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CheckPhoneResponse(BaseModel):
    exists: bool
    message: str


class MessageResponse(BaseModel):
    message: str
