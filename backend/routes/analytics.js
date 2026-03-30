// ====================================================
//  routes/analytics.js
//  Lightweight event ingest for product interactions.
//
//  POST /api/analytics/event  → record event (public)
//  GET  /api/analytics        → get summary (admin)
//  DELETE /api/analytics      → clear events (admin)
// ====================================================

const express = require('express');
const { readJSON, writeJSON } = require('../lib/fileStore');
const { requireAuth }         = require('../middleware/auth');

const router = express.Router();

const VALID_EVENTS = ['view', 'order_click', 'quick_view', 'filter_used'];
const MAX_EVENTS   = 5000; // cap file size

// ── POST /api/analytics/event ─────────────────────────
router.post('/event', (req, res) => {
  try {
    const { event, productId, meta } = req.body;

    if (!event || !VALID_EVENTS.includes(event)) {
      return res.status(400).json({ error: `event must be one of: ${VALID_EVENTS.join(', ')}` });
    }

    const record = {
      event,
      productId: productId ? Number(productId) : null,
      meta:      typeof meta === 'object' ? meta : {},
      timestamp: new Date().toISOString(),
    };

    let events = [];
    try { events = readJSON('analytics.json'); } catch (_) {}
    if (!Array.isArray(events)) events = [];

    events.unshift(record);
    if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;

    writeJSON('analytics.json', events);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics ────────────────────────────────
router.get('/', requireAuth, (_req, res) => {
  try {
    let events = [];
    try { events = readJSON('analytics.json'); } catch (_) {}
    if (!Array.isArray(events)) events = [];

    // Build a simple summary
    const summary = {};
    for (const e of events) {
      const key = `${e.event}${e.productId ? ':' + e.productId : ''}`;
      summary[key] = (summary[key] || 0) + 1;
    }

    res.json({ total: events.length, summary, recent: events.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/analytics ─────────────────────────────
router.delete('/', requireAuth, (_req, res) => {
  try {
    writeJSON('analytics.json', []);
    res.json({ message: 'Analytics cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
