import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.database import init_indexes
from app.api.v1.router import api_router
from app.tasks.autocomplete_reviews import run_autocomplete_reviews_on_db

logger = logging.getLogger("ranzo")

CLEANUP_INTERVAL_SECONDS = 3600


async def _stale_booking_cleanup_loop(db) -> None:
    """Runs the PENDING_RATING -> COMPLETED sweep every hour for the app's lifetime."""
    while True:
        try:
            await run_autocomplete_reviews_on_db(db)
        except Exception:
            logger.exception("Stale booking cleanup pass failed")
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    if settings.JWT_SECRET == "change-me-in-production":
        logger.warning(
            "JWT_SECRET is still the placeholder default — set a real random "
            "secret via the JWT_SECRET env var before exposing this outside dev."
        )
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    app.state.mongo_client = client
    app.state.db = client[settings.DB_NAME]
    await init_indexes(app.state.db)

    cleanup_task = asyncio.create_task(_stale_booking_cleanup_loop(app.state.db))
    yield
    # ── Shutdown ──
    cleanup_task.cancel()
    client.close()


app = FastAPI(
    title="Ranzo API",
    description=(
        "Backend for **Ranzo** — a dual-product platform combining "
        "Home Services (customer / technician) and a Job Portal (seeker / employer)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
