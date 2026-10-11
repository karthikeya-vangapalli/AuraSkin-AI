# AI-Powered Skin Intelligence & Personalized Skincare Planner

A high-performance, microservice-architected platform for personalized skincare intelligence, AI visual skin analysis, ingredient safety checking, and custom routine planning.

---

## 🏗️ Architecture Overview

```
                          ┌────────────────────────┐
                          │   React.js Frontend    │
                          │ (Vite + Tailwind CSS)  │
                          └───────────┬────────────┘
                                      │
               ┌──────────────────────┼──────────────────────┐
               │ REST API             │ REST API             │ REST API
               ▼                      ▼                      ▼
    ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
    │    User Service    │ │  Profile Service   │ │  AI Skin Service   │
    │  FastAPI + Postgres│ │  FastAPI + Mongo   │ │ Fast API + Vision  │
    └─────────┬──────────┘ └─────────┬──────────┘ └─────────┬──────────┘
              │                      │                      │
              ▼                      ▼                      ▼
       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
       │  PostgreSQL  │       │   MongoDB    │       │ OpenCV / LLM │
       └──────────────┘       └──────────────┘       └──────────────┘
```

### Stack Breakdown

- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion, Axios, Lucide Icons
- **User Service**: Python (FastAPI), PostgreSQL (SQLAlchemy + AsyncPG), JWT Auth, Passlib
- **Profile & Routine Service**: Python (FastAPI), MongoDB (Motor + Beanie ODM), PyMongo
- **AI Skin Analysis Service**: Python (FastAPI), OpenCV, Pillow, NumPy, AI Recommendation Engine
- **Infrastructure**: Docker & Docker Compose, Redis (Caching & Rate limiting)

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── user-service/         # User auth & account management (PostgreSQL)
│   ├── profile-service/      # Skin profile, questionnaire & routines (MongoDB)
│   └── ai-skin-service/      # AI visual analysis & ingredient intelligence engine
├── frontend/                 # React + Tailwind CSS client web app
├── docker-compose.yml        # Orchestration for services & databases
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 18.x
- Python >= 3.10
- PostgreSQL (running on port 5432)
- MongoDB (running on port 27017)

### 2. Launching Services Locally (Windows)
Run the backend orchestrator script which launches all 3 microservices concurrently:
```bash
./run_backend.bat
```

Run the frontend:
```bash
cd frontend
npm install
npm run dev
```

### 3. Application Ports
- **Frontend App**: `http://localhost:5173`
- **User Service (PostgreSQL)**: `http://localhost:8000` (Auth, Role Management, Clinical Notes)
- **Profile Service (MongoDB)**: `http://localhost:8002` (Profiles, Tracking, APScheduler)
- **AI Skin Service (Stateless)**: `http://localhost:8003` (Deterministic Scoring, Intelligence)

### 4. Role-Based Access Credentials
Roles can be switched in the **Admin Control Center**.
- **Admin Access**: `/admin`
- **Dermatologist Portal**: `/clinical`
- **Consultant Desk**: `/consultations`
- **Consumer Portal**: `/dashboard`

### 5. Exporting Data
- The Standard User Dashboard (`/analytics`) supports exporting multi-tab `.xlsx` spreadsheets and clean `.pdf` clinical summaries.

---
---
## 🧪 Automated Testing & Verification
Execute the comprehensive automated test suite verifying deterministic formulas, clinical RBAC, catalog integrity, and multi-tab Excel export:
```bash
python tests/test_audit_verification.py
```

---
## 🔒 Security & Privacy Architecture
- **Clinical Confidentiality**: Clinical diagnostic directories and medical notes (`POST /api/v1/clinical/patients/{id}/notes`) are strictly restricted to authenticated `Dermatologist` personnel. Administrators and standard users are blocked with HTTP 403.
- **Horizontal Isolation**: Users are prevented from inspecting or modifying records of other users.
- **Privilege Escalation Guard**: Role changes are strictly restricted to `PATCH /api/v1/users/{id}/role` executed by an Administrator.
- **Demo Data Quarantine**: Mock profiles (e.g. Sarah Jenkins) are gated behind `APP_ENV=development` and badged visibly as `[DEMO RECORD]`. They are strictly excluded from production.
- **Structured Audit Trail**: All clinical accesses, note creations, and administrative role modifications persist to the `audit_logs` table in PostgreSQL with credentials sanitized.

---
## 📑 Documentation
- **Milestone Audit Matrix**: `docs/milestone-audit.md`
- **Automated Testing Report**: `docs/testing-report.md`
