import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Integer, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    secrets = relationship("VaultSecret", back_populates="organization", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="save-update, merge")  # SECURITY: No cascade-delete — audit logs are immutable
    scan_results = relationship("ScanResult", back_populates="organization", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="operator", nullable=False)
    
    # Absolute Tenant Isolation
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization = relationship("Organization", back_populates="users")

class VaultSecret(Base):
    __tablename__ = "vault_secrets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, index=True)
    encrypted_value = Column(Text, nullable=False)  # Zero-Plaintext Vault
    description = Column(String(500), nullable=True)
    
    # Absolute Tenant Isolation
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    organization = relationship("Organization", back_populates="secrets")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    domain_name = Column(String(255), nullable=False, index=True)
    issuer = Column(String(255), nullable=False)
    expiry_date = Column(DateTime(timezone=True), nullable=False, index=True)
    pem_content = Column(Text, nullable=False)
    status = Column(String(50), nullable=False)  # active, expired, expiring_soon
    
    # Absolute Tenant Isolation
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization = relationship("Organization", back_populates="certificates")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    action = Column(String(100), nullable=False, index=True)
    user_email = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # Absolute Tenant Isolation
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization = relationship("Organization", back_populates="audit_logs")

class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_name = Column(String(255), nullable=False)
    findings = Column(JSON, nullable=False)  # Will store the array of security risks
    risk_score = Column(Integer, nullable=False, default=0)
    
    # Absolute Tenant Isolation
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization = relationship("Organization", back_populates="scan_results")


# ============================================================================
# AUDIT LOG SECURITY: Append-Only Enforcement
# These ORM-level event listeners guarantee that audit_logs can never be
# modified or deleted through SQLAlchemy. This is a critical security control.
# ============================================================================
from sqlalchemy import event

@event.listens_for(AuditLog, "before_update")
def _block_audit_update(mapper, connection, target):
    raise RuntimeError(
        "SECURITY VIOLATION: Audit logs are strictly append-only. Updates are forbidden."
    )

@event.listens_for(AuditLog, "before_delete")
def _block_audit_delete(mapper, connection, target):
    raise RuntimeError(
        "SECURITY VIOLATION: Audit logs are strictly append-only. Deletes are forbidden."
    )
