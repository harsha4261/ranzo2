import asyncio
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

async def run_autocomplete_reviews():
    """
    Cron job function that searches for bookings in 'PENDING_RATING' state
    for more than 24 hours and forces them to 'COMPLETED'.
    
    This fulfills the business logic to ensure that if one party forgets to rate,
    the job is not permanently stuck.
    """
    print("Starting auto-complete reviews task...")
    
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
    
    # Find all bookings in PENDING_RATING where completed_at is older than 24 hours
    cursor = db.bookings.find({
        "status": "PENDING_RATING",
        "timeline.completed_at": {"$lt": cutoff_time}
    })
    
    stale_bookings = await cursor.to_list(length=1000)
    count = 0
    
    for booking in stale_bookings:
        # Force transition to COMPLETED
        await db.bookings.update_one(
            {"_id": booking["_id"]},
            {"$set": {"status": "COMPLETED"}}
        )
        count += 1
        
    print(f"Auto-completed {count} stale bookings.")
    client.close()

if __name__ == "__main__":
    asyncio.run(run_autocomplete_reviews())
