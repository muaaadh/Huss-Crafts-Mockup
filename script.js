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
      { name: "Warm white", hex: "#f3d9ad", core: "#fff6e8" },
      { name: "White",      hex: "#dfe9f5", core: "#ffffff" },
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
      stage.style.setProperty("--neon", state.color.hex); // set on stage so the wall ambient inherits it
      stage.style.setProperty("--neon-core", state.color.core || "#fff"); // keep a hot core distinct from white/warm-white blooms
      // slider sets the size cap, but keep viewport scaling so it shrinks on phones
      const rem = Math.min(4.4, 2.1 + (state.width - 30) / 170 * 2.9);
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

  /* ---------- Pegboard builder (drag & drop) ---------- */
  const pegBoard = $("#pegBoard");
  if (pegBoard) {
    const holes = $("#pegHoles");
    const layer = $("#pegLayer");
    const tray = $("#pegTray");
    const colorsBox = $("#pegColors");
    const sizesBox = $("#pegSizes");
    const sizeLabel = $("#pegSize");
    const countLabel = $("#pegCount");
    const clearBtn = $("#pegClear");
    const requestBtn = $("#pegRequest");
    const live = $("#pegLive");
    const emptyHint = $("#pegEmpty");

    // realistic flat-shaded product illustrations (wood tones + contents), drawn to each footprint's aspect
    const ICONS = {
      shelf: '<svg aria-hidden="true" focusable="false" viewBox="0 0 200 56" preserveAspectRatio="xMidYMid meet"><path d="M42 32 H60 L42 53 Z" fill="#c2a45f"/><path d="M158 32 H140 L158 53 Z" fill="#c2a45f"/><rect x="20" y="18" width="160" height="14" rx="3" fill="#ddc187"/><rect x="20" y="16" width="160" height="6" rx="3" fill="#efdcb4"/><rect x="20" y="28" width="160" height="5" rx="2" fill="#c2a45f"/></svg>',
      bin:   '<svg aria-hidden="true" focusable="false" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet"><rect x="28" y="44" width="64" height="56" rx="5" fill="#a07f3f"/><rect x="40" y="26" width="7" height="40" rx="2" fill="#e2574f"/><rect x="52" y="20" width="7" height="46" rx="2" fill="#5bb46a"/><rect x="64" y="28" width="7" height="38" rx="2" fill="#4a90d9"/><rect x="74" y="22" width="7" height="44" rx="2" fill="#f0b429"/><path d="M94 56 v44 l6 -7 v-37 z" fill="#c2a45f"/><rect x="26" y="56" width="68" height="48" rx="6" fill="#ddc187"/><rect x="26" y="56" width="68" height="7" rx="3.5" fill="#efdcb4"/><rect x="26" y="97" width="68" height="7" rx="3.5" fill="#c2a45f"/></svg>',
      pot:   '<svg aria-hidden="true" focusable="false" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet"><path d="M60 67 C44 59 36 43 40 31 C54 37 60 51 60 67 Z" fill="#4e9e5a"/><path d="M60 67 C76 59 84 43 80 31 C66 37 60 51 60 67 Z" fill="#4e9e5a"/><path d="M60 67 C52 51 50 37 54 29 C60 39 62 53 60 67 Z" fill="#5cbf6b"/><path d="M60 67 C68 51 70 37 66 29 C60 39 58 53 60 67 Z" fill="#5cbf6b"/><path d="M60 67 C58 49 60 35 60 28 C60 36 62 51 60 67 Z" fill="#74d484"/><path d="M40 71 H80 L74 104 H46 Z" fill="#ddc187"/><rect x="35" y="64" width="50" height="9" rx="3" fill="#c2a45f"/><rect x="38" y="65" width="44" height="4" rx="2" fill="#efdcb4"/></svg>',
      cup:   '<svg aria-hidden="true" focusable="false" viewBox="0 0 64 120" preserveAspectRatio="xMidYMid meet"><ellipse cx="32" cy="64" rx="16" ry="5" fill="#c2a45f"/><ellipse cx="32" cy="64" rx="11" ry="3" fill="#6f521f"/><rect x="19" y="32" width="6" height="40" rx="2" fill="#e2574f"/><rect x="29" y="26" width="6" height="46" rx="2" fill="#4a90d9"/><rect x="39" y="34" width="6" height="38" rx="2" fill="#f0b429"/><path d="M16 64 H48 L45 110 H19 Z" fill="#ddc187"/><path d="M17 64 H47 L46.4 70 H17.6 Z" fill="#efdcb4"/><path d="M45 64 L48 64 L45 110 L43 108 Z" fill="#c2a45f"/></svg>',
      hook:  '<svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet"><circle cx="26" cy="22" r="11" fill="#ddc187"/><circle cx="26" cy="22" r="11" fill="none" stroke="#c2a45f" stroke-width="2.5"/><circle cx="23" cy="19" r="3.5" fill="#efdcb4"/><path d="M26 33 V42 a13 13 0 0 0 17 9.5" fill="none" stroke="#c2a45f" stroke-width="8" stroke-linecap="round"/><path d="M26 33 V42 a13 13 0 0 0 17 9.5" fill="none" stroke="#ddc187" stroke-width="3.5" stroke-linecap="round"/></svg>',
      roll:  '<svg aria-hidden="true" focusable="false" viewBox="0 0 180 56" preserveAspectRatio="xMidYMid meet"><rect x="14" y="13" width="152" height="7" rx="3.5" fill="#c2a45f"/><circle cx="18" cy="16.5" r="6" fill="#ddc187"/><circle cx="162" cy="16.5" r="6" fill="#ddc187"/><rect x="36" y="14" width="108" height="27" rx="13.5" fill="#f6efe1"/><rect x="40" y="16" width="100" height="8" rx="4" fill="#ffffff"/><ellipse cx="36" cy="27.5" rx="6" ry="13.5" fill="#e7ddca"/><ellipse cx="144" cy="27.5" rx="6" ry="13.5" fill="#ffffff"/><circle cx="144" cy="27.5" r="4" fill="#cbb98f"/><path d="M72 40 H110 V52 H72 Z" fill="#fbf7ef"/><path d="M72 40 H110 V44 H72 Z" fill="#e9dfcd"/></svg>'
    };
    const ATT = {
      shelf: { name: "Shelf",      w: 4, h: 1, box: false },
      bin:   { name: "Deep bin",   w: 2, h: 2, box: true },
      pot:   { name: "Plant pot",  w: 2, h: 2, box: true },
      cup:   { name: "Cup holder", w: 1, h: 2, box: true },
      hook:  { name: "Hook",       w: 1, h: 1, box: false },
      roll:  { name: "Paper roll", w: 3, h: 1, box: false }
    };
    const TRAY_ORDER = ["shelf", "bin", "pot", "cup", "hook", "roll"];
    const PEGC = [
      { key: "lime",   name: "Lime",   c: "#a6cf2e" },
      { key: "yellow", name: "Yellow", c: "#ecb71f" },
      { key: "orange", name: "Orange", c: "#e3741c" },
      { key: "coral",  name: "Coral",  c: "#de3f3c" },
      { key: "sky",    name: "Sky",    c: "#34aacb" },
      { key: "birch",  name: "Birch",  c: "#d4b87c" }
    ];
    const SIZES = { s: { cols: 7, rows: 5, cm: "60 × 45 cm" }, m: { cols: 9, rows: 6, cm: "90 × 60 cm" }, l: { cols: 11, rows: 7, cm: "120 × 75 cm" } };

    const pstate = { color: "lime", size: "m", items: [] };
    let COLS = SIZES.m.cols, ROWS = SIZES.m.rows;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    let announceT;
    const announce = (m) => { if (!live) return; clearTimeout(announceT); announceT = setTimeout(() => { live.textContent = m; }, 300); };

    // roving-tabindex radiogroup
    const radioGroup = (container, onSelect) => {
      const radios = () => $$('[role="radio"]', container);
      const pick = (el, focus) => {
        radios().forEach((r) => { const on = r === el; r.setAttribute("aria-checked", on ? "true" : "false"); r.tabIndex = on ? 0 : -1; });
        if (focus) el.focus();
        onSelect(el);
      };
      container.addEventListener("keydown", (e) => {
        const list = radios(); const i = list.indexOf(document.activeElement);
        if (i < 0) return;
        let ni = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = (i + 1) % list.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") ni = (i - 1 + list.length) % list.length;
        else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = list.length - 1;
        else if (e.key === " " || e.key === "Enter") { e.preventDefault(); pick(list[i], true); return; }
        if (ni >= 0) { e.preventDefault(); pick(list[ni], true); }
      });
      return pick;
    };

    const cell = () => { const r = layer.getBoundingClientRect(); return { w: r.width / COLS, h: r.height / ROWS, rect: r }; };

    const buildHoles = () => {
      holes.style.setProperty("--cols", COLS);
      holes.style.setProperty("--rows", ROWS);
      holes.innerHTML = "";
      const frag = document.createDocumentFragment();
      for (let i = 0; i < COLS * ROWS; i++) {
        const d = document.createElement("div"); d.className = "peg-hole";
        d.appendChild(document.createElement("i")); frag.appendChild(d);
      }
      holes.appendChild(frag);
    };

    const makeAtt = (type, ghost) => {
      const def = ATT[type];
      const el = document.createElement("div");
      el.className = "peg-att peg-att--" + type + (def.box ? " peg-att--box" : "");
      el.innerHTML = ICONS[type];
      if (!ghost) {
        el.tabIndex = 0;
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", def.name + " — drag to move, arrow keys to nudge, Delete to remove");
        const rm = document.createElement("button");
        rm.type = "button"; rm.className = "peg-att__remove";
        rm.setAttribute("aria-label", "Remove " + def.name); rm.innerHTML = "&times;";
        el.appendChild(rm);
      }
      return el;
    };

    const positionItem = (it) => {
      const c = cell(), def = ATT[it.type];
      it.el.style.left = (it.col * c.w) + "px";
      it.el.style.top = (it.row * c.h) + "px";
      it.el.style.width = (def.w * c.w) + "px";
      it.el.style.height = (def.h * c.h) + "px";
    };
    const repositionAll = () => pstate.items.forEach((it) => {
      const def = ATT[it.type];
      it.col = clamp(it.col, 0, COLS - def.w);
      it.row = clamp(it.row, 0, ROWS - def.h);
      positionItem(it);
    });
    const updateCount = () => {
      countLabel.textContent = pstate.items.length;
      const has = pstate.items.length > 0;
      pegBoard.classList.toggle("has-items", has);
      if (emptyHint) emptyHint.style.display = has ? "none" : "";
    };
    const removeItem = (it) => {
      const i = pstate.items.indexOf(it);
      if (i >= 0) pstate.items.splice(i, 1);
      const hadFocus = it.el.contains(document.activeElement);
      it.el.remove(); updateCount();
      if (hadFocus) {
        const next = pstate.items[i] || pstate.items[i - 1];
        const target = (next && next.el) || tray.querySelector(".peg-chip");
        if (target) target.focus();
      }
    };

    const overlaps = (a, ad, col, row) => !(col + ad.w <= a.col || a.col + ATT[a.type].w <= col || row + ad.h <= a.row || a.row + ATT[a.type].h <= row);
    const findFree = (def) => {
      for (let row = 0; row <= ROWS - def.h; row++)
        for (let col = 0; col <= COLS - def.w; col++)
          if (!pstate.items.some((a) => overlaps(a, def, col, row))) return { col, row };
      return null;
    };
    // resolve a drop cell, preferring the chosen one; fall back to nearest free slot (excluding `self`)
    const resolveSpot = (def, col, row, self) => {
      col = clamp(col, 0, COLS - def.w);
      row = clamp(row, 0, ROWS - def.h);
      if (!pstate.items.some((a) => a !== self && overlaps(a, def, col, row))) return { col, row };
      for (let r = 0; r <= ROWS - def.h; r++)
        for (let cc = 0; cc <= COLS - def.w; cc++)
          if (!pstate.items.some((a) => a !== self && overlaps(a, def, cc, r))) return { col: cc, row: r };
      return { col, row }; // board full — allow overlap as last resort
    };

    const bindItem = (it) => {
      it.el.addEventListener("pointerdown", (ev) => {
        if (ev.target.closest(".peg-att__remove")) return;
        it.el.style.display = "none";
        startDrag(it.type, ev, it);
      });
      it.el.querySelector(".peg-att__remove").addEventListener("click", (ev) => {
        ev.stopPropagation(); removeItem(it); announce(ATT[it.type].name + " removed. " + pstate.items.length + " on the board.");
      });
      it.el.addEventListener("keydown", (ev) => {
        const def = ATT[it.type]; let moved = true;
        if (ev.key === "ArrowLeft") it.col = clamp(it.col - 1, 0, COLS - def.w);
        else if (ev.key === "ArrowRight") it.col = clamp(it.col + 1, 0, COLS - def.w);
        else if (ev.key === "ArrowUp") it.row = clamp(it.row - 1, 0, ROWS - def.h);
        else if (ev.key === "ArrowDown") it.row = clamp(it.row + 1, 0, ROWS - def.h);
        else if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); removeItem(it); announce(def.name + " removed. " + pstate.items.length + " on the board."); return; }
        else moved = false;
        if (moved) { ev.preventDefault(); positionItem(it); }
      });
    };

    const place = (type, col, row, focusIt) => {
      const def = ATT[type];
      const it = { type, col: clamp(col, 0, COLS - def.w), row: clamp(row, 0, ROWS - def.h), el: makeAtt(type, false) };
      pstate.items.push(it);
      layer.appendChild(it.el);
      positionItem(it); bindItem(it); updateCount();
      if (focusIt) it.el.focus();
      return it;
    };

    // pointer drag — handles new (from tray) and moving existing
    let drag = null, justDragged = false;
    const moveGhost = (ev) => {
      const w = drag.ghost.offsetWidth, h = drag.ghost.offsetHeight;
      drag.ghost.style.left = (ev.clientX - w / 2) + "px";
      drag.ghost.style.top = (ev.clientY - h / 2) + "px";
    };
    const onDragMove = (ev) => { if (drag) { drag.moved = true; moveGhost(ev); } };
    const onDragUp = (ev) => {
      window.removeEventListener("pointermove", onDragMove);
      window.removeEventListener("pointercancel", onDragCancel);
      if (!drag) return;
      const c = cell(), def = drag.def;
      const inside = ev.clientX >= c.rect.left && ev.clientX <= c.rect.right && ev.clientY >= c.rect.top && ev.clientY <= c.rect.bottom;
      drag.ghost.remove();
      if (inside) {
        const col = Math.round((ev.clientX - c.rect.left - (def.w * c.w) / 2) / c.w);
        const row = Math.round((ev.clientY - c.rect.top - (def.h * c.h) / 2) / c.h);
        if (drag.existing) {
          const spot = resolveSpot(def, col, row, drag.existing);
          drag.existing.col = spot.col; drag.existing.row = spot.row;
          drag.existing.el.style.display = "";
          positionItem(drag.existing);
          if (!drag.moved) drag.existing.el.focus(); // a tap (no move) selects the item for keyboard editing
          else announce(def.name + " moved.");
        } else {
          const spot = resolveSpot(def, col, row, null);
          place(drag.type, spot.col, spot.row);
          announce(def.name + " added. " + pstate.items.length + " on the board.");
        }
      } else if (drag.existing) {
        removeItem(drag.existing);
        announce(def.name + " removed. " + pstate.items.length + " on the board.");
      }
      if (drag.moved && !drag.existing) { justDragged = true; setTimeout(() => { justDragged = false; }, 60); }
      drag = null;
    };
    // browser stole the gesture (scroll, system swipe…) — restore rather than orphan the item
    function onDragCancel() {
      window.removeEventListener("pointermove", onDragMove);
      window.removeEventListener("pointerup", onDragUp);
      if (!drag) return;
      drag.ghost.remove();
      if (drag.existing) { drag.existing.el.style.display = ""; positionItem(drag.existing); }
      drag = null;
    }
    function startDrag(type, ev, existing) {
      ev.preventDefault();
      const def = ATT[type], c = cell();
      const ghost = makeAtt(type, true);
      ghost.classList.add("peg-att--ghost");
      ghost.style.width = (def.w * c.w) + "px";
      ghost.style.height = (def.h * c.h) + "px";
      document.body.appendChild(ghost);
      drag = { type, def, ghost, existing: existing || null, moved: false };
      moveGhost(ev);
      window.addEventListener("pointermove", onDragMove);
      window.addEventListener("pointerup", onDragUp, { once: true });
      window.addEventListener("pointercancel", onDragCancel, { once: true });
    }

    // build tray chips
    TRAY_ORDER.forEach((type) => {
      const def = ATT[type];
      const chip = document.createElement("button");
      chip.type = "button"; chip.className = "peg-chip"; chip.dataset.type = type;
      chip.setAttribute("aria-label", "Add " + def.name + " to board (placed automatically, then use arrow keys to position)");
      chip.innerHTML = '<span class="peg-chip__ic">' + ICONS[type] + "</span><span>" + def.name + "</span>";
      chip.addEventListener("pointerdown", (ev) => startDrag(type, ev, null));
      chip.addEventListener("click", () => {
        if (justDragged) { justDragged = false; return; }
        const spot = findFree(def);
        if (!spot) { announce("No room for a " + def.name + " — remove an item or choose a larger board."); return; }
        place(type, spot.col, spot.row, true);
        announce(def.name + " added at column " + (spot.col + 1) + ", row " + (spot.row + 1) + ". Use arrow keys to move it, Delete to remove. " + pstate.items.length + " on the board.");
      });
      tray.appendChild(chip);
    });

    // colour chips
    PEGC.forEach((col, idx) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "colorchip"; b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", idx === 0 ? "true" : "false");
      b.setAttribute("aria-label", "Board colour: " + col.name);
      b.tabIndex = idx === 0 ? 0 : -1;
      b.style.setProperty("--c", col.c); b.dataset.key = col.key;
      b.appendChild(document.createElement("span"));
      colorsBox.appendChild(b);
    });
    const pickColor = radioGroup(colorsBox, (el) => { pstate.color = el.dataset.key; pegBoard.setAttribute("data-color", el.dataset.key); });
    $$(".colorchip", colorsBox).forEach((b) => b.addEventListener("click", () => pickColor(b, false)));

    // size segmented
    const setSize = (key) => {
      pstate.size = key; COLS = SIZES[key].cols; ROWS = SIZES[key].rows;
      sizeLabel.textContent = SIZES[key].cm;
      buildHoles();
      requestAnimationFrame(repositionAll);
    };
    const pickSize = radioGroup(sizesBox, (el) => setSize(el.dataset.size));
    $$('[role="radio"]', sizesBox).forEach((b) => b.addEventListener("click", () => pickSize(b, false)));

    // clear
    clearBtn.addEventListener("click", () => {
      pstate.items.slice().forEach(removeItem);
      announce("Board cleared. Board is empty.");
    });

    // request handoff
    requestBtn.addEventListener("click", () => {
      const colName = (PEGC.find((c) => c.key === pstate.color) || {}).name || pstate.color;
      let list = "none yet";
      if (pstate.items.length) {
        const tally = {};
        pstate.items.forEach((it) => { tally[it.type] = (tally[it.type] || 0) + 1; });
        list = TRAY_ORDER.filter((t) => tally[t]).map((t) => tally[t] + "× " + ATT[t].name).join(", ");
      }
      const spec =
        "Custom pegboard enquiry\n" +
        "• Board colour: " + colName + "\n" +
        "• Board size: " + SIZES[pstate.size].cm + "\n" +
        "• Attachments: " + list;
      const type = $("#f-type");
      if (type) type.value = "pegboard";
      const msg = $("#f-msg");
      if (msg) { msg.value = spec; msg.dispatchEvent(new Event("input", { bubbles: true })); }
      if (card && card.classList.contains("is-sent")) { card.classList.remove("is-sent"); if (success) success.classList.remove("show"); }
      if (formStatus) formStatus.textContent = "Your pegboard layout was added to the Project details field below — add your name and contact details, then send the enquiry.";
      const contact = $("#contact");
      if (contact) contact.scrollIntoView(scrollOpts);
      const name = $("#f-name");
      if (name) setTimeout(() => name.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
    });

    // init
    buildHoles();
    updateCount();
    let pegRz;
    window.addEventListener("resize", () => { clearTimeout(pegRz); pegRz = setTimeout(repositionAll, 150); });
  }
})();
