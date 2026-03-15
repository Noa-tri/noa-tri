from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.athlete import Athlete
from app.models.daily_biomarker import DailyBiomarker
from app.models.pmc_metric import PMCMetric
from app.models.training_session import TrainingSession


@dataclass(frozen=True)
class AthleteProfile:
    athlete_id: str
    athlete_name: str
    profile_status: str
    experience_level: str
    weekly_sessions_avg: float
    weekly_tss_avg: float
    long_bike_duration_avg_sec: float | None
    long_run_duration_avg_sec: float | None
    ftp_watts: int | None
    threshold_hr: int | None
    vo2max: float | None
    hrv_baseline_rmssd: float | None
    ctl_current: float | None
    atl_current: float | None
    tsb_current: float | None
    dominant_sport: str | None
    intensity_profile: str
    recommended_weekly_tss: float
    recommended_ctl_ramp_per_week: float
    readiness_label: str


class AthleteProfilingService:
    """
    Builds NOA athlete profile from historical data.

    If history is insufficient, returns a controlled default profile.
    """

    MIN_SESSIONS_FOR_PROFILE = 8
    DEFAULT_CTL = 35.0
    DEFAULT_ATL = 40.0
    DEFAULT_TSB = -5.0
    DEFAULT_HRV_RMSSD = 55.0
    DEFAULT_WEEKLY_TSS = 300.0
    DEFAULT_CTL_RAMP = 4.0

    def __init__(self, db: Session):
        self.db = db

    def build_profile(self, athlete_id) -> Dict[str, Any]:
        athlete = self.db.query(Athlete).filter(Athlete.id == athlete_id).first()
        if not athlete:
            raise ValueError("Athlete not found.")

        sessions = (
            self.db.query(TrainingSession)
            .filter(TrainingSession.athlete_id == athlete_id)
            .order_by(TrainingSession.start_time.asc())
            .all()
        )

        biomarkers = (
            self.db.query(DailyBiomarker)
            .filter(DailyBiomarker.athlete_id == athlete_id)
            .order_by(DailyBiomarker.day.asc())
            .all()
        )

        latest_pmc = (
            self.db.query(PMCMetric)
            .filter(PMCMetric.athlete_id == athlete_id)
            .order_by(PMCMetric.day.desc())
            .first()
        )

        if len(sessions) < self.MIN_SESSIONS_FOR_PROFILE:
            return self._build_default_profile(
                athlete=athlete,
                latest_pmc=latest_pmc,
                biomarkers=biomarkers,
            )

        weekly_sessions_avg = self._compute_weekly_sessions_avg(sessions)
        weekly_tss_avg = self._compute_weekly_tss_avg(sessions)
        dominant_sport = self._dominant_sport(sessions)
        intensity_profile = self._intensity_profile(sessions)
        long_bike_duration_avg_sec = self._average_long_duration_by_sport(sessions, "bike")
        long_run_duration_avg_sec = self._average_long_duration_by_sport(sessions, "run")
        hrv_baseline_rmssd = self._hrv_baseline(biomarkers)
        experience_level = self._infer_experience_level(
            weekly_tss_avg=weekly_tss_avg,
            weekly_sessions_avg=weekly_sessions_avg,
        )
        readiness_label = self._infer_readiness(
            ctl=latest_pmc.ctl if latest_pmc else None,
            tsb=latest_pmc.tsb if latest_pmc else None,
            hrv_baseline_rmssd=hrv_baseline_rmssd,
        )

        profile = AthleteProfile(
            athlete_id=str(athlete.id),
            athlete_name=f"{athlete.first_name} {athlete.last_name}",
            profile_status="historical",
            experience_level=experience_level,
            weekly_sessions_avg=round(weekly_sessions_avg, 2),
            weekly_tss_avg=round(weekly_tss_avg, 2),
            long_bike_duration_avg_sec=round(long_bike_duration_avg_sec, 2) if long_bike_duration_avg_sec is not None else None,
            long_run_duration_avg_sec=round(long_run_duration_avg_sec, 2) if long_run_duration_avg_sec is not None else None,
            ftp_watts=athlete.ftp_watts,
            threshold_hr=athlete.threshold_hr,
            vo2max=athlete.vo2max,
            hrv_baseline_rmssd=round(hrv_baseline_rmssd, 2) if hrv_baseline_rmssd is not None else None,
            ctl_current=round(float(latest_pmc.ctl), 2) if latest_pmc and latest_pmc.ctl is not None else None,
            atl_current=round(float(latest_pmc.atl), 2) if latest_pmc and latest_pmc.atl is not None else None,
            tsb_current=round(float(latest_pmc.tsb), 2) if latest_pmc and latest_pmc.tsb is not None else None,
            dominant_sport=dominant_sport,
            intensity_profile=intensity_profile,
            recommended_weekly_tss=round(self._recommended_weekly_tss(weekly_tss_avg), 2),
            recommended_ctl_ramp_per_week=round(self._recommended_ctl_ramp(weekly_tss_avg), 2),
            readiness_label=readiness_label,
        )

        return self._as_dict(profile)

    def _build_default_profile(
        self,
        athlete: Athlete,
        latest_pmc: PMCMetric | None,
        biomarkers: List[DailyBiomarker],
    ) -> Dict[str, Any]:
        hrv_baseline = self._hrv_baseline(biomarkers) or self.DEFAULT_HRV_RMSSD

        profile = AthleteProfile(
            athlete_id=str(athlete.id),
            athlete_name=f"{athlete.first_name} {athlete.last_name}",
            profile_status="default",
            experience_level="general",
            weekly_sessions_avg=6.0,
            weekly_tss_avg=self.DEFAULT_WEEKLY_TSS,
            long_bike_duration_avg_sec=7200.0,
            long_run_duration_avg_sec=4800.0,
            ftp_watts=athlete.ftp_watts,
            threshold_hr=athlete.threshold_hr,
            vo2max=athlete.vo2max,
            hrv_baseline_rmssd=round(hrv_baseline, 2),
            ctl_current=round(float(latest_pmc.ctl), 2) if latest_pmc and latest_pmc.ctl is not None else self.DEFAULT_CTL,
            atl_current=round(float(latest_pmc.atl), 2) if latest_pmc and latest_pmc.atl is not None else self.DEFAULT_ATL,
            tsb_current=round(float(latest_pmc.tsb), 2) if latest_pmc and latest_pmc.tsb is not None else self.DEFAULT_TSB,
            dominant_sport="triathlon",
            intensity_profile="mixed",
            recommended_weekly_tss=self.DEFAULT_WEEKLY_TSS,
            recommended_ctl_ramp_per_week=self.DEFAULT_CTL_RAMP,
            readiness_label="building",
        )

        return self._as_dict(profile)

    @staticmethod
    def _as_dict(profile: AthleteProfile) -> Dict[str, Any]:
        return {
            "athlete_id": profile.athlete_id,
            "athlete_name": profile.athlete_name,
            "profile_status": profile.profile_status,
            "experience_level": profile.experience_level,
            "weekly_sessions_avg": profile.weekly_sessions_avg,
            "weekly_tss_avg": profile.weekly_tss_avg,
            "long_bike_duration_avg_sec": profile.long_bike_duration_avg_sec,
            "long_run_duration_avg_sec": profile.long_run_duration_avg_sec,
            "ftp_watts": profile.ftp_watts,
            "threshold_hr": profile.threshold_hr,
            "vo2max": profile.vo2max,
            "hrv_baseline_rmssd": profile.hrv_baseline_rmssd,
            "ctl_current": profile.ctl_current,
            "atl_current": profile.atl_current,
            "tsb_current": profile.tsb_current,
            "dominant_sport": profile.dominant_sport,
            "intensity_profile": profile.intensity_profile,
            "recommended_weekly_tss": profile.recommended_weekly_tss,
            "recommended_ctl_ramp_per_week": profile.recommended_ctl_ramp_per_week,
            "readiness_label": profile.readiness_label,
        }

    @staticmethod
    def _session_sport_value(session: TrainingSession) -> str:
        sport = session.sport
        return getattr(sport, "value", str(sport))

    def _compute_weekly_sessions_avg(self, sessions: List[TrainingSession]) -> float:
        if not sessions:
            return 0.0

        by_week: Dict[str, int] = {}
        for session in sessions:
            iso = session.start_time.isocalendar()
            key = f"{iso.year}-W{iso.week}"
            by_week[key] = by_week.get(key, 0) + 1

        return sum(by_week.values()) / len(by_week) if by_week else 0.0

    def _compute_weekly_tss_avg(self, sessions: List[TrainingSession]) -> float:
        if not sessions:
            return 0.0

        by_week: Dict[str, float] = {}
        for session in sessions:
            iso = session.start_time.isocalendar()
            key = f"{iso.year}-W{iso.week}"
            by_week[key] = by_week.get(key, 0.0) + float(session.tss or 0.0)

        return sum(by_week.values()) / len(by_week) if by_week else 0.0

    def _dominant_sport(self, sessions: List[TrainingSession]) -> str | None:
        if not sessions:
            return None

        counts: Dict[str, int] = {}
        for session in sessions:
            sport = self._session_sport_value(session)
            counts[sport] = counts.get(sport, 0) + 1

        return max(counts, key=counts.get)

    def _average_long_duration_by_sport(self, sessions: List[TrainingSession], sport_name: str) -> float | None:
        sport_sessions = [
            float(s.duration_sec)
            for s in sessions
            if self._session_sport_value(s) == sport_name and s.duration_sec is not None
        ]

        if not sport_sessions:
            return None

        sport_sessions.sort(reverse=True)
        top = sport_sessions[: min(4, len(sport_sessions))]
        return sum(top) / len(top)

    def _hrv_baseline(self, biomarkers: List[DailyBiomarker]) -> float | None:
        values = [float(b.hrv_rmssd_ms) for b in biomarkers if b.hrv_rmssd_ms is not None]
        if not values:
            return None

        window = values[-21:] if len(values) >= 21 else values
        return sum(window) / len(window)

    def _intensity_profile(self, sessions: List[TrainingSession]) -> str:
        if not sessions:
            return "mixed"

        if_values = [float(s.intensity_factor) for s in sessions if s.intensity_factor is not None]
        if not if_values:
            return "mixed"

        mean_if = sum(if_values) / len(if_values)

        if mean_if >= 0.88:
            return "high_intensity"
        if mean_if >= 0.75:
            return "mixed"
        return "endurance"

    @staticmethod
    def _infer_experience_level(weekly_tss_avg: float, weekly_sessions_avg: float) -> str:
        if weekly_tss_avg >= 700 and weekly_sessions_avg >= 9:
            return "advanced"
        if weekly_tss_avg >= 450 and weekly_sessions_avg >= 7:
            return "intermediate"
        return "general"

    @staticmethod
    def _recommended_weekly_tss(current_weekly_tss_avg: float) -> float:
        if current_weekly_tss_avg <= 0:
            return 300.0
        return current_weekly_tss_avg * 1.05

    @staticmethod
    def _recommended_ctl_ramp(current_weekly_tss_avg: float) -> float:
        if current_weekly_tss_avg >= 700:
            return 3.0
        if current_weekly_tss_avg >= 450:
            return 4.0
        return 5.0

    @staticmethod
    def _infer_readiness(
        ctl: Optional[float],
        tsb: Optional[float],
        hrv_baseline_rmssd: Optional[float],
    ) -> str:
        if ctl is None or tsb is None:
            return "building"

        if tsb > 10:
            return "fresh"
        if tsb < -20:
            return "fatigued"
        if hrv_baseline_rmssd is not None and hrv_baseline_rmssd < 40:
            return "monitor"
        return "stable"
