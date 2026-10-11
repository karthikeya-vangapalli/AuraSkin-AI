from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
import uuid

class Notification(Document):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(..., index=True)
    reminder_uuid: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), index=True)
    dedup_key: Optional[str] = Field(None, index=True) # e.g. "am_routine_2026-10-11"
    title: str
    message: str
    type: str = "reminder" # reminder, uv_alert, restock
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
