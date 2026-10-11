import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, and_
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Dict, Optional
from uuid import UUID

from app.core.database import get_db
from app.models.user import User
from app.models.note import ClinicalNote
from app.models.assignment import PatientAssignment
from app.api.deps import require_roles
from app.core.audit import record_audit_event

router = APIRouter()

# Explicit backend environment gating for demo / quarantine isolation
APP_ENV = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "development")).lower()
IS_DEV_ENV = APP_ENV in ["development", "dev", "local", "test"]

class NoteCreate(BaseModel):
    content: str

# Quarantined mock development records. Never mixed with production database collections.
MOCK_PATIENTS = [
    {
        "id": "mock-uuid-1",
        "full_name": "Sarah Jenkins",
        "email": "sarah.j@example.com",
        "skin_health_score": 72.5,
        "adherence_rate": 88,
        "concerns": ["Acne", "Redness"],
        "notes": "Responding well to Azelaic Acid.",
        "is_demo": True
    },
    {
        "id": "mock-uuid-2",
        "full_name": "Michael Chen",
        "email": "mchen@example.com",
        "skin_health_score": 60.0,
        "adherence_rate": 45,
        "concerns": ["Hyperpigmentation"],
        "notes": "Needs routine simplification.",
        "is_demo": True
    },
    {
        "id": "mock-uuid-3",
        "full_name": "Emma Watson",
        "email": "emma@example.com",
        "skin_health_score": 91.0,
        "adherence_rate": 98,
        "concerns": ["Dehydration"],
        "notes": "Excellent barrier recovery.",
        "is_demo": True
    }
]

@router.get("/patients")
async def get_clinical_patients(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Dermatologist"]))
):
    """
    Returns clinical patient list strictly for authorized Dermatologists.
    Enforces clinical privacy: Administrators and unprivileged roles are forbidden.
    """
    await record_audit_event(
        db,
        action="VIEW_CLINICAL_DIRECTORY",
        actor=current_user,
        details=f"Accessed clinical patient directory (search={search})"
    )

    # Retrieve active patient assignments for this dermatologist
    assign_q = select(PatientAssignment.patient_id).where(
        and_(
            PatientAssignment.professional_id == current_user.id,
            PatientAssignment.status == "active"
        )
    )
    assign_res = await db.execute(assign_q)
    assigned_patient_ids = set(assign_res.scalars().all())

    query = select(User).where(User.role == "User")
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(or_(User.email.ilike(term), User.full_name.ilike(term)))
    result = await db.execute(query)
    all_users = result.scalars().all()

    # Filter to only users who are actively assigned to this dermatologist
    users = [u for u in all_users if u.id in assigned_patient_ids]

    # Fetch dermatologist clinical notes
    notes_query = select(ClinicalNote).where(ClinicalNote.note_type == "clinical")
    notes_res = await db.execute(notes_query)
    all_notes = notes_res.scalars().all()
    notes_by_patient: Dict[str, List[str]] = {}
    notes_history_by_patient: Dict[str, List[dict]] = {}
    for n in all_notes:
        notes_by_patient.setdefault(n.patient_id, []).append(n.content)
        notes_history_by_patient.setdefault(n.patient_id, []).append({
            "id": str(n.id),
            "content": n.content,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M")
        })

    patients = []
    for u in users:
        u_id_str = str(u.id)
        u_notes = "\n".join(notes_by_patient.get(u_id_str, []))
        patients.append({
            "id": u_id_str,
            "full_name": u.full_name or u.email,
            "email": u.email,
            "skin_health_score": 85.0,
            "adherence_rate": 75,
            "concerns": ["Active Routine Logged"],
            "notes": u_notes,
            "notes_history": notes_history_by_patient.get(u_id_str, []),
            "is_demo": False
        })

    return patients

@router.post("/patients/{patient_id}/notes")
async def add_clinical_note(
    patient_id: str,
    note_in: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Dermatologist"]))
):
    """
    Adds a persistent clinical diagnosis / treatment note authored by a Dermatologist.
    Enforces confidentiality: Administrators cannot author or access without clinical role.
    """
    if not note_in.content or not note_in.content.strip():
        raise HTTPException(status_code=400, detail="Note content cannot be empty.")

    note = ClinicalNote(
        patient_id=patient_id,
        author_id=current_user.id,
        note_type="clinical",
        content=note_in.content.strip()
    )
    db.add(note)
    await db.commit()

    await record_audit_event(
        db,
        action="CREATE_CLINICAL_NOTE",
        actor=current_user,
        target_id=patient_id,
        details="Authored medical diagnosis / treatment recommendation"
    )

    return {"status": "success", "message": "Clinical note persisted successfully."}

@router.get("/consultations/clients")
async def get_consultation_clients(
    search: Optional[str] = None,
    concern: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Skincare Consultant"]))
):
    """
    Returns client consultation desk roster strictly for authorized Skincare Consultants.
    Enforces cosmetic consultation scope and client authorization.
    """
    await record_audit_event(
        db,
        action="VIEW_CONSULTATION_CLIENTS",
        actor=current_user,
        details=f"Consultant viewed roster (search={search}, concern={concern})"
    )

    # Retrieve active client assignments for this consultant
    assign_q = select(PatientAssignment.patient_id).where(
        and_(
            PatientAssignment.professional_id == current_user.id,
            PatientAssignment.status == "active"
        )
    )
    assign_res = await db.execute(assign_q)
    assigned_client_ids = set(assign_res.scalars().all())

    query = select(User).where(User.role == "User")
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(or_(User.email.ilike(term), User.full_name.ilike(term)))

    result = await db.execute(query)
    all_users = result.scalars().all()

    # Filter to only users who are actively assigned to this consultant
    users = [u for u in all_users if u.id in assigned_client_ids]

    consultant_notes_query = select(ClinicalNote).where(ClinicalNote.note_type == "consultant")
    c_notes_res = await db.execute(consultant_notes_query)
    all_c_notes = c_notes_res.scalars().all()
    c_notes_by_client: Dict[str, List[dict]] = {}
    for n in all_c_notes:
        c_notes_by_client.setdefault(n.patient_id, []).append({
            "id": str(n.id),
            "content": n.content,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M")
        })

    clients = []
    for u in users:
        u_id = str(u.id)
        u_concerns = ["Dehydration", "Texture"]
        if concern and concern != "All" and concern not in u_concerns:
            continue

        clients.append({
            "id": u_id,
            "full_name": u.full_name or u.email,
            "email": u.email,
            "skin_health_score": 82.0,
            "skin_type": "Combination",
            "fitzpatrick_scale": "Type III",
            "concerns": u_concerns,
            "current_actives": ["Niacinamide 10%", "Hyaluronic Acid"],
            "current_am_routine": ["Gentle Foaming Cleanser", "Niacinamide 10% Serum", "Barrier Cream", "Broad-Spectrum SPF 50"],
            "current_pm_routine": ["Micellar Cleansing Water", "Hyaluronic Acid 2%", "Ceramide Night Cream"],
            "allergies": ["Fragrance"],
            "has_conflict": False,
            "conflict_warning": None,
            "adherence_rate": 78,
            "recommendations": c_notes_by_client.get(u_id, []),
            "is_demo": False
        })

    return clients

@router.post("/consultations/{client_id}/recommendations")
async def add_consultation_recommendation(
    client_id: str,
    note_in: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Skincare Consultant"]))
):
    """
    Persists regimen optimization / ingredient recommendations from Skincare Consultants.
    """
    if not note_in.content or not note_in.content.strip():
        raise HTTPException(status_code=400, detail="Recommendation content cannot be empty.")

    note = ClinicalNote(
        patient_id=client_id,
        author_id=current_user.id,
        note_type="consultant",
        content=note_in.content.strip()
    )
    db.add(note)
    await db.commit()

    await record_audit_event(
        db,
        action="CREATE_CONSULTANT_RECOMMENDATION",
        actor=current_user,
        target_id=client_id,
        details="Provided active ingredient swap / regimen recommendation"
    )

    return {"status": "success", "message": "Consultant recommendation saved."}

@router.get("/patients/me/notes")
async def get_my_notes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["User"]))
):
    """
    Allows standard users to retrieve clinical notes and consultant recommendations
    strictly assigned to their own user profile (horizontal privacy enforced).
    """
    await record_audit_event(
        db,
        action="VIEW_PERSONAL_NOTES",
        actor=current_user,
        target_id=str(current_user.id),
        details="Viewed assigned clinical notes and recommendations"
    )

    notes_query = (
        select(ClinicalNote)
        .where(ClinicalNote.patient_id == str(current_user.id))
        .order_by(ClinicalNote.created_at.desc())
    )
    notes_res = await db.execute(notes_query)
    all_notes = notes_res.scalars().all()

    return [
        {
            "id": str(n.id),
            "type": n.note_type,
            "content": n.content,
            "date": n.created_at.isoformat()
        }
        for n in all_notes
    ]
