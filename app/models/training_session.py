import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SessionSport(str, PyEnum):
    triathlon = "triathlon"
    swim = "swim"
    bike = "bike"
    run = "run"
    strength = "strength"
    mobility = "mobility"
    other = "other"


class SessionSource(str, PyEnum):
    garmin_api = "garmin_api"
    fit_import = "fit_import"
    manual = "manual"


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("athletes.id", ondelete="CASCADE"),
        nullable=False,
    )

    source: Mapped[SessionSource] = mapped_column(
        Enum(
            SessionSource,
            name="session_source",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        default=SessionSource.manual,
    )

    sport: Mapped[SessionSport] = mapped_column(
        Enum(
            SessionSport,
            name="session_sport",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
    )

    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_sec: Mapped[int] = mapped_column(Integer, nullable=False)

    distance_m: Mapped[float | None] = mapped_column(Float, nullable=True)

    avg_hr: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_hr: Mapped[int | None] = mapped_column(Integer, nullable=True)

    avg_power_w: Mapped[int | None] = mapped_column(Integer, nullable=True)
    normalized_power_w: Mapped[float | None] = mapped_column(Float, nullable=True)

    intensity_factor: Mapped[float | None] = mapped_column(Float, nullable=True)
    tss: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
