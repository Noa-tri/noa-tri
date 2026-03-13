from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.models.daily_biomarker import DailyBiomarker
from app.schemas.biomarker import BiomarkerCreate, BiomarkerResponse

router = APIRouter(prefix="/biomarkers", tags=["biomarkers"])


@router.post("/", response_model=BiomarkerResponse, status_code=status.HTTP_201_CREATED)
def create_biomarker(payload: BiomarkerCreate, db: Session = Depends(get_db)) -> DailyBiomarker:
    athlete = db.query(Athlete).filter(Athlete.id == payload.athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    biomarker = DailyBiomarker(
        athlete_id=payload.athlete_id,
        day=payload.day,
        hrv_rmssd_ms=payload.hrv_rmssd_ms,
        hrv_lnrmssd=payload.hrv_lnrmssd,
        resting_hr=payload.resting_hr,
        sleep_score=payload.sleep_score,
        body_battery=payload.body_battery,
    )

    db.merge(biomarker)
    db.commit()

    saved = (
        db.query(DailyBiomarker)
        .filter(
            DailyBiomarker.athlete_id == payload.athlete_id,
            DailyBiomarker.day == payload.day,
        )
        .first()
    )
    return saved
