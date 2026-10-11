from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.assignment import PatientAssignment
from app.api.deps import require_roles
from app.core.audit import record_audit_event

router = APIRouter()

class AssignmentCreate(BaseModel):
    patient_id: UUID
    professional_id: UUID

class AssignmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    professional_id: UUID
    professional_name: Optional[str] = None
    professional_email: Optional[str] = None
    professional_role: Optional[str] = None
    assigned_at: datetime
    status: str

    class Config:
        orm_mode = True

@router.post("", response_model=AssignmentResponse)
@router.post("/", response_model=AssignmentResponse)
async def assign_patient(
    assignment_in: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Administrator"]))
):
    """
    Assign a patient (User role) to a professional (Dermatologist or Skincare Consultant).
    Restricted to Administrator role.
    """
    # Verify patient exists and is a User
    patient_query = select(User).where(User.id == assignment_in.patient_id)
    p_res = await db.execute(patient_query)
    patient = p_res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient user not found.")
    if patient.role != "User":
        raise HTTPException(status_code=400, detail="Assigned subject must have 'User' role.")

    # Verify professional exists and has valid role
    prof_query = select(User).where(User.id == assignment_in.professional_id)
    pr_res = await db.execute(prof_query)
    professional = pr_res.scalars().first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional user not found.")
    if professional.role not in ["Dermatologist", "Skincare Consultant"]:
        raise HTTPException(
            status_code=400,
            detail="Assigned professional must have 'Dermatologist' or 'Skincare Consultant' role."
        )

    # Check if an existing assignment row exists for this patient (active or previously revoked)
    existing_q = select(PatientAssignment).where(PatientAssignment.patient_id == assignment_in.patient_id)
    ex_res = await db.execute(existing_q)
    existing = ex_res.scalars().first()

    if existing:
        existing.professional_id = assignment_in.professional_id
        existing.status = "active"
        existing.assigned_at = datetime.utcnow()
        db.add(existing)
        await db.commit()
        await db.refresh(existing)
        target_assignment = existing
    else:
        new_assignment = PatientAssignment(
            patient_id=assignment_in.patient_id,
            professional_id=assignment_in.professional_id,
            status="active",
            assigned_at=datetime.utcnow()
        )
        db.add(new_assignment)
        await db.commit()
        await db.refresh(new_assignment)
        target_assignment = new_assignment

    await record_audit_event(
        db,
        action="ASSIGN_PATIENT",
        actor=current_user,
        target_id=str(assignment_in.patient_id),
        details=f"Assigned patient {patient.email} to professional {professional.email} ({professional.role})"
    )

    return AssignmentResponse(
        id=target_assignment.id,
        patient_id=patient.id,
        patient_name=patient.full_name or patient.email,
        patient_email=patient.email,
        professional_id=professional.id,
        professional_name=professional.full_name or professional.email,
        professional_email=professional.email,
        professional_role=professional.role,
        assigned_at=target_assignment.assigned_at,
        status=target_assignment.status
    )

@router.delete("/{patient_id}")
@router.delete("/{patient_id}/{professional_id}")
async def revoke_assignment(
    patient_id: UUID,
    professional_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Administrator"]))
):
    """
    Revoke an active patient-professional assignment. Restricted to Administrator role.
    Accepts patient_id directly or both patient_id and professional_id.
    Explicitly commits status="revoked" to PostgreSQL and refreshes instances.
    """
    # Query all active or existing assignment rows matching patient_id
    query = select(PatientAssignment).where(
        PatientAssignment.patient_id == patient_id
    )
    result = await db.execute(query)
    assignments = result.scalars().all()

    active_assignments = [a for a in assignments if a.status.lower() == "active"]
    target_list = active_assignments if active_assignments else assignments

    if not target_list:
        return {"success": True, "status": "success", "message": "Assignment already revoked or inactive."}

    for assignment in target_list:
        assignment.status = "revoked"
        db.add(assignment)

    await db.commit()
    for assignment in target_list:
        try:
            await db.refresh(assignment)
        except Exception:
            pass

    await record_audit_event(
        db,
        action="REVOKE_PATIENT_ASSIGNMENT",
        actor=current_user,
        target_id=str(patient_id),
        details=f"Revoked assignment for patient {patient_id}" + (f" and professional {professional_id}" if professional_id else "")
    )

    return {"success": True, "status": "success", "message": "Assignment successfully revoked."}

@router.delete("")
@router.delete("/")
async def revoke_assignment_query(
    patient_id: Optional[UUID] = None,
    professional_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Administrator"]))
):
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required.")
    return await revoke_assignment(patient_id=patient_id, professional_id=professional_id, db=db, current_user=current_user)

@router.get("", response_model=List[AssignmentResponse])
@router.get("/", response_model=List[AssignmentResponse])
async def list_assignments(
    status: Optional[str] = "active",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Administrator"]))
):
    """
    List patient assignments. Restricted to Administrator role.
    """
    query = select(PatientAssignment)
    if status and status != "all":
        query = query.where(PatientAssignment.status == status)

    result = await db.execute(query)
    assignments = result.scalars().all()

    # Pre-fetch users for name/email hydration
    user_ids = set()
    for a in assignments:
        user_ids.add(a.patient_id)
        user_ids.add(a.professional_id)

    users_map = {}
    if user_ids:
        users_q = select(User).where(User.id.in_(list(user_ids)))
        users_res = await db.execute(users_q)
        for u in users_res.scalars().all():
            users_map[u.id] = u

    output = []
    for a in assignments:
        pat = users_map.get(a.patient_id)
        prof = users_map.get(a.professional_id)
        output.append(
            AssignmentResponse(
                id=a.id,
                patient_id=a.patient_id,
                patient_name=pat.full_name if pat else "Unknown",
                patient_email=pat.email if pat else "unknown@example.com",
                professional_id=a.professional_id,
                professional_name=prof.full_name if prof else "Unknown",
                professional_email=prof.email if prof else "unknown@example.com",
                professional_role=prof.role if prof else "Unknown",
                assigned_at=a.assigned_at,
                status=a.status
            )
        )

    return output
