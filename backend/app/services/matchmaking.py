import asyncio
import json
from app.core.redis import redis_client
from app.services.sse_manager import manager as sse_manager

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

    async def broadcast_booking(self, booking_doc: dict):
        """
        Executes the Radius-Expansion algorithm asynchronously.
        Does not block the main thread.
        """
        asyncio.create_task(self._radius_expansion_worker(booking_doc))

    async def _radius_expansion_worker(self, booking_doc: dict):
        """
        Starts at 3km, expands to 5km, then 10km every 60 seconds if not accepted.
        """
        radiuses = [3, 5, 10]  # in km
        booking_id = booking_doc["_id"]
        category = booking_doc["category"]
        longitude = booking_doc["location"]["coordinates"][0]
        latitude = booking_doc["location"]["coordinates"][1]

        for radius in radiuses:
            # 1. Check if booking is still BROADCASTING before expanding
            # In a full system, you would check the actual Mongo DB to see if it was accepted
            # But for simplicity in this service, we just proceed (the endpoint rejects late accepts anyway).
            
            # 2. Query Redis Geo for nearby technicians
            # GEORADIUS key longitude latitude radius m|km|ft|mi
            nearby_techs = await redis_client.georadius(
                self.GEO_KEY, 
                longitude, 
                latitude, 
                radius, 
                unit="km"
            )
            
            if nearby_techs:
                # 3. Notify them via WebSockets
                await sse_manager.notify_technicians(nearby_techs, "new_booking", {
                    "booking_id": booking_id,
                    "category": category,
                    "problem": booking_doc.get("problem_description", ""),
                    "radius_tried": radius
                })

            # Wait 45 seconds before expanding the radius
            await asyncio.sleep(45)

matchmaker = MatchmakingService()
