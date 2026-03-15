from fastapi import FastAPI
from sqlalchemy import text

from app.api.routes.analytics import router as analytics_router
from app.api.routes.athletes import router as athletes_router
from app.api.routes.biomarkers import router as biomarkers_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.risk import router as risk_router
from app.api.routes.sessions import router as sessions_router
from app.api.routes.telemetry import router as telemetry_router

from app.core.config import settings
from app.core.db import engine

from app.models.base import Base
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

app.include_router(athletes_router, prefix=settings.API_V1_PREFIX)
app.include_router(sessions_router, prefix=settings.API_V1_PREFIX)
app.include_router(biomarkers_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(risk_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(telemetry_router, prefix=settings.API_V1_PREFIX)


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
