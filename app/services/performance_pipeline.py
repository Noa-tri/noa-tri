from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.engines.noa_engine import NoaPerformanceEngine
from app.models.athlete import Athlete
from app.models.daily_biomarker import DailyBiomarker
from app.models.pmc_metric import PMCMetric
from app.models.training_session import TrainingSession
from app.models.risk_assessment import RiskAssessment


class PerformancePipeline:
    """
    Automatic physiological processing pipeline for NOA TRI.

    Triggered when new sessions or biomarkers appear.

    Responsibilities:
    - Ensure session TSS exists
    - Recompute PMC load model
    - Recalculate physiological risk
    """

    def __init__(self, db: Session):
        self.db = db
        self.engine = NoaPerformanceEngine()

    # =========================================================
    # SESSION PIPELINE
    # =========================================================

    def process_session(self, session_id: UUID) -> None:

        session = (
            self.db.query(TrainingSession)
            .filter(TrainingSession.id == session_id)
            .first()
        )

        if not session:
            return

        athlete = (
            self.db.query(Athlete)
            .filter(Athlete.id == session.athlete_id)
            .first()
        )

        if not athlete:
            return

        # -----------------------------------------------------
        # Ensure TSS
        # -----------------------------------------------------

        if session.tss is None:

            if session.normalized_power_w and athlete.ftp_watts:

                session.tss = self.engine.estimate_tss_from_power(
                    duration_sec=session.duration_sec,
                    normalized_power_w=session.normalized_power_w,
                    ftp_watts=athlete.ftp_watts,
                )

            elif session.avg_hr and athlete.threshold_hr:

                session.tss = self.engine.estimate_tss_from_hr(
                    duration_sec=session.duration_sec,
                    avg_hr=session.avg_hr,
                    threshold_hr=athlete.threshold_hr,
                )

        self.db.commit()

        # -----------------------------------------------------
        # Update PMC
        # -----------------------------------------------------

        self._recompute_pmc(athlete.id)

        # -----------------------------------------------------
        # Update Risk
        # -----------------------------------------------------

        self._recompute_risk(athlete.id)

    # =========================================================
    # PMC
    # =========================================================

    def _recompute_pmc(self, athlete_id: UUID):

        sessions = (
            self.db.query(TrainingSession)
            .filter(TrainingSession.athlete_id == athlete_id)
            .order_by(TrainingSession.start_time.asc())
            .all()
        )

        if not sessions:
            return

        grouped = {}

        for s in sessions:
            d = s.start_time.date()
            grouped.setdefault(d, 0.0)
            grouped[d] += float(s.tss or 0)

        days = sorted(grouped.keys())

        labels = [d.isoformat() for d in days]
        tss_values = [grouped[d] for d in days]

        pmc = self.engine.compute_pmc_series(labels, tss_values)

        for item in pmc:

            day = date.fromisoformat(item.day)

            existing = (
                self.db.query(PMCMetric)
                .filter(
                    PMCMetric.athlete_id == athlete_id,
                    PMCMetric.day == day,
                )
                .first()
            )

            if not existing:

                self.db.add(
                    PMCMetric(
                        athlete_id=athlete_id,
                        day=day,
                        daily_tss=item.daily_tss,
                        ctl=item.ctl,
                        atl=item.atl,
                        tsb=item.tsb,
                    )
                )

            else:

                existing.daily_tss = item.daily_tss
                existing.ctl = item.ctl
                existing.atl = item.atl
                existing.tsb = item.tsb

        self.db.commit()

    # =========================================================
    # RISK
    # =========================================================

    def _recompute_risk(self, athlete_id: UUID):

        biomarker = (
            self.db.query(DailyBiomarker)
            .filter(DailyBiomarker.athlete_id == athlete_id)
            .order_by(DailyBiomarker.day.desc())
            .first()
        )

        pmc = (
            self.db.query(PMCMetric)
            .filter(PMCMetric.athlete_id == athlete_id)
            .order_by(PMCMetric.day.desc())
            .first()
        )

        if not biomarker or not pmc:
            return

        historical = (
            self.db.query(DailyBiomarker)
            .filter(DailyBiomarker.athlete_id == athlete_id)
            .order_by(DailyBiomarker.day.asc())
            .all()
        )

        rmssd_series = [
            b.hrv_rmssd_ms for b in historical if b.hrv_rmssd_ms is not None
        ]

        if len(rmssd_series) < 21:
            return

        baseline = self.engine.compute_hrv_baseline(rmssd_series)

        risk = self.engine.compute_risk_score(
            current_rmssd=biomarker.hrv_rmssd_ms,
            baseline=baseline,
            ctl=pmc.ctl,
            atl=pmc.atl,
            tsb=pmc.tsb,
            recent_rmssd=rmssd_series,
            sleep_score=biomarker.sleep_score,
            body_battery=biomarker.body_battery,
        )

        existing = (
            self.db.query(RiskAssessment)
            .filter(
                RiskAssessment.athlete_id == athlete_id,
                RiskAssessment.day == biomarker.day,
            )
            .first()
        )

        if not existing:

            self.db.add(
                RiskAssessment(
                    athlete_id=athlete_id,
                    day=biomarker.day,
                    risk_level=risk.risk_level,
                    risk_score=risk.risk_score,
                    rationale=risk.rationale,
                )
            )

        else:

            existing.risk_level = risk.risk_level
            existing.risk_score = risk.risk_score
            existing.rationale = risk.rationale

        self.db.commit()
