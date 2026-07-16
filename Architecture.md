[ Frontend Dashboard ] (React/Tailwind)
         │
         ▼ HTTP / JSON (Bearer JWT Token)
┌────────────────────────────────────────────────────────┐
│ API GATEWAY & SECURITY LAYER                           │
│  ├─ Rate Limiter (Max 5 req/min on /api/scan)          │
│  ├─ Payload Size Limiter (Max 500 KB)                  │
│  └─ Auth Middleware (Extracts & enforces tenant_id)    │
└────────────────────────────────────────────────────────┘
         │
         ├────────────────────────────────────────┬──────────────────────────────────┐
         ▼                                        ▼                                  ▼
┌─────────────────────────────────┐    ┌──────────────────────────────┐    ┌─────────────────────────────────┐
│ CORE VAULT SERVICE              │    │ AUDIT LOG SERVICE            │    │ AI SCANNER SERVICE              │
│  ├─ AES-256-GCM Encrypt/Decrypt │    │  ├─ SHA-256 Hash Chain Calc  │    │  ├─ SHA-256 Snippet Cache Check │
│  └─ Background Cron Rotator     │    │  └─ Append-Only Log Writer   │    │  └─ Round-Robin API Key Pool    │
└─────────────────────────────────┘    └──────────────────────────────┘    └─────────────────────────────────┘
         │                                        │                                  │
         ▼                                        ▼                                  ▼
┌────────────────────────────────────────────────────────┐                 ┌─────────────────────────────────┐
│ POSTGRESQL DATABASE                                    │                 │ GOOGLE AI STUDIO (Gemini API)   │
│  ├─ Table: tenants                                     │                 │  ├─ Key 1 (Account A)           │
│  ├─ Table: secrets (Row-Level Security Enabled)        │                 │  ├─ Key 2 (Account B)           │
│  └─ Table: audit_logs (No-UPDATE/DELETE Rules Enabled) │                 │  └─ Key 3 (Account C)           │
└────────────────────────────────────────────────────────┘                 └─────────────────────────────────┘