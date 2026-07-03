from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str
    sector: str
    sub_sector: Optional[str] = None
    employment_type: str
    vacancies: int = 1
    description: str
    required_skills: List[str] = Field(default_factory=list, max_length=8)
    experience_min: int = 0
    experience_max: int = 0
    education: Optional[str] = None
    job_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    salary_min: float
    salary_max: float
    salary_period: str = "month"
    working_hours: Optional[str] = None
    benefits: List[str] = Field(default_factory=list)
    publish: bool = False


class JobUpdate(BaseModel):
    title: Optional[str] = None
    sector: Optional[str] = None
    sub_sector: Optional[str] = None
    employment_type: Optional[str] = None
    vacancies: Optional[int] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = Field(default=None, max_length=8)
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    education: Optional[str] = None
    job_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_period: Optional[str] = None
    working_hours: Optional[str] = None
    benefits: Optional[List[str]] = None
    status: Optional[str] = None  # DRAFT, PUBLISHED, CLOSED — moderation_status is admin-only


class JobResponse(BaseModel):
    id: str
    employer_id: str
    title: str
    sector: str
    sub_sector: Optional[str] = None
    employment_type: str
    vacancies: int
    description: str
    required_skills: List[str]
    experience_min: int
    experience_max: int
    education: Optional[str] = None
    job_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    salary_min: float
    salary_max: float
    salary_period: str
    working_hours: Optional[str] = None
    benefits: List[str]
    status: str
    moderation_status: str
    moderation_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    items: List[JobResponse]
    total: int


class JobApplicationCreate(BaseModel):
    cover_message: Optional[str] = Field(default=None, max_length=500)
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None


class JobApplicationStatusUpdate(BaseModel):
    status: str  # SHORTLISTED, REJECTED, INTERVIEW_SCHEDULED, HIRED


class JobApplicationResponse(BaseModel):
    id: str
    job_id: str
    seeker_id: str
    employer_id: str
    cover_message: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime


class JobApplicationListResponse(BaseModel):
    items: List[JobApplicationResponse]
    total: int


class WalkInDriveCreate(BaseModel):
    drive_date: datetime
    time_slots: List[str] = Field(default_factory=list)
    address: str
    capacity_per_slot: int
    instructions: Optional[str] = None


class WalkInDriveResponse(BaseModel):
    id: str
    employer_id: str
    job_id: str
    drive_date: datetime
    time_slots: List[str]
    address: str
    capacity_per_slot: int
    instructions: Optional[str] = None
    checked_in_count: int
    created_at: datetime


class WalkInDriveListResponse(BaseModel):
    items: List[WalkInDriveResponse]
    total: int


class WalkInCheckInRequest(BaseModel):
    slot: str
