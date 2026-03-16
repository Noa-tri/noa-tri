from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.engines.noa_engine import NoaPerformanceEngine
from app.models.athlete import Athlete
from app.models.daily_biomarker import DailyBiomarker
from app.models.training_session import SessionSource, SessionSport, TrainingSession
from app.services.garmin_fit_parser import GarminFitParser, FitParseResult
from app.services.performance_pipeline import PerformancePipeline


@dataclass
class IngestionResult:
    session_id: str
    status: str


class TelemetryIngestionService:
    """
    NOA telemetry ingestion service.

    Responsibilities:
    - ingest FIT files
    - extract session summary and RR intervals
    - persist training session
    - persist daily HRV biomarker when RR exists
    - trigger NOA performance pipeline
    """

    def __init__(self, db: Session):
        self.db = db
        self.fit_parser = GarminFitParser()
        self.engine = NoaPerformanceEngine()

    # =========================================================
    # PUBLIC API
    # =========================================================

    def ingest_fit_file(self, athlete_id: str | UUID, fit_file_path: str) -> Dict[str, Any]:
        athlete = self.db.query(Athlete).filter(Athlete.id == athlete_id).first()
        if not athlete:
            raise ValueError("Athlete not found.")

        parsed = self.fit_parser.parse(fit_file_path)
        session = self._save_session(athlete=athlete, parsed=parsed)

        biomarker_updated = False
        if parsed.rr_ms:
            biomarker_updated = self._save_daily_hrv(
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
            "sport": str(session.sport),
            "start_time": session.start_time.isoformat(),
            "duration_sec": session.duration_sec,
            "distance_m": session.distance_m,
            "avg_hr": session.avg_hr,
            "max_hr": session.max_hr,
            "avg_power_w": session.avg_power_w,
            "normalized_power_w": session.normalized_power_w,
            "rr_intervals_found": len(parsed.rr_ms),
            "daily_biomarker_updated": biomarker_updated,
            "laps_found": len(parsed.laps),
            "records_found": len(parsed.records),
            "file_id": parsed.raw_file_id,
        }

    def ingest_fit_bytes(
        self,
        athlete_id: str | UUID,
        fit_bytes: bytes,
        source_provider: str | None = None,
        source_activity_id: str | None = None,
    ) -> IngestionResult:
        with NamedTemporaryFile(delete=False, suffix=".fit") as temp_file:
            temp_file.write(fit_bytes)
            temp_path = temp_file.name

        result = self.ingest_fit_file(
            athlete_id=athlete_id,
            fit_file_path=temp_path,
        )

        return IngestionResult(
            session_id=result["session_id"],
            status=result["status"],
        )

    async def ingest_uploaded_fit_bytes(
        self,
        athlete_id: str | UUID,
        filename: str,
        content: bytes,
    ) -> Dict[str, Any]:
        suffix = Path(filename).suffix or ".fit"

        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        return self.ingest_fit_file(
            athlete_id=athlete_id,
            fit_file_path=temp_path,
        )

    # =========================================================
    # PERSISTENCE
    # =========================================================

    def _save_session(self, athlete: Athlete, parsed: FitParseResult) -> TrainingSession:
        if parsed.session is None:
            raise ValueError("FIT session summary not found.")

        if parsed.session.start_time is None:
            raise ValueError("FIT session start_time not found.")

        existing_session = (
            self.db.query(TrainingSession)
            .filter(
                TrainingSession.athlete_id == athlete.id,
                TrainingSession.start_time == parsed.session.start_time,
            )
            .first()
        )

        if existing_session:
            return existing_session

        duration_sec = int(parsed.session.total_elapsed_time_sec or 0)

        session = TrainingSession(
            athlete_id=athlete.id,
            source=SessionSource.fit_import,
            sport=self._to_session_sport_enum(parsed.session.sport),
            start_time=parsed.session.start_time,
            duration_sec=duration_sec,
            distance_m=parsed.session.total_distance_m,
            avg_hr=parsed.session.avg_heart_rate,
            max_hr=parsed.session.max_heart_rate,
            avg_power_w=parsed.session.avg_power_w,
            normalized_power_w=parsed.session.normalized_power_w,
            intensity_factor=self._compute_intensity_factor(
                normalized_power_w=parsed.session.normalized_power_w,
                ftp_watts=athlete.ftp_watts,
            ),
            tss=None,
        )

        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def _save_daily_hrv(self, athlete: Athlete, day: date, rr_ms: list[int]) -> bool:
        metrics = self.engine.compute_hrv_metrics(rr_ms)

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
    def _compute_intensity_factor(
        normalized_power_w: Optional[float],
        ftp_watts: Optional[int],
    ) -> Optional[float]:
        if normalized_power_w is None or ftp_watts is None or ftp_watts <= 0:
            return None
        return round(float(normalized_power_w) / float(ftp_watts), 4)

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
        return mapping.get(str(sport).lower(), SessionSport.other)
