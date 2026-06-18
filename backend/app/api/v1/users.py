from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_user_id, get_db
from app.schemas.user import UserSummaryResponse
from app.services.user_service import get_user_by_id

router = APIRouter()


@router.get("/me", response_model=UserSummaryResponse, summary="Get current user summary")
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Returns the authenticated user's profile summary.
    `registered_roles` lists the roles where `is_completed = True`.
    The frontend uses this to populate the Profile icon screen.
    """
    user = await get_user_by_id(user_id, db)
    return UserSummaryResponse(
        id=user["_id"],
        name=user["name"],
        phone=user["phone"],
        registered_roles=user.get("registered_roles", []),
        created_at=user["created_at"],
    )
