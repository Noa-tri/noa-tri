from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.schemas.athlete import AthleteCreate, AthleteResponse

router = APIRouter(prefix="/athletes", tags=["athletes"])


@router.post("/", response_model=AthleteResponse, status_code=status.HTTP_201_CREATED)
def create_athlete(payload: AthleteCreate, db: Session = Depends(get_db)) -> Athlete:
    athlete = Athlete(
        organization_id=payload.organization_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
        ftp_watts=payload.ftp_watts,
        threshold_hr=payload.threshold_hr,
        vo2max=payload.vo2max,
    )
    db.add(athlete)
    db.commit()
    db.refresh(athlete)
    return athlete


@router.get("/", response_model=list[AthleteResponse])
def list_athletes(db: Session = Depends(get_db)) -> list[Athlete]:
    return db.query(Athlete).order_by(Athlete.created_at.desc()).all()


@router.get("/{athlete_id}", response_model=AthleteResponse)
def get_athlete(athlete_id: UUID, db: Session = Depends(get_db)) -> Athlete:
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete
