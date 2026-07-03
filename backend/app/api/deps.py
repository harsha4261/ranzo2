from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import decode_access_token_payload
from app.services.user_service import get_user_by_id

# auto_error=False lets us return 401 (not 403) for missing tokens
_bearer = HTTPBearer(auto_error=False)


def get_db(request: Request) -> AsyncIOMotorDatabase:
    """Dependency: returns the MongoDB database from app.state."""
    return request.app.state.db


async def get_current_token_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """
    Dependency: decode Bearer JWT, reject if revoked (logged out) or the
    user no longer exists, and return the full payload (sub + jti).
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token_payload(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jti = payload.get("jti")
    if jti and await db.revoked_tokens.find_one({"_id": jti}):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again.",
        )

    user_id = payload["sub"]
    user = await get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return payload


async def get_current_user_id(
    payload: dict = Depends(get_current_token_payload),
) -> str:
    """Dependency: decode Bearer JWT and return just the user_id."""
    return payload["sub"]
