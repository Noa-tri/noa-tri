from __future__ import annotations

import uuid
from datetime import datetime, date

from sqlalchemy import Date, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AthletePerformanceModel(Base):
    __tablename__ = "athlete_performance_models"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("athletes.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # =========================================================
    # MODEL INFO
    # =========================================================

    model_type: Mapped[str] = mapped_column(
        String(32),
        default="nlss",
        nullable=False,
        index=True,
    )

    sport: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
    )

    # =========================================================
    # NLSS PARAMETERS
    # =========================================================

    k1: Mapped[float | None] = mapped_column(Float, nullable=True)
    k2: Mapped[float | None] = mapped_column(Float, nullable=True)

    t1: Mapped[float | None] = mapped_column(Float, nullable=True)
    t2: Mapped[float | None] = mapped_column(Float, nullable=True)

    # =========================================================
    # FIT QUALITY
    # =========================================================

    fit_error: Mapped[float | None] = mapped_column(Float, nullable=True)
    data_points: Mapped[int | None] = mapped_column(nullable=True)

    # =========================================================
    # WINDOW
    # =========================================================

    window_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    window_end: Mapped[date | None] = mapped_column(Date, nullable=True)

    # =========================================================
    # META
    # =========================================================

    calibration_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
