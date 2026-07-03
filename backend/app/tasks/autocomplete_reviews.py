import asyncio
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings


async def run_autocomplete_reviews_on_db(db: AsyncIOMotorDatabase) -> int:
    """
    Searches for bookings in 'PENDING_RATING' state for more than 24 hours and
    forces them to 'COMPLETED'. Ensures that if one party forgets to rate, the
    job is not permanently stuck. Returns the number of bookings completed.

    Called both from the FastAPI app's hourly background loop (main.py) and
    from the standalone script below (useful for an external cron/manual run).
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)

    result = await db.bookings.update_many(
        {
            "status": "PENDING_RATING",
            "timeline.completed_at": {"$lt": cutoff_time},
        },
        {"$set": {"status": "COMPLETED"}},
    )
    if result.modified_count:
        print(f"Auto-completed {result.modified_count} stale bookings.")
    return result.modified_count


async def run_autocomplete_reviews():
    """Standalone entrypoint — opens its own Mongo connection, for external cron use."""
    print("Starting auto-complete reviews task...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    try:
        await run_autocomplete_reviews_on_db(db)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(run_autocomplete_reviews())
