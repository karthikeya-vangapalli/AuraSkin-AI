from fastapi import APIRouter
from app.api.v1.endpoints import profile, lifestyle, progress, notifications

api_router = APIRouter()
api_router.include_router(profile.router, prefix="/profile", tags=["Skin Profile"])
api_router.include_router(lifestyle.router, prefix="/lifestyle", tags=["lifestyle"])
api_router.include_router(progress.router, prefix="/progress", tags=["Daily Progress"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
