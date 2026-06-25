import asyncio
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.api.deps import get_current_user_id, get_db
from app.models.booking import BookingDocument, Location, AddressDetails, Timeline, Verification
from app.schemas.booking import BookingCreate, BookingResponse, BookingStateUpdate, TimelineResponse, VerificationResponse
from app.services.sse_manager import manager as sse_manager

router = APIRouter()

def _to_booking_response(doc: dict, current_user_id: str = None) -> BookingResponse:
    # Handle older docs that might not have new fields
    timeline = doc.get("timeline", {})
    
    verification = None
    if current_user_id and doc.get("customer_id") == current_user_id:
        v_doc = doc.get("verification", {})
        if v_doc.get("start_otp") and v_doc.get("end_otp"):
            verification = VerificationResponse(start_otp=v_doc["start_otp"], end_otp=v_doc["end_otp"])
            
    return BookingResponse(
        id=doc["_id"],
        customer_id=doc["customer_id"],
        technician_id=doc.get("technician_id"),
        status=doc.get("status", "CREATED"),
        category=doc["category"],
        location={"longitude": doc["location"]["coordinates"][0], "latitude": doc["location"]["coordinates"][1]},
        address_details=doc.get("address_details", {}),
        problem_description=doc.get("problem_description", ""),
        images=doc.get("images", []),
        urgency_level=doc.get("urgency_level", "NORMAL"),
        timeline=TimelineResponse(**timeline),
        verification=verification,
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc))
    )

@router.post("/", response_model=BookingResponse)
async def create_booking(
    payload: BookingCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Generates a basic random 4-digit OTP for Start/End
    import random
    start_otp = str(random.randint(1000, 9999))
    end_otp = str(random.randint(1000, 9999))
    
    booking = BookingDocument(
        customer_id=user_id,
        category=payload.category,
        location={"type": "Point", "coordinates": [payload.location.longitude, payload.location.latitude]},
        address_details=payload.address_details.model_dump(),
        problem_description=payload.problem_description,
        images=payload.images or [],
        urgency_level=payload.urgency_level,
        status="CREATED",
        verification=Verification(start_otp=start_otp, end_otp=end_otp),
        timeline=Timeline(booked_at=datetime.now(timezone.utc))
    )
    
    doc = booking.to_db()
    await db.bookings.insert_one(doc)
    
    # Update state to BROADCASTING 
    await db.bookings.update_one({"_id": doc["_id"]}, {"$set": {"status": "BROADCASTING"}})
    doc["status"] = "BROADCASTING"

    # Trigger the asynchronous Redis Radius-Expansion algorithm
    from app.services.matchmaking import matchmaker
    await matchmaker.broadcast_booking(doc)

    return _to_booking_response(doc, user_id)

@router.post("/{booking_id}/accept")
async def accept_booking(
    booking_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Pre-condition: Check Wallet Escrow >= 50
    wallet = await db.technician_wallets.find_one({"_id": user_id})
    if not wallet or wallet.get("balance", 0) < 50:
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "Insufficient wallet balance (Min 50 Rs required)")

    doc = await db.bookings.find_one({"_id": booking_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    
    if doc["status"] != "BROADCASTING":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Booking is no longer broadcasting")

    # Atomic Lock: Use find_one_and_update to prevent race conditions
    updated = await db.bookings.find_one_and_update(
        {"_id": booking_id, "status": "BROADCASTING"},
        {
            "$set": {
                "technician_id": user_id,
                "status": "TECH_ACCEPTED",
                "timeline.accepted_at": datetime.now(timezone.utc)
            }
        },
        return_document=True
    )
    
    if not updated:
        raise HTTPException(status.HTTP_409_CONFLICT, "Another technician already accepted this booking")

    return {"msg": "Accepted successfully", "booking": _to_booking_response(updated, user_id)}

@router.post("/{booking_id}/confirm")
async def confirm_technician(
    booking_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.bookings.find_one({"_id": booking_id, "customer_id": user_id})
    if not doc or doc["status"] != "TECH_ACCEPTED":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot confirm right now")

    updated = await db.bookings.find_one_and_update(
        {"_id": booking_id},
        {"$set": {"status": "CUSTOMER_CONFIRMED"}}
    )
    return {"msg": "Confirmed successfully"}

@router.post("/{booking_id}/transit")
async def start_transit(
    booking_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.bookings.find_one({"_id": booking_id, "technician_id": user_id})
    if not doc or doc["status"] != "CUSTOMER_CONFIRMED":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid state to start transit")

    await db.bookings.update_one(
        {"_id": booking_id},
        {"$set": {"status": "IN_TRANSIT", "timeline.in_transit_at": datetime.now(timezone.utc)}}
    )
    return {"msg": "In transit"}

@router.post("/{booking_id}/start")
async def start_job(
    booking_id: str,
    payload: BookingStateUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.bookings.find_one({"_id": booking_id, "technician_id": user_id})
    if not doc or doc["status"] not in ["CUSTOMER_CONFIRMED", "IN_TRANSIT"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid state to start")
        
    if doc["verification"]["start_otp"] != payload.otp:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Start OTP")

    await db.bookings.update_one(
        {"_id": booking_id},
        {"$set": {"status": "IN_PROGRESS", "timeline.started_at": datetime.now(timezone.utc)}}
    )
    return {"msg": "Job started"}

@router.post("/{booking_id}/complete")
async def complete_job(
    booking_id: str,
    payload: BookingStateUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.bookings.find_one({"_id": booking_id, "technician_id": user_id})
    if not doc or doc["status"] != "IN_PROGRESS":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid state to complete")
        
    if doc["verification"]["end_otp"] != payload.otp:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid End OTP")

    # Escrow Deduction
    wallet = await db.technician_wallets.find_one_and_update(
        {"_id": user_id},
        {"$inc": {"balance": -50}},
        return_document=True
    )
    
    import uuid
    transaction = {
        "_id": str(uuid.uuid4()),
        "technician_id": user_id,
        "type": "DEBIT",
        "amount": 50,
        "running_balance": wallet["balance"] if wallet else 0,
        "description": f"Platform Fee for booking {booking_id}",
        "related_booking_id": booking_id,
        "idempotency_key": f"fee_{booking_id}",
        "created_at": datetime.now(timezone.utc)
    }
    await db.wallet_transactions.insert_one(transaction)

    await db.bookings.update_one(
        {"_id": booking_id},
        {"$set": {"status": "PENDING_RATING", "timeline.completed_at": datetime.now(timezone.utc)}}
    )
    return {"msg": "Job work finished, wallet debited. Pending ratings from both sides."}

@router.post("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    role: str, # "customer" or "technician"
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.bookings.find_one({"_id": booking_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")

    if doc["status"] in ["COMPLETED", "PENDING_RATING", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_TECH", "EXPIRED"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot cancel this booking at its current state.")

    # Validate ownership
    if role == "customer" and doc["customer_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your booking")
    if role == "technician" and doc.get("technician_id") != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your booking")

    # Enforce penalty if cancelled AFTER confirmation (meaning tech and customer both committed)
    if doc["status"] in ["CUSTOMER_CONFIRMED", "IN_TRANSIT", "IN_PROGRESS"]:
        technician_id = doc.get("technician_id")
        if technician_id:
            wallet = await db.technician_wallets.find_one_and_update(
                {"_id": technician_id},
                {"$inc": {"balance": -50}},
                return_document=True
            )
            import uuid
            transaction = {
                "_id": str(uuid.uuid4()),
                "technician_id": technician_id,
                "type": "DEBIT",
                "amount": 50,
                "running_balance": wallet["balance"] if wallet else 0,
                "description": f"Cancellation Penalty for booking {booking_id}",
                "related_booking_id": booking_id,
                "idempotency_key": f"penalty_{booking_id}",
                "created_at": datetime.now(timezone.utc)
            }
            await db.wallet_transactions.insert_one(transaction)

    new_status = "CANCELLED_BY_CUSTOMER" if role == "customer" else "CANCELLED_BY_TECH"
    await db.bookings.update_one(
        {"_id": booking_id},
        {"$set": {"status": new_status}}
    )
    return {"msg": f"Booking cancelled. Status: {new_status}"}

@router.get("/active", response_model=List[BookingResponse])
async def get_active_bookings(
    role: str,  # "customer" or "technician"
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    active_statuses = ["CREATED", "BROADCASTING", "TECH_ACCEPTED", "CUSTOMER_CONFIRMED", "IN_TRANSIT", "IN_PROGRESS"]
    query = {"status": {"$in": active_statuses}}
    if role == "customer":
        query["customer_id"] = user_id
    else:
        query["$or"] = [
            {"technician_id": user_id},
            {"status": "BROADCASTING"} # Techs can see broadcasting ones, though usually SSE handles it
        ]
        
    cursor = db.bookings.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return [_to_booking_response(d, user_id) for d in docs]

@router.get("/history", response_model=List[BookingResponse])
async def get_history_bookings(
    role: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    history_statuses = ["PENDING_RATING", "COMPLETED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_TECH", "EXPIRED", "DISPUTED"]
    query = {"status": {"$in": history_statuses}}
    if role == "customer":
        query["customer_id"] = user_id
    else:
        query["technician_id"] = user_id
        
    cursor = db.bookings.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return [_to_booking_response(d, user_id) for d in docs]

@router.get("/stream")
async def sse_stream(user_id: str = Depends(get_current_user_id)):
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
