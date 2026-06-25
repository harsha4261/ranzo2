from fastapi import APIRouter

from app.api.v1 import auth, profiles, users, bookings, reviews, upload, admin, wallet

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
