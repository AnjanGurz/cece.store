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
  };

  // ── DEFAULTS ──
  const DEFAULT_PASSWORD = 'cece2024';

  const DEFAULT_PRODUCTS = [
    { id: 1, name: 'CeCe Summer Jacket Vol.1', price: 3500, status: 'in',      sizes: ['S','M','L','XL'],       img: '' },
    { id: 2, name: 'CeCe Oversized Tee',       price: 1200, status: 'limited', sizes: ['XS','S','M','L','XL'],  img: '' },
    { id: 3, name: 'CeCe Cargo Shorts',        price: 1800, status: 'in',      sizes: ['S','M','L'],            img: '' },
    { id: 4, name: 'CeCe Liner Jacket',        price: 4200, status: 'out',     sizes: ['M','L','XL'],           img: '' },
  ];


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

  // ── PUBLIC API ──
  return {

    // PRODUCTS
    getProducts()       { return load(KEYS.products, DEFAULT_PRODUCTS); },
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
