require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { getDb } = require('./db/database');
const { seedDatabase } = require('./db/seed');

const authRoutes       = require('./routes/auth');
const navigationRoutes = require('./routes/navigation');
const locationRoutes   = require('./routes/locations');
const crowdRoutes      = require('./routes/crowd');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Init DB + Seed ──────────────────────────────────────────────────────────
getDb(); // initialise schema
seedDatabase();

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/locations',  locationRoutes);
app.use('/api/crowd',      crowdRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n Smart Campus Navigation API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
