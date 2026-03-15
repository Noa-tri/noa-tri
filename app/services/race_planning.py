from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class RacePhase:
    phase: str
    weeks: int
    target_ctl_increase: float
    weekly_tss: float


class RacePlanningEngine:
    """
    Generates macrocycle training structure
    from athlete current CTL to race date.
    """

    MAX_CTL_RAMP = 6.0
    SAFE_CTL_RAMP = 4.0

    def __init__(self):
        pass

    def build_race_plan(
        self,
        race_date: date,
        today: date,
        current_ctl: float,
        weekly_tss: float,
    ) -> Dict:

        weeks_to_race = (race_date - today).days // 7

        if weeks_to_race <= 4:
            return self._short_plan(current_ctl, weekly_tss)

        base_weeks = int(weeks_to_race * 0.4)
        build_weeks = int(weeks_to_race * 0.35)
        specific_weeks = int(weeks_to_race * 0.15)
        taper_weeks = weeks_to_race - base_weeks - build_weeks - specific_weeks

        phases = [
            RacePhase(
                phase="base",
                weeks=base_weeks,
                target_ctl_increase=self.SAFE_CTL_RAMP,
                weekly_tss=weekly_tss * 1.05,
            ),
            RacePhase(
                phase="build",
                weeks=build_weeks,
                target_ctl_increase=self.MAX_CTL_RAMP,
                weekly_tss=weekly_tss * 1.10,
            ),
            RacePhase(
                phase="specific",
                weeks=specific_weeks,
                target_ctl_increase=self.SAFE_CTL_RAMP,
                weekly_tss=weekly_tss * 1.05,
            ),
            RacePhase(
                phase="taper",
                weeks=taper_weeks,
                target_ctl_increase=-3,
                weekly_tss=weekly_tss * 0.6,
            ),
        ]

        ctl_projection = self._project_ctl(
            current_ctl=current_ctl,
            phases=phases,
        )

        return {
            "weeks_to_race": weeks_to_race,
            "phases": [p.__dict__ for p in phases],
            "ctl_projection": ctl_projection,
        }

    def _project_ctl(
        self,
        current_ctl: float,
        phases: List[RacePhase],
    ) -> List[Dict]:

        ctl = current_ctl
        projection = []

        week = 1

        for phase in phases:

            for _ in range(phase.weeks):

                ctl += phase.target_ctl_increase

                projection.append(
                    {
                        "week": week,
                        "phase": phase.phase,
                        "projected_ctl": round(ctl, 2),
                        "weekly_tss_target": round(phase.weekly_tss, 1),
                    }
                )

                week += 1

        return projection

    def _short_plan(self, ctl: float, weekly_tss: float):

        return {
            "weeks_to_race": 4,
            "phases": [
                {
                    "phase": "mini_build",
                    "weeks": 2,
                    "weekly_tss": weekly_tss * 1.05,
                },
                {
                    "phase": "taper",
                    "weeks": 2,
                    "weekly_tss": weekly_tss * 0.6,
                },
            ],
            "ctl_projection": [
                {"week": 1, "phase": "build", "projected_ctl": ctl + 3},
                {"week": 2, "phase": "build", "projected_ctl": ctl + 6},
                {"week": 3, "phase": "taper", "projected_ctl": ctl + 3},
                {"week": 4, "phase": "race", "projected_ctl": ctl + 2},
            ],
        }
