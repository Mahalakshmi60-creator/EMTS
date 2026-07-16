# Implementation Plan - SecureVault AI Monorepo Skeleton

This plan outlines the architecture, database schema, security features, and code structure for **SecureVault AI**, an Enterprise Multi-Tenant Secrets & Certificate Lifecycle Platform. The system is designed to withstand cyber attacks by implementing absolute tenant isolation, cryptographically secured vaults, append-only logging, and rate-limited LLM-based secret scanning.

## User Review Required

> [!IMPORTANT]
> **Database Configuration & Cryptographic Keys**
> - The database will connect to PostgreSQL using `DATABASE_URL` with connection pooling (`pool_pre_ping=True`).
> - The cryptographic manager will use an `ENCRYPTION_KEY` (a base64-encoded Fernet key) stored in the `.env` file. If this key is lost, encrypted database secrets will be permanently unrecoverable.
> - The AI Scanner requires a valid `GEMINI_API_KEY` environment variable.

> [!WARNING]
> **Rate Limiting & Payload Constraints**
> - The scanner endpoint (`/api/scanner/scan`) has a defensive rate limit of **5 requests per minute per tenant** enforced by SlowAPI.
> - The maximum file size accepted for scanning is strictly **500 KB** to defend against Denial of Service (DoS) and token exhaustion attacks.

## Proposed Changes

We will create a multi-folder repository containing both `backend` and `frontend` subprojects:

```
EMTS/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── audit.py
│   │   │   ├── auth.py
│   │   │   ├── certificates.py
│   │   │   ├── organizations.py
│   │   │   ├── scanner.py
│   │   │   └── vault.py
│   │   ├── services/
│   │   │   └── scanner_service.py
│   │   ├── auth.py
│   │   ├── crypto.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── middleware.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── layouts/
    │   │   └── DashboardLayout.tsx
    │   ├── pages/
    │   │   ├── AuditLogs.tsx
    │   │   ├── Certificates.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Scanner.tsx
    │   │   └── Vault.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── vite.config.ts
```

---

### Backend (Python/FastAPI)

We will configure the backend with strict database pooling, tenant isolation, and cryptographic models.

#### [NEW] [requirements.txt](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/backend/requirements.txt)
Defines all backend Python packages including FastAPI, SlowAPI, PyJWT, Cryptography, SQLAlchemy, Psycopg2-binary, and the official `google-genai` SDK.

#### [NEW] [database.py](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/backend/app/database.py)
Configures SQLAlchemy with `pool_pre_ping=True` and yields the database session dependency.

#### [NEW] [models.py](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/backend/app/models.py)
Declares database tables. All models mapping tenant data (Users, Secrets, Certificates, Logs, Scans) MUST have `organization_id` foreign key referencing the `organizations` table, with an index for high performance and strict filtering.

#### [NEW] [schemas.py](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/backend/app/schemas.py)
Defines Pydantic V2 data validation schemas.

#### [NEW] [crypto.py](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/backend/app/crypto.py)
Implements symmetric key encryption/decryption using Fernet to secure secrets before writing to the database.

#### [NEW] [auth.py](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/backend/app/auth.py)
Implements password hashing (via `passlib`/`bcrypt`) and JWT creation/validation. Exposes a `get_current_user` dependency that returns the active user context (specifically the user's `organization_id`).

#### [NEW] [scanner_service.py](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/backend/app/services/scanner_service.py)
Integrates Google Gemini 2.5 Flash using the official `google-genai` SDK. Uses structured schema outputs to force the model to respond ONLY with valid JSON conforming to our risk assessment schema.

#### [NEW] [routes](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/backend/app/routes/)
- `auth.py`: Registers and logs in users, mapping them to organizations.
- `vault.py`: Performs CRUD operations for secrets, scoped strictly to the user's `organization_id`. Secret plaintext values are never returned unless specifically decrypted via the reveal route.
- `scanner.py`: Rate-limited `/api/scanner/scan` code scanner endpoint (rejects payloads > 500 KB).
- `certificates.py`: Scoped endpoints to manage certificates.
- `audit.py`: Append-only, read-only endpoint returning organization logs. No updates or deletes.
- `organizations.py`: Setup endpoint for tenant accounts.

#### [NEW] [main.py](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/backend/app/main.py)
Hooks up all routers, registers CORS headers, configures the SlowAPI rate limiter (using IP-based/headers-based limiter, or tenant-scoped token), and handles exceptions.

---

### Frontend (React/Vite/TypeScript/Tailwind CSS)

#### [NEW] [api.ts](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/frontend/src/services/api.ts)
Vite-tailored Axios instance with request/response interceptors to attach authorization headers automatically.

#### [NEW] [AuthContext.tsx](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/frontend/src/context/AuthContext.tsx)
State provider for JWT storage, session validation, sign-in/sign-out handlers.

#### [NEW] [DashboardLayout.tsx](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/frontend/src/layouts/DashboardLayout.tsx)
Sleek, responsive dashboard layout with a sidebar (Secrets, Certificates, Scanner, Logs) and organization branding in the header.

#### [NEW] [pages](file:///run/media/devadharshan/New Volume/Hackathon/Project Files/EMTS/frontend/src/pages/)
- `Dashboard.tsx`: Security overview metrics.
- `Vault.tsx`: Operations interface to store, decrypt, and roll credentials.
- `Certificates.tsx`: Monitor expiry dates, key sizes, and issues.
- `Scanner.tsx`: Paste text code block, trigger the rate-limited AI exposure scanner, and display results categorized by severity.
- `AuditLogs.tsx`: Audit trail displaying system logs.

---

## Verification Plan

### Automated Tests
We will verify that:
1. The backend syntax and imports are clean by running:
   ```bash
   python -m py_compile backend/app/*.py backend/app/**/*.py
   ```
2. The frontend runs TypeScript compilation checks:
   ```bash
   npm run build --prefix frontend
   ```

### Manual Verification
1. We will verify the rate limiting and file size checking of `/api/scanner/scan` by calling it with dummy parameters.
2. We will test Fernet encryption / decryption functionality directly in python scripts.
3. We will check the Gemini API connection using a mock script if needed or by directly validating it against the environment keys.
