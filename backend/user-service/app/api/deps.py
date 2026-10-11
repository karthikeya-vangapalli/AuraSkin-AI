from typing import Annotated, List, Callable, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi import Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

def get_authorization_token(
    authorization: Annotated[Optional[str], Header()] = None
) -> str:
    """Extract a bearer token with case-insensitive scheme handling."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    scheme, separator, credentials = authorization.partition(" ")
    token = credentials.strip() if separator and scheme.lower() == "bearer" else authorization.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return token

async def get_current_user(
    token: str = Depends(get_authorization_token),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = decode_token(token, expected_type="access")
    user_id_str: str = payload.get("sub")
    
    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )

    query = select(User).where(User.id == user_uuid)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with token not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Access forbidden."
        )
        
    return user

def normalize_role(raw: str) -> str:
    r = (raw or "").lower()
    if "admin" in r: return "Administrator"
    if "derm" in r: return "Dermatologist"
    if "consult" in r: return "Skincare Consultant"
    return "User"

def require_roles(allowed_roles: List[str]) -> Callable:
    """
    Role-Based Access Control (RBAC) dependency factory.
    Allowed roles list options: ['User', 'Skincare Consultant', 'Dermatologist', 'Administrator']
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        norm_role = normalize_role(current_user.role)
        if norm_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{current_user.role}' lacks permission. Required roles: {allowed_roles}"
            )
        return current_user

    return role_checker
