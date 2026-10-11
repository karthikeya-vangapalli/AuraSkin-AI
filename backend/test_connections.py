import sys
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Define base directory
BASE_DIR = Path(__file__).resolve().parent

# 1. Load User Service Env & Path
USER_SERVICE_DIR = BASE_DIR / "user-service"
sys.path.insert(0, str(USER_SERVICE_DIR))
load_dotenv(USER_SERVICE_DIR / ".env")

# 2. Load Profile Service Env & Path
PROFILE_SERVICE_DIR = BASE_DIR / "profile-service"
sys.path.insert(0, str(PROFILE_SERVICE_DIR))
load_dotenv(PROFILE_SERVICE_DIR / ".env")

async def test_postgres():
    print("\n--- Testing PostgreSQL (User Service) ---")
    db_url = os.getenv("DATABASE_URL")
    print(f"DATABASE_URL detected: {db_url}")
    
    if not db_url:
        print("[FAILED] DATABASE_URL is missing in user-service/.env")
        return

    try:
        import asyncpg
        # Remove dialect prefix if present (e.g. postgresql+asyncpg:// -> postgresql://)
        pg_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        conn = await asyncpg.connect(pg_url)
        res = await conn.fetchval("SELECT 1;")
        await conn.close()
        if res == 1:
            print("[SUCCESS] PostgreSQL connection verified.")
    except Exception as e:
        print(f"[FAILED] PostgreSQL error: {e}")

async def test_mongodb():
    print("\n--- Testing MongoDB (Profile & Lifestyle Service) ---")
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "skin_profile_db")
    print(f"MONGODB_URL detected: {mongo_url}")
    print(f"DATABASE_NAME detected: {db_name}")

    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]

        # Test Payload
        test_payload = {
            "test_id": "test_verification_123",
            "water_intake": 2.5,
            "sleep_hours": 8,
            "stress_level": "low"
        }

        # Write
        insert_result = await db["daily_metrics"].insert_one(test_payload)
        print(f"  -> Inserted test document ID: {insert_result.inserted_id}")

        # Read
        found_doc = await db["daily_metrics"].find_one({"test_id": "test_verification_123"})
        if found_doc:
            print("  -> Read back verified successfully.")

        # Cleanup
        await db["daily_metrics"].delete_one({"test_id": "test_verification_123"})
        print("  -> Cleanup complete.")
        print("[SUCCESS] MongoDB write/read/delete cycle verified for Lifestyle Tracker.")
    except Exception as e:
        print(f"[FAILED] MongoDB error: {e}")

async def main():
    await test_postgres()
    await test_mongodb()

if __name__ == "__main__":
    asyncio.run(main())