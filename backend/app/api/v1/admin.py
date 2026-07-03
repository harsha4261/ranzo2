import uuid
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from app.core.security import verify_password, create_access_token
from app.services import user_service
from app.services.audit import log_admin_action
from app.schemas.auth import TokenResponse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, get_current_user_id
from app.api.v1.bookings import ESCROW_HOLD_AMOUNT, _to_booking_response
from app.schemas.profile import TechnicianProfileResponse
from app.schemas.auth import MessageResponse
router = APIRouter()

class AdminLoginRequest(BaseModel):
    phone: str
    password: str

@router.post("/auth/login", response_model=TokenResponse, summary="Admin Web Login")
async def admin_login(
    body: AdminLoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    user = await user_service.get_user_by_phone(body.phone, db)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
        
    if not user.get("is_admin", False):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
        
    return TokenResponse(access_token=create_access_token(str(user["_id"])))

async def verify_admin(user_id: str = Depends(get_current_user_id), db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"_id": user_id})
    if not user or not user.get("is_admin", False):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user

@router.get("/technicians/pending", response_model=List[TechnicianProfileResponse], summary="Get pending technicians")
async def get_pending_technicians(
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin)
):
    # Find technicians who have completed their profile but are not yet approved
    cursor = db.technician_profiles.find({"is_completed": True, "is_approved": False})
    profiles = await cursor.to_list(length=100)
    
    for p in profiles:
        p["id"] = str(p["_id"])
    return profiles

class AdminTechnicianItem(BaseModel):
    user_id: str
    name: Optional[str] = None
    phone_number: Optional[str] = None
    business_name: Optional[str] = None
    verified: bool = False
    aadhaar_verified: bool = False
    online_status: str = "offline"

class AdminTechnicianListResponse(BaseModel):
    items: List[AdminTechnicianItem]
    total: int

@router.get("/technicians", response_model=AdminTechnicianListResponse, summary="Get all technicians")
async def get_all_technicians(
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin)
):
    cursor = db.technician_profiles.find()
    profiles = await cursor.to_list(length=1000)
    
    items = []
    for p in profiles:
        user = await db.users.find_one({"_id": p["user_id"]})
        items.append(AdminTechnicianItem(
            user_id=p["user_id"],
            name=user.get("name") if user else p.get("name_as_per_adhar"),
            phone_number=user.get("phone") if user else None,
            business_name=p.get("name_as_per_adhar"),
            verified=p.get("is_approved", False),
            aadhaar_verified=True if p.get("adhar_number") else False,
            online_status="online" if p.get("online_status") else "offline"
        ))
        
    return AdminTechnicianListResponse(items=items, total=len(items))

@router.post("/technicians/{tech_user_id}/approve", response_model=MessageResponse, summary="Approve a technician")
async def approve_technician(
    tech_user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin)
):
    result = await db.technician_profiles.update_one(
        {"user_id": tech_user_id},
        {"$set": {"is_approved": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Technician profile not found")
    await log_admin_action(db, admin["_id"], "technician_approve", tech_user_id)
    return MessageResponse(message="Technician approved successfully")

@router.post("/technicians/{tech_user_id}/reject", response_model=MessageResponse, summary="Reject a technician")
async def reject_technician(
    tech_user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin)
):
    # For rejection, we reset is_completed to False so they must fix their profile and submit again
    result = await db.technician_profiles.update_one(
        {"user_id": tech_user_id},
        {"$set": {"is_approved": False, "is_completed": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Technician profile not found")
    await log_admin_action(db, admin["_id"], "technician_reject", tech_user_id)
    return MessageResponse(message="Technician profile rejected")

@router.get("/dashboard")
async def get_dashboard(db: AsyncIOMotorDatabase = Depends(get_db), admin=Depends(verify_admin)):
    total_users = await db.users.count_documents({})
    total_technicians = await db.technician_profiles.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    total_jobs = await db.jobs.count_documents({})
    total_applications = await db.job_applications.count_documents({})
    return {
        "job_portal": {
            "total_jobs": total_jobs,
            "total_applications": total_applications
        },
        "home_services": {
            "total_users": total_users,
            "total_technicians": total_technicians,
            "total_bookings": total_bookings
        }
    }

class AdminUserItem(BaseModel):
    id: str
    name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
    created_at: Optional[str] = None
    is_details_filled: bool = False
    is_suspended: bool = False
    suspended_at: Optional[str] = None
    suspend_reason: Optional[str] = None

class AdminUserListResponse(BaseModel):
    items: List[AdminUserItem]
    total: int

@router.get("/users", response_model=AdminUserListResponse)
async def get_all_users(
    app: str = "home-services",
    q: Optional[str] = None,
    role: Optional[str] = None,
    suspended: Optional[bool] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin)
):
    query = {}
    if role: query["role"] = role
    if suspended is not None: query["is_suspended"] = suspended
    if q: query["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"phone": {"$regex": q, "$options": "i"}}]
    cursor = db.users.find(query)
    users = await cursor.to_list(length=1000)
    items = []
    for u in users:
        items.append(AdminUserItem(
            id=str(u["_id"]),
            name=u.get("name"),
            phone_number=u.get("phone"),
            role=u.get("role"),
            created_at=str(u.get("created_at")) if u.get("created_at") else None,
            is_details_filled=u.get("is_details_filled", False),
            is_suspended=u.get("is_suspended", False),
            suspended_at=str(u.get("suspended_at")) if u.get("suspended_at") else None,
            suspend_reason=u.get("suspend_reason")
        ))
    return AdminUserListResponse(items=items, total=len(items))

class SuspendRequest(BaseModel):
    suspended: bool
    reason: Optional[str] = None

@router.patch("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    body: SuspendRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin)
):
    try:
        oid = ObjectId(user_id)
    except:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid ID")
    update_data = {
        "is_suspended": body.suspended,
        "suspend_reason": body.reason if body.suspended else None,
        "suspended_at": datetime.utcnow() if body.suspended else None
    }
    result = await db.users.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    await log_admin_action(
        db, admin["_id"], "user_suspend" if body.suspended else "user_unsuspend", user_id, {"reason": body.reason}
    )
    return {"message": "User suspension updated"}

@router.get("/service-bookings")
async def list_service_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    limit = min(limit, 100)
    query = {}
    if status_filter:
        query["status"] = status_filter
    if category:
        query["category"] = category
    total = await db.bookings.count_documents(query)
    cursor = db.bookings.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return {"items": [_to_booking_response(d) for d in docs], "total": total}


@router.get("/walk-in-drives")
async def list_all_walk_in_drives(
    skip: int = 0,
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    limit = min(limit, 100)
    total = await db.walk_in_drives.count_documents({})
    cursor = db.walk_in_drives.find({}).sort("drive_date", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return {"items": docs, "total": total}


@router.get("/analytics")
async def get_analytics(db: AsyncIOMotorDatabase = Depends(get_db), admin=Depends(verify_admin)):
    total_users = await db.users.count_documents({})
    total_technicians = await db.technician_profiles.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    technicians_online = await db.technician_profiles.count_documents({"online_status": True})
    total_jobs = await db.jobs.count_documents({})
    total_applications = await db.job_applications.count_documents({})

    status_agg = await db.bookings.aggregate(
        [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    ).to_list(length=50)
    bookings_by_status = {item["_id"]: item["count"] for item in status_agg if item["_id"]}

    # Revenue = escrow holds actually taken, minus anything refunded back out (cancellations/disputes).
    debit_agg = await db.wallet_transactions.aggregate(
        [
            {"$match": {"type": "DEBIT", "description": {"$regex": "^Escrow hold"}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
    ).to_list(length=1)
    total_debit = debit_agg[0]["total"] if debit_agg else 0

    refund_agg = await db.wallet_transactions.aggregate(
        [
            {"$match": {"type": "REFUND"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
    ).to_list(length=1)
    total_refund = refund_agg[0]["total"] if refund_agg else 0

    return {
        "total_users": total_users,
        "total_technicians": total_technicians,
        "total_bookings": total_bookings,
        "bookings_by_status": bookings_by_status,
        "total_revenue": total_debit - total_refund,
        "total_jobs": total_jobs,
        "total_applications": total_applications,
        "technicians_online": technicians_online,
    }


@router.get("/disputes")
async def list_disputes(
    dispute_status: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    query = {"dispute_raised": True}
    if dispute_status:
        query["dispute_status"] = dispute_status
    cursor = db.reviews.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=500)
    return {"items": docs, "total": len(docs)}


class DisputeResolveRequest(BaseModel):
    action: str  # RESOLVE or REFUND_TECH_FEE
    note: Optional[str] = None


@router.patch("/disputes/{booking_id}")
async def resolve_dispute(
    booking_id: str,
    body: DisputeResolveRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    if body.action not in {"RESOLVE", "REFUND_TECH_FEE"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "action must be RESOLVE or REFUND_TECH_FEE")

    review_doc = await db.reviews.find_one({"booking_id": booking_id})
    if not review_doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dispute not found for this booking")

    booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")

    if body.action == "REFUND_TECH_FEE":
        technician_id = booking.get("technician_id")
        if technician_id:
            try:
                wallet = await db.technician_wallets.find_one_and_update(
                    {"_id": technician_id},
                    {"$inc": {"balance": ESCROW_HOLD_AMOUNT}},
                    return_document=True,
                )
                await db.wallet_transactions.insert_one(
                    {
                        "_id": str(uuid.uuid4()),
                        "technician_id": technician_id,
                        "type": "REFUND",
                        "amount": ESCROW_HOLD_AMOUNT,
                        "running_balance": wallet["balance"] if wallet else 0,
                        "description": f"Dispute resolution refund — booking {booking_id}",
                        "related_booking_id": booking_id,
                        "idempotency_key": f"dispute_refund_{booking_id}",
                        "created_at": datetime.now(timezone.utc),
                    }
                )
            except DuplicateKeyError:
                # Already refunded for this dispute — idempotent no-op, treat as success.
                pass
        new_dispute_status = "REFUNDED"
    else:
        new_dispute_status = "RESOLVED"

    await db.reviews.update_one({"_id": review_doc["_id"]}, {"$set": {"dispute_status": new_dispute_status}})
    await db.bookings.update_one({"_id": booking_id}, {"$set": {"status": "COMPLETED"}})

    await log_admin_action(db, admin["_id"], f"dispute_{body.action.lower()}", booking_id, {"note": body.note})

    return {"message": f"Dispute {new_dispute_status.lower()}"}


DEFAULT_APP_CONFIG = {
    "_id": "global",
    "maintenance_mode": False,
    "escrow_hold_amount": 50,
    "support_phone": None,
}


@router.get("/config")
async def get_config(db: AsyncIOMotorDatabase = Depends(get_db), admin=Depends(verify_admin)):
    config = await db.app_config.find_one({"_id": "global"})
    if not config:
        config = dict(DEFAULT_APP_CONFIG)
        await db.app_config.insert_one(config)
    return config


class ConfigUpdateRequest(BaseModel):
    maintenance_mode: Optional[bool] = None
    escrow_hold_amount: Optional[int] = None
    support_phone: Optional[str] = None


@router.patch("/config")
async def patch_config(
    body: ConfigUpdateRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")

    updated = await db.app_config.find_one_and_update(
        {"_id": "global"},
        {"$set": update_data},
        upsert=True,
        return_document=True,
    )
    await log_admin_action(db, admin["_id"], "config_update", "global", update_data)
    return updated


@router.get("/audit-log")
async def list_audit_log(
    skip: int = 0,
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    limit = min(limit, 200)
    total = await db.audit_logs.count_documents({})
    cursor = db.audit_logs.find({}).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return {"items": docs, "total": total}


@router.get("/application-logs")
async def list_application_logs(
    skip: int = 0,
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    limit = min(limit, 200)
    total = await db.job_applications.count_documents({})
    cursor = db.job_applications.find({}).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)

    items = []
    for d in docs:
        job = await db.jobs.find_one({"_id": d["job_id"]})
        seeker_user = await db.users.find_one({"_id": d["seeker_id"]})
        items.append(
            {
                "id": d["_id"],
                "job_id": d["job_id"],
                "job_title": job.get("title") if job else None,
                "seeker_id": d["seeker_id"],
                "seeker_name": seeker_user.get("name") if seeker_user else None,
                "employer_id": d["employer_id"],
                "status": d.get("status"),
                "created_at": d.get("created_at"),
            }
        )
    return {"items": items, "total": total}


@router.get("/jobs/moderation")
async def list_jobs_pending_moderation(
    skip: int = 0,
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    limit = min(limit, 100)
    query = {"moderation_status": "PENDING"}
    total = await db.jobs.count_documents(query)
    cursor = db.jobs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return {"items": docs, "total": total}


class JobModerationRequest(BaseModel):
    decision: str  # APPROVED or REJECTED
    note: Optional[str] = None


@router.patch("/jobs/{job_id}/moderation")
async def moderate_job(
    job_id: str,
    body: JobModerationRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    if body.decision not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "decision must be APPROVED or REJECTED")

    updated = await db.jobs.find_one_and_update(
        {"_id": job_id},
        {
            "$set": {
                "moderation_status": body.decision,
                "moderation_note": body.note,
                "updated_at": datetime.now(timezone.utc),
            }
        },
        return_document=True,
    )
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")

    await log_admin_action(db, admin["_id"], f"job_moderation_{body.decision.lower()}", job_id, {"note": body.note})
    return updated


@router.get("/payouts")
async def get_wallet_overview(
    skip: int = 0,
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    """
    There is no real payout-request system — technicians pay the platform a lead
    fee via their wallet, they aren't paid out through the app. This is a wallet
    visibility view: each technician's current balance, last recharge, and most
    recent ledger entry.
    """
    limit = min(limit, 100)
    total = await db.technician_wallets.count_documents({})
    cursor = db.technician_wallets.find({}).sort("balance", -1).skip(skip).limit(limit)
    wallets = await cursor.to_list(length=limit)

    items = []
    for w in wallets:
        last_txn = await db.wallet_transactions.find_one({"technician_id": w["_id"]}, sort=[("created_at", -1)])
        items.append(
            {
                "technician_id": w["_id"],
                "balance": w.get("balance", 0),
                "status": w.get("status"),
                "last_recharge_date": w.get("last_recharge_date"),
                "last_transaction": last_txn,
            }
        )
    return {"items": items, "total": total}


@router.get("/verifications")
async def list_kyc_verification_queue(
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    """KYC review queue. Use the existing /technicians/{id}/approve|reject endpoints to act on these."""
    query = {"adhar_number": {"$nin": [None, ""]}, "is_approved": False}
    cursor = db.technician_profiles.find(query)
    profiles = await cursor.to_list(length=500)
    for p in profiles:
        p["id"] = str(p["_id"])
    return {"items": profiles, "total": len(profiles)}


class WalletAdjustRequest(BaseModel):
    amount: float
    reason: str


@router.post("/wallet/{technician_id}/adjust")
async def adjust_technician_wallet(
    technician_id: str,
    body: WalletAdjustRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(verify_admin),
):
    """
    Manual wallet credit/debit. Exists because Razorpay isn't live yet — this is
    the interim way an admin can top up (or correct) a technician's wallet.
    """
    wallet = await db.technician_wallets.find_one({"_id": technician_id})
    current_balance = wallet.get("balance", 0) if wallet else 0
    if current_balance + body.amount < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Adjustment would result in a negative wallet balance")

    updated = await db.technician_wallets.find_one_and_update(
        {"_id": technician_id},
        {
            "$inc": {"balance": body.amount},
            "$set": {"updated_at": datetime.now(timezone.utc)},
            "$setOnInsert": {
                "currency": "INR",
                "status": "ACTIVE",
                "created_at": datetime.now(timezone.utc),
            },
        },
        upsert=True,
        return_document=True,
    )

    await db.wallet_transactions.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "technician_id": technician_id,
            "type": "CREDIT" if body.amount > 0 else "DEBIT",
            "amount": abs(body.amount),
            "running_balance": updated["balance"],
            "description": f"Admin adjustment: {body.reason}",
            "related_booking_id": None,
            "idempotency_key": f"admin_adjust_{uuid.uuid4()}",
            "created_at": datetime.now(timezone.utc),
        }
    )

    await log_admin_action(
        db, admin["_id"], "wallet_adjust", technician_id, {"amount": body.amount, "reason": body.reason}
    )

    return {"message": "Wallet adjusted", "wallet": updated}
