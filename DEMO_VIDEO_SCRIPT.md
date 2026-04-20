# 🎬 INFRAWATCH — Demo Video Script

**Target length: 3 minutes** (some hackathons cap at 2 — script also has a 2-min cut noted)
**Format: 1920×1080, screen recording with voiceover** (use OBS Studio — free)
**Tone: Confident, urgent, factual. Not salesy.**

---

## Pre-recording checklist

- [ ] Backend + frontend running locally
- [ ] Logged in as admin (`admin@infrawatch.gov.in`)
- [ ] Browser zoom at 100%, dark mode, no other tabs
- [ ] Disable browser extensions / notifications
- [ ] Pre-position scenes: dashboard loaded, violations list pre-filtered
- [ ] Mic test — speak normally, 6 inches from mic
- [ ] Have water nearby

---

## 🎙️ Full Script (3-minute version)

### Scene 1 · Opening hook (0:00 – 0:18) — 18 sec

**Visual:** Black screen → fades to news headlines montage (use a slide with 3 real headlines)

> "Dharwad, 2019: 19 people killed when an illegal building collapsed.
> Bellandur Lake, 2024: still on fire from sewage from unauthorized construction.
> Bengaluru today: 2.5 million buildings, 198 wards, 840 inspectors.
> The math doesn't work. India's cities are facing a silent urban safety crisis."

**On-screen text overlay:**
- "19 lives lost — Dharwad collapse"
- "Lake on fire — Bellandur"
- "840 officers · 198 wards · 2.5M buildings"

---

### Scene 2 · Solution intro (0:18 – 0:35) — 17 sec

**Visual:** Login page fades in, then dashboard loads showing the pulsing red CRITICAL banner

> "We built INFRAWATCH — an AI-powered Urban Safety Crisis Response Platform.
> It detects illegal construction from satellite imagery, files cases automatically, and tracks response times in hours instead of weeks."

**On-screen text:** *"INFRAWATCH · Rapid Crisis Response · Open Innovation"*

---

### Scene 3 · The Crisis Banner (0:35 – 0:55) — 20 sec

**Visual:** Zoom into Crisis Response Banner. Show the auto-rotating ticker. Hover/highlight the metric pills.

> "The dashboard opens with a live Crisis Banner — right now showing 23 critical cases requiring immediate dispatch.
> Each case has its own response SLA — 4 hours for high-confidence detections, 12 hours for medium.
> Watch the ticker auto-rotate through cases breaching their SLAs in real time."

**Action:** Click on a ticker case to navigate to its detail page (briefly — don't dwell).

---

### Scene 4 · The AI City Scan — THE WOW (0:55 – 1:35) — 40 sec

**Visual:** Back to dashboard. Click the orange "⚡ Run AI City Scan" button. Modal opens.

> "Here's what makes this rapid — the AI City Scan."

**Action:** Click "START AI SCAN" — let the live walkthrough play (~25 sec).

> "In under 30 seconds, the system picks four random Bengaluru hotspots, runs live computer vision analysis on satellite imagery using Groq's Llama 4 Scout Vision model, and for every detected violation it auto-creates a case in the database AND auto-assigns the nearest field officer through round-robin dispatch.
> No human triage. No clipboard. No 21-day waiting period."

**Visual:** Final summary card with stats — pause for 2 seconds to let viewer read.

---

### Scene 5 · End-to-end traceability (1:35 – 2:10) — 35 sec

**Visual:** Click "View All Violations →" in the modal. Show the violations list with new entries at top.

> "Every case the AI detects flows through the complete enforcement pipeline. Here's a violation that was just filed."

**Action:** Click 🛰 icon on a recent violation. Wait for the Live Detection map to load with the pulsing red pin and the case details overlay.

> "Click any case and we jump to the Live Detection map — pin highlighted at the exact GPS coordinates, full case context overlaid, ready for the officer to verify against current satellite imagery."

**Action:** Click back to violations, then click "View →" on the same case to open detail.

> "On the case detail, every violation has a Rapid Response Status card — elapsed time, SLA target, breach status, assigned officer. Plus AI-generated legal notice drafting under BBMP Act Section 321."

**Visual:** Briefly show the Rapid Response Status card with the colored SLA bar.

---

### Scene 6 · Real-world impact (2:10 – 2:35) — 25 sec

**Visual:** Scroll up to show the Impact Card on the dashboard.

> "What does this mean at scale?
> Today, BBMP processes about 840 violations per year manually.
> If INFRAWATCH is deployed across all 198 wards, projections show 12,400 violations detected per year — fourteen times more — with detection-to-notice time dropping from 21 days to 2.3 hours.
> That's 219 times faster. That's the difference between catching a fourth-floor extension while it's a foundation, and arriving after the building has collapsed."

**Visual:** Highlight the four impact stats one by one (zoom or pulse).

---

### Scene 7 · Tech + close (2:35 – 3:00) — 25 sec

**Visual:** Quick montage — show AI Features chatbot answering a question, then return to dashboard.

> "INFRAWATCH is built on React, Express, Groq Vision AI, and is fully open-source under MIT license — ready to be forked for any Indian city.
> The codebase is at github-dot-com slash YOUR-USERNAME slash infrawatch.
> A live demo is at infrawatch-dot-app.
> This is a working prototype. Phase 2 will integrate Google Earth Engine, BBMP's permit database, citizen reporting, and WhatsApp dispatch.
> Built by students. Engineered for crisis. Open for cities."

**Final on-screen text:**
- "INFRAWATCH"
- "Open source · MIT"
- "Built for Google Solution Challenge 2026"
- "Theme: Rapid Crisis Response · Open Innovation"

---

## ✂️ 2-minute cut (if hackathon caps at 2 min)

Drop:
- Scene 5 (end-to-end traceability) — keep only the pin+overlay shot, drop detail page
- Scene 7 — compress to 10 sec, just the close

Keep these in full: Scenes 1, 2, 3, 4, 6.

---

## 🎤 Voiceover tips

- **Don't read like a teleprompter.** Practice 3 times so it sounds conversational.
- **Pause after big numbers.** "Twelve thousand four hundred — *(beat)* — violations per year."
- **Lower your voice on impact lines.** Whisper-style works for "the building has collapsed."
- **Energy spike on the AI City Scan** — that's your wow moment.

---

## 🎬 Recording setup

**Software:** OBS Studio (free) — record at 1920×1080, 30fps, MP4 output.

**Mic:** Use a wired headset or the built-in mic with `Krisp` (free noise cancellation). Avoid AirPods — they sound tinny.

**Screen:** Browser only, fullscreen (F11). Hide the bookmark bar.

**Cursor:** Enable "highlight cursor" in OBS so viewers can follow your clicks.

**Editing:** DaVinci Resolve (free) or CapCut (free) — just trim, no fancy transitions. Add a 2-second intro card and 2-second outro card.

---

## 📤 Upload checklist

- [ ] YouTube **Unlisted** (don't make it Public until submission day)
- [ ] Title: *"INFRAWATCH — Urban Safety Crisis Response | Google Solution Challenge 2026"*
- [ ] Description: paste your README impact summary
- [ ] Thumbnail: dashboard with the red Crisis Banner pulsing
- [ ] Add the YouTube link to your hackathon submission

---

## ⚠️ Common mistakes to avoid

❌ Showing the loading spinner for too long — pre-load everything
❌ Talking over a silent UI — narrate WHILE clicking
❌ "Um", "uh", "so basically" — re-record those takes
❌ Reading the UI text out loud verbatim — the viewer can read
❌ Music louder than your voice — keep music at 15% if used
❌ Going over time limit — judges stop watching at the cutoff

---

**Good luck. You've got 3 minutes to convince a judge to remember you out of 1700 teams. Make every second count.**
