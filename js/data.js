/* ============================================
   js/data.js
   Single source of truth for all data.

   Fetch strategy (in priority order):
     1. Render backend API (CECE_API_URL)
     2. Local catalog/products.json (offline / dev)
     3. localStorage cache (instant paint)
   ============================================ */

const CeceData = (() => {

  // ── CONFIG ──
  // Set this before deploying to point at your Render service.
  // Example: 'https://cece-store-api.onrender.com'
  // If empty, falls back to the local catalog JSON file.
  const CECE_API_URL = window.CECE_API_URL || '';

  // ── STORAGE KEYS ──
  const KEYS = {
    password: 'cece_admin_pass',
    products: 'cece_products',
    socials:  'cece_socials',
    catalogVersion: 'cece_catalog_version',
    theme: 'cece_theme_mode',
    recentlyViewed: 'cece_recently_viewed',
    apiToken: 'cece_api_token',
  };

  // ── DEFAULTS ──
  const DEFAULT_PASSWORD = 'cece2024';

  const DEFAULT_PRODUCTS = [
    {
      id: 1,
      name: 'CeCe Black Jacket',
      price: 2900,
      status: 'in',
      sizes: ['S','M','L','XL','XXL'],
      img: './Images/black_jacket.jpeg',
      category: 'hoodies',
      isNew: true,
    },
  ];

  const CATALOG_URL = './catalog/products.json';
  let catalogHydrated = false;


  const DEFAULT_SOCIALS = {
    ig: 'https://www.instagram.com/cece.craftofficial/',
    fb: 'https://www.facebook.com/profile.php?id=61582251825771',
  };

  const DEFAULT_SETTINGS = {
    brandName: 'CeCe',
    orderHandle: 'cece.craftofficial',
    contactPhone: '+977 98XXXXXXXX',
    orderMessageTemplate: [
      'Namaste {brand_name}, I want to order: {product_name}',
      'Price: NPR {price}',
      'Size: {sizes}',
      'Instagram: @cece.craftofficial'
    ].join('\n'),
    inquiryMessageTemplate: [
      'Namaste {brand_name}, I found you through your website.',
      'I want to know more about your latest collection.',
      'Please share available pieces and sizes.'
    ].join('\n'),
    analytics: {
      provider: 'none', // 'none' | 'ga4' | 'plausible'
      gaMeasurementId: '',
      plausibleDomain: '',
    },
  };

  // ── HELPERS ──
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('CeceData load error:', e);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('CeceData save error:', e);
      return false;
    }
  }

  function inferCategory(name = '') {
    const value = String(name).toLowerCase();
    if (value.includes('hood') || value.includes('jacket')) return 'hoodies';
    return 'tshirts';
  }

  function normalizeProduct(product) {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    return {
      ...product,
      category: product.category || inferCategory(product.name),
      isNew: Boolean(product.isNew),
      sizes,
    };
  }

  function normalizeProducts(products) {
    if (!Array.isArray(products)) return DEFAULT_PRODUCTS.map(normalizeProduct);
    return products.map(normalizeProduct);
  }

  function getInstagramUsername() {
    const socials = load(KEYS.socials, DEFAULT_SOCIALS);
    const fromUrl = String(socials.ig || '').match(/instagram\.com\/([^/?#]+)/i);
    const configured = load('cece_settings', DEFAULT_SETTINGS).orderHandle;
    return (configured || (fromUrl ? fromUrl[1] : '') || '').replace('@', '').trim();
  }

  function applyMessageTemplate(template, replacements) {
    return String(template || '')
      .replaceAll('{brand_name}', replacements.brandName || 'CeCe')
      .replaceAll('{product_name}', replacements.productName || '')
      .replaceAll('{price}', replacements.price || '')
      .replaceAll('{sizes}', replacements.sizes || '[Please mention size]')
      .replaceAll('{contact_phone}', replacements.contactPhone || '')
      .trim();
  }

  async function fetchWithTimeout(url, options = {}, timeout = 3000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function hydrateFromCatalog(force = false) {
    if (catalogHydrated && !force) return true;

    // ── Strategy 1: Render backend API ──────────────────
    if (CECE_API_URL) {
      try {
        const res = await fetchWithTimeout(`${CECE_API_URL}/api/products`, { cache: 'no-cache' }, 2200);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();

        const incomingProducts = Array.isArray(data.products) ? data.products : null;
        if (!incomingProducts) throw new Error('API missing products array');

        const remoteVersion = String(data.catalogVersion || '').trim();
        const localVersion  = (localStorage.getItem(KEYS.catalogVersion) || '').trim();
        const localProducts = load(KEYS.products, null);
        const hasLocal      = Array.isArray(localProducts) && localProducts.length > 0;
        const shouldSync    = force || !hasLocal || (!!remoteVersion && remoteVersion !== localVersion);

        if (shouldSync) {
          save(KEYS.products, normalizeProducts(incomingProducts));
          if (remoteVersion) localStorage.setItem(KEYS.catalogVersion, remoteVersion);
        }

        // Hydrate settings + socials from API
        try {
          const sRes = await fetchWithTimeout(`${CECE_API_URL}/api/settings`, { cache: 'no-cache' }, 1800);
          if (sRes.ok) {
            const settings = await sRes.json();
            if (settings.socials) save(KEYS.socials, settings.socials);
            save('cece_settings', {
              ...DEFAULT_SETTINGS,
              ...load('cece_settings', DEFAULT_SETTINGS),
              ...settings,
            });
            // Apply live announcement banner if present
            if (settings.announcement) {
              renderAnnouncementBanner(settings.announcement);
            }
          }
        } catch (_) {}

        catalogHydrated = true;
        return true;
      } catch (apiError) {
        console.warn('CeceData API hydrate failed, falling back to catalog JSON:', apiError.message);
      }
    }

    // ── Strategy 2: Local catalog JSON ──────────────────
    try {
      const res = await fetchWithTimeout(CATALOG_URL, { cache: 'no-cache' }, 2500);
      if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);

      const catalog = await res.json();
      const incomingProducts = Array.isArray(catalog.products) ? catalog.products : null;
      if (!incomingProducts) throw new Error('Catalog JSON missing products array');

      const remoteVersion = String(catalog.catalogVersion || '').trim();
      const localVersion = (localStorage.getItem(KEYS.catalogVersion) || '').trim();
      const localProducts = load(KEYS.products, null);
      const hasLocalProducts = Array.isArray(localProducts) && localProducts.length > 0;

      const shouldSync = force || !hasLocalProducts || (!!remoteVersion && remoteVersion !== localVersion);
      if (shouldSync) {
        save(KEYS.products, normalizeProducts(incomingProducts));
        if (catalog.socials && typeof catalog.socials === 'object') {
          save(KEYS.socials, catalog.socials);
        }
      }

      if (remoteVersion) {
        localStorage.setItem(KEYS.catalogVersion, remoteVersion);
      }

      catalogHydrated = true;
      return true;
    } catch (error) {
      console.warn('CeceData catalog hydrate skipped:', error.message);
      catalogHydrated = true;
      return false;
    }
  }

  // Inject a dismissible announcement banner at the top of the page
  function renderAnnouncementBanner(text) {
    if (!text || document.getElementById('cece-announcement')) return;
    const banner = document.createElement('div');
    banner.id = 'cece-announcement';
    banner.innerHTML = `
      <span>${text}</span>
      <button onclick="this.parentElement.remove()" aria-label="Dismiss">×</button>
    `;
    document.body.prepend(banner);
  }

  // ── API HELPERS (used by admin dashboard) ───────────
  function getApiToken() {
    return localStorage.getItem(KEYS.apiToken) || '';
  }

  function setApiToken(token) {
    localStorage.setItem(KEYS.apiToken, token);
  }

  function clearApiToken() {
    localStorage.removeItem(KEYS.apiToken);
  }

  async function apiFetch(path, options = {}) {
    if (!CECE_API_URL) throw new Error('No API URL configured.');
    const token = getApiToken();
    const resp = await fetch(`${CECE_API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.error || `API error ${resp.status}`);
    }
    return resp.json();
  }

  // ── PUBLIC API ──
  return {

    hydrateFromCatalog,

    // API config
    getApiUrl()               { return CECE_API_URL; },
    getApiToken,
    setApiToken,
    clearApiToken,
    apiFetch,

    // High-level Cloud API methods (used by admin dashboard)
    async loginToApi(password) {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (data.token) setApiToken(data.token);
      return data;
    },

    async logoutFromApi() {
      clearApiToken();
    },

    isApiConnected() {
      return !!CECE_API_URL && !!getApiToken();
    },

    async apiSaveProduct(product) {
      if (product.id && typeof product.id === 'number') {
        return apiFetch(`/api/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(product),
        });
      }
      return apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
    },

    async apiDeleteProduct(id) {
      return apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    },

    async apiUpdateSettings(settings) {
      return apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    async fetchSettings() {
      if (!CECE_API_URL) return null;
      return apiFetch('/api/settings');
    },

    async trackEvent(eventName, productId) {
      if (!CECE_API_URL) return;
      try {
        await fetch(`${CECE_API_URL}/api/analytics/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: eventName, productId, url: location.pathname }),
        });
      } catch (_) {}
    },

    // PRODUCTS
    getProducts() {
      const list = load(KEYS.products, DEFAULT_PRODUCTS);
      return normalizeProducts(list);
    },
    saveProducts(list)  { return save(KEYS.products, normalizeProducts(list)); },

    getProductById(id) {
      return this.getProducts().find(p => p.id === id) || null;
    },

    addProduct(product) {
      const list = this.getProducts();
      const newId = list.length ? Math.max(...list.map(p => p.id)) + 1 : 1;
      const newProduct = normalizeProduct({ ...product, id: newId });
      list.push(newProduct);
      this.saveProducts(list);
      return newProduct;
    },

    updateProduct(id, updates) {
      const list = this.getProducts();
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) return false;
      list[idx] = normalizeProduct({ ...list[idx], ...updates });
      this.saveProducts(list);
      return true;
    },

    deleteProduct(id) {
      const list = this.getProducts().filter(p => p.id !== id);
      this.saveProducts(list);
    },

    // SOCIALS
    getSocials()        { return load(KEYS.socials, DEFAULT_SOCIALS); },
    saveSocials(obj)    { return save(KEYS.socials, obj); },

    getSettings() {
      return load('cece_settings', DEFAULT_SETTINGS);
    },
    saveSettings(settings) {
      return save('cece_settings', { ...DEFAULT_SETTINGS, ...settings });
    },

    getTheme() {
      return localStorage.getItem(KEYS.theme) || 'dark';
    },
    setTheme(theme) {
      localStorage.setItem(KEYS.theme, theme === 'light' ? 'light' : 'dark');
    },

    getRecentlyViewed(limit = 6) {
      const ids = load(KEYS.recentlyViewed, []);
      if (!Array.isArray(ids) || !ids.length) return [];
      const products = this.getProducts();
      const map = new Map(products.map((p) => [p.id, p]));
      return ids
        .map((id) => map.get(id))
        .filter(Boolean)
        .slice(0, limit);
    },
    pushRecentlyViewed(id) {
      const productId = Number(id);
      if (!productId) return;
      const ids = load(KEYS.recentlyViewed, []).filter((item) => item !== productId);
      ids.unshift(productId);
      save(KEYS.recentlyViewed, ids.slice(0, 10));
    },

    buildOrderMessage(product) {
      const settings = this.getSettings();
      const template = settings.orderMessageTemplate || DEFAULT_SETTINGS.orderMessageTemplate;

      return applyMessageTemplate(template, {
        brandName: settings.brandName || 'CeCe',
        productName: product?.name || '',
        price: Number(product?.price || 0).toLocaleString(),
        sizes: Array.isArray(product?.sizes) && product.sizes.length
          ? product.sizes.join('/')
          : '[Please mention size]',
        contactPhone: settings.contactPhone || '',
      });
    },

    buildInquiryMessage() {
      const settings = this.getSettings();
      const template = settings.inquiryMessageTemplate || DEFAULT_SETTINGS.inquiryMessageTemplate;

      return applyMessageTemplate(template, {
        brandName: settings.brandName || 'CeCe',
        contactPhone: settings.contactPhone || '',
      });
    },

    getOrderLink(product) {
      const username = getInstagramUsername();
      const message = encodeURIComponent(this.buildOrderMessage(product));
      if (username) {
        return `https://ig.me/m/${username}?text=${message}`;
      }
      return this.getSocials().ig;
    },

    getInquiryLink() {
      const username = getInstagramUsername();
      const message = encodeURIComponent(this.buildInquiryMessage());
      if (username) {
        return `https://ig.me/m/${username}?text=${message}`;
      }
      return this.getSocials().ig;
    },

    // AUTH
    getPassword()       { return localStorage.getItem(KEYS.password) || DEFAULT_PASSWORD; },
    setPassword(pass)   { localStorage.setItem(KEYS.password, pass); },
    checkPassword(pass) { return pass === this.getPassword(); },

  };

})();
