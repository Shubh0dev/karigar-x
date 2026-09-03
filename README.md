# KARIGAR X (AI-Driven Market Linkage & Smart Cataloging Mobile App)
> **SIH Problem Statement 26090** — AI-Driven Market Linkage and Smart Cataloging Mobile Application for Marginalized Artisans.

KARIGAR X is a mobile-first AI virtual business manager designed to empower traditional artisans with smart voice/image cataloging, AI-driven fair pricing valuation, and direct B2B market linkage.

---

## 📁 Repository Architecture

```text
karigar-x/
├── frontend/        # Next.js 14+ (App Router), TypeScript, Tailwind CSS
├── backend/         # Python FastAPI server with REST endpoints & CORS
├── ml/              # ML models, training pipelines & Python XGBoost pricing engine docs
└── data/            # Artisan profiles, handicraft catalog schemas & sample pricing datasets
```

---

## 🚀 Quick Start Instructions

### 1. Frontend (Next.js + TypeScript + Tailwind)
```bash
# From workspace root SIH:
cd karigar-x/frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile view/browser.

### 2. Backend (Python FastAPI)
```bash
# From workspace root SIH:
cd karigar-x/backend

# Activate virtual environment (Windows PowerShell):
.\venv\Scripts\Activate.ps1

# Run FastAPI server:
uvicorn main:app --reload --port 8000
```
API Documentation (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)  
Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🛠️ Tech Stack Overview

- **Frontend**: Next.js (App Router), React 18, TypeScript, Tailwind CSS, Lucide React Icons
- **Backend**: Python 3.13+, FastAPI, Uvicorn, Pydantic
- **ML (Future Milestone)**: Python, XGBoost, Scikit-learn
- **Database (Future Milestone)**: Supabase / PostgreSQL

---

## 🚩 Project Milestones

- [x] **Milestone 1**: Project Foundation, Architecture, Mobile-First Design System, FastAPI Health Check & CORS.
- [ ] **Milestone 2**: Smart Voice & Image Cataloging Prototype (Local Mock).
- [ ] **Milestone 3**: XGBoost Fair Pricing Engine Integration.
- [ ] **Milestone 4**: Market Linkage & Artisan Business Profile.
- [ ] **Milestone 5**: Full Integration & Offline-First Sync.
