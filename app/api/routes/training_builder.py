from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.services.athlete_profiling import AthleteProfilingService
from app.services.training_builder import TrainingPlanBuilder


router = APIRouter(
    prefix="/training",
    tags=["training"],
)


class RacePlanRequest(BaseModel):
    race_date: date


@router.post("/plan/race/{athlete_id}")
def build_race_training_plan(
    athlete_id: UUID,
    payload: RacePlanRequest,
    db: Session = Depends(get_db),
):

    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    profiling = AthleteProfilingService(db)

    athlete_profile = profiling.build_profile(athlete_id)

    builder = TrainingPlanBuilder()

    training_plan = builder.build_training_plan(
        athlete_profile=athlete_profile,
        race_date=payload.race_date,
        today=date.today(),
    )

    return {
        "athlete": athlete_profile["athlete_name"],
        "race_date": payload.race_date,
        "plan": training_plan,
    }
