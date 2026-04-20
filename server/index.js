import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import { initDb } from './db/connection.js';

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
