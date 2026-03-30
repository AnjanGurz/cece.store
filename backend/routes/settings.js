// ====================================================
//  routes/settings.js
//  Site settings + social links + banner management.
//
//  GET  /api/settings       → fetch all settings (public)
//  PUT  /api/settings       → update settings (admin)
// ====================================================

const express = require('express');
const { readJSON, writeJSON } = require('../lib/fileStore');
const { requireAuth }         = require('../middleware/auth');

const router = express.Router();

// Sanitize incoming settings — strip internal fields
function sanitizeSettings(body, existing) {
  const allowed = [
    'brandName', 'tagline', 'heroText', 'heroSubtitle',
    'ctaText', 'announcement', 'contactPhone', 'orderHandle',
    'socials', 'theme', 'orderMessageTemplate', 'inquiryMessageTemplate',
  ];

  const merged = { ...existing };
  for (const key of allowed) {
    if (body[key] !== undefined) merged[key] = body[key];
  }

  // Always preserve internal auth hash
  if (existing.__adminHash) merged.__adminHash = existing.__adminHash;

  return merged;
}

// ── GET /api/settings ─────────────────────────────────
// Public — the frontend reads this to hydrate social links,
// announcement banner, and branding.
router.get('/', (_req, res) => {
  try {
    const full     = readJSON('settings.json');
    // Strip internal fields before sending to the public
    const { __adminHash, ...publicSettings } = full; // eslint-disable-line no-unused-vars
    res.json(publicSettings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/settings ─────────────────────────────────
// Admin only.
router.put('/', requireAuth, (req, res) => {
  try {
    const existing  = readJSON('settings.json');
    const sanitized = sanitizeSettings(req.body, existing);
    writeJSON('settings.json', sanitized);
    const { __adminHash, ...publicSettings } = sanitized; // eslint-disable-line no-unused-vars
    res.json({ message: 'Settings updated.', settings: publicSettings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
