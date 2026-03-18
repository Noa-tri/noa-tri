from __future__ import annotations

from datetime import date
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.athlete_daily_load import AthleteDailyLoad
from app.models.training_session import TrainingSession


class DailyLoadService:
    def __init__(self, db: Session):
        self.db = db

    # =========================================================
    # PUBLIC API
    # =========================================================

    def rebuild_athlete_day(self, athlete_id, day: date) -> list[AthleteDailyLoad]:
        sessions = (
            self.db.query(TrainingSession)
            .filter(
                TrainingSession.athlete_id == athlete_id,
                TrainingSession.start_time.isnot(None),
            )
            .all()
        )

        day_sessions = [
            session
            for session in sessions
            if session.start_time and session.start_time.date() == day
        ]

        existing_rows = (
            self.db.query(AthleteDailyLoad)
            .filter(
                AthleteDailyLoad.athlete_id == athlete_id,
                AthleteDailyLoad.day == day,
            )
            .all()
        )

        for row in existing_rows:
            self.db.delete(row)

        grouped: dict[str, list[TrainingSession]] = {}
        for session in day_sessions:
            sport = self._normalize_sport(session.sport)
            grouped.setdefault(sport, []).append(session)

        created_rows: list[AthleteDailyLoad] = []

        for sport, sport_sessions in grouped.items():
            row = AthleteDailyLoad(
                athlete_id=athlete_id,
                day=day,
                sport=sport,
                tss=self._sum_metric(sport_sessions, "tss"),
                rtss=self._sum_metric_for_sport(sport_sessions, "run", "tss"),
                stss=self._sum_metric_for_sport(sport_sessions, "swim", "tss"),
                total_load=self._sum_metric(sport_sessions, "tss"),
                source_count=len(sport_sessions),
                data_quality_score=self._compute_data_quality_score(sport_sessions),
            )
            self.db.add(row)
            created_rows.append(row)

        self.db.commit()

        for row in created_rows:
            self.db.refresh(row)

        return created_rows

    def rebuild_athlete_range(self, athlete_id, days: Iterable[date]) -> list[AthleteDailyLoad]:
        created_rows: list[AthleteDailyLoad] = []
        for day in days:
            created_rows.extend(self.rebuild_athlete_day(athlete_id=athlete_id, day=day))
        return created_rows

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _normalize_sport(sport) -> str:
        if sport is None:
            return "other"

        value = str(sport).lower()

        if value in {"bike", "cycling"}:
            return "bike"

        if value in {"run", "running"}:
            return "run"

        if value in {"swim", "swimming"}:
            return "swim"

        if value in {"triathlon"}:
            return "triathlon"

        return value

    @staticmethod
    def _sum_metric(sessions: list[TrainingSession], field_name: str) -> float | None:
        values = []
        for session in sessions:
            value = getattr(session, field_name, None)
            if value is not None:
                values.append(float(value))

        if not values:
            return None

        return round(sum(values), 2)

    def _sum_metric_for_sport(
        self,
        sessions: list[TrainingSession],
        target_sport: str,
        field_name: str,
    ) -> float | None:
        filtered = [
            session
            for session in sessions
            if self._normalize_sport(session.sport) == target_sport
        ]
        return self._sum_metric(filtered, field_name)

    def _compute_data_quality_score(self, sessions: list[TrainingSession]) -> float | None:
        if not sessions:
            return None

        score = 0.0

        for session in sessions:
            session_score = 0.0

            if getattr(session, "tss", None) is not None:
                session_score += 0.35

            if getattr(session, "duration_sec", None) is not None:
                session_score += 0.20

            if getattr(session, "distance_m", None) is not None:
                session_score += 0.15

            if getattr(session, "avg_hr", None) is not None:
                session_score += 0.15

            if getattr(session, "avg_power_w", None) is not None:
                session_score += 0.15

            score += session_score

        return round(score / len(sessions), 4)
