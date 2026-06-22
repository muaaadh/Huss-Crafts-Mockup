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

  /* ---------- Neon sign builder ---------- */
  const stage = $("#neonStage");
  if (stage) {
    const neon = $("#neonText");
    const input = $("#neonInput");
    const fontsBox = $("#neonFonts");
    const colorsBox = $("#neonColors");
    const widthEl = $("#neonWidth");
    const widthVal = $("#neonWidthVal");
    const dimW = $("#neonDimW");
    const dimH = $("#neonDimH");
    const priceEl = $("#neonPrice");
    const countEl = $("#neonCount");
    const power = $("#neonPower");
    const powerState = $("#neonPowerState");
    const useBox = $("#neonUse");
    const requestBtn = $("#neonRequest");

    const FONTS = [
      { name: "Pacifico",       css: '"Pacifico", cursive' },
      { name: "Dancing Script", css: '"Dancing Script", cursive' },
      { name: "Great Vibes",    css: '"Great Vibes", cursive' },
      { name: "Satisfy",        css: '"Satisfy", cursive' },
      { name: "Marker",         css: '"Permanent Marker", cursive' },
      { name: "Bungee",         css: '"Bungee", sans-serif' },
      { name: "Audiowide",      css: '"Audiowide", sans-serif' },
      { name: "Righteous",      css: '"Righteous", sans-serif' }
    ];
    const COLORS = [
      { name: "Warm white", hex: "#ffd9a6" },
      { name: "White",      hex: "#ffffff" },
      { name: "Gold",       hex: "#ffcf4d" },
      { name: "Sunset",     hex: "#ff7a3c" },
      { name: "Red",        hex: "#ff4d4d" },
      { name: "Pink",       hex: "#ff5fb7" },
      { name: "Purple",     hex: "#b66bff" },
      { name: "Ice blue",   hex: "#5cd0ff" },
      { name: "Green",      hex: "#46ff8c" }
    ];

    const state = {
      text: input.value || "",
      font: FONTS[0],
      color: COLORS[2], // Gold (on-brand default)
      width: parseInt(widthEl.value, 10) || 90,
      use: "indoor"
    };
    const PRICE = { base: 750, perCm: 14, perChar: 55, outdoor: 1.4 };
    const fmt = (n) => "MVR " + Math.round(n).toLocaleString("en-US");

    // roving-tabindex radiogroup (keyboard arrows + Home/End + Enter/Space)
    const makeRadioGroup = (container, onSelect) => {
      const radios = () => $$('[role="radio"]', container);
      const pick = (el, focus) => {
        radios().forEach((r) => {
          const on = r === el;
          r.setAttribute("aria-checked", on ? "true" : "false");
          r.tabIndex = on ? 0 : -1;
        });
        if (focus) el.focus();
        onSelect(el);
      };
      container.addEventListener("keydown", (e) => {
        const list = radios();
        const i = list.indexOf(document.activeElement);
        if (i < 0) return;
        let ni = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = (i + 1) % list.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") ni = (i - 1 + list.length) % list.length;
        else if (e.key === "Home") ni = 0;
        else if (e.key === "End") ni = list.length - 1;
        else if (e.key === " " || e.key === "Enter") { e.preventDefault(); pick(list[i], true); return; }
        if (ni >= 0) { e.preventDefault(); pick(list[ni], true); }
      });
      return pick;
    };

    // build font chips
    FONTS.forEach((f, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "fontchip";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", idx === 0 ? "true" : "false");
      b.setAttribute("aria-label", "Font: " + f.name);
      b.tabIndex = idx === 0 ? 0 : -1;
      b.style.fontFamily = f.css;
      b.dataset.idx = idx;
      b.textContent = f.name;
      fontsBox.appendChild(b);
    });
    const pickFont = makeRadioGroup(fontsBox, (el) => { state.font = FONTS[+el.dataset.idx]; render(); });
    $$(".fontchip", fontsBox).forEach((b) => b.addEventListener("click", () => pickFont(b, false)));

    // build colour chips
    COLORS.forEach((c, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "colorchip";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", idx === 2 ? "true" : "false");
      b.setAttribute("aria-label", "Colour: " + c.name);
      b.tabIndex = idx === 2 ? 0 : -1;
      b.style.setProperty("--c", c.hex);
      b.dataset.idx = idx;
      b.appendChild(document.createElement("span"));
      colorsBox.appendChild(b);
    });
    const pickColor = makeRadioGroup(colorsBox, (el) => { state.color = COLORS[+el.dataset.idx]; render(); });
    $$(".colorchip", colorsBox).forEach((b) => b.addEventListener("click", () => pickColor(b, false)));

    // usage segmented control
    const pickUse = makeRadioGroup(useBox, (el) => { state.use = el.dataset.use; render(); });
    $$('[role="radio"]', useBox).forEach((b) => b.addEventListener("click", () => pickUse(b, false)));

    // text input — cap at 3 lines, sync count
    input.addEventListener("input", () => {
      const v = input.value.split("\n").slice(0, 3).join("\n");
      if (v !== input.value) input.value = v;
      state.text = v;
      render();
    });

    // width slider
    widthEl.addEventListener("input", () => { state.width = parseInt(widthEl.value, 10); render(); });

    // power toggle
    const setPower = (on) => {
      stage.setAttribute("data-on", on ? "true" : "false");
      power.setAttribute("aria-checked", on ? "true" : "false");
      if (powerState) powerState.textContent = on ? "on" : "off";
      if (on && !reduceMotion) {
        neon.classList.remove("flicker");
        void neon.offsetWidth; // restart animation
        neon.classList.add("flicker");
      }
    };
    power.addEventListener("click", () => setPower(stage.getAttribute("data-on") !== "true"));

    // request → hand the design to the contact form
    requestBtn.addEventListener("click", () => {
      const hasText = !!(state.text && state.text.trim().length);
      const txt = (state.text || "").trim().replace(/\s*\n\s*/g, " / ") || "(no text yet)";
      const spec =
        "Custom neon sign enquiry\n" +
        '• Text: "' + txt + '"\n' +
        "• Font: " + state.font.name + "\n" +
        "• Colour: " + state.color.name + "\n" +
        (hasText
          ? "• Size: ~" + dimW.textContent + " × " + dimH.textContent + " cm\n"
          : "• Width: " + state.width + " cm (height set once text is added)\n") +
        "• Use: " + (state.use === "outdoor" ? "Outdoor" : "Indoor") + "\n" +
        "• Estimated: " + priceEl.textContent + (hasText ? " (indicative)" : " (from — final price depends on text)");
      const type = $("#f-type");
      if (type) type.value = "neon";
      const msg = $("#f-msg");
      if (msg) {
        msg.value = spec;
        msg.dispatchEvent(new Event("input", { bubbles: true }));
      }
      // if the form was already submitted this session, restore it so the prefill shows
      if (card && card.classList.contains("is-sent")) {
        card.classList.remove("is-sent");
        if (success) success.classList.remove("show");
      }
      if (formStatus) formStatus.textContent = "Your neon design was added to the Project details field below — add your name and contact details, then send the enquiry.";
      const contact = $("#contact");
      if (contact) contact.scrollIntoView(scrollOpts);
      const name = $("#f-name");
      if (name) setTimeout(() => name.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
    });

    // accessible live summary (debounced) for screen readers
    const live = $("#neonLive");
    let announceT;
    const announce = (msg) => {
      if (!live) return;
      clearTimeout(announceT);
      announceT = setTimeout(() => { live.textContent = msg; }, 350);
    };

    function render() {
      const hasText = !!(state.text && state.text.trim().length);
      neon.textContent = hasText ? state.text : "Your text";
      neon.style.fontFamily = state.font.css;
      neon.style.setProperty("--neon", state.color.hex);
      // slider sets the size cap, but keep viewport scaling so it shrinks on phones
      const rem = 2.1 + (state.width - 30) / 170 * 2.9;
      neon.style.fontSize = "clamp(1.8rem, " + (rem * 1.7).toFixed(1) + "vw, " + rem.toFixed(2) + "rem)";

      widthVal.textContent = state.width;
      widthEl.setAttribute("aria-valuetext", state.width + " centimetres");
      dimW.textContent = hasText ? state.width : "—";
      countEl.textContent = (state.text || "").length;

      // price estimate — base floor only until there is text (no fabricated total)
      const chars = (state.text || "").replace(/\s/g, "").length;
      let p = PRICE.base;
      if (hasText) {
        p = PRICE.base + state.width * PRICE.perCm + chars * PRICE.perChar;
        if (state.use === "outdoor") p *= PRICE.outdoor;
      }
      priceEl.textContent = fmt(Math.round(p / 10) * 10);

      // derive physical height from the rendered aspect ratio
      if (hasText) {
        requestAnimationFrame(() => {
          const w = neon.offsetWidth || 1;
          const h = neon.offsetHeight || 1;
          dimH.textContent = Math.max(6, Math.round(state.width * (h / w)));
          announce("Estimated " + priceEl.textContent + ", about " + state.width + " by " + dimH.textContent + " centimetres.");
        });
      } else {
        dimH.textContent = "—";
        announce("From " + priceEl.textContent + ". Add text to size your sign.");
      }
    }

    render();
    // re-measure once the display fonts swap in (fallback metrics differ from real glyphs)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
    // re-measure the derived height after viewport changes (font scales via clamp)
    let resizeT;
    window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(render, 150); });
  }
})();
