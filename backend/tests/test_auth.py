"""
Authentication endpoint tests.

Covers: check-phone, send-otp, verify-otp, register,
        login, login-otp, logout, reset-password, and all error paths.
"""
import pytest

# ── Test data ─────────────────────────────────────────────────────
PHONE = "9876543210"
PASSWORD = "Test@1234"
NAME = "Test User"


# ── Shared helper ─────────────────────────────────────────────────

async def _full_register(client, test_db, phone=PHONE, password=PASSWORD, name=NAME) -> str:
    """
    Execute the complete registration flow and return the JWT access token.
    Fetches the OTP code directly from the test DB (no SMS needed).
    """
    # 1. Send OTP
    r = await client.post("/api/v1/auth/send-otp", json={"phone": phone, "purpose": "register"})
    assert r.status_code == 200, r.text

    # 2. Fetch OTP from DB (dev mode — code printed to console)
    otp_doc = await test_db.otps.find_one({"phone": phone, "purpose": "register", "used": False})
    assert otp_doc, "OTP doc not found in DB"

    # 3. Verify OTP
    r = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": phone, "code": otp_doc["code"], "purpose": "register"},
    )
    assert r.status_code == 200, r.text

    # 4. Register
    r = await client.post(
        "/api/v1/auth/register",
        json={"name": name, "phone": phone, "password": password},
    )
    assert r.status_code == 201, r.text
    return r.json()["access_token"]


# ── check-phone ───────────────────────────────────────────────────

async def test_check_phone_not_registered(client):
    r = await client.post("/api/v1/auth/check-phone", json={"phone": PHONE})
    assert r.status_code == 200
    assert r.json()["exists"] is False


async def test_check_phone_registered(client, test_db):
    await _full_register(client, test_db)
    r = await client.post("/api/v1/auth/check-phone", json={"phone": PHONE})
    assert r.status_code == 200
    assert r.json()["exists"] is True


async def test_check_phone_invalid_format(client):
    for bad_phone in ["abc", "123", "98765432101", "987654321a"]:
        r = await client.post("/api/v1/auth/check-phone", json={"phone": bad_phone})
        assert r.status_code == 422, f"Expected 422 for phone='{bad_phone}'"


# ── send-otp ──────────────────────────────────────────────────────

async def test_send_otp_register(client):
    r = await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    assert r.status_code == 200

async def test_send_otp_register_fails_if_already_registered(client, test_db):
    await _full_register(client, test_db)
    r = await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    assert r.status_code == 409

async def test_send_otp_login_fails_if_not_registered(client):
    r = await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "login"})
    assert r.status_code == 404

async def test_send_otp_for_login_succeeds(client, test_db):
    await _full_register(client, test_db)
    r = await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "login"})
    assert r.status_code == 200

async def test_send_otp_invalidates_previous_otp(client, test_db):
    """Sending a new OTP should mark the previous one as used."""
    await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    used = await test_db.otps.count_documents({"phone": PHONE, "purpose": "register", "used": True})
    active = await test_db.otps.count_documents({"phone": PHONE, "purpose": "register", "used": False})
    assert used == 1
    assert active == 1


# ── verify-otp ────────────────────────────────────────────────────

async def test_verify_otp_success(client, test_db):
    await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    otp = await test_db.otps.find_one({"phone": PHONE, "purpose": "register", "used": False})
    r = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": PHONE, "code": otp["code"], "purpose": "register"},
    )
    assert r.status_code == 200

async def test_verify_otp_wrong_code(client):
    await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    r = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": PHONE, "code": "000000", "purpose": "register"},
    )
    assert r.status_code == 400

async def test_verify_otp_marks_as_used(client, test_db):
    await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    otp = await test_db.otps.find_one({"phone": PHONE, "purpose": "register", "used": False})
    await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": PHONE, "code": otp["code"], "purpose": "register"},
    )
    updated = await test_db.otps.find_one({"_id": otp["_id"]})
    assert updated["used"] is True
    assert updated["verified"] is True
    assert updated["verified_at"] is not None


# ── register ──────────────────────────────────────────────────────

async def test_register_success(client, test_db):
    token = await _full_register(client, test_db)
    assert token is not None and len(token) > 10

async def test_register_creates_all_four_profiles(client, test_db):
    await _full_register(client, test_db)
    user = await test_db.users.find_one({"phone": PHONE})
    uid = str(user["_id"])
    assert await test_db.customer_profiles.find_one({"user_id": uid})
    assert await test_db.technician_profiles.find_one({"user_id": uid})
    assert await test_db.seeker_profiles.find_one({"user_id": uid})
    assert await test_db.employer_profiles.find_one({"user_id": uid})

async def test_register_without_otp_fails(client):
    r = await client.post(
        "/api/v1/auth/register",
        json={"name": NAME, "phone": PHONE, "password": PASSWORD},
    )
    assert r.status_code == 400

async def test_register_duplicate_phone_fails(client, test_db):
    await _full_register(client, test_db)
    # phone is now taken — sending OTP for register should fail
    r = await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    assert r.status_code == 409

async def test_register_short_name_fails(client, test_db):
    await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    otp = await test_db.otps.find_one({"phone": PHONE, "purpose": "register", "used": False})
    await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": PHONE, "code": otp["code"], "purpose": "register"},
    )
    r = await client.post(
        "/api/v1/auth/register",
        json={"name": "ab", "phone": PHONE, "password": PASSWORD},
    )
    assert r.status_code == 422

async def test_register_weak_password_fails(client, test_db):
    await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "register"})
    otp = await test_db.otps.find_one({"phone": PHONE, "purpose": "register", "used": False})
    await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": PHONE, "code": otp["code"], "purpose": "register"},
    )
    for weak_pw in ["password", "PASSWORD1", "Password1", "Pass@word"]:
        r = await client.post(
            "/api/v1/auth/register",
            json={"name": NAME, "phone": PHONE, "password": weak_pw},
        )
        assert r.status_code == 422, f"Expected 422 for password='{weak_pw}'"


# ── login ─────────────────────────────────────────────────────────

async def test_login_success(client, test_db):
    await _full_register(client, test_db)
    r = await client.post("/api/v1/auth/login", json={"phone": PHONE, "password": PASSWORD})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

async def test_login_wrong_password(client, test_db):
    await _full_register(client, test_db)
    r = await client.post("/api/v1/auth/login", json={"phone": PHONE, "password": "WrongPass@99"})
    assert r.status_code == 401

async def test_login_unregistered_phone(client):
    r = await client.post("/api/v1/auth/login", json={"phone": PHONE, "password": PASSWORD})
    assert r.status_code == 401


# ── login-otp ─────────────────────────────────────────────────────

async def test_login_otp_success(client, test_db):
    await _full_register(client, test_db)
    await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "login"})
    otp = await test_db.otps.find_one({"phone": PHONE, "purpose": "login", "used": False})
    r = await client.post("/api/v1/auth/login-otp", json={"phone": PHONE, "code": otp["code"]})
    assert r.status_code == 200
    assert "access_token" in r.json()

async def test_login_otp_wrong_code(client, test_db):
    await _full_register(client, test_db)
    await client.post("/api/v1/auth/send-otp", json={"phone": PHONE, "purpose": "login"})
    r = await client.post("/api/v1/auth/login-otp", json={"phone": PHONE, "code": "000000"})
    assert r.status_code == 400


# ── logout ────────────────────────────────────────────────────────

async def test_logout_success(client, test_db):
    token = await _full_register(client, test_db)
    r = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200

async def test_logout_without_token(client):
    r = await client.post("/api/v1/auth/logout")
    assert r.status_code == 401


# ── reset-password ────────────────────────────────────────────────

async def test_reset_password_flow(client, test_db):
    await _full_register(client, test_db)

    # Send forgot-password OTP
    r = await client.post(
        "/api/v1/auth/send-otp",
        json={"phone": PHONE, "purpose": "forgot_password"},
    )
    assert r.status_code == 200

    otp = await test_db.otps.find_one(
        {"phone": PHONE, "purpose": "forgot_password", "used": False}
    )
    await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": PHONE, "code": otp["code"], "purpose": "forgot_password"},
    )

    new_pw = "NewPass@5678"
    r = await client.post(
        "/api/v1/auth/reset-password",
        json={"phone": PHONE, "new_password": new_pw},
    )
    assert r.status_code == 200

    # Old password should no longer work
    r = await client.post("/api/v1/auth/login", json={"phone": PHONE, "password": PASSWORD})
    assert r.status_code == 401

    # New password should work
    r = await client.post("/api/v1/auth/login", json={"phone": PHONE, "password": new_pw})
    assert r.status_code == 200

async def test_reset_password_without_otp_fails(client, test_db):
    await _full_register(client, test_db)
    r = await client.post(
        "/api/v1/auth/reset-password",
        json={"phone": PHONE, "new_password": "NewPass@5678"},
    )
    assert r.status_code == 400
