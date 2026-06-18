from motor.motor_asyncio import AsyncIOMotorDatabase


async def init_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create MongoDB indexes. Called once on application startup."""

    # users ── unique phone for fast auth lookups
    await db.users.create_index("phone", unique=True)

    # otps ── compound index for OTP verification queries
    await db.otps.create_index([("phone", 1), ("purpose", 1), ("used", 1)])
    # TTL index: MongoDB auto-deletes OTP docs 10 minutes after expires_at
    await db.otps.create_index("expires_at", expireAfterSeconds=600)

    # profiles ── one doc per user per role
    await db.customer_profiles.create_index("user_id", unique=True)
    await db.technician_profiles.create_index("user_id", unique=True)
    await db.technician_profiles.create_index([("location_coords", "2dsphere")])
    await db.seeker_profiles.create_index("user_id", unique=True)
    await db.employer_profiles.create_index("user_id", unique=True)
