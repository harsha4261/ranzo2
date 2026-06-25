from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

class AddressDetails(BaseModel):
    house_flat: str
    landmark: str
    city: str
    zip_code: str

class Location(BaseModel):
    latitude: float
    longitude: float

class BookingCreate(BaseModel):
    category: str
    location: Location
    address_details: AddressDetails
    problem_description: str
    images: Optional[List[str]] = []
    urgency_level: str = "NORMAL"

class TimelineResponse(BaseModel):
    booked_at: datetime
    accepted_at: Optional[datetime] = None
    in_transit_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class VerificationResponse(BaseModel):
    start_otp: str
    end_otp: str

class BookingResponse(BaseModel):
    id: str
    customer_id: str
    technician_id: Optional[str]
    status: str
    category: str
    location: Location
    address_details: AddressDetails
    problem_description: str
    images: List[str]
    urgency_level: str
    timeline: TimelineResponse
    verification: Optional[VerificationResponse] = None
    created_at: datetime
    updated_at: datetime

class BookingStateUpdate(BaseModel):
    status: str
    otp: Optional[str] = None # Used for starting/completing a job
