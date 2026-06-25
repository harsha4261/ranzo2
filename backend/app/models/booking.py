from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from pydantic import BaseModel, Field

def _new_id() -> str:
    return str(ObjectId())

class AddressDetails(BaseModel):
    house_flat: str
    landmark: str
    city: str
    zip_code: str

class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

class Verification(BaseModel):
    start_otp: Optional[str] = None
    end_otp: Optional[str] = None

class Timeline(BaseModel):
    booked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    accepted_at: Optional[datetime] = None
    in_transit_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class BookingDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    customer_id: str
    technician_id: Optional[str] = None
    status: str = "CREATED"  # CREATED, BROADCASTING, TECH_ACCEPTED, CUSTOMER_CONFIRMED, IN_TRANSIT, IN_PROGRESS, COMPLETED, CANCELLED_BY_CUSTOMER, CANCELLED_BY_TECH, EXPIRED, DISPUTED
    category: str
    location: Location
    address_details: AddressDetails
    problem_description: str
    images: List[str] = Field(default_factory=list)
    urgency_level: str = "NORMAL" # LOW, NORMAL, HIGH, EMERGENCY
    verification: Verification = Field(default_factory=Verification)
    timeline: Timeline = Field(default_factory=Timeline)
    
    # Internal fields for system logic
    broadcast_radius: int = 3 # km
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)
