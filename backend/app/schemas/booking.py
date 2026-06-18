from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

class BookingCreate(BaseModel):
    category: str
    # location and coordinates are taken from the customer's profile directly to simplify the payload
    # or the frontend can send them. Since customer profile might be old, let's allow frontend to send them.
    location: str
    latitude: float
    longitude: float

class BookingResponse(BaseModel):
    id: str
    customer_id: str
    technician_id: Optional[str]
    category: str
    location: str
    latitude: float
    longitude: float
    status: str
    accepted_technicians: List[str]
    booking_datetime: datetime

class BookingUpdate(BaseModel):
    status: str
