from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from pydantic import BaseModel, Field


def _new_id() -> str:
    return str(ObjectId())


# ──────────────────────────────────────────────
# User
# ──────────────────────────────────────────────

class UserDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    name: str
    phone: str
    hashed_password: str
    registered_roles: List[str] = Field(default_factory=list)
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)


# ──────────────────────────────────────────────
# Profiles (one empty doc created per role on user registration)
# ──────────────────────────────────────────────

class CustomerProfileDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    user_id: str
    location: Optional[str] = None
    location_coords: Optional[List[float]] = None
    is_completed: bool = False

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)


class TechnicianProfileDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    user_id: str
    name_as_per_adhar: Optional[str] = None
    adhar_number: Optional[str] = None
    adhar_image_url: Optional[str] = None
    photo_url: Optional[str] = None
    village_city: Optional[str] = None
    pin_code: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    preferred_distance: Optional[int] = None
    terms_agreed: bool = False
    skills: List[str] = Field(default_factory=list)   # max 3, min 1 enforced at schema level
    location: Optional[str] = None
    location_coords: Optional[List[float]] = None
    online_status: bool = False
    is_completed: bool = False
    is_approved: bool = False

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)


class SeekerProfileDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    user_id: str
    category: Optional[str] = None   # JobCategory enum value
    role: Optional[str] = None       # Role within the category
    location: Optional[str] = None
    location_coords: Optional[List[float]] = None
    is_completed: bool = False

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)


class EmployerProfileDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    user_id: str
    company: Optional[str] = None
    location: Optional[str] = None
    location_coords: Optional[List[float]] = None
    is_completed: bool = False

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)
