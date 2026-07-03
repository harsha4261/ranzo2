from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

class ReviewCreate(BaseModel):
    booking_id: str
    # One of them will be provided based on the role
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None

class DisputeCreate(BaseModel):
    reason: str = Field(..., min_length=3, max_length=1000)


class ReviewResponse(BaseModel):
    id: str
    customer_id: str
    technician_id: str
    booking_id: str
    customer_rating: Optional[int]
    technician_rating: Optional[int]
    customer_review: Optional[str]
    technician_review: Optional[str]
    dispute_raised: bool = False
    dispute_reason: Optional[str] = None
    dispute_status: Optional[str] = None
    created_at: datetime
