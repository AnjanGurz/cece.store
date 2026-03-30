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
    hoodies: (product) => product.category === 'hoodies',
    tshirts: (product) => product.category === 'tshirts',
    new: (product) => Boolean(product.isNew),
  };

  // ── BUILD SINGLE CARD HTML ──
  function buildCard(product, index = 0) {
    const status   = STATUS_MAP[product.status] || STATUS_MAP.in;
    const isOut = product.status === 'out';
    const disabled = isOut ? 'disabled' : '';
    const orderHref = isOut ? '#' : CeceData.getOrderLink(product);
    const orderMessage = CeceData.buildOrderMessage(product);
    const newDropBadge = product.isNew
      ? '<span class="product-drop-badge">New Drop</span>'
      : '';

    const imageHtml = product.img
      ? `
        <div class="product-img-placeholder">
          ${newDropBadge}
          <img src="${product.img}" alt="${product.name}" loading="lazy" decoding="async" fetchpriority="low">
          <button type="button" class="product-quick-view" data-quick-view="${product.id}" aria-label="Quick view ${product.name}">Quick View</button>
        </div>
      `
      : `<div class="product-img-placeholder">CECE</div>`;

    const sizesHtml = product.sizes
      .map(s => `<span class="size-tag">${s}</span>`)
      .join('');

    return `
      <article class="product-card reveal" data-product-id="${product.id}" style="animation-delay: ${index * 0.08}s">
        ${imageHtml}
        <div class="product-info">
          <span class="product-status ${status.cls}">${status.label}</span>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price">NPR ${Number(product.price).toLocaleString()}</p>
          <div class="product-sizes">${sizesHtml}</div>
          <div class="product-actions">
            <a
              href="${orderHref}"
              target="_blank"
              rel="noopener"
              class="btn-order ig ${disabled}"
              data-order-product="${product.id}"
              data-order-message="${encodeURIComponent(orderMessage)}"
              aria-disabled="${isOut ? 'true' : 'false'}"
            >
              <i class="fab fa-instagram"></i>
              <span>${isOut ? 'Sold Out' : 'Order on Instagram'}</span>
            </a>
            <a href="${CeceData.getSocials().fb}" target="_blank" rel="noopener" class="btn-order fb ${disabled}" aria-disabled="${isOut ? 'true' : 'false'}">
              <i class="fab fa-facebook"></i>
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </article>
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
    const matchFilter = FILTER_MATCHERS[activeFilter] || FILTER_MATCHERS.all;
    const filteredProducts = products.filter(matchFilter);

    const grid  = document.getElementById('products-grid');
    const count = document.getElementById('product-count');
    const swipeHint = document.getElementById('products-swipe-hint');

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
      ? filteredProducts.map((p, index) => buildCard(p, index)).join('')
      : '<p class="products-empty">No pieces in this filter</p>';

    if (swipeHint) {
      swipeHint.hidden = filteredProducts.length <= 1;
    }

    // Re-observe scroll reveal after render
    CeceAnimations.observeReveal();

    if (typeof CeceStorefront !== 'undefined' && CeceStorefront && typeof CeceStorefront.onProductsRendered === 'function') {
      CeceStorefront.onProductsRendered(filteredProducts);
    } else if (window.CeceStorefront && typeof window.CeceStorefront.onProductsRendered === 'function') {
      window.CeceStorefront.onProductsRendered(filteredProducts);
    }
  }

  // ── PUBLIC ──
  function getProductById(id) {
    return CeceData.getProductById(Number(id));
  }

  function getActiveFilter() {
    return activeFilter;
  }

  return { render, getProductById, getActiveFilter };

})();
