from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationResponse

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
) -> Organization:
    existing = db.query(Organization).filter(Organization.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization slug already exists")

    organization = Organization(
        name=payload.name,
        slug=payload.slug,
        country_code=payload.country_code,
        timezone=payload.timezone,
    )
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization


@router.get("/", response_model=list[OrganizationResponse])
def list_organizations(db: Session = Depends(get_db)) -> list[Organization]:
    return db.query(Organization).order_by(Organization.created_at.desc()).all()


@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization(organization_id: UUID, db: Session = Depends(get_db)) -> Organization:
    organization = db.query(Organization).filter(Organization.id == organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization
