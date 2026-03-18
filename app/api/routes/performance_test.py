from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.models.performance_test import PerformanceTest
from app.schemas.performance_test import PerformanceTestCreate, PerformanceTestResponse


router = APIRouter(prefix="/performance-tests", tags=["performance-tests"])


@router.post("/", response_model=PerformanceTestResponse, status_code=status.HTTP_201_CREATED)
def create_performance_test(
    payload: PerformanceTestCreate,
    db: Session = Depends(get_db),
) -> PerformanceTest:
    athlete = db.query(Athlete).filter(Athlete.id == payload.athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    performance_test = PerformanceTest(
        athlete_id=payload.athlete_id,
        sport=payload.sport,
        test_type=payload.test_type,
        metric_name=payload.metric_name,
        metric_value=payload.metric_value,
        duration_sec=payload.duration_sec,
        distance_m=payload.distance_m,
        performed_at=payload.performed_at,
        source=payload.source,
        validated=payload.validated,
        notes=payload.notes,
    )

    db.add(performance_test)
    db.commit()
    db.refresh(performance_test)

    return performance_test


@router.get("/{athlete_id}", response_model=list[PerformanceTestResponse])
def list_performance_tests(
    athlete_id: UUID,
    db: Session = Depends(get_db),
) -> list[PerformanceTest]:
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    return (
        db.query(PerformanceTest)
        .filter(PerformanceTest.athlete_id == athlete_id)
        .order_by(PerformanceTest.performed_at.desc())
        .all()
    )
