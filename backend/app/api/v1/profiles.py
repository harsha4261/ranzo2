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
        name_as_per_adhar=doc.get("name_as_per_adhar"),
        adhar_number=doc.get("adhar_number"),
        adhar_image_url=doc.get("adhar_image_url"),
        photo_url=doc.get("photo_url"),
        village_city=doc.get("village_city"),
        pin_code=doc.get("pin_code"),
        district=doc.get("district"),
        state=doc.get("state"),
        preferred_distance=doc.get("preferred_distance"),
        terms_agreed=doc.get("terms_agreed", False),
        skills=doc.get("skills", []), location=doc.get("location"),
        longitude=coords[0] if coords else None,
        latitude=coords[1] if coords else None,
        online_status=doc.get("online_status", False),
        is_completed=doc.get("is_completed", False),
        is_approved=doc.get("is_approved", False),
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
            if validated.longitude is not None and validated.latitude is not None:
                update_data["location_coords"] = [validated.longitude, validated.latitude]

        elif role == UserRole.technician:
            validated = TechnicianProfileUpdate.model_validate(body)
            update_data = validated.model_dump(exclude_unset=True)
            if "skills" in update_data and update_data["skills"] is not None:
                update_data["skills"] = [s.value for s in validated.skills]
            
            # Remove lat/long from root update_data as they go into location_coords
            update_data.pop("longitude", None)
            update_data.pop("latitude", None)
            
            from app.services.matchmaking import matchmaker
            
            if validated.longitude is not None and validated.latitude is not None:
                update_data["location_coords"] = [validated.longitude, validated.latitude]
                if validated.online_status is not False:
                    # Sync to Redis for real-time matchmaking if they are online
                    await matchmaker.update_technician_location(user_id, validated.longitude, validated.latitude)
                
            if validated.online_status is True:
                current_profile = await get_profile(user_id, role, db)
                if not current_profile or not current_profile.get("is_approved"):
                    raise HTTPException(
                        status.HTTP_403_FORBIDDEN, 
                        "You must be approved by an admin before going online."
                    )
            elif validated.online_status is False:
                # Remove from active Redis matchmaking pool
                await matchmaker.remove_technician(user_id)

        elif role == UserRole.seeker:
            validated = SeekerProfileUpdate.model_validate(body)
            update_data = {
                "category": validated.category.value,
                "role": validated.role,
                "location": validated.location,
            }
            if validated.longitude is not None and validated.latitude is not None:
                update_data["location_coords"] = [validated.longitude, validated.latitude]

        elif role == UserRole.employer:
            validated = EmployerProfileUpdate.model_validate(body)
            update_data = validated.model_dump()
            if validated.longitude is not None and validated.latitude is not None:
                update_data["location_coords"] = [validated.longitude, validated.latitude]

    except ValidationError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors())

    profile = await update_profile(user_id, role, update_data, db)
    if not profile:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Profile not found for role '{role.value}'")
    return _SERIALIZERS[role](profile)
