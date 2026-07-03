"""
One-off bootstrap script: promote an existing user to admin (is_admin=True).

There is no API endpoint for this by design — admin-granting must be an
out-of-band action by whoever controls the database, not something reachable
over HTTP. The user must already have registered a normal account first.

Usage:
    cd backend && uv run python scripts/create_admin.py <phone>
"""
import asyncio
import sys
from pathlib import Path

# Allow `python scripts/create_admin.py` to find the `app` package — running a
# script directly puts its own directory on sys.path, not the project root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


async def main(phone: str) -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    try:
        result = await db.users.update_one({"phone": phone}, {"$set": {"is_admin": True}})
        if result.matched_count == 0:
            print(f"No user found with phone {phone!r}. They must register in the app first.")
            sys.exit(1)
        print(f"{phone} is now an admin.")
    finally:
        client.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: uv run python scripts/create_admin.py <phone>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
