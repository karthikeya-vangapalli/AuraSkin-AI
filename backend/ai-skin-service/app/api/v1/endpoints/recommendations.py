from fastapi import APIRouter, HTTPException
from app.schemas.recommendations import ProductRecommendationRequest, ProductRecommendationResponse
from app.services.recommendation_engine import generate_recommendations

router = APIRouter()

@router.post("/products/recommend", response_model=ProductRecommendationResponse)
async def recommend_products(request: ProductRecommendationRequest):
    result = generate_recommendations(
        skin_profile=request.skin_profile,
        budget_max=request.budget_max or 0.0,
        preferences=request.preferences or [],
        current_routine_steps=request.current_routine_steps or []
    )
    return ProductRecommendationResponse(**result)
