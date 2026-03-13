import uuid
from sqlalchemy import String, DateTime, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.models.base import Base


class Athlete(Base):
    __tablename__ = "athletes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE")
    )

    first_name: Mapped[str] = mapped_column(String(120))
    last_name: Mapped[str] = mapped_column(String(120))

    weight_kg: Mapped[float | None] = mapped_column(Float)
    height_cm: Mapped[float | None] = mapped_column(Float)

    ftp_watts: Mapped[int | None] = mapped_column(Integer)
    threshold_hr: Mapped[int | None] = mapped_column(Integer)

    vo2max: Mapped[float | None] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
