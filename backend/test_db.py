import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017/?directConnection=true")
    db = client["ranzo"]
    profile = await db.technician_profiles.find_one()
    print(profile)

asyncio.run(main())
