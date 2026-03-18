from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PerformanceTestSport(str, enum.Enum):
    swim = "swim"
    bike = "bike"
    run = "run"
    triathlon = "triathlon"
    other = "other"


class PerformanceTestType(str, enum.Enum):
    ftp_20m = "ftp_20m"
    ftp_ramp = "ftp_ramp"
    cp_test = "cp_test"
    run_5k = "run_5k"
    run_10k = "run_10k"
    threshold_run = "threshold_run"
    css_swim = "css_swim"
    race_result = "race_result"
    custom = "custom"


class PerformanceTestMetric(str, enum.Enum):
    power_w = "power_w"
    pace_sec_per_km = "pace_sec_per_km"
    speed_mps = "speed_mps"
    time_sec = "time_sec"
    distance_m = "distance_m"
    heart_rate_bpm = "heart_rate_bpm"
    score = "score"


class PerformanceTestSource(str, enum.Enum):
    coach = "coach"
    athlete = "athlete"
    garmin = "garmin"
    imported = "imported"
    system = "system"


class PerformanceTest(Base):
    __tablename__ = "performance_tests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("athletes.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    sport: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=PerformanceTestSport.other.value,
    )

    test_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default=PerformanceTestType.custom.value,
        index=True,
    )

    metric_name: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default=PerformanceTestMetric.score.value,
    )

    metric_value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    duration_sec: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_m: Mapped[float | None] = mapped_column(Float, nullable=True)

    performed_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    source: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=PerformanceTestSource.coach.value,
    )

    validated: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
