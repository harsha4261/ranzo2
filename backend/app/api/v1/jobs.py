from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.api.deps import get_current_user_id, get_db
from app.models.job import JobDocument, JobApplicationDocument, WalkInDriveDocument
from app.schemas.job import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobListResponse,
    JobApplicationCreate,
    JobApplicationStatusUpdate,
    JobApplicationResponse,
    JobApplicationListResponse,
    WalkInDriveCreate,
    WalkInDriveResponse,
    WalkInDriveListResponse,
    WalkInCheckInRequest,
)

router = APIRouter()

APPLICATION_STATUSES = {"SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED", "HIRED"}


def _to_job_response(doc: dict) -> JobResponse:
    return JobResponse(
        id=doc["_id"],
        employer_id=doc["employer_id"],
        title=doc.get("title", ""),
        sector=doc.get("sector", ""),
        sub_sector=doc.get("sub_sector"),
        employment_type=doc.get("employment_type", ""),
        vacancies=doc.get("vacancies", 1),
        description=doc.get("description", ""),
        required_skills=doc.get("required_skills", []),
        experience_min=doc.get("experience_min", 0),
        experience_max=doc.get("experience_max", 0),
        education=doc.get("education"),
        job_address=doc.get("job_address", ""),
        latitude=doc.get("latitude"),
        longitude=doc.get("longitude"),
        salary_min=doc.get("salary_min", 0),
        salary_max=doc.get("salary_max", 0),
        salary_period=doc.get("salary_period", "month"),
        working_hours=doc.get("working_hours"),
        benefits=doc.get("benefits", []),
        status=doc.get("status", "DRAFT"),
        moderation_status=doc.get("moderation_status", "PENDING"),
        moderation_note=doc.get("moderation_note"),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
    )


def _to_application_response(doc: dict) -> JobApplicationResponse:
    return JobApplicationResponse(
        id=doc["_id"],
        job_id=doc["job_id"],
        seeker_id=doc["seeker_id"],
        employer_id=doc["employer_id"],
        cover_message=doc.get("cover_message"),
        salary_min=doc.get("salary_min"),
        salary_max=doc.get("salary_max"),
        status=doc.get("status", "SUBMITTED"),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
    )


def _to_drive_response(doc: dict) -> WalkInDriveResponse:
    return WalkInDriveResponse(
        id=doc["_id"],
        employer_id=doc["employer_id"],
        job_id=doc["job_id"],
        drive_date=doc["drive_date"],
        time_slots=doc.get("time_slots", []),
        address=doc.get("address", ""),
        capacity_per_slot=doc.get("capacity_per_slot", 0),
        instructions=doc.get("instructions"),
        checked_in_count=doc.get("checked_in_count", 0),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
    )


@router.post("", response_model=JobResponse)
async def create_job(
    payload: JobCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    employer = await db.employer_profiles.find_one({"user_id": user_id})
    if not employer:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Employer profile required to post a job")

    job_status = "PUBLISHED" if payload.publish else "DRAFT"
    job = JobDocument(
        employer_id=user_id,
        title=payload.title,
        sector=payload.sector,
        sub_sector=payload.sub_sector,
        employment_type=payload.employment_type,
        vacancies=payload.vacancies,
        description=payload.description,
        required_skills=payload.required_skills,
        experience_min=payload.experience_min,
        experience_max=payload.experience_max,
        education=payload.education,
        job_address=payload.job_address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        salary_period=payload.salary_period,
        working_hours=payload.working_hours,
        benefits=payload.benefits,
        status=job_status,
        moderation_status="PENDING",
    )
    doc = job.to_db()
    await db.jobs.insert_one(doc)
    return _to_job_response(doc)


@router.get("", response_model=JobListResponse)
async def list_jobs(
    sector: Optional[str] = None,
    q: Optional[str] = None,
    employment_type: Optional[str] = None,
    salary_min: Optional[float] = None,
    skip: int = 0,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    limit = min(limit, 100)
    query = {"status": "PUBLISHED", "moderation_status": "APPROVED"}
    if sector:
        query["sector"] = sector
    if employment_type:
        query["employment_type"] = employment_type
    if salary_min is not None:
        query["salary_max"] = {"$gte": salary_min}
    if q:
        query["title"] = {"$regex": q, "$options": "i"}

    total = await db.jobs.count_documents(query)
    cursor = db.jobs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return JobListResponse(items=[_to_job_response(d) for d in docs], total=total)


@router.get("/mine", response_model=JobListResponse)
async def list_my_jobs(
    skip: int = 0,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    limit = min(limit, 100)
    query = {"employer_id": user_id}
    total = await db.jobs.count_documents(query)
    cursor = db.jobs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return JobListResponse(items=[_to_job_response(d) for d in docs], total=total)


@router.get("/seeker/applications", response_model=JobApplicationListResponse)
async def list_my_applications(
    skip: int = 0,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    limit = min(limit, 100)
    query = {"seeker_id": user_id}
    total = await db.job_applications.count_documents(query)
    cursor = db.job_applications.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return JobApplicationListResponse(items=[_to_application_response(d) for d in docs], total=total)


@router.get("/applications/{application_id}", response_model=JobApplicationResponse)
async def get_application(
    application_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.job_applications.find_one({"_id": application_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    if doc["seeker_id"] != user_id and doc["employer_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to view this application")
    return _to_application_response(doc)


@router.patch("/applications/{application_id}", response_model=JobApplicationResponse)
async def update_application_status(
    application_id: str,
    payload: JobApplicationStatusUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if payload.status not in APPLICATION_STATUSES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid status. Must be one of {sorted(APPLICATION_STATUSES)}")

    app_doc = await db.job_applications.find_one({"_id": application_id})
    if not app_doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    if app_doc["employer_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your application to manage")

    updated = await db.job_applications.find_one_and_update(
        {"_id": application_id},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    return _to_application_response(updated)


@router.get("/walk-ins/{drive_id}", response_model=WalkInDriveResponse)
async def get_walk_in_drive(
    drive_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.walk_in_drives.find_one({"_id": drive_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Walk-in drive not found")
    return _to_drive_response(doc)


@router.post("/walk-ins/{drive_id}/check-in")
async def check_in_to_walk_in_drive(
    drive_id: str,
    payload: WalkInCheckInRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Meant to be hit from a QR-scan flow at the venue — no ownership check beyond auth.
    updated = await db.walk_in_drives.find_one_and_update(
        {"_id": drive_id},
        {"$inc": {"checked_in_count": 1}},
        return_document=True,
    )
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Walk-in drive not found")
    return {"msg": f"Checked in to slot {payload.slot}", "checked_in_count": updated["checked_in_count"]}


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.jobs.find_one({"_id": job_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")

    is_public = doc.get("status") == "PUBLISHED" and doc.get("moderation_status") == "APPROVED"
    if not is_public and doc["employer_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to view this job")

    return _to_job_response(doc)


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    payload: JobUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.jobs.find_one({"_id": job_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    if doc["employer_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your job")

    update_data = payload.model_dump(exclude_unset=True, exclude={"status"})

    if payload.status is not None:
        if payload.status == "PUBLISHED" and doc.get("status") != "PUBLISHED":
            # Newly-live content must go through moderation again.
            update_data["moderation_status"] = "PENDING"
        update_data["status"] = payload.status

    update_data["updated_at"] = datetime.now(timezone.utc)

    updated = await db.jobs.find_one_and_update(
        {"_id": job_id},
        {"$set": update_data},
        return_document=True,
    )
    return _to_job_response(updated)


@router.post("/{job_id}/apply", response_model=JobApplicationResponse)
async def apply_to_job(
    job_id: str,
    payload: JobApplicationCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    seeker = await db.seeker_profiles.find_one({"user_id": user_id})
    if not seeker:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Seeker profile required to apply")

    job = await db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    if job.get("status") != "PUBLISHED" or job.get("moderation_status") != "APPROVED":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This job is not accepting applications right now")

    application = JobApplicationDocument(
        job_id=job_id,
        seeker_id=user_id,
        employer_id=job["employer_id"],
        cover_message=payload.cover_message,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
    )
    doc = application.to_db()
    try:
        await db.job_applications.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already applied to this job")

    return _to_application_response(doc)


@router.get("/{job_id}/applicants", response_model=JobApplicationListResponse)
async def list_applicants(
    job_id: str,
    skip: int = 0,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    job = await db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    if job["employer_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your job")

    limit = min(limit, 100)
    query = {"job_id": job_id}
    total = await db.job_applications.count_documents(query)
    cursor = db.job_applications.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return JobApplicationListResponse(items=[_to_application_response(d) for d in docs], total=total)


@router.post("/{job_id}/walk-ins", response_model=WalkInDriveResponse)
async def create_walk_in_drive(
    job_id: str,
    payload: WalkInDriveCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    job = await db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    if job["employer_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your job")

    drive = WalkInDriveDocument(
        employer_id=user_id,
        job_id=job_id,
        drive_date=payload.drive_date,
        time_slots=payload.time_slots,
        address=payload.address,
        capacity_per_slot=payload.capacity_per_slot,
        instructions=payload.instructions,
    )
    doc = drive.to_db()
    await db.walk_in_drives.insert_one(doc)
    return _to_drive_response(doc)


@router.get("/{job_id}/walk-ins", response_model=WalkInDriveListResponse)
async def list_walk_in_drives(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    job = await db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    if job["employer_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your job")

    cursor = db.walk_in_drives.find({"job_id": job_id}).sort("drive_date", 1)
    docs = await cursor.to_list(length=200)
    return WalkInDriveListResponse(items=[_to_drive_response(d) for d in docs], total=len(docs))
