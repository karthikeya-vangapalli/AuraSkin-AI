from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.models.user import User
from app.models.note import ClinicalNote
from app.models.audit_log import AuditLog
from app.models.assignment import PatientAssignment
from app.api.v1.router import api_router

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
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(api_router, prefix=settings.API_V1_STR)

from sqlalchemy import text

@app.get("/health")
async def health_check():
    db_status = "connected"
    overall_status = "healthy"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unavailable: {str(e)}"
        overall_status = "degraded"
    return {
        "status": overall_status,
        "service": settings.PROJECT_NAME,
        "database": db_status
    }

@app.get(f"{settings.API_V1_STR}/users/health")
async def proxied_health_check():
    return await health_check()
