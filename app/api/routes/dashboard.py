from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.models.daily_biomarker import DailyBiomarker
from app.models.pmc_metric import PMCMetric
from app.models.risk_assessment import RiskAssessment
from app.services.load_metrics import LoadMetricsService


router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
)


@router.get("/team")
def team_dashboard(db: Session = Depends(get_db)):

    athletes = db.query(Athlete).all()

    result = []

    for athlete in athletes:

        biomarker = (
            db.query(DailyBiomarker)
            .filter(DailyBiomarker.athlete_id == athlete.id)
            .order_by(DailyBiomarker.day.desc())
            .first()
        )

        pmc = (
            db.query(PMCMetric)
            .filter(PMCMetric.athlete_id == athlete.id)
            .order_by(PMCMetric.day.desc())
            .first()
        )

        risk = (
            db.query(RiskAssessment)
            .filter(RiskAssessment.athlete_id == athlete.id)
            .order_by(RiskAssessment.day.desc())
            .first()
        )

        load_metrics = LoadMetricsService(db).compute_weekly_metrics(athlete_id=athlete.id)

        result.append(
            {
                "id": athlete.id,
                "name": f"{athlete.first_name} {athlete.last_name}",
                "ftp": athlete.ftp_watts,
                "vo2max": athlete.vo2max,
                "hrv_rmssd": biomarker.hrv_rmssd_ms if biomarker else None,
                "ctl": pmc.ctl if pmc else None,
                "atl": pmc.atl if pmc else None,
                "tsb": pmc.tsb if pmc else None,
                "risk": risk.risk_level if risk else None,
                "weekly_total_tss": load_metrics["total_tss"],
                "weekly_monotony": load_metrics["monotony"],
                "weekly_strain": load_metrics["strain"],
            }
        )

    return result


@router.get("/load/{athlete_id}")
def athlete_load_dashboard(
    athlete_id: UUID,
    reference_day: date | None = None,
    db: Session = Depends(get_db),
):
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    return LoadMetricsService(db).compute_weekly_metrics(
        athlete_id=athlete_id,
        reference_day=reference_day,
    )


@router.get("/load/auto")
def athlete_load_dashboard_auto(
    reference_day: date | None = None,
    db: Session = Depends(get_db),
):

    athlete = db.query(Athlete).first()

    if not athlete:
        raise HTTPException(status_code=404, detail="No athletes found")

    return LoadMetricsService(db).compute_weekly_metrics(
        athlete_id=athlete.id,
        reference_day=reference_day,
    )
