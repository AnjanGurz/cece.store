/* ============================================
   js/main.js
   App entry point.
   Boots up all modules on DOMContentLoaded.
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  await CeceData.hydrateFromCatalog();

  // 1. Render products on public page
  CeceProducts.render();

  // 2. Set social links in footer
  const socials = CeceData.getSocials();
  const igLink  = document.getElementById('footer-ig');
  const fbLink  = document.getElementById('footer-fb');
  if (igLink) igLink.href = socials.ig;
  if (fbLink) fbLink.href = socials.fb;

  // 3. Start marquee
  CeceAnimations.initMarquee();

  // 4. Observe scroll reveals
  CeceAnimations.observeReveal();

  // 5. Hero particle engine - Enhanced
  function addHeroParticles(amount = 20) {
    const particles = document.querySelector('.hero-particles');
    if (!particles) return;

    for (let i = 0; i < amount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 40 + 18;
      const startX = Math.random() * 100;
      const xDrift = (Math.random() - 0.5) * 60;
      const duration = 14 + Math.random() * 10;
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

  setInterval(() => addHeroParticles(5), 1500);
  addHeroParticles(18);

  // 6. Hero interactivity - Mouse position tracking
  const hero = document.getElementById('hero');
  if (hero) {
    document.addEventListener('mousemove', (e) => {
      const xPercent = (e.clientX / window.innerWidth) * 100;
      const yPercent = (e.clientY / window.innerHeight) * 100;
      
      const heroBg = hero.querySelector('.hero-bg');
      const heroRing = hero.querySelector('.hero-ring');
      
      if (heroBg) {
        heroBg.style.backgroundPosition = `${xPercent * 0.3}% ${yPercent * 0.3}%`;
      }
      
      if (heroRing) {
        heroRing.style.transform = `translate(calc(-50% + ${(xPercent - 50) * 0.08}px), calc(-50% + ${(yPercent - 50) * 0.08}px)) scale(0.7)`;
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
  const trigger  = document.getElementById('admin-trigger');

  if (trigger) {
    trigger.addEventListener('click', () => {
      clickCount++;
      if (clickCount >= 3) {
        clickCount = 0;
        CeceAdmin.openLogin();
      }
      // Reset count after 800ms of no clicks
      setTimeout(() => { clickCount = 0; }, 800);
    });
  }

});
