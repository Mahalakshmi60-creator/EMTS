# Developer 3 (Frontend UI) Setup & Action Documentation

This document outlines the steps taken by Developer 3 to set up, configure, and launch the frontend environment for the **SecureVault AI** platform.

---

## 1. Action Summary

- **Repository Analysis**: Verified the layout of the `frontend/` directory (React, TypeScript, Vite, Tailwind CSS).
- **Backend Isolation**: Confirmed that Developer 3 is only responsible for frontend/UI components. Reverted temporary SQLite backend database adjustments to preserve original PostgreSQL/SQLAlchemy schemas.
- **Dependency Installation**: Resolved a Windows PowerShell script execution policy blockage by executing `npm install` via a command prompt subprocess.
- **Development Server Startup**: Successfully launched the Vite local development server on `http://localhost:5173/`.

---

## 2. Frontend Overview & Project Structure

The frontend is built using **React (v18)**, **TypeScript**, **Vite**, and **Tailwind CSS**. 

The main file components you will be editing and working on are located in `frontend/src/`:

```
frontend/src/
├── context/
│   └── AuthContext.tsx         # Manages JWT authentication and session state
├── layouts/
│   └── DashboardLayout.tsx     # Shell layout containing navigation and tenant context
├── pages/
│   ├── Login.tsx               # Login page (auth & registration)
│   ├── Dashboard.tsx           # Security status overview
│   ├── Vault.tsx               # Core vault secrets CRUD (Reveal & Rotate buttons)
│   ├── Certificates.tsx        # SSL/TLS Certificate monitoring table
│   ├── Scanner.tsx             # Interactive secret exposure scan form
│   └── AuditLogs.tsx           # Append-only logging viewer
├── services/
│   └── api.ts                  # Axios configuration with request interceptors
├── App.tsx                     # React Router configurations & Protected Routes wrapper
└── index.css                   # Tailwind directives and CSS variables (dark theme)
```

---

## 3. Running Environment

### Development Server
- **URL**: [http://localhost:5173/](http://localhost:5173/)
- **Vite Port**: `5173`
- **Proxy Configuration** (`vite.config.ts`):
  All requests matching `/api/*` are configured to proxy automatically to the local backend at `http://localhost:8000`.

### Re-starting the Server
If you ever need to manually restart the dev server, navigate to the `frontend/` directory and execute:
```bash
cmd /c "npm run dev"
```

---

## 4. Current Status & Integration Notes

- The frontend dependencies are fully installed, and the React application is active.
- API calls from the UI will fail or throw connection errors until Developer 1 & 2 launch the FastAPI backend (`http://localhost:8000`) and the PostgreSQL database.
- Keep UI mock data or skeleton states active to work on UI refinements until the backend endpoints are integrated.
