from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router
from app.services.scheduler import init_scheduler

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_db()
    init_scheduler()

app.include_router(api_router, prefix=settings.API_V1_STR)

from app.models.profile import SkinProfile

@app.get("/health")
async def health_check():
    db_status = "connected"
    overall_status = "healthy"
    try:
        await SkinProfile.find_one()
    except Exception as e:
        db_status = f"unavailable: {str(e)}"
        overall_status = "degraded"
    return {
        "status": overall_status,
        "service": settings.PROJECT_NAME,
        "database": db_status
    }

@app.get(f"{settings.API_V1_STR}/profile/health")
async def proxied_health_check():
    return await health_check()
