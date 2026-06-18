from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

class ReviewCreate(BaseModel):
    booking_id: str
    # One of them will be provided based on the role
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    customer_id: str
    technician_id: str
    booking_id: str
    customer_rating: Optional[int]
    technician_rating: Optional[int]
    customer_review: Optional[str]
    technician_review: Optional[str]
    created_at: datetime
