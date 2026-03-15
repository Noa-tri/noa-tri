from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Dict, List

import statistics
from sqlalchemy.orm import Session

from app.models.training_session import TrainingSession


@dataclass(frozen=True)
class WeeklyLoadMetrics:
    athlete_id: str
    week_start: date
    week_end: date
    total_tss: float
    mean_daily_tss: float
    std_daily_tss: float
    monotony: float
    strain: float
    daily_tss: List[float]


class LoadMetricsService:
    """
    NOA weekly load analysis.

    Calculates:
    - total weekly load
    - mean daily load
    - standard deviation of daily load
    - monotony
    - strain

    Definitions:
    - Monotony = mean daily load / std daily load
    - Strain = total weekly load * monotony
    """

    def __init__(self, db: Session):
        self.db = db

    def compute_weekly_metrics(
        self,
        athlete_id,
        reference_day: date | None = None,
    ) -> Dict:
        if reference_day is None:
            reference_day = date.today()

        week_start = reference_day - timedelta(days=reference_day.weekday())
        week_end = week_start + timedelta(days=6)

        sessions = (
            self.db.query(TrainingSession)
            .filter(TrainingSession.athlete_id == athlete_id)
            .all()
        )

        grouped = {week_start + timedelta(days=i): 0.0 for i in range(7)}

        for session in sessions:
            session_day = session.start_time.date()

            if week_start <= session_day <= week_end:
                grouped[session_day] += float(session.tss or 0.0)

        daily_tss = [round(grouped[week_start + timedelta(days=i)], 2) for i in range(7)]

        total_tss = round(sum(daily_tss), 2)
        mean_daily_tss = round(statistics.mean(daily_tss), 2)

        if len(set(daily_tss)) <= 1:
            std_daily_tss = 0.0
            monotony = 0.0 if mean_daily_tss == 0 else 999.0
        else:
            std_daily_tss = round(statistics.stdev(daily_tss), 2)
            monotony = round(mean_daily_tss / std_daily_tss, 3) if std_daily_tss > 0 else 0.0

        strain = round(total_tss * monotony, 2) if monotony not in (0.0, 999.0) else 0.0

        metrics = WeeklyLoadMetrics(
            athlete_id=str(athlete_id),
            week_start=week_start,
            week_end=week_end,
            total_tss=total_tss,
            mean_daily_tss=mean_daily_tss,
            std_daily_tss=std_daily_tss,
            monotony=monotony,
            strain=strain,
            daily_tss=daily_tss,
        )

        return {
            "athlete_id": metrics.athlete_id,
            "week_start": metrics.week_start,
            "week_end": metrics.week_end,
            "total_tss": metrics.total_tss,
            "mean_daily_tss": metrics.mean_daily_tss,
            "std_daily_tss": metrics.std_daily_tss,
            "monotony": metrics.monotony,
            "strain": metrics.strain,
            "daily_tss": metrics.daily_tss,
        }
