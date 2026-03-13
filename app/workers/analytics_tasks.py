from app.engines.noa_engine import NoaPerformanceEngine
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.analytics_tasks.compute_pmc")
def compute_pmc(day_labels: list[str], daily_tss: list[float]) -> list[dict]:
    engine = NoaPerformanceEngine()
    series = engine.compute_pmc_series(day_labels=day_labels, daily_tss=daily_tss)
    return [
        {
            "day": item.day,
            "daily_tss": item.daily_tss,
            "ctl": item.ctl,
            "atl": item.atl,
            "tsb": item.tsb,
        }
        for item in series
    ]
