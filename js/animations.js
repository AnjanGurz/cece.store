/* ============================================
   js/animations.js
   Scroll reveal and entrance animations.
   ============================================ */

const CeceAnimations = (() => {

  let observer = null;

  // ── INTERSECTION OBSERVER FOR REVEAL ──
  function observeReveal() {
    // Disconnect old observer if exists
    if (observer) observer.disconnect();

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger delay based on position
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // ── DUPLICATE MARQUEE FOR SEAMLESS LOOP ──
  function initMarquee() {
    const track = document.getElementById('marquee');
    if (track) track.innerHTML += track.innerHTML;
  }

  // ── PUBLIC ──
  return { observeReveal, initMarquee };

})();
