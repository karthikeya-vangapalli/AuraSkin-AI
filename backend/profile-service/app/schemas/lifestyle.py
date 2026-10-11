from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime

class LifestyleBase(BaseModel):
    water_intake: int = Field(..., ge=0, description="Daily water intake in milliliters")
    sleep_hours: float = Field(..., ge=0, le=24, description="Sleep duration in hours")
    sleep_quality: int = Field(..., ge=1, le=10, description="Sleep quality rating scale 1-10")
    sun_exposure: float = Field(..., ge=0, le=24, description="Outdoor sun exposure in hours")
    stress_level: int = Field(5, ge=1, le=10, description="Self-reported stress rating scale 1-10")
    notes: Optional[str] = Field(None, description="Daily observations or notes")

class LifestyleCreate(BaseModel):
    water_intake: Optional[int] = None
    water_intake_ml: Optional[int] = None
    sleep_hours: Optional[float] = Field(None, ge=0, le=24, description="Sleep duration in hours")
    sleep_quality: Optional[int] = None
    sleep_quality_score: Optional[int] = None
    sun_exposure: Optional[float] = None
    sun_exposure_hours: Optional[float] = None
    stress_level: Optional[int] = Field(None, ge=1, le=10, description="Self-reported stress level (1-10)")
    notes: Optional[str] = None
    log_date: Optional[datetime] = None
    logged_at: Optional[datetime] = None

    @model_validator(mode='before')
    def normalize_fields(cls, values):
        if isinstance(values, dict):
            # Normalize timestamp (log_date or logged_at)
            if values.get('log_date') is None and values.get('logged_at') is not None:
                values['log_date'] = values['logged_at']

            # Normalize water intake (handle float or string inputs cleanly)
            raw_water = values.get('water_intake') if values.get('water_intake') is not None else values.get('water_intake_ml')
            if raw_water is not None:
                try:
                    values['water_intake'] = int(round(float(raw_water)))
                except (ValueError, TypeError):
                    values['water_intake'] = 0
            else:
                values['water_intake'] = 2500

            # Normalize sleep quality
            raw_quality = values.get('sleep_quality') if values.get('sleep_quality') is not None else values.get('sleep_quality_score')
            if raw_quality is not None:
                try:
                    values['sleep_quality'] = int(round(float(raw_quality)))
                except (ValueError, TypeError):
                    values['sleep_quality'] = 7
            else:
                values['sleep_quality'] = 7

            # Normalize sun exposure
            raw_sun = values.get('sun_exposure') if values.get('sun_exposure') is not None else values.get('sun_exposure_hours')
            if raw_sun is not None:
                try:
                    values['sun_exposure'] = float(raw_sun)
                except (ValueError, TypeError):
                    values['sun_exposure'] = 1.0
            else:
                values['sun_exposure'] = 1.0

            # Normalize sleep hours
            if values.get('sleep_hours') is not None:
                try:
                    values['sleep_hours'] = float(values['sleep_hours'])
                except (ValueError, TypeError):
                    values['sleep_hours'] = 0.0
            else:
                values['sleep_hours'] = 0.0

            # Normalize stress level
            if values.get('stress_level') is not None:
                try:
                    values['stress_level'] = int(round(float(values['stress_level'])))
                except (ValueError, TypeError):
                    values['stress_level'] = 5
            else:
                values['stress_level'] = 5

        return values

class LifestyleResponse(LifestyleBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
