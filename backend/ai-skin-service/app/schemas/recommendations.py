from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DupeItem(BaseModel):
    name: str
    brand: str
    price: float
    savings_percentage: float
    key_shared_actives: List[str]
    similarity_reason: str

class ProductItem(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    price: float
    suitability_score: float
    match_reasons: List[str]
    key_actives: List[str]
    is_spf: bool = False
    dupe_alternative: Optional[DupeItem] = None

class RoutineGap(BaseModel):
    missing_step: str
    importance: str
    reason: str
    recommended_products: List[ProductItem]

class ProductRecommendationRequest(BaseModel):
    skin_profile: Dict[str, Any] = Field(
        ...,
        description="User skin profile including skin_type, skin_concerns, allergies, sensitivity"
    )
    budget_max: Optional[float] = Field(0.0, description="Max budget constraint in USD. 0 for no limit.")
    preferences: Optional[List[str]] = Field(default_factory=list, description="e.g. ['fragrance-free', 'vegan', 'cruelty-free']")
    current_routine_steps: Optional[List[str]] = Field(
        default_factory=list,
        description="Current user routine steps, e.g. ['cleanser', 'serum']"
    )

class ProductRecommendationResponse(BaseModel):
    recommended_products: List[ProductItem]
    routine_gaps: List[RoutineGap]
    total_recommendations: int
    summary: str
