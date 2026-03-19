from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.models.athlete_performance_model import AthletePerformanceModel
from app.services.nlss_calibration_service import NLSSCalibrationService


router = APIRouter(prefix="/nlss", tags=["nlss"])


@router.post("/calibrate/{athlete_id}")
def calibrate_nlss(
    athlete_id: UUID,
    sport: str,
    window_end: date | None = None,
    window_days: int = 90,
    db: Session = Depends(get_db),
):
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    model = NLSSCalibrationService(db).calibrate_athlete_sport(
        athlete_id=athlete_id,
        sport=sport,
        window_end=window_end,
        window_days=window_days,
    )

    return {
        "id": str(model.id),
        "athlete_id": str(model.athlete_id),
        "model_type": model.model_type,
        "sport": model.sport,
        "k1": model.k1,
        "k2": model.k2,
        "t1": model.t1,
        "t2": model.t2,
        "fit_error": model.fit_error,
        "data_points": model.data_points,
        "window_start": model.window_start,
        "window_end": model.window_end,
        "calibration_date": model.calibration_date,
    }


@router.get("/{athlete_id}")
def list_nlss_models(
    athlete_id: UUID,
    sport: str | None = None,
    db: Session = Depends(get_db),
):
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    query = (
        db.query(AthletePerformanceModel)
        .filter(AthletePerformanceModel.athlete_id == athlete_id)
    )

    if sport:
        query = query.filter(AthletePerformanceModel.sport == sport)

    models = (
        query.order_by(AthletePerformanceModel.calibration_date.desc())
        .all()
    )

    return [
        {
            "id": str(model.id),
            "athlete_id": str(model.athlete_id),
            "model_type": model.model_type,
            "sport": model.sport,
            "k1": model.k1,
            "k2": model.k2,
            "t1": model.t1,
            "t2": model.t2,
            "fit_error": model.fit_error,
            "data_points": model.data_points,
            "window_start": model.window_start,
            "window_end": model.window_end,
            "calibration_date": model.calibration_date,
            "created_at": model.created_at,
        }
        for model in models
    ]
