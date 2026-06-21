/* =========================================================
   HUSS CRAFTS — interactions
   Header state · mobile nav · scroll reveals · lightbox · form
   ========================================================= */
(function () {
  "use strict";

  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollOpts = { behavior: reduceMotion ? "auto" : "smooth", block: "center" };

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header scrolled state ---------- */
  const header = $("#header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const toggle = $("#navToggle");
  const nav = $("#nav");
  const setBodyScroll = (locked) => { document.body.style.overflow = locked ? "hidden" : ""; };
  const closeNav = () => {
    if (!document.body.classList.contains("nav-open")) return;
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    setBodyScroll(false);
  };
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      setBodyScroll(open);
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeNav();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Lightbox ---------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lightboxImg");
  const lbCap = $("#lightboxCap");
  const lbClose = $("#lightboxClose");
  let lastFocused = null;

  const openLightbox = (tile) => {
    if (!lightbox) return;
    const src = tile.getAttribute("data-img");
    const name = tile.getAttribute("data-name") || "";
    const type = tile.getAttribute("data-type") || "";
    lbImg.src = src;
    lbImg.alt = name + (type ? " — " + type : "");
    lbCap.textContent = type ? `${name} · ${type}` : name;
    lightbox.classList.add("open");
    setBodyScroll(true);
    lastFocused = document.activeElement;
    lbClose.focus();
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    setBodyScroll(false);
    if (lastFocused) lastFocused.focus();
  };

  $$(".tile").forEach((tile) => {
    tile.addEventListener("click", () => openLightbox(tile));
    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(tile);
      }
    });
  });
  if (lightbox) {
    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    window.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      // Focus trap: the dialog has a single control, so pin focus to it
      if (e.key === "Tab") {
        e.preventDefault();
        lbClose.focus();
      }
    });
  }

  /* ---------- Contact form (mockup — validates client-side, nothing is sent) ---------- */
  const form = $("#contactForm");
  const card = $("#formCard");
  const success = $("#formSuccess");
  const resetBtn = $("#formReset");
  const formStatus = $("#formStatus");

  const emailOk = (v) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v.trim());
  const phoneOk = (v) => v.replace(/\D/g, "").length >= 7;

  const setError = (field, hasError) => {
    field.classList.toggle("invalid", hasError);
    const input = $("input, select, textarea", field);
    const err = $(".err", field);
    if (input) {
      input.setAttribute("aria-invalid", hasError ? "true" : "false");
      if (err && err.id) {
        if (hasError) input.setAttribute("aria-describedby", err.id);
        else input.removeAttribute("aria-describedby");
      }
    }
  };

  const validateField = (input) => {
    const field = input.closest(".field");
    if (!field) return true;
    let ok = true;
    if (input.hasAttribute("required") && !input.value.trim()) ok = false;
    if (ok && input.type === "email" && !emailOk(input.value)) ok = false;
    if (ok && input.type === "tel" && !phoneOk(input.value)) ok = false;
    setError(field, !ok);
    return ok;
  };

  if (form) {
    // live-clear errors as the user fixes them
    $$("input, select, textarea", form).forEach((input) => {
      input.addEventListener("blur", () => validateField(input));
      input.addEventListener("input", () => {
        if (input.closest(".field").classList.contains("invalid")) validateField(input);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const required = $$("[required]", form);
      let firstBad = null;
      let badCount = 0;
      required.forEach((input) => {
        if (!validateField(input)) {
          badCount++;
          if (!firstBad) firstBad = input;
        }
      });
      if (badCount > 0) {
        if (formStatus) {
          formStatus.textContent =
            "Please fix the highlighted field" + (badCount === 1 ? "" : "s") + " below.";
        }
        if (firstBad) firstBad.focus();
        return;
      }
      // Mockup: show success state instead of sending
      if (formStatus) formStatus.textContent = "";
      card.classList.add("is-sent");
      success.classList.add("show");
      success.scrollIntoView(scrollOpts);
      const heading = success.querySelector("h3");
      if (heading) heading.focus({ preventScroll: true });
    });
  }

  if (resetBtn && form && card && success) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      $$(".field", form).forEach((f) => setError(f, false));
      if (formStatus) formStatus.textContent = "";
      card.classList.remove("is-sent");
      success.classList.remove("show");
      form.scrollIntoView(scrollOpts);
      const first = $("#f-name");
      if (first) first.focus();
    });
  }
})();
