from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.athlete import Athlete
from app.services.connectors.garmin_connector import GarminConnector
from app.services.synchronization.sync_engine import SynchronizationEngine
from app.services.synchronization.sync_repository import ExternalActivityRepository
from app.services.telemetry_ingestion import TelemetryIngestionService

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/athletes/{athlete_id}/garmin")
def sync_garmin_athlete(athlete_id: int, db: Session = Depends(get_db)):
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    garmin_access_token = getattr(athlete, "garmin_access_token", None)
    if not garmin_access_token:
        raise HTTPException(status_code=400, detail="Garmin access token not configured")

    engine = SynchronizationEngine(
        db=db,
        garmin_connector=GarminConnector(access_token=garmin_access_token),
        telemetry_ingestion_service=TelemetryIngestionService(db=db),
        external_activity_repo=ExternalActivityRepository(db=db),
    )

    result = engine.sync_athlete(athlete_id=athlete_id)

    return {
        "discovered": result.discovered,
        "processed": result.processed,
        "skipped": result.skipped,
        "failed": result.failed,
    }
