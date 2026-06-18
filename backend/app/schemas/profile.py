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
    skills: List[TechnicianSkill]
    location: Optional[str]
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    online_status: bool
    is_completed: bool


class TechnicianProfileUpdate(BaseModel):
    # min 1, max 3 skills — enforced by Pydantic at the schema level
    skills: Annotated[List[TechnicianSkill], Field(min_length=1, max_length=3)]
    location: str = Field(..., min_length=2, max_length=100)
    latitude: float
    longitude: float
    online_status: bool = False


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
