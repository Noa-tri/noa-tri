from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date
from typing import Sequence

from sqlalchemy.orm import Session

from app.models.athlete_daily_load import AthleteDailyLoad
from app.models.performance_test import PerformanceTest


@dataclass
class NLSSParameters:
    k1: float
    k2: float
    t1: float
    t2: float
    fit_error: float
    data_points: int
    window_start: date | None
    window_end: date | None


@dataclass
class NLSSPredictionPoint:
    day: date
    fitness_component: float
    fatigue_component: float
    performance_state: float


class NLSSEngine:
    """
    Nonlinear Least Squares with Shrinkage - skeleton.

    Current responsibilities:
    - load daily load data
    - load performance tests
    - compute fitness-fatigue state from candidate parameters
    - provide a stable initial parameter estimation
    - compute simple fit error against observed tests

    This is the correct foundation before adding:
    - Huber robust loss
    - Mahalanobis shrinkage
    - weekly recalibration job
    - taper optimization
    """

    def __init__(self, db: Session):
        self.db = db

    # =========================================================
    # PUBLIC API
    # =========================================================

    def estimate_parameters(
        self,
        athlete_id,
        sport: str,
        window_start: date | None = None,
        window_end: date | None = None,
    ) -> NLSSParameters:
        loads = self._load_daily_loads(
            athlete_id=athlete_id,
            sport=sport,
            window_start=window_start,
            window_end=window_end,
        )

        tests = self._load_performance_tests(
            athlete_id=athlete_id,
            sport=sport,
            window_start=window_start,
            window_end=window_end,
        )

        # -----------------------------------------------------
        # PRIOR / STARTING VALUES
        # -----------------------------------------------------
        # These are conservative defaults and intentionally
        # explicit until we introduce:
        # - AGMT2 prior source
        # - Mahalanobis shrinkage
        # - nonlinear optimizer
        # -----------------------------------------------------
        k1 = 1.0
        k2 = 2.0
        t1 = 45.0
        t2 = 10.0

        fit_error = self._compute_fit_error(
            loads=loads,
            tests=tests,
            k1=k1,
            k2=k2,
            t1=t1,
            t2=t2,
        )

        return NLSSParameters(
            k1=k1,
            k2=k2,
            t1=t1,
            t2=t2,
            fit_error=fit_error,
            data_points=len(tests),
            window_start=window_start,
            window_end=window_end,
        )

    def generate_prediction_curve(
        self,
        athlete_id,
        sport: str,
        k1: float,
        k2: float,
        t1: float,
        t2: float,
        window_start: date | None = None,
        window_end: date | None = None,
    ) -> list[NLSSPredictionPoint]:
        loads = self._load_daily_loads(
            athlete_id=athlete_id,
            sport=sport,
            window_start=window_start,
            window_end=window_end,
        )

        if not loads:
            return []

        loads = sorted(loads, key=lambda row: row.day)

        fitness_state = 0.0
        fatigue_state = 0.0
        curve: list[NLSSPredictionPoint] = []

        previous_day: date | None = None

        for row in loads:
            if previous_day is None:
                day_gap = 1
            else:
                day_gap = max((row.day - previous_day).days, 1)

            fitness_decay = math.exp(-day_gap / t1) if t1 > 0 else 0.0
            fatigue_decay = math.exp(-day_gap / t2) if t2 > 0 else 0.0

            fitness_state *= fitness_decay
            fatigue_state *= fatigue_decay

            today_load = float(row.total_load or 0.0)

            fitness_state += k1 * today_load
            fatigue_state += k2 * today_load

            curve.append(
                NLSSPredictionPoint(
                    day=row.day,
                    fitness_component=round(fitness_state, 4),
                    fatigue_component=round(fatigue_state, 4),
                    performance_state=round(fitness_state - fatigue_state, 4),
                )
            )

            previous_day = row.day

        return curve

    # =========================================================
    # LOADERS
    # =========================================================

    def _load_daily_loads(
        self,
        athlete_id,
        sport: str,
        window_start: date | None,
        window_end: date | None,
    ) -> list[AthleteDailyLoad]:
        query = self.db.query(AthleteDailyLoad).filter(
            AthleteDailyLoad.athlete_id == athlete_id,
            AthleteDailyLoad.sport == sport,
        )

        if window_start:
            query = query.filter(AthleteDailyLoad.day >= window_start)

        if window_end:
            query = query.filter(AthleteDailyLoad.day <= window_end)

        return query.order_by(AthleteDailyLoad.day.asc()).all()

    def _load_performance_tests(
        self,
        athlete_id,
        sport: str,
        window_start: date | None,
        window_end: date | None,
    ) -> list[PerformanceTest]:
        query = self.db.query(PerformanceTest).filter(
            PerformanceTest.athlete_id == athlete_id,
            PerformanceTest.sport == sport,
        )

        if window_start:
            query = query.filter(PerformanceTest.performed_at >= window_start)

        if window_end:
            # end day inclusive
            query = query.filter(PerformanceTest.performed_at <= window_end)

        return query.order_by(PerformanceTest.performed_at.asc()).all()

    # =========================================================
    # FIT / LOSS
    # =========================================================

    def _compute_fit_error(
        self,
        loads: Sequence[AthleteDailyLoad],
        tests: Sequence[PerformanceTest],
        k1: float,
        k2: float,
        t1: float,
        t2: float,
    ) -> float:
        """
        Basic squared error skeleton.

        For now:
        - uses the fitness-fatigue state at each test day
        - compares that latent state against observed metric_value
        - intended to be replaced by:
            * Huber loss
            * shrinkage regularization
            * metric-specific normalization
        """

        if not loads or not tests:
            return 0.0

        curve = self._simulate_state_by_day(
            loads=loads,
            k1=k1,
            k2=k2,
            t1=t1,
            t2=t2,
        )

        if not curve:
            return 0.0

        total_error = 0.0
        matched = 0

        for test in tests:
            test_day = test.performed_at.date()
            if test_day not in curve:
                continue

            predicted_state = curve[test_day]
            observed_value = float(test.metric_value)

            total_error += (predicted_state - observed_value) ** 2
            matched += 1

        if matched == 0:
            return 0.0

        return round(total_error / matched, 6)

    def _simulate_state_by_day(
        self,
        loads: Sequence[AthleteDailyLoad],
        k1: float,
        k2: float,
        t1: float,
        t2: float,
    ) -> dict[date, float]:
        if not loads:
            return {}

        ordered = sorted(loads, key=lambda row: row.day)

        curve: dict[date, float] = {}
        fitness_state = 0.0
        fatigue_state = 0.0
        previous_day: date | None = None

        for row in ordered:
            if previous_day is None:
                day_gap = 1
            else:
                day_gap = max((row.day - previous_day).days, 1)

            fitness_decay = math.exp(-day_gap / t1) if t1 > 0 else 0.0
            fatigue_decay = math.exp(-day_gap / t2) if t2 > 0 else 0.0

            fitness_state *= fitness_decay
            fatigue_state *= fatigue_decay

            today_load = float(row.total_load or 0.0)

            fitness_state += k1 * today_load
            fatigue_state += k2 * today_load

            curve[row.day] = fitness_state - fatigue_state
            previous_day = row.day

        return curve
