from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_user_id, get_db
from app.models.review import ReviewDocument
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter()

def _to_review_response(doc: dict) -> ReviewResponse:
    return ReviewResponse(
        id=doc["_id"],
        customer_id=doc["customer_id"],
        technician_id=doc["technician_id"],
        booking_id=doc["booking_id"],
        customer_rating=doc.get("customer_rating"),
        technician_rating=doc.get("technician_rating"),
        customer_review=doc.get("customer_review"),
        technician_review=doc.get("technician_review"),
        created_at=doc["created_at"]
    )

@router.post("/", response_model=ReviewResponse)
async def create_review(
    payload: ReviewCreate,
    role: str, # "customer" or "technician"
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    booking = await db.bookings.find_one({"_id": payload.booking_id})
    if not booking:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    
    if booking["status"] not in ["PENDING_RATING", "COMPLETED"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Can only review jobs in PENDING_RATING or COMPLETED state")

    if role == "customer" and booking["customer_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your booking")
    
    if role == "technician" and booking.get("technician_id") != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your booking")

    # Check if a review already exists for this booking
    review_doc = await db.reviews.find_one({"booking_id": payload.booking_id})

    is_customer_rating = False
    is_technician_rating = False

    if review_doc:
        # Update existing review
        update_data = {}
        if role == "customer":
            update_data["customer_rating"] = payload.rating
            update_data["customer_review"] = payload.review
            is_customer_rating = True
            is_technician_rating = review_doc.get("technician_rating") is not None
        else:
            update_data["technician_rating"] = payload.rating
            update_data["technician_review"] = payload.review
            is_technician_rating = True
            is_customer_rating = review_doc.get("customer_rating") is not None
            
        await db.reviews.update_one({"_id": review_doc["_id"]}, {"$set": update_data})
        doc = await db.reviews.find_one({"_id": review_doc["_id"]})
    else:
        # Create new review
        review = ReviewDocument(
            customer_id=booking["customer_id"],
            technician_id=booking["technician_id"],
            booking_id=payload.booking_id
        )
        doc = review.to_db()
        if role == "customer":
            doc["customer_rating"] = payload.rating
            doc["customer_review"] = payload.review
            is_customer_rating = True
        else:
            doc["technician_rating"] = payload.rating
            doc["technician_review"] = payload.review
            is_technician_rating = True
            
        await db.reviews.insert_one(doc)

    # Check if BOTH ratings are present and move booking to COMPLETED if so
    if is_customer_rating and is_technician_rating and booking["status"] == "PENDING_RATING":
        await db.bookings.update_one(
            {"_id": booking["_id"]},
            {"$set": {"status": "COMPLETED"}}
        )

    return _to_review_response(doc)

@router.get("/{booking_id}", response_model=ReviewResponse)
async def get_review(
    booking_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.reviews.find_one({"booking_id": booking_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    
    if doc["customer_id"] != user_id and doc["technician_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your review")

    return _to_review_response(doc)
