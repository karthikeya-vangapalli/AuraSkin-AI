from typing import Annotated, Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi import Header
from jose import jwt, JWTError, ExpiredSignatureError
from app.core.config import settings

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

async def get_current_user_payload(token: Annotated[str, Depends(get_authorization_token)]) -> Dict[str, Any]:
    """
    Validate incoming JWT Bearer token signature and expiration.
    Returns token payload containing 'sub' (user_id) and 'role'.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject (user_id)",
                headers={"WWW-Authenticate": "Bearer"}
            )
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )

async def get_current_user_id(payload: Annotated[Dict[str, Any], Depends(get_current_user_payload)]) -> str:
    """
    Extract and return current user's ID string from validated JWT payload.
    """
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject (user_id)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return str(user_id)
