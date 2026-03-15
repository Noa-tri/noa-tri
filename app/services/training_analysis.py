from datetime import timedelta

from sqlalchemy.orm import Session

from app.models.training_plan import TrainingPlan
from app.models.training_session import TrainingSession


class TrainingAnalysisService:

    """
    Compares planned training vs executed training.
    """

    def __init__(self, db: Session):
        self.db = db

    def analyze_session(self, athlete_id, session: TrainingSession):

        plan = (
            self.db.query(TrainingPlan)
            .filter(TrainingPlan.athlete_id == athlete_id)
            .order_by(TrainingPlan.planned_date.desc())
            .first()
        )

        if not plan:
            return {"status": "no_plan_found"}

        duration_diff = None
        distance_diff = None
        intensity_diff = None

        if plan.planned_duration_sec and session.duration_sec:
            duration_diff = session.duration_sec - plan.planned_duration_sec

        if plan.planned_distance_m and session.distance_m:
            distance_diff = session.distance_m - plan.planned_distance_m

        if plan.planned_intensity_factor and session.intensity_factor:
            intensity_diff = session.intensity_factor - plan.planned_intensity_factor

        return {
            "planned_tss": plan.planned_tss,
            "executed_tss": session.tss,
            "duration_diff_sec": duration_diff,
            "distance_diff_m": distance_diff,
            "intensity_diff": intensity_diff,
        }
