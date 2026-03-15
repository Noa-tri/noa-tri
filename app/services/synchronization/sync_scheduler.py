import asyncio
import logging
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models.athlete import Athlete
from app.services.connectors.garmin_connector import GarminConnector
from app.services.synchronization.sync_engine import SynchronizationEngine
from app.services.synchronization.sync_repository import ExternalActivityRepository
from app.services.telemetry_ingestion import TelemetryIngestionService

logger = logging.getLogger(__name__)


SYNC_INTERVAL_SECONDS = 300


async def run_sync_loop():
    while True:
        try:
            db: Session = SessionLocal()

            athletes = (
                db.query(Athlete)
                .filter(Athlete.garmin_access_token.isnot(None))
                .all()
            )

            for athlete in athletes:
                try:
                    engine = SynchronizationEngine(
                        db=db,
                        garmin_connector=GarminConnector(
                            access_token=athlete.garmin_access_token
                        ),
                        telemetry_ingestion_service=TelemetryIngestionService(db),
                        external_activity_repo=ExternalActivityRepository(db),
                    )

                    result = engine.sync_athlete(athlete_id=athlete.id)

                    logger.info(
                        "Sync athlete=%s discovered=%s processed=%s skipped=%s failed=%s",
                        athlete.id,
                        result.discovered,
                        result.processed,
                        result.skipped,
                        result.failed,
                    )

                except Exception:
                    logger.exception("Athlete sync failed athlete_id=%s", athlete.id)

        except Exception:
            logger.exception("Synchronization loop error")

        finally:
            db.close()

        await asyncio.sleep(SYNC_INTERVAL_SECONDS)
