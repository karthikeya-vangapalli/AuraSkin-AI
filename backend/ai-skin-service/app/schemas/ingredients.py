from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class IngredientAnalysisRequest(BaseModel):
    ingredients: List[str] = Field(..., description="List of active or product ingredients to analyze")
    user_allergies: Optional[List[str]] = Field(default_factory=list, description="User known allergies or sensitive substances")

class IngredientConflict(BaseModel):
    ingredient_1: str
    ingredient_2: str
    severity: str = Field(..., description="Severity level: High, Moderate, or Mild")
    warning: str
    recommendation: str

class AM_PMSplit(BaseModel):
    am: List[str]
    pm: List[str]
    guidance: List[str]

class FrequencyCap(BaseModel):
    ingredient: str
    max_frequency: str
    guidance: str

class IngredientAnalysisResponse(BaseModel):
    is_safe: bool
    conflicts: List[IngredientConflict]
    allergens_found: List[str]
    am_pm_split_suggestion: AM_PMSplit
    spf_required: bool
    photosensitivity_warnings: List[str]
    frequency_caps: List[FrequencyCap]
    summary: str
