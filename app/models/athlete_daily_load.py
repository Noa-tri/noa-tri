from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AthleteDailyLoad(Base):
    __tablename__ = "athlete_daily_loads"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("athletes.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    day: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    sport: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
    )

    # =========================================================
    # LOAD METRICS
    # =========================================================

    tss: Mapped[float | None] = mapped_column(Float, nullable=True)
    rtss: Mapped[float | None] = mapped_column(Float, nullable=True)
    stss: Mapped[float | None] = mapped_column(Float, nullable=True)

    total_load: Mapped[float | None] = mapped_column(Float, nullable=True)

    # =========================================================
    # DATA QUALITY
    # =========================================================

    source_count: Mapped[int] = mapped_column(default=1)
    data_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # =========================================================
    # META
    # =========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
