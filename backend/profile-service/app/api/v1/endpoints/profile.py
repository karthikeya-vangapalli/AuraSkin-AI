from typing import Annotated
import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from app.models.profile import SkinProfile
from app.schemas.profile import SkinProfileCreate, SkinProfileResponse
from app.api.deps import get_current_user_id, get_current_user_payload

router = APIRouter()


def _profile_response(profile: SkinProfile) -> SkinProfileResponse:
    return SkinProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        skin_type=profile.skin_type,
        age_group=profile.age_group,
        skin_concerns=profile.skin_concerns or [],
        allergies=profile.allergies or profile.ingredient_allergies or [],
        sensitivities=profile.sensitivities or profile.active_sensitivities or [],
        ingredient_allergies=profile.ingredient_allergies or profile.allergies or [],
        active_sensitivities=profile.active_sensitivities or profile.sensitivities or [],
        fitzpatrick_scale=profile.fitzpatrick_scale,
        climate_environment=profile.climate_environment,
        morning_routine=profile.morning_routine or [],
        evening_routine=profile.evening_routine or [],
        skin_health_score=profile.skin_health_score if profile.skin_health_score is not None else 85.0,
        triage_recommendation=getattr(profile, "triage_recommendation", None) or "Unassessed",
        triage_reason=getattr(profile, "triage_reason", None),
        reported_concerns_summary=getattr(profile, "reported_concerns_summary", None) or [],
        created_at=profile.created_at or datetime.utcnow(),
        updated_at=profile.updated_at or datetime.utcnow(),
    )

@router.post("", response_model=SkinProfileResponse, status_code=status.HTTP_200_OK)
@router.post("/", response_model=SkinProfileResponse, status_code=status.HTTP_200_OK)
async def create_or_update_skin_profile(
    profile_in: SkinProfileCreate,
    current_user_id: Annotated[str, Depends(get_current_user_id)]
):
    """
    Create or update the current user's skin profile (skin_type, age_group, skin_concerns, allergies, sensitivities).
    Protected by JWT Bearer token authentication guard. Supports both with and without trailing slash.
    """
    try:
        existing_profile = await SkinProfile.find_one(SkinProfile.user_id == str(current_user_id))
    except Exception as e:
        print(traceback.format_exc(), flush=True)
        raise HTTPException(status_code=500, detail="Failed to save skin profile.") from e

    if existing_profile:
        existing_profile.skin_type = profile_in.skin_type
        if profile_in.age_group is not None:
            existing_profile.age_group = profile_in.age_group
        existing_profile.skin_concerns = profile_in.skin_concerns or []
        existing_profile.allergies = profile_in.allergies or profile_in.ingredient_allergies or []
        existing_profile.sensitivities = profile_in.sensitivities or profile_in.active_sensitivities or []
        existing_profile.ingredient_allergies = profile_in.ingredient_allergies or profile_in.allergies or []
        existing_profile.active_sensitivities = profile_in.active_sensitivities or profile_in.sensitivities or []
        if profile_in.fitzpatrick_scale is not None:
            existing_profile.fitzpatrick_scale = profile_in.fitzpatrick_scale
        if profile_in.climate_environment is not None:
            existing_profile.climate_environment = profile_in.climate_environment
        if profile_in.skin_health_score is not None:
            existing_profile.skin_health_score = profile_in.skin_health_score
        if profile_in.triage_recommendation is not None:
            existing_profile.triage_recommendation = profile_in.triage_recommendation
        if profile_in.triage_reason is not None:
            existing_profile.triage_reason = profile_in.triage_reason
        if profile_in.reported_concerns_summary is not None:
            existing_profile.reported_concerns_summary = profile_in.reported_concerns_summary
        existing_profile.updated_at = datetime.utcnow()

        try:
            await existing_profile.save()
        except Exception as e:
            print(traceback.format_exc(), flush=True)
            raise HTTPException(status_code=500, detail="Failed to save skin profile.") from e
        return _profile_response(existing_profile)

    # Create new profile document
    new_profile = SkinProfile(
        user_id=current_user_id,
        skin_type=profile_in.skin_type,
        age_group=profile_in.age_group,
        skin_concerns=profile_in.skin_concerns or [],
        allergies=profile_in.allergies or profile_in.ingredient_allergies or [],
        sensitivities=profile_in.sensitivities or profile_in.active_sensitivities or [],
        ingredient_allergies=profile_in.ingredient_allergies or profile_in.allergies,
        active_sensitivities=profile_in.active_sensitivities or profile_in.sensitivities,
        fitzpatrick_scale=profile_in.fitzpatrick_scale,
        climate_environment=profile_in.climate_environment,
        skin_health_score=profile_in.skin_health_score if profile_in.skin_health_score is not None else 85.0,
        triage_recommendation=profile_in.triage_recommendation or "Unassessed",
        triage_reason=profile_in.triage_reason,
        reported_concerns_summary=profile_in.reported_concerns_summary or [],
    )
    try:
        await new_profile.insert()
    except Exception as e:
        print(traceback.format_exc(), flush=True)
        raise HTTPException(status_code=500, detail="Failed to save skin profile.") from e
    return _profile_response(new_profile)


@router.get("", response_model=SkinProfileResponse)
@router.get("/", response_model=SkinProfileResponse)
async def get_current_skin_profile(
    current_user_id: Annotated[str, Depends(get_current_user_id)]
):
    try:
        profile = await SkinProfile.find_one(SkinProfile.user_id == str(current_user_id))
    except Exception as e:
        print(traceback.format_exc(), flush=True)
        raise HTTPException(status_code=500, detail="Failed to load skin profile.") from e
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found.")
    return _profile_response(profile)

@router.get("/{user_id}", response_model=SkinProfileResponse)
async def get_user_skin_profile(
    user_id: str,
    payload: Annotated[dict, Depends(get_current_user_payload)]
):
    """
    Fetch current skin profile by user_id. Ensures token bearer identity or administrator permissions.
    """
    current_user_id = payload.get("sub")
    role = payload.get("role")

    if user_id != current_user_id and role not in ["Administrator", "Dermatologist", "Skincare Consultant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot view skin profile of another user."
        )

    try:
        profile = await SkinProfile.find_one(SkinProfile.user_id == str(user_id))
    except Exception as e:
        print(traceback.format_exc(), flush=True)
        raise HTTPException(status_code=500, detail="Failed to load skin profile.") from e
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skin profile for user '{user_id}' not found."
        )

    return _profile_response(profile)
