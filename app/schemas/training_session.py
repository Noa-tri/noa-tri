from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class TrainingSessionBase(BaseModel):
    sport: str
    start_time: datetime
    duration_sec: int
    distance_m: Optional[float] = None
    avg_hr: Optional[int] = None
    max_hr: Optional[int] = None
    avg_power_w: Optional[int] = None
    normalized_power_w: Optional[float] = None
    intensity_factor: Optional[float] = None
    tss: Optional[float] = None


class TrainingSessionCreate(TrainingSessionBase):
    athlete_id: UUID


class TrainingSessionResponse(TrainingSessionBase):
    id: UUID
    athlete_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
