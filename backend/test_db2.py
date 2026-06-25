import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27016/?directConnection=true")
    db = client["ranzo"]
    async for profile in db.technician_profiles.find({"skills": {"$ne": []}}):
        print(profile)

asyncio.run(main())
