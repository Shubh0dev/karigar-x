# KARIGAR X - Mobile Frontend

Mobile-first Web Prototype built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS.

---

## 📱 Features Implemented in Milestone 1

- **Mobile-First Responsive Shell**: Tailored viewport constraints (`max-w-md`) simulating native mobile application experience.
- **Craft Design System**: Custom artisan palette (`artisan-terracotta`, `artisan-gold`, `artisan-indigo`, `artisan-sand`), glassmorphic panels, and smooth micro-animations.
- **Reusable Component Architecture**:
  - `Header`: Top navigation bar with logo, title, and status badges.
  - `BottomNav`: Sticky mobile bottom navbar with active path detection (`/`, `/catalog`, `/pricing`, `/marketplace`, `/profile`).
  - `Card`: Glassmorphic container wrapper with hover elevation effects.
  - `Badge`: Status and craft tag indicators.
  - `Button`: Touch-optimized action buttons.
  - `HealthStatus`: Live integration card fetching `http://localhost:8000/api/health` from FastAPI backend.
- **Prepared Routes**:
  - `/` (Home Dashboard)
  - `/catalog` (Smart Cataloging placeholder)
  - `/pricing` (AI Fair Pricing Engine placeholder)
  - `/marketplace` (B2B Market Linkage placeholder)
  - `/profile` (Artisan Digital Passport placeholder)

---

## 🚀 Local Development Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install node dependencies
npm install

# 3. Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
