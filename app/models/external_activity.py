from __future__ import annotations

import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Enum,
    JSON,
    UniqueConstraint,
    ForeignKey,
    Text,
)
from sqlalchemy.sql import func

from app.db.base import Base


class ExternalActivityStatus(str, enum.Enum):
    DISCOVERED = "discovered"
    DOWNLOADED = "downloaded"
    PROCESSED = "processed"
    FAILED = "failed"


class ExternalActivity(Base):
    __tablename__ = "external_activities"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False, index=True)
    external_activity_id = Column(String(255), nullable=False, index=True)

    activity_name = Column(String(255), nullable=True)
    sport_type = Column(String(100), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    status = Column(Enum(ExternalActivityStatus), nullable=False, default=ExternalActivityStatus.DISCOVERED)
    last_error = Column(Text, nullable=True)
    raw_payload = Column(JSON, nullable=True)

    internal_session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "athlete_id",
            "provider",
            "external_activity_id",
            name="uq_external_activity_provider_id",
        ),
    )
