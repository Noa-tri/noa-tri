from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SyncProvider(str, enum.Enum):
    garmin = "garmin"


class SyncStatus(str, enum.Enum):
    idle = "idle"
    running = "running"
    success = "success"
    failed = "failed"


class AthleteSyncState(Base):
    __tablename__ = "athlete_sync_states"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("athletes.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )

    provider: Mapped[str] = mapped_column(
        Enum(SyncProvider, name="sync_provider"),
        default=SyncProvider.garmin,
    )

    status: Mapped[str] = mapped_column(
        Enum(SyncStatus, name="sync_status"),
        default=SyncStatus.idle,
    )

    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_activity_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_error: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    consecutive_failures: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
