from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field

def _new_id() -> str:
    return str(ObjectId())

class TechnicianWalletDocument(BaseModel):
    technician_id: str = Field(alias="_id") # Use tech ID as primary key
    balance: float = 0.0
    currency: str = "INR"
    status: str = "ACTIVE" # ACTIVE, SUSPENDED_LOW_BALANCE
    last_recharge_date: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)

class WalletTransactionDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    technician_id: str
    type: str # CREDIT, DEBIT, REFUND
    amount: float
    running_balance: float
    description: str
    related_booking_id: Optional[str] = None
    idempotency_key: str # Unique key to prevent double processing
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)
