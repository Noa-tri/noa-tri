from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class TrainingPlan(Base):

    __tablename__ = "training_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    athlete_id = Column(UUID(as_uuid=True), ForeignKey("athletes.id"), nullable=False)

    sport = Column(String, nullable=False)

    planned_date = Column(DateTime, nullable=False)

    planned_duration_sec = Column(Float, nullable=True)

    planned_distance_m = Column(Float, nullable=True)

    planned_intensity_factor = Column(Float, nullable=True)

    planned_tss = Column(Float, nullable=True)

    coach_notes = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    athlete = relationship("Athlete")
