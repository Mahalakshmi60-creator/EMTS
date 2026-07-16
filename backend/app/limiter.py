import os
from fastapi import Request
from slowapi import Limiter
import jwt

def get_tenant_key(request: Request) -> str:
    # Attempt to extract the tenant (organization_id) from the JWT token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            # Safely decode the token to retrieve the tenant ID
            JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-vault-key-jwt-signing-12345")
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            org_id = payload.get("org_id")
            if org_id:
                return f"tenant_{org_id}"
        except Exception:
            pass
            
    # Fallback to IP address for rate limiting
    return request.client.host if request.client else "unknown"

# Initialize SlowAPI Limiter with the custom tenant-based key function
limiter = Limiter(key_func=get_tenant_key)
