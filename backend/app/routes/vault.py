from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models import VaultSecret, AuditLog
from app.schemas import SecretCreate, SecretResponse, SecretRevealResponse, SecretRotateRequest
from app.auth import get_current_user, User, require_role
from app.crypto import crypto_manager

router = APIRouter(prefix="/vault", tags=["Secrets Vault"])

@router.post("", response_model=SecretResponse)
def create_secret(payload: SecretCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Encrypt the value before database insertion
    encrypted = crypto_manager.encrypt(payload.value)
    
    secret = VaultSecret(
        name=payload.name,
        encrypted_value=encrypted,
        description=payload.description,
        organization_id=current_user.organization_id
    )
    db.add(secret)
    db.commit()
    db.refresh(secret)

    # Append to Audit Log
    client_ip = getattr(request.state, "client_ip", "unknown")
    audit_entry = AuditLog(
        action="CREATE_SECRET",
        user_email=current_user.email,
        details=f"Created secret '{secret.name}' (ID: {secret.id})",
        ip_address=client_ip,
        organization_id=current_user.organization_id
    )
    db.add(audit_entry)
    db.commit()

    return secret

@router.get("", response_model=List[SecretResponse])
def list_secrets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Absolute Tenant Isolation with pagination guard
    if limit > 200:
        limit = 200
    secrets = db.query(VaultSecret).filter(VaultSecret.organization_id == current_user.organization_id).offset(skip).limit(limit).all()
    return secrets

@router.get("/{secret_id}", response_model=SecretResponse)
def get_secret(secret_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Absolute Tenant Isolation: Scoped strictly to user's organization
    secret = db.query(VaultSecret).filter(
        VaultSecret.id == secret_id,
        VaultSecret.organization_id == current_user.organization_id
    ).first()
    
    if not secret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secret not found or access denied")
    return secret

@router.get("/{secret_id}/reveal", response_model=SecretRevealResponse)
def reveal_secret(secret_id: UUID, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    secret = db.query(VaultSecret).filter(
        VaultSecret.id == secret_id,
        VaultSecret.organization_id == current_user.organization_id
    ).first()
    
    if not secret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secret not found or access denied")

    # Decrypt key
    decrypted = crypto_manager.decrypt(secret.encrypted_value)

    # Log the access to the secret
    client_ip = getattr(request.state, "client_ip", "unknown")
    audit_entry = AuditLog(
        action="REVEAL_SECRET",
        user_email=current_user.email,
        details=f"Revealed decrypted value of secret '{secret.name}' (ID: {secret.id})",
        ip_address=client_ip,
        organization_id=current_user.organization_id
    )
    db.add(audit_entry)
    db.commit()

    return {
        "id": secret.id,
        "name": secret.name,
        "value": decrypted
    }

@router.put("/{secret_id}/rotate", response_model=SecretResponse)
def rotate_secret(secret_id: UUID, payload: SecretRotateRequest, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    secret = db.query(VaultSecret).filter(
        VaultSecret.id == secret_id,
        VaultSecret.organization_id == current_user.organization_id
    ).first()
    
    if not secret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secret not found or access denied")

    # Encrypt the rotated secret
    secret.encrypted_value = crypto_manager.encrypt(payload.value)
    db.commit()
    db.refresh(secret)

    # Log the rotation
    client_ip = getattr(request.state, "client_ip", "unknown")
    audit_entry = AuditLog(
        action="ROTATE_SECRET",
        user_email=current_user.email,
        details=f"Rotated key value for secret '{secret.name}' (ID: {secret.id})",
        ip_address=client_ip,
        organization_id=current_user.organization_id
    )
    db.add(audit_entry)
    db.commit()

    return secret

@router.delete("/{secret_id}")
def delete_secret(secret_id: UUID, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    secret = db.query(VaultSecret).filter(
        VaultSecret.id == secret_id,
        VaultSecret.organization_id == current_user.organization_id
    ).first()
    
    if not secret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secret not found or access denied")

    # Capture name and ID for logs before deleting
    secret_name = secret.name
    
    db.delete(secret)
    db.commit()

    # Log the deletion
    client_ip = getattr(request.state, "client_ip", "unknown")
    audit_entry = AuditLog(
        action="DELETE_SECRET",
        user_email=current_user.email,
        details=f"Deleted secret '{secret_name}' (ID: {secret_id})",
        ip_address=client_ip,
        organization_id=current_user.organization_id
    )
    db.add(audit_entry)
    db.commit()

    return {"detail": "Secret successfully deleted"}
