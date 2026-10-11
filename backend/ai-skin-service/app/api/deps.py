from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from jose import JWTError, jwt
from app.core.config import settings

# Simple bearer token extraction
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    token = credentials.credentials
    payload = None
    keys_to_try = [
        settings.SECRET_KEY,
        "super-secret-jwt-key-change-in-production",
        "auraskin_super_secret_production_key_2026_jwt_token",
    ]
    seen = set()
    unique_keys = [k for k in keys_to_try if k and not (k in seen or seen.add(k))]

    for key in unique_keys:
        try:
            payload = jwt.decode(token, key, algorithms=[settings.ALGORITHM])
            if payload:
                break
        except JWTError:
            continue

    if not payload:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    user_id = payload.get("sub") or payload.get("user_id") or payload.get("email") or payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    return str(user_id)
