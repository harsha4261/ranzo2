import asyncio
import json
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.redis import redis_client
from app.services.ws_manager import ws_manager
from app.api.v1.bookings import _to_booking_response
from fastapi.encoders import jsonable_encoder

class MatchmakingService:
    def __init__(self):
        # Key to store the geospatial locations of all online technicians
        self.GEO_KEY = "technicians:locations"

    async def update_technician_location(self, technician_id: str, longitude: float, latitude: float):
        """Update live location in Redis Geo."""
        # Redis GEOADD syntax: GEOADD key longitude latitude member
        await redis_client.geoadd(self.GEO_KEY, (longitude, latitude, technician_id))

    async def remove_technician(self, technician_id: str):
        """Remove a technician from the active pool if they go offline."""
        await redis_client.zrem(self.GEO_KEY, technician_id)

    async def broadcast_booking(self, booking_doc: dict, db: AsyncIOMotorDatabase):
        """
        Executes the Radius-Expansion algorithm asynchronously.
        Does not block the main thread.
        """
        asyncio.create_task(self._radius_expansion_worker(booking_doc, db))

    async def _radius_expansion_worker(self, booking_doc: dict, db: AsyncIOMotorDatabase):
        """
        Starts at 3km, expands to 5km, then 15km, waiting 45s between each stage for
        an acceptance. If nobody accepts by the end of the last stage, the booking
        expires and the customer is notified.
        """
        radiuses = [3, 5, 15]
        booking_id = booking_doc["_id"]
        category = booking_doc["category"]
        customer_id = booking_doc["customer_id"]
        longitude = booking_doc["location"]["coordinates"][0]
        latitude = booking_doc["location"]["coordinates"][1]

        for radius in radiuses:
            # Stop expanding if the booking was already accepted (or cancelled) elsewhere.
            current = await db.bookings.find_one({"_id": booking_id}, {"status": 1})
            if not current or current.get("status") != "BROADCASTING":
                return

            # GEORADIUS key longitude latitude radius m|km|ft|mi
            nearby_techs = await redis_client.georadius(
                self.GEO_KEY,
                longitude,
                latitude,
                radius,
                unit="km"
            )
            print(f"[MATCHMAKER] GEORADIUS at {longitude}, {latitude} radius {radius}km returned: {nearby_techs}")

            if nearby_techs:
                # Filter technicians by skill (case insensitive to match database format)
                valid_techs_cursor = db.technician_profiles.find({
                    "user_id": {"$in": nearby_techs},
                    "skills": category.lower()
                })
                valid_tech_docs = await valid_techs_cursor.to_list(length=None)
                valid_tech_ids = [doc["user_id"] for doc in valid_tech_docs]

                if valid_tech_ids:
                    payload = jsonable_encoder(_to_booking_response(booking_doc, ""))
                    payload["radius_tried"] = radius
                    print(f"[MATCHMAKER] Notifying techs: {valid_tech_ids}")
                    await ws_manager.notify_users(valid_tech_ids, "new_booking", payload)
                else:
                    print(f"[MATCHMAKER] No technicians with skill '{category}' found within {radius}km!")
            else:
                print(f"[MATCHMAKER] No technicians found within {radius}km!")

            await asyncio.sleep(45)

        # Max radius exhausted with no acceptance — expire the booking.
        expired = await db.bookings.find_one_and_update(
            {"_id": booking_id, "status": "BROADCASTING"},
            {"$set": {"status": "EXPIRED"}},
            return_document=True,
        )
        if expired:
            print(f"[MATCHMAKER] Booking {booking_id} EXPIRED after exhausting all radiuses")
            payload = jsonable_encoder(_to_booking_response(expired, customer_id))
            await ws_manager.notify_users([customer_id], "booking_updated", payload)

matchmaker = MatchmakingService()
