from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.athlete import Athlete
from app.models.athlete_daily_load import AthleteDailyLoad
from app.services.daily_load_service import DailyLoadService


router = APIRouter(prefix="/daily-loads", tags=["daily-loads"])


@router.get("/{athlete_id}")
def list_daily_loads(
    athlete_id: UUID,
    sport: str | None = None,
    start_day: date | None = None,
    end_day: date | None = None,
    db: Session = Depends(get_db),
):
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    query = db.query(AthleteDailyLoad).filter(AthleteDailyLoad.athlete_id == athlete_id)

    if sport:
        query = query.filter(AthleteDailyLoad.sport == sport)

    if start_day:
        query = query.filter(AthleteDailyLoad.day >= start_day)

    if end_day:
        query = query.filter(AthleteDailyLoad.day <= end_day)

    rows = query.order_by(AthleteDailyLoad.day.desc(), AthleteDailyLoad.sport.asc()).all()

    return [
        {
            "id": str(row.id),
            "athlete_id": str(row.athlete_id),
            "day": row.day,
            "sport": row.sport,
            "tss": row.tss,
            "rtss": row.rtss,
            "stss": row.stss,
            "total_load": row.total_load,
            "source_count": row.source_count,
            "data_quality_score": row.data_quality_score,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
        }
        for row in rows
    ]


@router.post("/rebuild/{athlete_id}")
def rebuild_daily_loads(
    athlete_id: UUID,
    start_day: date | None = None,
    end_day: date | None = None,
    db: Session = Depends(get_db),
):
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    if start_day and end_day and start_day > end_day:
        raise HTTPException(status_code=400, detail="start_day cannot be greater than end_day")

    if start_day and end_day:
        from datetime import timedelta

        days: list[date] = []
        current = start_day
        while current <= end_day:
            days.append(current)
            current = current + timedelta(days=1)

        rows = DailyLoadService(db).rebuild_athlete_range(
            athlete_id=athlete_id,
            days=days,
        )
    elif start_day:
        rows = DailyLoadService(db).rebuild_athlete_day(
            athlete_id=athlete_id,
            day=start_day,
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide start_day or start_day and end_day",
        )

    return {
        "athlete_id": str(athlete_id),
        "rows": [
            {
                "id": str(row.id),
                "day": row.day,
                "sport": row.sport,
                "tss": row.tss,
                "rtss": row.rtss,
                "stss": row.stss,
                "total_load": row.total_load,
                "source_count": row.source_count,
                "data_quality_score": row.data_quality_score,
            }
            for row in rows
        ],
    }
