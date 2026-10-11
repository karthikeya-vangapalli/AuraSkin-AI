from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.profile import SkinProfile, LifestyleLog
from app.models.progress import DailyProgressLog
from app.models.notification import Notification

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.DATABASE_NAME],
        document_models=[SkinProfile, LifestyleLog, DailyProgressLog, Notification]
    )
