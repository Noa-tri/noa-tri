from __future__ import annotations

from typing import Any, Dict, List


class TrainingWeekGenerator:
    """
    Generates a NOA weekly structure based on phase and target weekly load.

    Weekly template defined by NOA coaching logic:
    - Monday: long continuous swim
    - Tuesday: bike FTP / threshold
    - Wednesday: swim VO2 + run VO2
    - Thursday: bike sprint / VO2
    - Friday: swim threshold + run tempo activation
    - Saturday: long bike endurance / tempo resistance
    - Sunday: long run endurance / tempo resistance
    """

    def generate_week(
        self,
        phase: str,
        weekly_tss_target: float,
        athlete_profile: Dict[str, Any],
    ) -> Dict[str, Any]:
        distribution = self._phase_distribution(phase)
        sessions = []

        for item in distribution:
            day_tss = round(weekly_tss_target * item["tss_pct"], 1)

            sessions.append(
                {
                    "day": item["day"],
                    "discipline": item["discipline"],
                    "session_type": item["session_type"],
                    "focus": item["focus"],
                    "intensity_zone": item["intensity_zone"],
                    "objective": item["objective"],
                    "target_tss": day_tss,
                    "estimated_duration_min": self._estimate_duration_minutes(
                        target_tss=day_tss,
                        intensity_factor=item["if_hint"],
                    ),
                    "if_hint": item["if_hint"],
                }
            )

        return {
            "phase": phase,
            "weekly_tss_target": round(weekly_tss_target, 1),
            "athlete_profile_status": athlete_profile.get("profile_status"),
            "sessions": sessions,
        }

    def _phase_distribution(self, phase: str) -> List[Dict[str, Any]]:
        base_template = [
            {
                "day": "monday",
                "discipline": "swim",
                "session_type": "endurance_continuous",
                "focus": "aerobic_base",
                "intensity_zone": "z2",
                "objective": "long continuous swim",
                "tss_pct": 0.10,
                "if_hint": 0.65,
            },
            {
                "day": "tuesday",
                "discipline": "bike",
                "session_type": "ftp_threshold",
                "focus": "functional_threshold",
                "intensity_zone": "z4",
                "objective": "ftp / threshold intervals",
                "tss_pct": 0.16,
                "if_hint": 0.85,
            },
            {
                "day": "wednesday_am",
                "discipline": "swim",
                "session_type": "vo2_intervals",
                "focus": "vo2_development",
                "intensity_zone": "z5",
                "objective": "swim intervals at high aerobic intensity",
                "tss_pct": 0.10,
                "if_hint": 0.88,
            },
            {
                "day": "wednesday_pm",
                "discipline": "run",
                "session_type": "vo2_intervals",
                "focus": "run_vo2",
                "intensity_zone": "z5",
                "objective": "fartlek / interval / fractured VO2 work",
                "tss_pct": 0.12,
                "if_hint": 0.90,
            },
            {
                "day": "thursday",
                "discipline": "bike",
                "session_type": "sprint_vo2",
                "focus": "neuromuscular_power",
                "intensity_zone": "z5-z6",
                "objective": "bike sprint or VO2 session",
                "tss_pct": 0.12,
                "if_hint": 0.92,
            },
            {
                "day": "friday_am",
                "discipline": "swim",
                "session_type": "threshold",
                "focus": "swim_threshold",
                "intensity_zone": "z4",
                "objective": "threshold swim at ~80% VO2",
                "tss_pct": 0.08,
                "if_hint": 0.82,
            },
            {
                "day": "friday_pm",
                "discipline": "run",
                "session_type": "tempo_activation",
                "focus": "tempo_with_activation_peaks",
                "intensity_zone": "z3-z4",
                "objective": "tempo with activation peaks",
                "tss_pct": 0.10,
                "if_hint": 0.80,
            },
            {
                "day": "saturday",
                "discipline": "bike",
                "session_type": "long_endurance",
                "focus": "tempo_resistance",
                "intensity_zone": "z2-z3",
                "objective": "long bike at 60-70% VO2",
                "tss_pct": 0.14,
                "if_hint": 0.72,
            },
            {
                "day": "sunday",
                "discipline": "run",
                "session_type": "long_run",
                "focus": "endurance_resistance",
                "intensity_zone": "z2-z3",
                "objective": "long run tempo resistance",
                "tss_pct": 0.08,
                "if_hint": 0.68,
            },
        ]

        if phase == "base":
            return self._apply_scaling(base_template, endurance_bias=1.10, intensity_bias=0.90)

        if phase == "build":
            return self._apply_scaling(base_template, endurance_bias=1.00, intensity_bias=1.00)

        if phase == "specific":
            return self._apply_scaling(base_template, endurance_bias=0.95, intensity_bias=1.10)

        if phase == "taper":
            taper = self._apply_scaling(base_template, endurance_bias=0.60, intensity_bias=0.85)
            return taper

        return base_template

    def _apply_scaling(
        self,
        template: List[Dict[str, Any]],
        endurance_bias: float,
        intensity_bias: float,
    ) -> List[Dict[str, Any]]:
        adjusted: List[Dict[str, Any]] = []

        for item in template:
            scaled = dict(item)

            if item["intensity_zone"] in {"z2", "z2-z3"}:
                scaled["tss_pct"] = item["tss_pct"] * endurance_bias
            else:
                scaled["tss_pct"] = item["tss_pct"] * intensity_bias

            adjusted.append(scaled)

        total = sum(x["tss_pct"] for x in adjusted)
        for item in adjusted:
            item["tss_pct"] = item["tss_pct"] / total

        return adjusted

    @staticmethod
    def _estimate_duration_minutes(target_tss: float, intensity_factor: float) -> int:
        if intensity_factor <= 0:
            return 60

        # Approximation:
        # TSS ≈ hours * IF² * 100
        hours = target_tss / ((intensity_factor ** 2) * 100.0)
        minutes = int(round(hours * 60.0))
        return max(minutes, 20)
