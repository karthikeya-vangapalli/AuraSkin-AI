from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.profile import RoutineItem

# -----------------------------------------------------------------------------
# Skin Profile Schemas
# -----------------------------------------------------------------------------
class SkinProfileCreate(BaseModel):
    skin_type: str = Field(..., description="Skin classification (Oily, Dry, Combination, Sensitive, Normal)")
    age_group: Optional[str] = Field(None, description="Age bracket (18-24, 25-34, 35-44, 45-54, 55+)")
    skin_concerns: List[str] = Field(default_factory=list, description="Target concerns: Acne, Hyperpigmentation, Fine Lines, Redness, Dehydration")
    allergies: List[str] = Field(default_factory=list, description="Known ingredient allergies: Fragrance, Sulfates, Parabens, etc.")
    sensitivities: List[str] = Field(default_factory=list, description="Ingredient sensitivities: Retinoids, AHA/BHA, etc.")
    ingredient_allergies: Optional[List[str]] = None
    active_sensitivities: Optional[List[str]] = None
    fitzpatrick_scale: Optional[int] = Field(None, ge=1, le=6, description="Skin phototype scale (1-6)")
    climate_environment: Optional[str] = Field(None, description="Living environment (Humid, Dry, Urban, Cold)")
    skin_health_score: Optional[float] = None
    triage_recommendation: Optional[str] = None
    triage_reason: Optional[str] = None
    reported_concerns_summary: Optional[List[str]] = None

class SkinProfileResponse(BaseModel):
    id: str
    user_id: str
    skin_type: str
    age_group: Optional[str] = None
    skin_concerns: List[str]
    allergies: List[str]
    sensitivities: List[str]
    ingredient_allergies: List[str] = Field(default_factory=list)
    active_sensitivities: List[str] = Field(default_factory=list)
    fitzpatrick_scale: Optional[int] = None
    climate_environment: Optional[str] = None
    morning_routine: List[RoutineItem]
    evening_routine: List[RoutineItem]
    skin_health_score: float
    triage_recommendation: Optional[str] = "Unassessed"
    triage_reason: Optional[str] = None
    reported_concerns_summary: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

# -----------------------------------------------------------------------------
# Lifestyle Tracking Schemas
# -----------------------------------------------------------------------------
class LifestyleLogCreate(BaseModel):
    sleep_hours: float = Field(..., ge=0, le=24, description="Sleep duration in hours")
    sleep_quality_score: int = Field(..., ge=1, le=10, description="Sleep quality rating (1-10)")
    water_intake_ml: int = Field(..., ge=0, description="Daily water consumption in milliliters")
    sun_exposure_hours: float = Field(..., ge=0, le=24, description="Outdoor sun exposure in hours")
    stress_level: int = Field(..., ge=1, le=10, description="Self-reported stress level (1-10)")
    notes: Optional[str] = Field(None, description="Additional daily lifestyle observations")
    log_date: Optional[datetime] = Field(None, description="Custom timestamp, defaults to current time")

class LifestyleLogResponse(BaseModel):
    id: str
    user_id: str
    log_date: datetime
    sleep_hours: float
    sleep_quality_score: int
    water_intake_ml: int
    sun_exposure_hours: float
    stress_level: int
    notes: Optional[str] = None
    created_at: datetime

class LifestyleHistoryQuery(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = 30
