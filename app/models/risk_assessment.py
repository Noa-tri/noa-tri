import uuid
from sqlalchemy import Date, Float, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("athletes.id", ondelete="CASCADE")
    )

    day: Mapped[str] = mapped_column(Date)

    risk_level: Mapped[str] = mapped_column(String(16))

    risk_score: Mapped[float] = mapped_column(Float)

    hrv_zscore: Mapped[float | None] = mapped_column(Float)

    atl_ctl_ratio: Mapped[float | None] = mapped_column(Float)

    tsb: Mapped[float | None] = mapped_column(Float)
