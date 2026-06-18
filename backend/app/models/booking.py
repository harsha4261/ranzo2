from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from pydantic import BaseModel, Field

def _new_id() -> str:
    return str(ObjectId())

class BookingDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    customer_id: str
    technician_id: Optional[str] = None
    category: str
    location: str
    location_coords: List[float]  # [longitude, latitude]
    status: str = "searching"  # searching, pending_selection, in_progress, completed, cancelled
    accepted_technicians: List[str] = Field(default_factory=list)
    booking_datetime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)
