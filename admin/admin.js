/* ============================================
   admin/admin.js
   Visual-first admin dashboard for static storefront.
   Backend-ready structure with mock modules.
   ============================================ */

const CeceAdmin = (() => {
  const KEYS = {
    categories: 'cece_admin_categories',
    promotions: 'cece_admin_promotions',
    orders: 'cece_admin_orders',
    shipments: 'cece_admin_shipments',
    customers: 'cece_admin_customers',
    activity: 'cece_admin_activity',
  };

  const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Hoodies', slug: 'hoodies', featured: true },
    { id: 2, name: 'T-Shirts', slug: 'tshirts', featured: true },
    { id: 3, name: 'Accessories', slug: 'accessories', featured: false },
  ];

  const DEFAULT_PROMOTIONS = [
    { id: 1, code: 'NEW10', type: 'Percent', value: '10%', status: 'Active' },
    { id: 2, code: 'FREESHIP', type: 'Shipping', value: 'NPR 0', status: 'Scheduled' },
  ];

  const MOCK = {
    sales: {
      today: 12800,
      week: 71400,
      month: 248500,
      growth: '+18.6%',
    },
    bestSellers: [
      { name: 'CeCe Midnight Tee', sold: 49, stock: 18 },
      { name: 'CeCe Signature Polo T-shirt', sold: 37, stock: 22 },
      { name: 'CeCe Casual summer slim fit Jacket', sold: 31, stock: 8 },
    ],
    orders: [
      { id: 'REQ-1042', customer: 'Rabin K.', items: 'Midnight Tee x1', total: 'NPR 2,500', status: 'Pending Confirmation' },
      { id: 'REQ-1041', customer: 'Srijana B.', items: 'Polo Tee x2', total: 'NPR 3,600', status: 'Ready to Ship' },
      { id: 'REQ-1039', customer: 'Aarav D.', items: 'Jacket x1', total: 'NPR 2,999', status: 'Shipped' },
    ],
    shipments: [
      { id: 'SHP-338', address: 'Kathmandu, Boudha', eta: 'Tomorrow', carrier: 'Local Rider' },
      { id: 'SHP-335', address: 'Pokhara, Lakeside', eta: '2 days', carrier: 'Bus Cargo' },
    ],
    customers: [
      { name: 'Anisha P.', phone: '+977 98XXXXXXXX', orders: 6, lastPurchase: '2 days ago' },
      { name: 'Bikram T.', phone: '+977 97XXXXXXXX', orders: 3, lastPurchase: '5 days ago' },
      { name: 'Riya S.', phone: '+977 98XXXXXXXX', orders: 2, lastPurchase: '1 week ago' },
    ],
    activity: [
      'New order received: REQ-1042',
      'Promotion NEW10 activated',
      'Stock updated for Midnight Tee',
      'Facebook link saved successfully',
    ],
    reportSeries: {
      sales: [32, 45, 39, 52, 61, 58, 66],
      stock: [78, 74, 69, 65, 61, 59, 54],
      products: [22, 38, 30, 48, 34],
    },
  };

  const STATE = {
    orders: [],
    shipments: [],
    customers: [],
    activity: [],
  };

  let currentImg = '';
  let productQuery = '';
  let productStatus = 'all';
  let editingCategoryId = null;
  let editingPromotionId = null;

  const ORDER_STATUSES = ['Pending Confirmation', 'Ready to Ship', 'Shipped'];

  const DEMO_PRODUCTS = [
    {
      name: 'CeCe Midnight Tee',
      price: 2500,
      status: 'in',
      category: 'tshirts',
      tags: ['new', 'best seller'],
      colors: ['Black'],
      sizes: ['M', 'L', 'XL'],
      img: './Images/niceBlackTee.webp',
    },
    {
      name: 'CeCe Signature Polo T-shirt',
      price: 1800,
      status: 'limited',
      category: 'tshirts',
      tags: ['classic'],
      colors: ['Black'],
      sizes: ['L', 'XL'],
      img: './Images/Polo_black.jpeg',
    },
    {
      name: 'CeCe Casual summer slim fit Jacket',
      price: 2999,
      status: 'in',
      category: 'hoodies',
      tags: ['outerwear'],
      colors: ['Black'],
      sizes: ['M', 'L'],
      img: './Images/black_jacket.jpeg',
    },
  ];

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn('CeceAdmin loadJSON error:', error.message);
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('CeceAdmin saveJSON error:', error.message);
      return false;
    }
  }

  function getCategories() {
    const items = loadJSON(KEYS.categories, DEFAULT_CATEGORIES);
    return Array.isArray(items) ? items : DEFAULT_CATEGORIES;
  }

  function saveCategories(items) {
    return saveJSON(KEYS.categories, items);
  }

  function getPromotions() {
    const items = loadJSON(KEYS.promotions, DEFAULT_PROMOTIONS);
    return Array.isArray(items) ? items : DEFAULT_PROMOTIONS;
  }

  function savePromotions(items) {
    return saveJSON(KEYS.promotions, items);
  }

  function initializeAdminState() {
    STATE.orders = loadJSON(KEYS.orders, MOCK.orders.slice());
    STATE.shipments = loadJSON(KEYS.shipments, MOCK.shipments.slice());
    STATE.customers = loadJSON(KEYS.customers, MOCK.customers.slice());
    STATE.activity = loadJSON(KEYS.activity, MOCK.activity.slice());
  }

  function saveAdminState() {
    saveJSON(KEYS.orders, STATE.orders);
    saveJSON(KEYS.shipments, STATE.shipments);
    saveJSON(KEYS.customers, STATE.customers);
    saveJSON(KEYS.activity, STATE.activity);
  }

  function logActivity(message) {
    STATE.activity.unshift(message);
    if (STATE.activity.length > 12) STATE.activity.length = 12;
    saveJSON(KEYS.activity, STATE.activity);
  }

  function parseNpr(value) {
    return Number(String(value || '').replace(/[^\d]/g, '')) || 0;
  }

  function injectHTML() {
    const mount = document.getElementById('admin-mount');
    if (!mount || mount.dataset.loaded) return;
    mount.dataset.loaded = 'true';
    mount.innerHTML = getAdminHTML() + getAdminStyles();
  }

  function openLogin() {
    injectHTML();
    const overlay = document.getElementById('admin-overlay');
    if (!overlay) return;
    overlay.classList.add('active');
    const passInput = document.getElementById('admin-pass');
    if (passInput) {
      passInput.value = '';
      setTimeout(() => passInput.focus(), 100);
    }
    const err = document.getElementById('admin-error');
    if (err) err.style.display = 'none';
  }

  function closeLogin() {
    const overlay = document.getElementById('admin-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  async function doLogin() {
    const passInput = document.getElementById('admin-pass');
    const err = document.getElementById('admin-error');
    const btn = document.querySelector('.ao-btn');
    if (!passInput) return;

    const password = passInput.value;

    // If a Render API URL is configured, try it first
    if (CeceData.getApiUrl()) {
      if (btn) { btn.textContent = 'Connecting…'; btn.disabled = true; }
      try {
        await CeceData.loginToApi(password);
        closeLogin();
        if (btn) { btn.textContent = 'Enter'; btn.disabled = false; }
        openPanel();
        return;
      } catch (_) {
        CeceData.clearApiToken();
        if (btn) { btn.textContent = 'Enter'; btn.disabled = false; }
      }
    }

    // Fallback: local password stored in localStorage
    if (CeceData.checkPassword(password)) {
      closeLogin();
      openPanel();
    } else {
      if (err) err.style.display = 'block';
      passInput.value = '';
      passInput.focus();
    }
  }

  function openPanel() {
    injectHTML();
    const panel = document.getElementById('admin-panel');
    if (panel) panel.classList.add('active');

    initializeAdminState();
    ensureDummyProducts();
    bindDashboardEvents();
    setAdminTab('overview');
    renderAll();
    updateCloudStatus();
  }

  function closePanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) panel.classList.remove('active');

    CeceProducts.render();
    const socials = CeceData.getSocials();
    const igLink = document.getElementById('footer-ig');
    const fbLink = document.getElementById('footer-fb');
    if (igLink) igLink.href = socials.ig;
    if (fbLink) fbLink.href = socials.fb;
  }

  function bindDashboardEvents() {
    const nav = document.getElementById('ap-sidebar-nav');
    if (nav && nav.dataset.bound !== '1') {
      nav.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-tab]');
        if (!btn) return;
        setAdminTab(btn.dataset.tab);
      });
      nav.dataset.bound = '1';
    }

    const addCategoryForm = document.getElementById('admin-category-form');
    if (addCategoryForm && addCategoryForm.dataset.bound !== '1') {
      addCategoryForm.addEventListener('submit', (event) => {
        event.preventDefault();
        createCategory();
      });
      addCategoryForm.dataset.bound = '1';
    }

    const cancelCategoryBtn = document.getElementById('admin-category-cancel');
    if (cancelCategoryBtn && cancelCategoryBtn.dataset.bound !== '1') {
      cancelCategoryBtn.addEventListener('click', clearCategoryEditor);
      cancelCategoryBtn.dataset.bound = '1';
    }

    const promoForm = document.getElementById('admin-promo-form');
    if (promoForm && promoForm.dataset.bound !== '1') {
      promoForm.addEventListener('submit', (event) => {
        event.preventDefault();
        createPromotion();
      });
      promoForm.dataset.bound = '1';
    }

    const cancelPromoBtn = document.getElementById('admin-promo-cancel');
    if (cancelPromoBtn && cancelPromoBtn.dataset.bound !== '1') {
      cancelPromoBtn.addEventListener('click', clearPromotionEditor);
      cancelPromoBtn.dataset.bound = '1';
    }

    const settingsForm = document.getElementById('admin-settings-form');
    if (settingsForm && settingsForm.dataset.bound !== '1') {
      settingsForm.addEventListener('submit', (event) => {
        event.preventDefault();
        saveSettingsPanel();
      });
      settingsForm.dataset.bound = '1';
    }

    const socialForm = document.getElementById('admin-social-form');
    if (socialForm && socialForm.dataset.bound !== '1') {
      socialForm.addEventListener('submit', (event) => {
        event.preventDefault();
        saveSocialLinks();
      });
      socialForm.dataset.bound = '1';
    }

    const productSearch = document.getElementById('admin-product-search');
    if (productSearch && productSearch.dataset.bound !== '1') {
      productSearch.addEventListener('input', () => {
        productQuery = productSearch.value.trim().toLowerCase();
        renderProductList();
      });
      productSearch.dataset.bound = '1';
    }

    const productStatusFilter = document.getElementById('admin-product-status');
    if (productStatusFilter && productStatusFilter.dataset.bound !== '1') {
      productStatusFilter.addEventListener('change', () => {
        productStatus = productStatusFilter.value;
        renderProductList();
      });
      productStatusFilter.dataset.bound = '1';
    }
  }

  function ensureDummyProducts() {
    const current = CeceData.getProducts();
    if (Array.isArray(current) && current.length > 0) return;
    CeceData.saveProducts(DEMO_PRODUCTS);
  }

  function setAdminTab(tabName) {
    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.ap-tab-panel').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tabName;
    });
  }

  function renderAll() {
    renderOverview();
    renderProductList();
    renderCategories();
    loadSocialInputs();
    loadSettingsInputs();
    updateCloudStatus();
  }

  function renderOverview() {
    const products = CeceData.getProducts();
    const inStock   = products.filter((p) => p.status === 'in').length;
    const limited   = products.filter((p) => p.status === 'limited').length;
    const soldOut   = products.filter((p) => p.status === 'out').length;

    setText('metric-stock',    `${inStock} In Stock`);
    setText('metric-limited',  `${limited} Limited`);
    setText('metric-soldout',  `${soldOut} Sold Out`);
    setText('metric-products', `${products.length} Total`);

    const activity = document.getElementById('admin-recent-activity');
    if (activity) {
      activity.innerHTML = STATE.activity.length
        ? STATE.activity.map((line) => `<li class="ap-activity-item">${line}</li>`).join('')
        : '<li class="ap-empty">No activity yet.</li>';
    }

    const lowStockWrap = document.getElementById('admin-low-stock');
    if (lowStockWrap) {
      const flagged = products.filter((p) => p.status === 'limited' || p.status === 'out');
      if (!flagged.length) {
        lowStockWrap.innerHTML = '<p class="ap-empty">All products are well-stocked.</p>';
      } else {
        lowStockWrap.innerHTML = flagged
          .map((p) => `<div class="ap-alert warning">${p.name} — ${p.status === 'out' ? 'Sold Out' : 'Running Low'}</div>`)
          .join('');
      }
    }
  }

  function renderProductList() {
    const list = document.getElementById('admin-products-list');
    const products = CeceData.getProducts();
    if (!list) return;

    const filtered = products.filter((p) => {
      const nameMatch = !productQuery || String(p.name || '').toLowerCase().includes(productQuery);
      const statusMatch = productStatus === 'all' || p.status === productStatus;
      return nameMatch && statusMatch;
    });

    if (!filtered.length) {
      list.innerHTML = `<div class="ap-empty">No products found for current filters.</div>`;
      return;
    }

    const STATUS_LABELS = { in: 'In Stock', limited: 'Limited', out: 'Sold Out' };

    list.innerHTML = filtered.map((p) => {
      const category = p.category || 'Uncategorized';
      const tags = Array.isArray(p.tags) ? p.tags : [];
      const colors = Array.isArray(p.colors) ? p.colors : [];

      return `
        <div class="ap-row">
          <div class="ap-thumb">
            ${p.img ? `<img src="${p.img}" alt="${p.name}">` : 'IMG'}
          </div>
          <div class="ap-info">
            <div class="ap-name">${p.name}</div>
            <div class="ap-meta">NPR ${Number(p.price).toLocaleString()} · ${STATUS_LABELS[p.status] || ''}</div>
            <div class="ap-meta">Category: ${category} · Sizes: ${(p.sizes || []).join(', ') || 'N/A'}</div>
            <div class="ap-tags-wrap">
              ${tags.map((tag) => `<span class="ap-tag">#${tag}</span>`).join('')}
              ${colors.map((color) => `<span class="ap-tag">${color}</span>`).join('')}
            </div>
          </div>
          <div class="ap-actions">
            <button class="ap-btn edit" onclick="CeceAdmin.openModal(${p.id})">Edit</button>
            <button class="ap-btn del" onclick="CeceAdmin.deleteProduct(${p.id})">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function openModal(id = null) {
    injectHTML();
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    modal.classList.add('active');
    currentImg = '';
    resetModal();

    if (id !== null) {
      const p = CeceData.getProductById(id);
      if (!p) return;

      setText('modal-title', 'Edit Product');
      setValue('modal-edit-id', id);
      setValue('modal-prod-name', p.name || '');
      setValue('modal-prod-price', p.price || '');
      setValue('modal-prod-status', p.status || 'in');
      setValue('modal-prod-category', p.category || 'hoodies');
      setValue('modal-prod-tags', Array.isArray(p.tags) ? p.tags.join(', ') : '');
      setValue('modal-prod-colors', Array.isArray(p.colors) ? p.colors.join(', ') : '');

      const sizeMap = { XS: 'sz-xs', S: 'sz-s', M: 'sz-m', L: 'sz-l', XL: 'sz-xl', XXL: 'sz-xxl' };
      (p.sizes || []).forEach((s) => {
        const el = document.getElementById(sizeMap[s]);
        if (el) el.checked = true;
      });

      if (p.img) {
        currentImg = p.img;
        const preview = document.getElementById('modal-img-preview');
        const txt = document.getElementById('modal-upload-text');
        if (preview) {
          preview.src = p.img;
          preview.style.display = 'block';
        }
        if (txt) txt.style.display = 'none';
      }
    } else {
      setText('modal-title', 'Add Product');
    }
  }

  function closeModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.classList.remove('active');
  }

  function resetModal() {
    setValue('modal-edit-id', '');
    setValue('modal-prod-name', '');
    setValue('modal-prod-price', '');
    setValue('modal-prod-status', 'in');
    setValue('modal-prod-category', 'hoodies');
    setValue('modal-prod-tags', '');
    setValue('modal-prod-colors', '');

    ['sz-xs', 'sz-s', 'sz-m', 'sz-l', 'sz-xl', 'sz-xxl'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });

    const preview = document.getElementById('modal-img-preview');
    const txt = document.getElementById('modal-upload-text');
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
    }
    if (txt) txt.style.display = 'block';
  }

  function previewImage(input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      currentImg = event.target.result;
      const preview = document.getElementById('modal-img-preview');
      const txt = document.getElementById('modal-upload-text');
      if (preview) {
        preview.src = currentImg;
        preview.style.display = 'block';
      }
      if (txt) txt.style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  }

  async function saveProduct() {
    const name = getValue('modal-prod-name').trim();
    const price = getValue('modal-prod-price');
    const status = getValue('modal-prod-status');
    const category = getValue('modal-prod-category');
    const tags = getValue('modal-prod-tags').split(',').map((s) => s.trim()).filter(Boolean);
    const colors = getValue('modal-prod-colors').split(',').map((s) => s.trim()).filter(Boolean);

    if (!name || !price) {
      showToast('Please fill product name and price.', 'error');
      return;
    }

    const sizeMap = {
      'sz-xs': 'XS',
      'sz-s': 'S',
      'sz-m': 'M',
      'sz-l': 'L',
      'sz-xl': 'XL',
      'sz-xxl': 'XXL',
    };

    const sizes = Object.entries(sizeMap)
      .filter(([id]) => document.getElementById(id)?.checked)
      .map(([, size]) => size);

    if (!sizes.length) {
      showToast('Select at least one size.', 'error');
      return;
    }

    const editId = getValue('modal-edit-id');
    const productData = {
      ...(editId ? { id: parseInt(editId, 10) } : {}),
      name,
      price: parseInt(price, 10),
      status,
      category,
      tags,
      colors,
      sizes,
      img: currentImg,
    };

    if (CeceData.isApiConnected()) {
      try {
        const result = await CeceData.apiSaveProduct(productData);
        // Sync the saved product back into localStorage cache
        const savedProduct = result.product || { ...productData };
        if (editId) {
          CeceData.updateProduct(savedProduct.id || parseInt(editId, 10), savedProduct);
        } else {
          CeceData.addProduct(savedProduct);
        }
        logActivity(`Product ${editId ? 'updated' : 'added'} via cloud: ${name}`);
        showToast(`Product ${editId ? 'updated' : 'added'} (cloud).`, 'success');
      } catch (apiError) {
        showToast(`Cloud save failed: ${apiError.message}`, 'error');
        return;
      }
    } else {
      if (editId) {
        CeceData.updateProduct(parseInt(editId, 10), productData);
        logActivity(`Product updated: ${name}`);
        showToast('Product updated.', 'success');
      } else {
        CeceData.addProduct(productData);
        logActivity(`Product created: ${name}`);
        showToast('Product added.', 'success');
      }
    }

    closeModal();
    renderAll();
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    const product = CeceData.getProductById(id);
    if (CeceData.isApiConnected()) {
      try {
        await CeceData.apiDeleteProduct(id);
      } catch (apiError) {
        showToast(`Cloud delete failed: ${apiError.message}`, 'error');
        return;
      }
    }
    CeceData.deleteProduct(id);
    if (product?.name) logActivity(`Product deleted: ${product.name}`);
    showToast('Product deleted.', 'warn');
    renderAll();
  }

  function renderCategories() {
    const list = document.getElementById('admin-categories-list');
    const categories = getCategories();
    if (!list) return;

    list.innerHTML = categories.map((cat, index) => `
      <div class="ap-row compact">
        <div class="ap-info">
          <div class="ap-name">${cat.name}</div>
          <div class="ap-meta">Slug: ${cat.slug} · Featured: ${cat.featured ? 'Yes' : 'No'}</div>
        </div>
        <div class="ap-actions">
          <button class="ap-btn" onclick="CeceAdmin.editCategory(${cat.id})">Edit</button>
          <button class="ap-btn" onclick="CeceAdmin.moveCategory(${cat.id}, -1)" ${index === 0 ? 'disabled' : ''}>Up</button>
          <button class="ap-btn" onclick="CeceAdmin.moveCategory(${cat.id}, 1)" ${index === categories.length - 1 ? 'disabled' : ''}>Down</button>
          <button class="ap-btn del" onclick="CeceAdmin.deleteCategory(${cat.id})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function clearCategoryEditor() {
    editingCategoryId = null;
    const form = document.getElementById('admin-category-form');
    if (form) form.reset();
    setText('admin-category-submit', 'Create Category');
    const cancelBtn = document.getElementById('admin-category-cancel');
    if (cancelBtn) cancelBtn.hidden = true;
  }

  function editCategory(id) {
    const categories = getCategories();
    const item = categories.find((cat) => cat.id === id);
    if (!item) return;

    editingCategoryId = id;
    setValue('admin-category-name', item.name || '');
    setValue('admin-category-slug', item.slug || '');
    const featured = document.getElementById('admin-category-featured');
    if (featured) featured.checked = Boolean(item.featured);
    setText('admin-category-submit', 'Update Category');
    const cancelBtn = document.getElementById('admin-category-cancel');
    if (cancelBtn) cancelBtn.hidden = false;
    showToast(`Editing ${item.name}.`, 'info');
  }

  function createCategory() {
    const name = getValue('admin-category-name').trim();
    const slug = getValue('admin-category-slug').trim();
    const featured = Boolean(document.getElementById('admin-category-featured')?.checked);

    if (!name || !slug) {
      showToast('Category name and slug are required.', 'error');
      return;
    }

    const categories = getCategories();
    const existingSlug = categories.find((cat) => cat.slug.toLowerCase() === slug.toLowerCase() && cat.id !== editingCategoryId);
    if (existingSlug) {
      showToast('Slug already exists. Use a unique slug.', 'error');
      return;
    }

    if (editingCategoryId) {
      const item = categories.find((cat) => cat.id === editingCategoryId);
      if (!item) return;
      item.name = name;
      item.slug = slug;
      item.featured = featured;
      logActivity(`Category updated: ${name}`);
      showToast('Category updated.', 'success');
    } else {
      const id = categories.length ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
      categories.push({ id, name, slug, featured });
      logActivity(`Category created: ${name}`);
      showToast('Category created.', 'success');
    }

    saveCategories(categories);
    clearCategoryEditor();
    renderCategories();
    renderOverview();
  }

  function moveCategory(id, dir) {
    const categories = getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return;
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= categories.length) return;

    const temp = categories[index];
    categories[index] = categories[nextIndex];
    categories[nextIndex] = temp;

    saveCategories(categories);
    logActivity('Category order changed.');
    renderCategories();
    renderOverview();
    showToast('Category order updated.', 'info');
  }

  function deleteCategory(id) {
    const categories = getCategories();
    const item = categories.find((cat) => cat.id === id);
    if (!item) return;
    if (!confirm(`Delete category ${item.name}?`)) return;

    const next = categories.filter((c) => c.id !== id);
    saveCategories(next);
    if (editingCategoryId === id) clearCategoryEditor();
    logActivity(`Category deleted: ${item.name}`);
    renderCategories();
    renderOverview();
    showToast('Category deleted.', 'warn');
  }

  function renderOrders() {
    const orders = document.getElementById('admin-orders-list');
    const shipments = document.getElementById('admin-shipments-list');
    if (orders) {
      orders.innerHTML = STATE.orders.map((order, index) => `
        <div class="ap-card">
          <div class="ap-card-head">
            <strong>${order.id}</strong>
            <span class="ap-pill">${order.status}</span>
          </div>
          <p>${order.customer}</p>
          <p class="ap-meta">${order.items}</p>
          <p class="ap-meta">${order.total}</p>
          <div class="ap-actions" style="margin-top:.45rem;justify-content:flex-start">
            <button class="ap-btn" onclick="CeceAdmin.cycleOrderStatus(${index})">Next Status</button>
          </div>
        </div>
      `).join('');
    }

    if (shipments) {
      shipments.innerHTML = STATE.shipments.map((ship, index) => `
        <div class="ap-mini-row">
          <div>
            <p class="ap-mini-title">${ship.id}</p>
            <p class="ap-mini-sub">${ship.address} · ${ship.carrier}</p>
          </div>
          <div class="ap-actions">
            <span class="ap-pill">ETA ${ship.eta}</span>
            <button class="ap-btn" onclick="CeceAdmin.markShipmentDone(${index})">Mark Done</button>
          </div>
        </div>
      `).join('');
    }
  }

  function cycleOrderStatus(index) {
    const order = STATE.orders[index];
    if (!order) return;
    const currentIndex = ORDER_STATUSES.indexOf(order.status);
    const next = ORDER_STATUSES[(currentIndex + 1) % ORDER_STATUSES.length];
    order.status = next;
    saveJSON(KEYS.orders, STATE.orders);
    logActivity(`Order ${order.id} moved to ${next}.`);
    renderOrders();
    renderOverview();
    showToast(`Order ${order.id} moved to ${next}.`, 'info');
  }

  function markShipmentDone(index) {
    const shipment = STATE.shipments[index];
    if (!shipment) return;
    STATE.shipments.splice(index, 1);
    saveJSON(KEYS.shipments, STATE.shipments);
    logActivity(`Shipment ${shipment.id} marked complete.`);
    renderOrders();
    renderOverview();
    showToast(`Shipment ${shipment.id} marked complete.`, 'success');
  }

  function renderCustomers() {
    const wrap = document.getElementById('admin-customers-list');
    if (!wrap) return;

    wrap.innerHTML = STATE.customers.map((customer) => `
      <div class="ap-row compact">
        <div class="ap-info">
          <div class="ap-name">${customer.name}</div>
          <div class="ap-meta">${customer.phone} · Orders: ${customer.orders} · Last: ${customer.lastPurchase}</div>
        </div>
        <div class="ap-actions">
          <button class="ap-btn" onclick="CeceAdmin.viewCustomer('${customer.name.replace(/'/g, "\\'")}')">View</button>
          <button class="ap-btn" onclick="CeceAdmin.messageCustomer('${customer.name.replace(/'/g, "\\'")}')">Message</button>
        </div>
      </div>
    `).join('');
  }

  function viewCustomer(name) {
    logActivity(`Customer profile opened: ${name}`);
    renderOverview();
    showToast(`Opening profile for ${name} (mock).`, 'info');
  }

  function messageCustomer(name) {
    logActivity(`Message drafted for customer: ${name}`);
    renderOverview();
    showToast(`Drafting message to ${name} (mock).`, 'success');
  }

  function renderPromotions() {
    const wrap = document.getElementById('admin-promotions-list');
    const promos = getPromotions();
    if (!wrap) return;

    wrap.innerHTML = promos.map((promo) => `
      <div class="ap-row compact">
        <div class="ap-info">
          <div class="ap-name">${promo.code}</div>
          <div class="ap-meta">${promo.type} · ${promo.value} · ${promo.status}</div>
        </div>
        <div class="ap-actions">
          <button class="ap-btn" onclick="CeceAdmin.editPromotion(${promo.id})">Edit</button>
          <button class="ap-btn" onclick="CeceAdmin.cyclePromotionStatus(${promo.id})">Toggle Status</button>
          <button class="ap-btn del" onclick="CeceAdmin.deletePromotion(${promo.id})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function clearPromotionEditor() {
    editingPromotionId = null;
    const form = document.getElementById('admin-promo-form');
    if (form) form.reset();
    setText('admin-promo-submit', 'Create Campaign');
    const cancelBtn = document.getElementById('admin-promo-cancel');
    if (cancelBtn) cancelBtn.hidden = true;
  }

  function editPromotion(id) {
    const promos = getPromotions();
    const item = promos.find((promo) => promo.id === id);
    if (!item) return;

    editingPromotionId = id;
    setValue('admin-promo-code', item.code || '');
    setValue('admin-promo-type', item.type || 'Percent');
    setValue('admin-promo-value', item.value || '');
    setValue('admin-promo-status', item.status || 'Active');
    setText('admin-promo-submit', 'Update Campaign');
    const cancelBtn = document.getElementById('admin-promo-cancel');
    if (cancelBtn) cancelBtn.hidden = false;
    showToast(`Editing ${item.code}.`, 'info');
  }

  function cyclePromotionStatus(id) {
    const promos = getPromotions();
    const item = promos.find((promo) => promo.id === id);
    if (!item) return;

    const flow = ['Active', 'Paused', 'Scheduled'];
    const idx = flow.indexOf(item.status);
    item.status = flow[(idx + 1) % flow.length];
    savePromotions(promos);
    logActivity(`Promotion ${item.code} set to ${item.status}.`);
    renderPromotions();
    renderOverview();
    showToast(`${item.code} is now ${item.status}.`, 'info');
  }

  function resetDemoData() {
    CeceData.saveProducts(DEMO_PRODUCTS);
    saveCategories(DEFAULT_CATEGORIES);
    savePromotions(DEFAULT_PROMOTIONS);

    STATE.orders = [
      { id: 'REQ-1042', customer: 'Rabin K.', items: 'Midnight Tee x1', total: 'NPR 2,500', status: 'Pending Confirmation' },
      { id: 'REQ-1041', customer: 'Srijana B.', items: 'Polo Tee x2', total: 'NPR 3,600', status: 'Ready to Ship' },
      { id: 'REQ-1039', customer: 'Aarav D.', items: 'Jacket x1', total: 'NPR 2,999', status: 'Shipped' },
    ];
    STATE.shipments = [
      { id: 'SHP-338', address: 'Kathmandu, Boudha', eta: 'Tomorrow', carrier: 'Local Rider' },
      { id: 'SHP-335', address: 'Pokhara, Lakeside', eta: '2 days', carrier: 'Bus Cargo' },
    ];
    STATE.customers = [
      { name: 'Anisha P.', phone: '+977 98XXXXXXXX', orders: 6, lastPurchase: '2 days ago' },
      { name: 'Bikram T.', phone: '+977 97XXXXXXXX', orders: 3, lastPurchase: '5 days ago' },
      { name: 'Riya S.', phone: '+977 98XXXXXXXX', orders: 2, lastPurchase: '1 week ago' },
    ];
    STATE.activity = [
      'Demo data reset to baseline.',
      'New order received: REQ-1042',
      'Promotion NEW10 activated',
      'Stock updated for Midnight Tee',
      'Facebook link saved successfully',
    ];
    saveAdminState();

    productQuery = '';
    productStatus = 'all';
    setValue('admin-product-search', '');
    setValue('admin-product-status', 'all');
    clearCategoryEditor();
    clearPromotionEditor();
    renderAll();
    showToast('Demo data reset.', 'success');
  }

  function createPromotion() {
    const code = getValue('admin-promo-code').trim().toUpperCase();
    const type = getValue('admin-promo-type');
    const value = getValue('admin-promo-value').trim();
    const status = getValue('admin-promo-status');

    if (!code || !value) {
      showToast('Promo code and value required.', 'error');
      return;
    }

    const promos = getPromotions();
    const duplicate = promos.find((promo) => promo.code.toUpperCase() === code && promo.id !== editingPromotionId);
    if (duplicate) {
      showToast('Promo code already exists.', 'error');
      return;
    }

    if (editingPromotionId) {
      const item = promos.find((promo) => promo.id === editingPromotionId);
      if (!item) return;
      item.code = code;
      item.type = type;
      item.value = value;
      item.status = status;
      logActivity(`Promotion updated: ${code}`);
      showToast('Promotion updated.', 'success');
    } else {
      const id = promos.length ? Math.max(...promos.map((p) => p.id)) + 1 : 1;
      promos.unshift({ id, code, type, value, status });
      logActivity(`Promotion created: ${code}`);
      showToast('Promotion created.', 'success');
    }

    savePromotions(promos);
    clearPromotionEditor();
    renderPromotions();
    renderOverview();
  }

  function deletePromotion(id) {
    const promos = getPromotions();
    const item = promos.find((promo) => promo.id === id);
    if (!item) return;
    if (!confirm(`Delete promotion ${item.code}?`)) return;

    const next = promos.filter((promo) => promo.id !== id);
    savePromotions(next);
    if (editingPromotionId === id) clearPromotionEditor();
    logActivity(`Promotion deleted: ${item.code}`);
    renderPromotions();
    renderOverview();
    showToast('Promotion deleted.', 'warn');
  }

  function renderReports() {
    renderBarChart('report-sales-chart', MOCK.reportSeries.sales);
    renderBarChart('report-stock-chart', MOCK.reportSeries.stock);
    renderBarChart('report-product-chart', MOCK.reportSeries.products);
  }

  function renderBarChart(elementId, values) {
    const wrap = document.getElementById(elementId);
    if (!wrap) return;

    const max = Math.max(...values, 1);
    wrap.innerHTML = values.map((value) => {
      const h = Math.round((value / max) * 100);
      return `
        <div class="ap-bar-col">
          <div class="ap-bar" style="height:${h}%"></div>
          <span>${value}</span>
        </div>
      `;
    }).join('');
  }

  function loadSocialInputs() {
    const socials = CeceData.getSocials();
    setValue('admin-ig-url', socials.ig || '');
    setValue('admin-fb-url', socials.fb || '');
    setValue('admin-tiktok-url', socials.tiktok || '');
    setValue('admin-youtube-url', socials.youtube || '');
  }

  async function saveSocialLinks() {
    const socials = {
      ...CeceData.getSocials(),
      ig: getValue('admin-ig-url').trim() || 'https://instagram.com',
      fb: getValue('admin-fb-url').trim() || 'https://facebook.com',
      tiktok: getValue('admin-tiktok-url').trim(),
      youtube: getValue('admin-youtube-url').trim(),
    };

    if (CeceData.isApiConnected()) {
      try {
        await CeceData.apiUpdateSettings({ socials });
      } catch (apiError) {
        showToast(`Cloud sync failed: ${apiError.message}`, 'warn');
      }
    }

    CeceData.saveSocials(socials);
    logActivity('Social links updated.');
    renderOverview();
    showMsg('social-msg', 'Social links saved.');
    showToast('Social links updated.', 'success');
  }

  function loadSettingsInputs() {
    const settings = CeceData.getSettings();
    setValue('admin-site-name', settings.brandName || 'CeCe');
    setValue('admin-site-tagline', settings.tagline || 'Quality over everything.');
    setValue('admin-contact-phone', settings.contactPhone || '+977 98XXXXXXXX');
    setValue('admin-theme-preset', settings.themePreset || 'classic-dark');
    setValue('admin-order-message-template', settings.orderMessageTemplate || 'Namaste {brand_name}, I want to order: {product_name}\nPrice: NPR {price}\nSize: {sizes}');
    setValue('admin-inquiry-message-template', settings.inquiryMessageTemplate || 'Namaste {brand_name}, I found you through your website.\nI want to know more about your latest collection.');

    const notifyOrder = document.getElementById('admin-notify-order');
    const notifyStock = document.getElementById('admin-notify-stock');
    if (notifyOrder) notifyOrder.checked = settings.notifyOrder !== false;
    if (notifyStock) notifyStock.checked = settings.notifyStock !== false;
  }

  async function saveSettingsPanel() {
    const current = CeceData.getSettings();
    const merged = {
      ...current,
      brandName: getValue('admin-site-name').trim() || 'CeCe',
      tagline: getValue('admin-site-tagline').trim() || 'Quality over everything.',
      contactPhone: getValue('admin-contact-phone').trim() || '+977 98XXXXXXXX',
      themePreset: getValue('admin-theme-preset'),
      orderMessageTemplate: getValue('admin-order-message-template').trim() || current.orderMessageTemplate,
      inquiryMessageTemplate: getValue('admin-inquiry-message-template').trim() || current.inquiryMessageTemplate,
      notifyOrder: Boolean(document.getElementById('admin-notify-order')?.checked),
      notifyStock: Boolean(document.getElementById('admin-notify-stock')?.checked),
    };

    if (CeceData.isApiConnected()) {
      try {
        await CeceData.apiUpdateSettings(merged);
      } catch (apiError) {
        showToast(`Cloud sync failed: ${apiError.message}`, 'warn');
      }
    }

    CeceData.saveSettings(merged);
    logActivity('Store settings updated.');
    renderOverview();
    showMsg('settings-msg', 'Settings saved.');
    showToast('Settings updated.', 'success');
  }

  async function changePassword() {
    const np = getValue('admin-new-pass');
    const cp = getValue('admin-confirm-pass');
    const op = getValue('admin-old-pass');
    if (!np) return showMsg('pass-msg', 'Enter a new password.');
    if (np !== cp) return showMsg('pass-msg', 'Passwords do not match.');

    if (CeceData.isApiConnected()) {
      if (!op) return showMsg('pass-msg', 'Enter your current password.');
      try {
        await CeceData.apiFetch('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword: op, newPassword: np }),
        });
        setValue('admin-old-pass', '');
      } catch (apiError) {
        return showMsg('pass-msg', `Cloud error: ${apiError.message}`);
      }
    } else {
      CeceData.setPassword(np);
    }

    setValue('admin-new-pass', '');
    setValue('admin-confirm-pass', '');
    logActivity('Admin password changed.');
    renderOverview();
    showMsg('pass-msg', 'Password updated.');
    showToast('Admin password changed.', 'success');
  }

  // ── CLOUD FUNCTIONS ─────────────────────────────────
  function updateCloudStatus() {
    const dot    = document.getElementById('ap-cloud-dot');
    const label  = document.getElementById('ap-cloud-label');
    const badge  = document.getElementById('cloud-conn-badge');
    const urlEl  = document.getElementById('cloud-api-url');
    const apiUrl = CeceData.getApiUrl();
    const connected = CeceData.isApiConnected();

    if (dot)   dot.className   = `ap-cloud-dot ${connected ? 'online' : (apiUrl ? 'configured' : 'offline')}`;
    if (label) label.textContent = connected ? 'Cloud connected' : (apiUrl ? 'API configured' : 'Local only');
    if (badge) badge.textContent = connected ? '✓ Connected' : (apiUrl ? 'Not logged in' : 'No URL configured');
    if (urlEl) urlEl.value = apiUrl || '';

    const oldPassWrap = document.getElementById('ap-old-pass-wrap');
    if (oldPassWrap) oldPassWrap.style.display = connected ? '' : 'none';
  }

  async function checkCloudConnection() {
    const apiUrl = CeceData.getApiUrl();
    if (!apiUrl) {
      showToast('No API URL configured in index.html.', 'error');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/health`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Cloud server is reachable.', 'success');
    } catch (err) {
      showToast(`Cannot reach server: ${err.message}`, 'error');
    }
  }

  function disconnectCloud() {
    CeceData.clearApiToken();
    updateCloudStatus();
    showToast('Disconnected from cloud. Re-login to reconnect.', 'info');
  }

  async function syncCloudToLocal() {
    if (!CeceData.getApiUrl()) {
      showToast('No API URL configured.', 'error');
      return;
    }
    showToast('Pulling latest products from cloud…', 'info');
    try {
      await CeceData.hydrateFromCatalog(true);
      renderAll();
      showToast('Products synced from cloud.', 'success');
    } catch (err) {
      showToast(`Sync failed: ${err.message}`, 'error');
    }
  }

  async function loadBackups() {
    if (!CeceData.isApiConnected()) {
      showToast('Login to cloud first.', 'error');
      return;
    }
    const list = document.getElementById('cloud-backups-list');
    if (list) list.innerHTML = '<p class="ap-empty">Loading…</p>';
    try {
      const data = await CeceData.apiFetch('/api/products/backups');
      const backups = Array.isArray(data.backups) ? data.backups : [];
      if (!backups.length) {
        if (list) list.innerHTML = '<p class="ap-empty">No backups yet.</p>';
        return;
      }
      if (list) {
        list.innerHTML = backups.map((b) => `
          <div class="ap-mini-row">
            <div>
              <p class="ap-mini-title">${b.file}</p>
              <p class="ap-mini-sub">${new Date(b.created).toLocaleString()}</p>
            </div>
            <button class="ap-btn" onclick="CeceAdmin.restoreBackup('${b.file}')">Restore</button>
          </div>
        `).join('');
      }
    } catch (err) {
      showToast(`Failed to load backups: ${err.message}`, 'error');
    }
  }

  async function restoreBackup(filename) {
    if (!confirm(`Restore backup ${filename}? This will overwrite current products.`)) return;
    try {
      await CeceData.apiFetch('/api/products/restore', {
        method: 'POST',
        body: JSON.stringify({ filename }),
      });
      await syncCloudToLocal();
      showToast('Backup restored successfully.', 'success');
    } catch (err) {
      showToast(`Restore failed: ${err.message}`, 'error');
    }
  }

  async function loadCloudAnalytics() {
    if (!CeceData.isApiConnected()) {
      showToast('Login to cloud first.', 'error');
      return;
    }
    const wrap = document.getElementById('cloud-analytics-summary');
    if (wrap) wrap.innerHTML = '<p class="ap-empty">Loading…</p>';
    try {
      const data = await CeceData.apiFetch('/api/analytics');
      const s = data.summary || {};
      if (wrap) {
        wrap.innerHTML = `
          <div class="ap-mini-row"><span>Total events</span><span>${data.count || 0}</span></div>
          <div class="ap-mini-row"><span>Product views</span><span>${s.view || 0}</span></div>
          <div class="ap-mini-row"><span>Quick views</span><span>${s.quick_view || 0}</span></div>
          <div class="ap-mini-row"><span>Order clicks</span><span>${s.order_click || 0}</span></div>
          <div class="ap-mini-row"><span>Filter used</span><span>${s.filter_used || 0}</span></div>
        `;
      }
    } catch (err) {
      showToast(`Analytics failed: ${err.message}`, 'error');
    }
  }

  async function clearCloudAnalytics() {
    if (!CeceData.isApiConnected()) return showToast('Login to cloud first.', 'error');
    if (!confirm('Clear all analytics data on the server?')) return;
    try {
      await CeceData.apiFetch('/api/analytics', { method: 'DELETE' });
      loadCloudAnalytics();
      showToast('Analytics cleared.', 'success');
    } catch (err) {
      showToast(`Clear failed: ${err.message}`, 'error');
    }
  }

  function exportProducts() {
    const products = CeceData.getProducts();
    const blob = new Blob([JSON.stringify({ products }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cece-products-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('Products exported.');
    showToast('Products exported.', 'success');
  }

  async function importProducts(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const msg = document.getElementById('cloud-import-msg');
    if (msg) { msg.textContent = 'Reading file…'; msg.style.display = 'block'; }

    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      if (msg) msg.textContent = 'Invalid JSON file.';
      return;
    }

    const products = Array.isArray(parsed.products) ? parsed.products
      : Array.isArray(parsed) ? parsed : null;
    if (!products) {
      if (msg) msg.textContent = 'JSON must contain a "products" array.';
      return;
    }

    if (CeceData.isApiConnected()) {
      try {
        await CeceData.apiFetch('/api/products/bulk-import', {
          method: 'POST',
          body: JSON.stringify({ products }),
        });
        await syncCloudToLocal();
        if (msg) msg.textContent = `${products.length} products imported to cloud.`;
        logActivity(`Bulk import: ${products.length} products via cloud.`);
        showToast('Products imported to cloud.', 'success');
        return;
      } catch (err) {
        if (msg) msg.textContent = `Cloud import failed: ${err.message}`;
        return;
      }
    }

    // Local import
    CeceData.saveProducts(products);
    renderAll();
    if (msg) msg.textContent = `${products.length} products imported locally.`;
    logActivity(`Bulk import: ${products.length} products (local).`);
    showToast('Products imported locally.', 'success');
    input.value = '';
  }

  // ── DISPLAY HELPERS ─────────────────────────────────
  function showToast(text, type = 'info') {
    const box = document.getElementById('admin-toast-stack');
    if (!box) return;

    const item = document.createElement('div');
    item.className = `ap-toast ${type}`;
    item.textContent = text;

    box.appendChild(item);
    setTimeout(() => item.classList.add('show'), 20);
    setTimeout(() => {
      item.classList.remove('show');
      setTimeout(() => item.remove(), 250);
    }, 2800);
  }

  function showMsg(elementId, text) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }

  function getValue(id) {
    return document.getElementById(id)?.value || '';
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function getAdminHTML() {
    return `
      <div id="admin-overlay">
        <button class="ao-close" onclick="CeceAdmin.closeLogin()">Close</button>
        <div class="ao-box">
          <h2 class="ao-title">CeCe Admin</h2>
          <p class="ao-sub">Dashboard Access</p>
          <p class="ao-error" id="admin-error">Incorrect password.</p>
          <input type="password" class="ao-input" id="admin-pass" placeholder="Enter password"
            onkeydown="if(event.key==='Enter') CeceAdmin.doLogin()">
          <button class="ao-btn" onclick="CeceAdmin.doLogin()">Enter</button>
        </div>
      </div>

      <div id="admin-panel">
        <div id="admin-toast-stack"></div>
        <div class="ap-shell">
          <aside class="ap-sidebar">
            <div class="ap-brand">CeCe <span>Control Center</span></div>
            <nav id="ap-sidebar-nav" class="ap-sidebar-nav">
              <button data-tab="overview" class="is-active">Overview</button>
              <button data-tab="products">Products</button>
              <button data-tab="categories">Categories</button>
              <button data-tab="social">Social Links</button>
              <button data-tab="settings">Settings</button>
              <button data-tab="cloud">☁ Cloud</button>
            </nav>
            <div id="ap-cloud-status" class="ap-cloud-status">
              <span id="ap-cloud-dot" class="ap-cloud-dot offline"></span>
              <span id="ap-cloud-label">Local only</span>
            </div>
            <button class="ap-panel-btn" onclick="CeceAdmin.closePanel()">Exit Dashboard</button>
          </aside>

          <main class="ap-main">
            <header class="ap-main-header">
              <h2>Admin Dashboard</h2>
              <p>Manage products, categories, social links, settings, and cloud sync.</p>
            </header>

            <div class="ap-quick-actions">
              <button class="ap-panel-btn" onclick="CeceAdmin.openModal(null)">+ Add Product</button>
              <button class="ap-panel-btn" onclick="CeceAdmin.setAdminTab('products')">Manage Products</button>
              <button class="ap-panel-btn" onclick="CeceAdmin.setAdminTab('cloud')">☁ Cloud Sync</button>
            </div>

            <section class="ap-tab-panel" data-panel="overview">
              <div class="ap-metrics-grid ap-metrics-grid--4">
                <article class="ap-metric-card"><p>In Stock</p><h3 id="metric-stock">0</h3></article>
                <article class="ap-metric-card"><p>Limited</p><h3 id="metric-limited">0</h3></article>
                <article class="ap-metric-card"><p>Sold Out</p><h3 id="metric-soldout">0</h3></article>
                <article class="ap-metric-card"><p>Total Products</p><h3 id="metric-products">0</h3></article>
              </div>

              <div class="ap-grid-2">
                <div class="ap-panel-card">
                  <h3>Stock Alerts</h3>
                  <div id="admin-low-stock"></div>
                </div>
                <div class="ap-panel-card">
                  <h3>Recent Activity</h3>
                  <ul id="admin-recent-activity" class="ap-activity-list"></ul>
                </div>
              </div>
            </section>

            <section class="ap-tab-panel" data-panel="products" hidden>
              <div class="ap-section-head">
                <h3>Product Management</h3>
                <button class="ap-panel-btn primary" onclick="CeceAdmin.openModal(null)">+ Add Product</button>
              </div>
              <div class="ap-settings-box">
                <div class="ap-settings-row">
                  <div class="ap-form-group">
                    <label class="ap-label">Search Product</label>
                    <input class="ap-input" id="admin-product-search" placeholder="Search by name...">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">Status Filter</label>
                    <select class="ap-input" id="admin-product-status">
                      <option value="all">All</option>
                      <option value="in">In Stock</option>
                      <option value="limited">Limited</option>
                      <option value="out">Sold Out</option>
                    </select>
                  </div>
                </div>
              </div>
              <div id="admin-products-list" class="ap-list"></div>
            </section>

            <section class="ap-tab-panel" data-panel="categories" hidden>
              <div class="ap-section-head"><h3>Category Management</h3></div>
              <form id="admin-category-form" class="ap-settings-box">
                <div class="ap-settings-row">
                  <div class="ap-form-group">
                    <label class="ap-label">Category Name</label>
                    <input class="ap-input" id="admin-category-name" placeholder="Street Essentials">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">Slug</label>
                    <input class="ap-input" id="admin-category-slug" placeholder="street-essentials">
                  </div>
                </div>
                <label class="ap-check"><input type="checkbox" id="admin-category-featured"> Featured Category</label>
                <div class="ap-actions" style="justify-content:flex-start">
                  <button class="ap-panel-btn primary" type="submit" id="admin-category-submit">Create Category</button>
                  <button class="ap-panel-btn" type="button" id="admin-category-cancel" hidden>Cancel Edit</button>
                </div>
              </form>
              <div id="admin-categories-list" class="ap-list"></div>
            </section>



            <section class="ap-tab-panel" data-panel="social" hidden>
              <div class="ap-section-head"><h3>Social Links Management</h3></div>
              <form id="admin-social-form" class="ap-settings-box">
                <div class="ap-settings-row">
                  <div class="ap-form-group">
                    <label class="ap-label">Instagram URL</label>
                    <input type="text" class="ap-input" id="admin-ig-url" placeholder="https://instagram.com/yourpage">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">Facebook URL</label>
                    <input type="text" class="ap-input" id="admin-fb-url" placeholder="https://facebook.com/yourpage">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">TikTok URL (future)</label>
                    <input type="text" class="ap-input" id="admin-tiktok-url" placeholder="https://tiktok.com/@yourpage">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">YouTube URL (future)</label>
                    <input type="text" class="ap-input" id="admin-youtube-url" placeholder="https://youtube.com/@yourpage">
                  </div>
                </div>
                <button class="ap-panel-btn primary" type="submit">Save Links</button>
                <p class="ap-msg" id="social-msg"></p>
              </form>
            </section>

            <section class="ap-tab-panel" data-panel="settings" hidden>
              <div class="ap-section-head"><h3>Settings Panel</h3></div>
              <form id="admin-settings-form" class="ap-settings-box">
                <div class="ap-settings-row">
                  <div class="ap-form-group">
                    <label class="ap-label">Site Name</label>
                    <input class="ap-input" id="admin-site-name" placeholder="CeCe">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">Tagline</label>
                    <input class="ap-input" id="admin-site-tagline" placeholder="Quality over everything">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">Contact Phone</label>
                    <input class="ap-input" id="admin-contact-phone" placeholder="+977 98XXXXXXXX">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">Theme Preset</label>
                    <select class="ap-input" id="admin-theme-preset">
                      <option value="classic-dark">Classic Dark</option>
                      <option value="editorial-light">Editorial Light</option>
                      <option value="mono-contrast">Mono Contrast</option>
                    </select>
                  </div>
                </div>
                <div class="ap-form-group">
                  <label class="ap-label">Instagram Order Message Template</label>
                  <textarea class="ap-input" id="admin-order-message-template" rows="5" placeholder="Use {brand_name}, {product_name}, {price}, {sizes}, {contact_phone}"></textarea>
                </div>
                <div class="ap-form-group">
                  <label class="ap-label">Instagram General Inquiry Template</label>
                  <textarea class="ap-input" id="admin-inquiry-message-template" rows="4" placeholder="Use {brand_name}, {contact_phone}"></textarea>
                </div>
                <div class="ap-check-row">
                  <label class="ap-check"><input type="checkbox" id="admin-notify-order"> Notify for new orders</label>
                  <label class="ap-check"><input type="checkbox" id="admin-notify-stock"> Notify for low stock</label>
                </div>
                <button class="ap-panel-btn primary" type="submit">Save Settings</button>
                <p class="ap-msg" id="settings-msg"></p>
              </form>

              <h3 class="ap-section-sub">Admin Security</h3>
              <div class="ap-settings-box">
                <div class="ap-settings-row">
                  <div class="ap-form-group" id="ap-old-pass-wrap">
                    <label class="ap-label">Current Password</label>
                    <input type="password" class="ap-input" id="admin-old-pass" placeholder="Current password">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">New Password</label>
                    <input type="password" class="ap-input" id="admin-new-pass" placeholder="New password">
                  </div>
                  <div class="ap-form-group">
                    <label class="ap-label">Confirm Password</label>
                    <input type="password" class="ap-input" id="admin-confirm-pass" placeholder="Confirm password">
                  </div>
                </div>
                <button class="ap-panel-btn primary" onclick="CeceAdmin.changePassword()" type="button">Update Password</button>
                <p class="ap-msg" id="pass-msg"></p>
              </div>
            </section>



            <section class="ap-tab-panel" data-panel="cloud" hidden>
              <div class="ap-section-head"><h3>Cloud Sync</h3></div>

              <div class="ap-settings-box">
                <div class="ap-form-group">
                  <label class="ap-label">Render API URL</label>
                  <input class="ap-input" id="cloud-api-url" placeholder="https://your-app.onrender.com" readonly>
                </div>
                <div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap">
                  <span id="cloud-conn-badge" class="ap-pill">Checking…</span>
                  <button class="ap-panel-btn" onclick="CeceAdmin.checkCloudConnection()">Test Connection</button>
                  <button class="ap-panel-btn" onclick="CeceAdmin.disconnectCloud()">Disconnect</button>
                  <button class="ap-panel-btn" onclick="CeceAdmin.syncCloudToLocal()">Pull from Cloud</button>
                </div>
              </div>

              <div class="ap-grid-2">
                <div class="ap-panel-card">
                  <h3>Backups</h3>
                  <div id="cloud-backups-list" class="ap-list"></div>
                  <div style="display:flex;gap:.6rem;margin-top:.7rem">
                    <button class="ap-panel-btn" onclick="CeceAdmin.loadBackups()">Refresh Backups</button>
                  </div>
                </div>
                <div class="ap-panel-card">
                  <h3>Analytics</h3>
                  <div id="cloud-analytics-summary"></div>
                  <div style="display:flex;gap:.6rem;margin-top:.7rem;flex-wrap:wrap">
                    <button class="ap-panel-btn" onclick="CeceAdmin.loadCloudAnalytics()">Refresh</button>
                    <button class="ap-panel-btn" onclick="CeceAdmin.clearCloudAnalytics()">Clear Data</button>
                  </div>
                </div>
              </div>

              <div class="ap-panel-card">
                <h3>Bulk Import / Export</h3>
                <div style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center">
                  <button class="ap-panel-btn primary" onclick="CeceAdmin.exportProducts()">Export Products JSON</button>
                  <label class="ap-panel-btn" style="cursor:pointer">
                    Import Products JSON
                    <input type="file" accept=".json" id="cloud-import-file" onchange="CeceAdmin.importProducts(this)" style="display:none">
                  </label>
                </div>
                <p class="ap-msg" id="cloud-import-msg" style="margin-top:.5rem"></p>
              </div>
            </section>
          </main>
        </div>
      </div>

      <div id="admin-modal">
        <div class="am-box">
          <h3 class="am-title" id="modal-title">Add Product</h3>
          <input type="hidden" id="modal-edit-id">

          <div class="ap-form-group">
            <label class="ap-label">Product Image</label>
            <div class="am-upload" onclick="document.getElementById('modal-img-file').click()">
              <img class="am-preview" id="modal-img-preview" alt="Preview">
              <span class="am-upload-text" id="modal-upload-text">Upload image (mock)</span>
              <input type="file" id="modal-img-file" accept="image/*" onchange="CeceAdmin.previewImage(this)" style="display:none">
            </div>
          </div>

          <div class="ap-settings-row">
            <div class="ap-form-group">
              <label class="ap-label">Product Name</label>
              <input type="text" class="ap-input" id="modal-prod-name" placeholder="CeCe Midnight Tee">
            </div>
            <div class="ap-form-group">
              <label class="ap-label">Price (NPR)</label>
              <input type="number" class="ap-input" id="modal-prod-price" placeholder="2500">
            </div>
          </div>

          <div class="ap-settings-row">
            <div class="ap-form-group">
              <label class="ap-label">Stock Status</label>
              <select class="ap-input" id="modal-prod-status">
                <option value="in">In Stock</option>
                <option value="limited">Limited</option>
                <option value="out">Sold Out</option>
              </select>
            </div>
            <div class="ap-form-group">
              <label class="ap-label">Category</label>
              <select class="ap-input" id="modal-prod-category">
                <option value="hoodies">Hoodies</option>
                <option value="tshirts">T-Shirts</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
          </div>

          <div class="ap-settings-row">
            <div class="ap-form-group">
              <label class="ap-label">Tags (comma separated)</label>
              <input type="text" class="ap-input" id="modal-prod-tags" placeholder="new drop, oversized">
            </div>
            <div class="ap-form-group">
              <label class="ap-label">Colors (comma separated)</label>
              <input type="text" class="ap-input" id="modal-prod-colors" placeholder="black, white">
            </div>
          </div>

          <div class="ap-form-group">
            <label class="ap-label">Variants: Size</label>
            <div class="am-sizes">
              <label><input type="checkbox" id="sz-xs"> XS</label>
              <label><input type="checkbox" id="sz-s"> S</label>
              <label><input type="checkbox" id="sz-m"> M</label>
              <label><input type="checkbox" id="sz-l"> L</label>
              <label><input type="checkbox" id="sz-xl"> XL</label>
              <label><input type="checkbox" id="sz-xxl"> XXL</label>
            </div>
          </div>

          <div class="am-actions">
            <button class="ap-panel-btn" onclick="CeceAdmin.closeModal()">Cancel</button>
            <button class="ap-panel-btn primary" onclick="CeceAdmin.saveProduct()">Save Product</button>
          </div>
        </div>
      </div>
    `;
  }

  function getAdminStyles() {
    return `<style>
      :root{
        --ap-bg:#0a0908;
        --ap-bg-2:#11100f;
        --ap-card:#171411;
        --ap-border:rgba(255,201,132,.18);
        --ap-border-soft:rgba(255,255,255,.1);
        --ap-text:#f8f2e8;
        --ap-text-soft:rgba(248,242,232,.66);
        --ap-accent:#efad35;
        --ap-accent-2:#df4b23;
        --ap-ink:#2a1e14;
      }

      html.performance-mode #admin-overlay,
      html.performance-mode #admin-modal,
      html.performance-mode .ap-panel-card,
      html.performance-mode #admin-panel::before,
      html.performance-mode #admin-panel::after{
        backdrop-filter:none !important;
        filter:none !important;
      }

      html.performance-mode #admin-panel::before,
      html.performance-mode #admin-panel::after{
        display:none;
        animation:none !important;
      }

      html.performance-mode .ap-main-header,
      html.performance-mode .ap-quick-actions,
      html.performance-mode .ap-tab-panel{
        animation:none !important;
      }

      #admin-overlay{display:none;position:fixed;inset:0;background:radial-gradient(circle at 22% 18%,rgba(239,173,53,.2),transparent 38%),radial-gradient(circle at 80% 70%,rgba(223,75,35,.18),transparent 40%),rgba(6,6,6,.95);backdrop-filter:blur(8px);z-index:1000;align-items:center;justify-content:center}
      #admin-overlay.active{display:flex}
      .ao-close{position:absolute;top:1.3rem;right:1.3rem;background:none;border:none;color:var(--ap-text);font-family:var(--font-mono);font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;opacity:.68;cursor:pointer;transition:opacity .2s ease,transform .2s ease}
      .ao-close:hover{opacity:1;transform:translateY(-1px)}
      .ao-box{width:min(92vw,400px);padding:2.1rem;background:linear-gradient(155deg,rgba(28,24,21,.94),rgba(16,15,13,.94));border:1px solid var(--ap-border);border-radius:18px;box-shadow:0 20px 90px rgba(0,0,0,.45)}
      .ao-title{font-family:var(--font-display);font-size:2.1rem;letter-spacing:.09em;line-height:1;color:var(--ap-text)}
      .ao-sub{font-family:var(--font-mono);font-size:.58rem;letter-spacing:.16em;text-transform:uppercase;opacity:.62;margin:.32rem 0 1.15rem;color:var(--ap-text)}
      .ao-error{font-family:var(--font-mono);font-size:.58rem;color:#ffae88;display:none;margin-bottom:.8rem}
      .ao-input{width:100%;padding:.82rem .94rem;background:rgba(19,18,17,.9);border:1px solid var(--ap-border-soft);color:var(--ap-text);border-radius:10px;outline:none;transition:border-color .2s ease,box-shadow .2s ease}
      .ao-input:focus{border-color:rgba(239,173,53,.65);box-shadow:0 0 0 3px rgba(239,173,53,.14)}
      .ao-btn{width:100%;margin-top:.9rem;padding:.74rem;border:0;border-radius:10px;background:linear-gradient(135deg,var(--ap-accent-2),var(--ap-accent));color:#fff;font-family:var(--font-mono);font-size:.66rem;letter-spacing:.11em;text-transform:uppercase;cursor:pointer;transition:transform .18s ease,box-shadow .22s ease;box-shadow:0 8px 22px rgba(223,75,35,.34)}
      .ao-btn:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(223,75,35,.42)}

      #admin-panel{display:none;position:fixed;inset:0;background:var(--ap-bg);z-index:1000;overflow:hidden;isolation:isolate}
      #admin-panel::before{content:"";position:absolute;inset:-20% -10% auto auto;width:560px;height:560px;background:radial-gradient(circle,rgba(239,173,53,.16),transparent 62%);filter:blur(8px);pointer-events:none;animation:apFloat 16s ease-in-out infinite}
      #admin-panel::after{content:"";position:absolute;inset:auto auto -20% -8%;width:520px;height:520px;background:radial-gradient(circle,rgba(223,75,35,.14),transparent 65%);filter:blur(8px);pointer-events:none;animation:apFloat 18s ease-in-out infinite reverse}
      #admin-panel.active{display:block}
      #admin-toast-stack{position:absolute;top:1rem;right:1rem;display:grid;gap:.6rem;z-index:30;pointer-events:none}
      .ap-toast{min-width:220px;max-width:340px;padding:.66rem .82rem;border-radius:10px;background:rgba(24,21,18,.95);border:1px solid rgba(255,255,255,.14);color:var(--ap-text);font-family:var(--font-mono);font-size:.58rem;letter-spacing:.08em;opacity:0;transform:translateY(-8px);transition:opacity .2s ease,transform .2s ease,box-shadow .2s ease;box-shadow:0 10px 24px rgba(0,0,0,.35)}
      .ap-toast.show{opacity:1;transform:translateY(0)}
      .ap-toast.success{border-color:rgba(66,245,132,.42)}
      .ap-toast.warn{border-color:rgba(239,173,53,.45)}
      .ap-toast.error{border-color:rgba(255,111,111,.5)}

      .ap-shell{display:grid;grid-template-columns:268px 1fr;height:100%;position:relative;z-index:1}
      .ap-sidebar{background:linear-gradient(180deg,rgba(20,17,14,.95),rgba(12,11,10,.95));border-right:1px solid var(--ap-border-soft);padding:1.1rem;display:flex;flex-direction:column;gap:1rem;box-shadow:inset -1px 0 0 rgba(239,173,53,.12)}
      .ap-brand{font-family:var(--font-display);font-size:1.76rem;letter-spacing:.09em;line-height:1;color:var(--ap-text)}
      .ap-brand span{display:block;font-family:var(--font-mono);font-size:.55rem;letter-spacing:.15em;text-transform:uppercase;opacity:.58;margin-top:.32rem;color:var(--ap-text-soft)}
      .ap-sidebar-nav{display:grid;gap:.46rem}
      .ap-sidebar-nav button{padding:.64rem .75rem;text-align:left;border:1px solid transparent;border-radius:10px;background:transparent;color:rgba(245,240,232,.83);font-family:var(--font-mono);font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:all .18s ease}
      .ap-sidebar-nav button:hover{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12);transform:translateX(2px)}
      .ap-sidebar-nav button.is-active{background:linear-gradient(135deg,rgba(223,75,35,.32),rgba(239,173,53,.26));border-color:rgba(239,173,53,.55);color:#fff;box-shadow:0 10px 20px rgba(223,75,35,.2)}
      .ap-panel-btn{padding:.64rem .84rem;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(22,21,19,.8);color:#fff;font-family:var(--font-mono);font-size:.57rem;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:all .18s ease}
      .ap-panel-btn:hover{border-color:rgba(239,173,53,.58);transform:translateY(-1px)}
      .ap-panel-btn.primary{border:0;background:linear-gradient(135deg,var(--ap-accent-2),var(--ap-accent));box-shadow:0 10px 24px rgba(223,75,35,.28)}
      .ap-panel-btn.primary:hover{box-shadow:0 14px 30px rgba(223,75,35,.38)}

      .ap-main{overflow:auto;padding:1.35rem 1.5rem 2.2rem;background:linear-gradient(180deg,rgba(255,255,255,.01),transparent 32%)}
      .ap-main-header{padding:.15rem 0 1.05rem;animation:apReveal .35s ease both}
      .ap-main-header h2{font-family:var(--font-display);font-size:2.15rem;letter-spacing:.08em;color:var(--ap-text);line-height:1}
      .ap-main-header p{font-family:var(--font-body);opacity:.82;color:var(--ap-text-soft);margin-top:.35rem;max-width:560px}
      .ap-quick-actions{display:flex;gap:.65rem;flex-wrap:wrap;margin:0 0 .9rem;animation:apReveal .42s ease both}

      .ap-tab-panel{display:grid;gap:1rem;animation:apReveal .46s ease both}
      .ap-metrics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.8rem}
      .ap-metrics-grid--4{grid-template-columns:repeat(4,minmax(0,1fr))}
      .ap-metric-card{background:linear-gradient(165deg,rgba(28,24,20,.84),rgba(18,16,14,.84));border:1px solid var(--ap-border-soft);border-radius:14px;padding:1rem;position:relative;overflow:hidden;transition:transform .2s ease,border-color .2s ease}
      .ap-metric-card::before{content:"";position:absolute;inset:auto -20% -30% auto;width:180px;height:180px;background:radial-gradient(circle,rgba(239,173,53,.18),transparent 65%)}
      .ap-metric-card:hover{transform:translateY(-2px);border-color:rgba(239,173,53,.4)}
      .ap-metric-card p{font-family:var(--font-mono);font-size:.54rem;letter-spacing:.14em;text-transform:uppercase;opacity:.7;color:var(--ap-text)}
      .ap-metric-card h3{font-family:var(--font-display);font-size:1.7rem;letter-spacing:.06em;margin-top:.34rem;color:var(--ap-text)}

      .ap-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
      .ap-grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}
      .ap-panel-card{background:linear-gradient(165deg,rgba(25,22,19,.86),rgba(18,16,14,.86));border:1px solid var(--ap-border-soft);border-radius:14px;padding:1.04rem;backdrop-filter:blur(4px);transition:border-color .2s ease,transform .2s ease}
      .ap-panel-card:hover{border-color:rgba(239,173,53,.34);transform:translateY(-1px)}
      .ap-panel-card h3{font-family:var(--font-display);font-size:1.22rem;letter-spacing:.07em;margin-bottom:.72rem;color:var(--ap-text)}
      .ap-section-head{display:flex;justify-content:space-between;align-items:center;gap:.7rem;flex-wrap:wrap}
      .ap-section-head h3{font-family:var(--font-display);font-size:1.52rem;letter-spacing:.08em;color:var(--ap-text)}
      .ap-section-sub{font-family:var(--font-display);font-size:1.18rem;letter-spacing:.07em;margin-top:.4rem;color:var(--ap-text)}

      .ap-list{display:grid;gap:.6rem}
      .ap-row{display:grid;grid-template-columns:78px 1fr auto;gap:.95rem;align-items:center;background:linear-gradient(165deg,rgba(25,22,19,.82),rgba(18,16,14,.82));border:1px solid var(--ap-border-soft);border-radius:14px;padding:.84rem;transition:transform .18s ease,border-color .18s ease}
      .ap-row:hover{transform:translateY(-1px);border-color:rgba(239,173,53,.32)}
      .ap-row.compact{grid-template-columns:1fr auto}
      .ap-thumb{width:78px;height:64px;background:#1f1b17;border-radius:10px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.62rem;opacity:.6;border:1px solid rgba(255,255,255,.08)}
      .ap-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
      .ap-info{min-width:0}
      .ap-name{font-family:var(--font-display);font-size:1.08rem;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ap-text)}
      .ap-meta{font-family:var(--font-mono);font-size:.55rem;letter-spacing:.08em;opacity:.7;margin-top:.22rem;color:var(--ap-text-soft)}
      .ap-actions{display:flex;gap:.45rem;flex-wrap:wrap;justify-content:flex-end}
      .ap-btn{padding:.47rem .64rem;border-radius:8px;border:1px solid rgba(255,255,255,.16);background:rgba(25,23,20,.8);color:#fff;font-family:var(--font-mono);font-size:.52rem;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:all .18s ease}
      .ap-btn:hover{border-color:rgba(239,173,53,.55);transform:translateY(-1px)}
      .ap-btn.del:hover{border-color:rgba(255,103,103,.58);color:#ffb5b5}
      .ap-btn:disabled{opacity:.4;cursor:not-allowed}
      .ap-tags-wrap{display:flex;flex-wrap:wrap;gap:.32rem;margin-top:.37rem}
      .ap-tag{font-family:var(--font-mono);font-size:.5rem;padding:.2rem .45rem;border-radius:999px;background:rgba(239,173,53,.16);border:1px solid rgba(239,173,53,.3)}

      .ap-settings-box{background:linear-gradient(165deg,rgba(25,22,19,.84),rgba(18,16,14,.84));border:1px solid var(--ap-border-soft);border-radius:14px;padding:1rem;display:grid;gap:.82rem}
      .ap-settings-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.82rem}
      .ap-form-group{display:grid;gap:.35rem}
      .ap-label{font-family:var(--font-mono);font-size:.54rem;letter-spacing:.14em;text-transform:uppercase;opacity:.7;color:var(--ap-text)}
      .ap-input{width:100%;background:rgba(18,17,15,.92);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#fff;padding:.64rem .74rem;font-family:var(--font-body);font-size:.84rem;outline:none;transition:border-color .2s ease,box-shadow .2s ease}
      .ap-input:focus{border-color:rgba(239,173,53,.62);box-shadow:0 0 0 3px rgba(239,173,53,.12)}
      .ap-input option{background:#161616}
      .ap-check-row{display:flex;gap:1rem;flex-wrap:wrap}
      .ap-check{font-family:var(--font-mono);font-size:.57rem;letter-spacing:.07em;display:flex;align-items:center;gap:.38rem;opacity:.88;color:var(--ap-text)}
      .ap-check input{accent-color:#efad35}
      .ap-msg{font-family:var(--font-mono);font-size:.56rem;letter-spacing:.08em;color:#efad35;display:none}

      .ap-mini-row{display:flex;align-items:center;justify-content:space-between;gap:.62rem;padding:.6rem .12rem;border-bottom:1px dashed rgba(255,255,255,.12)}
      .ap-mini-row:last-child{border-bottom:0}
      .ap-mini-title{font-family:var(--font-body);font-weight:600;color:var(--ap-text)}
      .ap-mini-sub{font-family:var(--font-mono);font-size:.55rem;opacity:.66;color:var(--ap-text-soft)}
      .ap-pill{font-family:var(--font-mono);font-size:.5rem;letter-spacing:.08em;text-transform:uppercase;padding:.2rem .5rem;border-radius:999px;background:rgba(239,173,53,.2);border:1px solid rgba(239,173,53,.4)}
      .ap-alert{padding:.56rem .66rem;border-radius:10px;border:1px solid rgba(239,173,53,.38);background:rgba(239,173,53,.14);font-family:var(--font-mono);font-size:.55rem;letter-spacing:.06em;margin-bottom:.48rem;color:#ffe2b2}
      .ap-alert.warning{border-color:rgba(239,173,53,.42)}

      .ap-activity-list{list-style:none;display:grid;gap:.5rem}
      .ap-activity-item{padding:.52rem .66rem;background:rgba(24,22,19,.86);border:1px solid rgba(255,255,255,.12);border-radius:10px;font-family:var(--font-mono);font-size:.56rem;letter-spacing:.06em;color:var(--ap-text-soft)}

      .ap-card-grid{display:grid;gap:.6rem}
      .ap-card{padding:.74rem;background:#171718;border:1px solid rgba(255,255,255,.1);border-radius:10px}
      .ap-card-head{display:flex;justify-content:space-between;gap:.6rem;margin-bottom:.3rem}

      .ap-bars{height:170px;display:flex;align-items:flex-end;gap:.45rem;padding-top:.6rem}
      .ap-bar-col{flex:1;display:grid;gap:.35rem;justify-items:center}
      .ap-bar{width:100%;max-width:26px;border-radius:8px 8px 4px 4px;background:linear-gradient(180deg,#efad35,#df4b23)}
      .ap-bar-col span{font-family:var(--font-mono);font-size:.52rem;opacity:.65}

      #admin-modal{display:none;position:fixed;inset:0;background:radial-gradient(circle at 20% 16%,rgba(239,173,53,.16),transparent 36%),rgba(6,6,6,.94);z-index:1200;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(6px)}
      #admin-modal.active{display:flex}
      .am-box{width:min(920px,95vw);max-height:92vh;overflow:auto;background:linear-gradient(165deg,rgba(26,23,19,.94),rgba(17,15,13,.94));border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:1.2rem;box-shadow:0 22px 80px rgba(0,0,0,.5)}
      .am-title{font-family:var(--font-display);font-size:1.65rem;letter-spacing:.08em;margin-bottom:.92rem;color:var(--ap-text)}
      .am-upload{min-height:112px;border:1px dashed rgba(255,255,255,.22);border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden;background:rgba(16,15,13,.72)}
      .am-upload:hover{border-color:rgba(239,173,53,.54)}
      .am-upload-text{font-family:var(--font-mono);font-size:.55rem;letter-spacing:.09em;opacity:.68;color:var(--ap-text-soft)}
      .am-preview{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}
      .am-sizes{display:flex;gap:.72rem;flex-wrap:wrap}
      .am-sizes label{font-family:var(--font-mono);font-size:.58rem;display:flex;align-items:center;gap:.3rem;color:var(--ap-text)}
      .am-sizes input{accent-color:#efad35}
      .am-actions{display:flex;gap:.6rem;justify-content:flex-end;margin-top:.8rem}

      .ap-empty{font-family:var(--font-mono);font-size:.58rem;opacity:.62;padding:.8rem;color:var(--ap-text-soft)}

      .ap-cloud-status{display:flex;align-items:center;gap:.46rem;padding:.48rem .56rem;border:1px solid rgba(255,255,255,.14);border-radius:10px;margin-top:auto;background:rgba(255,255,255,.02)}
      .ap-cloud-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
      .ap-cloud-dot.online{background:#42f584;box-shadow:0 0 10px #42f58488}
      .ap-cloud-dot.configured{background:#efad35;box-shadow:0 0 10px #efad3566}
      .ap-cloud-dot.offline{background:rgba(255,255,255,.3)}
      #ap-cloud-label{font-family:var(--font-mono);font-size:.52rem;letter-spacing:.08em;opacity:.76;color:var(--ap-text)}

      @keyframes apFloat{
        0%,100%{transform:translateY(0) translateX(0)}
        50%{transform:translateY(-18px) translateX(6px)}
      }

      @keyframes apReveal{
        from{opacity:0;transform:translateY(8px)}
        to{opacity:1;transform:translateY(0)}
      }

      @media(max-width:1100px){
        .ap-shell{grid-template-columns:220px 1fr}
        .ap-metrics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .ap-grid-3{grid-template-columns:1fr}
      }

      @media(max-width:860px){
        .ap-shell{grid-template-columns:1fr}
        .ap-sidebar{border-right:0;border-bottom:1px solid rgba(255,255,255,.12)}
        .ap-sidebar-nav{grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem}
        .ap-sidebar-nav button{text-align:center;padding:.52rem .35rem}
        .ap-settings-row{grid-template-columns:1fr}
        .ap-grid-2{grid-template-columns:1fr}
      }

      @media(max-width:640px){
        .ap-main{padding:.92rem}
        .ap-main-header h2{font-size:1.6rem}
        .ap-row{grid-template-columns:1fr}
        .ap-actions{justify-content:flex-start}
        .ap-thumb{width:100%;height:132px}
        .ap-sidebar-nav{grid-template-columns:repeat(2,minmax(0,1fr))}
        .am-box{padding:1rem}
      }
    </style>`;
  }

  return {
    openLogin,
    closeLogin,
    doLogin,
    openPanel,
    closePanel,
    setAdminTab,
    openModal,
    closeModal,
    previewImage,
    saveProduct,
    deleteProduct,
    renderProductList,
    createCategory,
    editCategory,
    moveCategory,
    deleteCategory,
    createPromotion,
    editPromotion,
    cyclePromotionStatus,
    deletePromotion,
    cycleOrderStatus,
    markShipmentDone,
    viewCustomer,
    messageCustomer,
    resetDemoData,
    saveSocialLinks,
    changePassword,
    checkCloudConnection,
    disconnectCloud,
    syncCloudToLocal,
    loadBackups,
    restoreBackup,
    loadCloudAnalytics,
    clearCloudAnalytics,
    exportProducts,
    importProducts,
  };
})();
