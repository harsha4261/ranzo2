import asyncio
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.api.deps import get_current_user_id, get_db
from app.models.booking import BookingDocument
from app.schemas.booking import BookingCreate, BookingResponse, BookingUpdate
from app.services.sse_manager import manager as sse_manager

router = APIRouter()

def _to_booking_response(doc: dict) -> BookingResponse:
    return BookingResponse(
        id=doc["_id"],
        customer_id=doc["customer_id"],
        technician_id=doc.get("technician_id"),
        category=doc["category"],
        location=doc["location"],
        longitude=doc["location_coords"][0],
        latitude=doc["location_coords"][1],
        status=doc["status"],
        accepted_technicians=doc.get("accepted_technicians", []),
        booking_datetime=doc["booking_datetime"]
    )

@router.post("/", response_model=BookingResponse)
async def create_booking(
    payload: BookingCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Create booking doc
    booking = BookingDocument(
        customer_id=user_id,
        category=payload.category,
        location=payload.location,
        location_coords=[payload.longitude, payload.latitude],
        status="searching"
    )
    doc = booking.to_db()
    await db.bookings.insert_one(doc)

    # Find active technicians in the category within 10km
    # Using MongoDB geoNear or $geoWithin
    radius_in_meters = 10000
    cursor = db.technician_profiles.find({
        "online_status": True,
        "skills": payload.category,  # we assume skills contains category
        "location_coords": {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [payload.longitude, payload.latitude]
                },
                "$maxDistance": radius_in_meters
            }
        }
    })
    
    techs = await cursor.to_list(length=100)
    tech_ids = [t["user_id"] for t in techs]

    if tech_ids:
        # Notify them via SSE
        await sse_manager.notify_technicians(tech_ids, "new_booking", {
            "booking_id": doc["_id"],
            "category": doc["category"],
            "location": doc["location"],
            "customer_id": doc["customer_id"],
            "booking_datetime": doc["booking_datetime"].isoformat()
        })

    return _to_booking_response(doc)

@router.get("/active", response_model=List[BookingResponse])
async def get_active_bookings(
    role: str,  # "customer" or "technician"
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {"status": {"$in": ["searching", "pending_selection", "in_progress"]}}
    if role == "customer":
        query["customer_id"] = user_id
    else:
        # For technician, active means they are either the assigned technician OR they accepted it and it's pending selection
        query["$or"] = [
            {"technician_id": user_id},
            {"accepted_technicians": user_id, "status": "pending_selection"}
        ]
        
    cursor = db.bookings.find(query).sort("booking_datetime", -1)
    docs = await cursor.to_list(length=100)
    return [_to_booking_response(d) for d in docs]

@router.get("/history", response_model=List[BookingResponse])
async def get_history_bookings(
    role: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {"status": {"$in": ["completed", "cancelled"]}}
    if role == "customer":
        query["customer_id"] = user_id
    else:
        query["technician_id"] = user_id
        
    cursor = db.bookings.find(query).sort("booking_datetime", -1)
    docs = await cursor.to_list(length=100)
    return [_to_booking_response(d) for d in docs]

@router.post("/{booking_id}/accept")
async def accept_booking(
    booking_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.bookings.find_one({"_id": booking_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    
    if doc["status"] not in ["searching", "pending_selection"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Booking is no longer accepting requests")

    if user_id in doc.get("accepted_technicians", []):
        return {"msg": "Already accepted"}

    await db.bookings.update_one(
        {"_id": booking_id},
        {
            "$addToSet": {"accepted_technicians": user_id},
            "$set": {"status": "pending_selection"}
        }
    )

    # Notify customer if needed (could be SSE for customer, but we'll let them poll for now or they just see it on refresh)
    return {"msg": "Accepted successfully"}

@router.post("/{booking_id}/confirm")
async def confirm_technician(
    booking_id: str,
    technician_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.bookings.find_one({"_id": booking_id, "customer_id": user_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    
    if doc["status"] != "pending_selection":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Booking not in a state to confirm technician")

    if technician_id not in doc.get("accepted_technicians", []):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Technician hasn't accepted this booking")

    await db.bookings.update_one(
        {"_id": booking_id},
        {
            "$set": {
                "technician_id": technician_id,
                "status": "in_progress"
            }
        }
    )

    return {"msg": "Technician confirmed successfully"}

@router.get("/stream")
async def sse_stream(user_id: str = Depends(get_current_user_id)):
    """
    SSE stream for technicians to listen for incoming booking requests.
    """
    async def event_generator():
        q = sse_manager.connect(user_id)
        try:
            while True:
                data = await q.get()
                yield data
        except asyncio.CancelledError:
            sse_manager.disconnect(user_id, q)
            raise

    return StreamingResponse(event_generator(), media_type="text/event-stream")
