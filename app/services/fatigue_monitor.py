from sqlalchemy.orm import Session

from app.models.pmc_metric import PMCMetric
from app.models.daily_biomarker import DailyBiomarker
from app.models.risk_assessment import RiskAssessment
from app.services.load_metrics import LoadMetricsService


class FatigueMonitorService:

    """
    Detects excessive fatigue and overtraining signals.
    """

    def __init__(self, db: Session):
        self.db = db

    def evaluate(self, athlete_id):

        pmc = (
            self.db.query(PMCMetric)
            .filter(PMCMetric.athlete_id == athlete_id)
            .order_by(PMCMetric.day.desc())
            .first()
        )

        biomarker = (
            self.db.query(DailyBiomarker)
            .filter(DailyBiomarker.athlete_id == athlete_id)
            .order_by(DailyBiomarker.day.desc())
            .first()
        )

        load = LoadMetricsService(self.db).compute_weekly_metrics(athlete_id)

        if not pmc:
            return {"status": "no_pmc"}

        risk_score = 0

        # TSB fatigue
        if pmc.tsb <= -30:
            risk_score += 30
        elif pmc.tsb <= -20:
            risk_score += 20
        elif pmc.tsb <= -10:
            risk_score += 10

        # Monotony
        if load["monotony"] > 2:
            risk_score += 20

        # Strain
        if load["strain"] > 5000:
            risk_score += 20

        # HRV suppression
        if biomarker and biomarker.hrv_lnrmssd:
            if biomarker.hrv_lnrmssd < 3:
                risk_score += 30

        if risk_score >= 60:
            level = "high"
        elif risk_score >= 30:
            level = "moderate"
        else:
            level = "low"

        risk = RiskAssessment(
            athlete_id=athlete_id,
            day=pmc.day,
            risk_level=level,
            risk_score=risk_score,
        )

        self.db.add(risk)
        self.db.commit()

        return {
            "risk_level": level,
            "risk_score": risk_score,
            "monotony": load["monotony"],
            "strain": load["strain"],
            "tsb": pmc.tsb,
        }
