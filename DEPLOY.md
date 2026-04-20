# 🚀 INFRAWATCH — Free Deployment Guide

**Total time: ~60 minutes. Total cost: ₹0. No credit card required.**

This guide deploys INFRAWATCH to a public URL using only free services, with Google Gemini AI. Perfect for hackathon submission when you can't access Google Cloud due to payment issues.

---

## Stack

| Layer | Service | Cost | Card needed? |
|---|---|---|---|
| Backend | [Render.com](https://render.com) free tier | ₹0 | ❌ No |
| Frontend | [Vercel.com](https://vercel.com) hobby tier | ₹0 | ❌ No |
| AI | [Google AI Studio](https://aistudio.google.com) Gemini API | ₹0 | ❌ No |
| Source | [GitHub](https://github.com) (public repo) | ₹0 | ❌ No |

**You'll need**: a GitHub account, a Google account, and an email. That's it.

---

## Part 1 — Get a free Gemini API key (5 min)

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account
3. Click **"Create API key"** → **"Create API key in new project"**
4. **Copy the key** that starts with `AIzaSy...`
5. Save it somewhere safe — you'll paste it into Render in Part 3

✅ No credit card asked. Just a Google account. Free tier: 15 req/min, 1M tokens/day — more than enough for a demo.

---

## Part 2 — Push code to GitHub (10 min)

If your code is already on GitHub, skip to Part 3.

1. Create a free account at **https://github.com** if you don't have one
2. Click **New Repository** → name it `infrawatch` → **Public** (important for hackathon judging) → create
3. On your machine, run:

```bash
cd "C:/Users/thede/OneDrive/Desktop/Projects/illegalconstrucion"

# Create .gitignore if not present
echo "node_modules/
server/.env
client/dist/
*.log
.DS_Store" > .gitignore

git init
git add .
git commit -m "feat: INFRAWATCH prototype for GSC 2026"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/infrawatch.git
git push -u origin main
```

⚠️ **Double-check**: `server/.env` must NOT be pushed (the `.gitignore` above excludes it). Your API keys stay local.

---

## Part 3 — Deploy backend to Render (15 min)

1. Sign up free at **https://render.com** using **"Sign in with GitHub"**
2. Click **New +** → **Blueprint**
3. Connect your `infrawatch` GitHub repo
4. Render detects the `render.yaml` file and creates the service automatically
5. **Before it starts building**, click into the service settings and set these env vars:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Paste your key from Part 1 (`AIzaSy...`) |
| `GROQ_API_KEY` | Optional — leave empty or paste a free Groq key |
| `JWT_SECRET` | (Render auto-generates — leave as is) |

6. Click **Create Blueprint**. Wait ~5 minutes for first build + deploy.

7. Once green, you'll see a URL like `https://infrawatch-backend-xxxx.onrender.com` — **copy this URL**.

8. Verify it's live — visit `https://infrawatch-backend-xxxx.onrender.com/api/health` in your browser. You should see `{"status":"ok",...}`.

⚠️ **Render free tier quirk**: Services spin down after 15 min of inactivity and take ~30 sec to wake up on first request. Demo this to judges by explaining "production-grade serverless autoscale" — it's actually true.

---

## Part 4 — Deploy frontend to Vercel (10 min)

1. Sign up free at **https://vercel.com** using **"Sign in with GitHub"**
2. Click **Add New...** → **Project** → import your `infrawatch` repo
3. **Configure project** screen:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: click **Edit** → select `client`
   - Leave other defaults
4. Before clicking Deploy, open `client/vercel.json` in your repo and **replace `YOUR-RENDER-BACKEND-URL.onrender.com`** with the actual Render URL from Part 3 step 7. Commit + push the change.
5. Click **Deploy**. Wait ~2 minutes.

6. You'll get a URL like `https://infrawatch-abcde.vercel.app` — **this is your demo URL for submission**.

7. Visit it. The login page should load. Log in with `admin@infrawatch.gov.in` / `infrawatch123`.

---

## Part 5 — Database is auto-seeded ✅

Nothing to do here. On first boot, if the database is empty, the server automatically runs the seed script (218 violations across 15 wards, 6 officers, activity logs, notice templates). You'll see this in the Render logs:

```
[boot] Database is empty — running auto-seed...
✓ Database seeded successfully
[boot] Auto-seed complete.
```

On subsequent restarts (when data is already there), it skips the seed:

```
[boot] Database already has 6 users — skipping auto-seed.
```

⚠️ Render free tier resets the filesystem on redeploy, so every time you push new code the DB is re-seeded automatically. That's by design — keeps the demo consistent.

To disable auto-seeding in production (e.g. if you ever move to a persistent Postgres), set env var `AUTO_SEED=false` in Render.

---

## Part 6 — Test the full flow end-to-end (5 min)

Open your Vercel URL in a fresh browser window (Incognito works best):

1. Login as admin
2. Dashboard loads with crisis banner ✅
3. Click "⚡ Run AI City Scan" → should complete with 4 locations ✅
4. Click Violations → should show 218+ seeded violations ✅
5. Click a violation's 🛰 → opens Live Detection with pin ✅
6. AI Tools → AI Chatbot → ask "Which ward has the most cases?" → should answer with real ward names ✅

If any of these fail, check the Render logs (Dashboard → Logs tab).

---

## Part 7 — Fill out the hackathon submission (5 min)

Paste the answers from **`SUBMISSION_ANSWERS.md`** into the Hack2Skill form.

---

## Troubleshooting

### "Gemini API returned 429 rate limit"
AI Studio free tier is 15 req/min. Wait 60 seconds, or:
- Create a second API key in AI Studio and paste it as `GEMINI_API_KEY_BACKUP` (you'd need to wire up rotation — probably not worth it for a demo)
- Or set `AI_PROVIDER=groq` temporarily in Render env vars

### "My deployment is slow on first click"
This is Render's free-tier cold start (~30s). Pre-warm the demo by hitting `/api/health` 1 minute before showing judges.

### "Build failed on Render"
Check that `server/package.json` has `"start": "node index.js"` in scripts. Look at the Render build log for the exact error — almost always a missing dep or Node version mismatch.

### "CORS error in browser console"
Your Render service must allow the Vercel origin. Your `server/index.js` already uses `cors()` with no options (wildcard), so this should just work.

### "Can't connect to backend from Vercel frontend"
Check `client/vercel.json` — the `destination` URL in the `rewrites` section must EXACTLY match your Render URL (including `https://` and no trailing slash).

---

## 🎯 Submission checklist

- [ ] Render backend URL loads `/api/health` successfully
- [ ] Vercel frontend URL shows the login page
- [ ] Can login and see dashboard with crisis banner
- [ ] Database is seeded (218 violations visible)
- [ ] AI City Scan works end-to-end
- [ ] Demo video recorded and uploaded to YouTube (unlisted)
- [ ] GitHub repo is Public with the MIT LICENSE
- [ ] `SUBMISSION_ANSWERS.md` text pasted into hackathon form

Once all 8 are checked — submit! 🚀
