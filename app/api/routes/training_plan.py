from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.models.training_plan import TrainingPlan


router = APIRouter(prefix="/training-plan", tags=["training-plan"])


class TrainingPlanCreate(BaseModel):
    athlete_id: UUID
    sport: str
    planned_date: datetime
    planned_duration_sec: float | None = None
    planned_distance_m: float | None = None
    planned_intensity_factor: float | None = None
    planned_tss: float | None = None
    coach_notes: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_training_plan(payload: TrainingPlanCreate, db: Session = Depends(get_db)):

    athlete = (
        db.query(Athlete)
        .filter(Athlete.id == payload.athlete_id)
        .first()
    )

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    plan = TrainingPlan(
        athlete_id=payload.athlete_id,
        sport=payload.sport,
        planned_date=payload.planned_date,
        planned_duration_sec=payload.planned_duration_sec,
        planned_distance_m=payload.planned_distance_m,
        planned_intensity_factor=payload.planned_intensity_factor,
        planned_tss=payload.planned_tss,
        coach_notes=payload.coach_notes,
    )

    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "id": str(plan.id),
        "athlete_id": str(plan.athlete_id),
        "sport": plan.sport,
        "planned_date": plan.planned_date,
        "planned_duration_sec": plan.planned_duration_sec,
        "planned_distance_m": plan.planned_distance_m,
        "planned_intensity_factor": plan.planned_intensity_factor,
        "planned_tss": plan.planned_tss,
        "coach_notes": plan.coach_notes,
    }
