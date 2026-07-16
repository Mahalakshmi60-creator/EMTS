from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogResponse
from app.auth import get_current_user, User

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Scopes the query strictly to the current user's tenant organization with pagination
    if limit > 500:
        limit = 500
    logs = db.query(AuditLog).filter(
        AuditLog.organization_id == current_user.organization_id
    ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return logs
