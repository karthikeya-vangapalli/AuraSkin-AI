from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()

class SkinAnalysisResult(BaseModel):
    overall_health_score: float
    detected_concerns: List[Dict[str, str]]
    hydration_level: str
    redness_index: float
    pore_visibility: str
    recommended_actives: List[str]

@router.post("/scan-skin", response_model=SkinAnalysisResult)
async def scan_skin_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    # Mock AI vision processing pipeline
    return SkinAnalysisResult(
        overall_health_score=88.5,
        detected_concerns=[
            {"concern": "Mild Hyperpigmentation", "severity": "Moderate", "location": "Cheeks"},
            {"concern": "Dehydration", "severity": "Low", "location": "T-Zone"}
        ],
        hydration_level="64%",
        redness_index=12.3,
        pore_visibility="Low-Medium",
        recommended_actives=["Niacinamide 5%", "Hyaluronic Acid", "Salicylic Acid 2%"]
    )
