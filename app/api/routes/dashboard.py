from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.models.daily_biomarker import DailyBiomarker
from app.models.pmc_metric import PMCMetric
from app.models.risk_assessment import RiskAssessment


router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
)


@router.get("/athlete/{athlete_id}")
def athlete_dashboard(athlete_id: UUID, db: Session = Depends(get_db)):

    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    biomarker = (
        db.query(DailyBiomarker)
        .filter(DailyBiomarker.athlete_id == athlete_id)
        .order_by(DailyBiomarker.day.desc())
        .first()
    )

    pmc = (
        db.query(PMCMetric)
        .filter(PMCMetric.athlete_id == athlete_id)
        .order_by(PMCMetric.day.desc())
        .first()
    )

    risk = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.athlete_id == athlete_id)
        .order_by(RiskAssessment.day.desc())
        .first()
    )

    return {
        "athlete": {
            "id": athlete.id,
            "name": f"{athlete.first_name} {athlete.last_name}",
            "ftp": athlete.ftp_watts,
            "vo2max": athlete.vo2max,
        },
        "hrv": {
            "rmssd": biomarker.hrv_rmssd_ms if biomarker else None,
            "lnrmssd": biomarker.hrv_lnrmssd if biomarker else None,
        },
        "training_load": {
            "ctl": pmc.ctl if pmc else None,
            "atl": pmc.atl if pmc else None,
            "tsb": pmc.tsb if pmc else None,
        },
        "risk": {
            "level": risk.risk_level if risk else None,
            "score": risk.risk_score if risk else None,
        },
    }
