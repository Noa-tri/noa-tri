from fastapi import FastAPI
from sqlalchemy import text

from app.core.config import settings
from app.core.db import engine
from app.models.base import Base

# Importa todos los modelos para que SQLAlchemy los registre
from app.models.organization import Organization
from app.models.user import User
from app.models.athlete import Athlete
from app.models.training_session import TrainingSession
from app.models.daily_biomarker import DailyBiomarker
from app.models.pmc_metric import PMCMetric
from app.models.risk_assessment import RiskAssessment


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.APP_DEBUG,
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict:
    db_ok = False

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "ok" if db_ok else "degraded",
        "app": settings.APP_NAME,
        "database": "connected" if db_ok else "disconnected",
    }


@app.get("/")
def root() -> dict:
    return {
        "name": settings.APP_NAME,
        "env": settings.APP_ENV,
        "debug": settings.APP_DEBUG,
        "api_prefix": settings.API_V1_PREFIX,
    }
