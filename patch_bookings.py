import re

with open("backend/app/api/v1/bookings.py", "r") as f:
    content = f.read()

# Update import
content = content.replace("TimelineResponse", "TimelineResponse, VerificationResponse")

# Update _to_booking_response signature and body
new_to_booking_response = """def _to_booking_response(doc: dict, current_user_id: str = None) -> BookingResponse:
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
        location=Location(**doc["location"]),
        address_details=AddressDetails(**doc.get("address_details", {})),
        problem_description=doc.get("problem_description", ""),
        images=doc.get("images", []),
        urgency_level=doc.get("urgency_level", "NORMAL"),
        timeline=TimelineResponse(**timeline),
        verification=verification,
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc))
    )"""

content = re.sub(r"def _to_booking_response\(doc: dict\) -> BookingResponse:.*?(?=@router\.post)", new_to_booking_response + "\n\n", content, flags=re.DOTALL)

# Update calls to _to_booking_response
content = content.replace("return _to_booking_response(doc)", "return _to_booking_response(doc, user_id)")
content = content.replace("return {\"msg\": \"Accepted successfully\", \"booking\": _to_booking_response(updated)}", "return {\"msg\": \"Accepted successfully\", \"booking\": _to_booking_response(updated, user_id)}")
content = content.replace("return [_to_booking_response(d) for d in docs]", "return [_to_booking_response(d, user_id) for d in docs]")

# Add /transit endpoint before /start
transit_endpoint = """@router.post("/{booking_id}/transit")
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

"""
content = content.replace("@router.post(\"/{booking_id}/start\")", transit_endpoint + "@router.post(\"/{booking_id}/start\")")

with open("backend/app/api/v1/bookings.py", "w") as f:
    f.write(content)
print("Bookings patched successfully")
