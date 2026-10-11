from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(String, index=True, nullable=False) # string to support both real UUIDs and "mock-" IDs
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    note_type = Column(String, nullable=False) # "clinical" or "consultant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
