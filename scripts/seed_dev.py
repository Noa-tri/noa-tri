import uuid
from datetime import datetime

from app.core.db import SessionLocal
from app.models.organization import Organization
from app.models.athlete import Athlete


def seed():
    db = SessionLocal()

    org_id = uuid.UUID("11111111-1111-1111-1111-111111111111")

    org = db.query(Organization).filter(Organization.id == org_id).first()

    if not org:
        org = Organization(
            id=org_id,
            name="NOA Org",
            slug="noa-org",
            country_code="AR",
            timezone="UTC",
            created_at=datetime.utcnow(),
        )
        db.add(org)
        db.commit()

    athlete = db.query(Athlete).first()

    if not athlete:
        athlete = Athlete(
            organization_id=org_id,
            first_name="Juan",
            last_name="Perez",
            weight_kg=70,
            height_cm=175,
            ftp_watts=280,
            threshold_hr=172,
            vo2max=58,
        )

        db.add(athlete)
        db.commit()

    print("Datos de prueba creados correctamente")


if __name__ == "__main__":
    seed()
