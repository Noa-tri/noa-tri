from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# =========================================================
# CREATE
# =========================================================
class PerformanceTestCreate(BaseModel):
    athlete_id: UUID

    sport: str
    test_type: str

    metric_name: str
    metric_value: float

    duration_sec: float | None = None
    distance_m: float | None = None

    performed_at: datetime

    source: str = "coach"
    validated: bool = False
    notes: str | None = None


# =========================================================
# RESPONSE
# =========================================================
class PerformanceTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    athlete_id: UUID

    sport: str
    test_type: str

    metric_name: str
    metric_value: float

    duration_sec: float | None
    distance_m: float | None

    performed_at: datetime

    source: str
    validated: bool
    notes: str | None

    created_at: datetime
