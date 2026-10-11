from fastapi import APIRouter, HTTPException, Depends
from app.schemas.ingredients import IngredientAnalysisRequest, IngredientAnalysisResponse
from app.services.ingredient_engine import check_ingredient_conflicts

router = APIRouter()

@router.post("/ingredients/analyze", response_model=IngredientAnalysisResponse)
async def analyze_ingredients(request: IngredientAnalysisRequest):
    if not request.ingredients:
        raise HTTPException(status_code=400, detail="Ingredients list cannot be empty")
    
    result = check_ingredient_conflicts(
        ingredients=request.ingredients,
        user_allergies=request.user_allergies
    )
    return IngredientAnalysisResponse(**result)
