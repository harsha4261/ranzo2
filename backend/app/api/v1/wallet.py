import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.api.deps import get_current_user_id, get_db
from app.core.config import settings
from app.models.wallet import TechnicianWalletDocument

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


@router.get("/transactions")
async def get_transactions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    cursor = db.wallet_transactions.find({"technician_id": user_id}).sort("created_at", -1)
    return await cursor.to_list(length=200)


class RechargeOrderRequest(BaseModel):
    amount: float = Field(..., gt=0)


def _get_razorpay_client():
    import razorpay

    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


@router.post("/recharge/order")
async def create_recharge_order(
    payload: RechargeOrderRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Step 1 of a real recharge: create a Razorpay order for `amount` and hand the
    order back to the app so it can open Razorpay Checkout. Nothing is credited
    to the wallet here — that only happens after `/recharge/verify` confirms a
    genuine signed payment. Disabled (503) until RAZORPAY_KEY_ID/SECRET are set.
    """
    if not settings.razorpay_configured:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Wallet recharge is not available yet — payment gateway is not configured.",
        )

    client = _get_razorpay_client()
    amount_paise = int(round(payload.amount * 100))
    order = client.order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "notes": {"technician_id": user_id},
        }
    )

    await db.wallet_recharge_orders.insert_one(
        {
            "_id": order["id"],
            "technician_id": user_id,
            "amount": payload.amount,
            "status": "CREATED",
            "created_at": datetime.now(timezone.utc),
        }
    )

    return {
        "order_id": order["id"],
        "amount_paise": amount_paise,
        "currency": "INR",
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
    }


class RechargeVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/recharge/verify")
async def verify_recharge(
    payload: RechargeVerifyRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Step 2: verify the Razorpay signature server-side, then credit the wallet
    with the amount recorded when the order was created (never trust a
    client-supplied amount here). Idempotent — replaying the same
    razorpay_order_id can never double-credit, enforced by the unique index
    on wallet_transactions.idempotency_key.
    """
    if not settings.razorpay_configured:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Payment gateway is not configured.")

    order = await db.wallet_recharge_orders.find_one({"_id": payload.razorpay_order_id})
    if not order or order["technician_id"] != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recharge order not found")
    if order["status"] == "PAID":
        wallet = await db.technician_wallets.find_one({"_id": user_id})
        return {"msg": "Already processed", "wallet": wallet}

    client = _get_razorpay_client()
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
            }
        )
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Payment signature verification failed")

    amount = order["amount"]
    wallet = await db.technician_wallets.find_one_and_update(
        {"_id": user_id},
        {"$inc": {"balance": amount}, "$set": {"last_recharge_date": datetime.now(timezone.utc)}},
        upsert=True,
        return_document=True,
    )
    await db.wallet_transactions.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "technician_id": user_id,
            "type": "CREDIT",
            "amount": amount,
            "running_balance": wallet["balance"],
            "description": "Wallet recharge via Razorpay",
            "related_booking_id": None,
            "idempotency_key": f"recharge_{payload.razorpay_order_id}",
            "created_at": datetime.now(timezone.utc),
        }
    )
    await db.wallet_recharge_orders.update_one(
        {"_id": payload.razorpay_order_id},
        {"$set": {"status": "PAID", "razorpay_payment_id": payload.razorpay_payment_id}},
    )

    return {"msg": f"Successfully recharged {amount}", "wallet": wallet}
