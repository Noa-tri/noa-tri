from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class SessionSport(str, Enum):
    triathlon = "triathlon"
    swim = "swim"
    bike = "bike"
    run = "run"
    strength = "strength"
    mobility = "mobility"
    other = "other"


class SessionSource(str, Enum):
    garmin_api = "garmin_api"
    fit_import = "fit_import"
    manual = "manual"


class TrainingSessionBase(BaseModel):
    source: SessionSource = SessionSource.manual
    sport: SessionSport
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
