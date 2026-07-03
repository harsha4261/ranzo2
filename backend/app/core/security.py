import uuid

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    """
    Create a JWT token encoding the user's ID plus a unique `jti`.
    No expiry claim — token lifecycle is managed by the frontend (local store),
    but the `jti` lets `logout` revoke this specific token server-side
    (see app.api.deps / db.revoked_tokens). A new token+jti is issued on every sign-in.
    """
    payload = {"sub": user_id, "jti": uuid.uuid4().hex}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token_payload(token: str) -> dict:
    """
    Decode a JWT and return the full payload (sub + jti).
    Raises JWTError if the token is malformed or the secret is wrong.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
        options={"verify_exp": False},  # No expiry enforcement — frontend owns lifecycle
    )
    if payload.get("sub") is None:
        raise JWTError("Token has no subject claim")
    return payload


def decode_access_token(token: str) -> str:
    """Decode a JWT and return just the user_id (sub claim)."""
    return decode_access_token_payload(token)["sub"]
