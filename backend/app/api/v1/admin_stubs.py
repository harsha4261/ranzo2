from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import get_db
from app.api.v1.admin import verify_admin
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard(db: AsyncIOMotorDatabase = Depends(get_db), admin=Depends(verify_admin)):
    total_users = await db.users.count_documents({})
    total_technicians = await db.technician_profiles.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    return {
        "job_portal": {
            "total_jobs": 0,
            "total_applications": 0
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
    return {"message": "User suspension updated"}

# STUBS
@router.get("/service-bookings")
async def get_bookings(): return {"items": [], "total": 0}

@router.get("/walk-in-drives")
async def get_drives(): return {"items": [], "total": 0}

@router.get("/analytics")
async def get_analytics(): return {"total": 0}

@router.get("/disputes")
async def get_disputes(): return {"items": [], "total": 0}

@router.patch("/disputes/{id}")
async def resolve_dispute(id: str): return {"message": "ok"}

@router.get("/config")
async def get_config(): return {"settings": {}}

@router.patch("/config")
async def patch_config(): return {"message": "ok"}

@router.get("/audit-log")
async def get_audit(): return {"items": [], "total": 0}

@router.get("/application-logs")
async def get_logs(): return {"items": [], "total": 0}

@router.get("/jobs/moderation")
async def get_jobs(): return {"items": [], "total": 0}

@router.patch("/jobs/{id}/moderation")
async def mod_job(id: str): return {"message": "ok"}

@router.get("/payouts")
async def get_payouts(): return {"items": [], "total": 0}

@router.get("/verifications")
async def get_verifications(): return {"items": [], "total": 0}
