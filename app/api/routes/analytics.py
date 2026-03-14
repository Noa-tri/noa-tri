from datetime import date
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
    day: date
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


def _compute_and_store_pmc(athlete_id: UUID, db: Session) -> list[dict]:
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

    grouped: dict[date, float] = {}

    for session in sessions:
        session_day = session.start_time.date()
        grouped.setdefault(session_day, 0.0)
        grouped[session_day] += float(session.tss or 0.0)

    ordered_days = sorted(grouped.keys())
    day_labels = [day.isoformat() for day in ordered_days]
    daily_tss = [grouped[day] for day in ordered_days]

    engine = NoaPerformanceEngine()
    pmc_series = engine.compute_pmc_series(day_labels=day_labels, daily_tss=daily_tss)

    response_rows: list[dict] = []

    for item in pmc_series:
        item_day = date.fromisoformat(item.day)

        existing = (
            db.query(PMCMetric)
            .filter(
                PMCMetric.athlete_id == athlete_id,
                PMCMetric.day == item_day,
            )
            .first()
        )

        if existing is None:
            db.add(
                PMCMetric(
                    athlete_id=athlete_id,
                    day=item_day,
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

        response_rows.append(
            {
                "day": item_day,
                "daily_tss": item.daily_tss,
                "ctl": item.ctl,
                "atl": item.atl,
                "tsb": item.tsb,
            }
        )

    db.commit()
    return response_rows


@router.post("/pmc/{athlete_id}", response_model=list[PMCDayResponse], status_code=status.HTTP_201_CREATED)
def compute_pmc_for_athlete(athlete_id: UUID, db: Session = Depends(get_db)) -> list[dict]:
    return _compute_and_store_pmc(athlete_id=athlete_id, db=db)


@router.post("/pmc/auto", response_model=list[PMCDayResponse], status_code=status.HTTP_201_CREATED)
def compute_pmc_auto(db: Session = Depends(get_db)) -> list[dict]:
    athlete = db.query(Athlete).order_by(Athlete.created_at.asc()).first()

    if not athlete:
        raise HTTPException(status_code=404, detail="No athletes found")

    return _compute_and_store_pmc(athlete_id=athlete.id, db=db)
