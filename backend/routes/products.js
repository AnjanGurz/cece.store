// ====================================================
//  routes/products.js
//  Full CRUD for products.
//
//  GET    /api/products          → list all (public)
//  GET    /api/products/:id      → single product (public)
//  POST   /api/products          → create (admin)
//  PUT    /api/products/:id      → update (admin)
//  DELETE /api/products/:id      → delete (admin)
//  POST   /api/products/bulk-import → replace all (admin)
//  GET    /api/products/export      → download JSON (admin)
//  GET    /api/products/backups     → list backups (admin)
//  POST   /api/products/restore     → restore backup (admin)
//  POST   /api/products/:id/view    → record a view (public)
// ====================================================

const express = require('express');
const { readJSON, writeJSON, createBackup, listBackups, restoreBackup } = require('../lib/fileStore');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Helpers ─────────────────────────────────────────

function loadStore() {
  return readJSON('products.json');
}

function saveStore(store) {
  writeJSON('products.json', store);
}

function nextId(products) {
  if (!products.length) return 1;
  return Math.max(...products.map(p => p.id)) + 1;
}

const VALID_STATUSES  = ['in', 'limited', 'out'];
const VALID_CATEGORIES = ['hoodies', 'tshirts', 'accessories'];

function validateProduct(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required.');
  }
  if (body.price === undefined || isNaN(Number(body.price)) || Number(body.price) < 0) {
    errors.push('price must be a non-negative number.');
  }
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }
  if (body.category && !VALID_CATEGORIES.includes(body.category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
  }
  if (body.sizes !== undefined && !Array.isArray(body.sizes)) {
    errors.push('sizes must be an array.');
  }
  return errors;
}

function sanitizeProduct(body, existing = {}) {
  return {
    ...existing,
    name:        String(body.name || existing.name || '').trim(),
    price:       Number(body.price ?? existing.price ?? 0),
    status:      VALID_STATUSES.includes(body.status) ? body.status : (existing.status || 'in'),
    category:    VALID_CATEGORIES.includes(body.category) ? body.category : (existing.category || 'tshirts'),
    isNew:       Boolean(body.isNew ?? existing.isNew ?? false),
    sizes:       Array.isArray(body.sizes) ? body.sizes : (existing.sizes || []),
    img:         String(body.img || existing.img || '').trim(),
    igLink:      String(body.igLink || existing.igLink || '').trim(),
    description: String(body.description || existing.description || '').trim(),
    tags:        Array.isArray(body.tags) ? body.tags : (existing.tags || []),
    colors:      Array.isArray(body.colors) ? body.colors : (existing.colors || []),
    views:       Number(existing.views || 0),
    updatedAt:   new Date().toISOString(),
  };
}

// ── GET /api/products ─────────────────────────────────
// Public. Supports ?category=, ?status=, ?sort=, ?q= query params.
router.get('/', (req, res) => {
  try {
    const store    = loadStore();
    let products   = [...store.products];

    // Filter
    const { category, status, q, sort } = req.query;
    if (category) products = products.filter(p => p.category === category);
    if (status)   products = products.filter(p => p.status === status);
    if (q) {
      const query = q.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
      );
    }

    // Sort
    if (sort === 'price_asc')  products.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
    if (sort === 'name_asc')   products.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'newest')     products = products.filter(p => p.isNew).concat(products.filter(p => !p.isNew));

    res.json({ catalogVersion: store.catalogVersion, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/export ─────────────────────────
router.get('/export', requireAuth, (_req, res) => {
  try {
    const store = loadStore();
    res.setHeader('Content-Disposition', 'attachment; filename="products_export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(store, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/backups ─────────────────────────
router.get('/backups', requireAuth, (_req, res) => {
  try {
    const backups = listBackups('products');
    res.json({ backups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/products/restore ────────────────────────
router.post('/restore', requireAuth, (req, res) => {
  try {
    const { backupFilename } = req.body;
    if (!backupFilename) return res.status(400).json({ error: 'backupFilename is required.' });

    const restored = restoreBackup(backupFilename);
    // Take a safety backup of current data before overwriting
    createBackup('products.json');
    writeJSON('products.json', restored);
    res.json({ message: `Restored from ${backupFilename}.`, data: restored });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/:id ─────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const id      = parseInt(req.params.id, 10);
    const store   = loadStore();
    const product = store.products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/products ────────────────────────────────
router.post('/', requireAuth, (req, res) => {
  try {
    const errors = validateProduct(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const store   = loadStore();
    const newProduct = sanitizeProduct(req.body);
    newProduct.id        = nextId(store.products);
    newProduct.createdAt = new Date().toISOString();

    createBackup('products.json');
    store.products.push(newProduct);
    store.catalogVersion = new Date().toISOString().slice(0, 10) + '-v' + store.products.length;
    saveStore(store);

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/products/bulk-import ───────────────────
router.post('/bulk-import', requireAuth, (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: 'products array is required.' });

    const store = loadStore();
    createBackup('products.json');

    let id = store.products.length ? Math.max(...store.products.map(p => p.id)) + 1 : 1;
    const importedProducts = products.map(p => {
      const sanitized  = sanitizeProduct(p);
      sanitized.id     = p.id || id++;
      sanitized.createdAt = sanitized.createdAt || new Date().toISOString();
      return sanitized;
    });

    store.products       = importedProducts;
    store.catalogVersion = new Date().toISOString().slice(0, 10) + '-import';
    saveStore(store);

    res.json({ message: `Imported ${importedProducts.length} products.`, products: importedProducts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/products/:id ─────────────────────────────
router.put('/:id', requireAuth, (req, res) => {
  try {
    const id    = parseInt(req.params.id, 10);
    const store = loadStore();
    const idx   = store.products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found.' });

    const errors = validateProduct({ ...store.products[idx], ...req.body });
    if (errors.length) return res.status(400).json({ errors });

    createBackup('products.json');
    store.products[idx]  = sanitizeProduct(req.body, store.products[idx]);
    store.catalogVersion = new Date().toISOString().slice(0, 10) + '-v' + store.products.length;
    saveStore(store);

    res.json(store.products[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/products/:id ──────────────────────────
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const id    = parseInt(req.params.id, 10);
    const store = loadStore();
    const idx   = store.products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found.' });

    createBackup('products.json');
    const [removed] = store.products.splice(idx, 1);
    store.catalogVersion = new Date().toISOString().slice(0, 10) + '-v' + store.products.length;
    saveStore(store);

    res.json({ message: `Deleted "${removed.name}".` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/products/:id/view ───────────────────────
// Public endpoint — increments the view counter.
router.post('/:id/view', (req, res) => {
  try {
    const id    = parseInt(req.params.id, 10);
    const store = loadStore();
    const idx   = store.products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found.' });

    store.products[idx].views = (store.products[idx].views || 0) + 1;
    saveStore(store);
    res.json({ views: store.products[idx].views });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
