from __future__ import annotations

from datetime import date, timedelta
from typing import Dict, List, Optional

import requests


class GarminConnector:
    """
    Connector between NOA and Garmin Connect.

    Responsibilities:
    - authenticate
    - list activities
    - download activity FIT files
    """

    BASE_URL = "https://connectapi.garmin.com"

    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token

    # =========================================================
    # AUTH HEADERS
    # =========================================================

    def _headers(self) -> Dict[str, str]:
        if not self.access_token:
            raise ValueError("Garmin access token not configured")

        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    # =========================================================
    # ACTIVITIES
    # =========================================================

    def list_activities(
        self,
        start_date: date,
        end_date: date,
        limit: int = 100,
    ) -> List[Dict]:
        url = f"{self.BASE_URL}/activitylist-service/activities/search/activities"

        params = {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "limit": limit,
        }

        response = requests.get(
            url,
            headers=self._headers(),
            params=params,
            timeout=30,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Garmin API error {response.status_code}: {response.text}"
            )

        return response.json()

    def list_recent_activities(
        self,
        days_back: int = 7,
        limit: int = 100,
    ) -> List[Dict]:
        end_date = date.today()
        start_date = end_date - timedelta(days=days_back)

        return self.list_activities(
            start_date=start_date,
            end_date=end_date,
            limit=limit,
        )

    # =========================================================
    # ACTIVITY DETAILS
    # =========================================================

    def get_activity(self, activity_id: int) -> Dict:
        url = f"{self.BASE_URL}/activity-service/activity/{activity_id}"

        response = requests.get(
            url,
            headers=self._headers(),
            timeout=30,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Garmin activity fetch error {response.status_code}: {response.text}"
            )

        return response.json()

    # =========================================================
    # DOWNLOAD FIT
    # =========================================================

    def download_fit(self, activity_id: int) -> bytes:
        url = f"{self.BASE_URL}/download-service/files/activity/{activity_id}"

        response = requests.get(
            url,
            headers=self._headers(),
            timeout=60,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Garmin FIT download error {response.status_code}: {response.text}"
            )

        return response.content
