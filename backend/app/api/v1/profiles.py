from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import ValidationError

from app.api.deps import get_current_user_id, get_db
from app.schemas.enums import UserRole
from app.schemas.profile import (
    CustomerProfileResponse,
    CustomerProfileUpdate,
    EmployerProfileResponse,
    EmployerProfileUpdate,
    SeekerProfileResponse,
    SeekerProfileUpdate,
    TechnicianProfileResponse,
    TechnicianProfileUpdate,
)
from app.services.user_service import get_profile, update_profile

router = APIRouter()


# ── Helpers: convert raw MongoDB dicts to response models ──────────

def _to_customer(doc: dict) -> CustomerProfileResponse:
    coords = doc.get("location_coords")
    return CustomerProfileResponse(
        id=doc["_id"], user_id=doc["user_id"],
        location=doc.get("location"),
        longitude=coords[0] if coords else None,
        latitude=coords[1] if coords else None,
        is_completed=doc.get("is_completed", False),
    )

def _to_technician(doc: dict) -> TechnicianProfileResponse:
    coords = doc.get("location_coords")
    return TechnicianProfileResponse(
        id=doc["_id"], user_id=doc["user_id"],
        skills=doc.get("skills", []), location=doc.get("location"),
        longitude=coords[0] if coords else None,
        latitude=coords[1] if coords else None,
        online_status=doc.get("online_status", False),
        is_completed=doc.get("is_completed", False),
    )

def _to_seeker(doc: dict) -> SeekerProfileResponse:
    coords = doc.get("location_coords")
    return SeekerProfileResponse(
        id=doc["_id"], user_id=doc["user_id"],
        category=doc.get("category"), role=doc.get("role"),
        location=doc.get("location"),
        longitude=coords[0] if coords else None,
        latitude=coords[1] if coords else None,
        is_completed=doc.get("is_completed", False),
    )

def _to_employer(doc: dict) -> EmployerProfileResponse:
    coords = doc.get("location_coords")
    return EmployerProfileResponse(
        id=doc["_id"], user_id=doc["user_id"],
        company=doc.get("company"), location=doc.get("location"),
        longitude=coords[0] if coords else None,
        latitude=coords[1] if coords else None,
        is_completed=doc.get("is_completed", False),
    )

_SERIALIZERS = {
    UserRole.customer: _to_customer,
    UserRole.technician: _to_technician,
    UserRole.seeker: _to_seeker,
    UserRole.employer: _to_employer,
}


# ── GET /profiles/me?role=<role> ──────────────────────────────────

@router.get(
    "/me",
    summary="Get profile for a specific role",
    description=(
        "Returns the authenticated user's profile for the given role. "
        "**Required query param**: `role` = customer | technician | seeker | employer"
    ),
)
async def get_my_profile(
    role: UserRole,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    profile = await get_profile(user_id, role, db)
    if not profile:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Profile not found for role '{role.value}'")
    return _SERIALIZERS[role](profile)


# ── PUT /profiles/me?role=<role> ──────────────────────────────────

@router.put(
    "/me",
    summary="Update profile for a specific role",
    description=(
        "Update and complete the profile for the given role. "
        "Sets `is_completed=True` and adds the role to `registered_roles`.\n\n"
        "**Body per role:**\n"
        "- `customer`: `{location}`\n"
        "- `technician`: `{skills: [...], location, online_status}`  — 1–3 skills from the predefined list\n"
        "- `seeker`: `{category, role, location}` — role must match the category\n"
        "- `employer`: `{company, location}`"
    ),
)
async def update_my_profile(
    role: UserRole,
    body: dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    We accept a generic JSON body and validate it against the role-specific schema.
    This satisfies the README requirement of a single endpoint with ?role= param.
    ValidationError details are forwarded as a 422 response.
    """
    try:
        if role == UserRole.customer:
            validated = CustomerProfileUpdate.model_validate(body)
            update_data = validated.model_dump()
            update_data["location_coords"] = [validated.longitude, validated.latitude]

        elif role == UserRole.technician:
            validated = TechnicianProfileUpdate.model_validate(body)
            # Store enum values as strings in MongoDB
            update_data = {
                "skills": [s.value for s in validated.skills],
                "location": validated.location,
                "location_coords": [validated.longitude, validated.latitude],
                "online_status": validated.online_status,
            }

        elif role == UserRole.seeker:
            validated = SeekerProfileUpdate.model_validate(body)
            update_data = {
                "category": validated.category.value,
                "role": validated.role,
                "location": validated.location,
                "location_coords": [validated.longitude, validated.latitude],
            }

        elif role == UserRole.employer:
            validated = EmployerProfileUpdate.model_validate(body)
            update_data = validated.model_dump()
            update_data["location_coords"] = [validated.longitude, validated.latitude]

    except ValidationError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors())

    profile = await update_profile(user_id, role, update_data, db)
    if not profile:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Profile not found for role '{role.value}'")
    return _SERIALIZERS[role](profile)
