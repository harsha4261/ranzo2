from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from app.core.security import verify_password, create_access_token
from app.services import user_service
from app.schemas.auth import TokenResponse

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, get_current_user_id
from app.schemas.profile import TechnicianProfileResponse
from app.schemas.auth import MessageResponse
router = APIRouter()

class AdminLoginRequest(BaseModel):
    username: str
    password: str

@router.post("/auth/login", response_model=TokenResponse, summary="Admin Web Login")
async def admin_login(
    body: AdminLoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Username from web admin can be mapped to phone in our DB.
    user = await user_service.get_user_by_phone(body.username, db)
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
    return MessageResponse(message="Technician profile rejected")

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
