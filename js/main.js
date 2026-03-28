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

  // 5. Hero surreal canvas engine (bubbles, waves, lotus-inspired motion)
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

    const pointer = { x: 0.5, y: 0.5, active: false };
    hero.addEventListener('pointermove', e => {
      const rect = hero.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = (e.clientY - rect.top) / rect.height;
      pointer.active = true;
    });
    hero.addEventListener('pointerleave', () => {
      pointer.active = false;
    });

    function spawnBubble() {
      return {
        x: Math.random() * width,
        y: height + 40 + Math.random() * 120,
        r: 10 + Math.random() * 26,
        vx: -0.4 + Math.random() * 0.8,
        vy: -0.8 - Math.random() * 1.7,
        phase: Math.random() * Math.PI * 2,
        seed: Math.random() * 1000,
        age: 0,
        life: 260 + Math.random() * 200,
        mergedCooldown: 0
      };
    }

    const bubbles = Array.from({ length: 26 }, () => spawnBubble());
    const pops = [];

    function drawOrganicBlob(x, y, r, t, seed, alpha = 0.24) {
      const points = 10;
      const step = (Math.PI * 2) / points;
      const verts = [];
      for (let i = 0; i < points; i++) {
        const ang = i * step;
        const wobble = 0.78 + 0.32 * Math.sin(t * 1.15 + seed + i * 1.34);
        const rr = r * wobble;
        verts.push({ x: x + Math.cos(ang) * rr, y: y + Math.sin(ang) * rr });
      }

      const grad = ctx.createRadialGradient(x - r * 0.28, y - r * 0.28, r * 0.2, x, y, r * 1.05);
      grad.addColorStop(0, `rgba(255,255,255,${alpha + 0.16})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % points];
        const mx = (a.x + b.x) * 0.5;
        const my = (a.y + b.y) * 0.5;
        if (i === 0) ctx.moveTo(mx, my);
        ctx.quadraticCurveTo(a.x, a.y, mx, my);
      }
      ctx.closePath();
      ctx.fill();
    }

    function updateBubbles(t) {
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        const wobbleX = Math.sin(t * 1.1 + b.phase) * 0.6;
        b.age += 1;
        b.mergedCooldown = Math.max(0, b.mergedCooldown - 1);
        b.x += b.vx + wobbleX;
        b.y += b.vy;

        if (pointer.active) {
          const pullX = (pointer.x * width - b.x) * 0.0008;
          const pullY = (pointer.y * height - b.y) * 0.0008;
          b.vx += pullX;
          b.vy += pullY;
        }

        b.vx *= 0.995;
        b.vy *= 0.997;

        if (b.age > b.life || b.y < -160 || b.x < -200 || b.x > width + 200) {
          pops.push({ x: b.x, y: b.y, r: b.r, age: 0, life: 32 });
          bubbles[i] = spawnBubble();
          continue;
        }
      }

      // Soft merge behavior
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const a = bubbles[i];
          const b = bubbles[j];
          if (a.mergedCooldown || b.mergedCooldown) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const threshold = (a.r + b.r) * 0.55;

          if (dist < threshold) {
            const total = a.r + b.r;
            a.x = (a.x * a.r + b.x * b.r) / total;
            a.y = (a.y * a.r + b.y * b.r) / total;
            a.r = Math.min(44, Math.sqrt(a.r * a.r + b.r * b.r) * 0.92);
            a.vx = (a.vx + b.vx) * 0.5;
            a.vy = (a.vy + b.vy) * 0.5;
            a.age *= 0.7;
            a.mergedCooldown = 26;

            pops.push({ x: b.x, y: b.y, r: b.r * 0.6, age: 0, life: 24 });
            bubbles[j] = spawnBubble();
          }
        }
      }
    }

    function drawHeroFlow(t) {
      ctx.clearRect(0, 0, width, height);
      const cx = width * (pointer.active ? 0.46 + pointer.x * 0.08 : 0.5);
      const cy = height * (pointer.active ? 0.46 + pointer.y * 0.1 : 0.52);
      updateBubbles(t);

      // flowing fabric ribbons
      for (let wave = 0; wave < 5; wave++) {
        ctx.save();
        ctx.globalAlpha = 0.07 + wave * 0.03;
        ctx.strokeStyle = `hsla(${(t * 12 + wave * 42) % 360}, 80%, 68%, 0.6)`;
        ctx.lineWidth = 1.8 + wave * 0.45;
        ctx.beginPath();
        for (let i = 0; i <= 140; i++) {
          const p = i / 140;
          const x = p * width;
          const y = cy + Math.sin(p * 8 + t * 0.95 + wave) * (28 + wave * 10)
            + Math.cos(p * 5 - t * 0.72 + wave) * 13;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Floating and merging bubble-blobs
      bubbles.forEach((bubble, i) => {
        drawOrganicBlob(bubble.x, bubble.y, bubble.r, t + i * 0.18, bubble.seed, 0.2);
      });

      // Pop bursts
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.age += 1;
        const k = p.age / p.life;
        if (k >= 1) {
          pops.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(255,255,255,${0.34 * (1 - k)})`;
        ctx.lineWidth = 1.4;
        drawOrganicBlob(p.x, p.y, p.r * (0.9 + k * 1.6), t + k * 4, p.r * 0.12, 0.07);
      }

      // Lotus + mandala-inspired rotating bezier motifs
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const petals = 11;
      for (let petal = 0; petal < petals; petal++) {
        const angle = (Math.PI * 2 * petal) / petals + t * 0.18;
        const reach = width * 0.13 + Math.sin(t * 0.6 + petal) * 12;
        const px = cx + Math.cos(angle) * reach;
        const py = cy + Math.sin(angle) * (height * 0.11);
        const c1x = cx + Math.cos(angle - 0.42) * (reach * 0.42);
        const c1y = cy + Math.sin(angle - 0.42) * (height * 0.06);
        const c2x = cx + Math.cos(angle + 0.42) * (reach * 0.42);
        const c2y = cy + Math.sin(angle + 0.42) * (height * 0.06);

        ctx.strokeStyle = `hsla(${(t * 12 + petal * 31) % 360}, 80%, 72%, 0.24)`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, px, py);
        ctx.stroke();
      }
      ctx.restore();

      // Tiny organic lights
      for (let i = 0; i < 28; i++) {
        const nx = (Math.sin(t * 0.4 + i * 0.73) * 0.5 + 0.5) * width;
        const ny = (Math.cos(t * 0.32 + i * 0.91) * 0.45 + 0.5) * height;
        const rr = 1 + Math.abs(Math.sin(t * 1.4 + i)) * 2.2;
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, rr * 8);
        g.addColorStop(0, 'rgba(255,255,255,0.25)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nx, ny, rr * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function animate() {
      const now = performance.now() * 0.001;
      drawHeroFlow(now);
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

    const pointer = { x: 0.5, y: 0.5, active: false };
    productsSection.addEventListener('pointermove', e => {
      const rect = productsSection.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = (e.clientY - rect.top) / rect.height;
      pointer.active = true;
    });
    productsSection.addEventListener('pointerleave', () => {
      pointer.active = false;
    });

    function spawnShowBubble() {
      return {
        x: Math.random() * width,
        y: height + Math.random() * 140,
        r: 9 + Math.random() * 18,
        vx: -0.35 + Math.random() * 0.7,
        vy: -0.55 - Math.random() * 1.2,
        seed: Math.random() * 999,
        life: 260 + Math.random() * 220,
        age: 0,
        mergeCd: 0
      };
    }

    const showBubbles = Array.from({ length: 20 }, () => spawnShowBubble());
    const showPops = [];

    function drawSoftBlob(x, y, r, t, seed, alpha = 0.16) {
      const count = 8;
      const step = (Math.PI * 2) / count;
      const verts = [];
      for (let i = 0; i < count; i++) {
        const a = i * step;
        const rr = r * (0.82 + 0.22 * Math.sin(t * 1.2 + seed + i * 1.17));
        verts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr });
      }

      const g = ctx.createRadialGradient(x - r * 0.24, y - r * 0.24, r * 0.2, x, y, r * 1.1);
      g.addColorStop(0, `rgba(255,255,255,${alpha + 0.18})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;

      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % count];
        const mx = (a.x + b.x) * 0.5;
        const my = (a.y + b.y) * 0.5;
        if (i === 0) ctx.moveTo(mx, my);
        ctx.quadraticCurveTo(a.x, a.y, mx, my);
      }
      ctx.closePath();
      ctx.fill();
    }

    function updateShowBubbles(t) {
      for (let i = 0; i < showBubbles.length; i++) {
        const b = showBubbles[i];
        b.age += 1;
        b.mergeCd = Math.max(0, b.mergeCd - 1);
        b.x += b.vx + Math.sin(t * 0.9 + b.seed) * 0.45;
        b.y += b.vy;

        if (pointer.active) {
          b.vx += (pointer.x * width - b.x) * 0.0006;
          b.vy += (pointer.y * height - b.y) * 0.0005;
        }

        b.vx *= 0.994;
        b.vy *= 0.996;

        if (b.age > b.life || b.y < -120) {
          showPops.push({ x: b.x, y: b.y, r: b.r, age: 0, life: 26 });
          showBubbles[i] = spawnShowBubble();
        }
      }

      for (let i = 0; i < showBubbles.length; i++) {
        for (let j = i + 1; j < showBubbles.length; j++) {
          const a = showBubbles[i];
          const b = showBubbles[j];
          if (a.mergeCd || b.mergeCd) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d < (a.r + b.r) * 0.53) {
            const total = a.r + b.r;
            a.x = (a.x * a.r + b.x * b.r) / total;
            a.y = (a.y * a.r + b.y * b.r) / total;
            a.r = Math.min(34, Math.sqrt(a.r * a.r + b.r * b.r) * 0.9);
            a.vx = (a.vx + b.vx) * 0.5;
            a.vy = (a.vy + b.vy) * 0.5;
            a.mergeCd = 22;
            showPops.push({ x: b.x, y: b.y, r: b.r * 0.55, age: 0, life: 20 });
            showBubbles[j] = spawnShowBubble();
          }
        }
      }
    }

    // soft flowing fabric + lotus-like particles
    function drawProductsEnvironment(time) {
      ctx.clearRect(0, 0, width, height);
      updateShowBubbles(time);

      const focusX = pointer.active ? width * pointer.x : width * 0.5;
      const focusY = pointer.active ? height * pointer.y : height * 0.45;

      // subtle deep gradient base layer
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(18, 20, 35, 0.30)');
      gradient.addColorStop(1, 'rgba(12, 15, 28, 0.26)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0,0,width,height);

      // wide flowing ribbons behind products
      for (let wave = 0; wave < 4; wave++) {
        ctx.strokeStyle = `hsla(${(time * 9 + wave * 52) % 360}, 80%, 70%, ${0.08 + wave * 0.02})`;
        ctx.lineWidth = 2 + wave * 0.25;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 14) {
          const y = height * (0.18 + wave * 0.2)
            + Math.sin(x * 0.012 + time * (0.7 + wave * 0.2)) * (16 + wave * 6)
            + Math.cos(x * 0.006 - time * 0.5) * 10
            + (focusY - height * 0.45) * 0.08;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // lotus/mandala-inspired bezier petals
      const petals = 9;
      for (let ring = 0; ring < 2; ring++) {
        for (let i = 0; i < petals; i++) {
          const ang = (Math.PI * 2 * i) / petals + time * (0.12 + ring * 0.06);
          const radius = width * (0.13 + ring * 0.08) + Math.sin(time + i) * 8;
          const endX = focusX + Math.cos(ang) * radius;
          const endY = focusY + Math.sin(ang) * radius * 0.52;
          const c1x = focusX + Math.cos(ang - 0.4) * radius * 0.42;
          const c1y = focusY + Math.sin(ang - 0.4) * radius * 0.26;
          const c2x = focusX + Math.cos(ang + 0.4) * radius * 0.42;
          const c2y = focusY + Math.sin(ang + 0.4) * radius * 0.26;
          ctx.strokeStyle = `hsla(${(time * 10 + i * 20 + ring * 70) % 360}, 88%, 78%, ${0.11 - ring * 0.03})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(focusX, focusY);
          ctx.bezierCurveTo(c1x, c1y, c2x, c2y, endX, endY);
          ctx.stroke();
        }
      }

      // organic bubbles and pop effects
      showBubbles.forEach((b, i) => {
        drawSoftBlob(b.x, b.y, b.r, time + i * 0.3, b.seed, 0.14);
      });

      for (let i = showPops.length - 1; i >= 0; i--) {
        const p = showPops[i];
        p.age += 1;
        const k = p.age / p.life;
        if (k >= 1) {
          showPops.splice(i, 1);
          continue;
        }
        drawSoftBlob(p.x, p.y, p.r * (1 + k * 1.4), time + k * 3, p.r, 0.05 * (1 - k));
      }

      // shimmering particles
      for (let i = 0; i < 24; i++) {
        const x = (Math.sin(time * 0.25 + i * 0.9) * 0.5 + 0.5) * width;
        const y = (Math.cos(time * 0.2 + i * 1.15) * 0.45 + 0.5) * height;
        const r = 1.6 + Math.abs(Math.sin(time * 0.8 + i)) * 2.8;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 12);
        glow.addColorStop(0, `hsla(${(time * 10 + i * 14) % 360}, 100%, 86%, 0.2)`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 12, 0, Math.PI * 2);
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
