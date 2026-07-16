from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

# Organization Schemas
class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)

class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    organization_name: str = Field(..., min_length=2, max_length=255)
    role: Optional[str] = "operator"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_email: str
    organization_id: UUID
    organization_name: str
    role: str

# Vault Schemas
class SecretCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    value: str = Field(..., min_length=1)
    description: Optional[str] = Field(None, max_length=500)

class SecretResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SecretRevealResponse(BaseModel):
    id: UUID
    name: str
    value: str

class SecretRotateRequest(BaseModel):
    value: str = Field(..., min_length=1)

# Certificate Schemas
class CertificateCreate(BaseModel):
    domain_name: str = Field(..., min_length=3, max_length=255)
    issuer: str = Field(..., min_length=1, max_length=255)
    expiry_date: datetime
    pem_content: str = Field(..., min_length=1)

class CertificateResponse(BaseModel):
    id: UUID
    domain_name: str
    issuer: str
    expiry_date: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# AI Scanner Schemas
class Finding(BaseModel):
    line_number: int
    secret_type: str
    severity: str
    confidence_score: float
    remediation: str

class ScanRequest(BaseModel):
    code_snippet: str
    file_name: str

class ScanResponse(BaseModel):
    id: UUID
    file_name: str
    findings: List[Finding]
    risk_score: int
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: UUID
    action: str
    user_email: str
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
