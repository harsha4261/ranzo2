from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field


def _new_id() -> str:
    return str(ObjectId())


class OTPDocument(BaseModel):
    id: str = Field(default_factory=_new_id, alias="_id")
    phone: str
    code: str
    purpose: str          # register | login | forgot_password
    expires_at: datetime  # now + OTP_TTL_SECONDS
    used: bool = False
    verified: bool = False
    verified_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}

    def to_db(self) -> dict:
        return self.model_dump(by_alias=True)
