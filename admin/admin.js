/* ============================================
   admin/admin.js
   All admin panel logic.
   Login, product CRUD, settings.
   ============================================ */

const CeceAdmin = (() => {

  // ── INJECT ADMIN HTML INTO PAGE ──
  function injectHTML() {
    const mount = document.getElementById('admin-mount');
    if (!mount || mount.dataset.loaded) return;
    mount.dataset.loaded = 'true';
    mount.innerHTML = getAdminHTML() + getAdminStyles();
  }

  // ── OPEN LOGIN ──
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

  // ── LOGIN ATTEMPT ──
  function doLogin() {
    const passInput = document.getElementById('admin-pass');
    const err       = document.getElementById('admin-error');
    if (!passInput) return;

    if (CeceData.checkPassword(passInput.value)) {
      closeLogin();
      openPanel();
    } else {
      if (err) err.style.display = 'block';
      passInput.value = '';
      passInput.focus();
    }
  }

  // ── OPEN ADMIN PANEL ──
  function openPanel() {
    injectHTML();
    const panel = document.getElementById('admin-panel');
    if (panel) panel.classList.add('active');
    renderProductList();
    loadSocialInputs();
  }

  function closePanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) panel.classList.remove('active');
    // Re-render public site to reflect any changes
    CeceProducts.render();
    const socials = CeceData.getSocials();
    const igLink  = document.getElementById('footer-ig');
    const fbLink  = document.getElementById('footer-fb');
    if (igLink) igLink.href = socials.ig;
    if (fbLink) fbLink.href = socials.fb;
  }

  // ── RENDER ADMIN PRODUCT LIST ──
  function renderProductList() {
    const list     = document.getElementById('admin-products-list');
    const products = CeceData.getProducts();
    if (!list) return;

    if (!products.length) {
      list.innerHTML = `<div class="ap-empty">No products yet. Add your first product above.</div>`;
      return;
    }

    const STATUS_LABELS = { in: 'In Stock', limited: 'Limited', out: 'Sold Out' };

    list.innerHTML = products.map(p => `
      <div class="ap-row">
        <div class="ap-thumb">
          ${p.img ? `<img src="${p.img}" alt="${p.name}">` : 'IMG'}
        </div>
        <div class="ap-info">
          <div class="ap-name">${p.name}</div>
          <div class="ap-meta">NPR ${Number(p.price).toLocaleString()} · ${p.sizes.join(', ')} · ${STATUS_LABELS[p.status] || ''}</div>
        </div>
        <div class="ap-actions">
          <button class="ap-btn edit" onclick="CeceAdmin.openModal(${p.id})">Edit</button>
          <button class="ap-btn del"  onclick="CeceAdmin.deleteProduct(${p.id})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  // ── LOAD SOCIAL INPUTS ──
  function loadSocialInputs() {
    const socials = CeceData.getSocials();
    const igInput = document.getElementById('admin-ig-url');
    const fbInput = document.getElementById('admin-fb-url');
    if (igInput) igInput.value = socials.ig;
    if (fbInput) fbInput.value = socials.fb;
  }

  // ── SAVE SOCIAL LINKS ──
  function saveSocialLinks() {
    const ig = document.getElementById('admin-ig-url').value.trim();
    const fb = document.getElementById('admin-fb-url').value.trim();
    CeceData.saveSocials({
      ig: ig || 'https://instagram.com',
      fb: fb || 'https://facebook.com',
    });
    showMsg('social-msg', 'Links saved!');
  }

  // ── CHANGE PASSWORD ──
  function changePassword() {
    const np  = document.getElementById('admin-new-pass').value;
    const cp  = document.getElementById('admin-confirm-pass').value;
    if (!np)       return showMsg('pass-msg', 'Enter a new password.');
    if (np !== cp) return showMsg('pass-msg', 'Passwords do not match.');
    CeceData.setPassword(np);
    document.getElementById('admin-new-pass').value    = '';
    document.getElementById('admin-confirm-pass').value = '';
    showMsg('pass-msg', 'Password updated!');
  }

  // ── PRODUCT MODAL ──
  let _currentImg = '';

  function openModal(id = null) {
    injectHTML();
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    modal.classList.add('active');
    _currentImg = '';
    resetModal();

    if (id !== null) {
      const p = CeceData.getProductById(id);
      if (!p) return;
      document.getElementById('modal-title').textContent      = 'Edit Product';
      document.getElementById('modal-edit-id').value          = id;
      document.getElementById('modal-prod-name').value        = p.name;
      document.getElementById('modal-prod-price').value       = p.price;
      document.getElementById('modal-prod-status').value      = p.status;
      const sizeMap = { XS:'sz-xs', S:'sz-s', M:'sz-m', L:'sz-l', XL:'sz-xl', XXL:'sz-xxl' };
      p.sizes.forEach(s => {
        const el = document.getElementById(sizeMap[s]);
        if (el) el.checked = true;
      });
      if (p.img) {
        _currentImg = p.img;
        const preview = document.getElementById('modal-img-preview');
        const txt     = document.getElementById('modal-upload-text');
        preview.src           = p.img;
        preview.style.display = 'block';
        txt.style.display     = 'none';
      }
    } else {
      document.getElementById('modal-title').textContent = 'Add Product';
    }
  }

  function closeModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.classList.remove('active');
  }

  function resetModal() {
    document.getElementById('modal-edit-id').value     = '';
    document.getElementById('modal-prod-name').value   = '';
    document.getElementById('modal-prod-price').value  = '';
    document.getElementById('modal-prod-status').value = 'in';
    ['sz-xs','sz-s','sz-m','sz-l','sz-xl','sz-xxl'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    const preview = document.getElementById('modal-img-preview');
    const txt     = document.getElementById('modal-upload-text');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (txt)     txt.style.display = 'block';
  }

  function previewImage(input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      _currentImg = e.target.result;
      const preview = document.getElementById('modal-img-preview');
      const txt     = document.getElementById('modal-upload-text');
      preview.src           = _currentImg;
      preview.style.display = 'block';
      txt.style.display     = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  }

  function saveProduct() {
    const name   = document.getElementById('modal-prod-name').value.trim();
    const price  = document.getElementById('modal-prod-price').value;
    const status = document.getElementById('modal-prod-status').value;

    if (!name || !price) {
      alert('Please fill in product name and price.');
      return;
    }

    const sizeMap = { 'sz-xs':'XS','sz-s':'S','sz-m':'M','sz-l':'L','sz-xl':'XL','sz-xxl':'XXL' };
    const sizes   = Object.entries(sizeMap)
      .filter(([id]) => document.getElementById(id)?.checked)
      .map(([, v]) => v);

    if (!sizes.length) {
      alert('Please select at least one size.');
      return;
    }

    const productData = { name, price: parseInt(price), status, sizes, img: _currentImg };
    const editId      = document.getElementById('modal-edit-id').value;

    if (editId) {
      CeceData.updateProduct(parseInt(editId), productData);
    } else {
      CeceData.addProduct(productData);
    }

    closeModal();
    renderProductList();
  }

  function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    CeceData.deleteProduct(id);
    renderProductList();
  }

  // ── UTILITY ──
  function showMsg(elementId, text) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent     = text;
    el.style.display   = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }

  // ── ADMIN HTML TEMPLATE ──
  function getAdminHTML() {
    return `
      <!-- ADMIN LOGIN -->
      <div id="admin-overlay">
        <button class="ao-close" onclick="CeceAdmin.closeLogin()">✕ Close</button>
        <div class="ao-box">
          <h2 class="ao-title">Admin Access</h2>
          <p class="ao-sub">CeCe Store Management</p>
          <p class="ao-error" id="admin-error">Incorrect password.</p>
          <input type="password" class="ao-input" id="admin-pass" placeholder="Enter password"
            onkeydown="if(event.key==='Enter') CeceAdmin.doLogin()">
          <button class="ao-btn" onclick="CeceAdmin.doLogin()">Enter</button>
        </div>
      </div>

      <!-- ADMIN PANEL -->
      <div id="admin-panel">
        <div class="ap-nav">
          <div class="ap-nav-title">CeCe Admin <span>Store Management</span></div>
          <div class="ap-nav-actions">
            <button class="ap-panel-btn primary" onclick="CeceAdmin.openModal(null)">+ Add Product</button>
            <button class="ap-panel-btn" onclick="CeceAdmin.closePanel()">Exit</button>
          </div>
        </div>

        <div class="ap-body">
          <h3 class="ap-section-title">Products</h3>
          <div id="admin-products-list" class="ap-list"></div>

          <h3 class="ap-section-title">Social Links</h3>
          <div class="ap-settings-box">
            <div class="ap-settings-row">
              <div class="ap-form-group">
                <label class="ap-label">Instagram URL</label>
                <input type="text" class="ap-input" id="admin-ig-url" placeholder="https://instagram.com/yourpage">
              </div>
              <div class="ap-form-group">
                <label class="ap-label">Facebook URL</label>
                <input type="text" class="ap-input" id="admin-fb-url" placeholder="https://facebook.com/yourpage">
              </div>
            </div>
            <button class="ap-panel-btn primary" onclick="CeceAdmin.saveSocialLinks()">Save Links</button>
            <p class="ap-msg" id="social-msg"></p>
          </div>

          <h3 class="ap-section-title">Change Password</h3>
          <div class="ap-settings-box">
            <div class="ap-settings-row">
              <div class="ap-form-group">
                <label class="ap-label">New Password</label>
                <input type="password" class="ap-input" id="admin-new-pass" placeholder="New password">
              </div>
              <div class="ap-form-group">
                <label class="ap-label">Confirm Password</label>
                <input type="password" class="ap-input" id="admin-confirm-pass" placeholder="Confirm password">
              </div>
            </div>
            <button class="ap-panel-btn primary" onclick="CeceAdmin.changePassword()">Update Password</button>
            <p class="ap-msg" id="pass-msg"></p>
          </div>
        </div>
      </div>

      <!-- PRODUCT MODAL -->
      <div id="admin-modal">
        <div class="am-box">
          <h3 class="am-title" id="modal-title">Add Product</h3>
          <input type="hidden" id="modal-edit-id">

          <div class="ap-form-group">
            <label class="ap-label">Product Photo</label>
            <div class="am-upload" onclick="document.getElementById('modal-img-file').click()">
              <img class="am-preview" id="modal-img-preview">
              <span class="am-upload-text" id="modal-upload-text">Click to upload photo</span>
              <input type="file" id="modal-img-file" accept="image/*"
                onchange="CeceAdmin.previewImage(this)" style="display:none">
            </div>
          </div>

          <div class="ap-form-group">
            <label class="ap-label">Product Name</label>
            <input type="text" class="ap-input" id="modal-prod-name" placeholder="CeCe Summer Jacket Vol.1">
          </div>
          <div class="ap-form-group">
            <label class="ap-label">Price (NPR)</label>
            <input type="number" class="ap-input" id="modal-prod-price" placeholder="3500">
          </div>
          <div class="ap-form-group">
            <label class="ap-label">Stock Status</label>
            <select class="ap-input" id="modal-prod-status">
              <option value="in">In Stock</option>
              <option value="limited">Limited</option>
              <option value="out">Sold Out</option>
            </select>
          </div>
          <div class="ap-form-group">
            <label class="ap-label">Sizes</label>
            <div class="am-sizes">
              <label><input type="checkbox" id="sz-xs" value="XS"> XS</label>
              <label><input type="checkbox" id="sz-s"  value="S">  S</label>
              <label><input type="checkbox" id="sz-m"  value="M">  M</label>
              <label><input type="checkbox" id="sz-l"  value="L">  L</label>
              <label><input type="checkbox" id="sz-xl" value="XL"> XL</label>
              <label><input type="checkbox" id="sz-xxl" value="XXL"> XXL</label>
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

  // ── ADMIN STYLES ──
  function getAdminStyles() {
    return `<style>
      #admin-overlay{display:none;position:fixed;inset:0;background:rgba(8,8,8,.97);z-index:1000;align-items:center;justify-content:center;flex-direction:column}
      #admin-overlay.active{display:flex}
      .ao-close{position:absolute;top:2rem;right:2rem;font-family:var(--font-mono);font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;opacity:.4;cursor:crosshair;background:none;border:none;color:var(--white)}
      .ao-close:hover{opacity:1}
      .ao-box{width:100%;max-width:400px;padding:3rem;border:1px solid var(--border)}
      .ao-title{font-family:var(--font-display);font-size:2.5rem;letter-spacing:.1em;margin-bottom:.5rem}
      .ao-sub{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;opacity:.4;margin-bottom:2rem}
      .ao-error{font-family:var(--font-mono);font-size:.6rem;color:var(--accent);margin-bottom:1rem;display:none;letter-spacing:.1em}
      .ao-input{width:100%;background:transparent;border:1px solid var(--border);color:var(--white);font-family:var(--font-mono);font-size:.85rem;padding:.8rem 1rem;margin-bottom:1rem;outline:none;transition:border-color .2s;letter-spacing:.1em}
      .ao-input:focus{border-color:var(--accent)}
      .ao-btn{width:100%;background:var(--accent);color:var(--white);border:none;font-family:var(--font-display);font-size:1.2rem;letter-spacing:.2em;padding:.9rem;cursor:crosshair;transition:opacity .2s}
      .ao-btn:hover{opacity:.85}
      #admin-panel{display:none;position:fixed;inset:0;background:#080808;z-index:1000;overflow-y:auto}
      #admin-panel.active{display:block}
      .ap-nav{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 3rem;border-bottom:1px solid var(--border);position:sticky;top:0;background:#080808;z-index:10}
      .ap-nav-title{font-family:var(--font-display);font-size:1.8rem;letter-spacing:.1em}
      .ap-nav-title span{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;opacity:.4;margin-left:1rem}
      .ap-nav-actions{display:flex;gap:1rem}
      .ap-panel-btn{font-family:var(--font-mono);font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;padding:.6rem 1.2rem;border:1px solid var(--border);background:transparent;color:var(--white);cursor:crosshair;transition:all .2s}
      .ap-panel-btn:hover{background:var(--muted)}
      .ap-panel-btn.primary{background:var(--accent);border-color:var(--accent)}
      .ap-panel-btn.primary:hover{opacity:.8}
      .ap-body{padding:3rem}
      .ap-section-title{font-family:var(--font-display);font-size:2rem;letter-spacing:.1em;margin-bottom:1.5rem;padding-bottom:.8rem;border-bottom:1px solid var(--border)}
      .ap-list{display:grid;gap:1px;background:var(--border);margin-bottom:3rem}
      .ap-row{background:#0f0f0f;padding:1.5rem 2rem;display:grid;grid-template-columns:80px 1fr auto;gap:1.5rem;align-items:center}
      .ap-thumb{width:80px;height:60px;background:var(--muted);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.7rem;opacity:.3;position:relative;overflow:hidden;flex-shrink:0}
      .ap-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
      .ap-name{font-family:var(--font-display);font-size:1.2rem;letter-spacing:.05em;margin-bottom:.3rem}
      .ap-meta{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.1em;opacity:.4}
      .ap-actions{display:flex;gap:.5rem}
      .ap-btn{font-family:var(--font-mono);font-size:.55rem;letter-spacing:.1em;text-transform:uppercase;padding:.4rem .8rem;border:1px solid var(--border);background:transparent;color:var(--white);cursor:crosshair;transition:all .2s}
      .ap-btn.edit:hover{border-color:var(--accent2);color:var(--accent2)}
      .ap-btn.del:hover{border-color:var(--accent);color:var(--accent)}
      .ap-empty{padding:2rem;font-family:var(--font-mono);font-size:.65rem;opacity:.4;letter-spacing:.1em}
      .ap-settings-box{background:#0f0f0f;border:1px solid var(--border);padding:2rem;margin-bottom:2rem}
      .ap-settings-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
      .ap-form-group{margin-bottom:1.2rem}
      .ap-label{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;opacity:.5;display:block;margin-bottom:.5rem}
      .ap-input{width:100%;background:transparent;border:1px solid var(--border);color:var(--white);font-family:var(--font-body);font-size:.9rem;padding:.7rem 1rem;outline:none;transition:border-color .2s;-webkit-appearance:none}
      .ap-input:focus{border-color:var(--accent)}
      .ap-input option{background:#0f0f0f}
      .ap-msg{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.1em;margin-top:.8rem;color:var(--accent2);display:none}
      #admin-modal{display:none;position:fixed;inset:0;background:rgba(8,8,8,.95);z-index:2000;align-items:center;justify-content:center;padding:2rem}
      #admin-modal.active{display:flex}
      .am-box{width:100%;max-width:560px;border:1px solid var(--border);background:#0f0f0f;padding:2.5rem;max-height:90vh;overflow-y:auto}
      .am-title{font-family:var(--font-display);font-size:2rem;letter-spacing:.1em;margin-bottom:2rem}
      .am-upload{border:1px dashed var(--border);padding:2rem;text-align:center;cursor:pointer;transition:border-color .2s;position:relative;overflow:hidden}
      .am-upload:hover{border-color:var(--accent)}
      .am-upload-text{font-family:var(--font-mono);font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;opacity:.4}
      .am-preview{width:100%;max-height:200px;object-fit:cover;display:none;margin-bottom:.5rem}
      .am-sizes{display:flex;gap:1rem;flex-wrap:wrap;margin-top:.3rem}
      .am-sizes label{font-family:var(--font-mono);font-size:.65rem;letter-spacing:.1em;cursor:pointer;display:flex;align-items:center;gap:.4rem}
      .am-sizes input[type=checkbox]{accent-color:var(--accent);width:14px;height:14px}
      .am-actions{display:flex;gap:1rem;margin-top:2rem}
      .am-actions .ap-panel-btn{flex:1;text-align:center}
      @media(max-width:768px){
        .ap-nav{padding:1rem 1.5rem}
        .ap-body{padding:1.5rem}
        .ap-row{grid-template-columns:60px 1fr}
        .ap-actions{grid-column:1/-1}
        .ap-settings-row{grid-template-columns:1fr}
        .am-box{padding:1.5rem}
      }
    </style>`;
  }

  // ── PUBLIC API ──
  return {
    openLogin,
    closeLogin,
    doLogin,
    openPanel,
    closePanel,
    openModal,
    closeModal,
    previewImage,
    saveProduct,
    deleteProduct,
    saveSocialLinks,
    changePassword,
    renderProductList,
  };

})();
