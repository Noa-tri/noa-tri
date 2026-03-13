import uuid
from sqlalchemy import Date, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class DailyBiomarker(Base):
    __tablename__ = "daily_biomarkers"

    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("athletes.id", ondelete="CASCADE"), primary_key=True
    )

    day: Mapped[str] = mapped_column(Date, primary_key=True)

    hrv_rmssd_ms: Mapped[float | None] = mapped_column(Float)

    hrv_lnrmssd: Mapped[float | None] = mapped_column(Float)

    resting_hr: Mapped[int | None] = mapped_column(Integer)

    sleep_score: Mapped[float | None] = mapped_column(Float)

    body_battery: Mapped[float | None] = mapped_column(Float)
