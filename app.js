/* ============================================================
   Horus marketing site — behavior
   - Theme switcher: auto-cycles blue -> red -> teal every 4200ms;
     clicking a swatch locks; AUTO resumes. Explicit choice persists
     in localStorage. Auto-cycle disabled under prefers-reduced-motion.
   - FAQ accordion (single open item).
   - Mobile nav toggle.
   Shared across index.html / setup.html / changelog.html.
   ============================================================ */
(function () {
  'use strict';

  var THEMES = ['blue', 'red', 'teal'];
  var CYCLE_MS = 4200;
  var STORE_KEY = 'horus-theme';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cycleTimer = null;
  var auto = true;

  function applyTheme(theme) {
    if (THEMES.indexOf(theme) === -1) theme = 'blue';
    root.setAttribute('data-theme', theme);
    syncPicker(theme);
  }

  function syncPicker(theme) {
    // swatches
    var swatches = document.querySelectorAll('.swatch');
    swatches.forEach(function (btn) {
      var isActive = !auto && btn.getAttribute('data-theme') === theme;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    // AUTO buttons
    document.querySelectorAll('.theme-auto').forEach(function (btn) {
      btn.classList.toggle('active', auto);
      btn.setAttribute('aria-pressed', auto ? 'true' : 'false');
    });
  }

  function currentTheme() {
    return root.getAttribute('data-theme') || 'blue';
  }

  function startCycle() {
    stopCycle();
    if (reduceMotion) return; // auto-cycle is motion; honor the preference
    cycleTimer = window.setInterval(function () {
      if (!auto) return;
      var next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
      applyTheme(next);
    }, CYCLE_MS);
  }

  function stopCycle() {
    if (cycleTimer) { window.clearInterval(cycleTimer); cycleTimer = null; }
  }

  function lockTheme(theme) {
    auto = false;
    stopCycle();
    applyTheme(theme);
    try { localStorage.setItem(STORE_KEY, theme); } catch (e) {}
  }

  function resumeAuto() {
    auto = true;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    syncPicker(currentTheme());
    startCycle();
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
    if (saved && THEMES.indexOf(saved) !== -1) {
      auto = false;
      applyTheme(saved);
    } else {
      auto = true;
      applyTheme('blue');
      startCycle();
    }

    document.querySelectorAll('.swatch').forEach(function (btn) {
      btn.addEventListener('click', function () {
        lockTheme(btn.getAttribute('data-theme'));
      });
    });
    document.querySelectorAll('.theme-auto').forEach(function (btn) {
      btn.addEventListener('click', resumeAuto);
    });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    var buttons = document.querySelectorAll('.faq-q');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        // close all
        buttons.forEach(function (b) {
          b.setAttribute('aria-expanded', 'false');
          var a = document.getElementById(b.getAttribute('aria-controls'));
          if (a) a.hidden = true;
          var sign = b.querySelector('.sign');
          if (sign) sign.textContent = '+';
        });
        // open this one if it was closed
        if (!expanded) {
          btn.setAttribute('aria-expanded', 'true');
          var ans = document.getElementById(btn.getAttribute('aria-controls'));
          if (ans) ans.hidden = false;
          var s = btn.querySelector('.sign');
          if (s) s.textContent = '–';
        }
      });
    });
  }

  /* ---------- Mobile nav ---------- */
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.querySelector('.mobile-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // close menu when a link is tapped
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Buy modal ---------- */
  // Your Stripe Payment Link. Its "After payment" redirect must point at the
  // worker's /discord/link?session_id={CHECKOUT_SESSION_ID} so the buyer links
  // Discord and the bot DMs their key (see infra/license-worker/README.md §5).
  var STRIPE_LINK = 'https://buy.stripe.com/3cI3cx7WDaFod1GbzL0Ny00';

  function initBuyModal() {
    var modal = document.getElementById('buy-modal');
    if (!modal) return; // modal only lives on index.html
    var closeBtn = document.getElementById('buy-close');
    var couponInput = document.getElementById('coupon-input');
    var couponBtn = document.getElementById('coupon-btn');
    var couponNote = document.getElementById('coupon-note');
    var confirm = document.querySelector('.buy-confirm');
    var confirmInput = document.getElementById('confirm-input');
    var payBtn = document.getElementById('pay-btn');
    var payHint = document.getElementById('pay-hint');
    var couponApplied = false;
    var lastFocus = null;

    function open(e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // Any link to #buy (nav, hero, pricing "Subscribe", footer) opens the modal.
    document.querySelectorAll('a[href="#buy"], [data-open-buy]').forEach(function (el) {
      el.addEventListener('click', open);
    });

    closeBtn.addEventListener('click', close);
    // Click on the backdrop (not the panel) closes.
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    // Links inside the modal that should dismiss it (e.g. "risk to my account" -> FAQ).
    modal.querySelectorAll('[data-close-buy]').forEach(function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) close();
    });

    // Coupon: applying just flags it; the code is forwarded to Stripe at pay time.
    function applyCoupon() {
      var code = (couponInput.value || '').trim();
      if (!code) return;
      couponApplied = true;
      couponBtn.textContent = 'Applied';
      couponNote.textContent = 'Code “' + code + '” will be applied at checkout';
      couponNote.hidden = false;
    }
    couponBtn.addEventListener('click', applyCoupon);
    couponInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); }
    });
    // Editing the code after applying re-arms it.
    couponInput.addEventListener('input', function () {
      couponApplied = false;
      couponBtn.textContent = 'Apply';
      couponNote.hidden = true;
    });

    // Pay is gated behind the risk-acceptance checkbox.
    function syncConfirm() {
      var on = confirmInput.checked;
      confirm.classList.toggle('on', on);
      payBtn.disabled = !on;
      payHint.textContent = on
        ? 'Secure checkout on Stripe · card & Apple/Google Pay'
        : 'Check the box above to unlock payment.';
    }
    confirmInput.addEventListener('change', syncConfirm);
    syncConfirm();

    payBtn.addEventListener('click', function () {
      if (!confirmInput.checked) return;
      var url = STRIPE_LINK;
      var code = (couponInput.value || '').trim();
      if (couponApplied && code) {
        url += (url.indexOf('?') >= 0 ? '&' : '?') +
          'prefilled_promo_code=' + encodeURIComponent(code);
      }
      window.open(url, '_blank', 'noopener');
    });
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    initTheme();
    initFaq();
    initMobileNav();
    initBuyModal();
  });
})();
