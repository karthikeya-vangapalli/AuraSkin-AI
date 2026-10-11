from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DailyProgressCreate(BaseModel):
    date: Optional[datetime] = None
    am_routine_completed: Optional[bool] = False
    pm_routine_completed: Optional[bool] = False
    completed_steps: Optional[List[str]] = Field(default_factory=list)
    water_ml: Optional[int] = 0
    sleep_hours: Optional[float] = 0.0
    stress_level: Optional[str] = "Medium"
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    skin_health_score: Optional[float] = None
    skin_feeling: Optional[str] = None

class DailyProgressResponse(BaseModel):
    id: str
    user_id: str
    date: datetime
    am_routine_completed: bool
    pm_routine_completed: bool
    completed_steps: List[str]
    water_ml: int
    sleep_hours: float
    stress_level: str
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    skin_health_score: Optional[float] = None
    skin_feeling: Optional[str] = None

class ScoreTrendPoint(BaseModel):
    date: str
    score: float
    am_completed: bool
    pm_completed: bool
    water_ml: int
    sleep_hours: float

class HeatmapDay(BaseModel):
    date: str
    completion_count: int
    level: int  # 0: 0 steps, 1: AM or PM, 2: Both AM & PM completed

class ProgressAnalyticsResponse(BaseModel):
    current_streak: int
    longest_streak: int
    completion_rate_7d: float
    completion_rate_30d: float
    average_water_ml: float
    average_sleep_hours: float
    score_trends: List[ScoreTrendPoint]
    heatmap_data: List[HeatmapDay]
    correlative_insights: List[str]

class PhotoLogCreate(BaseModel):
    photo_url: str
    notes: Optional[str] = None
    skin_health_score: Optional[float] = None
    date: Optional[datetime] = None

class PhotoLogResponse(BaseModel):
    id: str
    user_id: str
    date: datetime
    photo_url: str
    notes: Optional[str] = None
    skin_health_score: Optional[float] = None
    completed_steps: List[str] = Field(default_factory=list)
