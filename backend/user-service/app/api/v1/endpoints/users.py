from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_password_hash
from app.schemas.user import UserResponse, UserUpdate, RoleUpdate
from app.models.user import User
from app.api.deps import get_current_user, require_roles
from app.core.audit import record_audit_event

router = APIRouter()

from sqlalchemy import or_, func
from app.models.assignment import PatientAssignment
import httpx
import os
from pymongo import MongoClient

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

def classify_triage(data: dict) -> tuple[str, Optional[str], List[str]]:
    """
    Computes triage_suggestion and extracts reported concerns according to specification rules:
    - If user has no completed assessment -> 'Unassessed'
    - Clinical / Dermatologist trigger:
      * Acne severity >= 4 (or cystic / nodular acne)
      * Rosacea, Eczema, active Dermatitis, severe barrier irritation, unexplained rashes, extreme redness
      -> 'Dermatologist'
    - Cosmetic / Skincare Consultant trigger:
      * Cosmetic concerns (Dehydration, Oiliness, Texture, Dullness, Aging, Fine Lines with severity <= 3)
      -> 'Skincare Consultant'
    """
    if not data:
        return "Unassessed", None, []

    reported_concerns = data.get("reported_concerns") or data.get("reported_concerns_summary") or []
    sensitivities = data.get("sensitivities") or data.get("reported_sensitivities") or []
    acne_severity = data.get("acne_severity", 0)
    redness_severity = data.get("redness_severity", 0)
    barrier_severity = data.get("barrier_concerns_severity", 0)

    clinical_flags = []

    # Acne severity >= 4 or cystic / nodular
    if acne_severity >= 4:
        clinical_flags.append(f"Severe Acne ({acne_severity}/5)")
    for c in reported_concerns:
        c_str = str(c).lower()
        if any(term in c_str for term in ["acne (4/5)", "acne (5/5)", "acne 4/5", "acne 5/5", "severe acne", "cystic", "nodular"]):
            if not any("acne" in f.lower() for f in clinical_flags):
                clinical_flags.append("Severe/Cystic Acne")

    # Rosacea, Eczema, active Dermatitis, severe barrier irritation, unexplained rashes
    all_tags = [str(x) for x in reported_concerns + sensitivities]
    clinical_keywords = ["rosacea", "eczema", "dermatitis", "barrier irritation", "barrier damage", "rash", "unexplained rash", "extreme redness", "infection", "peeling"]
    for tag in all_tags:
        tag_lower = tag.lower()
        for kw in clinical_keywords:
            if kw in tag_lower:
                clinical_flags.append(tag)
                break

    if redness_severity >= 4:
        clinical_flags.append(f"Severe Redness/Rosacea ({redness_severity}/5)")
    if barrier_severity >= 4:
        clinical_flags.append(f"Acute Barrier Damage ({barrier_severity}/5)")

    if clinical_flags:
        reason = "Clinical care indicated: " + "; ".join(dict.fromkeys(clinical_flags))
        return "Dermatologist", reason, reported_concerns

    # Check if there are cosmetic concerns or any completed assessment
    if reported_concerns or data.get("skin_type") or data.get("triage_recommendation") or data.get("triage_suggestion") or acne_severity > 0 or data.get("has_assessment"):
        reason = data.get("triage_reason") or "Cosmetic routine and ingredient optimization indicated"
        return "Skincare Consultant", reason, reported_concerns

    return "Unassessed", None, []

@router.get("", response_model=List[UserResponse])
@router.get("/", response_model=List[UserResponse])
async def list_all_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Administrator"]))
):
    """
    List all registered users with real-time search, role filtering, and pagination.
    Enriched with automated triage recommendations and current professional assignments.
    Strictly restricted to Administrator role.
    """
    await record_audit_event(
        db,
        action="VIEW_USER_DIRECTORY",
        actor=current_user,
        details=f"Admin filtered directory (search={search}, role={role})"
    )

    query = select(User)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.email.ilike(term),
                User.full_name.ilike(term)
            )
        )
    if role and role.strip() and role != "All":
        query = query.where(User.role == role.strip())

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    # Pre-fetch strictly active assignments to attach to patients
    assign_q = select(PatientAssignment).where(
        PatientAssignment.status.ilike("active")
    ).order_by(PatientAssignment.assigned_at.desc())
    assign_res = await db.execute(assign_q)
    active_assignments = assign_res.scalars().all()

    # Map professional IDs
    prof_ids = {a.professional_id for a in active_assignments}
    profs_map = {}
    if prof_ids:
        profs_q = select(User).where(User.id.in_(list(prof_ids)))
        profs_res = await db.execute(profs_q)
        for pr in profs_res.scalars().all():
            profs_map[pr.id] = pr

    assignments_by_patient = {}
    for a in active_assignments:
        if a.patient_id not in assignments_by_patient:
            pr = profs_map.get(a.professional_id)
            if pr:
                assignments_by_patient[a.patient_id] = {
                    "id": str(pr.id),
                    "name": pr.full_name or pr.email,
                    "email": pr.email,
                    "role": pr.role
                }

    # Query latest assessment from ai-skin-service or MongoDB for each patient
    enriched_users = []
    async with httpx.AsyncClient(timeout=1.5) as client:
        for u in users:
            triage_sug = "Unassessed"
            triage_reason = None
            reported_concerns = []

            if u.role == "User":
                # 1. First attempt: ai-skin-service endpoint
                try:
                    res = await client.get(f"http://127.0.0.1:8003/api/v1/skin/assessments/user/{u.id}/latest")
                    if res.status_code == 200:
                        assessment_data = res.json()
                        triage_sug, triage_reason, reported_concerns = classify_triage(assessment_data)
                except Exception:
                    pass

                # 2. Second attempt: Direct MongoDB lookup if not resolved
                if triage_sug == "Unassessed":
                    try:
                        db_mongo = get_mongo_db()
                        if db_mongo is not None:
                            doc = db_mongo.assessments.find_one({"user_id": str(u.id)}, sort=[("created_at", -1)])
                            if doc:
                                triage_sug, triage_reason, reported_concerns = classify_triage(doc)
                            else:
                                prof = db_mongo.skin_profiles.find_one({"user_id": str(u.id)})
                                if prof:
                                    triage_sug, triage_reason, reported_concerns = classify_triage({
                                        "reported_concerns": prof.get("reported_concerns_summary") or prof.get("skin_concerns") or [],
                                        "sensitivities": prof.get("sensitivities") or prof.get("allergies") or [],
                                        "triage_recommendation": prof.get("triage_recommendation"),
                                        "triage_reason": prof.get("triage_reason"),
                                        "skin_type": prof.get("skin_type"),
                                        "has_assessment": True
                                    })
                    except Exception:
                        pass

                # 3. Third attempt: profile-service HTTP fallback
                if triage_sug == "Unassessed":
                    try:
                        p_res = await client.get(f"http://127.0.0.1:8002/api/v1/profile/{u.id}")
                        if p_res.status_code == 200:
                            p_data = p_res.json()
                            triage_sug, triage_reason, reported_concerns = classify_triage(p_data)
                    except Exception:
                        pass

            assigned_prof = assignments_by_patient.get(u.id)

            enriched_users.append(
                UserResponse(
                    id=u.id,
                    email=u.email,
                    full_name=u.full_name,
                    role=u.role,
                    status="Active" if u.is_active else "Inactive",
                    is_active=u.is_active,
                    triage_suggestion=triage_sug,
                    triage_recommendation=triage_sug,
                    triage_reason=triage_reason,
                    reported_concerns=reported_concerns,
                    assigned_professional=assigned_prof,
                    created_at=u.created_at,
                    updated_at=u.updated_at
                )
            )

    return enriched_users

@router.get("/stats/summary")
async def get_user_stats_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Administrator"]))
):
    """
    Returns platform statistics: total users count, breakdown by role, active users count.
    """
    query = select(User.role, func.count(User.id)).group_by(User.role)
    result = await db.execute(query)
    role_counts = {r: count for r, count in result.all()}

    total_query = select(func.count(User.id))
    total_res = await db.execute(total_query)
    total_users = total_res.scalar() or 0

    active_query = select(func.count(User.id)).where(User.is_active == True)
    active_res = await db.execute(active_query)
    active_users = active_res.scalar() or 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "role_breakdown": {
            "User": role_counts.get("User", 0),
            "Skincare Consultant": role_counts.get("Skincare Consultant", 0),
            "Dermatologist": role_counts.get("Dermatologist", 0),
            "Administrator": role_counts.get("Administrator", 0),
        }
    }

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user profile by UUID. Horizontal access control enforced:
    Accessible only by the account owner or an Administrator.
    """
    if current_user.id != user_id and current_user.role != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Horizontal access violation: Not authorized to view another user's profile."
        )

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return user

@router.patch("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    role_in: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Administrator"]))
):
    """
    Modifies an account's role. Strictly restricted to Administrators.
    Prevents vertical privilege escalation by standard users.
    """
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    old_role = user.role
    new_role = role_in.role.value if hasattr(role_in.role, 'value') else role_in.role
    user.role = new_role

    await db.commit()
    await db.refresh(user)

    await record_audit_event(
        db,
        action="UPDATE_USER_ROLE",
        actor=current_user,
        target_id=str(user_id),
        details=f"Modified role from '{old_role}' to '{new_role}'"
    )

    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update user profile data.
    Enforces horizontal isolation and blocks unauthorized role or status tampering.
    """
    if current_user.id != user_id and current_user.role != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Horizontal access violation: Not authorized to modify this user account."
        )

    # Prevent standard users from escalating their own role
    if user_in.role is not None:
        if current_user.role != "Administrator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Privilege escalation prohibited. User role modifications require administrative role endpoint."
            )

    # Prevent standard users from altering account activation status
    if user_in.is_active is not None:
        if current_user.role != "Administrator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account status modification requires Administrator authorization."
            )

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    if user_in.email is not None:
        user.email = user_in.email
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)
    if user_in.role is not None and current_user.role == "Administrator":
        user.role = user_in.role.value if hasattr(user_in.role, 'value') else user_in.role
    if user_in.is_active is not None and current_user.role == "Administrator":
        user.is_active = user_in.is_active

    await db.commit()
    await db.refresh(user)

    await record_audit_event(
        db,
        action="UPDATE_USER_ACCOUNT",
        actor=current_user,
        target_id=str(user_id),
        details="User account details updated"
    )

    return user
