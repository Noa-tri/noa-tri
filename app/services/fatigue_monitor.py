from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.daily_biomarker import DailyBiomarker
from app.models.pmc_metric import PMCMetric
from app.models.risk_assessment import RiskAssessment
from app.services.load_metrics import LoadMetricsService


class FatigueMonitorService:
    """
    NOA accumulated fatigue monitor.

    Evaluates:
    - acute fatigue via TSB
    - weekly structural fatigue via monotony / strain
    - HRV suppression when available
    - accumulated overload across 7 and 21 days
    """

    def __init__(self, db: Session):
        self.db = db

    def evaluate(self, athlete_id) -> Dict[str, Any]:
        pmc = (
            self.db.query(PMCMetric)
            .filter(PMCMetric.athlete_id == athlete_id)
            .order_by(PMCMetric.day.desc())
            .first()
        )

        if not pmc:
            return {"status": "no_pmc"}

        biomarker = (
            self.db.query(DailyBiomarker)
            .filter(DailyBiomarker.athlete_id == athlete_id)
            .order_by(DailyBiomarker.day.desc())
            .first()
        )

        load = LoadMetricsService(self.db).compute_weekly_metrics(athlete_id)
        accumulated = self._compute_accumulated_load(athlete_id=athlete_id, reference_day=pmc.day)

        risk_score = 0

        # -----------------------------------------------------
        # ACUTE FATIGUE
        # -----------------------------------------------------
        if pmc.tsb <= -30:
            risk_score += 30
        elif pmc.tsb <= -20:
            risk_score += 20
        elif pmc.tsb <= -10:
            risk_score += 10

        # -----------------------------------------------------
        # WEEKLY STRUCTURAL LOAD
        # -----------------------------------------------------
        if load["monotony"] >= 2.5:
            risk_score += 25
        elif load["monotony"] >= 2.0:
            risk_score += 15
        elif load["monotony"] >= 1.5:
            risk_score += 8

        if load["strain"] >= 7000:
            risk_score += 25
        elif load["strain"] >= 5000:
            risk_score += 18
        elif load["strain"] >= 3500:
            risk_score += 10

        # -----------------------------------------------------
        # ACCUMULATED OVERLOAD 7D / 21D
        # -----------------------------------------------------
        if accumulated["load_7d"] >= accumulated["mean_21d"] * 1.50 and accumulated["mean_21d"] > 0:
            risk_score += 25
        elif accumulated["load_7d"] >= accumulated["mean_21d"] * 1.25 and accumulated["mean_21d"] > 0:
            risk_score += 15
        elif accumulated["load_7d"] >= accumulated["mean_21d"] * 1.10 and accumulated["mean_21d"] > 0:
            risk_score += 8

        # -----------------------------------------------------
        # ATL / CTL PRESSURE
        # -----------------------------------------------------
        atl_ctl_ratio = self._compute_atl_ctl_ratio(pmc.atl, pmc.ctl)

        if atl_ctl_ratio >= 1.35:
            risk_score += 20
        elif atl_ctl_ratio >= 1.20:
            risk_score += 12
        elif atl_ctl_ratio >= 1.05:
            risk_score += 6

        # -----------------------------------------------------
        # HRV SUPPRESSION (WHEN AVAILABLE)
        # -----------------------------------------------------
        hrv_flag = None

        if biomarker and biomarker.hrv_lnrmssd is not None:
            if biomarker.hrv_lnrmssd < 3.0:
                risk_score += 25
                hrv_flag = "suppressed"
            elif biomarker.hrv_lnrmssd < 3.3:
                risk_score += 12
                hrv_flag = "low"
            else:
                hrv_flag = "normal"

        risk_score = min(risk_score, 100)

        if risk_score >= 70:
            level = "high"
        elif risk_score >= 40:
            level = "moderate"
        else:
            level = "low"

        risk = self._upsert_risk(
            athlete_id=athlete_id,
            day=pmc.day,
            risk_level=level,
            risk_score=risk_score,
            atl_ctl_ratio=atl_ctl_ratio,
            tsb=pmc.tsb,
            rationale={
                "source": "noa_fatigue_monitor",
                "monotony": load["monotony"],
                "strain": load["strain"],
                "load_7d": accumulated["load_7d"],
                "load_21d": accumulated["load_21d"],
                "mean_21d": accumulated["mean_21d"],
                "atl_ctl_ratio": atl_ctl_ratio,
                "tsb": pmc.tsb,
                "hrv_flag": hrv_flag,
            },
        )

        return {
            "risk_level": risk.risk_level,
            "risk_score": risk.risk_score,
            "monotony": load["monotony"],
            "strain": load["strain"],
            "tsb": pmc.tsb,
            "atl_ctl_ratio": atl_ctl_ratio,
            "load_7d": accumulated["load_7d"],
            "load_21d": accumulated["load_21d"],
            "mean_21d": accumulated["mean_21d"],
            "hrv_flag": hrv_flag,
        }

    def _compute_accumulated_load(self, athlete_id, reference_day: date) -> Dict[str, float]:
        pmc_rows = (
            self.db.query(PMCMetric)
            .filter(PMCMetric.athlete_id == athlete_id)
            .order_by(PMCMetric.day.asc())
            .all()
        )

        if not pmc_rows:
            return {
                "load_7d": 0.0,
                "load_21d": 0.0,
                "mean_21d": 0.0,
            }

        load_7d_start = reference_day - timedelta(days=6)
        load_21d_start = reference_day - timedelta(days=20)

        load_7d = 0.0
        load_21d = 0.0
        daily_21d: List[float] = []

        for row in pmc_rows:
            if load_7d_start <= row.day <= reference_day:
                load_7d += float(row.daily_tss or 0.0)

            if load_21d_start <= row.day <= reference_day:
                value = float(row.daily_tss or 0.0)
                load_21d += value
                daily_21d.append(value)

        mean_21d = (load_21d / len(daily_21d)) if daily_21d else 0.0

        return {
            "load_7d": round(load_7d, 2),
            "load_21d": round(load_21d, 2),
            "mean_21d": round(mean_21d, 2),
        }

    @staticmethod
    def _compute_atl_ctl_ratio(atl: Optional[float], ctl: Optional[float]) -> float:
        if atl is None or ctl is None or ctl <= 0:
            return 0.0
        return round(float(atl) / float(ctl), 4)

    def _upsert_risk(
        self,
        athlete_id,
        day: date,
        risk_level: str,
        risk_score: float,
        atl_ctl_ratio: float,
        tsb: float,
        rationale: Dict[str, Any],
    ) -> RiskAssessment:
        existing = (
            self.db.query(RiskAssessment)
            .filter(
                RiskAssessment.athlete_id == athlete_id,
                RiskAssessment.day == day,
            )
            .first()
        )

        if existing is None:
            risk = RiskAssessment(
                athlete_id=athlete_id,
                day=day,
                risk_level=risk_level,
                risk_score=risk_score,
                atl_ctl_ratio=atl_ctl_ratio,
                tsb=tsb,
                rationale=rationale,
            )
            self.db.add(risk)
            self.db.commit()
            self.db.refresh(risk)
            return risk

        existing.risk_level = risk_level
        existing.risk_score = risk_score
        existing.atl_ctl_ratio = atl_ctl_ratio
        existing.tsb = tsb
        existing.rationale = rationale
        self.db.commit()
        self.db.refresh(existing)
        return existing
