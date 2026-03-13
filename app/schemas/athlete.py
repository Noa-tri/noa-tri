from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class AthleteBase(BaseModel):
    first_name: str
    last_name: str
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    ftp_watts: Optional[int] = None
    threshold_hr: Optional[int] = None
    vo2max: Optional[float] = None


class AthleteCreate(AthleteBase):
    organization_id: UUID


class AthleteResponse(AthleteBase):
    id: UUID
    organization_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
