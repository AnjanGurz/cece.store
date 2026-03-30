// ====================================================
//  server.js  —  CeCe Store Backend
//
//  Stack: Node.js + Express
//  Deploy target: Render free tier
//  Storage: products.json (file-based, no DB required)
//
//  Features:
//    - REST API for products (CRUD)
//    - JWT admin authentication
//    - Site settings + social links API
//    - Analytics event ingestion
//    - Backup / restore products
//    - CORS locked to allowed origins
//    - Rate limiting + helmet security headers
// ====================================================

require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const authRouter     = require('./routes/auth');
const productsRouter = require('./routes/products');
const settingsRouter = require('./routes/settings');
const analyticsRouter = require('./routes/analytics');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ────────────────────────────────────────────
// Allow your Netlify frontend + localhost dev server.
// Update ALLOWED_ORIGINS in the .env file before deploy.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5500,http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (e.g. curl, Render health-checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── SECURITY HEADERS ────────────────────────────────
app.use(helmet());

// ── BODY PARSING ────────────────────────────────────
app.use(express.json({ limit: '512kb' }));

// ── GLOBAL RATE LIMITER ─────────────────────────────
// Prevents abuse even on the free tier.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── ROUTES ──────────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/products',  productsRouter);
app.use('/api/settings',  settingsRouter);
app.use('/api/analytics', analyticsRouter);

// ── HEALTH CHECK ─────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root info
app.get('/', (_req, res) => {
  res.json({
    name: 'CeCe Store API',
    version: '1.0.0',
    endpoints: ['/api/products', '/api/auth', '/api/settings', '/api/analytics', '/health'],
  });
});

// ── 404 ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── ERROR HANDLER ────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── START ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CeCe API running on port ${PORT}`);
});

module.exports = app;
