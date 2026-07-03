"""
Pytest fixtures using Testcontainers for a real MongoDB instance.

Session-scoped container (started once for the whole test run).
Function-scoped DB + client (each test gets a clean slate).
"""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient
from testcontainers.mongodb import MongoDbContainer


# ──────────────────────────────────────────────────────────────────
# MongoDB container — started once, shared across all tests
# ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def mongo_container():
    with MongoDbContainer("mongo:7.0") as container:
        yield container


# ──────────────────────────────────────────────────────────────────
# Per-test DB fixture — fresh Motor client, cleaned up after each test
# ──────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(autouse=True)
async def _reset_redis_pool():
    """
    app.core.redis.redis_client is a module-level singleton connection pool,
    fine for production (one process, one long-lived event loop) but broken
    across pytest-asyncio's function-scoped event loops — a pooled connection
    opened on one test's loop errors ("attached to a different loop") if reused
    on the next test's loop. Close it after every test so it lazily reconnects
    on whatever loop is current next time it's used.
    """
    yield
    from app.core.redis import redis_client

    try:
        await redis_client.aclose()
    except Exception:
        pass


@pytest_asyncio.fixture
async def test_db(mongo_container):
    client = AsyncIOMotorClient(mongo_container.get_connection_url())
    db = client["ranzo_test"]

    # Ensure indexes exist
    from app.core.database import init_indexes
    await init_indexes(db)

    yield db

    # Clean all collections after each test
    for col in [
        "users", "otps", "revoked_tokens",
        "customer_profiles", "technician_profiles",
        "seeker_profiles", "employer_profiles",
        "bookings", "technician_wallets", "wallet_transactions", "wallet_recharge_orders",
        "reviews", "jobs", "job_applications", "walk_in_drives",
        "audit_logs", "app_config",
    ]:
        await db[col].delete_many({})

    client.close()


# ──────────────────────────────────────────────────────────────────
# Per-test HTTP client — overrides get_db with test_db
# ──────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(test_db):
    from main import app
    from app.api.deps import get_db

    # Override the DB dependency so routes hit the test container
    app.dependency_overrides[get_db] = lambda: test_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
