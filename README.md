# SecureVault AI — Enterprise Multi-Tenant Secrets & Certificate Lifecycle Platform

An enterprise-grade security platform for managing secrets, certificates, and AI-powered code scanning with strict multi-tenant isolation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.13+) |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL (Neon Serverless) |
| Encryption | AES-256 (Fernet) |
| AI Engine | Google Gemini 2.5 Flash |
| Auth | JWT (HS256) |
| Validation | Pydantic v2 |

## Architecture

```
React Frontend (Vite + Tailwind)
         │
         ▼  HTTP/JSON (Bearer JWT)
FastAPI Backend (Monolith)
         │
    ┌────┼────┬──────────────┐
    ▼    ▼    ▼              ▼
  Vault  Certs  AI Scanner  Audit
    │    │    │              │
    └────┴────┴──────────────┘
              │
         PostgreSQL (Neon)
```

## Security Features

- **Multi-Tenant Isolation**: Every table has an indexed `organization_id` FK. All queries are scoped to the authenticated user's tenant.
- **Zero-Plaintext Vault**: Secrets are encrypted with AES-256 (Fernet) before storage. No plaintext ever hits the database.
- **Append-Only Audit Logs**: SQLAlchemy event listeners block UPDATE/DELETE operations on audit log records.
- **Role-Based Access Control**: `admin` and `operator` roles with endpoint-level enforcement.
- **Rate Limiting**: Scanner endpoint limited to 5 requests/minute per tenant.
- **Payload Size Limits**: 500 KB max on AI scanner input to prevent DoS.
- **CORS Restriction**: Whitelist-based origin control.
- **JWT Authentication**: Stateless tokens with configurable expiration.

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database (or Neon serverless account)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
ENCRYPTION_KEY=<generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">
JWT_SECRET=<strong-random-string>
GEMINI_API_KEY=<your-google-ai-studio-key>
```

Run the backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user + org |
| POST | `/api/auth/login` | ❌ | Login, receive JWT |
| POST | `/api/vault` | ✅ | Store encrypted secret |
| GET | `/api/vault` | ✅ | List secrets (paginated) |
| GET | `/api/vault/{id}/reveal` | ✅ | Decrypt and reveal secret |
| PUT | `/api/vault/{id}/rotate` | ✅ | Rotate secret value |
| DELETE | `/api/vault/{id}` | ✅ | Delete secret |
| POST | `/api/certificates` | ✅ | Upload certificate |
| GET | `/api/certificates` | ✅ | List certificates (paginated) |
| DELETE | `/api/certificates/{id}` | ✅ | Delete certificate |
| POST | `/api/scanner/scan` | ✅ | AI-powered code scan (rate limited) |
| GET | `/api/audit` | ✅ | View audit logs (paginated) |

## API Sources / External Services

| Service | Purpose | Provider URL |
|---------|---------|--------------|
| **Google Gemini API** | AI-powered secret leak detection in the Scanner module. Uses `gemini-3.5-flash` with fallback to `gemini-2.0-flash` and `gemini-2.0-flash-lite`. | [https://ai.google.dev](https://ai.google.dev) |
| **Neon Serverless PostgreSQL** | Cloud-hosted PostgreSQL database with connection pooling and SSL. | [https://neon.tech](https://neon.tech) |
| **Render** | Backend deployment (FastAPI). | [https://render.com](https://render.com) |
| **Vercel** | Frontend deployment (React + Vite). | [https://vercel.com](https://vercel.com) |

### API Key Setup

- **Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/apikey). Set as `GEMINI_API_KEY` in backend `.env`.
- **Neon Database URL**: Obtain from [Neon Console](https://console.neon.tech). Set as `DATABASE_URL` in backend `.env`.

## Known Limitations

- JWT tokens do not support refresh/revocation (stateless design)
- No certificate auto-renewal or ACME integration
- AI scanner depends on Gemini API availability
- No background job scheduler for expiry notifications
- Single encryption key (no per-tenant key rotation)

## Team

Built for System Siege Hackathon 2026.