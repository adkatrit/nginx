(() => {
  "use strict";

  const $ = (id) => /** @type {HTMLElement|null} */ (document.getElementById(id));

  const app = $("app");
  const playerWindow = $("playerWindow");
  const playlistWindow = $("playlistWindow");
  const togglePlaylistBtn = $("togglePlaylistBtn");
  const themeSelect = /** @type {HTMLSelectElement|null} */ ($("themeSelect"));
  const vizSelect = /** @type {HTMLSelectElement|null} */ ($("vizSelect"));

  const prevBtn = $("prevBtn");
  const playBtn = $("playBtn");
  const pauseBtn = $("pauseBtn");
  const stopBtn = $("stopBtn");
  const nextBtn = $("nextBtn");
  const shuffleBtn = $("shuffleBtn");
  const repeatBtn = $("repeatBtn");

  const trackText = $("trackText");
  const trackTextDup = $("trackTextDup");
  const marquee = $("marquee");
  const marqueeInner = $("marqueeInner");
  const statusText = $("statusText");
  const timeText = $("timeText");
  const hintText = $("hintText");

  const seek = /** @type {HTMLInputElement|null} */ ($("seek"));
  const volume = /** @type {HTMLInputElement|null} */ ($("volume"));

  const playlistEl = $("playlist");
  const filterInput = /** @type {HTMLInputElement|null} */ ($("filterInput"));
  const addBtn = $("addBtn");
  const clearBtn = $("clearBtn");
  const filePicker = /** @type {HTMLInputElement|null} */ ($("filePicker"));
  const dropzone = $("dropzone");

  const bgVizCanvas = /** @type {HTMLCanvasElement|null} */ ($("bgViz"));
  const vizWrap = $("vizWrap");
  const viz2dCanvas = /** @type {HTMLCanvasElement|null} */ ($("viz2d"));

  if (
    !app ||
    !playerWindow ||
    !playlistWindow ||
    !togglePlaylistBtn ||
    !themeSelect ||
    !vizSelect ||
    !prevBtn ||
    !playBtn ||
    !pauseBtn ||
    !stopBtn ||
    !nextBtn ||
    !shuffleBtn ||
    !repeatBtn ||
    !trackText ||
    !trackTextDup ||
    !marquee ||
    !marqueeInner ||
    !statusText ||
    !timeText ||
    !hintText ||
    !seek ||
    !volume ||
    !playlistEl ||
    !filterInput ||
    !addBtn ||
    !clearBtn ||
    !filePicker ||
    !dropzone ||
    !vizWrap ||
    !viz2dCanvas
  ) {
    // If the DOM changed or IDs don't match, fail silently.
    return;
  }

  /** @typedef {{ title?: string; artist?: string; url: string; coverUrl?: string; _objectUrl?: string; }} Track */

  /** @type {Track[]} */
  const hostedTracks = (Array.isArray(window.TRACKS) ? window.TRACKS : [])
    .filter((t) => t && typeof t.url === "string" && t.url.trim().length > 0)
    .map((t) => ({
      title: typeof t.title === "string" ? t.title : undefined,
      artist: typeof t.artist === "string" ? t.artist : undefined,
      url: t.url,
      coverUrl: typeof t.coverUrl === "string" ? t.coverUrl : undefined,
    }));

  /** @type {Track[]} */
  let tracks = hostedTracks.slice();
  let currentIndex = tracks.length ? 0 : -1;

  /** @type {number[]} */
  let visibleIndices = [];

  let shuffle = false;
  /** @type {"off"|"all"|"one"} */
  let repeatMode = "off";

  let isSeeking = false;
  let playlistVisible = true;

  // ---- Audio ----
  const domAudio = /** @type {HTMLAudioElement|null} */ (document.getElementById("playerAudio"));
  const audio = domAudio || new Audio();
  audio.preload = "metadata";
  audio.crossOrigin = "anonymous";

  // iOS tends to suspend WebAudio when backgrounded/locked, which can cut audio
  // if we route the media element through an AudioContext for visualization.
  // Prefer native playback on iOS; the visualizer will gracefully fall back.
  const isIOS = (() => {
    const ua = navigator.userAgent || "";
    const iDevice = /iPad|iPhone|iPod/i.test(ua);
    // iPadOS reports as Mac; maxTouchPoints helps distinguish.
    const iPadOS = navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
    return iDevice || iPadOS;
  })();

  // Seeking in large files typically requires HTTP Range support from the server.
  let rangeSupportChecked = false;
  let rangeSupported = true;

  async function checkRangeSupportOnce() {
    if (rangeSupportChecked) return rangeSupported;
    rangeSupportChecked = true;

    const src = audio.currentSrc || audio.src || "";
    if (!src || src.startsWith("blob:") || src.startsWith("data:") || !/^https?:/i.test(src)) {
      rangeSupported = true;
      return true;
    }

    try {
      const res = await fetch(src, { headers: { Range: "bytes=0-0" } });
      rangeSupported = res.status === 206 || !!res.headers.get("content-range");
    } catch {
      // If we can't probe (offline/CORS/etc), don't block seeking.
      rangeSupported = true;
    }

    if (!rangeSupported) {
      setHint(
        `Seeking may be limited with this server. Run <code>python3 ./serve.py</code> (supports Range requests) or <code>npx serve</code>.`,
        "warn",
      );
    }

    return rangeSupported;
  }

  // ---- Visualizer ----
  /** @type {AudioContext | null} */
  let audioCtx = null;
  /** @type {AnalyserNode | null} */
  let analyser = null;
  /** @type {Uint8Array | null} */
  let freqData = null;
  /** @type {Uint8Array | null} */
  let timeData = null;
  /** @type {CanvasRenderingContext2D | null} */
  let viz2dCtx = null;
  let vizRaf = 0;
  let vizLastDrawMs = 0;

  // ---- Three.js visualizer (optional; falls back to 2D) ----
  const THREE_CDN = "https://unpkg.com/three/build/three.module.js";
  /** @type {any | null} */
  let three = null;
  let threeReady = false;
  /** @type {Promise<boolean> | null} */
  let threeInitPromise = null;
  /** @type {any | null} */
  let threeRenderer = null;
  /** @type {any | null} */
  let threeScene = null;
  /** @type {any | null} */
  let threeCamera = null;
  /** @type {any | null} */
  let threeGroup = null;
  /** @type {any | null} */
  let threeCore = null;
  /** @type {any | null} */
  let threeStars = null;
  /** @type {Record<string, { group: any; update: Function }> | null} */
  let threeModes = null;
  /** @type {Array<{ kind: "std" | "basic" | "points" | "line"; mat: any; emissiveScale?: number }>} */
  let threeThemeTargets = [];

  let threeLastNowMs = 0;
  let threeW = 0;
  let threeH = 0;

  const vizPalette = {
    accent: "#3cff6b",
    accentDim: "#16b64f",
    bg: "#050505",
  };

  /** @type {"orbit" | "grid" | "nebula" | "scope" | "tunnel" | "off"} */
  let bgVizMode = "grid";

  const prefersReducedMotion = (() => {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  })();

  function canUseWebAudioViz() {
    if (prefersReducedMotion) return false;
    if (isIOS) return false;
    return true;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getCssVar(name, fallback = "") {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function refreshVizPalette() {
    vizPalette.accent = getCssVar("--wa-accent", vizPalette.accent);
    vizPalette.accentDim = getCssVar("--wa-accent-dim", vizPalette.accentDim);
  }

  function normalizeTheme(value) {
    return value === "midnight" || value === "neo" || value === "winamp41" ? value : "midnight";
  }

  const THEME_STORAGE_KEY = "mysongs-theme";
  const LEGACY_THEME_STORAGE_KEY = "webamp-theme";

  function applyTheme(theme, { persist = false } = {}) {
    const t = normalizeTheme(theme);
    document.documentElement.dataset.theme = t;
    themeSelect.value = t;
    if (persist) localStorage.setItem(THEME_STORAGE_KEY, t);
    refreshVizPalette();
    refreshThreeTheme();
  }

  applyTheme(
    normalizeTheme(
      localStorage.getItem(THEME_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_THEME_STORAGE_KEY) ||
        document.documentElement.dataset.theme ||
        "midnight",
    ),
  );
  themeSelect.addEventListener("change", () => applyTheme(themeSelect.value, { persist: true }));

  function normalizeVizMode(value) {
    return value === "orbit" || value === "grid" || value === "nebula" || value === "scope" || value === "tunnel" || value === "off"
      ? value
      : "grid";
  }

  const VIZ_STORAGE_KEY = "mysongs-viz-mode";

  function applyVizMode(mode, { persist = false } = {}) {
    const m = normalizeVizMode(mode);
    bgVizMode = m;
    vizSelect.value = m;
    if (persist) localStorage.setItem(VIZ_STORAGE_KEY, m);

    // If 3D is ready, immediately swap modes.
    if (threeReady) syncThreeVizMode();

    // If user turns it off, hide the background canvas even if 3D is ready.
    if (bgVizCanvas) bgVizCanvas.classList.toggle("is-on", threeReady && bgVizMode !== "off");
  }

  applyVizMode(normalizeVizMode(localStorage.getItem(VIZ_STORAGE_KEY) || bgVizMode));
  vizSelect.addEventListener("change", () => applyVizMode(vizSelect.value, { persist: true }));

  // Start in 2D mode until the optional 3D visualizer loads.
  vizWrap.classList.add("is-fallback");

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function deriveTitleFromUrl(url) {
    try {
      const clean = url.split("?")[0].split("#")[0];
      const last = clean.split("/").pop() || clean;
      const noExt = last.replace(/\.[a-z0-9]+$/i, "");
      return decodeURIComponent(noExt);
    } catch {
      return url;
    }
  }

  function trackLabel(t) {
    const title = (t.title || "").trim() || deriveTitleFromUrl(t.url);
    const artist = (t.artist || "").trim();
    return artist ? `${artist} - ${title}` : title;
  }

  function setStatus(text) {
    statusText.textContent = text;
    // Update lamp animation state
    const lamps = document.querySelectorAll(".wa-lamp");
    lamps.forEach((lamp) => lamp.classList.toggle("is-playing", text === "PLAY"));
  }

  /** @type {HTMLElement | null} */
  const lcdEl = document.querySelector(".wa-lcd");

  function setLoadingState(loading) {
    if (lcdEl) lcdEl.classList.toggle("is-loading", loading);
  }

  function setHint(text, kind = "info") {
    hintText.innerHTML = text;
    hintText.style.color = kind === "warn" ? "var(--wa-warn)" : "rgba(255, 255, 255, 0.72)";
  }

  // ---- Accessibility: Screen reader announcements ----
  const ariaStatus = $("ariaStatus");

  function announceToScreenReader(message) {
    if (!ariaStatus) return;
    ariaStatus.textContent = message;
    setTimeout(() => { ariaStatus.textContent = ""; }, 1500);
  }

  // ---- Error state handling ----
  function showError(title, message, actionLabel, action) {
    let errorEl = playlistWindow.querySelector(".wa-error");
    if (!errorEl) {
      errorEl = document.createElement("div");
      errorEl.className = "wa-error";
      errorEl.innerHTML = `
        <div class="wa-error__title"></div>
        <div class="wa-error__text"></div>
        <button class="wa-error__action" type="button"></button>
      `;
      playlistWindow.querySelector(".wa-playlist__content").appendChild(errorEl);
    }

    errorEl.querySelector(".wa-error__title").textContent = title;
    errorEl.querySelector(".wa-error__text").textContent = message;
    const btn = /** @type {HTMLButtonElement} */ (errorEl.querySelector(".wa-error__action"));
    btn.textContent = actionLabel || "Retry";
    btn.onclick = () => {
      errorEl.classList.remove("is-visible");
      if (action) action();
    };

    errorEl.classList.add("is-visible");
    announceToScreenReader(`Error: ${title}. ${message}`);
  }

  function hideError() {
    const errorEl = playlistWindow.querySelector(".wa-error");
    if (errorEl) errorEl.classList.remove("is-visible");
  }

  function setTrackDisplay(text) {
    trackText.textContent = text;
    trackTextDup.textContent = text;

    // Enable marquee only if it overflows.
    requestAnimationFrame(() => {
      marquee.classList.remove("wa-marquee--scroll");
      marquee.style.removeProperty("--wa-marquee-duration");
      const container = marquee.getBoundingClientRect().width;
      const inner = marqueeInner.scrollWidth;
      if (inner <= container + 2) return;

      // duration scales with content length; cap to keep it readable
      const pxPerSecond = 38;
      const duration = clamp(inner / pxPerSecond, 8, 22);
      marquee.style.setProperty("--wa-marquee-duration", `${duration}s`);
      marquee.classList.add("wa-marquee--scroll");
    });
  }

  function updateTimeUi() {
    const dur = audio.duration;
    const cur = audio.currentTime;
    timeText.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;

    if (!isSeeking && Number.isFinite(dur) && dur > 0) {
      const progress = (cur / dur) * 100;
      seek.value = String(Math.round((cur / dur) * 1000));
      seek.style.setProperty("--progress", `${progress}%`);
    }
  }

  function updateButtonsUi() {
    shuffleBtn.setAttribute("aria-pressed", String(shuffle));

    if (repeatMode === "off") {
      repeatBtn.setAttribute("aria-pressed", "false");
      repeatBtn.textContent = "REP";
    } else if (repeatMode === "all") {
      repeatBtn.setAttribute("aria-pressed", "true");
      repeatBtn.textContent = "REP";
    } else {
      repeatBtn.setAttribute("aria-pressed", "true");
      repeatBtn.textContent = "REP1";
    }
  }

  function updatePlaylistUi() {
    const q = (filterInput.value || "").trim().toLowerCase();
    const items = [];
    visibleIndices = [];

    for (let i = 0; i < tracks.length; i += 1) {
      const t = tracks[i];
      const title = (t.title || deriveTitleFromUrl(t.url)).toLowerCase();
      const artist = (t.artist || "").toLowerCase();
      const combined = `${artist} ${title}`.trim();
      if (q && !combined.includes(q)) continue;
      visibleIndices.push(i);

      const li = document.createElement("li");
      li.className = "wa-item";
      li.dataset.index = String(i);
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");
      li.setAttribute("aria-current", i === currentIndex ? "true" : "false");

      const idx = document.createElement("div");
      idx.className = "wa-item__idx";
      idx.textContent = String(i + 1).padStart(2, "0");

      const cover = document.createElement("div");
      cover.className = "wa-cover";
      cover.setAttribute("aria-hidden", "true");
      if (t.coverUrl) {
        const img = document.createElement("img");
        img.className = "wa-cover__img";
        img.alt = "";
        img.src = t.coverUrl;
        cover.appendChild(img);
      }

      const main = document.createElement("div");

      const titleEl = document.createElement("div");
      titleEl.className = "wa-item__title";
      titleEl.textContent = (t.title || "").trim() || deriveTitleFromUrl(t.url);

      const metaEl = document.createElement("div");
      metaEl.className = "wa-item__meta";
      metaEl.textContent = (t.artist || "").trim() || "—";

      main.appendChild(titleEl);
      main.appendChild(metaEl);

      li.appendChild(idx);
      li.appendChild(cover);
      li.appendChild(main);

      // Enable drag reorder
      li.draggable = true;

      items.push(li);
    }

    playlistEl.replaceChildren(...items);
  }

  // ---- Playlist drag reorder ----
  function initPlaylistDragReorder() {
    /** @type {HTMLElement | null} */
    let draggedItem = null;
    let draggedIndex = -1;
    /** @type {HTMLElement | null} */
    let placeholder = null;

    playlistEl.addEventListener("dragstart", (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      const item = target.closest(".wa-item");
      if (!item) return;

      draggedItem = /** @type {HTMLElement} */ (item);
      draggedIndex = Number(item.dataset.index);
      item.classList.add("is-dragging");

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(draggedIndex));

      // Create placeholder
      placeholder = document.createElement("li");
      placeholder.className = "wa-item wa-item--placeholder";
      placeholder.style.height = `${item.offsetHeight}px`;
    });

    playlistEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!draggedItem || !placeholder) return;
      e.dataTransfer.dropEffect = "move";

      const afterElement = getDragAfterElement(e.clientY);
      if (afterElement) {
        playlistEl.insertBefore(placeholder, afterElement);
      } else {
        playlistEl.appendChild(placeholder);
      }
    });

    playlistEl.addEventListener("dragend", () => {
      if (draggedItem) {
        draggedItem.classList.remove("is-dragging");
      }
      if (placeholder && placeholder.parentNode) {
        placeholder.remove();
      }
      draggedItem = null;
      placeholder = null;
    });

    playlistEl.addEventListener("drop", (e) => {
      e.preventDefault();
      if (draggedIndex < 0 || !placeholder) return;

      // Find new position
      const items = [...playlistEl.querySelectorAll(".wa-item:not(.is-dragging):not(.wa-item--placeholder)")];
      const placeholderIndex = items.indexOf(placeholder.nextElementSibling?.closest(".wa-item"));
      let newIndex = placeholderIndex === -1 ? tracks.length - 1 : placeholderIndex;

      // Adjust for the dragged item's original position
      if (draggedIndex < newIndex) {
        newIndex = Math.max(0, newIndex);
      }

      if (draggedIndex !== newIndex && draggedIndex >= 0 && draggedIndex < tracks.length) {
        // Reorder tracks array
        const [removed] = tracks.splice(draggedIndex, 1);
        tracks.splice(newIndex, 0, removed);

        // Update currentIndex if affected
        if (currentIndex === draggedIndex) {
          currentIndex = newIndex;
        } else if (draggedIndex < currentIndex && newIndex >= currentIndex) {
          currentIndex--;
        } else if (draggedIndex > currentIndex && newIndex <= currentIndex) {
          currentIndex++;
        }

        updatePlaylistUi();
      }
    });

    function getDragAfterElement(y) {
      const items = [...playlistEl.querySelectorAll(".wa-item:not(.is-dragging):not(.wa-item--placeholder)")];

      return items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    }
  }

  initPlaylistDragReorder();

  function ensureAudioGraph() {
    if (!canUseWebAudioViz()) return;
    if (audioCtx && analyser && freqData && timeData) return;

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
      const source = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      freqData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);
    } catch (err) {
      // Some browsers may block WebAudio wiring in certain contexts.
      audioCtx = null;
      analyser = null;
      freqData = null;
      timeData = null;
    }
  }

  function ensureViz2dContext() {
    if (viz2dCtx) return true;
    viz2dCtx = viz2dCanvas.getContext("2d");
    return !!viz2dCtx;
  }

  function resizeViz2dCanvas() {
    if (!viz2dCanvas || !viz2dCtx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(viz2dCanvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(viz2dCanvas.clientHeight * dpr));
    if (viz2dCanvas.width === w && viz2dCanvas.height === h) return;
    viz2dCanvas.width = w;
    viz2dCanvas.height = h;
  }

  function drawViz2d(nowMs) {
    if (!viz2dCtx || !viz2dCanvas) return;
    if (!analyser || !freqData) {
      // idle fallback
      viz2dCtx.clearRect(0, 0, viz2dCanvas.width, viz2dCanvas.height);
      viz2dCtx.fillStyle = vizPalette.bg;
      viz2dCtx.fillRect(0, 0, viz2dCanvas.width, viz2dCanvas.height);
      return;
    }

    // Throttle a bit; we don't need 60fps for tiny canvas.
    if (nowMs - vizLastDrawMs < 33) return;
    vizLastDrawMs = nowMs;

    analyser.getByteFrequencyData(freqData);
    const w = viz2dCanvas.width;
    const h = viz2dCanvas.height;
    viz2dCtx.clearRect(0, 0, w, h);

    // Background
    viz2dCtx.fillStyle = vizPalette.bg;
    viz2dCtx.fillRect(0, 0, w, h);

    const bars = 24;
    const gap = Math.max(1, Math.floor(w * 0.006));
    const barW = Math.max(2, Math.floor((w - gap * (bars + 1)) / bars));

    // Sample the low-mid range; looks more "Winamp-ish"
    const startBin = Math.floor(freqData.length * 0.06);
    const endBin = Math.floor(freqData.length * 0.6);
    const span = Math.max(1, endBin - startBin);

    for (let i = 0; i < bars; i += 1) {
      const bin = startBin + Math.floor((i / (bars - 1)) * span);
      const v = freqData[bin] / 255; // 0..1
      const barH = Math.max(1, Math.floor(v * (h - 4)));
      const x = gap + i * (barW + gap);
      const y = h - barH - 2;

      const grad = viz2dCtx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, vizPalette.accent);
      grad.addColorStop(1, vizPalette.accentDim);
      viz2dCtx.fillStyle = grad;
      viz2dCtx.fillRect(x, y, barW, barH);
    }
  }

  function refreshThreeTheme() {
    if (!threeReady || !three) return;
    const accent = getCssVar("--wa-accent", vizPalette.accent);
    const { Color } = three;
    const c = new Color(accent);

    for (const target of threeThemeTargets) {
      const mat = target?.mat;
      if (!mat || !mat.color) continue;
      mat.color.copy(c);

      if (target.kind === "std" && mat.emissive) {
        const s = typeof target.emissiveScale === "number" ? target.emissiveScale : 0.35;
        mat.emissive.copy(c).multiplyScalar(s);
      }
    }
  }

  function syncThreeVizMode() {
    if (!threeReady || !threeModes || !bgVizCanvas) return;

    const on = bgVizMode !== "off";
    bgVizCanvas.classList.toggle("is-on", on);

    for (const [mode, cfg] of Object.entries(threeModes)) {
      if (!cfg?.group) continue;
      cfg.group.visible = on && mode === bgVizMode;
    }

    if (threeCore) {
      const coreOn = bgVizMode === "orbit" || bgVizMode === "tunnel";
      threeCore.visible = on && coreOn;
    }

    if (threeStars) {
      threeStars.visible = on;
    }

    resizeThreeRenderer();
  }

  function resizeThreeRenderer() {
    if (!threeReady || !threeRenderer || !threeCamera || !bgVizCanvas) return;
    const w = Math.max(1, Math.floor(bgVizCanvas.clientWidth));
    const h = Math.max(1, Math.floor(bgVizCanvas.clientHeight));
    if (w === threeW && h === threeH) return;
    threeW = w;
    threeH = h;
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    threeRenderer.setSize(w, h, false);
    threeCamera.aspect = w / h;
    threeCamera.updateProjectionMatrix();
  }

  function drawVizThree(nowMs) {
    if (!threeReady || !threeRenderer || !threeScene || !threeCamera || !threeGroup || !threeModes) return;
    if (bgVizMode === "off") return;

    const t = nowMs * 0.001;
    const dt = threeLastNowMs ? clamp((nowMs - threeLastNowMs) * 0.001, 0, 0.05) : 0.016;
    threeLastNowMs = nowMs;

    const avgBins = (start, end) => {
      if (!freqData || !freqData.length) return 0;
      const s = clamp(Math.floor(start), 0, freqData.length);
      const e = clamp(Math.floor(end), 0, freqData.length);
      const n = Math.max(1, e - s);
      let sum = 0;
      for (let i = s; i < e; i += 1) sum += freqData[i] || 0;
      return sum / (n * 255);
    };

    let energy = 0;
    let bass = 0;
    let mid = 0;
    let treble = 0;

    if (analyser && freqData) {
      analyser.getByteFrequencyData(freqData);
      energy = avgBins(0, freqData.length);
      bass = avgBins(0, Math.max(6, Math.floor(freqData.length * 0.08)));
      mid = avgBins(Math.floor(freqData.length * 0.12), Math.floor(freqData.length * 0.45));
      treble = avgBins(Math.floor(freqData.length * 0.55), Math.floor(freqData.length * 0.92));
    }

    if (threeStars) {
      threeStars.rotation.y = -t * 0.03;
      threeStars.rotation.x = -0.08;
    }

    const modeKey = bgVizMode in threeModes ? bgVizMode : "grid";
    const mode = /** @type {any} */ (threeModes[modeKey]);
    if (mode?.update) {
      mode.update({
        nowMs,
        t,
        dt,
        energy,
        bass,
        mid,
        treble,
        analyser,
        freqData,
        timeData,
      });
    }

    threeRenderer.render(threeScene, threeCamera);
  }

  async function ensureThreeViz() {
    if (!canUseWebAudioViz()) return false;
    if (!bgVizCanvas) return false;
    if (threeReady) return true;
    if (threeInitPromise) return threeInitPromise;

    threeInitPromise = (async () => {
      try {
        const mod = await import(THREE_CDN);
        three = mod;

        const {
          Scene,
          PerspectiveCamera,
          WebGLRenderer,
          AmbientLight,
          DirectionalLight,
          BoxGeometry,
          PlaneGeometry,
          TorusKnotGeometry,
          MeshStandardMaterial,
          MeshBasicMaterial,
          Mesh,
          Group,
          Color,
          BufferGeometry,
          Float32BufferAttribute,
          Points,
          PointsMaterial,
          LineLoop,
          LineBasicMaterial,
          AdditiveBlending,
        } = mod;

        threeRenderer = new WebGLRenderer({
          canvas: bgVizCanvas,
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        });
        threeRenderer.setClearAlpha(0);
        threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

        // three.js r152+ uses outputColorSpace.
        try {
          if (mod.SRGBColorSpace && "outputColorSpace" in threeRenderer) {
            threeRenderer.outputColorSpace = mod.SRGBColorSpace;
          }
        } catch {
          // ignore
        }

        threeScene = new Scene();
        threeCamera = new PerspectiveCamera(60, 1, 0.1, 120);
        threeCamera.position.set(0, 1.2, 9.5);
        threeCamera.lookAt(0, 0.55, 0);

        const ambient = new AmbientLight(0xffffff, 0.55);
        const dir = new DirectionalLight(0xffffff, 0.85);
        dir.position.set(4, 5, 3);
        const dir2 = new DirectionalLight(0xffffff, 0.35);
        dir2.position.set(-4, 2, -5);
        threeScene.add(ambient, dir, dir2);

        threeGroup = new Group();
        threeScene.add(threeGroup);

        const accent = new Color(getCssVar("--wa-accent", vizPalette.accent));
        threeThemeTargets = [];
        threeModes = null;
        threeLastNowMs = 0;

        // Center “core” (wireframe knot) that pulses with bass.
        const coreGeom = new TorusKnotGeometry(1.05, 0.32, 160, 22);
        const coreMat = new MeshStandardMaterial({
          color: accent.clone(),
          emissive: accent.clone().multiplyScalar(0.22),
          roughness: 0.2,
          metalness: 0.25,
          transparent: true,
          opacity: 0.28,
          wireframe: true,
        });
        threeCore = new Mesh(coreGeom, coreMat);
        threeCore.position.y = 0.65;
        threeGroup.add(threeCore);
        threeThemeTargets.push({ kind: "std", mat: coreMat, emissiveScale: 0.22 });

        // Sparse additive “stars” to make it feel more like a background demo.
        const starCount = 1100;
        const positions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i += 1) {
          const idx = i * 3;
          const r = 6 + Math.random() * 10;
          const theta = Math.random() * Math.PI * 2;
          const u = Math.random() * 2 - 1; // -1..1
          const phi = Math.acos(u);
          positions[idx + 0] = Math.cos(theta) * Math.sin(phi) * r;
          positions[idx + 1] = Math.cos(phi) * r * 0.65;
          positions[idx + 2] = Math.sin(theta) * Math.sin(phi) * r;
        }
        const starGeom = new BufferGeometry();
        starGeom.setAttribute("position", new Float32BufferAttribute(positions, 3));
        const starMat = new PointsMaterial({
          color: accent.clone(),
          size: 0.035,
          transparent: true,
          opacity: 0.38,
          blending: AdditiveBlending,
          depthWrite: false,
        });
        threeStars = new Points(starGeom, starMat);
        threeScene.add(threeStars);
        threeThemeTargets.push({ kind: "points", mat: starMat });

        const freqBins = (freqData && freqData.length) || 128;
        const clamp01 = (n) => clamp(n, 0, 1);

        // --- Mode: Orbit Bars (ring equalizer) ---
        const orbitGroup = new Group();
        threeGroup.add(orbitGroup);

        const orbitGeom = new BoxGeometry(0.18, 1, 0.18);
        const orbitMat = new MeshStandardMaterial({
          color: accent.clone(),
          emissive: accent.clone().multiplyScalar(0.35),
          roughness: 0.35,
          metalness: 0.18,
        });
        threeThemeTargets.push({ kind: "std", mat: orbitMat, emissiveScale: 0.35 });

        const orbitBars = [];
        const orbitCount = 96;
        const orbitRadius = 3.45;
        for (let i = 0; i < orbitCount; i += 1) {
          const bar = new Mesh(orbitGeom, orbitMat);
          const a = (i / orbitCount) * Math.PI * 2;
          bar.position.set(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius);
          bar.rotation.y = -a;
          bar.scale.y = 0.12;
          bar.position.y = bar.scale.y / 2 - 0.06;
          orbitGroup.add(bar);
          orbitBars.push(bar);
        }

        const orbitUpdate = ({ t, bass, freqData: f }) => {
          orbitGroup.rotation.y = t * 0.35;
          orbitGroup.rotation.x = -0.35;

          if (threeCore && threeCore.visible) {
            const pulse = 0.86 + bass * 0.95;
            threeCore.scale.setScalar(pulse);
            threeCore.rotation.y = t * 0.85;
            threeCore.rotation.x = 0.55 + t * 0.22;
          }

          if (!f || !f.length) return;
          const startBin = Math.floor(f.length * 0.02);
          const endBin = Math.floor(f.length * 0.82);
          const span = Math.max(1, endBin - startBin);

          for (let i = 0; i < orbitBars.length; i += 1) {
            const bar = orbitBars[i];
            const bin = startBin + Math.floor((i / Math.max(1, orbitBars.length - 1)) * span);
            const v = (f[bin] || 0) / 255;
            const shaped = Math.pow(v, 1.65);
            const s = 0.12 + shaped * 4.2;
            bar.scale.y = s;
            bar.position.y = s / 2 - 0.06;
          }
        };

        // --- Mode: Wave Grid (wireframe plane) ---
        const gridGroup = new Group();
        threeGroup.add(gridGroup);
        const gridGeom = new PlaneGeometry(9.6, 9.6, 64, 64);
        gridGeom.rotateX(-Math.PI / 2);
        gridGeom.translate(0, -1.0, 0);
        const gridMat = new MeshBasicMaterial({
          color: accent.clone(),
          transparent: true,
          opacity: 0.22,
          wireframe: true,
        });
        threeThemeTargets.push({ kind: "basic", mat: gridMat });
        const gridMesh = new Mesh(gridGeom, gridMat);
        gridGroup.add(gridMesh);

        const gridPos = /** @type {any} */ (gridGeom.getAttribute("position"));
        const gridBase = new Float32Array(gridPos.array);
        const gridBins = new Uint16Array(gridPos.count);
        const gridW = 9.6;
        const gridStart = Math.floor(freqBins * 0.02);
        const gridSpan = Math.max(1, Math.floor(freqBins * 0.7) - gridStart);
        for (let i = 0; i < gridPos.count; i += 1) {
          const x = gridBase[i * 3 + 0];
          const u = clamp01((x + gridW / 2) / gridW);
          gridBins[i] = gridStart + Math.floor(u * gridSpan);
        }

        const gridUpdate = ({ t, freqData: f, energy }) => {
          gridGroup.rotation.y = t * 0.12;
          if (!f || !f.length) return;

          for (let i = 0; i < gridPos.count; i += 1) {
            const idx = i * 3;
            const x = gridBase[idx + 0];
            const z = gridBase[idx + 2];
            const dist = Math.sqrt(x * x + z * z) / (gridW * 0.5);
            const fall = Math.pow(clamp01(1 - dist), 1.35);

            const bin = gridBins[i];
            const v = (f[bin] || 0) / 255;
            const shaped = Math.pow(v, 1.85);
            const wave = Math.sin(t * 1.25 + x * 0.8 + z * 0.75) * (0.18 + energy * 0.22);
            gridPos.array[idx + 1] = gridBase[idx + 1] + (shaped * 1.6 + wave) * fall;
          }
          gridPos.needsUpdate = true;
        };

        // --- Mode: Particle Nebula (points driven by spectrum) ---
        const nebulaGroup = new Group();
        threeGroup.add(nebulaGroup);

        const nebulaCount = 900;
        const nebulaPosArr = new Float32Array(nebulaCount * 3);
        const nebulaDirArr = new Float32Array(nebulaCount * 3);
        const nebulaRadArr = new Float32Array(nebulaCount);
        const nebulaBinArr = new Uint16Array(nebulaCount);

        for (let i = 0; i < nebulaCount; i += 1) {
          let x = Math.random() * 2 - 1;
          let y = Math.random() * 2 - 1;
          let z = Math.random() * 2 - 1;
          const l = Math.max(1e-6, Math.hypot(x, y, z));
          x /= l;
          y /= l;
          z /= l;
          const r = 0.8 + Math.random() * 5.4;
          const idx = i * 3;
          nebulaDirArr[idx + 0] = x;
          nebulaDirArr[idx + 1] = y * 0.85;
          nebulaDirArr[idx + 2] = z;
          nebulaRadArr[i] = r;
          nebulaBinArr[i] = Math.floor(Math.random() * freqBins);
          nebulaPosArr[idx + 0] = x * r;
          nebulaPosArr[idx + 1] = y * r * 0.85;
          nebulaPosArr[idx + 2] = z * r;
        }

        const nebulaGeom = new BufferGeometry();
        nebulaGeom.setAttribute("position", new Float32BufferAttribute(nebulaPosArr, 3));
        const nebulaMat = new PointsMaterial({
          color: accent.clone(),
          size: 0.06,
          transparent: true,
          opacity: 0.62,
          blending: AdditiveBlending,
          depthWrite: false,
        });
        threeThemeTargets.push({ kind: "points", mat: nebulaMat });
        const nebula = new Points(nebulaGeom, nebulaMat);
        nebulaGroup.add(nebula);

        const nebulaPosAttr = /** @type {any} */ (nebulaGeom.getAttribute("position"));

        const nebulaUpdate = ({ t, freqData: f, energy }) => {
          nebulaGroup.rotation.y = t * 0.22;
          nebulaGroup.rotation.x = -0.12;
          if (!f || !f.length) return;

          for (let i = 0; i < nebulaCount; i += 1) {
            const amp = (f[nebulaBinArr[i]] || 0) / 255;
            const shaped = Math.pow(amp, 1.6);
            const r = nebulaRadArr[i] * (0.65 + shaped * 1.8);
            const idx = i * 3;
            nebulaPosAttr.array[idx + 0] = nebulaDirArr[idx + 0] * r;
            nebulaPosAttr.array[idx + 1] = nebulaDirArr[idx + 1] * r;
            nebulaPosAttr.array[idx + 2] = nebulaDirArr[idx + 2] * r;
          }
          nebulaPosAttr.needsUpdate = true;
          nebulaMat.size = 0.04 + energy * 0.08;
        };

        // --- Mode: Oscilloscope Ring (time-domain loop) ---
        const scopeGroup = new Group();
        threeGroup.add(scopeGroup);

        const scopeN = 256;
        const scopeAngles = new Float32Array(scopeN);
        const scopePos = new Float32Array(scopeN * 3);
        for (let i = 0; i < scopeN; i += 1) scopeAngles[i] = (i / scopeN) * Math.PI * 2;

        const scopeGeom = new BufferGeometry();
        scopeGeom.setAttribute("position", new Float32BufferAttribute(scopePos, 3));
        const scopeMat = new LineBasicMaterial({
          color: accent.clone(),
          transparent: true,
          opacity: 0.78,
          blending: AdditiveBlending,
        });
        threeThemeTargets.push({ kind: "line", mat: scopeMat });
        const scopeLine = new LineLoop(scopeGeom, scopeMat);
        scopeGroup.add(scopeLine);

        const scopePosAttr = /** @type {any} */ (scopeGeom.getAttribute("position"));

        const scopeUpdate = ({ t, bass, analyser: a, timeData: td }) => {
          scopeGroup.rotation.y = -t * 0.18;
          scopeGroup.rotation.x = -0.22;
          if (!a || !td || td.length < scopeN) return;
          a.getByteTimeDomainData(td);

          const baseR = 3.25;
          const ampR = 1.05 + bass * 0.8;
          for (let i = 0; i < scopeN; i += 1) {
            const s = (td[i] - 128) / 128; // -1..1
            const r = baseR + s * ampR;
            const y = s * 0.9;
            const ang = scopeAngles[i];
            const idx = i * 3;
            scopePosAttr.array[idx + 0] = Math.cos(ang) * r;
            scopePosAttr.array[idx + 1] = y * 0.45;
            scopePosAttr.array[idx + 2] = Math.sin(ang) * r;
          }
          scopePosAttr.needsUpdate = true;
        };

        // --- Mode: Tunnel (rings flying toward camera) ---
        const tunnelGroup = new Group();
        threeGroup.add(tunnelGroup);

        const tunnelRingCount = 16;
        const tunnelBarsPerRing = 48;
        const tunnelRadius = 2.95;
        const tunnelSpacing = 0.82;
        const tunnelGeom = new BoxGeometry(0.14, 1, 0.14);
        const tunnelMat = new MeshStandardMaterial({
          color: accent.clone(),
          emissive: accent.clone().multiplyScalar(0.35),
          roughness: 0.32,
          metalness: 0.2,
        });
        threeThemeTargets.push({ kind: "std", mat: tunnelMat, emissiveScale: 0.35 });

        /** @type {any[]} */
        const tunnelRings = [];
        for (let r = 0; r < tunnelRingCount; r += 1) {
          const ring = new Group();
          ring.position.z = -r * tunnelSpacing;
          ring.userData._ringIndex = r;

          /** @type {any[]} */
          const bars = [];
          for (let i = 0; i < tunnelBarsPerRing; i += 1) {
            const bar = new Mesh(tunnelGeom, tunnelMat);
            const a = (i / tunnelBarsPerRing) * Math.PI * 2;
            bar.position.set(Math.cos(a) * tunnelRadius, 0, Math.sin(a) * tunnelRadius);
            bar.rotation.y = -a;
            bar.scale.y = 0.12;
            bar.position.y = bar.scale.y / 2 - 0.06;
            ring.add(bar);
            bars.push(bar);
          }

          ring.userData._bars = bars;
          tunnelGroup.add(ring);
          tunnelRings.push(ring);
        }
        const tunnelMinZ = -tunnelRingCount * tunnelSpacing;

        const tunnelUpdate = ({ t, dt, energy, bass, freqData: f }) => {
          tunnelGroup.rotation.y = t * 0.15;
          tunnelGroup.rotation.x = -0.2;

          if (threeCore && threeCore.visible) {
            const pulse = 0.82 + bass * 1.15;
            threeCore.scale.setScalar(pulse);
            threeCore.rotation.y = t * 0.9;
            threeCore.rotation.x = 0.55 + t * 0.22;
          }

          const speed = 1.2 + energy * 2.6;
          for (const ring of tunnelRings) {
            ring.position.z += speed * dt;
            ring.rotation.z += dt * (0.35 + energy * 0.55);
            if (ring.position.z > 3.4) ring.position.z = tunnelMinZ;
          }

          if (!f || !f.length) return;
          const startBin = Math.floor(f.length * 0.04);
          const endBin = Math.floor(f.length * 0.92);
          const span = Math.max(1, endBin - startBin);

          for (const ring of tunnelRings) {
            const bars = /** @type {any[]} */ (ring.userData._bars || []);
            const rIdx = Number(ring.userData._ringIndex) || 0;
            const offset = Math.floor(((rIdx / Math.max(1, tunnelRingCount - 1)) * 0.38) * span);

            for (let i = 0; i < bars.length; i += 1) {
              const bar = bars[i];
              const bin = startBin + ((Math.floor((i / Math.max(1, bars.length - 1)) * span) + offset) % span);
              const v = (f[bin] || 0) / 255;
              const shaped = Math.pow(v, 1.55);
              const s = 0.12 + shaped * 3.6;
              bar.scale.y = s;
              bar.position.y = s / 2 - 0.06;
            }
          }
        };

        threeModes = {
          orbit: { group: orbitGroup, update: orbitUpdate },
          grid: { group: gridGroup, update: gridUpdate },
          nebula: { group: nebulaGroup, update: nebulaUpdate },
          scope: { group: scopeGroup, update: scopeUpdate },
          tunnel: { group: tunnelGroup, update: tunnelUpdate },
        };

        threeReady = true;
        resizeThreeRenderer();
        refreshThreeTheme();
        syncThreeVizMode();
        return true;
      } catch {
        // Fall back to 2D visualizer.
        three = null;
        threeReady = false;
        threeInitPromise = null;
        threeRenderer = null;
        threeScene = null;
        threeCamera = null;
        threeGroup = null;
        threeCore = null;
        threeStars = null;
        threeModes = null;
        threeThemeTargets = [];
        threeLastNowMs = 0;
        if (bgVizCanvas) bgVizCanvas.classList.remove("is-on");
        return false;
      }
    })();

    return await threeInitPromise;
  }

  function startVizLoop() {
    if (!canUseWebAudioViz()) return;
    if (vizRaf) return;

    const loop = (now) => {
      vizRaf = requestAnimationFrame(loop);

      // Background Three.js viz (optional)
      if (threeReady && bgVizMode !== "off") {
        resizeThreeRenderer();
        drawVizThree(now);
      }

      if (!ensureViz2dContext()) return;
      resizeViz2dCanvas();
      drawViz2d(now);
    };
    vizRaf = requestAnimationFrame(loop);
  }

  function stopVizLoop() {
    if (!vizRaf) return;
    cancelAnimationFrame(vizRaf);
    vizRaf = 0;
  }

  async function tryResumeAudioContext() {
    if (!audioCtx) return;
    try {
      if (audioCtx.state !== "running") await audioCtx.resume();
    } catch {
      // ignore
    }
  }

  function loadTrack(index, { autoplay = false } = {}) {
    if (!tracks.length) return;
    const safeIndex = clamp(index, 0, tracks.length - 1);
    currentIndex = safeIndex;
    const t = tracks[currentIndex];

    setLoadingState(true);
    setTrackDisplay(trackLabel(t));
    setStatus("STOP");
    updatePlaylistUi();
    updateMediaSession();

    // Reset seek slider
    seek.value = "0";
    seek.style.setProperty("--progress", "0%");

    audio.src = t.url;
    audio.currentTime = 0;
    audio.load();

    if (autoplay) {
      void play();
    }
  }

  async function play() {
    if (!tracks.length) {
      setHint(
        `No tracks yet. Click <b>ADD</b> or drag audio files into the playlist, or edit <code>tracks.js</code>.`,
        "warn",
      );
      return;
    }

    if (currentIndex < 0 || currentIndex >= tracks.length) {
      currentIndex = 0;
    }

    if (!audio.src) {
      loadTrack(currentIndex, { autoplay: false });
    }

    if (canUseWebAudioViz()) {
      ensureAudioGraph();
      startVizLoop();
      void ensureThreeViz();
      await tryResumeAudioContext();
    } else {
      // Keep playback background-safe; viz stays off/idle.
      stopVizLoop();
    }

    try {
      await audio.play();
      setStatus("PLAY");
      setHint(`Playing: <code>${escapeHtml(trackLabel(tracks[currentIndex]))}</code>`);
      updatePlaylistUi();
      hideError();
      announceToScreenReader(`Now playing: ${trackLabel(tracks[currentIndex])}`);
    } catch (err) {
      setStatus("STOP");
      setHint(
        `Browser blocked autoplay. Click <b>PLAY</b> again, or interact with the page first.`,
        "warn",
      );
    }
  }

  function pause() {
    audio.pause();
    stopVizLoop();
    setStatus("PAUSE");
    updatePlaylistUi();
  }

  function stop() {
    audio.pause();
    audio.currentTime = 0;
    stopVizLoop();
    setStatus("STOP");
    updateTimeUi();
  }

  function pickNextIndex(direction) {
    if (!tracks.length) return -1;

    if (shuffle) {
      if (tracks.length === 1) return currentIndex;
      let n = currentIndex;
      for (let tries = 0; tries < 6 && n === currentIndex; tries += 1) {
        n = Math.floor(Math.random() * tracks.length);
      }
      return n;
    }

    const next = currentIndex + direction;
    if (next < 0) return repeatMode === "all" ? tracks.length - 1 : 0;
    if (next >= tracks.length) return repeatMode === "all" ? 0 : tracks.length - 1;
    return next;
  }

  function next({ autoplay = true } = {}) {
    if (!tracks.length) return;

    if (repeatMode === "one") {
      loadTrack(currentIndex, { autoplay });
      return;
    }

    const idx = pickNextIndex(+1);
    loadTrack(idx, { autoplay });
  }

  function prev({ autoplay = true } = {}) {
    if (!tracks.length) return;

    // Winamp-ish: if you've heard more than 3s, restart; else go previous
    if (audio.currentTime > 3 && !shuffle) {
      audio.currentTime = 0;
      updateTimeUi();
      if (autoplay) void play();
      return;
    }

    if (repeatMode === "one") {
      loadTrack(currentIndex, { autoplay });
      return;
    }

    const idx = pickNextIndex(-1);
    loadTrack(idx, { autoplay });
  }

  function cycleRepeatMode() {
    repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    updateButtonsUi();
    const msg = repeatMode === "off" ? "Repeat: OFF" : repeatMode === "all" ? "Repeat: ALL" : "Repeat: ONE";
    setHint(msg);
    announceToScreenReader(msg);
  }

  function toggleShuffle() {
    shuffle = !shuffle;
    updateButtonsUi();
    const msg = `Shuffle: ${shuffle ? "ON" : "OFF"}`;
    setHint(msg);
    announceToScreenReader(msg);
  }

  function clearPlaylist() {
    stop();
    setTrackDisplay("No tracks loaded");
    setHint(`Cleared playlist. Add MP3s or edit <code>tracks.js</code>.`, "warn");

    for (const t of tracks) {
      if (t._objectUrl) {
        try {
          URL.revokeObjectURL(t._objectUrl);
        } catch {
          // ignore
        }
      }
    }

    tracks = [];
    currentIndex = -1;
    audio.removeAttribute("src");
    audio.load();
    updatePlaylistUi();
    updateTimeUi();
    setStatus("STOP");
  }

  function addTracksFromFiles(fileList) {
    /** @type {File[]} */
    const files = Array.from(fileList || []);
    const audioFiles = files.filter(
      (f) => (f.type || "").startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name),
    );
    if (!audioFiles.length) return;

    const newTracks = audioFiles.map((f) => {
      const url = URL.createObjectURL(f);
      const name = f.name.replace(/\.[a-z0-9]+$/i, "");
      return /** @type {Track} */ ({ title: name, artist: "Local", url, _objectUrl: url });
    });

    const wasEmpty = tracks.length === 0;
    tracks = tracks.concat(newTracks);

    if (wasEmpty) {
      currentIndex = 0;
      loadTrack(0, { autoplay: false });
    } else {
      updatePlaylistUi();
      setHint(`Added ${newTracks.length} file(s).`);
    }
  }

  // ---- Media Session API (OS-level controls) ----
  function setMediaSessionPlaybackState() {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
    } catch {
      // Some browsers support MediaSession but not playbackState.
    }
  }

  function setMediaSessionPositionState() {
    if (!("mediaSession" in navigator)) return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        position: audio.currentTime,
        playbackRate: audio.playbackRate || 1,
      });
    } catch {
      // setPositionState not supported everywhere.
    }
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const track = tracks[currentIndex];
    if (!track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || deriveTitleFromUrl(track.url),
      artist: track.artist || "Unknown Artist",
      album: "MySongs",
      artwork: track.coverUrl
        ? [{ src: track.coverUrl, sizes: "512x512" }]
        : [],
    });
    setMediaSessionPlaybackState();
    setMediaSessionPositionState();
  }

  function initMediaSession() {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => void play());
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("stop", stop);
    navigator.mediaSession.setActionHandler("previoustrack", () => prev({ autoplay: true }));
    navigator.mediaSession.setActionHandler("nexttrack", () => next({ autoplay: true }));

    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const skip = details.seekOffset || 10;
      audio.currentTime = Math.max(audio.currentTime - skip, 0);
    });

    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const skip = details.seekOffset || 10;
      audio.currentTime = Math.min(audio.currentTime + skip, audio.duration || 0);
    });

    try {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null && Number.isFinite(audio.duration)) {
          audio.currentTime = details.seekTime;
        }
      });
    } catch {
      // seekto not supported in all browsers
    }
  }

  initMediaSession();

  // ---- Controls wiring ----
  updateButtonsUi();
  updatePlaylistUi();
  updateTimeUi();

  const VOLUME_STORAGE_KEY = "mysongs-volume";
  const LEGACY_VOLUME_STORAGE_KEY = "webamp-volume";
  const savedVolRaw = localStorage.getItem(VOLUME_STORAGE_KEY) ?? localStorage.getItem(LEGACY_VOLUME_STORAGE_KEY);
  const savedVol = savedVolRaw != null ? Number(savedVolRaw) : Number.NaN;
  if (Number.isFinite(savedVol)) {
    const v = clamp(savedVol, 0, 1);
    audio.volume = v;
    volume.value = String(Math.round(v * 100));
    volume.style.setProperty("--progress", `${v * 100}%`);
  } else {
    // Default: full volume (unless the user has a saved preference).
    audio.volume = 1;
    volume.value = "100";
    volume.style.setProperty("--progress", "100%");
  }

  if (tracks.length) {
    loadTrack(currentIndex, { autoplay: false });
    setHint(`Loaded ${tracks.length} hosted track(s) from <code>tracks.js</code>.`);
  } else {
    setTrackDisplay("No tracks loaded");
    setHint(`Add audio (ADD / drag-drop) or edit <code>tracks.js</code>.`, "warn");
  }

  playBtn.addEventListener("click", () => void play());
  pauseBtn.addEventListener("click", pause);
  stopBtn.addEventListener("click", stop);
  nextBtn.addEventListener("click", () => next({ autoplay: true }));
  prevBtn.addEventListener("click", () => prev({ autoplay: true }));
  shuffleBtn.addEventListener("click", toggleShuffle);
  repeatBtn.addEventListener("click", cycleRepeatMode);

  seek.addEventListener("pointerdown", () => {
    isSeeking = true;
    void checkRangeSupportOnce();
  });
  seek.addEventListener("pointerup", () => {
    isSeeking = false;
  });
  seek.addEventListener("pointercancel", () => {
    isSeeking = false;
  });
  seek.addEventListener("input", () => {
    const dur = audio.duration;
    if (!Number.isFinite(dur) || dur <= 0) return;
    const ratio = clamp(Number(seek.value) / 1000, 0, 1);
    audio.currentTime = ratio * dur;
    updateTimeUi();
  });

  volume.addEventListener("input", () => {
    const v = clamp(Number(volume.value) / 100, 0, 1);
    audio.volume = v;
    volume.style.setProperty("--progress", `${v * 100}%`);
    localStorage.setItem(VOLUME_STORAGE_KEY, String(v));
  });

  togglePlaylistBtn.addEventListener("click", () => {
    playlistVisible = !playlistVisible;
    playlistWindow.classList.toggle("is-hidden", !playlistVisible);
    app.classList.toggle("wa-app--playlist-hidden", !playlistVisible);
  });

  addBtn.addEventListener("click", () => filePicker.click());
  filePicker.addEventListener("change", () => {
    if (!filePicker.files) return;
    addTracksFromFiles(filePicker.files);
    filePicker.value = "";
  });

  clearBtn.addEventListener("click", clearPlaylist);

  filterInput.addEventListener("input", updatePlaylistUi);

  playlistEl.addEventListener("click", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const li = target.closest(".wa-item");
    if (!li) return;
    const idx = Number(li.dataset.index);
    if (!Number.isFinite(idx)) return;
    loadTrack(idx, { autoplay: true });
  });

  playlistEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const target = /** @type {HTMLElement} */ (e.target);
    const li = target.closest(".wa-item");
    if (!li) return;
    e.preventDefault();
    const idx = Number(li.dataset.index);
    if (!Number.isFinite(idx)) return;
    loadTrack(idx, { autoplay: true });
  });

  // Audio events
  audio.addEventListener("loadedmetadata", updateTimeUi);
  audio.addEventListener("durationchange", updateTimeUi);
  audio.addEventListener("timeupdate", () => {
    updateTimeUi();
    setMediaSessionPositionState();
  });
  audio.addEventListener("canplay", () => setLoadingState(false));
  audio.addEventListener("loadstart", () => setLoadingState(true));
  audio.addEventListener("play", () => {
    setStatus("PLAY");
    setMediaSessionPlaybackState();
  });
  audio.addEventListener("pause", () => {
    if (audio.currentTime === 0 || audio.ended) setStatus("STOP");
    else setStatus("PAUSE");
    setMediaSessionPlaybackState();
  });
  audio.addEventListener("ended", () => {
    if (repeatMode === "one") {
      next({ autoplay: true });
      return;
    }
    if (shuffle || repeatMode === "all" || currentIndex < tracks.length - 1) {
      next({ autoplay: true });
    } else {
      stop();
    }
  });
  audio.addEventListener("error", () => {
    setStatus("STOP");
    setLoadingState(false);
    const track = tracks[currentIndex];
    const trackName = track ? trackLabel(track) : "track";
    setHint(
      `Couldn't load this track. Check the file path in <code>tracks.js</code> or re-add the file.`,
      "warn",
    );
    showError(
      "Playback Error",
      `Could not load "${trackName}". The file may be missing or corrupted.`,
      "Skip to Next",
      () => {
        if (tracks.length > 1) {
          next({ autoplay: true });
        }
      }
    );
  });

  // When the tab is hidden/locked, stop expensive visualization work.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      stopVizLoop();
      return;
    }

    if (canUseWebAudioViz() && !audio.paused) {
      ensureAudioGraph();
      startVizLoop();
      void ensureThreeViz();
      void tryResumeAudioContext();
    }
  });

  // ---- Drag & drop files onto playlist ----
  function isFileDrag(e) {
    const dt = e.dataTransfer;
    if (!dt) return false;
    return Array.from(dt.types || []).includes("Files");
  }

  function showDropzone(show) {
    dropzone.classList.toggle("is-active", show);
  }

  const dropTargets = [playlistWindow, playerWindow, document.body];
  for (const target of dropTargets) {
    target.addEventListener("dragenter", (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      showDropzone(true);
    });
    target.addEventListener("dragover", (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      showDropzone(true);
    });
    target.addEventListener("dragleave", () => {
      showDropzone(false);
    });
    target.addEventListener("drop", (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      showDropzone(false);
      addTracksFromFiles(e.dataTransfer.files);
    });
  }

  // ---- Swipe gestures for mobile ----
  function initSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 60;
    const SWIPE_TIMEOUT = 350;

    playerWindow.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    playerWindow.addEventListener("touchend", (e) => {
      if (Date.now() - touchStartTime > SWIPE_TIMEOUT) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      // Only horizontal swipes, ignore if vertical movement is significant
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.6) return;

      if (deltaX > 0) {
        prev({ autoplay: !audio.paused });
        showSwipeFeedback("prev");
      } else {
        next({ autoplay: !audio.paused });
        showSwipeFeedback("next");
      }
    }, { passive: true });
  }

  function showSwipeFeedback(direction) {
    const indicator = document.createElement("div");
    indicator.className = `wa-swipe-indicator wa-swipe-indicator--${direction}`;
    indicator.textContent = direction === "prev" ? "⏮" : "⏭";
    playerWindow.appendChild(indicator);

    requestAnimationFrame(() => {
      indicator.classList.add("is-visible");
      setTimeout(() => {
        indicator.classList.remove("is-visible");
        setTimeout(() => indicator.remove(), 200);
      }, 250);
    });
  }

  initSwipeGestures();

  // ---- Enhanced keyboard shortcuts ----
  function showVolumeToast(vol) {
    let toast = playerWindow.querySelector(".wa-volume-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "wa-volume-toast";
      playerWindow.appendChild(toast);
    }
    toast.textContent = `Vol: ${Math.round(vol * 100)}%`;
    toast.classList.add("is-visible");
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 700);
  }

  function showKeyboardHelp() {
    const shortcuts = [
      ["Space", "Play/Pause"],
      ["←/→", "Seek ±5s"],
      ["↑/↓", "Volume ±5%"],
      ["Shift+←/→", "Prev/Next track"],
      ["N / P", "Next/Previous"],
      ["M", "Mute"],
      ["S", "Shuffle"],
      ["R", "Repeat"],
      ["L", "Toggle playlist"],
      ["F", "Focus search"],
    ];
    const content = shortcuts.map(([key, desc]) => `<kbd>${key}</kbd> ${desc}`).join("<br>");
    setHint(`<b>Shortcuts:</b><br>${content}`);
  }

  window.addEventListener("keydown", (e) => {
    if (e.target && (/** @type {HTMLElement} */ (e.target)).closest("input, textarea, [contenteditable]")) return;

    const key = e.key.toLowerCase();

    switch (e.key) {
      case " ":
        e.preventDefault();
        if (audio.paused) void play();
        else pause();
        break;

      case "ArrowRight":
        if (e.shiftKey) {
          next({ autoplay: !audio.paused });
        } else {
          audio.currentTime = clamp(audio.currentTime + 5, 0, Number.isFinite(audio.duration) ? audio.duration : 1e9);
        }
        break;

      case "ArrowLeft":
        if (e.shiftKey) {
          prev({ autoplay: !audio.paused });
        } else {
          audio.currentTime = clamp(audio.currentTime - 5, 0, 1e9);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        audio.volume = clamp(audio.volume + 0.05, 0, 1);
        volume.value = String(Math.round(audio.volume * 100));
        volume.style.setProperty("--progress", `${audio.volume * 100}%`);
        showVolumeToast(audio.volume);
        localStorage.setItem(VOLUME_STORAGE_KEY, String(audio.volume));
        break;

      case "ArrowDown":
        e.preventDefault();
        audio.volume = clamp(audio.volume - 0.05, 0, 1);
        volume.value = String(Math.round(audio.volume * 100));
        volume.style.setProperty("--progress", `${audio.volume * 100}%`);
        showVolumeToast(audio.volume);
        localStorage.setItem(VOLUME_STORAGE_KEY, String(audio.volume));
        break;

      default:
        // Handle letter keys (case-insensitive)
        if (key === "n") {
          next({ autoplay: !audio.paused });
        } else if (key === "p") {
          prev({ autoplay: !audio.paused });
        } else if (key === "m") {
          audio.muted = !audio.muted;
          setHint(audio.muted ? "Muted" : "Unmuted");
        } else if (key === "s") {
          toggleShuffle();
        } else if (key === "r") {
          cycleRepeatMode();
        } else if (key === "l") {
          playlistVisible = !playlistVisible;
          playlistWindow.classList.toggle("is-hidden", !playlistVisible);
          app.classList.toggle("wa-app--playlist-hidden", !playlistVisible);
        } else if (key === "f") {
          e.preventDefault();
          filterInput.focus();
        } else if (key === "escape") {
          if (document.activeElement === filterInput) {
            if (filterInput.value) {
              filterInput.value = "";
              updatePlaylistUi();
            } else {
              filterInput.blur();
            }
          }
        } else if (key === "?" || (e.shiftKey && e.key === "/")) {
          showKeyboardHelp();
        }
        break;
    }
  });

  // Keep the visualizer crisp when resizing.
  window.addEventListener("resize", () => {
    if (threeReady) resizeThreeRenderer();
    if (ensureViz2dContext()) resizeViz2dCanvas();
  });
})();
