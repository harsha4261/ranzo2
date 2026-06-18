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
    Create a JWT token encoding the user's ID.
    No expiry claim — token lifecycle is managed by the frontend (local store).
    A new token is issued on every sign-in.
    """
    payload = {"sub": user_id}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str:
    """
    Decode a JWT and return the user_id (sub claim).
    Raises JWTError if the token is malformed or the secret is wrong.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
        options={"verify_exp": False},  # No expiry enforcement — frontend owns lifecycle
    )
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise JWTError("Token has no subject claim")
    return user_id
