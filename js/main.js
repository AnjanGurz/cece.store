/* ============================================
   js/main.js
   App entry point.
   Boots up all modules on DOMContentLoaded.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Theme toggle is intentionally hidden for now; keep storefront in dark mode.
  if (!document.getElementById('theme-toggle')) {
    CeceData.setTheme('dark');
  }

  // 1. Render immediately from local cache/defaults so distant users do not wait
  CeceProducts.render();

  // 1b. Refresh from API/catalog in the background and rerender if newer data arrives
  CeceData.hydrateFromCatalog()
    .then(() => {
      CeceProducts.render();
      if (typeof CeceStorefront !== 'undefined' && CeceStorefront && typeof CeceStorefront.refresh === 'function') {
        CeceStorefront.refresh();
      }
    })
    .catch(() => {});

  // 2. Initialize enhanced storefront UX
  if (typeof CeceStorefront !== 'undefined' && CeceStorefront) {
    CeceStorefront.init();
  } else if (window.CeceStorefront) {
    window.CeceStorefront.init();
  }

  // 3. Start marquee
  CeceAnimations.initMarquee();

  // 4. Observe scroll reveals
  CeceAnimations.observeReveal();

  // 5. Hero particle engine - Enhanced
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveDataEnabled = Boolean(connection && connection.saveData);
  const slowNetwork = Boolean(connection && /2g|3g/.test(connection.effectiveType || ''));
  const lowPowerDevice = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const lowBandwidthMode = saveDataEnabled || slowNetwork || lowPowerDevice || window.innerWidth < 768;

  document.documentElement.classList.toggle('performance-mode', lowBandwidthMode || prefersReducedMotion);

  function addHeroParticles(amount = 20) {
    const particles = document.querySelector('.hero-particles');
    if (!particles || prefersReducedMotion || lowBandwidthMode) return;

    for (let i = 0; i < amount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 22 + 14;
      const startX = Math.random() * 100;
      const xDrift = (Math.random() - 0.5) * 60;
      const duration = lowBandwidthMode ? 10 + Math.random() * 6 : 14 + Math.random() * 10;
      const delay = Math.random() * 5;

      particle.style.setProperty('--particle-size', `${size}px`);
      particle.style.setProperty('--particle-duration', `${duration}s`);
      particle.style.setProperty('--particle-delay', `${delay}s`);
      particle.style.setProperty('--x-start', `${startX}vw`);
      particle.style.setProperty('--x-end', `${startX + xDrift}vw`);
      particle.style.top = '-30vh';

      particles.appendChild(particle);

      setTimeout(() => particle.remove(), (duration + delay) * 1000 + 1000);
    }
  }

  if (!prefersReducedMotion && !lowBandwidthMode) {
    const burstCount = 3;
    const spawnInterval = 2200;
    let burstRuns = 0;
    const particleTimer = setInterval(() => {
      addHeroParticles(burstCount);
      burstRuns += 1;
      if (burstRuns >= 6) clearInterval(particleTimer);
    }, spawnInterval);
    addHeroParticles(8);
  }

  // 6. Hero interactivity - Mouse position tracking
  const hero = document.getElementById('hero');
  if (hero && !lowBandwidthMode && !prefersReducedMotion) {
    let rafId = 0;
    let pointerX = 50;
    let pointerY = 50;

    const heroBg = hero.querySelector('.hero-bg');
    const heroRing = hero.querySelector('.hero-ring');

    const applyHeroMotion = () => {
      rafId = 0;

      if (heroBg) {
        heroBg.style.backgroundPosition = `${pointerX * 0.2}% ${pointerY * 0.2}%`;
      }

      if (heroRing) {
        heroRing.style.transform = `translate(calc(-50% + ${(pointerX - 50) * 0.05}px), calc(-50% + ${(pointerY - 50) * 0.05}px)) scale(0.7)`;
      }
    };

    document.addEventListener('mousemove', (e) => {
      pointerX = (e.clientX / window.innerWidth) * 100;
      pointerY = (e.clientY / window.innerHeight) * 100;

      if (!rafId) {
        rafId = requestAnimationFrame(applyHeroMotion);
      }
    });
  }

  // 7. Floating hero CTA -> collection section
  const floatingCollectionBtn = document.getElementById('floating-collection-btn');
  const productsSection = document.getElementById('products');

  if (floatingCollectionBtn && productsSection) {
    floatingCollectionBtn.addEventListener('click', (event) => {
      event.preventDefault();
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const heroObserver = new IntersectionObserver((entries) => {
      const [entry] = entries;
      floatingCollectionBtn.classList.toggle('is-hidden', !entry.isIntersecting);
    }, { threshold: 0.15 });

    if (hero) {
      heroObserver.observe(hero);
    }
  }

  let clickCount = 0;
  const adminTriggers = [
    document.getElementById('admin-trigger'),
    document.getElementById('nav-admin-trigger'),
  ].filter(Boolean);

  adminTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      // Prevent jump to top for logo anchor.
      event.preventDefault();
      clickCount++;
      if (clickCount >= 3) {
        clickCount = 0;
        CeceAdmin.openLogin();
      }
      // Reset count after 800ms of no clicks.
      setTimeout(() => { clickCount = 0; }, 800);
    });
  });

});
