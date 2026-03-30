// ====================================================
//  routes/auth.js
//  Admin login + token refresh.
//  POST /api/auth/login
//  POST /api/auth/change-password
// ====================================================

const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { readJSON, writeJSON } = require('../lib/fileStore');
const { requireAuth }         = require('../middleware/auth');

const router = express.Router();

// Stricter rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
});

// ── Helpers ─────────────────────────────────────────

function getAdminHash() {
  // Try settings file first; fall back to .env plain-text (hashed on-the-fly).
  try {
    const cfg = readJSON('settings.json');
    if (cfg.__adminHash) return cfg.__adminHash;
  } catch (_) {}
  // First-time: hash the env password and persist it.
  const plain = process.env.ADMIN_PASSWORD || 'cece2024';
  const hash  = bcrypt.hashSync(plain, 10);
  persistAdminHash(hash);
  return hash;
}

function persistAdminHash(hash) {
  try {
    const cfg = readJSON('settings.json');
    cfg.__adminHash = hash;
    writeJSON('settings.json', cfg);
  } catch (_) {}
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '12h' });
}

// ── POST /api/auth/login ─────────────────────────────

/**
 * Body: { password: string }
 * Returns: { token: string, expiresIn: '12h' }
 */
router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const hash  = getAdminHash();
  const valid = bcrypt.compareSync(password, hash);

  if (!valid) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = signToken({ role: 'admin' });
  res.json({ token, expiresIn: '12h' });
});

// ── POST /api/auth/change-password ───────────────────

/**
 * Requires: Authorization: Bearer <token>
 * Body: { currentPassword: string, newPassword: string }
 */
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const hash  = getAdminHash();
  const valid = bcrypt.compareSync(currentPassword, hash);

  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  persistAdminHash(newHash);

  res.json({ message: 'Password updated successfully.' });
});

// ── GET /api/auth/verify ─────────────────────────────
// Lightweight token validity check used by the dashboard.
router.get('/verify', requireAuth, (_req, res) => {
  res.json({ valid: true, role: 'admin' });
});

module.exports = router;
