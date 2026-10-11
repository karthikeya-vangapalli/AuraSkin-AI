from beanie import Document
from pydantic import Field, BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.lifestyle import LifestyleLog

class RoutineItem(BaseModel):
    step_name: str
    product_name: str
    product_type: str  # Cleanser, Serum, Moisturizer, Sunscreen, Exfoliant
    active_ingredients: List[str] = Field(default_factory=list)
    time_of_day: str  # Morning, Evening, Both
    instructions: Optional[str] = None

class SkinProfile(Document):
    user_id: str = Field(..., index=True, unique=True)
    skin_type: str  # Oily, Dry, Combination, Sensitive, Normal
    age_group: Optional[str] = None  # e.g., "18-24", "25-34", "35-44", "45-54", "55+"
    skin_concerns: List[str] = Field(default_factory=list)  # Acne, Hyperpigmentation, Fine Lines, Redness, Dehydration
    allergies: List[str] = Field(default_factory=list)  # Fragrance, Parabens, Sulfates, Essential Oils
    sensitivities: List[str] = Field(default_factory=list)  # Retinoids, AHA/BHA, L-Ascorbic Acid
    ingredient_allergies: List[str] = Field(default_factory=list)
    active_sensitivities: List[str] = Field(default_factory=list)
    fitzpatrick_scale: Optional[int] = None
    climate_environment: Optional[str] = None
    morning_routine: List[RoutineItem] = Field(default_factory=list)
    evening_routine: List[RoutineItem] = Field(default_factory=list)
    skin_health_score: float = 85.0
    triage_recommendation: Optional[str] = "Unassessed"
    triage_reason: Optional[str] = None
    reported_concerns_summary: List[str] = Field(default_factory=list)
    clinical_notes: Optional[str] = None
    consultant_recommendations: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "skin_profiles"
