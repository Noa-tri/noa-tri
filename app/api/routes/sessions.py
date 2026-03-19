from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.models.training_session import TrainingSession
from app.services.daily_load_service import DailyLoadService
from app.services.fatigue_monitor import FatigueMonitorService
from app.services.training_analysis import TrainingAnalysisService


router = APIRouter(prefix="/sessions", tags=["sessions"])


class TrainingSessionCreate(BaseModel):
    athlete_id: UUID
    sport: str
    start_time: str

    duration_sec: int | None = None
    distance_m: float | None = None

    avg_hr: int | None = None
    max_hr: int | None = None

    avg_power_w: int | None = None
    normalized_power_w: float | None = None

    intensity_factor: float | None = None
    tss: float | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_session(payload: TrainingSessionCreate, db: Session = Depends(get_db)):
    athlete = db.query(Athlete).filter(Athlete.id == payload.athlete_id).first()

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    session = TrainingSession(
        athlete_id=payload.athlete_id,
        sport=payload.sport,
        start_time=payload.start_time,
        duration_sec=payload.duration_sec,
        distance_m=payload.distance_m,
        avg_hr=payload.avg_hr,
        max_hr=payload.max_hr,
        avg_power_w=payload.avg_power_w,
        normalized_power_w=payload.normalized_power_w,
        intensity_factor=payload.intensity_factor,
        tss=payload.tss,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    analysis = TrainingAnalysisService(db).analyze_session(
        athlete_id=payload.athlete_id,
        session=session,
    )

    fatigue = FatigueMonitorService(db).evaluate(
        athlete_id=payload.athlete_id
    )

    daily_load_rows = DailyLoadService(db).rebuild_athlete_day(
        athlete_id=payload.athlete_id,
        day=session.start_time.date(),
    )

    return {
        "session": {
            "id": str(session.id),
            "sport": session.sport,
            "start_time": session.start_time,
            "duration_sec": session.duration_sec,
            "distance_m": session.distance_m,
            "intensity_factor": session.intensity_factor,
            "tss": session.tss,
        },
        "analysis": analysis,
        "fatigue_monitor": fatigue,
        "daily_load": [
            {
                "id": str(row.id),
                "day": row.day,
                "sport": row.sport,
                "tss": row.tss,
                "rtss": row.rtss,
                "stss": row.stss,
                "total_load": row.total_load,
                "source_count": row.source_count,
                "data_quality_score": row.data_quality_score,
            }
            for row in daily_load_rows
        ],
    }


@router.get("/{athlete_id}")
def get_sessions(athlete_id: UUID, db: Session = Depends(get_db)):
    sessions = (
        db.query(TrainingSession)
        .filter(TrainingSession.athlete_id == athlete_id)
        .order_by(TrainingSession.start_time.desc())
        .all()
    )

    return sessions
