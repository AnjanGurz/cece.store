/* ============================================
   js/data.js
   Single source of truth for all data.
   All localStorage read/write lives here.
   ============================================ */

const CeceData = (() => {

  // ── STORAGE KEYS ──
  const KEYS = {
    password: 'cece_admin_pass',
    products: 'cece_products',
    socials:  'cece_socials',
    catalogVersion: 'cece_catalog_version',
  };

  // ── DEFAULTS ──
  const DEFAULT_PASSWORD = 'cece2024';

  const DEFAULT_PRODUCTS = [
    { id: 1, name: 'CeCe Black Jacket', price: 2900, status: 'in', sizes: ['S','M','L','XL','XXL'], img: './Images/black_jacket.jpeg' },
  ];

  const CATALOG_URL = './catalog/products.json';
  let catalogHydrated = false;


  const DEFAULT_SOCIALS = {
  ig: 'https://www.instagram.com/cece.craftofficial/',
  fb: 'https://www.facebook.com/profile.php?id=61582251825771',
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

  async function hydrateFromCatalog(force = false) {
    if (catalogHydrated && !force) return true;

    try {
      const res = await fetch(CATALOG_URL, { cache: 'no-cache' });
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
        save(KEYS.products, incomingProducts);
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

  // ── PUBLIC API ──
  return {

    hydrateFromCatalog,

    // PRODUCTS
    getProducts() {
      const list = load(KEYS.products, DEFAULT_PRODUCTS);
      return Array.isArray(list) ? list : DEFAULT_PRODUCTS;
    },
    saveProducts(list)  { return save(KEYS.products, list); },

    getProductById(id) {
      return this.getProducts().find(p => p.id === id) || null;
    },

    addProduct(product) {
      const list = this.getProducts();
      const newId = list.length ? Math.max(...list.map(p => p.id)) + 1 : 1;
      const newProduct = { ...product, id: newId };
      list.push(newProduct);
      this.saveProducts(list);
      return newProduct;
    },

    updateProduct(id, updates) {
      const list = this.getProducts();
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) return false;
      list[idx] = { ...list[idx], ...updates };
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

    // AUTH
    getPassword()       { return localStorage.getItem(KEYS.password) || DEFAULT_PASSWORD; },
    setPassword(pass)   { localStorage.setItem(KEYS.password, pass); },
    checkPassword(pass) { return pass === this.getPassword(); },

  };

})();
