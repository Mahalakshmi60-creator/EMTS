from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models import ScanResult, AuditLog
from app.schemas import ScanRequest, ScanResponse
from app.auth import get_current_user, User
from app.services.scanner_service import analyze_code_for_secrets
from app.limiter import limiter

router = APIRouter(prefix="/scanner", tags=["AI Secrets Scanner"])

@router.post("/scan", response_model=ScanResponse)
@limiter.limit("5/minute")
def scan_code(payload: ScanRequest, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Strict 500 KB ceiling check
    payload_size = len(payload.code_snippet.encode('utf-8'))
    if payload_size > 500 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Payload size ({payload_size / 1024:.2f} KB) exceeds the strict 500 KB security limit."
        )

    try:
        # Call Gemini 2.5 Flash analyzer
        report = analyze_code_for_secrets(payload.code_snippet, payload.file_name)
        
        # Serialize findings to standard list of dicts for PostgreSQL JSON field insertion
        findings_list = [finding.model_dump() for finding in report.findings]
        
        # Save scan results to DB under absolute tenant isolation
        scan_record = ScanResult(
            file_name=payload.file_name,
            findings=findings_list,
            risk_score=report.risk_score,
            organization_id=current_user.organization_id
        )
        db.add(scan_record)
        db.commit()
        db.refresh(scan_record)

        # Log scanner execution
        client_ip = getattr(request.state, "client_ip", "unknown")
        audit_entry = AuditLog(
            action="EXECUTE_SCAN",
            user_email=current_user.email,
            details=f"Ran AI secret scan on '{payload.file_name}'. Risk Score: {report.risk_score}",
            ip_address=client_ip,
            organization_id=current_user.organization_id
        )
        db.add(audit_entry)
        db.commit()

        return scan_record

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        import logging
        logging.error(f"AI Scanner internal error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI scan service is temporarily unavailable. Please try again."
        )
