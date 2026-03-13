from app.engines.noa_engine import NoaPerformanceEngine


def test_compute_hrv_metrics():
    engine = NoaPerformanceEngine()
    rr = [800, 810, 790, 805, 795, 800, 808]
    result = engine.compute_hrv_metrics(rr)

    assert result["rmssd"] is not None
    assert result["lnrmssd"] is not None
    assert len(result["cleaned_rr_ms"]) > 0


def test_compute_pmc_series():
    engine = NoaPerformanceEngine()
    days = ["2026-03-01", "2026-03-02", "2026-03-03"]
    tss = [50.0, 70.0, 40.0]

    result = engine.compute_pmc_series(days, tss)

    assert len(result) == 3
    assert result[0].day == "2026-03-01"
