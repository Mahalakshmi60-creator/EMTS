from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Organization
from app.schemas import OrganizationResponse, OrganizationCreate
from app.auth import get_current_user, User

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.post("", response_model=OrganizationResponse)
def create_organization(payload: OrganizationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Create a new tenant organization
    existing = db.query(Organization).filter(Organization.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An organization with this name already exists."
        )
    org = Organization(name=payload.name)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/current", response_model=OrganizationResponse)
def get_current_organization(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization context not found.")
    return org
