from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.synchronization.sync_engine import SynchronizationEngine
from app.services.connectors.garmin_connector import GarminConnector
from app.services.telemetry_ingestion_service import TelemetryIngestionService
from app.services.synchronization.sync_repository import ExternalActivityRepository

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/athletes/{athlete_id}/garmin")
def sync_garmin_athlete(athlete_id: int, db: Session = Depends(get_db)):
    engine = SynchronizationEngine(
        db=db,
        garmin_connector=GarminConnector(db=db),
        telemetry_ingestion_service=TelemetryIngestionService(db=db),
        external_activity_repo=ExternalActivityRepository(db=db),
    )
    return engine.sync_athlete(athlete_id=athlete_id)
