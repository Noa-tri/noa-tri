from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.external_activity import ExternalActivity, ExternalActivityStatus


class ExternalActivityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_provider_activity_id(
        self,
        athlete_id: int,
        provider: str,
        external_activity_id: str,
    ) -> ExternalActivity | None:
        return (
            self.db.query(ExternalActivity)
            .filter(
                ExternalActivity.athlete_id == athlete_id,
                ExternalActivity.provider == provider,
                ExternalActivity.external_activity_id == external_activity_id,
            )
            .first()
        )

    def create_discovered(
        self,
        athlete_id: int,
        provider: str,
        external_activity_id: str,
        activity_name: str | None,
        sport_type: str | None,
        start_time,
        duration_seconds,
        raw_payload: dict,
    ) -> ExternalActivity:
        entity = ExternalActivity(
            athlete_id=athlete_id,
            provider=provider,
            external_activity_id=external_activity_id,
            activity_name=activity_name,
            sport_type=sport_type,
            start_time=start_time,
            duration_seconds=duration_seconds,
            raw_payload=raw_payload,
            status=ExternalActivityStatus.DISCOVERED,
        )
        self.db.add(entity)
        return entity

    def mark_downloaded(self, ext_activity: ExternalActivity) -> None:
        ext_activity.status = ExternalActivityStatus.DOWNLOADED
        self.db.add(ext_activity)

    def mark_processed(
        self,
        ext_activity: ExternalActivity,
        internal_session_id: int,
    ) -> None:
        ext_activity.status = ExternalActivityStatus.PROCESSED
        ext_activity.internal_session_id = internal_session_id
        ext_activity.last_error = None
        self.db.add(ext_activity)

    def mark_failed(self, ext_activity: ExternalActivity, error: str) -> None:
        ext_activity.status = ExternalActivityStatus.FAILED
        ext_activity.last_error = error[:2000]
        self.db.add(ext_activity)

    def has_internal_session_link(self, external_activity_id: int) -> bool:
        entity = self.db.query(ExternalActivity).filter(
            ExternalActivity.id == external_activity_id,
            ExternalActivity.internal_session_id.isnot(None),
        ).first()
        return entity is not None
