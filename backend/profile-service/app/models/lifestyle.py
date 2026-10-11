from beanie import Document
from pydantic import Field
from typing import Optional, Union
from datetime import datetime

class LifestyleLog(Document):
    user_id: str = Field(..., index=True)
    water_intake: int = Field(..., ge=0, description="Daily water intake in ml")
    sleep_hours: float = Field(..., ge=0, le=24, description="Sleep duration in hours")
    sleep_quality: int = Field(..., ge=1, le=10, description="Sleep quality rating scale 1-10")
    sun_exposure: float = Field(..., ge=0, le=24, description="Outdoor sun exposure in hours")
    stress_level: int = Field(..., ge=1, le=10, description="Self-reported stress rating scale 1-10")
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "lifestyle_logs"
