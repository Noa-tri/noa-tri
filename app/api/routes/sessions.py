from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.models.training_session import TrainingSession
from app.schemas.training_session import TrainingSessionCreate, TrainingSessionResponse

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/", response_model=TrainingSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(payload: TrainingSessionCreate, db: Session = Depends(get_db)) -> TrainingSession:
    athlete = db.query(Athlete).filter(Athlete.id == payload.athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    session = TrainingSession(
        athlete_id=payload.athlete_id,
        source=payload.source,
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
    return session


@router.get("/", response_model=list[TrainingSessionResponse])
def list_sessions(db: Session = Depends(get_db)) -> list[TrainingSession]:
    return db.query(TrainingSession).order_by(TrainingSession.start_time.desc()).all()


@router.get("/athlete/{athlete_id}", response_model=list[TrainingSessionResponse])
def list_sessions_by_athlete(athlete_id: UUID, db: Session = Depends(get_db)) -> list[TrainingSession]:
    return (
        db.query(TrainingSession)
        .filter(TrainingSession.athlete_id == athlete_id)
        .order_by(TrainingSession.start_time.desc())
        .all()
    )
