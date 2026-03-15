from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.models.external_activity import ExternalActivityStatus
from app.services.connectors.garmin_connector import GarminConnector
from app.services.synchronization.sync_repository import ExternalActivityRepository
from app.services.telemetry_ingestion import TelemetryIngestionService

logger = logging.getLogger(__name__)


@dataclass
class SyncResult:
    discovered: int = 0
    processed: int = 0
    skipped: int = 0
    failed: int = 0


class SynchronizationEngine:
    def __init__(
        self,
        db: Session,
        garmin_connector: GarminConnector,
        telemetry_ingestion_service: TelemetryIngestionService,
        external_activity_repo: ExternalActivityRepository,
    ) -> None:
        self.db = db
        self.garmin_connector = garmin_connector
        self.telemetry_ingestion_service = telemetry_ingestion_service
        self.external_activity_repo = external_activity_repo

    def sync_athlete(self, athlete_id: int) -> SyncResult:
        result = SyncResult()

        activities = self.garmin_connector.list_recent_activities()
        result.discovered = len(activities)

        for activity in activities:
            try:
                processed = self._process_activity(
                    athlete_id=athlete_id,
                    activity_payload=activity,
                )
                if processed:
                    result.processed += 1
                else:
                    result.skipped += 1
            except Exception:
                logger.exception(
                    "Synchronization failed for athlete_id=%s activity=%s",
                    athlete_id,
                    activity.get("activityId"),
                )
                result.failed += 1

        return result

    def _process_activity(self, athlete_id: int, activity_payload: dict[str, Any]) -> bool:
        external_activity_id = str(activity_payload["activityId"])

        ext_activity = self.external_activity_repo.get_by_provider_activity_id(
            athlete_id=athlete_id,
            provider="garmin",
            external_activity_id=external_activity_id,
        )

        if ext_activity and ext_activity.status == ExternalActivityStatus.PROCESSED:
            logger.info(
                "Skipping already processed activity athlete_id=%s external_activity_id=%s",
                athlete_id,
                external_activity_id,
            )
            return False

        if not ext_activity:
            ext_activity = self.external_activity_repo.create_discovered(
                athlete_id=athlete_id,
                provider="garmin",
                external_activity_id=external_activity_id,
                activity_name=activity_payload.get("activityName"),
                sport_type=(activity_payload.get("activityType") or {}).get("typeKey"),
                start_time=activity_payload.get("startTimeLocal"),
                duration_seconds=activity_payload.get("duration"),
                raw_payload=activity_payload,
            )
            self.db.commit()
            self.db.refresh(ext_activity)

        if self.external_activity_repo.has_internal_session_link(ext_activity.id):
            logger.info(
                "Skipping activity already linked to internal session ext_activity_id=%s",
                ext_activity.id,
            )
            return False

        try:
            fit_bytes = self.garmin_connector.download_fit(
                activity_id=int(external_activity_id),
            )

            self.external_activity_repo.mark_downloaded(ext_activity)
            self.db.commit()

            ingestion_result = self.telemetry_ingestion_service.ingest_fit_bytes(
                athlete_id=athlete_id,
                fit_bytes=fit_bytes,
                source_provider="garmin",
                source_activity_id=external_activity_id,
            )

            self.external_activity_repo.mark_processed(
                ext_activity=ext_activity,
                internal_session_id=ingestion_result.session_id,
            )
            self.db.commit()

            logger.info(
                "Processed Garmin activity athlete_id=%s external_activity_id=%s session_id=%s",
                athlete_id,
                external_activity_id,
                ingestion_result.session_id,
            )
            return True

        except Exception as exc:
            self.external_activity_repo.mark_failed(ext_activity, str(exc))
            self.db.commit()
            raise
