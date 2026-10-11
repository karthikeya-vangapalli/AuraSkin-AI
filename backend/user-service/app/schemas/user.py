from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "User"
    CONSULTANT = "Skincare Consultant"
    DERMATOLOGIST = "Dermatologist"
    ADMINISTRATOR = "Administrator"

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.USER
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class RoleUpdate(BaseModel):
    role: UserRole

class UserResponse(UserBase):
    id: UUID
    status: Optional[str] = "Active"
    triage_suggestion: Optional[str] = "Unassessed"
    triage_recommendation: Optional[str] = "Unassessed"
    triage_reason: Optional[str] = None
    reported_concerns: Optional[List[str]] = None
    assigned_professional: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # in seconds

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None
