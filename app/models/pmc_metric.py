import uuid
from sqlalchemy import Date, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PMCMetric(Base):
    __tablename__ = "pmc_metrics"

    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("athletes.id", ondelete="CASCADE"), primary_key=True
    )

    day: Mapped[str] = mapped_column(Date, primary_key=True)

    daily_tss: Mapped[float] = mapped_column(Float)

    ctl: Mapped[float] = mapped_column(Float)

    atl: Mapped[float] = mapped_column(Float)

    tsb: Mapped[float] = mapped_column(Float)
