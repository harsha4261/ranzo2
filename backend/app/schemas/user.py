from datetime import datetime
from typing import List

from pydantic import BaseModel


class UserSummaryResponse(BaseModel):
    id: str
    name: str
    phone: str
    registered_roles: List[str]
    is_admin: bool = False
    created_at: datetime
