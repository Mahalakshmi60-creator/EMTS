# SecureVault AI - Hybrid Architecture (Hackathon Optimized)

## Goal

This architecture is optimized for:

-   ✅ Finish a working MVP within **4 hours**
-   ✅ Survive the attack/debug phase
-   ✅ Demonstrate enterprise-level design without unnecessary
    complexity
-   ✅ Keep the codebase modular and easy to debug

------------------------------------------------------------------------

# High-Level Architecture

``` text
                    React Frontend (Vite + Tailwind)
                               │
                               │ HTTP/JSON (Axios)
                               ▼
                    FastAPI Backend (Monolith)
                               │
      ┌────────────────────────┼────────────────────────┐
      │                        │                        │
      ▼                        ▼                        ▼
 Secret Vault Module     AI Scanner Module      Certificate Module
      │                        │                        │
      ├───────────────┐         │                        │
      ▼               ▼         ▼                        ▼
 Encryption      Audit Logs   Gemini API         Certificate Parser
 (AES/Fernet)        │       (Risk Analysis)      (Expiry Metadata)
      │              │
      └──────────────┼────────────────────────────┐
                     ▼
               PostgreSQL Database
```

------------------------------------------------------------------------

# Technology Stack

  Layer            Technology
  ---------------- -----------------------------
  Frontend         React + Vite + Tailwind CSS
  Backend          FastAPI
  ORM              SQLAlchemy
  Database         PostgreSQL
  Encryption       Fernet (AES)
  AI               Gemini 2.5 Flash
  Validation       Pydantic
  Authentication   JWT
  Charts           Recharts

------------------------------------------------------------------------

# Backend Structure

``` text
backend/
│
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── crypto.py
│   ├── scanner.py
│   ├── middleware.py
│   ├── routes/
│   │     ├── auth.py
│   │     ├── vault.py
│   │     ├── scanner.py
│   │     ├── certificates.py
│   │     ├── audit.py
│   │     └── organizations.py
│   └── utils/
│
├── requirements.txt
└── .env
```

------------------------------------------------------------------------

# Frontend Structure

``` text
frontend/
│
├── src/
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── layouts/
│   ├── assets/
│   ├── utils/
│   └── App.tsx
```

------------------------------------------------------------------------

# Core Modules

## 1. Secret Vault

-   Store encrypted secrets
-   Reveal (decrypt)
-   Rotate secret
-   Delete secret
-   Organization isolation

## 2. AI Scanner

Pipeline:

    Paste Code
          ↓
    Regex Detection
          ↓
    Gemini Analysis
          ↓
    Risk Score
          ↓
    Recommendations

## 3. Certificate Manager

-   Upload certificate
-   Parse metadata
-   Track expiry
-   Status (Healthy / Expiring / Expired)

## 4. Audit Logs

Log every important action: - Login - Add Secret - Reveal Secret -
Rotate Secret - Delete Secret - Upload Certificate - Run Scan

## 5. Dashboard

Displays: - Total Secrets - Certificates - Critical Risks - Security
Score - Recent Activity

------------------------------------------------------------------------

# Security Layer

Keep only the protections that provide the highest value during a
hackathon:

-   JWT Authentication
-   Tenant isolation on every query
-   Pydantic request validation
-   AES (Fernet) encryption for secrets
-   SQLAlchemy ORM (avoid SQL injection)
-   Rate limiting ONLY on `/api/scanner`
-   CORS configuration
-   Append-only audit logs

------------------------------------------------------------------------

# Database

Tables:

-   organizations
-   users
-   vault_secrets
-   certificates
-   audit_logs
-   scan_results

Every table includes `organization_id` for tenant isolation.

------------------------------------------------------------------------

# Data Flow

``` text
User
 │
 ▼
Frontend
 │
 ▼
FastAPI
 │
 ├── Secret Vault
 ├── AI Scanner
 ├── Certificate Manager
 └── Audit Logs
 │
 ▼
PostgreSQL
 │
 ├── Encrypted Secrets
 ├── Certificates
 ├── Users
 └── Logs
```

------------------------------------------------------------------------

# Team Responsibilities

### Developer 1

-   PostgreSQL
-   Models
-   Authentication
-   Vault
-   Encryption

### Developer 2

-   React UI
-   Dashboard
-   Certificates
-   Audit Logs

### Developer 3 (AI-assisted)

-   Scanner
-   Gemini integration
-   Security testing
-   Bug fixes
-   Integration

------------------------------------------------------------------------

# Features Deliberately Excluded

To maximize the chance of completion:

-   ❌ API Gateway
-   ❌ Microservices
-   ❌ Background cron jobs
-   ❌ Hash-chain audit implementation
-   ❌ Cache layer
-   ❌ Round-robin API key pools
-   ❌ Certificate auto-renewal

These can be described as future enhancements.

------------------------------------------------------------------------

# Expected Outcome

-   Working enterprise-style MVP
-   Strong security fundamentals
-   Clean modular codebase
-   High probability of surviving attack/debug phase
-   Realistic completion within 4 hours
