from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.database import init_indexes
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    app.state.mongo_client = client
    app.state.db = client[settings.DB_NAME]
    await init_indexes(app.state.db)
    yield
    # ── Shutdown ──
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
