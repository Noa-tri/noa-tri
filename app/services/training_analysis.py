from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.training_plan import TrainingPlan
from app.models.training_session import TrainingSession


class TrainingAnalysisService:
    """
    NOA plan vs execution analysis.

    Compares the closest planned session for the athlete against a real session.
    """

    def __init__(self, db: Session):
        self.db = db

    def analyze_session(self, athlete_id, session: TrainingSession) -> Dict[str, Any]:
        plan = self._find_matching_plan(
            athlete_id=athlete_id,
            session_start_time=session.start_time,
        )

        if not plan:
            return {
                "status": "no_plan_found",
                "planned": None,
                "executed": self._executed_payload(session),
                "comparison": None,
            }

        duration_diff_sec = self._diff(plan.planned_duration_sec, session.duration_sec)
        distance_diff_m = self._diff(plan.planned_distance_m, session.distance_m)
        intensity_diff = self._diff(plan.planned_intensity_factor, session.intensity_factor)
        tss_diff = self._diff(plan.planned_tss, session.tss)

        adherence_score = self._compute_adherence_score(
            duration_diff_sec=duration_diff_sec,
            planned_duration_sec=plan.planned_duration_sec,
            distance_diff_m=distance_diff_m,
            planned_distance_m=plan.planned_distance_m,
            intensity_diff=intensity_diff,
            planned_intensity_factor=plan.planned_intensity_factor,
            tss_diff=tss_diff,
            planned_tss=plan.planned_tss,
        )

        return {
            "status": "matched",
            "planned": {
                "id": str(plan.id),
                "sport": plan.sport,
                "planned_date": plan.planned_date,
                "planned_duration_sec": plan.planned_duration_sec,
                "planned_distance_m": plan.planned_distance_m,
                "planned_intensity_factor": plan.planned_intensity_factor,
                "planned_tss": plan.planned_tss,
                "coach_notes": plan.coach_notes,
            },
            "executed": self._executed_payload(session),
            "comparison": {
                "duration_diff_sec": duration_diff_sec,
                "distance_diff_m": distance_diff_m,
                "intensity_diff": intensity_diff,
                "tss_diff": tss_diff,
                "adherence_score": adherence_score,
            },
        }

    def _find_matching_plan(
        self,
        athlete_id,
        session_start_time: datetime,
    ) -> Optional[TrainingPlan]:
        session_day = session_start_time.date()
        day_start = datetime.combine(session_day, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        same_day_plan = (
            self.db.query(TrainingPlan)
            .filter(
                TrainingPlan.athlete_id == athlete_id,
                TrainingPlan.planned_date >= day_start,
                TrainingPlan.planned_date < day_end,
            )
            .order_by(TrainingPlan.planned_date.asc())
            .first()
        )

        if same_day_plan:
            return same_day_plan

        nearest_plan = (
            self.db.query(TrainingPlan)
            .filter(TrainingPlan.athlete_id == athlete_id)
            .order_by(TrainingPlan.planned_date.desc())
            .first()
        )

        return nearest_plan

    @staticmethod
    def _diff(planned: Optional[float], executed: Optional[float]) -> Optional[float]:
        if planned is None or executed is None:
            return None
        return round(float(executed) - float(planned), 2)

    @staticmethod
    def _executed_payload(session: TrainingSession) -> Dict[str, Any]:
        return {
            "id": str(session.id),
            "sport": str(session.sport),
            "start_time": session.start_time,
            "duration_sec": session.duration_sec,
            "distance_m": session.distance_m,
            "intensity_factor": session.intensity_factor,
            "tss": session.tss,
        }

    @staticmethod
    def _compute_component_score(diff: Optional[float], planned: Optional[float]) -> Optional[float]:
        if diff is None or planned is None or planned == 0:
            return None

        relative_error = abs(diff) / abs(float(planned))

        if relative_error <= 0.05:
            return 100.0
        if relative_error <= 0.10:
            return 90.0
        if relative_error <= 0.20:
            return 75.0
        if relative_error <= 0.30:
            return 60.0
        if relative_error <= 0.50:
            return 40.0
        return 20.0

    def _compute_adherence_score(
        self,
        duration_diff_sec: Optional[float],
        planned_duration_sec: Optional[float],
        distance_diff_m: Optional[float],
        planned_distance_m: Optional[float],
        intensity_diff: Optional[float],
        planned_intensity_factor: Optional[float],
        tss_diff: Optional[float],
        planned_tss: Optional[float],
    ) -> Optional[float]:
        components = [
            self._compute_component_score(duration_diff_sec, planned_duration_sec),
            self._compute_component_score(distance_diff_m, planned_distance_m),
            self._compute_component_score(intensity_diff, planned_intensity_factor),
            self._compute_component_score(tss_diff, planned_tss),
        ]

        valid = [c for c in components if c is not None]
        if not valid:
            return None

        return round(sum(valid) / len(valid), 2)
