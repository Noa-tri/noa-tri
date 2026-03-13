from app.engines.noa_engine import NoaPerformanceEngine
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.risk_tasks.compute_hrv_metrics")
def compute_hrv_metrics(rr_ms: list[int]) -> dict:
    engine = NoaPerformanceEngine()
    return engine.compute_hrv_metrics(rr_ms)


@celery_app.task(name="app.workers.risk_tasks.compute_risk")
def compute_risk(
    current_rmssd: float,
    historical_rmssd: list[float],
    ctl: float,
    atl: float,
    tsb: float,
    recent_rmssd: list[float],
    sleep_score: float | None = None,
    body_battery: float | None = None,
) -> dict:
    engine = NoaPerformanceEngine()
    baseline = engine.compute_hrv_baseline(historical_rmssd)
    result = engine.compute_risk_score(
        current_rmssd=current_rmssd,
        baseline=baseline,
        ctl=ctl,
        atl=atl,
        tsb=tsb,
        recent_rmssd=recent_rmssd,
        sleep_score=sleep_score,
        body_battery=body_battery,
    )
    return {
        "risk_level": result.risk_level,
        "risk_score": result.risk_score,
        "hrv_zscore": result.hrv_zscore,
        "atl_ctl_ratio": result.atl_ctl_ratio,
        "tsb": result.tsb,
        "hrv_persistence_days": result.hrv_persistence_days,
        "sleep_penalty": result.sleep_penalty,
        "rationale": result.rationale,
    }
