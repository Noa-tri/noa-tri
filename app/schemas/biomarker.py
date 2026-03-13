from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import date


class BiomarkerCreate(BaseModel):
    athlete_id: UUID
    day: date
    hrv_rmssd_ms: Optional[float] = None
    hrv_lnrmssd: Optional[float] = None
    resting_hr: Optional[int] = None
    sleep_score: Optional[float] = None
    body_battery: Optional[float] = None


class BiomarkerResponse(BiomarkerCreate):
    class Config:
        from_attributes = True
