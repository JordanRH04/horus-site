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

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    initTheme();
    initFaq();
    initMobileNav();
  });
})();
