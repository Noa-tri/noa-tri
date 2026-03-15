from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fitparse import FitFile


@dataclass
class FitSessionSummary:
    sport: str
    sub_sport: Optional[str]
    start_time: Optional[datetime]
    total_elapsed_time_sec: Optional[float]
    total_timer_time_sec: Optional[float]
    total_distance_m: Optional[float]
    total_calories: Optional[float]
    avg_speed_mps: Optional[float]
    max_speed_mps: Optional[float]
    avg_heart_rate: Optional[int]
    max_heart_rate: Optional[int]
    avg_power_w: Optional[int]
    max_power_w: Optional[int]
    normalized_power_w: Optional[float]
    total_ascent_m: Optional[float]
    total_descent_m: Optional[float]
    total_training_effect: Optional[float]
    anaerobic_training_effect: Optional[float]


@dataclass
class FitRecordPoint:
    timestamp: Optional[datetime]
    heart_rate_bpm: Optional[int]
    power_w: Optional[int]
    cadence_rpm: Optional[float]
    speed_mps: Optional[float]
    altitude_m: Optional[float]
    latitude: Optional[float]
    longitude: Optional[float]
    temperature_c: Optional[float]
    vertical_oscillation_cm: Optional[float]
    ground_contact_time_ms: Optional[float]
    stance_time_balance_pct: Optional[float]
    step_length_m: Optional[float]


@dataclass
class FitLapSummary:
    lap_index: int
    start_time: Optional[datetime]
    total_elapsed_time_sec: Optional[float]
    total_distance_m: Optional[float]
    avg_heart_rate: Optional[int]
    max_heart_rate: Optional[int]
    avg_power_w: Optional[int]
    max_power_w: Optional[int]
    avg_speed_mps: Optional[float]
    max_speed_mps: Optional[float]


@dataclass
class FitParseResult:
    file_path: str
    session: Optional[FitSessionSummary]
    records: List[FitRecordPoint]
    laps: List[FitLapSummary]
    rr_ms: List[int]
    raw_file_id: Dict[str, Any]


class GarminFitParser:
    """
    NOA Garmin FIT parser.

    Extracts:
    - session summary
    - record-by-record telemetry
    - lap summaries
    - RR intervals when available
    """

    def parse(self, fit_file_path: str) -> FitParseResult:
        path = Path(fit_file_path)
        if not path.exists():
            raise FileNotFoundError(f"FIT file not found: {fit_file_path}")

        fit = FitFile(str(path))

        raw_file_id = self._parse_file_id(fit)
        session = self._parse_session(fit)
        records = self._parse_records(fit)
        laps = self._parse_laps(fit)
        rr_ms = self._parse_hrv(fit)

        return FitParseResult(
            file_path=str(path),
            session=session,
            records=records,
            laps=laps,
            rr_ms=rr_ms,
            raw_file_id=raw_file_id,
        )

    # =========================================================
    # FILE METADATA
    # =========================================================

    def _parse_file_id(self, fit: FitFile) -> Dict[str, Any]:
        for message in fit.get_messages("file_id"):
            data = self._message_to_dict(message)
            return {
                "type": data.get("type"),
                "manufacturer": data.get("manufacturer"),
                "product": data.get("product"),
                "serial_number": data.get("serial_number"),
                "time_created": data.get("time_created"),
            }
        return {}

    # =========================================================
    # SESSION
    # =========================================================

    def _parse_session(self, fit: FitFile) -> Optional[FitSessionSummary]:
        for message in fit.get_messages("session"):
            data = self._message_to_dict(message)

            return FitSessionSummary(
                sport=self._normalize_sport(data.get("sport")),
                sub_sport=self._safe_str(data.get("sub_sport")),
                start_time=self._safe_datetime(data.get("start_time")),
                total_elapsed_time_sec=self._safe_float(data.get("total_elapsed_time")),
                total_timer_time_sec=self._safe_float(data.get("total_timer_time")),
                total_distance_m=self._safe_float(data.get("total_distance")),
                total_calories=self._safe_float(data.get("total_calories")),
                avg_speed_mps=self._safe_float(data.get("avg_speed")),
                max_speed_mps=self._safe_float(data.get("max_speed")),
                avg_heart_rate=self._safe_int(data.get("avg_heart_rate")),
                max_heart_rate=self._safe_int(data.get("max_heart_rate")),
                avg_power_w=self._safe_int(data.get("avg_power")),
                max_power_w=self._safe_int(data.get("max_power")),
                normalized_power_w=self._safe_float(data.get("normalized_power")),
                total_ascent_m=self._safe_float(data.get("total_ascent")),
                total_descent_m=self._safe_float(data.get("total_descent")),
                total_training_effect=self._safe_float(data.get("total_training_effect")),
                anaerobic_training_effect=self._safe_float(data.get("total_anaerobic_training_effect")),
            )

        return None

    # =========================================================
    # RECORDS
    # =========================================================

    def _parse_records(self, fit: FitFile) -> List[FitRecordPoint]:
        records: List[FitRecordPoint] = []

        for message in fit.get_messages("record"):
            data = self._message_to_dict(message)

            records.append(
                FitRecordPoint(
                    timestamp=self._safe_datetime(data.get("timestamp")),
                    heart_rate_bpm=self._safe_int(data.get("heart_rate")),
                    power_w=self._safe_int(data.get("power")),
                    cadence_rpm=self._safe_float(data.get("cadence")),
                    speed_mps=self._safe_float(data.get("speed")),
                    altitude_m=self._safe_float(data.get("altitude")),
                    latitude=self._semicircles_to_degrees(data.get("position_lat")),
                    longitude=self._semicircles_to_degrees(data.get("position_long")),
                    temperature_c=self._safe_float(data.get("temperature")),
                    vertical_oscillation_cm=self._safe_float(data.get("vertical_oscillation")),
                    ground_contact_time_ms=self._safe_float(data.get("ground_contact_time")),
                    stance_time_balance_pct=self._safe_float(data.get("stance_time_balance")),
                    step_length_m=self._safe_float(data.get("step_length")),
                )
            )

        return records

    # =========================================================
    # LAPS
    # =========================================================

    def _parse_laps(self, fit: FitFile) -> List[FitLapSummary]:
        laps: List[FitLapSummary] = []

        for idx, message in enumerate(fit.get_messages("lap"), start=1):
            data = self._message_to_dict(message)

            laps.append(
                FitLapSummary(
                    lap_index=idx,
                    start_time=self._safe_datetime(data.get("start_time")),
                    total_elapsed_time_sec=self._safe_float(data.get("total_elapsed_time")),
                    total_distance_m=self._safe_float(data.get("total_distance")),
                    avg_heart_rate=self._safe_int(data.get("avg_heart_rate")),
                    max_heart_rate=self._safe_int(data.get("max_heart_rate")),
                    avg_power_w=self._safe_int(data.get("avg_power")),
                    max_power_w=self._safe_int(data.get("max_power")),
                    avg_speed_mps=self._safe_float(data.get("avg_speed")),
                    max_speed_mps=self._safe_float(data.get("max_speed")),
                )
            )

        return laps

    # =========================================================
    # HRV / RR
    # =========================================================

    def _parse_hrv(self, fit: FitFile) -> List[int]:
        rr_ms: List[int] = []

        for message in fit.get_messages("hrv"):
            for field in message:
                if field.name != "time":
                    continue

                if isinstance(field.value, list):
                    for value in field.value:
                        rr = self._seconds_to_ms(value)
                        if rr is not None:
                            rr_ms.append(rr)
                else:
                    rr = self._seconds_to_ms(field.value)
                    if rr is not None:
                        rr_ms.append(rr)

        return rr_ms

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
    def _safe_str(value: Any) -> Optional[str]:
        if value is None:
            return None
        return str(value)

    @staticmethod
    def _safe_datetime(value: Any) -> Optional[datetime]:
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

        mapping = {
            "cycling": "bike",
            "running": "run",
            "strength_training": "strength",
        }

        return mapping.get(sport, sport)

    @staticmethod
    def _semicircles_to_degrees(value: Any) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value) * (180.0 / 2**31)
        except (TypeError, ValueError):
            return None
