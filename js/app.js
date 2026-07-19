(function () {
  "use strict";

  /* ---------- Mobile menu ---------- */
  var menu = document.getElementById("mobile-menu");
  var openBtn = document.querySelector("[data-menu-open]");
  var closeBtn = document.querySelector("[data-menu-close]");
  var menuLinks = document.querySelectorAll("[data-menu-link]");
  var lastFocused = null;

  function openMenu() {
    if (!menu) return;
    lastFocused = document.activeElement;
    menu.hidden = false;
    menu.style.display = "flex";
    document.body.style.overflow = "hidden";
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    if (closeBtn) closeBtn.focus();
    document.addEventListener("keydown", onMenuKeydown);
  }

  function closeMenu() {
    if (!menu) return;
    menu.hidden = true;
    menu.style.display = "none";
    document.body.style.overflow = "";
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onMenuKeydown);
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function onMenuKeydown(e) {
    if (e.key === "Escape") closeMenu();
  }

  if (openBtn) openBtn.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  menuLinks.forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ---------- Countdown ---------- */
  var countdownEl = document.getElementById("bfec-countdown");
  var countdownClosedEl = document.getElementById("bfec-countdown-closed");

  function pad(value, length) {
    return String(Math.max(0, value)).padStart(length, "0").split("");
  }

  function setDigits(container, digits) {
    var boxes = container.querySelectorAll(".cd-digit");
    for (var i = 0; i < digits.length; i++) {
      if (boxes[i]) boxes[i].textContent = digits[i];
    }
  }

  function tickCountdown() {
    if (!countdownEl) return;
    var targetStr = countdownEl.getAttribute("data-target");
    var target = new Date(targetStr).getTime();
    if (isNaN(target)) return; // no configured/parseable date — leave last-known static state alone
    var now = Date.now();
    var diff = target - now;

    if (diff <= 0) {
      countdownEl.hidden = true;
      if (countdownClosedEl) countdownClosedEl.hidden = false;
      return;
    }

    var totalSeconds = Math.floor(diff / 1000);
    var d = Math.floor(totalSeconds / 86400);
    var h = Math.floor((totalSeconds % 86400) / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;

    setDigits(countdownEl.querySelector('[data-cd-digits="d"]'), pad(d, 3));
    setDigits(countdownEl.querySelector('[data-cd-digits="h"]'), pad(h, 2));
    setDigits(countdownEl.querySelector('[data-cd-digits="m"]'), pad(m, 2));
    setDigits(countdownEl.querySelector('[data-cd-digits="s"]'), pad(s, 2));
  }

  if (countdownEl) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  /* ---------- Generic tab groups (schedule days / partner tiers / FAQ categories) ---------- */
  function setupTabs(tabSelector, panelSelector, dataAttr) {
    var tabs = document.querySelectorAll(tabSelector);
    var panels = document.querySelectorAll(panelSelector);
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute(dataAttr);
        tabs.forEach(function (t) {
          var active = t === tab;
          t.setAttribute("aria-pressed", active ? "true" : "false");
          t.style.background = active ? "#C2FF1F" : "transparent";
          t.style.color = active ? "#0A0A0A" : "rgba(255,255,255,0.6)";
        });
        panels.forEach(function (p) {
          p.hidden = !p.id.endsWith("-" + key);
        });
      });
    });
  }

  setupTabs("[data-day-tab]", "[data-day-panel]", "data-day-tab");
  setupTabs("[data-tier-tab]", "[data-tier-panel]", "data-tier-tab");
  setupTabs("[data-faq-cat]", "[data-faq-panel]", "data-faq-cat");

  /* ---------- FAQ accordion (independent per item, single-open-per-category like the original design) ---------- */
  document.querySelectorAll("[data-faq-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var sign = btn.querySelector("[data-faq-sign]");

      // Close other open items within the same FAQ category panel only.
      var container = btn.closest("[data-faq-panel]");
      if (container) {
        container.querySelectorAll("[data-faq-toggle]").forEach(function (other) {
          if (other !== btn) {
            other.setAttribute("aria-expanded", "false");
            var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
            if (otherPanel) otherPanel.hidden = true;
            var otherSign = other.querySelector("[data-faq-sign]");
            if (otherSign) otherSign.textContent = "+";
          }
        });
      }

      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (panel) panel.hidden = expanded;
      if (sign) sign.textContent = expanded ? "+" : "–";
    });
  });

  /* ---------- Scroll reveal ---------- */
  var riseEls = document.querySelectorAll("[data-rise]");
  if ("IntersectionObserver" in window && riseEls.length) {
    riseEls.forEach(function (el) {
      el.style.transition = "opacity .75s cubic-bezier(.2,.7,.2,1), transform .75s cubic-bezier(.2,.7,.2,1)";
      el.style.opacity = "0";
      el.style.transform = "translateY(36px)";
    });
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );
    riseEls.forEach(function (el) {
      revealObserver.observe(el);
    });
    // Safety net: never leave content invisible if something goes wrong.
    setTimeout(function () {
      riseEls.forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    }, 3000);
  }

  /* ---------- Hero parallax (progressive enhancement only) ---------- */
  var hero = document.getElementById("hero-parallax");
  if (hero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var y = window.scrollY || window.pageYOffset || 0;
          if (y < window.innerHeight * 1.2) {
            hero.style.transform = "translateY(" + y * 0.28 + "px)";
          }
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Keyboard-focus landing on same-page anchor navigation ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function () {
      var id = a.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      setTimeout(function () {
        target.focus({ preventScroll: true });
      }, 400);
    });
  });

  /* ---------- Newsletter form (no backend yet — be honest, no fake success) ---------- */
  var newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("newsletter-status");
      var emailInput = document.getElementById("newsletter-email");
      if (!emailInput.checkValidity()) {
        if (status) status.textContent = "Please enter a valid email address.";
        emailInput.focus();
        return;
      }
      if (status) {
        status.textContent = "Sign-up isn't connected yet — please email cities@bmxseries.com or partners@bmxseries.com for now.";
      }
    });
  }
})();
