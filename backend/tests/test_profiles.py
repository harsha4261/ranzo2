"""
Profile endpoint tests.

Covers:
- GET /users/me
- GET /profiles/me?role=X
- PUT /profiles/me?role=X for all 4 roles
"""
import pytest

from tests.test_auth import _full_register

# ── Test Data ─────────────────────────────────────────────────────
PHONE = "9000000000"


@pytest.fixture
async def user_token(client, test_db) -> str:
    """Returns a valid JWT access token for a fresh user."""
    return await _full_register(client, test_db, phone=PHONE)


# ── GET /users/me ─────────────────────────────────────────────────

async def test_get_users_me_initial(client, user_token):
    r = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["phone"] == PHONE
    # Initially no roles are registered (profiles exist but is_completed=False)
    assert data["registered_roles"] == []


# ── Profiles: Customer ────────────────────────────────────────────

async def test_get_customer_profile_initial(client, user_token):
    r = await client.get("/api/v1/profiles/me?role=customer", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["location"] is None
    assert data["is_completed"] is False

async def test_update_customer_profile(client, user_token):
    r = await client.put(
        "/api/v1/profiles/me?role=customer",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"location": "123 Main St, New York, NY"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["location"] == "123 Main St, New York, NY"
    assert data["is_completed"] is True

    # Check that role is now registered on the user doc
    r2 = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {user_token}"})
    assert "customer" in r2.json()["registered_roles"]


# ── Profiles: Technician ──────────────────────────────────────────

async def test_update_technician_profile(client, user_token):
    r = await client.put(
        "/api/v1/profiles/me?role=technician",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"skills": ["plumber", "electrician"], "online_status": True},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["skills"] == ["plumber", "electrician"]
    assert data["online_status"] is True
    assert data["is_completed"] is True

async def test_update_technician_invalid_skill(client, user_token):
    r = await client.put(
        "/api/v1/profiles/me?role=technician",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"skills": ["hacker"], "online_status": True},
    )
    assert r.status_code == 422

async def test_update_technician_too_many_skills(client, user_token):
    r = await client.put(
        "/api/v1/profiles/me?role=technician",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"skills": ["plumber", "electrician", "painter", "mason"], "online_status": True},
    )
    assert r.status_code == 422


# ── Profiles: Seeker ──────────────────────────────────────────────

async def test_update_seeker_profile(client, user_token):
    r = await client.put(
        "/api/v1/profiles/me?role=seeker",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"category": "it_technology", "role": "software_developer", "location": "Remote"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["category"] == "it_technology"
    assert data["role"] == "software_developer"
    assert data["is_completed"] is True

async def test_update_seeker_role_mismatch(client, user_token):
    # 'mason' is not in 'it_technology'
    r = await client.put(
        "/api/v1/profiles/me?role=seeker",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"category": "it_technology", "role": "mason", "location": "Remote"},
    )
    assert r.status_code == 422


# ── Profiles: Employer ────────────────────────────────────────────

async def test_update_employer_profile(client, user_token):
    r = await client.put(
        "/api/v1/profiles/me?role=employer",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"company": "Acme Corp", "location": "San Francisco, CA"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["company"] == "Acme Corp"
    assert data["is_completed"] is True

    # Check registered roles contains employer
    r2 = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {user_token}"})
    assert "employer" in r2.json()["registered_roles"]
