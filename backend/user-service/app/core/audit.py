import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
from app.models.user import User

logger = logging.getLogger("audit")
logger.setLevel(logging.INFO)

# Structured, non-PII logger
audit_handler = logging.StreamHandler()
audit_formatter = logging.Formatter(
    '[AUDIT TRAIL] %(asctime)s | Action: %(message)s'
)
audit_handler.setFormatter(audit_formatter)
if not logger.handlers:
    logger.addHandler(audit_handler)

async def record_audit_event(
    db: AsyncSession,
    action: str,
    actor: Optional[User] = None,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """
    Persists structured audit events to the PostgreSQL database
    and emits a sanitized console audit trail without logging passwords,
    raw bearer tokens, or sensitive medical note bodies.
    """
    actor_id = actor.id if actor else None
    actor_email = actor.email if actor else "anonymous"
    actor_role = actor.role if actor else "unknown"

    log_entry = AuditLog(
        action=action,
        actor_id=actor_id,
        actor_email=actor_email,
        actor_role=actor_role,
        target_id=str(target_id) if target_id else None,
        details=details,
        ip_address=ip_address
    )
    db.add(log_entry)
    await db.commit()

    # Sanitized console/structured log omitting note content or sensitive credentials
    safe_log_msg = f"action={action} actor_id={actor_id} actor_role={actor_role} target_id={target_id}"
    logger.info(safe_log_msg)
