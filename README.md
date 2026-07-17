<img src="https://github.com/LordDevdeep/Infrawatch/raw/main/client/public/icon.svg" alt="InfraWatch" width="72" align="left" />

# InfraWatch
<br clear="left"/>

**Satellite-based detection of illegal construction, with an SLA-tracked enforcement workflow, built for Indian municipal corporations.**

[Live Demo](https://infrawatch-sepia.vercel.app) · [Citizen Report Portal](https://infrawatch-sepia.vercel.app/?report=1) · [Backend Health](https://infrawatch-backend-odou.onrender.com/health) · [Report a Bug](https://github.com/LordDevdeep/Infrawatch/issues)

MIT License · React 18 + Express · Gemini 2.5 Flash · Built for Google Solution Challenge 2026

---

## Table of Contents
- [The Problem](#the-problem)
- [What It Does](#what-it-does)
- [Why It Matters](#why-it-matters)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quickstart](#quickstart)
- [Demo Access](#demo-access)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [License](#license)

---

## The Problem

Bengaluru has roughly **2.5 million buildings** across **198 wards**, monitored by around **840 BBMP enforcement officers**. Manual inspection can't keep pace with construction. Two concrete consequences:

- The 2019 Dharwad building collapse killed 19 people in an unauthorized structure that went unflagged.
- Bellandur Lake's wetlands have been degraded by unchecked construction-linked sewage discharge.

BBMP's own figures put average detection-to-notice time at 21+ days — long enough for a violation to be finished, occupied, or already causing damage before enforcement even starts.

## What It Does

InfraWatch closes the loop from satellite image to legal notice in one pipeline:

1. **Detect** — Gemini 2.5 Flash analyzes satellite tiles and returns structured violation candidates: bounding boxes, classification, confidence score.
2. **Triage** — Each detection is auto-assigned an SLA tier: 4 hours at ≥90% confidence, 12 hours at ≥80%, 24 hours otherwise.
3. **Dispatch** — Round-robin assignment routes the case to the nearest available field officer.
4. **Draft** — Gemini drafts a formal enforcement notice citing real statute (Karnataka Municipal Corporations Act 1976 §308/321/322, BBMP Building Bye-laws 2003). If it can't confidently match a citation, it falls back to "Refer to applicable BBMP Bye-laws" instead of inventing a section number.
5. **Track** — Every action is timestamped and logged.
6. **Crowdsource** — A public reporting portal takes anonymous photo + GPS submissions into the same officer queue, no login required.

## Why It Matters

This is a hackathon prototype, not a validated deployment — we haven't run a pilot, so we're not going to hand you a fabricated ROI table. What we can say concretely:

- Manual review scales linearly with officer headcount; satellite-triggered detection doesn't.
- Detection-to-notice time drops from weeks (someone has to physically notice and report a violation) to however long the AI pipeline + officer review takes — realistically minutes to hours once a tile is scanned.
- Every notice and action is logged, which is closer to RTI-auditable than the current largely undocumented process.

Actual impact numbers are a Phase 2 pilot deliverable, not something we're claiming today.

## Key Features

**AI Vision**
- Gemini 2.5 Flash for satellite tile analysis — bounding boxes + confidence scores
- Automatic failover to Groq Llama 4 Scout Vision on Gemini rate-limit/quota errors
- AI Insights panel surfaces hot wards, SLA performance, false-positive trends
- Chat copilot with read access to the violations DB, cites real ward names and case IDs

**Crisis Response Workflow**
- Live SLA-breach banner, polls every 15 seconds
- One-click "City Scan" — detects, files, and dispatches across 4 hotspots in under 30 seconds
- Role-based access control, round-robin officer assignment

**Legal Drafting**
- Notices grounded in named statutes (KMC Act 1976, BBMP Building Bye-laws 2003, Karnataka Town & Country Planning Act 1961)
- Explicit guardrail against hallucinated section numbers
- Standard 10-section notice format: notice number, date, addressee, address, violation, legal provision, required action, deadline, consequences, officer

**Civic Participation**
- Public reporting portal, anonymous, photo + GPS, IP-rate-limited

**Transparency**
- Every case action is audit-logged
- Public `/health` endpoint reporting DB, AI provider, and uptime status

## Architecture

```
┌──────────────────────┐
│ VERCEL                │
│ React 18 + Vite       │
│ Leaflet · PWA          │
└──────────┬───────────┘
           │ /api proxy
           ▼
┌──────────────────────┐      ┌──────────────────────────┐
│ RENDER                 │────►│ Google AI Studio           │
│ Node.js 20 + Express   │      │ Gemini 2.5 Flash            │
│ sql.js · JWT auth       │      │ (vision + text gen)         │
└──────────┬───────────┘      └──────────┬───────────────┘
           │                              │ if 429 / quota
           │                              ▼
           │                  ┌──────────────────────────┐
           │                  │ Groq Llama 4 Scout          │
           │                  │ (auto-failover)              │
           │                  └──────────────────────────┘
           ▼
┌──────────────────────┐
│ ESRI World Imagery      │
│ (satellite tiles)        │
└──────────────────────┘
```

- No vendor lock-in — Node-compatible with any host; Render was picked because it's free.
- AI layer has a single dispatcher with transparent failover and timeouts, not scattered try/catch.
- sql.js persists to disk for the demo; swapping to Postgres is a single connection-layer change, not a rewrite.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18, Vite, Leaflet, PWA | fast iteration, real map rendering, installable |
| Backend | Node.js 20, Express | lightweight, fits free-tier hosting |
| Database | sql.js (SQLite) | zero setup for demo, trivial Postgres migration |
| Auth | JWT + bcrypt | role-based: admin / commissioner / inspector / field_officer |
| AI — primary | Gemini 2.5 Flash | multimodal vision, structured JSON output, grounded generation |
| AI — fallback | Groq Llama 4 Scout Vision + Llama 3.3 70B | failover on Gemini quota errors |
| Satellite | ESRI World Imagery | free CDN tiles |
| Hosting | Vercel + Render | free tier, zero-config GitHub deploy |
| Monitoring | UptimeRobot | keeps Render warm |

## Quickstart

### Prerequisites
- Node.js ≥ 18, npm ≥ 9
- A free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

```bash
git clone https://github.com/LordDevdeep/Infrawatch.git
cd Infrawatch

npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

cp server/.env.example server/.env
# edit server/.env, paste your GEMINI_API_KEY

npm run dev   # client on :5173, server on :3002
```

Open [http://localhost:5173](http://localhost:5173). The database auto-seeds on first boot with 214 realistic Bengaluru violations across 15 wards.

### Production build
```bash
cd client && npm run build
cd ../server && node index.js
```

## Demo Access

The live deploy has seeded demo accounts for admin, inspector, and field-officer roles. Credentials aren't published here — request them via [GitHub Issues](https://github.com/LordDevdeep/Infrawatch/issues) or run the project locally, where the seed script prints them to the console on first boot.

OTP login is also wired up; codes print to the server console in development mode.

## Project Structure

```
infrawatch/
├── client/                 React + Vite frontend
│   ├── public/              PWA manifest, static assets
│   └── src/
│       ├── api/              centralised API client
│       ├── components/
│       │   ├── dashboard/     CrisisResponseBanner, ImpactCard, AIInsightsPanel
│       │   ├── layout/        Sidebar, Footer
│       │   ├── map/           WardMap (Leaflet satellite layer)
│       │   └── ui/            KPI, EmptyState, AICityScanModal
│       ├── context/          Auth + Toast contexts
│       └── pages/            Dashboard, Violations, Detail, Map, Live Detection,
│                              AI Tools, SDG, Settings, Citizen Report, Login
│
├── server/                 Node + Express backend
│   ├── db/
│   │   ├── connection.js     sql.js wrapper
│   │   ├── schema.sql        11 tables incl. citizen_reports
│   │   └── seed.js           auto-seed (218 violations)
│   ├── middleware/
│   │   ├── auth.js            JWT + role enforcement
│   │   └── access.js          ward-scoped access control
│   ├── routes/
│   │   ├── auth.js, violations.js, vision.js, citizen.js,
│   │   ├── analytics.js, officers.js, notices.js, settings.js, logs.js
│   ├── services/
│   │   ├── visionAI.js        Gemini + Groq dispatcher, auto-failover
│   │   └── gemini.js          legal notice generation
│   └── index.js              server entry, /health, auto-seed on boot
│
├── render.yaml              Render deploy config
├── client/vercel.json        Vercel proxy config
└── LICENSE                   MIT
```

## Environment Variables

`server/.env`:

```env
PORT=3002
JWT_SECRET=replace_with_a_long_random_string

AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash

GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

AUTO_SEED=true       # set false to skip auto-seed on boot
AI_TIMEOUT_MS=30000  # per-AI-call timeout
```

`.env` is gitignored. Never commit it.

## API Reference

### Public (no auth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | JSON service status |
| GET | `/health` | HTML status dashboard |
| POST | `/api/citizen/report` | submit a citizen violation report |

### Authenticated (JWT)

| Method | Path | Role required |
|---|---|---|
| POST | `/api/auth/login` | open |
| POST | `/api/auth/otp-request` | open |
| POST | `/api/auth/otp-verify` | open |
| GET | `/api/auth/me` | any |
| GET | `/api/violations` | any |
| POST | `/api/violations` | inspector / commissioner / admin |
| GET | `/api/violations/crisis-feed` | any |
| PATCH | `/api/violations/:id` | inspector / commissioner / admin |
| POST | `/api/violations/bulk-action` | inspector / commissioner / admin |
| POST | `/api/vision/analyze-single` | inspector / commissioner / admin |
| POST | `/api/vision/full-pipeline` | inspector / commissioner / admin |
| POST | `/api/vision/chat` | inspector / commissioner / admin |
| GET | `/api/vision/city-scan/plan` | any |
| GET | `/api/citizen/reports` | inspector / commissioner / admin |
| GET | `/api/officers` | any |
| GET | `/api/analytics/*` | any |
| GET/PUT | `/api/settings` | admin |

## Roadmap

**Phase 1 — Prototype (current)**
Working full-stack app, real Gemini integration, 214 seeded Bengaluru violations across 15 wards, Gemini/Groq auto-failover, live on Vercel + Render, MIT-licensed.

**Phase 2 — Pilot (target: mid-2026)**
Sentinel-2 satellite feed via ESA Copernicus, WhatsApp Business API for officer dispatch, Kannada notice translation, Postgres migration, single-ward pilot with real BBMP officers and *measured* impact numbers.

**Phase 3 — Multi-city (2027)**
Mumbai / Delhi / Chennai / Hyderabad expansion, permit-PDF parsing against satellite cross-check, public RTI dashboard, drone-imagery ingestion, court-ready evidence export.

**Phase 4 — Open civic infrastructure (2028+)**
Open SDK for any Indian municipal corporation, predictive hot-zone flagging, India Stack integration (Aadhaar-verified reports, DigiLocker permits).

## License

MIT — fork it, modify it, deploy it for your own city. Attribution appreciated, not required.

---

Built for [Google Solution Challenge 2026](https://developers.google.com/community/gdsc-solution-challenge).