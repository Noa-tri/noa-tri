from datetime import date
from typing import Dict, Any, List

from app.services.race_planning import RacePlanningEngine
from app.services.week_generator import TrainingWeekGenerator


class TrainingPlanBuilder:
    """
    High level orchestration engine.

    Combines:
    - Athlete profile
    - Race planning
    - Weekly session generator
    """

    def __init__(self):

        self.race_engine = RacePlanningEngine()
        self.week_generator = TrainingWeekGenerator()

    def build_training_plan(
        self,
        athlete_profile: Dict[str, Any],
        race_date: date,
        today: date,
    ) -> Dict[str, Any]:

        current_ctl = athlete_profile.get("ctl_current") or 35
        weekly_tss = athlete_profile.get("weekly_tss_avg") or 300

        race_plan = self.race_engine.build_race_plan(
            race_date=race_date,
            today=today,
            current_ctl=current_ctl,
            weekly_tss=weekly_tss,
        )

        weeks: List[Dict[str, Any]] = []

        for week in race_plan["ctl_projection"]:

            phase = week["phase"]
            tss = week.get("weekly_tss_target", weekly_tss)

            week_plan = self.week_generator.generate_week(
                phase=phase,
                weekly_tss_target=tss,
                athlete_profile=athlete_profile,
            )

            weeks.append(
                {
                    "week": week["week"],
                    "phase": phase,
                    "target_ctl": week["projected_ctl"],
                    "week_structure": week_plan,
                }
            )

        return {
            "weeks_to_race": race_plan["weeks_to_race"],
            "training_weeks": weeks,
        }
