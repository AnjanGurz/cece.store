/* ============================================
   js/main.js
   App entry point.
   Boots up all modules on DOMContentLoaded.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Render products on public page
  CeceProducts.render();

  // 1a. Card parallax / pointer motion for max flavor
  function initCardParallax() {
    const cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;

    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = (x / rect.width - 0.5) * 14;
        const py = (y / rect.height - 0.5) * 14;
        card.style.transform = `translateY(-10px) scale(1.03) rotateX(${py}deg) rotateY(${px}deg)`;
        card.style.boxShadow = `0 30px 100px rgba(0,0,0,0.55), 0 0 80px rgba(232,64,12,0.2)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  }

  initCardParallax();

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

  // 5. Hero fractal + metaball canvas engine (ultra surreal / seamless loop)
  function setupHeroCanvas() {
    const hero = document.getElementById('hero');
    const canvas = document.getElementById('hero-canvas');
    if (!hero || !canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    let width, height, dpr;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      width = hero.clientWidth;
      height = hero.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener('resize', resize);
    resize();

    const metaBalls = Array.from({ length: 6 }, (_, i) => ({
      angle: i * (Math.PI * 2 / 6),
      radius: 0.09 + Math.random() * 0.16,
      speed: 0.12 + Math.random() * 0.16,
      offset: Math.random() * Math.PI * 2
    }));

    function drawFractal(t) {
      ctx.clearRect(0, 0, width, height);
      const cx = width * 0.5;
      const cy = height * 0.55;
      const base = Math.sin(t * 0.12) * 0.9 + 1.2;

      // Metallic wave displacement layer
      for (let o = 0; o < 3; o++) {
        ctx.save();
        const opacity = 0.07 + 0.08 * Math.cos(t * 0.9 + o);
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = `hsl(${(t * 12 + o * 120) % 360}, 72%, 58%)`;
        ctx.lineWidth = 4 - o;
        ctx.beginPath();
        for (let n = 0; n <= 178; n++) {
          const th = (n / 178) * Math.PI * 2;
          const r = (height * 0.42 + Math.sin(n * 0.7 + t * 1.5 + o * 1.9) * 23) * (1 - o * 0.08);
          const x = cx + Math.cos(th + t * 0.4 * (o + 1)) * r * base;
          const y = cy + Math.sin(th - t * 0.36 * (o + 1)) * r * base * 0.55;
          if (n === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Moving metaballs
      metaBalls.forEach((ball, i) => {
        const ang = ball.angle + ball.speed * t + ball.offset;
        const br = Math.floor(18 + Math.sin(t * 0.8 + i * 0.4) * 12);
        const x = cx + Math.cos(ang) * width * 0.35 * Math.sin(t * 0.4 + i);
        const y = cy + Math.sin(ang) * height * 0.29 * Math.cos(t * 0.33 + i);

        const gradient = ctx.createRadialGradient(x, y, br * 0.2, x, y, br * 3.2);
        gradient.addColorStop(0, `hsla(${(t * 17 + i * 80) % 360}, 100%, 76%, 0.8)`);
        gradient.addColorStop(0.5, `hsla(${((t * 17 + i * 80) + 20) % 360}, 85%, 48%, 0.34)`);
        gradient.addColorStop(1, 'rgba(12, 13, 18, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, br * (1 + Math.sin(t * 0.8 + i) * 0.45), 0, Math.PI * 2);
        ctx.fill();
      });

      // Geometric fractal lanes
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      for (let g = 0; g < 5; g++) {
        const alpha = 0.08 + (g / 7) * 0.2;
        const hue = ((t * 22 + g * 40) % 360);
        ctx.strokeStyle = `hsla(${hue}, 80%, 64%, ${alpha})`;
        ctx.lineWidth = 1.4;

        ctx.beginPath();
        for (let k = 0; k < 7; k++) {
          const px = cx + (k - 3) * 82 * (1 + Math.sin(t * 0.22 + g)) + Math.cos(t * 0.9 + g) * 14;
          const py = cy + Math.sin((k + g) * 0.88 + t * 0.60) * 54;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Wireframe impossible polygons
      const sides = 5 + Math.floor((Math.sin(t * 0.5) + 1) * 3);
      const radius = height * 0.16;
      ctx.strokeStyle = `hsla(${(t * 29) % 360}, 90%, 60%, 0.55)`;
      ctx.lineWidth = 2.2;
      ctx.globalCompositeOperation = 'lighter';

      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const ang = (i / sides) * Math.PI * 2;
        const f = radius * (1 + 0.22 * Math.sin(t * 0.9 + i * 1.3));
        const x = cx + Math.cos(ang + t * 0.6) * f;
        const y = cy + Math.sin(ang - t * 0.72) * f * 0.6;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.globalCompositeOperation = 'source-over';
    }

    function animate() {
      const now = performance.now() * 0.001;
      drawFractal(now);
      requestAnimationFrame(animate);
    }

    animate();
  }

  setupHeroCanvas();
  setupProductShowcase();

  // 5a. Product showcase depth + select loop
  function setupProductShowcase() {
    const productsSection = document.getElementById('products');
    const productsCanvas = document.getElementById('products-canvas');
    const productsGrid = document.getElementById('products-grid');
    if (!productsSection || !productsCanvas || !productsGrid) return;

    const ctx = productsCanvas.getContext('2d');
    let width, height, dpr;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      width = productsSection.clientWidth;
      height = productsSection.clientHeight;
      productsCanvas.width = Math.floor(width * dpr);
      productsCanvas.height = Math.floor(height * dpr);
      productsCanvas.style.width = `${width}px`;
      productsCanvas.style.height = `${height}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    window.addEventListener('resize', resize);
    resize();

    // fluid background lines and dots, low-cost
    function drawProductsEnvironment(time) {
      ctx.clearRect(0, 0, width, height);

      // subtle deep gradient base layer
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(18, 20, 35, 0.30)');
      gradient.addColorStop(1, 'rgba(12, 15, 28, 0.26)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0,0,width,height);

      const baseHue = (time * 8) % 360;
      for (let i = 0; i < 45; i++) {
        const progress = (i / 45 + (time * 0.03)) % 1;
        const x1 = width * progress;
        const x2 = x1 + Math.cos(time * 0.2 + i) * 40;
        const y1 = height * ((i * 0.02) % 1);
        const y2 = y1 + Math.sin(time * 0.15 + i) * 24;

        ctx.strokeStyle = `hsla(${baseHue + i * 3}, 70%, 60%, 0.10)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1 - width * 0.15, y1);
        ctx.bezierCurveTo(x1, y1 - 10, x2, y2 + 10, x2 + width*0.1, y2);
        ctx.stroke();
      }

      // soft glowing particles
      for (let i = 0; i < 25; i++) {
        const x = (Math.sin(time * 0.2 + i) * 0.5 + 0.5) * width;
        const y = (Math.cos(time * 0.18 + i * 1.2) * 0.4 + 0.5) * height;
        const r = 1.6 + Math.abs(Math.sin(time * 0.6 + i)) * 2.3;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 15);
        glow.addColorStop(0, `hsla(${(baseHue + i * 8) % 360}, 100%, 82%, 0.18)`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 15, 0, Math.PI*2);
        ctx.fill();
      }

      requestAnimationFrame(drawProductsEnvironment);
    }

    requestAnimationFrame(drawProductsEnvironment);

    // smooth product selection loop
    const cards = () => Array.from(document.querySelectorAll('.product-card'));
    let current = 0;

    function highlightProduct() {
      const cardList = cards();
      if (!cardList.length) return;

      cardList.forEach((card, index) => {
        card.classList.toggle('active', index === current);
        card.classList.toggle('not-active', index !== current);

        // add spark particles inside card
        if (!card.querySelector('.flying-particle')) {
          const spark = document.createElement('span');
          spark.className = 'flying-particle';
          card.appendChild(spark);
        }
      });

      current = (current + 1) % cardList.length;
    }

    highlightProduct();
    setInterval(highlightProduct, 4200);
  }

  function addHeroParticles(amount = 20) {
    const particles = document.querySelector('.hero-particles');
    if (!particles) return;

    for (let i = 0; i < amount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 30 + 16;
      const startX = Math.random() * 100;
      const xDrift = (Math.random() - 0.5) * 30;
      const duration = 12 + Math.random() * 7;
      const delay = Math.random() * 4;

      particle.style.setProperty('--particle-size', `${size}px`);
      particle.style.setProperty('--particle-duration', `${duration}s`);
      particle.style.setProperty('--particle-delay', `${delay}s`);
      particle.style.setProperty('--x-start', `${startX}vw`);
      particle.style.setProperty('--x-end', `${startX + xDrift}vw`);
      particle.style.top = '-20vh';

      particles.appendChild(particle);

      setTimeout(() => particle.remove(), (duration + delay) * 1000 + 1000);
    }
  }

  setInterval(() => addHeroParticles(4), 1800);
  addHeroParticles(12);

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
