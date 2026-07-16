import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.database import engine, Base
from app.middleware import AuditLogMiddleware
from app.limiter import limiter
from app.routes import auth, vault, scanner, certificates, audit, organizations

# Initialize database schemas (Self-healing startup logic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SecureVault AI API",
    description="Enterprise Multi-Tenant Secrets & Certificate Lifecycle Platform",
    version="1.0.0"
)

# Register rate limiter status and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add custom Middlewares (Ordering matters: CORS -> Audit -> SlowAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://emts-nine.vercel.app",
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(AuditLogMiddleware)
app.add_middleware(SlowAPIMiddleware)

# Include Router endpoints under the "/api" route space
app.include_router(auth.router, prefix="/api")
app.include_router(vault.router, prefix="/api")
app.include_router(scanner.router, prefix="/api")
app.include_router(certificates.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(organizations.router, prefix="/api")

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "SecureVault AI Platform",
        "tenant_isolation": "enabled",
        "cryptography": "AES-256 (Fernet)"
    }
