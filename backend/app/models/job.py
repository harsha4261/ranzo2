from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from pydantic import BaseModel, Field

def _new_id() -> str:
    return str(ObjectId())

class JobDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    employer_id: str
    title: str
    sector: str  # JobCategory value
    sub_sector: Optional[str] = None
    employment_type: str  # full_time, part_time, contract
    vacancies: int = 1
    description: str
    required_skills: List[str] = Field(default_factory=list)  # max 8
    experience_min: int = 0
    experience_max: int = 0
    education: Optional[str] = None
    job_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    salary_min: float
    salary_max: float
    salary_period: str = "month"  # month, day, hour
    working_hours: Optional[str] = None
    benefits: List[str] = Field(default_factory=list)
    status: str = "DRAFT"  # DRAFT, PUBLISHED, CLOSED
    moderation_status: str = "PENDING"  # PENDING, APPROVED, REJECTED
    moderation_note: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)


class JobApplicationDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    job_id: str
    seeker_id: str
    employer_id: str  # denormalized from the job for easy employer queries
    cover_message: Optional[str] = None  # max 500
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    status: str = "SUBMITTED"  # SUBMITTED, SHORTLISTED, REJECTED, INTERVIEW_SCHEDULED, HIRED

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)


class WalkInDriveDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    employer_id: str
    job_id: str
    drive_date: datetime
    time_slots: List[str] = Field(default_factory=list)
    address: str
    capacity_per_slot: int
    instructions: Optional[str] = None
    checked_in_count: int = 0

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)
