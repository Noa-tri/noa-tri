from pydantic import BaseModel
from uuid import UUID
from datetime import date
from typing import Optional


class RiskResponse(BaseModel):
    id: UUID
    athlete_id: UUID
    day: date

    risk_level: str
    risk_score: float

    hrv_zscore: Optional[float] = None
    atl_ctl_ratio: Optional[float] = None
    tsb: Optional[float] = None

    class Config:
        from_attributes = True
