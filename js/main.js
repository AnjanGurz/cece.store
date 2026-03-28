/* ============================================
   js/main.js
   App entry point.
   Boots up all modules on DOMContentLoaded.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

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

  // 5. Secret admin trigger — triple-click the footer brand
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
