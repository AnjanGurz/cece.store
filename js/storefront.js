/* ============================================
   js/storefront.js
   Premium storefront UX helpers.
   ============================================ */

const CeceStorefront = (() => {

  let recentRenderCache = [];

  function showStoreNotice(text) {
    if (!text) return;

    let notice = document.getElementById('storefront-toast');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'storefront-toast';
      notice.style.cssText = 'position:fixed;right:16px;bottom:16px;max-width:320px;padding:12px 14px;border-radius:12px;background:rgba(16,16,16,.94);color:#f7f0e6;border:1px solid rgba(239,173,53,.32);box-shadow:0 12px 30px rgba(0,0,0,.28);font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;line-height:1.5;z-index:3000;opacity:0;transform:translateY(8px);transition:opacity .2s ease, transform .2s ease';
      document.body.appendChild(notice);
    }

    notice.textContent = text;
    notice.style.opacity = '1';
    notice.style.transform = 'translateY(0)';

    clearTimeout(showStoreNotice._timer);
    showStoreNotice._timer = setTimeout(() => {
      notice.style.opacity = '0';
      notice.style.transform = 'translateY(8px)';
    }, 2600);
  }

  function trackEvent(name, props = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, props);
      return;
    }

    if (typeof window.plausible === 'function') {
      window.plausible(name, { props });
      return;
    }

    // Fallback keeps visibility in dev without external analytics.
    console.log('[analytics:event]', name, props);
  }

  function applyTheme(theme) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', normalized);

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      const isLight = normalized === 'light';
      toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      toggle.querySelector('span').textContent = isLight ? 'Dark' : 'Light';
      toggle.querySelector('i').className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }

  function initThemeToggle() {
    applyTheme(CeceData.getTheme());

    const toggle = document.getElementById('theme-toggle');
    if (!toggle || toggle.dataset.bound === '1') return;

    toggle.addEventListener('click', () => {
      const current = CeceData.getTheme();
      const next = current === 'light' ? 'dark' : 'light';
      CeceData.setTheme(next);
      applyTheme(next);
      trackEvent('theme_toggle', { theme: next });
    });

    toggle.dataset.bound = '1';
  }

  function openQuickView(product) {
    const modal = document.getElementById('quick-view-modal');
    if (!modal) return;

    const img = document.getElementById('quick-view-image');
    const name = document.getElementById('quick-view-name');
    const price = document.getElementById('quick-view-price');
    const status = document.getElementById('quick-view-status');
    const orderLink = document.getElementById('quick-view-order');

    if (img) {
      img.src = product.img || '';
      img.alt = product.name;
      img.loading = 'lazy';
      img.decoding = 'async';
    }
    if (name) name.textContent = product.name;
    if (price) price.textContent = `NPR ${Number(product.price).toLocaleString()}`;
    if (status) status.textContent = product.status === 'out' ? 'Sold Out' : 'Available';

    if (orderLink) {
      if (product.status === 'out') {
        orderLink.setAttribute('aria-disabled', 'true');
        orderLink.classList.add('disabled');
        orderLink.href = '#';
        orderLink.dataset.orderMessage = '';
      } else {
        orderLink.setAttribute('aria-disabled', 'false');
        orderLink.classList.remove('disabled');
        orderLink.href = CeceData.getOrderLink(product);
        orderLink.dataset.orderMessage = encodeURIComponent(CeceData.buildOrderMessage(product));
      }
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    CeceData.pushRecentlyViewed(product.id);
    renderRecentlyViewed();
    trackEvent('quick_view_open', { product_id: product.id, product_name: product.name });
  }

  function closeQuickView() {
    const modal = document.getElementById('quick-view-modal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function copyOrderMessage(encodedMessage) {
    try {
      const decoded = decodeURIComponent(encodedMessage || '');
      if (!decoded || !navigator.clipboard) return false;
      await navigator.clipboard.writeText(decoded);
      return true;
    } catch (error) {
      console.warn('Unable to copy order message:', error.message);
      return false;
    }
  }

  async function prepareInstagramRedirect(encodedMessage, noticeText) {
    const copied = await copyOrderMessage(encodedMessage);
    if (copied) {
      showStoreNotice(noticeText || 'Message copied. Paste it into Instagram chat if the text does not appear automatically.');
    }
  }

  function initGridInteractions() {
    const grid = document.getElementById('products-grid');
    if (!grid || grid.dataset.bound === '1') return;

    grid.addEventListener('click', async (event) => {
      const quickViewBtn = event.target.closest('[data-quick-view]');
      if (quickViewBtn) {
        const product = CeceProducts.getProductById(quickViewBtn.dataset.quickView);
        if (product) openQuickView(product);
        return;
      }

      const orderBtn = event.target.closest('[data-order-product]');
      if (orderBtn) {
        if (orderBtn.classList.contains('disabled')) {
          event.preventDefault();
          return;
        }

        const productId = Number(orderBtn.dataset.orderProduct);
        const product = CeceProducts.getProductById(productId);
        if (product) {
          CeceData.pushRecentlyViewed(product.id);
          await prepareInstagramRedirect(orderBtn.dataset.orderMessage, 'Order message copied. Paste it into Instagram chat if needed.');
          renderRecentlyViewed();
          trackEvent('order_click', { product_id: product.id, product_name: product.name });
        }
      }
    });

    grid.dataset.bound = '1';
  }

  function initQuickViewModal() {
    const closeBtn = document.getElementById('quick-view-close');
    const modal = document.getElementById('quick-view-modal');
    const orderLink = document.getElementById('quick-view-order');

    if (closeBtn && closeBtn.dataset.bound !== '1') {
      closeBtn.addEventListener('click', closeQuickView);
      closeBtn.dataset.bound = '1';
    }

    if (modal && modal.dataset.bound !== '1') {
      modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.classList.contains('quick-view-backdrop')) {
          closeQuickView();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeQuickView();
      });

      modal.dataset.bound = '1';
    }

    if (orderLink && orderLink.dataset.bound !== '1') {
      orderLink.addEventListener('click', async () => {
        if (orderLink.classList.contains('disabled')) return;
        await prepareInstagramRedirect(orderLink.dataset.orderMessage, 'Order message copied. Paste it into Instagram chat if needed.');
      });
      orderLink.dataset.bound = '1';
    }

    initGridInteractions();
  }

  function renderRecentlyViewed() {
    const container = document.getElementById('recently-viewed-list');
    const section = document.getElementById('recently-viewed');
    if (!container || !section) return;

    const items = CeceData.getRecentlyViewed(5);
    if (!items.length) {
      section.hidden = true;
      container.innerHTML = '';
      return;
    }

    section.hidden = false;
    container.innerHTML = items.map((product) => `
      <article class="recent-card" data-recent-id="${product.id}">
        <img src="${product.img || ''}" alt="${product.name}" loading="lazy" decoding="async">
        <div>
          <p class="recent-name">${product.name}</p>
          <p class="recent-price">NPR ${Number(product.price).toLocaleString()}</p>
        </div>
      </article>
    `).join('');

    if (container.dataset.bound !== '1') {
      container.addEventListener('click', (event) => {
        const card = event.target.closest('[data-recent-id]');
        if (!card) return;
        const product = CeceProducts.getProductById(card.dataset.recentId);
        if (product) openQuickView(product);
      });
      container.dataset.bound = '1';
    }
  }

  function initStickyCta() {
    const sticky = document.getElementById('sticky-order-cta');
    if (!sticky) return;

    sticky.href = CeceData.getInquiryLink();
    sticky.target = '_blank';
    sticky.rel = 'noopener';

    if (sticky.dataset.bound !== '1') {
      sticky.addEventListener('click', async () => {
        await prepareInstagramRedirect(encodeURIComponent(CeceData.buildInquiryMessage()), 'Message copied. Paste it into Instagram chat if needed.');
      });
      sticky.dataset.bound = '1';
    }
  }

  function initFooterMeta() {
    const socials = CeceData.getSocials();
    const settings = CeceData.getSettings();

    const ig = document.getElementById('footer-ig');
    const fb = document.getElementById('footer-fb');
    const heroOrder = document.getElementById('hero-order-btn');
    const contact = document.getElementById('footer-contact');

    if (ig) ig.href = socials.ig;
    if (fb) fb.href = socials.fb;
    if (heroOrder) {
      heroOrder.href = CeceData.getInquiryLink();
      heroOrder.dataset.orderMessage = encodeURIComponent(CeceData.buildInquiryMessage());

      if (heroOrder.dataset.bound !== '1') {
        heroOrder.addEventListener('click', async () => {
          await prepareInstagramRedirect(heroOrder.dataset.orderMessage, 'Message copied. Paste it into Instagram chat if needed.');
        });
        heroOrder.dataset.bound = '1';
      }
    }
    if (contact) contact.textContent = `Contact: ${settings.contactPhone}`;
  }

  function initAnalytics() {
    const settings = CeceData.getSettings();
    const analytics = settings.analytics || {};

    if (analytics.provider === 'ga4' && analytics.gaMeasurementId) {
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${analytics.gaMeasurementId}`;
      document.head.appendChild(gtagScript);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(){ window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', analytics.gaMeasurementId);
    }

    if (analytics.provider === 'plausible' && analytics.plausibleDomain) {
      const script = document.createElement('script');
      script.defer = true;
      script.dataset.domain = analytics.plausibleDomain;
      script.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(script);
    }
  }

  function initPerformanceMonitoring() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const paintObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          trackEvent('perf_paint', { metric: entry.name, value: Math.round(entry.startTime) });
        });
      });
      paintObserver.observe({ type: 'paint', buffered: true });

      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          trackEvent('perf_lcp', { value: Math.round(last.startTime) });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('Performance monitoring unavailable:', error.message);
    }
  }

  function onProductsRendered(products) {
    recentRenderCache = Array.isArray(products) ? products : [];
    initGridInteractions();
    renderRecentlyViewed();
  }

  function init() {
    initThemeToggle();
    initQuickViewModal();
    initStickyCta();
    initFooterMeta();
    initAnalytics();
    initPerformanceMonitoring();
    renderRecentlyViewed();

    trackEvent('page_view', {
      products_loaded: Array.isArray(recentRenderCache) ? recentRenderCache.length : 0,
      filter: CeceProducts.getActiveFilter(),
    });
  }

  return {
    init,
    onProductsRendered,
  };
})();

window.CeceStorefront = CeceStorefront;
