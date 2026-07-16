from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Organization, AuditLog
from app.schemas import UserRegister, UserLogin, TokenResponse
from app.auth import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    # 1. Resolve or create the organization
    org = db.query(Organization).filter(Organization.name == payload.organization_name).first()
    if not org:
        org = Organization(name=payload.organization_name)
        db.add(org)
        db.commit()
        db.refresh(org)

    # 2. Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # 3. Create the user
    hashed_pwd = get_password_hash(payload.password)
    user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        role=payload.role or "operator",
        organization_id=org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 4. Append audit log
    client_ip = getattr(request.state, "client_ip", "unknown")
    audit_entry = AuditLog(
        action="USER_REGISTER",
        user_email=user.email,
        details=f"Registered user with role '{user.role}' in organization '{org.name}'",
        ip_address=client_ip,
        organization_id=org.id
    )
    db.add(audit_entry)
    db.commit()

    # 5. Issue JWT
    token_data = {"sub": user.email, "org_id": str(org.id), "role": user.role}
    token = create_access_token(data=token_data)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_email": user.email,
        "organization_id": org.id,
        "organization_name": org.name,
        "role": user.role
    }

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Resolve organization metadata
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    org_name = org.name if org else "Unknown"

    # Append audit log
    client_ip = getattr(request.state, "client_ip", "unknown")
    audit_entry = AuditLog(
        action="USER_LOGIN",
        user_email=user.email,
        details="Successfully logged into the system",
        ip_address=client_ip,
        organization_id=user.organization_id
    )
    db.add(audit_entry)
    db.commit()

    # Issue JWT
    token_data = {"sub": user.email, "org_id": str(user.organization_id), "role": user.role}
    token = create_access_token(data=token_data)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_email": user.email,
        "organization_id": user.organization_id,
        "organization_name": org_name,
        "role": user.role
    }
