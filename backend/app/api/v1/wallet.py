from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from datetime import datetime, timezone

from app.api.deps import get_current_user_id, get_db
from app.models.wallet import TechnicianWalletDocument, WalletTransactionDocument

router = APIRouter()

@router.get("/")
async def get_wallet(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    wallet = await db.technician_wallets.find_one({"_id": user_id})
    if not wallet:
        # Create an empty wallet if it doesn't exist
        new_wallet = TechnicianWalletDocument(_id=user_id).to_db()
        await db.technician_wallets.insert_one(new_wallet)
        wallet = new_wallet
    return wallet

@router.post("/recharge")
async def recharge_wallet(
    amount: float,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if amount <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Amount must be greater than 0")

    wallet = await db.technician_wallets.find_one_and_update(
        {"_id": user_id},
        {
            "$inc": {"balance": amount},
            "$set": {"last_recharge_date": datetime.now(timezone.utc)}
        },
        upsert=True,
        return_document=True
    )

    transaction = {
        "_id": str(uuid.uuid4()),
        "technician_id": user_id,
        "type": "CREDIT",
        "amount": amount,
        "running_balance": wallet["balance"],
        "description": "Wallet Recharge",
        "related_booking_id": None,
        "idempotency_key": f"recharge_{uuid.uuid4()}",
        "created_at": datetime.now(timezone.utc)
    }
    await db.wallet_transactions.insert_one(transaction)

    return {"msg": f"Successfully recharged {amount}", "wallet": wallet}
