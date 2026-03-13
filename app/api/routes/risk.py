from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.engines.noa_engine import NoaPerformanceEngine
from app.models.daily_biomarker import DailyBiomarker
from app.models.pmc_metric import PMCMetric
from app.models.risk_assessment import RiskAssessment
from app.schemas.risk import RiskResponse

router = APIRouter(prefix="/risk", tags=["risk"])


@router.post("/compute/{athlete_id}/{day}", response_model=RiskResponse, status_code=status.HTTP_201_CREATED)
def compute_risk_for_day(athlete_id: UUID, day: date, db: Session = Depends(get_db)) -> RiskAssessment:
    engine = NoaPerformanceEngine()

    biomarker = (
        db.query(DailyBiomarker)
        .filter(
            DailyBiomarker.athlete_id == athlete_id,
            DailyBiomarker.day == day,
        )
        .first()
    )
    if not biomarker or biomarker.hrv_rmssd_ms is None:
        raise HTTPException(status_code=404, detail="Daily biomarker with HRV not found")

    pmc = (
        db.query(PMCMetric)
        .filter(
            PMCMetric.athlete_id == athlete_id,
            PMCMetric.day == day,
        )
        .first()
    )
    if not pmc:
        raise HTTPException(status_code=404, detail="PMC metric not found for requested day")

    historical_rows = (
        db.query(DailyBiomarker)
        .filter(
            DailyBiomarker.athlete_id == athlete_id,
            DailyBiomarker.day < day,
            DailyBiomarker.hrv_rmssd_ms.isnot(None),
        )
        .order_by(DailyBiomarker.day.asc())
        .all()
    )

    historical_rmssd = [row.hrv_rmssd_ms for row in historical_rows if row.hrv_rmssd_ms is not None]
    if len(historical_rmssd) < engine.hrv_baseline_window:
        raise HTTPException(
            status_code=400,
            detail=f"At least {engine.hrv_baseline_window} previous HRV samples are required",
        )

    recent_rows = (
        db.query(DailyBiomarker)
        .filter(
            DailyBiomarker.athlete_id == athlete_id,
            DailyBiomarker.day <= day,
            DailyBiomarker.hrv_rmssd_ms.isnot(None),
        )
        .order_by(DailyBiomarker.day.asc())
        .all()
    )
    recent_rmssd = [row.hrv_rmssd_ms for row in recent_rows if row.hrv_rmssd_ms is not None]

    baseline = engine.compute_hrv_baseline(historical_rmssd)
    result = engine.compute_risk_score(
        current_rmssd=float(biomarker.hrv_rmssd_ms),
        baseline=baseline,
        ctl=float(pmc.ctl),
        atl=float(pmc.atl),
        tsb=float(pmc.tsb),
        recent_rmssd=recent_rmssd,
        sleep_score=biomarker.sleep_score,
        body_battery=biomarker.body_battery,
    )

    risk = (
        db.query(RiskAssessment)
        .filter(
            RiskAssessment.athlete_id == athlete_id,
            RiskAssessment.day == day,
        )
        .first()
    )

    if risk is None:
        risk = RiskAssessment(
            athlete_id=athlete_id,
            day=day,
            risk_level=result.risk_level,
            risk_score=result.risk_score,
            hrv_zscore=result.hrv_zscore,
            atl_ctl_ratio=result.atl_ctl_ratio,
            tsb=result.tsb,
        )
        db.add(risk)
    else:
        risk.risk_level = result.risk_level
        risk.risk_score = result.risk_score
        risk.hrv_zscore = result.hrv_zscore
        risk.atl_ctl_ratio = result.atl_ctl_ratio
        risk.tsb = result.tsb

    db.commit()
    db.refresh(risk)
    return risk


@router.get("/{athlete_id}", response_model=list[RiskResponse])
def list_risk_by_athlete(athlete_id: UUID, db: Session = Depends(get_db)) -> list[RiskAssessment]:
    return (
        db.query(RiskAssessment)
        .filter(RiskAssessment.athlete_id == athlete_id)
        .order_by(RiskAssessment.day.desc())
        .all()
    )
