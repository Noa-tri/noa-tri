from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.services.telemetry_ingestion import TelemetryIngestionService

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("/fit-upload", status_code=status.HTTP_201_CREATED)
async def upload_fit_file(
    athlete_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict:
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    filename = file.filename or ""
    if not filename.lower().endswith(".fit"):
        raise HTTPException(status_code=400, detail="Only .fit files are supported")

    suffix = Path(filename).suffix or ".fit"

    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        service = TelemetryIngestionService(db)
        result = service.ingest_fit_file(
            athlete_id=str(athlete_id),
            fit_file_path=temp_path,
        )

        return {
            "status": "ok",
            "message": "FIT file processed successfully",
            "result": result,
        }

    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"FIT processing failed: {str(exc)}") from exc
