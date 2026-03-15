from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.services.athlete_profiling import AthleteProfilingService
from app.services.training_builder import TrainingPlanBuilder


router = APIRouter(
    prefix="/debug",
    tags=["debug"],
)


@router.get("/training-plan")
def debug_training_plan(db: Session = Depends(get_db)):

    athlete = db.query(Athlete).first()

    if not athlete:
        raise HTTPException(status_code=404, detail="No athletes in database")

    profiling = AthleteProfilingService(db)
    profile = profiling.build_profile(athlete.id)

    builder = TrainingPlanBuilder()

    plan = builder.build_training_plan(
        athlete_profile=profile,
        race_date=date(2026, 10, 1),
        today=date.today(),
    )

    return {
        "athlete": profile["athlete_name"],
        "plan": plan,
    }
