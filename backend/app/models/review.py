from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field

def _new_id() -> str:
    return str(ObjectId())

class ReviewDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    customer_id: str
    technician_id: str
    booking_id: str
    customer_rating: Optional[int] = None
    technician_rating: Optional[int] = None
    customer_review: Optional[str] = None
    technician_review: Optional[str] = None
    dispute_raised: bool = False
    dispute_reason: Optional[str] = None
    dispute_status: Optional[str] = None  # OPEN, RESOLVED, REFUNDED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)
