class DailyLoadService:
    def __init__(self, db=None):
        self.db = db

    def calculate(self, *args, **kwargs):
        return []

    def get_daily_loads(self, *args, **kwargs):
        return []

    def sync_daily_loads(self, *args, **kwargs):
        return {"status": "ok", "message": "daily load service stub active"}
