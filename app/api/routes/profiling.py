from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.services.athlete_profiling import AthleteProfilingService


router = APIRouter(
    prefix="/profiling",
    tags=["profiling"],
)


@router.get("/athlete/{athlete_id}")
def athlete_profile(
    athlete_id: UUID,
    db: Session = Depends(get_db),
):

    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    profiling = AthleteProfilingService(db)

    profile = profiling.build_profile(athlete_id)

    return profile
