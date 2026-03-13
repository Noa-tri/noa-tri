import uuid
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.models.base import Base


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("athletes.id", ondelete="CASCADE")
    )

    sport: Mapped[str] = mapped_column(String(32))

    start_time: Mapped[datetime] = mapped_column(DateTime)
    duration_sec: Mapped[int] = mapped_column(Integer)

    distance_m: Mapped[float | None] = mapped_column(Float)

    avg_hr: Mapped[int | None] = mapped_column(Integer)
    max_hr: Mapped[int | None] = mapped_column(Integer)

    avg_power_w: Mapped[int | None] = mapped_column(Integer)

    normalized_power_w: Mapped[float | None] = mapped_column(Float)

    intensity_factor: Mapped[float | None] = mapped_column(Float)

    tss: Mapped[float | None] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
