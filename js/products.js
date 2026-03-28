/* ============================================
   js/products.js
   Renders the public-facing product grid.
   Reads from CeceData, writes to the DOM.
   ============================================ */

const CeceProducts = (() => {

  let activeFilter = 'all';

  // ── STATUS CONFIG ──
  const STATUS_MAP = {
    in:      { cls: 'status-in',      label: 'In Stock' },
    limited: { cls: 'status-limited', label: 'Limited'  },
    out:     { cls: 'status-out',     label: 'Sold Out' },
  };

  const FILTER_MATCHERS = {
    all: () => true,
    in: (product) => product.status === 'in',
    limited: (product) => product.status === 'limited',
    out: (product) => product.status === 'out',
  };

  // ── BUILD SINGLE CARD HTML ──
  function buildCard(product, socials, index = 0) {
    const status   = STATUS_MAP[product.status] || STATUS_MAP.in;
    const disabled = product.status === 'out' ? 'disabled' : '';

    const imageHtml = product.img
      ? `<div class="product-img-placeholder"><img src="${product.img}" alt="${product.name}" loading="lazy"></div>`
      : `<div class="product-img-placeholder">CECE</div>`;

    const sizesHtml = product.sizes
      .map(s => `<span class="size-tag">${s}</span>`)
      .join('');

    return `
      <div class="product-card reveal" style="animation-delay: ${index * 0.1}s">
        ${imageHtml}
        <div class="product-info">
          <span class="product-status ${status.cls}">${status.label}</span>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price">NPR ${Number(product.price).toLocaleString()}</p>
          <div class="product-sizes">${sizesHtml}</div>
          <div class="product-actions">
            <a href="${socials.ig}" target="_blank" rel="noopener" class="btn-order ig ${disabled}">
              <i class="fab fa-instagram"></i>
              <span>Instagram</span>
            </a>
            <a href="${socials.fb}" target="_blank" rel="noopener" class="btn-order fb ${disabled}">
              <i class="fab fa-facebook"></i>
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function syncFilterUi() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach((chip) => {
      const isActive = chip.dataset.filter === activeFilter;
      chip.classList.toggle('is-active', isActive);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function initFilterControls() {
    const toolbar = document.getElementById('collection-toolbar');
    if (!toolbar || toolbar.dataset.bound === '1') return;

    toolbar.addEventListener('click', (event) => {
      const chip = event.target.closest('.filter-chip');
      if (!chip) return;

      activeFilter = chip.dataset.filter || 'all';
      render();
    });

    toolbar.dataset.bound = '1';
  }

  // ── RENDER ALL PRODUCTS ──
  function render() {
    const products = CeceData.getProducts();
    const socials  = CeceData.getSocials();
    const matchFilter = FILTER_MATCHERS[activeFilter] || FILTER_MATCHERS.all;
    const filteredProducts = products.filter(matchFilter);

    const grid  = document.getElementById('products-grid');
    const count = document.getElementById('product-count');

    if (!grid) return;

    if (count) {
      const isFiltered = activeFilter !== 'all';
      count.textContent = isFiltered
        ? `— ${filteredProducts.length} of ${products.length} pieces`
        : `— ${products.length} pieces`;
    }

    initFilterControls();
    syncFilterUi();

    grid.classList.remove('count-1', 'count-2', 'count-3plus');
    if (filteredProducts.length <= 1) {
      grid.classList.add('count-1');
    } else if (filteredProducts.length === 2) {
      grid.classList.add('count-2');
    } else {
      grid.classList.add('count-3plus');
    }

    grid.innerHTML = filteredProducts.length
      ? filteredProducts.map((p, index) => buildCard(p, socials, index)).join('')
      : '<p class="products-empty">No pieces in this filter</p>';

    // Re-observe scroll reveal after render
    CeceAnimations.observeReveal();
  }

  // ── PUBLIC ──
  return { render };

})();
