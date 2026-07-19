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

/* ===================================================================
 * BFES FAQ — fully isolated component. No dependency on the IIFE
 * above, no shared state, no globally-delegated listeners. Finds its
 * own root by a single unique selector and no-ops if absent.
 * =================================================================== */
function initFaq() {
  "use strict";

  var root = document.querySelector("[data-bfes-faq]");
  if (!root) return;

  var tabs = root.querySelectorAll(".bfes-faq-tab");
  var panels = root.querySelectorAll(".bfes-faq-panel");
  var questions = root.querySelectorAll(".bfes-faq-question");

  function closeQuestion(btn) {
    var answer = document.getElementById(btn.getAttribute("aria-controls"));
    var icon = btn.querySelector(".bfes-faq-icon");
    btn.setAttribute("aria-expanded", "false");
    if (answer) answer.hidden = true;
    if (icon) icon.textContent = "+";
  }

  function openQuestion(btn) {
    var answer = document.getElementById(btn.getAttribute("aria-controls"));
    var icon = btn.querySelector(".bfes-faq-icon");
    btn.setAttribute("aria-expanded", "true");
    if (answer) answer.hidden = false;
    if (icon) icon.textContent = "\u2212";
  }

  function closeAllQuestions() {
    questions.forEach(closeQuestion);
  }

  function activateTab(tab) {
    var targetPanelId = tab.getAttribute("aria-controls");

    tabs.forEach(function (t) {
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });

    panels.forEach(function (panel) {
      var isTarget = panel.id === targetPanelId;
      panel.hidden = !isTarget;
      panel.setAttribute("aria-hidden", isTarget ? "false" : "true");
    });

    // Changing category always resets question state — no carried-over
    // open answers, no auto-opened question.
    closeAllQuestions();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activateTab(tab);
    });
  });

  questions.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      var panel = btn.closest(".bfes-faq-panel");

      if (panel) {
        panel.querySelectorAll(".bfes-faq-question").forEach(function (other) {
          if (other !== btn) closeQuestion(other);
        });
      }

      if (isOpen) {
        closeQuestion(btn);
      } else {
        openQuestion(btn);
      }
    });
  });

  // Initial state: Cities active, everything else hidden, all questions closed.
  closeAllQuestions();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFaq);
} else {
  initFaq();
}
