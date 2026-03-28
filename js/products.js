/* ============================================
   js/products.js
   Renders the public-facing product grid.
   Reads from CeceData, writes to the DOM.
   ============================================ */

const CeceProducts = (() => {

  // ── STATUS CONFIG ──
  const STATUS_MAP = {
    in:      { cls: 'status-in',      label: 'In Stock' },
    limited: { cls: 'status-limited', label: 'Limited'  },
    out:     { cls: 'status-out',     label: 'Sold Out' },
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
        <div class="shine"></div>
        ${imageHtml}
        <span class="product-status ${status.cls}">${status.label}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">NPR ${Number(product.price).toLocaleString()}</p>
        <div class="product-sizes">${sizesHtml}</div>
        <div class="product-actions">
          <a href="${socials.ig}" target="_blank" rel="noopener" class="btn-order ig ${disabled}">
            <i class="fab fa-instagram"></i>
            <span>Order via Instagram</span>
          </a>
          <a href="${socials.fb}" target="_blank" rel="noopener" class="btn-order fb ${disabled}">
            <i class="fab fa-facebook"></i>
            <span>Order via Facebook</span>
          </a>
        </div>
      </div>
    `;
  }

  // ── RENDER ALL PRODUCTS ──
  function render() {
    const products = CeceData.getProducts();
    const socials  = CeceData.getSocials();

    const grid  = document.getElementById('products-grid');
    const count = document.getElementById('product-count');

    if (!grid) return;

    count.textContent = `— ${products.length} pieces`;

    grid.innerHTML = products
      .map((p, index) => buildCard(p, socials, index))
      .join('');

    // Re-observe scroll reveal after render
    CeceAnimations.observeReveal();
  }

  // ── PUBLIC ──
  return { render };

})();
