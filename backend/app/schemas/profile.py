from typing import Annotated, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.enums import CATEGORY_ROLES, JobCategory, TechnicianSkill


# ──────────────────────────── Customer ────────────────────────────

class CustomerProfileResponse(BaseModel):
    id: str
    user_id: str
    location: Optional[str]
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_completed: bool


class CustomerProfileUpdate(BaseModel):
    location: str = Field(..., min_length=2, max_length=100)
    latitude: float
    longitude: float


# ──────────────────────────── Technician ────────────────────────────

class TechnicianProfileResponse(BaseModel):
    id: str
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
    skills: List[TechnicianSkill]
    location: Optional[str]
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    online_status: bool
    is_completed: bool
    is_approved: bool = False


class TechnicianProfileUpdate(BaseModel):
    name_as_per_adhar: Optional[str] = None
    adhar_number: Optional[str] = None
    adhar_image_url: Optional[str] = None
    photo_url: Optional[str] = None
    village_city: Optional[str] = None
    pin_code: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    preferred_distance: Optional[int] = None
    terms_agreed: Optional[bool] = None
    # min 1, max 3 skills — enforced by Pydantic at the schema level
    skills: Optional[List[TechnicianSkill]] = Field(None, min_length=1, max_length=3)
    location: Optional[str] = Field(None, min_length=2, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    online_status: Optional[bool] = None


# ──────────────────────────── Seeker ────────────────────────────

class SeekerProfileResponse(BaseModel):
    id: str
    user_id: str
    category: Optional[str]
    role: Optional[str]
    location: Optional[str]
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_completed: bool


class SeekerProfileUpdate(BaseModel):
    category: JobCategory
    role: str
    location: str = Field(..., min_length=2, max_length=100)
    latitude: float
    longitude: float

    @model_validator(mode="after")
    def validate_role_matches_category(self) -> "SeekerProfileUpdate":
        valid_roles = CATEGORY_ROLES.get(self.category.value, [])
        if self.role not in valid_roles:
            raise ValueError(
                f"Role '{self.role}' is not valid for category '{self.category.value}'. "
                f"Valid roles: {valid_roles}"
            )
        return self


# ──────────────────────────── Employer ────────────────────────────

class EmployerProfileResponse(BaseModel):
    id: str
    user_id: str
    company: Optional[str]
    location: Optional[str]
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_completed: bool


class EmployerProfileUpdate(BaseModel):
    company: str = Field(..., min_length=2, max_length=100)
    location: str = Field(..., min_length=2, max_length=100)
    latitude: float
    longitude: float
