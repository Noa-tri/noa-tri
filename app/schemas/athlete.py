from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AthleteCreate(BaseModel):
    organization_id: UUID
    first_name: str
    last_name: str
    weight_kg: float | None = None
    height_cm: float | None = None
    ftp_watts: int | None = None
    threshold_hr: int | None = None
    vo2max: float | None = None
    garmin_access_token: str | None = None


class AthleteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    first_name: str
    last_name: str
    weight_kg: float | None
    height_cm: float | None
    ftp_watts: int | None
    threshold_hr: int | None
    vo2max: float | None
    garmin_access_token: str | None
    created_at: datetime
