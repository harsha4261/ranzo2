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

    # wallet ── idempotency_key is unique so a hold/refund/fee can never be double-applied
    await db.wallet_transactions.create_index("idempotency_key", unique=True)
    await db.wallet_transactions.create_index("technician_id")

    # bookings ── status/customer/technician for admin & active-bookings queries.
    # (No geo index here: matchmaking does proximity search via Redis GEORADIUS,
    # not Mongo, so a 2dsphere index on bookings.location would be unused — and
    # unlike a fresh collection, `location` isn't guaranteed to be well-formed
    # GeoJSON on every historical document, which would fail the index build.)
    await db.bookings.create_index("status")
    await db.bookings.create_index("customer_id")
    await db.bookings.create_index("technician_id")

    # job portal
    await db.jobs.create_index("employer_id")
    await db.jobs.create_index("status")
    await db.jobs.create_index([("sector", 1), ("status", 1)])
    await db.job_applications.create_index([("job_id", 1), ("seeker_id", 1)], unique=True)
    await db.job_applications.create_index("seeker_id")
    await db.walk_in_drives.create_index("employer_id")
    await db.walk_in_drives.create_index("job_id")

    # admin audit trail
    await db.audit_logs.create_index("created_at")
    await db.audit_logs.create_index("admin_id")

    # reviews/disputes
    await db.reviews.create_index("booking_id", unique=True)
    await db.reviews.create_index("dispute_status")
