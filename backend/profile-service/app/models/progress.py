from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import List, Optional

class DailyProgressLog(Document):
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    am_routine_completed: bool = False
    pm_routine_completed: bool = False
    completed_steps: List[str] = Field(default_factory=list)  # e.g., ["cleanser", "moisturizer", "sunscreen"]
    water_ml: int = 0
    sleep_hours: float = 0.0
    stress_level: str = "Medium"  # Low, Medium, High
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    skin_health_score: Optional[float] = None
    skin_feeling: Optional[str] = None  # "Calm", "Dry", "Breakout", "Glowing", "Sensitive"

    class Settings:
        name = "daily_progress_logs"
