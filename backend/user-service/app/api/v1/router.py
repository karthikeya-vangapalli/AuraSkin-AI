from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, clinical, assignments

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(clinical.router, prefix="/clinical", tags=["Clinical"])
api_router.include_router(assignments.router, prefix="/admin/assignments", tags=["Assignments"])
