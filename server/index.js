import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import { initDb, getDb } from './db/connection.js';

import authRoutes from './routes/auth.js';
import violationsRoutes from './routes/violations.js';
import analyticsRoutes from './routes/analytics.js';
import officersRoutes from './routes/officers.js';
import noticesRoutes from './routes/notices.js';
import settingsRoutes from './routes/settings.js';
import logsRoutes from './routes/logs.js';
import visionRoutes from './routes/vision.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize DB before starting server
await initDb();

// Auto-seed if database is empty (first-boot on Render/any fresh deployment)
// Skips if AUTO_SEED=false (set this env var if you want to disable)
if (process.env.AUTO_SEED !== 'false') {
  try {
    const db = getDb();
    const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get()?.n || 0;
    if (userCount === 0) {
      console.log('[boot] Database is empty — running auto-seed...');
      const { runSeed } = await import('./db/seed.js');
      await runSeed();
      console.log('[boot] Auto-seed complete.');
    } else {
      console.log(`[boot] Database already has ${userCount} users — skipping auto-seed.`);
    }
  } catch (err) {
    console.error('[boot] Auto-seed check failed:', err.message);
    // Don't crash the server — it's still usable without demo data
  }
}

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/violations', violationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/officers', officersRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/vision', visionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  INFRAWATCH Server                       ║`);
  console.log(`║  Running on http://localhost:${PORT}         ║`);
  console.log(`║  Satellite-LED Municipal Enforcement Grid ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
});
