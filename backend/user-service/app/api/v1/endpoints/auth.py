from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest
)
from app.api.deps import get_current_user, require_roles

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Register a new user in PostgreSQL with password hashing and role specification.
    """
    query = select(User).where(User.email == user_in.email)
    result = await db.execute(query)
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role.value if hasattr(user_in.role, 'value') else user_in.role,
        is_active=user_in.is_active
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Authenticate user credentials and issue JWT Access and Refresh Tokens.
    """
    query = select(User).where(User.email == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated."
        )
    
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, role=user.role)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_in: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Exchange a valid Refresh Token for a new Access Token & Refresh Token pair.
    """
    payload = decode_token(token_in.refresh_token, expected_type="refresh")
    user_id_str = payload.get("sub")
    
    query = select(User).where(User.email == user_id_str)
    try:
        from uuid import UUID
        user_uuid = UUID(user_id_str)
        query = select(User).where(User.id == user_uuid)
    except ValueError:
        pass

    result = await db.execute(query)
    user = result.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token or inactive user."
        )

    new_access_token = create_access_token(subject=user.id, role=user.role)
    new_refresh_token = create_refresh_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get profile details for the currently authenticated user.
    """
    return current_user

# -----------------------------------------------------------------------------
# Role-Based Access Control (RBAC) Example Endpoints
# -----------------------------------------------------------------------------
@router.get("/dermatologist-only")
async def dermatologist_portal(
    current_user: Annotated[User, Depends(require_roles(["Dermatologist", "Administrator"]))]
):
    """
    Restricted portal endpoint accessible ONLY to users with 'Dermatologist' or 'Administrator' roles.
    """
    return {
        "message": f"Welcome to the Clinical Dermatologist Portal, {current_user.full_name}!",
        "role": current_user.role,
        "access": "Clinical Diagnosis & Advanced Prescriptions Granted"
    }

@router.get("/consultant-only")
async def consultant_portal(
    current_user: Annotated[User, Depends(require_roles(["Skincare Consultant", "Dermatologist", "Administrator"]))]
):
    """
    Restricted portal endpoint accessible to Consultants, Dermatologists, and Administrators.
    """
    return {
        "message": f"Welcome to the Skincare Consultation Dashboard, {current_user.full_name}!",
        "role": current_user.role,
        "access": "Routine Reviews & Active Ingredient Consultation Granted"
    }
