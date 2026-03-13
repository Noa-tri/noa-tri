from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.engines.noa_engine import NoaPerformanceEngine
from app.models.athlete import Athlete
from app.models.pmc_metric import PMCMetric
from app.models.training_session import TrainingSession

router = APIRouter(prefix="/analytics", tags=["analytics"])


class HRVMetricsRequest(BaseModel):
    rr_ms: list[int]


class PMCDayResponse(BaseModel):
    day: str
    daily_tss: float
    ctl: float
    atl: float
    tsb: float


class HRVMetricsResponse(BaseModel):
    cleaned_rr_ms: list[int]
    rmssd: float | None
    lnrmssd: float | None
    quality: dict


@router.post("/hrv", response_model=HRVMetricsResponse)
def compute_hrv(payload: HRVMetricsRequest) -> dict:
    engine = NoaPerformanceEngine()
    return engine.compute_hrv_metrics(payload.rr_ms)


@router.post("/pmc/{athlete_id}", response_model=list[PMCDayResponse], status_code=status.HTTP_201_CREATED)
def compute_pmc_for_athlete(athlete_id: UUID, db: Session = Depends(get_db)) -> list[dict]:
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    sessions = (
        db.query(TrainingSession)
        .filter(TrainingSession.athlete_id == athlete_id)
        .order_by(TrainingSession.start_time.asc())
        .all()
    )
    if not sessions:
        raise HTTPException(status_code=404, detail="No sessions found for athlete")

    grouped: dict[str, float] = {}
    for session in sessions:
        day = session.start_time.date().isoformat()
        grouped.setdefault(day, 0.0)
        grouped[day] += float(session.tss or 0.0)

    day_labels = list(grouped.keys())
    daily_tss = list(grouped.values())

    engine = NoaPerformanceEngine()
    pmc_series = engine.compute_pmc_series(day_labels=day_labels, daily_tss=daily_tss)

    for item in pmc_series:
        existing = (
            db.query(PMCMetric)
            .filter(
                PMCMetric.athlete_id == athlete_id,
                PMCMetric.day == item.day,
            )
            .first()
        )

        if existing is None:
            db.add(
                PMCMetric(
                    athlete_id=athlete_id,
                    day=item.day,
                    daily_tss=item.daily_tss,
                    ctl=item.ctl,
                    atl=item.atl,
                    tsb=item.tsb,
                )
            )
        else:
            existing.daily_tss = item.daily_tss
            existing.ctl = item.ctl
            existing.atl = item.atl
            existing.tsb = item.tsb

    db.commit()

    return [
        {
            "day": item.day,
            "daily_tss": item.daily_tss,
            "ctl": item.ctl,
            "atl": item.atl,
            "tsb": item.tsb,
        }
        for item in pmc_series
    ]
