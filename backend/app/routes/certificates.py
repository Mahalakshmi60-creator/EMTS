from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List
from uuid import UUID

from app.database import get_db
from app.models import Certificate, AuditLog
from app.schemas import CertificateCreate, CertificateResponse
from app.auth import get_current_user, User

router = APIRouter(prefix="/certificates", tags=["Certificates Manager"])

def calculate_status(expiry_date: datetime) -> str:
    # Resolve naive vs timezone-aware date comparisons
    now = datetime.now(timezone.utc) if expiry_date.tzinfo else datetime.now()
    if expiry_date <= now:
        return "expired"
    elif expiry_date <= now + timedelta(days=30):
        return "expiring_soon"
    return "active"

@router.post("", response_model=CertificateResponse)
def create_certificate(payload: CertificateCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    status_val = calculate_status(payload.expiry_date)
    
    cert = Certificate(
        domain_name=payload.domain_name,
        issuer=payload.issuer,
        expiry_date=payload.expiry_date,
        pem_content=payload.pem_content,
        status=status_val,
        organization_id=current_user.organization_id
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    # Log to audit trail
    client_ip = getattr(request.state, "client_ip", "unknown")
    audit_entry = AuditLog(
        action="UPLOAD_CERTIFICATE",
        user_email=current_user.email,
        details=f"Uploaded X.509 certificate for '{cert.domain_name}' issued by '{cert.issuer}'",
        ip_address=client_ip,
        organization_id=current_user.organization_id
    )
    db.add(audit_entry)
    db.commit()

    return cert

@router.get("", response_model=List[CertificateResponse])
def list_certificates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Absolute Tenant Isolation: Filter list by active user's organization with pagination
    if limit > 200:
        limit = 200
    certs = db.query(Certificate).filter(Certificate.organization_id == current_user.organization_id).offset(skip).limit(limit).all()
    
    # Recalculate status values in case expiration date has passed
    status_changed = False
    for cert in certs:
        current_calculated_status = calculate_status(cert.expiry_date)
        if cert.status != current_calculated_status:
            cert.status = current_calculated_status
            status_changed = True
            
    if status_changed:
        db.commit()
        
    return certs

@router.delete("/{cert_id}")
def delete_certificate(cert_id: UUID, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cert = db.query(Certificate).filter(
        Certificate.id == cert_id,
        Certificate.organization_id == current_user.organization_id
    ).first()
    
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate record not found or access denied")

    domain = cert.domain_name
    db.delete(cert)
    db.commit()

    # Log to audit trail
    client_ip = getattr(request.state, "client_ip", "unknown")
    audit_entry = AuditLog(
        action="DELETE_CERTIFICATE",
        user_email=current_user.email,
        details=f"Deleted certificate record for domain '{domain}' (ID: {cert_id})",
        ip_address=client_ip,
        organization_id=current_user.organization_id
    )
    db.add(audit_entry)
    db.commit()

    return {"detail": "Certificate successfully deleted"}
