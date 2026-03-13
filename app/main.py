from fastapi import FastAPI

from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.APP_DEBUG,
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/")
def root() -> dict:
    return {
        "name": settings.APP_NAME,
        "env": settings.APP_ENV,
        "api_prefix": settings.API_V1_PREFIX,
    }
