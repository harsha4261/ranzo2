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
        "users", "otps",
        "customer_profiles", "technician_profiles",
        "seeker_profiles", "employer_profiles",
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
