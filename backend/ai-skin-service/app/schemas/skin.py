from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class RoutineStep(BaseModel):
    step: int
    category: str
    product_type: str
    key_ingredient: str
    reason: str

class SkinAnalysisRequest(BaseModel):
    user_id: str
    water_intake: float = Field(..., ge=0, le=10)
    sleep_hours: float = Field(..., ge=0, le=24)
    stress_level: str  # "low", "medium", "high"
    acne_severity: int = Field(0, ge=0, le=5)
    redness_level: int = Field(0, ge=0, le=5)
    skin_concerns: List[str]  # e.g. ["redness", "acne", "dark_spots"]
    current_season: str  # "summer", "winter", "monsoon", "spring_fall"
    routine_days_logged: int = Field(7, ge=1, le=7)
    previous_score: Optional[float] = None

class SkinAnalysisResponse(BaseModel):
    overall_skin_health_score: float
    improvement_delta: float
    score_breakdown: Dict[str, float]
    prioritized_concerns: List[str]
    seasonal_adjustments: List[str]
    am_routine: List[RoutineStep]
    pm_routine: List[RoutineStep]
    engine_mode: str

class TextualAssessmentRequest(BaseModel):
    skin_type: str
    fitzpatrick_phototype: int = Field(..., ge=1, le=6)
    climate: str
    sun_exposure_hours: float = Field(default=1.5, ge=0.0, le=24.0)
    spf_consistency: str = Field(default="daily") # "never", "occasional", "daily", "reapplied"
    acne_severity: int = Field(default=0, ge=0, le=5)
    hyperpigmentation_severity: int = Field(default=0, ge=0, le=5)
    uneven_tone_severity: int = Field(default=0, ge=0, le=5)
    texture_severity: int = Field(default=0, ge=0, le=5)
    dehydration_severity: int = Field(default=0, ge=0, le=5)
    oiliness_severity: int = Field(default=0, ge=0, le=5)
    redness_severity: int = Field(default=0, ge=0, le=5)
    barrier_concerns_severity: int = Field(default=0, ge=0, le=5)
    reported_sensitivities: List[str] = Field(default_factory=list)
    lifestyle_water: float = 2.5 # supports liters (e.g. 2.5) or mL
    lifestyle_water_ml: Optional[float] = None
    lifestyle_sleep: float = 7.5
    lifestyle_sleep_quality: int = Field(default=8, ge=1, le=10)
    lifestyle_stress: str = "low"
    routine_consistency_pct: Optional[float] = None

class FactorContribution(BaseModel):
    weight: str
    score: float
    contribution: float
    explanation: Optional[str] = None

class TextualAssessmentResponse(BaseModel):
    baseline_score: float
    score_breakdown: Dict[str, float]
    factor_contributions: Dict[str, FactorContribution]
    mapped_actives: List[str]
    recommended_products: List[Dict]
    triage_recommendation: Optional[str] = "Skincare Consultant"
    triage_reason: Optional[str] = None
    reported_concerns_summary: List[str] = Field(default_factory=list)
    disclaimer: str
