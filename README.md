# 🛰️ INFRAWATCH

> **Urban Safety Crisis Response Platform** — AI-powered satellite detection of illegal construction with SLA-tracked enforcement workflow for Indian municipal corporations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Theme](https://img.shields.io/badge/Theme-Rapid_Crisis_Response-red)](#)
[![Stack](https://img.shields.io/badge/Stack-React_+_Express_+_Groq_Vision-blue)](#)
[![Status](https://img.shields.io/badge/Status-Working_Prototype-green)](#)

---

## 🚨 The Crisis

India's metropolitan cities face a **silent urban safety crisis**:

- Bengaluru loses an estimated **₹650+ crore/year** to unauthorized construction
- Lake encroachment near Bellandur, Varthur, Hebbal contributes to flooding affecting 100,000+ residents
- The 2019 Dharwad building collapse killed 19 people in an unauthorized structure
- BBMP has only **~840 enforcement officers** to manually inspect **198 wards** with **2.5 million buildings**
- Average detection-to-notice time today: **21+ days** — too late to prevent damage or collapse

**Manual enforcement cannot scale. Crisis demands rapid, AI-powered response.**

---

## 💡 The Solution

**INFRAWATCH** is a working AI platform that:

1. **Detects** unauthorized construction from satellite imagery using computer vision
2. **Triages** every case by SLA based on confidence + risk severity (4h / 12h / 24h targets)
3. **Auto-files** violations and round-robin assigns them to the nearest field officer
4. **Generates** legal enforcement notices using AI under BBMP Act Section 321
5. **Tracks** every case to closure with audit logs, feedback loops, and SLA breach alerts

### 📊 Projected Real-World Impact

If deployed across BBMP's 198 wards:

| Metric | Manual Status Quo | With INFRAWATCH | Improvement |
|---|---|---|---|
| Violations detected per year | ~840 | **~12,400** | **14.7×** |
| Avg detection-to-notice time | 21 days | **2.3 hours** | **219×** faster |
| Officer hours saved per ward / month | 0 | **38 hrs** | — |
| Penalty recovery (estimated) | ₹84 Cr/yr | **₹1,240 Cr/yr** | **14.7×** |
| Citizen reports actionable | <5% | **45%+** (with public portal) | **9×** |

*(Projections derived from BBMP's published 2023 enforcement statistics × inspection-coverage uplift modeled from satellite-monitoring case studies in Mumbai and Delhi NCR. Real numbers will be measured in pilot.)*

---

## 🎯 Hackathon Theme Alignment

> **"Rapid Crisis Response — Open Innovation"**

Every feature is built around the *rapid* and *crisis* keywords:

- ⚡ **AI City Scan** — multi-ward live AI scan in <30 seconds, auto-files violations + assigns officers
- 🚨 **Crisis Response Banner** — live-polling crisis level with auto-rotating ticker of breached SLAs
- ⏱️ **Per-case SLA tracking** — 4-hour response target for ≥90% confidence detections
- 📍 **Live Detection map** — drop a pin on any case, scan satellite imagery on demand
- 🛰️ **Satellite-first** — covers what no manual inspector can reach

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Leaflet (satellite map), pure CSS |
| Backend | Node.js, Express, sql.js (SQLite), JWT auth, bcrypt |
| AI / Vision | **Google Gemini 2.5 Flash (primary)** (image analysis), **Llama 3.3 70B** (text gen), Gemini 2.0 Flash fallback |
| Satellite | ESRI World Imagery (display), seeded hotspot data (demo reliability), real Groq Vision on every other location |
| Infra | Single Node server (deploys to Render / Cloud Run / any host) |

### Production Roadmap (June final submission)

- 🌍 **Google Earth Engine** — petabyte-scale historical satellite analysis (5 years of change detection per plot)
- 🤖 **Vertex AI Gemini 2.5** — bilingual (Kannada/English) legal notice generation
- 🔥 **Firebase Auth** — Google sign-in for officers, phone OTP for citizen reports
- 📱 **Citizen reporting portal** — public submissions with photo + GPS, no login required
- 📲 **WhatsApp dispatch** — instant officer notification via MSG91/Twilio for CRITICAL alerts
- ☁️ **Cloud Run + Postgres** — serverless production deployment, auto-scales to city-wide load
- 📄 **Document AI** — automatic permit PDF parsing → compare against satellite reality

---

## 🚀 Quickstart

### Prerequisites
- Node.js 18+
- npm 9+
- A free Groq API key from [console.groq.com](https://console.groq.com/keys)

### Install & seed

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/infrawatch.git
cd infrawatch

# Install root + client + server deps
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your GROQ_API_KEY

# Seed the demo database (218 violations across 15 wards, 6 officers, 10 activity logs)
npm run seed

# Run dev servers (client + server in parallel)
npm run dev
```

Open http://localhost:5173 in your browser.

### Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@infrawatch.gov.in` | `infrawatch123` |
| Inspector | `priya.menon@bbmp.gov.in` | `infrawatch123` |
| Field Officer | `suresh.kumar@bbmp.gov.in` | `infrawatch123` |

Or use the OTP login flow — codes print to the server console in dev mode.

---

## 🎬 5-Minute Demo Walkthrough

1. **Login** as admin → Dashboard loads with **CRITICAL Crisis Response banner** pulsing red, auto-rotating ticker of cases breaching their SLA
2. Click **"⚡ Run AI City Scan"** → live multi-ward AI scan walks through 4 random hotspots, auto-files violations and round-robin assigns officers in <30 seconds
3. Navigate to **Violations** → click 🛰 on any case → jumps to Live Detection with **highlighted pin + full case details overlay**
4. On Live Detection, navigate to a hotspot → click **"SCAN THIS AREA"** → AI returns mixed results (red violations / yellow warnings / green cleared) with bounding boxes; click "Add to Violations" on any to file + assign
5. Open a **violation detail page** → see RAPID RESPONSE STATUS card with SLA progress bar, elapsed time, breach warnings, and assigned officer
6. Click **AI Features** → AI Chatbot answers questions about cases; Smart Alerts AI-prioritize the queue

---

## 📁 Architecture

```
infrawatch/
├── client/                       # React + Vite frontend
│   ├── src/
│   │   ├── pages/                # Dashboard, Violations, Detail, Map, Live Detection, AI Features, Settings
│   │   ├── components/
│   │   │   ├── dashboard/        # CrisisResponseBanner (live polling, SLA ticker)
│   │   │   ├── ui/               # AICityScanModal, KPI cards, etc.
│   │   │   └── map/              # WardMap (satellite with violation pins)
│   │   ├── api/client.js         # All backend API calls
│   │   └── context/              # Auth + Toast contexts
│   └── vite.config.js            # Proxies /api to backend
│
├── server/                       # Node + Express backend
│   ├── routes/
│   │   ├── auth.js               # JWT login + OTP flow
│   │   ├── violations.js         # CRUD + crisis-feed + bulk actions + create-from-scan
│   │   ├── vision.js             # AI vision endpoints + city-scan/plan
│   │   ├── analytics.js          # Dashboard metrics
│   │   ├── officers.js           # Team & assignment
│   │   ├── notices.js            # Legal notice generation (template + AI)
│   │   └── settings.js           # System config
│   ├── services/
│   │   ├── visionAI.js           # Groq + Gemini vision wrapper
│   │   └── aiClassifier.js       # Standalone classifier (fallback chain)
│   ├── middleware/
│   │   ├── auth.js               # JWT + role enforcement
│   │   └── access.js             # Ward-scoped access control
│   └── db/
│       ├── connection.js         # sql.js wrapper
│       ├── schema.sql            # Full schema (10 tables)
│       └── seed.js               # 218 violations + 6 officers + activity
│
├── LICENSE                       # MIT
├── CONTRIBUTING.md               # Contribution guide
├── README.md                     # This file
└── package.json                  # Root scripts
```

---

## 🔐 Security & Honesty Notes

Transparency wins. Here's what's real and what's a demo shortcut:

| What | Status | Notes |
|---|---|---|
| **Hotspot detection data** | 🟡 Seeded | 8 pre-defined Bengaluru locations return seeded detection data with mixed severity. Production scans elsewhere route to real Groq Vision AI on actual satellite imagery. By design — demos must work even when AI is rate-limited. |
| **Real AI calls** | 🟢 Live | Every non-hotspot scan, every chatbot query, every legal notice generation hits the live Groq Vision / Llama 3.3 API. |
| **Permit verification** | 🟡 Mocked | Returns sample match scores. Phase 2: integrate actual BBMP permit registry. |
| **Database** | 🟡 In-memory `sql.js` | Zero-setup demos. Production swap-in to PostgreSQL is a single-file change in `server/db/connection.js`. |
| **JWT auth** | 🟢 Real | Production-grade JWT. Has a dev fallback secret — set `JWT_SECRET` in production. |
| **Crisis SLA tracking** | 🟢 Real | Calculated from actual violation `created_at` timestamps. |
| **Officer assignment** | 🟢 Real | Round-robin across actual seeded officer accounts. |

### Security bugs fixed during development
- ✅ SQL injection in feedback activity log (parameterized)
- ✅ Race condition on violation ID generation (retry-on-collision loop)
- ✅ Missing `requireRole` on notes endpoint
- ✅ sql.js transaction wrapper bypassed in settings + bulk-actions

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md). Open-source under MIT — fork it, deploy it for your own city, or build on top.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE).

---

## 🙏 Acknowledgments

- **Groq** — fast, free LLM inference (Llama 4 Scout Vision + Llama 3.3 70B)
- **ESRI** — World Imagery satellite tiles
- **Leaflet** — open-source maps library
- Built for **Google Solution Challenge 2026** under the *Rapid Crisis Response · Open Innovation* theme.

---

**Built by students. Engineered for crisis. Open for cities.**
#   I n f r a w a t c h  
 