from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Optional
from datetime import datetime
import os
from pymongo import MongoClient
from app.schemas.skin import SkinAnalysisRequest, SkinAnalysisResponse, RoutineStep
from app.api.deps import get_current_user

router = APIRouter()

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
_mongo_client = None

def get_mongo_db():
    global _mongo_client
    if _mongo_client is None:
        try:
            _mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=2000)
        except Exception:
            return None
    try:
        return _mongo_client["skin_profile_db"]
    except Exception:
        return None

LATEST_ASSESSMENTS: Dict[str, dict] = {}

STRESS_DEDUCTIONS = {
    "low": 0.0,
    "medium": 5.0,
    "high": 15.0,
}

# Priority groups for concerns
PRIORITY_ORDER = [
    {"barrier_damage", "redness", "extreme_dryness"},
    {"active_acne"},
    {"hyperpigmentation", "texture"},
]

# Seasonal placeholder adjustments
SEASON_ADJ = {
    "summer": ["lightweight gel moisturizer", "broad-spectrum SPF 50"],
    "winter": ["rich cream moisturizer", "hydrating serum"],
    "monsoon": ["oil-control cleanser", "non-comedogenic moisturizer"],
    "spring_fall": ["balanced lotion", "antioxidant serum"],
}

def _compute_score(req: SkinAnalysisRequest) -> tuple[float, Dict[str, float]]:
    hydration_deduction = max(0.0, (2.5 - req.water_intake) / 2.5 * 20.0)
    sleep_deduction = max(0.0, (7.0 - req.sleep_hours) / 7.0 * 15.0)
    stress_deduction = STRESS_DEDUCTIONS[req.stress_level]
    severity_deduction = (req.acne_severity + req.redness_level) * 3.0
    concerns_deduction = len(req.skin_concerns) * 3.0

    hydration_score = max(0.0, 100.0 - hydration_deduction)
    sleep_score = max(0.0, 100.0 - sleep_deduction)
    stress_score = 100.0 - stress_deduction
    barrier_score = max(0.0, 100.0 - severity_deduction - concerns_deduction)
    overall_score = max(
        0.0,
        min(
            100.0,
            100.0
            - hydration_deduction
            - sleep_deduction
            - stress_deduction
            - severity_deduction
            - concerns_deduction,
        ),
    )
    return overall_score, {
        "hydration": hydration_score,
        "sleep": sleep_score,
        "stress": stress_score,
        "barrier": barrier_score,
    }

def _prioritize_concerns(concerns: List[str]) -> List[str]:
    ordered = []
    remaining = set(concerns)
    for group in PRIORITY_ORDER:
        group_hits = [c for c in concerns if c in group]
        ordered.extend(group_hits)
        remaining -= set(group_hits)
    ordered.extend([c for c in concerns if c in remaining])
    return ordered

def _build_routine(is_am: bool, season: str, stress: str) -> List[RoutineStep]:
    steps = []
    base_steps = [
        (1, "cleansing", "cleanser", "gentle surfactants", "remove impurities"),
        (2, "toning", "toner", "niacinamide", "balance pH"),
        (3, "treatment", "serum", "vitamin C", "brighten skin"),
        (4, "moisturizing", "moisturizer", "ceramides", "restore barrier"),
    ]
    for step_num, cat, ptype, ingredient, reason in base_steps:
        steps.append(RoutineStep(
            step=step_num,
            category=cat,
            product_type=ptype,
            key_ingredient=ingredient,
            reason=reason,
        ))
    # Add sunscreen in AM
    if is_am:
        steps.append(RoutineStep(
            step=5,
            category="protection",
            product_type="sunscreen",
            key_ingredient="broad-spectrum SPF",
            reason="UV protection",
        ))
    # Adjust for high stress
    if stress == "high":
        steps.append(RoutineStep(
            step=6,
            category="calming",
            product_type="mask",
            key_ingredient="centella asiatica",
            reason="reduce stress‑induced inflammation",
        ))
    # Seasonal tweak (placeholder)
    if season in SEASON_ADJ:
        steps.append(RoutineStep(
            step=7,
            category="seasonal",
            product_type="supplement",
            key_ingredient=SEASON_ADJ[season][0] if SEASON_ADJ[season] else "",
            reason=f"season‑specific care for {season}",
        ))
    return steps

@router.post("/skin/analyze", response_model=SkinAnalysisResponse)
async def analyze_skin(request: SkinAnalysisRequest, current_user: str = Depends(get_current_user)):
    if request.stress_level not in STRESS_DEDUCTIONS:
        raise HTTPException(status_code=400, detail="Invalid stress_level value")
    overall_score, subscores = _compute_score(request)
    improvement = (
        overall_score - request.previous_score
        if request.previous_score is not None
        else 0.0
    )
    prioritized = _prioritize_concerns(request.skin_concerns)
    seasonal = SEASON_ADJ.get(request.current_season, [])
    am = _build_routine(is_am=True, season=request.current_season, stress=request.stress_level)
    pm = _build_routine(is_am=False, season=request.current_season, stress=request.stress_level)
    return SkinAnalysisResponse(
        overall_skin_health_score=round(overall_score, 2),
        improvement_delta=round(improvement, 2),
        score_breakdown={k: round(v, 2) for k, v in subscores.items()},
        prioritized_concerns=prioritized,
        seasonal_adjustments=seasonal,
        am_routine=am,
        pm_routine=pm,
        engine_mode="deterministic_rule_engine_v1",
    )

from app.schemas.skin import TextualAssessmentRequest, TextualAssessmentResponse
from app.services.recommendation_engine import generate_recommendations
from fastapi import Request
import httpx

@router.post("/assess-textual", response_model=TextualAssessmentResponse)
@router.post("/skin/assess-textual", response_model=TextualAssessmentResponse)
async def assess_textual(
    req: TextualAssessmentRequest, 
    request: Request,
    current_user: str = Depends(get_current_user)
):
    """
    Deterministic Self-Reported Skin Assessment Scoring Engine.
    Strict PDF Weight Allocation:
    1. Skin Condition Assessment: 35%
    2. Lifestyle Habits: 20%
    3. Sleep Quality: 15%
    4. Routine Consistency: 20%
    5. Hydration Level: 10%
    """
    # 1. Skin Condition (35%)
    # Max possible severity score = 5 * (3 + 2 + 2 + 2 + 2 + 1 + 2 + 4) = 5 * 18 = 90
    total_severity = (
        req.acne_severity * 3 +
        req.hyperpigmentation_severity * 2 +
        req.uneven_tone_severity * 2 +
        req.texture_severity * 2 +
        req.dehydration_severity * 2 +
        req.oiliness_severity * 1 +
        req.redness_severity * 2 +
        req.barrier_concerns_severity * 4
    )
    condition_score = max(0.0, min(100.0, 100.0 - (total_severity / 90.0 * 100.0)))

    # 2. Lifestyle Habits (20%)
    stress_map = {"low": 100.0, "medium": 75.0, "high": 40.0}
    stress_score = stress_map.get(req.lifestyle_stress.lower(), 75.0)

    spf_mult = {
        "reapplied": 1.0,
        "daily": 0.95,
        "occasional": 0.65,
        "never": 0.35
    }.get(req.spf_consistency.lower(), 0.85)

    sun_penalty = max(0.0, (req.sun_exposure_hours - 2.0) * 12.0)
    sun_score = max(30.0, min(100.0, (100.0 - sun_penalty) * spf_mult))
    lifestyle_score = max(0.0, min(100.0, (stress_score * 0.5) + (sun_score * 0.5)))

    # 3. Sleep Quality (15%)
    hours = req.lifestyle_sleep
    if 7.0 <= hours <= 9.0:
        duration_score = 100.0
    elif 6.0 <= hours < 7.0 or 9.0 < hours <= 10.0:
        duration_score = 85.0
    elif 5.0 <= hours < 6.0 or 10.0 < hours <= 11.0:
        duration_score = 65.0
    else:
        duration_score = max(20.0, 45.0 - abs(hours - 7.5) * 5.0)

    quality_score = max(10.0, min(100.0, (req.lifestyle_sleep_quality / 10.0) * 100.0))
    sleep_score = max(0.0, min(100.0, (duration_score * 0.6) + (quality_score * 0.4)))

    # 4. Routine Consistency (20%)
    consistency_explanation = None
    consistency_score = 75.0
    auth_header = request.headers.get("Authorization")
    
    if req.routine_consistency_pct is not None:
        consistency_score = max(0.0, min(100.0, req.routine_consistency_pct))
        consistency_explanation = f"User-reported historical adherence rate of {consistency_score:.1f}% applied."
    elif auth_header:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get("http://127.0.0.1:8002/api/v1/profile/analytics", headers={"Authorization": auth_header})
                if res.status_code == 200:
                    adherence_val = res.json().get("completion_rate_30d")
                    if adherence_val is not None:
                        consistency_score = max(0.0, min(100.0, float(adherence_val)))
                        consistency_explanation = f"Empirical 30-day routine adherence rate of {consistency_score:.1f}% retrieved from profile service."
        except Exception:
            pass

    if consistency_explanation is None:
        consistency_score = 75.0
        consistency_explanation = "First-time assessment: Baseline neutral adherence score (75.0) applied as no historical routine logs exist."

    # 5. Hydration Level (10%)
    water_ml = req.lifestyle_water_ml if req.lifestyle_water_ml is not None else (
        req.lifestyle_water * 1000.0 if req.lifestyle_water < 20.0 else req.lifestyle_water
    )
    if water_ml < 1000.0:
        hydration_score = max(20.0, (water_ml / 1000.0) * 50.0)
    elif water_ml < 2000.0:
        hydration_score = 50.0 + ((water_ml - 1000.0) / 1000.0) * 50.0
    elif 2000.0 <= water_ml <= 3200.0:
        hydration_score = 100.0
    elif water_ml <= 4500.0:
        hydration_score = 95.0
    else:
        hydration_score = 85.0

    # Final Total Weighted Score
    final_score = (
        (condition_score * 0.35) +
        (lifestyle_score * 0.20) +
        (sleep_score * 0.15) +
        (consistency_score * 0.20) +
        (hydration_score * 0.10)
    )
    final_score = round(max(0.0, min(100.0, final_score)), 1)

    score_breakdown = {
        "condition": round(condition_score, 1),
        "lifestyle": round(lifestyle_score, 1),
        "sleep": round(sleep_score, 1),
        "consistency": round(consistency_score, 1),
        "hydration": round(hydration_score, 1)
    }

    factor_contributions = {
        "skin_condition": {
            "weight": "35%",
            "score": round(condition_score, 1),
            "contribution": round(condition_score * 0.35, 1),
            "explanation": f"Evaluated concern dimensions with aggregate severity index {total_severity:.1f}/90.0"
        },
        "lifestyle_habits": {
            "weight": "20%",
            "score": round(lifestyle_score, 1),
            "contribution": round(lifestyle_score * 0.20, 1),
            "explanation": f"Stress level: {req.lifestyle_stress.title()} | SPF practice: {req.spf_consistency.title()}"
        },
        "sleep_quality": {
            "weight": "15%",
            "score": round(sleep_score, 1),
            "contribution": round(sleep_score * 0.15, 1),
            "explanation": f"Duration: {req.lifestyle_sleep} hrs (Quality rating: {req.lifestyle_sleep_quality}/10)"
        },
        "routine_consistency": {
            "weight": "20%",
            "score": round(consistency_score, 1),
            "contribution": round(consistency_score * 0.20, 1),
            "explanation": consistency_explanation
        },
        "hydration_level": {
            "weight": "10%",
            "score": round(hydration_score, 1),
            "contribution": round(hydration_score * 0.10, 1),
            "explanation": f"Daily intake normalized to {int(water_ml)} mL (optimal: 2000–3000 mL)"
        }
    }

    actives = []
    concerns = []
    if req.acne_severity > 0:
        actives.append("Salicylic Acid")
        concerns.append("Acne")
    if req.hyperpigmentation_severity > 0 or req.uneven_tone_severity > 0:
        actives.append("Azelaic Acid")
        actives.append("Niacinamide")
        concerns.append("Hyperpigmentation")
    if req.dehydration_severity > 0:
        actives.append("Hyaluronic Acid")
        concerns.append("Dehydration")
    if req.barrier_concerns_severity > 0 or req.redness_severity > 0:
        actives.append("Ceramides")
        actives.append("Centella Asiatica")
        concerns.extend(["Redness", "Barrier Damage"])

    mapped_actives = [a for a in actives if not any(s.lower() in a.lower() for s in req.reported_sensitivities)]
    
    # Automated Triage Recommendation Logic
    concerns_summary = []
    clinical_flags = []
    cosmetic_flags = []

    if req.acne_severity >= 4:
        clinical_flags.append(f"Severe Acne ({req.acne_severity}/5)")
        concerns_summary.append(f"Acne ({req.acne_severity}/5)")
    elif req.acne_severity > 0:
        cosmetic_flags.append(f"Mild-Mod Acne ({req.acne_severity}/5)")
        concerns_summary.append(f"Acne ({req.acne_severity}/5)")

    if req.redness_severity >= 4:
        clinical_flags.append(f"Severe Redness/Rosacea ({req.redness_severity}/5)")
        concerns_summary.append(f"Redness ({req.redness_severity}/5)")
    elif req.redness_severity > 0:
        cosmetic_flags.append(f"Redness ({req.redness_severity}/5)")
        concerns_summary.append(f"Redness ({req.redness_severity}/5)")

    if req.barrier_concerns_severity >= 4:
        clinical_flags.append(f"Acute Barrier Damage ({req.barrier_concerns_severity}/5)")
        concerns_summary.append(f"Barrier ({req.barrier_concerns_severity}/5)")
    elif req.barrier_concerns_severity > 0:
        cosmetic_flags.append(f"Barrier Concern ({req.barrier_concerns_severity}/5)")
        concerns_summary.append(f"Barrier ({req.barrier_concerns_severity}/5)")

    # Check reported sensitivities for clinical dermatological indications
    for sens in req.reported_sensitivities:
        s_lower = sens.lower()
        if any(term in s_lower for term in ["rosacea", "eczema", "dermatitis", "cystic", "nodular", "infection", "peeling", "rash", "irritation"]):
            clinical_flags.append(f"Condition: {sens}")
            concerns_summary.append(sens)

    if req.dehydration_severity > 0:
        cosmetic_flags.append(f"Dehydration ({req.dehydration_severity}/5)")
        concerns_summary.append(f"Dehydration ({req.dehydration_severity}/5)")
    if req.hyperpigmentation_severity > 0:
        cosmetic_flags.append(f"Hyperpigmentation ({req.hyperpigmentation_severity}/5)")
        concerns_summary.append(f"Pigmentation ({req.hyperpigmentation_severity}/5)")
    if req.texture_severity > 0:
        cosmetic_flags.append(f"Texture ({req.texture_severity}/5)")
        concerns_summary.append(f"Texture ({req.texture_severity}/5)")
    if req.oiliness_severity > 0:
        cosmetic_flags.append(f"Excess Oil ({req.oiliness_severity}/5)")
        concerns_summary.append(f"Oiliness ({req.oiliness_severity}/5)")

    if len(clinical_flags) > 0:
        triage_rec = "Dermatologist"
        triage_reason = "Clinical care indicated: " + "; ".join(clinical_flags)
    else:
        triage_rec = "Skincare Consultant"
        triage_reason = "Cosmetic routine and ingredient optimization indicated: " + ("; ".join(cosmetic_flags) if cosmetic_flags else "Standard routine building")

    # Persist latest assessment locally and in MongoDB
    assessment_record = {
        "user_id": str(current_user),
        "skin_type": req.skin_type,
        "fitzpatrick_scale": req.fitzpatrick_phototype,
        "climate": req.climate,
        "acne_severity": req.acne_severity,
        "redness_severity": req.redness_severity,
        "barrier_concerns_severity": req.barrier_concerns_severity,
        "dehydration_severity": req.dehydration_severity,
        "hyperpigmentation_severity": req.hyperpigmentation_severity,
        "texture_severity": req.texture_severity,
        "oiliness_severity": req.oiliness_severity,
        "reported_sensitivities": req.reported_sensitivities,
        "reported_concerns": concerns_summary,
        "triage_suggestion": triage_rec,
        "triage_recommendation": triage_rec,
        "triage_reason": triage_reason,
        "baseline_score": final_score,
        "created_at": datetime.utcnow()
    }
    LATEST_ASSESSMENTS[str(current_user)] = assessment_record

    try:
        db_mongo = get_mongo_db()
        if db_mongo is not None:
            db_mongo.assessments.insert_one(assessment_record.copy())
            db_mongo.skin_profiles.update_one(
                {"user_id": str(current_user)},
                {
                    "$set": {
                        "triage_recommendation": triage_rec,
                        "triage_suggestion": triage_rec,
                        "triage_reason": triage_reason,
                        "reported_concerns_summary": concerns_summary,
                        "skin_health_score": final_score,
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=False
            )
    except Exception as e:
        print(f"MongoDB persistence notice: {e}")

    if auth_header:
        profile_payload = {
            "skin_type": req.skin_type,
            "fitzpatrick_scale": req.fitzpatrick_phototype,
            "climate_environment": req.climate,
            "skin_concerns": list(set(concerns)),
            "sensitivities": req.reported_sensitivities,
            "skin_health_score": final_score,
            "triage_recommendation": triage_rec,
            "triage_reason": triage_reason,
            "reported_concerns_summary": concerns_summary
        }
        async with httpx.AsyncClient() as client:
            try:
                profile_url = "http://profile-service:8002/api/v1/profile"
                await client.post(profile_url, json=profile_payload, headers={"Authorization": auth_header})
            except Exception:
                try:
                    profile_url = "http://127.0.0.1:8002/api/v1/profile"
                    await client.post(profile_url, json=profile_payload, headers={"Authorization": auth_header})
                except Exception as e:
                    print(f"Profile update note: {e}")

    skin_profile_dict = {
        "skin_type": req.skin_type,
        "skin_concerns": list(set(concerns)),
        "allergies": req.reported_sensitivities
    }
    rec_result = generate_recommendations(
        skin_profile=skin_profile_dict,
        budget_max=100.0,
        preferences=[],
        current_routine_steps=[]
    )
    
    return TextualAssessmentResponse(
        baseline_score=final_score,
        score_breakdown=score_breakdown,
        factor_contributions=factor_contributions,
        mapped_actives=list(set(mapped_actives)),
        recommended_products=rec_result.get("recommended_products", []),
        triage_recommendation=triage_rec,
        triage_reason=triage_reason,
        reported_concerns_summary=concerns_summary,
        disclaimer="Self-Reported Skin Assessment: This score is calculated from self-reported user inputs and lifestyle factors. It does not constitute a medical or dermatological diagnosis."
    )

@router.get("/skin/assessments/user/{user_id}/latest")
@router.get("/assessments/user/{user_id}/latest")
async def get_latest_user_assessment(user_id: str):
    """
    Fetch the latest assessment record and triage recommendation for a given user.
    Supports cross-service query from user-service for Admin Directory triage enrichment.
    """
    user_id_str = str(user_id)
    if user_id_str in LATEST_ASSESSMENTS:
        item = LATEST_ASSESSMENTS[user_id_str]
        return {
            "user_id": user_id_str,
            "triage_suggestion": item.get("triage_suggestion") or item.get("triage_recommendation") or "Unassessed",
            "triage_recommendation": item.get("triage_recommendation") or item.get("triage_suggestion") or "Unassessed",
            "triage_reason": item.get("triage_reason"),
            "reported_concerns": item.get("reported_concerns") or [],
            "acne_severity": item.get("acne_severity", 0),
            "redness_severity": item.get("redness_severity", 0),
            "barrier_concerns_severity": item.get("barrier_concerns_severity", 0),
            "sensitivities": item.get("reported_sensitivities") or [],
            "created_at": item.get("created_at").isoformat() if isinstance(item.get("created_at"), datetime) else item.get("created_at")
        }

    try:
        db_mongo = get_mongo_db()
        if db_mongo is not None:
            doc = db_mongo.assessments.find_one({"user_id": user_id_str}, sort=[("created_at", -1)])
            if doc:
                return {
                    "user_id": user_id_str,
                    "triage_suggestion": doc.get("triage_suggestion") or doc.get("triage_recommendation") or "Unassessed",
                    "triage_recommendation": doc.get("triage_recommendation") or doc.get("triage_suggestion") or "Unassessed",
                    "triage_reason": doc.get("triage_reason"),
                    "reported_concerns": doc.get("reported_concerns") or doc.get("reported_concerns_summary") or [],
                    "acne_severity": doc.get("acne_severity", 0),
                    "redness_severity": doc.get("redness_severity", 0),
                    "barrier_concerns_severity": doc.get("barrier_concerns_severity", 0),
                    "sensitivities": doc.get("reported_sensitivities") or [],
                    "created_at": doc.get("created_at").isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at")
                }

            prof = db_mongo.skin_profiles.find_one({"user_id": user_id_str})
            if prof and (prof.get("triage_recommendation") or prof.get("reported_concerns_summary") or prof.get("skin_concerns")):
                concerns = prof.get("reported_concerns_summary") or prof.get("skin_concerns") or []
                rec = prof.get("triage_recommendation") or prof.get("triage_suggestion") or "Skincare Consultant"
                return {
                    "user_id": user_id_str,
                    "triage_suggestion": rec,
                    "triage_recommendation": rec,
                    "triage_reason": prof.get("triage_reason"),
                    "reported_concerns": concerns,
                    "acne_severity": 0,
                    "redness_severity": 0,
                    "barrier_concerns_severity": 0,
                    "sensitivities": prof.get("sensitivities") or prof.get("allergies") or [],
                    "created_at": prof.get("updated_at")
                }
    except Exception as e:
        print(f"Error querying assessment from MongoDB: {e}")

    raise HTTPException(status_code=404, detail="No assessment found for this user.")
