import uuid
from datetime import datetime, timezone
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase


async def log_admin_action(
    db: AsyncIOMotorDatabase,
    admin_id: str,
    action: str,
    target: str,
    details: Optional[dict] = None,
) -> None:
    """Insert a record into db.audit_logs for an admin-initiated mutation."""
    await db.audit_logs.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "admin_id": admin_id,
            "action": action,
            "target": target,
            "details": details or {},
            "created_at": datetime.now(timezone.utc),
        }
    )
