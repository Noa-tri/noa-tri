from __future__ import annotations

from dataclasses import dataclass
from math import log
from typing import Any, Dict, List, Optional, Sequence, Tuple

import statistics


@dataclass(frozen=True)
class HRVBaseline:
    mean_rmssd: float
    std_rmssd: float
    mean_lnrmssd: float
    std_lnrmssd: float
    window_size: int


@dataclass(frozen=True)
class PMCPoint:
    day: str
    daily_tss: float
    ctl: float
    atl: float
    tsb: float


@dataclass(frozen=True)
class RiskAssessment:
    risk_level: str
    risk_score: float
    hrv_zscore: float
    atl_ctl_ratio: float
    tsb: float
    hrv_persistence_days: int
    sleep_penalty: float
    rationale: Dict[str, Any]


class NoaPerformanceEngine:
    """
    Core analytical engine for NOA TRI.

    Responsibilities:
    - PMC computation (CTL, ATL, TSB) using EWMA.
    - RR interval cleaning and RMSSD / lnRMSSD computation.
    - 21-day rolling HRV baseline derivation.
    - HRV anomaly detection against baseline.
    - Multivariable physiological risk scoring.
    """

    DEFAULT_CTL_DAYS: int = 42
    DEFAULT_ATL_DAYS: int = 7
    DEFAULT_HRV_BASELINE_WINDOW: int = 21

    def __init__(
        self,
        ctl_days: int = DEFAULT_CTL_DAYS,
        atl_days: int = DEFAULT_ATL_DAYS,
        hrv_baseline_window: int = DEFAULT_HRV_BASELINE_WINDOW,
    ) -> None:
        if ctl_days <= 0:
            raise ValueError("ctl_days must be > 0.")
        if atl_days <= 0:
            raise ValueError("atl_days must be > 0.")
        if hrv_baseline_window <= 1:
            raise ValueError("hrv_baseline_window must be > 1.")

        self.ctl_days = ctl_days
        self.atl_days = atl_days
        self.hrv_baseline_window = hrv_baseline_window

    # =========================================================
    # PMC / LOAD MODEL
    # =========================================================

    @staticmethod
    def _ewma(values: Sequence[float], time_constant_days: int) -> List[float]:
        """
        Exponential weighted moving average using classical PMC formulation:
            EWMA_today = EWMA_yesterday + alpha * (load_today - EWMA_yesterday)
        where alpha = 1 / time_constant_days
        """
        if not values:
            return []

        alpha = 1.0 / float(time_constant_days)
        out: List[float] = [float(values[0])]

        for value in values[1:]:
            prev = out[-1]
            current = prev + alpha * (float(value) - prev)
            out.append(current)

        return out

    def compute_ctl(self, daily_tss: Sequence[float]) -> List[float]:
        return self._ewma(daily_tss, self.ctl_days)

    def compute_atl(self, daily_tss: Sequence[float]) -> List[float]:
        return self._ewma(daily_tss, self.atl_days)

    @staticmethod
    def compute_tsb(ctl: Sequence[float], atl: Sequence[float]) -> List[float]:
        if len(ctl) != len(atl):
            raise ValueError("CTL and ATL series must have equal length.")
        return [float(c) - float(a) for c, a in zip(ctl, atl)]

    def compute_pmc_series(
        self,
        day_labels: Sequence[str],
        daily_tss: Sequence[float],
    ) -> List[PMCPoint]:
        if len(day_labels) != len(daily_tss):
            raise ValueError("day_labels and daily_tss must have equal length.")

        ctl = self.compute_ctl(daily_tss)
        atl = self.compute_atl(daily_tss)
        tsb = self.compute_tsb(ctl, atl)

        return [
            PMCPoint(
                day=day,
                daily_tss=float(tss),
                ctl=round(c, 3),
                atl=round(a, 3),
                tsb=round(b, 3),
            )
            for day, tss, c, a, b in zip(day_labels, daily_tss, ctl, atl, tsb)
        ]

    # =========================================================
    # RR CLEANING / HRV
    # =========================================================

    @staticmethod
    def clean_rr_intervals(
        rr_ms: Sequence[int],
        min_rr_ms: int = 300,
        max_rr_ms: int = 2000,
        relative_jump_threshold: float = 0.20,
    ) -> Tuple[List[int], Dict[str, Any]]:
        """
        RR cleaning pipeline:
        1. Physiological plausibility filter.
        2. Relative jump filter to suppress artifacts / ectopic-like beats.
        3. Exclusion-based cleaning.

        Returns retained RR values only.
        """
        if min_rr_ms <= 0 or max_rr_ms <= min_rr_ms:
            raise ValueError("Invalid RR bounds.")
        if relative_jump_threshold <= 0:
            raise ValueError("relative_jump_threshold must be > 0.")

        if not rr_ms:
            return [], {
                "input_count": 0,
                "retained_count": 0,
                "removed_count": 0,
                "retention_ratio": 0.0,
            }

        plausible = [int(x) for x in rr_ms if min_rr_ms <= int(x) <= max_rr_ms]

        if len(plausible) < 2:
            return [], {
                "input_count": len(rr_ms),
                "retained_count": 0,
                "removed_count": len(rr_ms),
                "retention_ratio": 0.0,
            }

        cleaned: List[int] = [plausible[0]]
        removed = len(rr_ms) - len(plausible)

        for current in plausible[1:]:
            prev = cleaned[-1]
            relative_jump = abs(current - prev) / max(prev, 1)

            if relative_jump <= relative_jump_threshold:
                cleaned.append(current)
            else:
                removed += 1

        retention_ratio = len(cleaned) / max(len(rr_ms), 1)

        return cleaned, {
            "input_count": len(rr_ms),
            "retained_count": len(cleaned),
            "removed_count": removed,
            "retention_ratio": round(retention_ratio, 4),
        }

    @staticmethod
    def compute_rmssd(rr_ms: Sequence[int]) -> Optional[float]:
        """
        RMSSD from cleaned NN intervals.
        """
        if len(rr_ms) < 2:
            return None

        diffs_sq: List[int] = []

        for i in range(1, len(rr_ms)):
            diff = rr_ms[i] - rr_ms[i - 1]
            diffs_sq.append(diff * diff)

        if not diffs_sq:
            return None

        mean_sq = sum(diffs_sq) / len(diffs_sq)
        return mean_sq ** 0.5

    @staticmethod
    def compute_lnrmssd(rmssd: Optional[float]) -> Optional[float]:
        if rmssd is None or rmssd <= 0:
            return None
        return log(rmssd)

    def compute_hrv_metrics(
        self,
        rr_ms: Sequence[int],
    ) -> Dict[str, Any]:
        """
        End-to-end HRV derivation from RR intervals.
        """
        cleaned_rr, cleaning_stats = self.clean_rr_intervals(rr_ms)
        rmssd = self.compute_rmssd(cleaned_rr)
        lnrmssd = self.compute_lnrmssd(rmssd)

        return {
            "cleaned_rr_ms": cleaned_rr,
            "rmssd": round(rmssd, 5) if rmssd is not None else None,
            "lnrmssd": round(lnrmssd, 5) if lnrmssd is not None else None,
            "quality": cleaning_stats,
        }

    # =========================================================
    # HRV BASELINE / ANOMALY
    # =========================================================

    @staticmethod
    def _safe_std(values: Sequence[float]) -> float:
        if len(values) < 2:
            return 0.0
        return statistics.stdev(values)

    def compute_hrv_baseline(
        self,
        historical_rmssd: Sequence[float],
    ) -> HRVBaseline:
        """
        Baseline derived from the most recent N valid daily RMSSD values.
        """
        valid = [float(v) for v in historical_rmssd if v is not None and float(v) > 0]

        if len(valid) < self.hrv_baseline_window:
            raise ValueError(
                f"At least {self.hrv_baseline_window} valid RMSSD samples are required."
            )

        window = valid[-self.hrv_baseline_window :]
        ln_window = [log(v) for v in window]

        return HRVBaseline(
            mean_rmssd=statistics.mean(window),
            std_rmssd=self._safe_std(window),
            mean_lnrmssd=statistics.mean(ln_window),
            std_lnrmssd=self._safe_std(ln_window),
            window_size=len(window),
        )

    @staticmethod
    def compute_hrv_zscore(
        current_rmssd: float,
        baseline_mean_rmssd: float,
        baseline_std_rmssd: float,
    ) -> float:
        if baseline_std_rmssd <= 0:
            return 0.0
        return (float(current_rmssd) - float(baseline_mean_rmssd)) / float(baseline_std_rmssd)

    def detect_hrv_anomaly(
        self,
        current_rmssd: float,
        baseline: HRVBaseline,
        moderate_threshold_sd: float = -1.0,
        high_threshold_sd: float = -1.5,
    ) -> Dict[str, Any]:
        z = self.compute_hrv_zscore(
            current_rmssd=current_rmssd,
            baseline_mean_rmssd=baseline.mean_rmssd,
            baseline_std_rmssd=baseline.std_rmssd,
        )

        if z <= high_threshold_sd:
            status = "high"
        elif z <= moderate_threshold_sd:
            status = "moderate"
        else:
            status = "normal"

        return {
            "status": status,
            "zscore": round(z, 4),
            "baseline_mean_rmssd": round(baseline.mean_rmssd, 4),
            "baseline_std_rmssd": round(baseline.std_rmssd, 4),
        }

    @staticmethod
    def count_consecutive_below_baseline(
        recent_rmssd: Sequence[float],
        baseline_mean_rmssd: float,
        baseline_std_rmssd: float,
        threshold_sd: float = -1.5,
    ) -> int:
        if baseline_std_rmssd <= 0:
            return 0

        valid = [float(v) for v in recent_rmssd if v is not None and float(v) > 0]
        if not valid:
            return 0

        count = 0
        threshold_value = baseline_mean_rmssd + (threshold_sd * baseline_std_rmssd)

        for value in reversed(valid):
            if value < threshold_value:
                count += 1
            else:
                break

        return count

    # =========================================================
    # RISK MODEL
    # =========================================================

    @staticmethod
    def _bounded_score(value: float, low: float = 0.0, high: float = 100.0) -> float:
        return max(low, min(high, value))

    @staticmethod
    def _compute_atl_ctl_ratio(atl: float, ctl: float) -> float:
        if ctl <= 0:
            return 999.0
        return float(atl / ctl)

    def compute_risk_score(
        self,
        current_rmssd: float,
        baseline: HRVBaseline,
        ctl: float,
        atl: float,
        tsb: float,
        recent_rmssd: Sequence[float],
        sleep_score: Optional[float] = None,
        body_battery: Optional[float] = None,
    ) -> RiskAssessment:
        """
        Multivariable physiological risk scoring for NOA.

        Logic:
        - HRV deviation drives the primary signal.
        - ATL/CTL reflects acute overload pressure.
        - TSB reflects freshness / accumulated strain.
        - Persistence prevents overreacting to isolated noise.
        - Sleep / recovery modulates final risk.
        """
        if ctl < 0 or atl < 0:
            raise ValueError("CTL and ATL must be non-negative.")

        anomaly = self.detect_hrv_anomaly(current_rmssd, baseline)
        z = float(anomaly["zscore"])
        atl_ctl_ratio = self._compute_atl_ctl_ratio(atl=atl, ctl=ctl)

        persistence_days = self.count_consecutive_below_baseline(
            recent_rmssd=recent_rmssd,
            baseline_mean_rmssd=baseline.mean_rmssd,
            baseline_std_rmssd=baseline.std_rmssd,
            threshold_sd=-1.5,
        )

        score = 0.0

        # HRV contribution
        if z <= -2.0:
            score += 40.0
        elif z <= -1.5:
            score += 30.0
        elif z <= -1.0:
            score += 18.0
        else:
            score += 4.0

        # Acute/chronic load contribution
        if atl_ctl_ratio >= 1.30:
            score += 25.0
        elif atl_ctl_ratio >= 1.15:
            score += 18.0
        elif atl_ctl_ratio >= 1.00:
            score += 10.0
        else:
            score += 2.0

        # TSB contribution
        if tsb <= -25:
            score += 18.0
        elif tsb <= -15:
            score += 12.0
        elif tsb <= -5:
            score += 6.0

        # Persistence contribution
        if persistence_days >= 3:
            score += 15.0
        elif persistence_days == 2:
            score += 10.0
        elif persistence_days == 1:
            score += 4.0

        # Recovery modulation
        sleep_penalty = 0.0

        if sleep_score is not None:
            if sleep_score < 50:
                sleep_penalty += 10.0
            elif sleep_score < 65:
                sleep_penalty += 5.0

        if body_battery is not None:
            if body_battery < 25:
                sleep_penalty += 8.0
            elif body_battery < 40:
                sleep_penalty += 4.0

        score += sleep_penalty
        score = self._bounded_score(score)

        if score >= 70:
            risk_level = "high"
        elif score >= 40:
            risk_level = "moderate"
        else:
            risk_level = "low"

        rationale = {
            "hrv_status": anomaly["status"],
            "hrv_zscore": round(z, 4),
            "atl_ctl_ratio": round(atl_ctl_ratio, 4) if atl_ctl_ratio != 999.0 else None,
            "tsb": round(tsb, 3),
            "persistence_days": persistence_days,
            "sleep_score": sleep_score,
            "body_battery": body_battery,
            "baseline_mean_rmssd": round(baseline.mean_rmssd, 4),
            "baseline_std_rmssd": round(baseline.std_rmssd, 4),
        }

        return RiskAssessment(
            risk_level=risk_level,
            risk_score=round(score, 2),
            hrv_zscore=round(z, 4),
            atl_ctl_ratio=round(atl_ctl_ratio, 4),
            tsb=round(tsb, 3),
            hrv_persistence_days=persistence_days,
            sleep_penalty=round(sleep_penalty, 2),
            rationale=rationale,
        )

    # =========================================================
    # UTILITY
    # =========================================================

    @staticmethod
    def estimate_tss_from_power(
        duration_sec: int,
        normalized_power_w: float,
        ftp_watts: float,
    ) -> float:
        """
        Power-based TSS:
            TSS = (sec * NP * IF) / (FTP * 3600) * 100
            IF = NP / FTP
        """
        if duration_sec <= 0:
            raise ValueError("duration_sec must be > 0.")
        if normalized_power_w <= 0:
            raise ValueError("normalized_power_w must be > 0.")
        if ftp_watts <= 0:
            raise ValueError("ftp_watts must be > 0.")

        intensity_factor = normalized_power_w / ftp_watts
        tss = (duration_sec * normalized_power_w * intensity_factor) / (ftp_watts * 3600.0) * 100.0
        return round(tss, 2)

    @staticmethod
    def estimate_tss_from_hr(
        duration_sec: int,
        avg_hr: float,
        threshold_hr: float,
        scaling_factor: float = 100.0,
    ) -> float:
        """
        HR proxy load when power is unavailable.
        This should be tagged as inferred load.
        """
        if duration_sec <= 0:
            raise ValueError("duration_sec must be > 0.")
        if avg_hr <= 0:
            raise ValueError("avg_hr must be > 0.")
        if threshold_hr <= 0:
            raise ValueError("threshold_hr must be > 0.")
        if scaling_factor <= 0:
            raise ValueError("scaling_factor must be > 0.")

        intensity_factor = avg_hr / threshold_hr
        hours = duration_sec / 3600.0
        tss = hours * (intensity_factor ** 2) * scaling_factor
        return round(tss, 2)
