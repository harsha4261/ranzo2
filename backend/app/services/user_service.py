from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import hash_password
from app.models.user import (
    CustomerProfileDocument,
    EmployerProfileDocument,
    SeekerProfileDocument,
    TechnicianProfileDocument,
    UserDocument,
)
from app.schemas.enums import UserRole

# Maps UserRole → MongoDB collection name
ROLE_COLLECTION: dict[str, str] = {
    UserRole.customer.value: "customer_profiles",
    UserRole.technician.value: "technician_profiles",
    UserRole.seeker.value: "seeker_profiles",
    UserRole.employer.value: "employer_profiles",
}


async def phone_exists(phone: str, db: AsyncIOMotorDatabase) -> bool:
    doc = await db.users.find_one({"phone": phone}, {"_id": 1})
    return doc is not None


async def get_user_by_phone(phone: str, db: AsyncIOMotorDatabase) -> Optional[dict]:
    return await db.users.find_one({"phone": phone})


async def get_user_by_id(user_id: str, db: AsyncIOMotorDatabase) -> Optional[dict]:
    return await db.users.find_one({"_id": user_id})


async def create_user(
    name: str, phone: str, password: str, db: AsyncIOMotorDatabase
) -> UserDocument:
    """
    Create a new user and immediately insert empty profile documents for all
    4 roles (customer, technician, seeker, employer).
    registered_roles starts empty — roles are added when profiles are completed.
    """
    user = UserDocument(name=name, phone=phone, hashed_password=hash_password(password))
    await db.users.insert_one(user.to_db())

    await db.customer_profiles.insert_one(CustomerProfileDocument(user_id=user.id).to_db())
    await db.technician_profiles.insert_one(TechnicianProfileDocument(user_id=user.id).to_db())
    await db.seeker_profiles.insert_one(SeekerProfileDocument(user_id=user.id).to_db())
    await db.employer_profiles.insert_one(EmployerProfileDocument(user_id=user.id).to_db())

    return user


async def get_profile(
    user_id: str, role: UserRole, db: AsyncIOMotorDatabase
) -> Optional[dict]:
    collection = ROLE_COLLECTION[role.value]
    return await db[collection].find_one({"user_id": user_id})


async def update_profile(
    user_id: str, role: UserRole, update_data: dict, db: AsyncIOMotorDatabase
) -> Optional[dict]:
    """
    Update a role profile and set is_completed=True.
    Also adds the role to users.registered_roles via $addToSet (idempotent).
    """
    collection = ROLE_COLLECTION[role.value]
    update_data["is_completed"] = True

    await db[collection].update_one({"user_id": user_id}, {"$set": update_data})
    await db.users.update_one(
        {"_id": user_id},
        {"$addToSet": {"registered_roles": role.value}},
    )
    return await db[collection].find_one({"user_id": user_id})
