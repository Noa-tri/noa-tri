from __future__ import annotations

from datetime import date, timedelta
from typing import Iterable

from sqlalchemy.orm import Session

from app.engines.nlss_engine import NLSSEngine
from app.models.athlete_performance_model import AthletePerformanceModel


class NLSSCalibrationService:
    def __init__(self, db: Session):
        self.db = db
        self.engine = NLSSEngine(db)

    # =========================================================
    # PUBLIC API
    # =========================================================

    def calibrate_athlete_sport(
        self,
        athlete_id,
        sport: str,
        window_end: date | None = None,
        window_days: int = 90,
    ) -> AthletePerformanceModel:
        if window_end is None:
            window_end = date.today()

        window_start = window_end - timedelta(days=window_days - 1)

        estimated = self.engine.estimate_parameters(
            athlete_id=athlete_id,
            sport=sport,
            window_start=window_start,
            window_end=window_end,
        )

        model = AthletePerformanceModel(
            athlete_id=athlete_id,
            model_type="nlss",
            sport=sport,
            k1=estimated.k1,
            k2=estimated.k2,
            t1=estimated.t1,
            t2=estimated.t2,
            fit_error=estimated.fit_error,
            data_points=estimated.data_points,
            window_start=estimated.window_start,
            window_end=estimated.window_end,
        )

        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)

        return model

    def calibrate_athlete_disciplines(
        self,
        athlete_id,
        sports: Iterable[str],
        window_end: date | None = None,
        window_days: int = 90,
    ) -> list[AthletePerformanceModel]:
        results: list[AthletePerformanceModel] = []

        for sport in sports:
            results.append(
                self.calibrate_athlete_sport(
                    athlete_id=athlete_id,
                    sport=sport,
                    window_end=window_end,
                    window_days=window_days,
                )
            )

        return results
