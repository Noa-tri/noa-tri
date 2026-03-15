from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fitparse import FitFile
from sqlalchemy.orm import Session

from app.models.athlete import Athlete
from app.models.daily_biomarker import DailyBiomarker
from app.models.training_session import SessionSource, SessionSport, TrainingSession
from app.services.performance_pipeline import PerformancePipeline


@dataclass
class ParsedFitSession:
    sport: str
    start_time: datetime
    duration_sec: int
    distance_m: Optional[float]
    avg_hr: Optional[int]
    max_hr: Optional[int]
    avg_power_w: Optional[int]
    normalized_power_w: Optional[float]
    intensity_factor: Optional[float]
    rr_ms: List[int]
    raw_summary: Dict[str, Any]


class TelemetryIngestionService:
    """
    NOA telemetry ingestion service.

    Responsibilities:
    - Parse FIT files
    - Extract session summary
    - Extract RR intervals when available
    - Persist training session
    - Persist daily HRV biomarker when RR data exists
    - Trigger NOA performance pipeline
    """

    def __init__(self, db: Session):
        self.db = db

    # =========================================================
    # PUBLIC API
    # =========================================================

    def ingest_fit_file(self, athlete_id: str, fit_file_path: str) -> Dict[str, Any]:
        athlete = self.db.query(Athlete).filter(Athlete.id == athlete_id).first()
        if not athlete:
            raise ValueError("Athlete not found.")

        parsed = self._parse_fit_file(fit_file_path=fit_file_path, athlete=athlete)
        session = self._save_session(athlete=athlete, parsed=parsed)

        biomarker_created = False
        if parsed.rr_ms:
            biomarker_created = self._save_daily_hrv(
                athlete=athlete,
                day=session.start_time.date(),
                rr_ms=parsed.rr_ms,
            )

        pipeline = PerformancePipeline(self.db)
        pipeline.process_session(session.id)

        return {
            "status": "processed",
            "athlete_id": str(athlete.id),
            "session_id": str(session.id),
            "fit_file_path": fit_file_path,
            "rr_intervals_found": len(parsed.rr_ms),
            "daily_biomarker_updated": biomarker_created,
        }

    # =========================================================
    # FIT PARSING
    # =========================================================

    def _parse_fit_file(self, fit_file_path: str, athlete: Athlete) -> ParsedFitSession:
        path = Path(fit_file_path)
        if not path.exists():
            raise FileNotFoundError(f"FIT file not found: {fit_file_path}")

        fitfile = FitFile(str(path))

        sport = "other"
        start_time: Optional[datetime] = None
        duration_sec = 0
        distance_m: Optional[float] = None
        avg_hr: Optional[int] = None
        max_hr: Optional[int] = None
        avg_power_w: Optional[int] = None
        normalized_power_w: Optional[float] = None
        intensity_factor: Optional[float] = None
        rr_ms: List[int] = []

        # Session-level summary
        for message in fitfile.get_messages("session"):
            data = self._message_to_dict(message)

            sport = self._normalize_sport(data.get("sport") or data.get("sub_sport"))
            start_time = self._coerce_datetime(data.get("start_time"))
            duration_sec = int(float(data.get("total_elapsed_time") or 0))
            distance_m = self._safe_float(data.get("total_distance"))
            avg_hr = self._safe_int(data.get("avg_heart_rate"))
            max_hr = self._safe_int(data.get("max_heart_rate"))
            avg_power_w = self._safe_int(data.get("avg_power"))
            normalized_power_w = self._safe_float(
                data.get("normalized_power") or data.get("enhanced_avg_power")
            )

            if normalized_power_w and athlete.ftp_watts and athlete.ftp_watts > 0:
                intensity_factor = round(normalized_power_w / athlete.ftp_watts, 4)

            break

        # RR intervals
        for message in fitfile.get_messages("hrv"):
            for field in message:
                if field.name == "time":
                    if isinstance(field.value, list):
                        for value in field.value:
                            rr = self._seconds_to_ms(value)
                            if rr is not None:
                                rr_ms.append(rr)
                    else:
                        rr = self._seconds_to_ms(field.value)
                        if rr is not None:
                            rr_ms.append(rr)

        # Fallback if no session message start_time
        if start_time is None:
            for record in fitfile.get_messages("record"):
                data = self._message_to_dict(record)
                start_time = self._coerce_datetime(data.get("timestamp"))
                if start_time is not None:
                    break

        if start_time is None:
            raise ValueError("Could not determine session start_time from FIT file.")

        return ParsedFitSession(
            sport=sport,
            start_time=start_time,
            duration_sec=duration_sec,
            distance_m=distance_m,
            avg_hr=avg_hr,
            max_hr=max_hr,
            avg_power_w=avg_power_w,
            normalized_power_w=normalized_power_w,
            intensity_factor=intensity_factor,
            rr_ms=rr_ms,
            raw_summary={
                "sport": sport,
                "start_time": start_time.isoformat(),
                "duration_sec": duration_sec,
                "distance_m": distance_m,
                "avg_hr": avg_hr,
                "max_hr": max_hr,
                "avg_power_w": avg_power_w,
                "normalized_power_w": normalized_power_w,
                "intensity_factor": intensity_factor,
            },
        )

    # =========================================================
    # PERSISTENCE
    # =========================================================

    def _save_session(self, athlete: Athlete, parsed: ParsedFitSession) -> TrainingSession:
        session = TrainingSession(
            athlete_id=athlete.id,
            source=SessionSource.fit_import,
            sport=self._to_session_sport_enum(parsed.sport),
            start_time=parsed.start_time,
            duration_sec=parsed.duration_sec,
            distance_m=parsed.distance_m,
            avg_hr=parsed.avg_hr,
            max_hr=parsed.max_hr,
            avg_power_w=parsed.avg_power_w,
            normalized_power_w=parsed.normalized_power_w,
            intensity_factor=parsed.intensity_factor,
            tss=None,
        )

        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def _save_daily_hrv(self, athlete: Athlete, day, rr_ms: List[int]) -> bool:
        from app.engines.noa_engine import NoaPerformanceEngine

        engine = NoaPerformanceEngine()
        metrics = engine.compute_hrv_metrics(rr_ms)

        if metrics["rmssd"] is None:
            return False

        biomarker = (
            self.db.query(DailyBiomarker)
            .filter(
                DailyBiomarker.athlete_id == athlete.id,
                DailyBiomarker.day == day,
            )
            .first()
        )

        if biomarker is None:
            biomarker = DailyBiomarker(
                athlete_id=athlete.id,
                day=day,
                hrv_rmssd_ms=metrics["rmssd"],
                hrv_lnrmssd=metrics["lnrmssd"],
                resting_hr=athlete.threshold_hr,
                sleep_score=None,
                body_battery=None,
            )
            self.db.add(biomarker)
        else:
            biomarker.hrv_rmssd_ms = metrics["rmssd"]
            biomarker.hrv_lnrmssd = metrics["lnrmssd"]

        self.db.commit()
        return True

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _message_to_dict(message) -> Dict[str, Any]:
        data: Dict[str, Any] = {}
        for field in message:
            data[field.name] = field.value
        return data

    @staticmethod
    def _safe_int(value: Any) -> Optional[int]:
        if value is None:
            return None
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _safe_float(value: Any) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _coerce_datetime(value: Any) -> Optional[datetime]:
        if isinstance(value, datetime):
            return value
        return None

    @staticmethod
    def _seconds_to_ms(value: Any) -> Optional[int]:
        try:
            return int(float(value) * 1000.0)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _normalize_sport(value: Any) -> str:
        if value is None:
            return "other"

        sport = str(value).lower()

        valid = {
            "triathlon",
            "swim",
            "bike",
            "cycling",
            "run",
            "running",
            "strength_training",
            "strength",
            "mobility",
        }

        if sport not in valid:
            return "other"

        mapping = {
            "cycling": "bike",
            "running": "run",
            "strength_training": "strength",
        }

        return mapping.get(sport, sport)

    @staticmethod
    def _to_session_sport_enum(sport: str) -> SessionSport:
        mapping = {
            "triathlon": SessionSport.triathlon,
            "swim": SessionSport.swim,
            "bike": SessionSport.bike,
            "run": SessionSport.run,
            "strength": SessionSport.strength,
            "mobility": SessionSport.mobility,
            "other": SessionSport.other,
        }
        return mapping.get(sport, SessionSport.other)
