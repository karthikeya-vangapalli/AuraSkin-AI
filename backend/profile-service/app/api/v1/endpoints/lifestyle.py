from typing import Annotated, List, Optional
from datetime import datetime
import traceback
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.lifestyle import LifestyleLog
from app.schemas.lifestyle import LifestyleCreate, LifestyleResponse
from app.api.deps import get_current_user_id, get_current_user_payload

router = APIRouter()


def _lifestyle_response(log: LifestyleLog) -> LifestyleResponse:
    return LifestyleResponse(
        id=str(log.id),
        user_id=str(log.user_id),
        water_intake=log.water_intake if log.water_intake is not None else 2500,
        sleep_hours=log.sleep_hours if log.sleep_hours is not None else 0.0,
        sleep_quality=log.sleep_quality if log.sleep_quality is not None else 7,
        sun_exposure=log.sun_exposure if log.sun_exposure is not None else 1.0,
        stress_level=log.stress_level if log.stress_level is not None else 5,
        notes=log.notes,
        created_at=log.created_at or datetime.utcnow(),
    )

@router.post("", response_model=LifestyleResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=LifestyleResponse, status_code=status.HTTP_201_CREATED)
async def create_lifestyle_log(
    log_in: LifestyleCreate,
    current_user_id: Annotated[str, Depends(get_current_user_id)]
):
    """
    Log daily lifestyle tracking metrics (water_intake, sleep_hours, sleep_quality, sun_exposure, stress_level, notes).
    Protected by JWT authentication guard. Supports both with and without trailing slash.
    """
    try:
        log_time = log_in.log_date or log_in.logged_at or datetime.utcnow()
        lifestyle_entry = LifestyleLog(
            user_id=str(current_user_id),
            water_intake=log_in.water_intake if log_in.water_intake is not None else 2500,
            sleep_hours=log_in.sleep_hours or 0.0,
            sleep_quality=log_in.sleep_quality or 7,
            sun_exposure=log_in.sun_exposure if log_in.sun_exposure is not None else 1.0,
            stress_level=log_in.stress_level or 5,
            notes=log_in.notes,
            created_at=log_time,
        )
        await lifestyle_entry.insert()
        try:
            response = _lifestyle_response(lifestyle_entry)
            return response.model_dump(mode="json")
        except Exception as e:
            print(traceback.format_exc(), flush=True)
            raise HTTPException(
                status_code=500,
                detail="Lifestyle entry saved, but response serialization failed.",
            ) from e
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        print(traceback.format_exc(), flush=True)
        raise HTTPException(status_code=500, detail="Failed to submit daily metrics.") from e

@router.get("", response_model=List[LifestyleResponse])
@router.get("/", response_model=List[LifestyleResponse])
async def get_lifestyle_logs(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    start_date: Optional[datetime] = Query(None, description="Filter start date ISO string"),
    end_date: Optional[datetime] = Query(None, description="Filter end date ISO string"),
    limit: int = Query(30, ge=1, le=365, description="Maximum entries to return")
):
    """
    Get lifestyle logs for the authenticated current user.
    Supports both with and without trailing slash.
    """
    query_conditions = [LifestyleLog.user_id == current_user_id]
    if start_date:
        query_conditions.append(LifestyleLog.created_at >= start_date)
    if end_date:
        query_conditions.append(LifestyleLog.created_at <= end_date)

    try:
        logs = await LifestyleLog.find(*query_conditions).sort("-created_at").limit(limit).to_list()
    except Exception as e:
        print(traceback.format_exc(), flush=True)
        raise HTTPException(status_code=500, detail="Failed to load lifestyle history.") from e

    return [
        _lifestyle_response(log)
        for log in logs
    ]

@router.get("/{user_id}/history", response_model=List[LifestyleResponse])
async def get_lifestyle_history(
    user_id: str,
    payload: Annotated[dict, Depends(get_current_user_payload)],
    start_date: Optional[datetime] = Query(None, description="Filter start date ISO string"),
    end_date: Optional[datetime] = Query(None, description="Filter end date ISO string"),
    limit: int = Query(30, ge=1, le=365, description="Maximum entries to return")
):
    """
    Query historical tracking logs for a specific user ID.
    Protected by JWT authentication guard.
    """
    current_user_id = payload.get("sub")
    role = payload.get("role")

    if user_id != current_user_id and role not in ["Administrator", "Dermatologist", "Skincare Consultant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot view lifestyle history of another user."
        )

    query_conditions = [LifestyleLog.user_id == user_id]
    if start_date:
        query_conditions.append(LifestyleLog.created_at >= start_date)
    if end_date:
        query_conditions.append(LifestyleLog.created_at <= end_date)

    try:
        logs = await LifestyleLog.find(*query_conditions).sort("-created_at").limit(limit).to_list()
    except Exception as e:
        print(traceback.format_exc(), flush=True)
        raise HTTPException(status_code=500, detail="Failed to load lifestyle history.") from e

    return [
        _lifestyle_response(log)
        for log in logs
    ]
