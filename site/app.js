(() => {
  "use strict";
  console.log("MySongs app.js loading...");

  const $ = (id) => /** @type {HTMLElement|null} */ (document.getElementById(id));

  // ---- Immersive UI Elements ----
  const app = $("app");
  const controlBar = $("controlBar");
  const trackTitle = $("trackTitle");
  const trackArtist = $("trackArtist");
  const nowPlayingCover = $("nowPlayingCover");
  const currentTimeEl = $("currentTime");
  const durationEl = $("duration");

  const prevBtn = $("prevBtn");
  const playPauseBtn = $("playPauseBtn");
  const nextBtn = $("nextBtn");
  const shuffleBtn = $("shuffleBtn");
  const repeatBtn = $("repeatBtn");
  const volumeBtn = $("volumeBtn");

  const seek = /** @type {HTMLInputElement|null} */ ($("seek"));
  const volume = /** @type {HTMLInputElement|null} */ ($("volume"));

  // Playlist modal elements
  const playlistBtn = $("playlistBtn");
  const playlistModal = $("playlistModal");
  const playlistBackdrop = $("playlistBackdrop");
  const closePlaylistBtn = $("closePlaylistBtn");
  const playlistEl = $("playlist");
  const filterInput = /** @type {HTMLInputElement|null} */ ($("filterInput"));
  const addBtn = $("addBtn");
  const clearBtn = $("clearBtn");
  const filePicker = /** @type {HTMLInputElement|null} */ ($("filePicker"));
  const dropzone = $("dropzone");

  const bgVizCanvas = /** @type {HTMLCanvasElement|null} */ ($("bgViz"));

  // Game settings elements
  const vizSettingsBtn = $("vizSettingsBtn");
  const vizSettings = $("vizSettings");
  const closeVizSettingsBtn = $("closeVizSettings");
  const vizReactivity = /** @type {HTMLInputElement|null} */ ($("vizReactivity"));
  const reactivityValue = $("reactivityValue");

  // Racer settings elements
  const racerModelSelect = /** @type {HTMLSelectElement|null} */ ($("racerModelSelect"));
  const cruiseSpeedSlider = /** @type {HTMLInputElement|null} */ ($("cruiseSpeed"));
  const cruiseSpeedValue = $("cruiseSpeedValue");

  // Flight control elements
  const lateralLimitSlider = /** @type {HTMLInputElement|null} */ ($("lateralLimit"));
  const lateralLimitValue = $("lateralLimitValue");
  const minAltitudeSlider = /** @type {HTMLInputElement|null} */ ($("minAltitude"));
  const minAltitudeValue = $("minAltitudeValue");
  const maxAltitudeSlider = /** @type {HTMLInputElement|null} */ ($("maxAltitude"));
  const maxAltitudeValue = $("maxAltitudeValue");
  const steerResponseSlider = /** @type {HTMLInputElement|null} */ ($("steerResponse"));
  const steerResponseValue = $("steerResponseValue");
  const verticalResponseSlider = /** @type {HTMLInputElement|null} */ ($("verticalResponse"));
  const verticalResponseValue = $("verticalResponseValue");
  const bankAngleSlider = /** @type {HTMLInputElement|null} */ ($("bankAngle"));
  const bankAngleValue = $("bankAngleValue");

  // Score HUD elements
  const scoreHud = $("scoreHud");
  const scoreValue = $("scoreValue");
  const comboDisplay = $("comboDisplay");
  const comboValue = $("comboValue");
  const highScoreValue = $("highScoreValue");
  const hitFeedback = $("hitFeedback");
  const flowValue = $("flowValue");
  const flowBarFill = $("flowBarFill");
  const gateStreakValue = $("gateStreakValue");

  // Run summary overlay (Chill Ride)
  const runSummary = $("runSummary");
  const runRank = $("runRank");
  const runFlowAvg = $("runFlowAvg");
  const runGateAcc = $("runGateAcc");
  const runGateStreakMax = $("runGateStreakMax");

  // High score modal elements
  const highScoreModal = $("highScoreModal");
  const finalScoreDisplay = $("finalScoreDisplay");
  const finalTrackDisplay = $("finalTrackDisplay");
  const initialsInput = /** @type {HTMLInputElement|null} */ ($("initialsInput"));
  const saveScoreBtn = $("saveScoreBtn");
  const skipScoreBtn = $("skipScoreBtn");
  const leaderboardDisplay = $("leaderboardDisplay");

  // Model settings elements (removed from UI but kept for compatibility)
  const modelSelect = null;
  const modelSettingsGroup = null;
  const modelPosYGroup = null;
  const modelRotYGroup = null;
  const modelAnimSpeedGroup = null;
  const modelScaleSlider = null;
  const modelPosYSlider = null;
  const modelRotYSlider = null;
  const modelAnimSpeedSlider = null;
  const modelScaleValue = null;
  const modelPosYValue = null;
  const modelRotYValue = null;
  const modelAnimSpeedValue = null;
  const scalePulseCheckbox = null;
  const copySettingsBtn = null;

  // Effects control elements
  const lightningEnabled = /** @type {HTMLInputElement|null} */ ($("lightningEnabled"));
  const lightningIntensity = /** @type {HTMLInputElement|null} */ ($("lightningIntensity"));
  const lightningFrequency = /** @type {HTMLInputElement|null} */ ($("lightningFrequency"));
  const lightningColor = /** @type {HTMLInputElement|null} */ ($("lightningColor"));
  const auroraEnabled = /** @type {HTMLInputElement|null} */ ($("auroraEnabled"));
  const auroraIntensity = /** @type {HTMLInputElement|null} */ ($("auroraIntensity"));
  const auroraSpeed = /** @type {HTMLInputElement|null} */ ($("auroraSpeed"));
  const auroraRibbons = /** @type {HTMLInputElement|null} */ ($("auroraRibbons"));
  const gridEnabled = /** @type {HTMLInputElement|null} */ ($("gridEnabled"));
  const gridIntensity = /** @type {HTMLInputElement|null} */ ($("gridIntensity"));
  const gridSpacing = /** @type {HTMLInputElement|null} */ ($("gridSpacing"));
  const gridFloor = /** @type {HTMLInputElement|null} */ ($("gridFloor"));
  const gridPerspective = /** @type {HTMLInputElement|null} */ ($("gridPerspective"));
  const gridColor = /** @type {HTMLInputElement|null} */ ($("gridColor"));
  const lightsEnabled = /** @type {HTMLInputElement|null} */ ($("lightsEnabled"));
  const godRaysEnabled = /** @type {HTMLInputElement|null} */ ($("godRaysEnabled"));
  const pulseLights = /** @type {HTMLInputElement|null} */ ($("pulseLights"));
  const godRayIntensity = /** @type {HTMLInputElement|null} */ ($("godRayIntensity"));
  const particlesEnabled = /** @type {HTMLInputElement|null} */ ($("particlesEnabled"));
  const particleType = /** @type {HTMLSelectElement|null} */ ($("particleType"));
  const particleCount = /** @type {HTMLInputElement|null} */ ($("particleCount"));
  const particleSize = /** @type {HTMLInputElement|null} */ ($("particleSize"));
  const particleSpeed = /** @type {HTMLInputElement|null} */ ($("particleSpeed"));
  const fogDensity = /** @type {HTMLInputElement|null} */ ($("fogDensity"));
  const speedLinesIntensity = /** @type {HTMLInputElement|null} */ ($("speedLinesIntensity"));
  const colorShiftEnabled = /** @type {HTMLInputElement|null} */ ($("colorShiftEnabled"));
  const screenShakeEnabled = /** @type {HTMLInputElement|null} */ ($("screenShakeEnabled"));

  // World / Chill Ride elements
  const pathEnabled = /** @type {HTMLInputElement|null} */ ($("pathEnabled"));
  const parallaxEnabled = /** @type {HTMLInputElement|null} */ ($("parallaxEnabled"));
  const vistaEnabled = /** @type {HTMLInputElement|null} */ ($("vistaEnabled"));
  const pathOpacity = /** @type {HTMLInputElement|null} */ ($("pathOpacity"));
  const pathLaneOpacity = /** @type {HTMLInputElement|null} */ ($("pathLaneOpacity"));
  const parallaxDepth = /** @type {HTMLInputElement|null} */ ($("parallaxDepth"));
  const vistaThreshold = /** @type {HTMLInputElement|null} */ ($("vistaThreshold"));
  const vistaDuration = /** @type {HTMLInputElement|null} */ ($("vistaDuration"));
  const vistaCooldown = /** @type {HTMLInputElement|null} */ ($("vistaCooldown"));
  const resetEffectsBtn = $("resetEffectsBtn");
  const randomizeEffectsBtn = $("randomizeEffectsBtn");

  // Value display elements
  const lightningIntensityValue = $("lightningIntensityValue");
  const lightningFrequencyValue = $("lightningFrequencyValue");
  const auroraIntensityValue = $("auroraIntensityValue");
  const auroraSpeedValue = $("auroraSpeedValue");
  const auroraRibbonsValue = $("auroraRibbonsValue");
  const gridIntensityValue = $("gridIntensityValue");
  const gridSpacingValue = $("gridSpacingValue");
  const godRayIntensityValue = $("godRayIntensityValue");
  const particleCountValue = $("particleCountValue");
  const particleSizeValue = $("particleSizeValue");
  const particleSpeedValue = $("particleSpeedValue");
  const fogDensityValue = $("fogDensityValue");
  const speedLinesValue = $("speedLinesValue");

  const pathOpacityValue = $("pathOpacityValue");
  const pathLaneOpacityValue = $("pathLaneOpacityValue");
  const parallaxDepthValue = $("parallaxDepthValue");
  const vistaThresholdValue = $("vistaThresholdValue");
  const vistaDurationValue = $("vistaDurationValue");
  const vistaCooldownValue = $("vistaCooldownValue");

  // Band select buttons
  const bandButtons = document.querySelectorAll('.viz-settings__band-btn');

  if (
    !app ||
    !controlBar ||
    !trackTitle ||
    !trackArtist ||
    !nowPlayingCover ||
    !currentTimeEl ||
    !durationEl ||
    !playPauseBtn ||
    !volumeBtn ||
    !seek ||
    !volume ||
    !playlistBtn ||
    !playlistModal ||
    !playlistBackdrop ||
    !closePlaylistBtn ||
    !playlistEl ||
    !filterInput ||
    !addBtn ||
    !clearBtn ||
    !filePicker ||
    !dropzone ||
    !vizSettingsBtn ||
    !vizSettings ||
    !closeVizSettingsBtn
  ) {
    console.error("App: Missing required DOM elements");
    return;
  }

  /** @typedef {{ title?: string; artist?: string; url?: string; coverUrl?: string; stemsManifest?: string; _objectUrl?: string; }} Track */

  /** @type {Track[]} */
  const hostedTracks = (Array.isArray(window.TRACKS) ? window.TRACKS : [])
    .filter((t) => t && (
      (typeof t.url === "string" && t.url.trim().length > 0) ||
      (typeof t.stemsManifest === "string" && t.stemsManifest.trim().length > 0)
    ))
    .map((t) => ({
      title: typeof t.title === "string" ? t.title : undefined,
      artist: typeof t.artist === "string" ? t.artist : undefined,
      url: typeof t.url === "string" ? t.url : undefined,
      coverUrl: typeof t.coverUrl === "string" ? t.coverUrl : undefined,
      stemsManifest: typeof t.stemsManifest === "string" ? t.stemsManifest : undefined,
    }));

  /** @type {Track[]} */
  let tracks = hostedTracks.slice();
  let currentIndex = tracks.length ? 0 : -1;

  /** @type {number[]} */
  let visibleIndices = [];

  let shuffle = false;
  /** @type {"off"|"all"|"one"} */
  let repeatMode = "all";

  let isSeeking = false;
  let playlistOpen = false;
  let vizSettingsOpen = false;

  // Visualizer settings values
  const vizParams = {
    amplitude: 0.3,      // Multiplier for how much audio affects visual displacement
    smoothing: 0.15,     // Analyser smoothingTimeConstant (0-0.95)
    speed: 2.0,          // Animation speed multiplier
    zoom: 0.25,          // Camera zoom (distance multiplier, inverted)
    audioReactivity: 1.0, // How much audio affects speed (0=static, 1=fully reactive)
  };

  // Effects configuration - controls all visual effects
  const effectsConfig = {
    lightning: {
      enabled: false,
      intensity: 0.5,
      frequency: 0.3,
      color: '#00ffff',
      band: 'bass'
    },
    aurora: {
      enabled: false,
      intensity: 0.5,
      speed: 0.5,
      ribbons: 5,
      band: 'mid'
    },
    grid: {
      enabled: false,
      intensity: 0.4,
      spacing: 5,
      floor: true,
      perspective: false,
      color: '#00ffff',
      band: 'energy'
    },
    lights: {
      enabled: false,
      godRays: false,
      pulse: true,
      godRayIntensity: 0.3,
      band: 'bass'
    },
    particles: {
      enabled: true,
      type: 'dust',
      count: 500,
      size: 0.3,
      speed: 1.0,
      band: 'energy'
    },
    visual: {
      fogDensity: 1.0,
      speedLines: 1.0,
      colorShift: false,
      screenShake: true
    },
    world: {
      pathEnabled: true,
      pathOpacity: 0.18,
      pathLaneOpacity: 0.28,
      parallaxEnabled: true,
      parallaxFactorZ: 0.28,
      vistaEnabled: true,
      vistaMinEnergy: 0.68,
      vistaDuration: 2.6,
      vistaCooldown: 5.0
    }
  };

  const EFFECTS_STORAGE_KEY = "mysongs-effects-config";

  // Load saved effects config
  function loadEffectsConfig() {
    try {
      const saved = localStorage.getItem(EFFECTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(effectsConfig.lightning, parsed.lightning || {});
        Object.assign(effectsConfig.aurora, parsed.aurora || {});
        Object.assign(effectsConfig.grid, parsed.grid || {});
        Object.assign(effectsConfig.lights, parsed.lights || {});
        Object.assign(effectsConfig.particles, parsed.particles || {});
        Object.assign(effectsConfig.visual, parsed.visual || {});
        Object.assign(effectsConfig.world, parsed.world || {});
      }
    } catch (e) {
      console.warn("Failed to load effects config:", e);
    }
  }

  // Save effects config
  function saveEffectsConfig() {
    try {
      localStorage.setItem(EFFECTS_STORAGE_KEY, JSON.stringify(effectsConfig));
    } catch (e) {
      console.warn("Failed to save effects config:", e);
    }
  }

  // Update all effects UI displays
  function updateEffectsUI() {
    if (lightningEnabled) lightningEnabled.checked = effectsConfig.lightning.enabled;
    if (lightningIntensity) lightningIntensity.value = String(effectsConfig.lightning.intensity * 100);
    if (lightningFrequency) lightningFrequency.value = String(effectsConfig.lightning.frequency * 100);
    if (lightningColor) lightningColor.value = effectsConfig.lightning.color;
    if (lightningIntensityValue) lightningIntensityValue.textContent = Math.round(effectsConfig.lightning.intensity * 100) + '%';
    if (lightningFrequencyValue) lightningFrequencyValue.textContent = Math.round(effectsConfig.lightning.frequency * 100) + '%';

    if (auroraEnabled) auroraEnabled.checked = effectsConfig.aurora.enabled;
    if (auroraIntensity) auroraIntensity.value = String(effectsConfig.aurora.intensity * 100);
    if (auroraSpeed) auroraSpeed.value = String(effectsConfig.aurora.speed * 100);
    if (auroraRibbons) auroraRibbons.value = String(effectsConfig.aurora.ribbons);
    if (auroraIntensityValue) auroraIntensityValue.textContent = Math.round(effectsConfig.aurora.intensity * 100) + '%';
    if (auroraSpeedValue) auroraSpeedValue.textContent = Math.round(effectsConfig.aurora.speed * 100) + '%';
    if (auroraRibbonsValue) auroraRibbonsValue.textContent = String(effectsConfig.aurora.ribbons);

    if (gridEnabled) gridEnabled.checked = effectsConfig.grid.enabled;
    if (gridIntensity) gridIntensity.value = String(effectsConfig.grid.intensity * 100);
    if (gridSpacing) gridSpacing.value = String(effectsConfig.grid.spacing);
    if (gridFloor) gridFloor.checked = effectsConfig.grid.floor;
    if (gridPerspective) gridPerspective.checked = effectsConfig.grid.perspective;
    if (gridColor) gridColor.value = effectsConfig.grid.color;
    if (gridIntensityValue) gridIntensityValue.textContent = Math.round(effectsConfig.grid.intensity * 100) + '%';
    if (gridSpacingValue) gridSpacingValue.textContent = String(effectsConfig.grid.spacing);

    if (lightsEnabled) lightsEnabled.checked = effectsConfig.lights.enabled;
    if (godRaysEnabled) godRaysEnabled.checked = effectsConfig.lights.godRays;
    if (pulseLights) pulseLights.checked = effectsConfig.lights.pulse;
    if (godRayIntensity) godRayIntensity.value = String(effectsConfig.lights.godRayIntensity * 100);
    if (godRayIntensityValue) godRayIntensityValue.textContent = Math.round(effectsConfig.lights.godRayIntensity * 100) + '%';

    if (particlesEnabled) particlesEnabled.checked = effectsConfig.particles.enabled;
    if (particleType) particleType.value = effectsConfig.particles.type;
    if (particleCount) particleCount.value = String(effectsConfig.particles.count);
    if (particleSize) particleSize.value = String(effectsConfig.particles.size * 100);
    if (particleSpeed) particleSpeed.value = String(effectsConfig.particles.speed * 100);
    if (particleCountValue) particleCountValue.textContent = String(effectsConfig.particles.count);
    if (particleSizeValue) particleSizeValue.textContent = effectsConfig.particles.size.toFixed(1);
    if (particleSpeedValue) particleSpeedValue.textContent = effectsConfig.particles.speed.toFixed(1);

    if (fogDensity) fogDensity.value = String(effectsConfig.visual.fogDensity * 100);
    if (speedLinesIntensity) speedLinesIntensity.value = String(effectsConfig.visual.speedLines * 100);
    if (colorShiftEnabled) colorShiftEnabled.checked = effectsConfig.visual.colorShift;
    if (screenShakeEnabled) screenShakeEnabled.checked = effectsConfig.visual.screenShake;
    if (fogDensityValue) fogDensityValue.textContent = Math.round(effectsConfig.visual.fogDensity * 100) + '%';
    if (speedLinesValue) speedLinesValue.textContent = Math.round(effectsConfig.visual.speedLines * 100) + '%';

    // World / Chill Ride
    if (pathEnabled) pathEnabled.checked = !!effectsConfig.world.pathEnabled;
    if (parallaxEnabled) parallaxEnabled.checked = !!effectsConfig.world.parallaxEnabled;
    if (vistaEnabled) vistaEnabled.checked = !!effectsConfig.world.vistaEnabled;

    if (pathOpacity) pathOpacity.value = String(Math.round(clamp(effectsConfig.world.pathOpacity, 0, 1) * 100));
    if (pathLaneOpacity) pathLaneOpacity.value = String(Math.round(clamp(effectsConfig.world.pathLaneOpacity, 0, 1) * 100));
    if (parallaxDepth) parallaxDepth.value = String(Math.round(clamp(effectsConfig.world.parallaxFactorZ, 0, 1) * 100));
    if (vistaThreshold) vistaThreshold.value = String(Math.round(clamp(effectsConfig.world.vistaMinEnergy, 0, 1) * 100));
    if (vistaDuration) vistaDuration.value = String(Math.round(clamp(effectsConfig.world.vistaDuration, 0.5, 10) * 10));
    if (vistaCooldown) vistaCooldown.value = String(Math.round(clamp(effectsConfig.world.vistaCooldown, 0.5, 20) * 10));

    if (pathOpacityValue) pathOpacityValue.textContent = `${Math.round(clamp(effectsConfig.world.pathOpacity, 0, 1) * 100)}%`;
    if (pathLaneOpacityValue) pathLaneOpacityValue.textContent = `${Math.round(clamp(effectsConfig.world.pathLaneOpacity, 0, 1) * 100)}%`;
    if (parallaxDepthValue) parallaxDepthValue.textContent = `${Math.round(clamp(effectsConfig.world.parallaxFactorZ, 0, 1) * 100)}%`;
    if (vistaThresholdValue) vistaThresholdValue.textContent = `${Math.round(clamp(effectsConfig.world.vistaMinEnergy, 0, 1) * 100)}%`;
    if (vistaDurationValue) vistaDurationValue.textContent = `${(clamp(effectsConfig.world.vistaDuration, 0.5, 10)).toFixed(1)}s`;
    if (vistaCooldownValue) vistaCooldownValue.textContent = `${(clamp(effectsConfig.world.vistaCooldown, 0.5, 20)).toFixed(1)}s`;

    // Update band buttons
    bandButtons.forEach(btn => {
      const effect = btn.getAttribute('data-effect');
      const band = btn.getAttribute('data-band');
      const currentBand = effectsConfig[effect]?.band;
      btn.classList.toggle('active', band === currentBand);
    });
  }

  // Reset effects to defaults
  function resetEffectsConfig() {
    effectsConfig.lightning = { enabled: false, intensity: 0.5, frequency: 0.3, color: '#00ffff', band: 'bass' };
    effectsConfig.aurora = { enabled: false, intensity: 0.5, speed: 0.5, ribbons: 5, band: 'mid' };
    effectsConfig.grid = { enabled: false, intensity: 0.4, spacing: 5, floor: true, perspective: false, color: '#00ffff', band: 'energy' };
    effectsConfig.lights = { enabled: false, godRays: false, pulse: true, godRayIntensity: 0.3, band: 'bass' };
    effectsConfig.particles = { enabled: true, type: 'dust', count: 500, size: 0.3, speed: 1.0, band: 'energy' };
    effectsConfig.visual = { fogDensity: 1.0, speedLines: 1.0, colorShift: false, screenShake: true };
    effectsConfig.world = {
      pathEnabled: true,
      pathOpacity: 0.18,
      pathLaneOpacity: 0.28,
      parallaxEnabled: true,
      parallaxFactorZ: 0.28,
      vistaEnabled: true,
      vistaMinEnergy: 0.68,
      vistaDuration: 2.6,
      vistaCooldown: 5.0
    };
    updateEffectsUI();
    saveEffectsConfig();
    applyEffectsToEnvironment();
  }

  // Randomize effects
  function randomizeEffectsConfig() {
    const types = ['dust', 'sparks', 'bubbles', 'embers', 'snow', 'stars'];
    const bands = ['bass', 'mid', 'treble', 'energy'];
    const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

    effectsConfig.lightning.enabled = Math.random() > 0.5;
    effectsConfig.lightning.intensity = 0.2 + Math.random() * 0.8;
    effectsConfig.lightning.frequency = 0.1 + Math.random() * 0.7;
    effectsConfig.lightning.color = randomColor();
    effectsConfig.lightning.band = bands[Math.floor(Math.random() * bands.length)];

    effectsConfig.aurora.enabled = Math.random() > 0.5;
    effectsConfig.aurora.intensity = 0.2 + Math.random() * 0.8;
    effectsConfig.aurora.speed = 0.2 + Math.random() * 0.8;
    effectsConfig.aurora.ribbons = 2 + Math.floor(Math.random() * 8);
    effectsConfig.aurora.band = bands[Math.floor(Math.random() * bands.length)];

    effectsConfig.grid.enabled = Math.random() > 0.5;
    effectsConfig.grid.intensity = 0.2 + Math.random() * 0.8;
    effectsConfig.grid.spacing = 3 + Math.floor(Math.random() * 15);
    effectsConfig.grid.floor = Math.random() > 0.3;
    effectsConfig.grid.perspective = Math.random() > 0.5;
    effectsConfig.grid.color = randomColor();
    effectsConfig.grid.band = bands[Math.floor(Math.random() * bands.length)];

    effectsConfig.lights.enabled = Math.random() > 0.4;
    effectsConfig.lights.godRays = Math.random() > 0.5;
    effectsConfig.lights.pulse = Math.random() > 0.3;
    effectsConfig.lights.godRayIntensity = 0.1 + Math.random() * 0.7;
    effectsConfig.lights.band = bands[Math.floor(Math.random() * bands.length)];

    effectsConfig.particles.enabled = Math.random() > 0.2;
    effectsConfig.particles.type = types[Math.floor(Math.random() * types.length)];
    effectsConfig.particles.count = 200 + Math.floor(Math.random() * 1500);
    effectsConfig.particles.size = 0.1 + Math.random() * 0.8;
    effectsConfig.particles.speed = 0.3 + Math.random() * 2.0;
    effectsConfig.particles.band = bands[Math.floor(Math.random() * bands.length)];

    effectsConfig.visual.fogDensity = 0.3 + Math.random() * 1.4;
    effectsConfig.visual.speedLines = Math.random();
    effectsConfig.visual.colorShift = Math.random() > 0.6;
    effectsConfig.visual.screenShake = Math.random() > 0.4;

    updateEffectsUI();
    saveEffectsConfig();
    applyEffectsToEnvironment();
  }

  // Apply effects to the environment
  function applyEffectsToEnvironment() {
    if (typeof EffectsManager !== 'undefined' && EffectsManager.update) {
      EffectsManager.update(effectsConfig);
    }
    if (typeof EnvironmentMode !== 'undefined' && EnvironmentMode.setEffectsConfig) {
      EnvironmentMode.setEffectsConfig(effectsConfig);
    }
  }

  // Audio-reactive speed state
  let audioSpeedMultiplier = 1.0;
  let lastEnergyForSpeed = 0;
  let spectralFlux = 0;
  let globalBeatPulse = 0;
  let lastBassForSpeed = 0;

  const VIZ_PARAMS_STORAGE_KEY = "mysongs-viz-params";

  // ---- Audio ----
  const domAudio = /** @type {HTMLAudioElement|null} */ (document.getElementById("playerAudio"));
  const audio = domAudio || new Audio();
  audio.preload = "metadata";
  audio.crossOrigin = "anonymous";

  // ---- Stem Player (for tracks with multi-stem support) ----
  /** @type {any} */
  let stemPlayer = null;
  let usingStemPlayer = false;
  let stemAnalysisData = null;

  // ---- Lyrics sync ----
  let lyricsData = null;       // Array of { time, text, type? }
  let currentLyricIndex = -1;  // Current lyric being displayed

  const isIOS = (() => {
    const ua = navigator.userAgent || "";
    const iDevice = /iPad|iPhone|iPod/i.test(ua);
    const iPadOS = navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
    return iDevice || iPadOS;
  })();

  // iOS simple visualization (fallback when Web Audio is unavailable)
  /** @type {any} */
  let iosViz = null;

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
      rangeSupported = true;
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
  let vizRaf = 0;

  // ---- Three.js visualizer ----
  // Use jspm.dev which properly handles ES module dependencies
  const THREE_CDN = "https://ga.jspm.io/npm:three@0.160.0/build/three.module.js";
  const ORBIT_CONTROLS_CDN = "https://ga.jspm.io/npm:three@0.160.0/examples/jsm/controls/OrbitControls.js";
  const GLTF_LOADER_CDN = "https://ga.jspm.io/npm:three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
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
  /** @type {any | null} */
  let orbitControls = null;
  /** @type {Record<string, { group: any; update: Function }> | null} */
  let threeModes = null;
  /** @type {Array<{ kind: "std" | "basic" | "points" | "line"; mat: any; emissiveScale?: number }>} */
  let threeThemeTargets = [];

  let threeLastNowMs = 0;
  let threeW = 0;
  let threeH = 0;

  // 3D Model state
  /** @type {any | null} */
  let gltfLoader = null;
  /** @type {any | null} */
  let currentModel = null;
  /** @type {any | null} */
  let currentModelMixer = null;
  /** @type {string | null} */
  let currentModelId = null;
  /** @type {Array<{id: string, name: string, url: string, scale?: number, position?: [number, number, number]}>} */
  let availableModels = [];
  /** @type {number} */
  let modelLoadId = 0; // Tracks which load request is current

  // Runtime model overrides (tweakable via UI)
  const modelOverrides = {
    scale: 1,
    posY: 0,
    rotY: 0,
    animSpeed: 1,
    scalePulse: true,
  };

  const vizPalette = {
    accent: "#3cff6b",
    accentDim: "#16b64f",
    bg: "#050505",
  };

  /** @type {"grid" | "nebula" | "scope" | "environment" | "off"} */
  let bgVizMode = "environment";  // Default to environment mode

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
    return value === "midnight" || value === "neo" || value === "winamp41" ? value : "neo";
  }

  const THEME_STORAGE_KEY = "mysongs-theme";
  const LEGACY_THEME_STORAGE_KEY = "webamp-theme";

  function applyTheme(theme, { persist = false } = {}) {
    const t = normalizeTheme(theme);
    document.documentElement.dataset.theme = t;
    if (persist) localStorage.setItem(THEME_STORAGE_KEY, t);
    refreshVizPalette();
    refreshThreeTheme();
  }

  applyTheme(
    normalizeTheme(
      localStorage.getItem(THEME_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_THEME_STORAGE_KEY) ||
        document.documentElement.dataset.theme ||
        "neo",
    ),
  );

  // Environment mode is the only visualization mode
  let bgVizModeFixed = "environment";

  function applyVizMode() {
    bgVizMode = bgVizModeFixed;
    if (threeReady) syncThreeVizMode();
    if (bgVizCanvas) bgVizCanvas.classList.toggle("is-on", threeReady && bgVizMode !== "off");
  }

  applyVizMode();

  // ---- Track Theme System ----
  const TRACK_THEMES = window.TRACK_THEMES || {};
  const DEFAULT_THEME = window.DEFAULT_THEME || {
    model: null,
    colorTheme: "midnight",
    vizMode: "environment",
    vizParams: { amplitude: 0.3, speed: 1.0, audioReactivity: 0.5, zoom: 0.25, smoothing: 0.15 },
    spotlightColor: 0xffffff
  };
  let themeSpotlight = null;  // Track-specific accent spotlight
  let currentTrackScene = null;  // Custom scene for current track
  const TrackScenes = window.TrackScenes || null;
  const EnvironmentMode = window.EnvironmentMode || null;
  let environmentInstance = null; // Themed environment instance
  let currentTrackTitle = null; // Track title for environment theming

  function applyTrackTheme(track) {
    if (!track) return;

    const theme = TRACK_THEMES[track.title] || DEFAULT_THEME;
    console.log("Applying track theme:", track.title, "->", theme.name || "default");

    // Store current track title for environment mode
    currentTrackTitle = track.title;

    // Reset session high score for new track
    resetSessionHighScore();

    // Apply color theme
    if (theme.colorTheme) {
      applyTheme(theme.colorTheme, { persist: false });
    }

    // Apply environment visualization mode
    applyVizMode();

    // Apply visualization parameters
    if (theme.vizParams) {
      const p = theme.vizParams;
      if (typeof p.amplitude === "number") vizParams.amplitude = clamp(p.amplitude, 0.2, 3);
      if (typeof p.speed === "number") vizParams.speed = clamp(p.speed, 0.25, 2);
      if (typeof p.audioReactivity === "number") vizParams.audioReactivity = clamp(p.audioReactivity, 0, 1);
      if (typeof p.zoom === "number") vizParams.zoom = clamp(p.zoom, 0.25, 2);
      if (typeof p.smoothing === "number") vizParams.smoothing = clamp(p.smoothing, 0, 0.95);

      // Update UI slider to reflect new value
      if (vizReactivity) vizReactivity.value = String(Math.round(vizParams.audioReactivity * 100));
      updateVizParamDisplays();

      // Apply smoothing to analyser
      if (analyser) {
        analyser.smoothingTimeConstant = vizParams.smoothing;
      }
    }

    // Apply spotlight color (if Three.js is ready)
    if (theme.spotlightColor !== undefined && themeSpotlight && three) {
      themeSpotlight.color.setHex(theme.spotlightColor);
    }

    // Apply 3D model (deferred until Three.js is ready)
    if (theme.model && typeof loadModel === "function") {
      if (modelSelect) {
        modelSelect.value = theme.model;
      }
      loadModel(theme.model);
    }

    // Build custom track scene (if available and Three.js is ready)
    if (TrackScenes && threeReady && threeScene && three) {
      // Dispose previous custom scene
      if (currentTrackScene) {
        currentTrackScene.dispose();
        currentTrackScene = null;
      }

      // Build new custom scene for this track
      currentTrackScene = TrackScenes.build(track.title, three, threeScene, { freqData, timeData });
      console.log("Custom track scene built:", track.title, currentTrackScene ? "success" : "not available");
    }

    // Change environment theme when track changes (for existing environment instance)
    if (EnvironmentMode && environmentInstance) {
      EnvironmentMode.changeTrack(track.title);
      console.log("Environment theme changed to:", track.title);
    }

    // Update high score display for the new track
    updateHighScoreDisplay();
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
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

  // ---- Accessibility: Screen reader announcements ----
  const ariaStatus = $("ariaStatus");

  function announceToScreenReader(message) {
    if (!ariaStatus) return;
    ariaStatus.textContent = message;
    setTimeout(() => { ariaStatus.textContent = ""; }, 1500);
  }

  // ---- Immersive UI Functions ----

  function setTrackDisplay(track) {
    if (!track) {
      trackTitle.textContent = "No tracks loaded";
      trackArtist.textContent = "";
      nowPlayingCover.style.backgroundImage = "";
      nowPlayingCover.classList.remove("has-cover");
      return;
    }

    const title = (track.title || "").trim() || deriveTitleFromUrl(track.url);
    const artist = (track.artist || "").trim();

    trackTitle.textContent = title;
    trackArtist.textContent = artist || "Unknown Artist";

    if (track.coverUrl) {
      nowPlayingCover.style.backgroundImage = `url('${track.coverUrl}')`;
      nowPlayingCover.classList.add("has-cover");
    } else {
      nowPlayingCover.style.backgroundImage = "";
      nowPlayingCover.classList.remove("has-cover");
    }
  }

  // ---- Loading Overlay Functions ----
  const loadingOverlay = $("loadingOverlay");
  const loadingTitle = $("loadingTitle");
  const loadingBarFill = $("loadingBarFill");
  const loadingStatus = $("loadingStatus");

  function showLoadingOverlay(trackTitle) {
    if (!loadingOverlay) return;
    loadingOverlay.style.display = "flex";
    if (loadingTitle) loadingTitle.textContent = trackTitle || "Loading Track";
    if (loadingBarFill) loadingBarFill.style.width = "0%";
    if (loadingStatus) loadingStatus.textContent = "Preparing...";
  }

  function updateLoadingProgress(loaded, total, currentItem) {
    if (!loadingOverlay) return;
    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
    if (loadingBarFill) loadingBarFill.style.width = percent + "%";
    if (loadingStatus) loadingStatus.textContent = currentItem || `Loading ${loaded}/${total}`;
  }

  function hideLoadingOverlay() {
    if (!loadingOverlay) return;
    // Fade out smoothly
    loadingOverlay.style.opacity = "0";
    loadingOverlay.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      loadingOverlay.style.display = "none";
      loadingOverlay.style.opacity = "1";
      loadingOverlay.style.transition = "";
    }, 500);
  }

  // Helper functions for unified playback state (audio or stems)
  function getPlaybackDuration() {
    if (usingStemPlayer && stemPlayer) {
      return stemPlayer.getDuration() || 0;
    }
    return audio.duration || 0;
  }

  function getPlaybackCurrentTime() {
    if (usingStemPlayer && stemPlayer) {
      return stemPlayer.getCurrentTime() || 0;
    }
    return audio.currentTime || 0;
  }

  function isPlaybackPaused() {
    if (usingStemPlayer && stemPlayer) {
      return !stemPlayer.isPlaying;
    }
    return audio.paused;
  }

  function setPlaybackCurrentTime(time) {
    if (usingStemPlayer && stemPlayer) {
      stemPlayer.seek(time);
    } else {
      audio.currentTime = time;
    }
  }

  function updateTimeUi() {
    const dur = getPlaybackDuration();
    const cur = getPlaybackCurrentTime();

    currentTimeEl.textContent = formatTime(cur);
    durationEl.textContent = formatTime(dur);

    if (!isSeeking && Number.isFinite(dur) && dur > 0) {
      const progress = (cur / dur) * 100;
      seek.value = String(Math.round((cur / dur) * 1000));
      seek.style.setProperty("--progress", `${progress}%`);
    }

    // Update lyrics sync
    updateLyricsDisplay(cur);
  }

  // ---- Lyrics Display ----
  const lyricsOverlay = document.getElementById("lyricsOverlay");
  const lyricsSectionEl = document.getElementById("lyricsSection");
  const lyricsCurrentEl = document.getElementById("lyricsCurrent");
  const lyricsNextEl = document.getElementById("lyricsNext");

  function updateLyricsDisplay(currentTime) {
    if (!lyricsData || lyricsData.length === 0) {
      if (lyricsOverlay) lyricsOverlay.classList.remove("is-visible");
      return;
    }

    // Find the current lyric based on time
    let newIndex = -1;
    for (let i = lyricsData.length - 1; i >= 0; i--) {
      if (currentTime >= lyricsData[i].time) {
        newIndex = i;
        break;
      }
    }

    // Only update DOM if the lyric changed
    if (newIndex !== currentLyricIndex) {
      currentLyricIndex = newIndex;

      if (newIndex >= 0) {
        const current = lyricsData[newIndex];
        const next = lyricsData[newIndex + 1];

        // Show section headers separately
        if (current.type === "section") {
          lyricsSectionEl.textContent = current.text;
          lyricsCurrentEl.textContent = "";
        } else {
          // Find the most recent section
          let sectionText = "";
          for (let i = newIndex; i >= 0; i--) {
            if (lyricsData[i].type === "section") {
              sectionText = lyricsData[i].text;
              break;
            }
          }
          lyricsSectionEl.textContent = sectionText;
          lyricsCurrentEl.textContent = current.text;
        }

        // Show next lyric (skip section headers for preview)
        if (next && next.type !== "section") {
          lyricsNextEl.textContent = next.text;
        } else if (next && lyricsData[newIndex + 2]) {
          lyricsNextEl.textContent = lyricsData[newIndex + 2].text || "";
        } else {
          lyricsNextEl.textContent = "";
        }

        lyricsOverlay.classList.add("is-visible");
      } else {
        lyricsSectionEl.textContent = "";
        lyricsCurrentEl.textContent = "";
        lyricsNextEl.textContent = "";
        lyricsOverlay.classList.remove("is-visible");
      }
    }
  }

  function clearLyricsDisplay() {
    lyricsData = null;
    currentLyricIndex = -1;
    if (lyricsOverlay) lyricsOverlay.classList.remove("is-visible");
    if (lyricsSectionEl) lyricsSectionEl.textContent = "";
    if (lyricsCurrentEl) lyricsCurrentEl.textContent = "";
    if (lyricsNextEl) lyricsNextEl.textContent = "";
  }

  function updatePlayPauseBtn() {
    const isPlaying = !isPlaybackPaused();
    playPauseBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
    playPauseBtn.classList.toggle("is-playing", isPlaying);
    playPauseBtn.innerHTML = isPlaying ? "&#x23F8;" : "&#x25B6;";
  }

  function updateVizPauseState() {
    if (bgVizCanvas) {
      bgVizCanvas.classList.toggle("is-paused", isPlaybackPaused());
    }
    // Update iOS visualization
    if (iosViz) {
      iosViz.setPlaying(!isPlaybackPaused());
    }
  }

  function updateVolumeIcon() {
    const vol = audio.muted ? 0 : audio.volume;
    if (vol === 0) {
      volumeBtn.innerHTML = "&#x1F507;"; // muted
    } else if (vol < 0.5) {
      volumeBtn.innerHTML = "&#x1F509;"; // low
    } else {
      volumeBtn.innerHTML = "&#x1F50A;"; // high
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

      li.draggable = true;

      items.push(li);
    }

    playlistEl.replaceChildren(...items);
  }

  // ---- Playlist Modal ----

  function openPlaylist() {
    // Close other panels
    if (vizSettingsOpen) closeVizSettings();

    playlistOpen = true;
    playlistModal.hidden = false;
    // Trigger reflow for animation
    void playlistModal.offsetWidth;
    playlistModal.classList.add("is-open");
    playlistBtn.setAttribute("aria-expanded", "true");
    closePlaylistBtn.focus();
    announceToScreenReader("Playlist opened");
    document.addEventListener("keydown", handleModalKeydown);
  }

  function closePlaylist() {
    playlistOpen = false;
    playlistModal.classList.remove("is-open");
    playlistBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", handleModalKeydown);

    setTimeout(() => {
      if (!playlistOpen) {
        playlistModal.hidden = true;
      }
    }, 300);

    playlistBtn.focus();
    announceToScreenReader("Playlist closed");
  }

  function handleModalKeydown(e) {
    if (e.key === "Escape") {
      closePlaylist();
      return;
    }

    // Focus trap
    if (e.key !== "Tab") return;

    const focusable = playlistModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ---- Visualizer Settings Panel ----

  function loadVizParams() {
    try {
      const saved = localStorage.getItem(VIZ_PARAMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.amplitude === "number") vizParams.amplitude = clamp(parsed.amplitude, 0.2, 3);
        if (typeof parsed.smoothing === "number") vizParams.smoothing = clamp(parsed.smoothing, 0, 0.95);
        if (typeof parsed.speed === "number") vizParams.speed = clamp(parsed.speed, 0.25, 2);
        if (typeof parsed.audioReactivity === "number") vizParams.audioReactivity = clamp(parsed.audioReactivity, 0, 1);
        if (typeof parsed.zoom === "number") vizParams.zoom = clamp(parsed.zoom, 0.25, 2);
      }
    } catch { /* ignore */ }

    // Sync reactivity slider with loaded value
    if (vizReactivity) vizReactivity.value = String(Math.round(vizParams.audioReactivity * 100));
    updateVizParamDisplays();
    applyVizSmoothing();
  }

  function saveVizParams() {
    try {
      localStorage.setItem(VIZ_PARAMS_STORAGE_KEY, JSON.stringify(vizParams));
    } catch { /* ignore */ }
  }

  function updateVizParamDisplays() {
    if (reactivityValue) {
      reactivityValue.textContent = `${Math.round(vizParams.audioReactivity * 100)}%`;
    }
  }

  function applyVizSmoothing() {
    if (analyser) {
      analyser.smoothingTimeConstant = vizParams.smoothing;
    }
  }

  function applyVizZoom() {
    if (!threeReady || !threeCamera) return;
    // Skip zoom adjustment during environment mode (it has its own camera)
    if (bgVizMode === "environment") return;
    // Base position is (0, -1.2, 9.5), zoom affects distance from target
    // Higher zoom = closer, lower zoom = further
    const baseDistance = 9.5;
    const targetDistance = baseDistance / vizParams.zoom;

    if (orbitControls) {
      // When OrbitControls is active, adjust the camera distance while keeping the direction
      const direction = threeCamera.position.clone().sub(orbitControls.target).normalize();
      threeCamera.position.copy(orbitControls.target).add(direction.multiplyScalar(targetDistance));
      orbitControls.update();
    } else {
      threeCamera.position.z = targetDistance;
    }
    threeCamera.updateProjectionMatrix();
  }

  function handleVizSettingsClickOutside(e) {
    const target = /** @type {HTMLElement} */ (e.target);
    if (!vizSettings.contains(target) && !vizSettingsBtn.contains(target)) {
      closeVizSettings();
    }
  }

  function openVizSettings() {
    vizSettingsOpen = true;
    vizSettings.hidden = false;
    void vizSettings.offsetWidth;
    vizSettings.classList.add("is-open");
    vizSettingsBtn.setAttribute("aria-expanded", "true");
    setTimeout(() => {
      document.addEventListener("click", handleVizSettingsClickOutside);
    }, 10);
  }

  function closeVizSettings() {
    vizSettingsOpen = false;
    vizSettings.classList.remove("is-open");
    vizSettingsBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", handleVizSettingsClickOutside);
    setTimeout(() => {
      if (!vizSettingsOpen) vizSettings.hidden = true;
    }, 200);
  }

  function resetVizParams() {
    vizParams.amplitude = 0.3;
    vizParams.smoothing = 0.15;
    vizParams.speed = 2.0;
    vizParams.audioReactivity = 1.0;
    vizParams.zoom = 0.25;
    if (vizReactivity) vizReactivity.value = "100";
    updateVizParamDisplays();
    applyVizSmoothing();
    saveVizParams();
    // Reset model selection
    if (modelSelect) {
      modelSelect.value = "";
      unloadCurrentModel();
    }
  }

  // ---- 3D Model Management ----
  const MODEL_STORAGE_KEY = "mysongs-selected-model";

  function initModelSelect() {
    if (!modelSelect) return;

    // Load available models from window.MODELS
    availableModels = Array.isArray(window.MODELS) ? window.MODELS : [];

    // Populate the select dropdown
    modelSelect.innerHTML = '<option value="">None</option>';
    availableModels.forEach((model) => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.name;
      modelSelect.appendChild(option);
    });

    // Restore saved selection
    const savedModelId = localStorage.getItem(MODEL_STORAGE_KEY);
    if (savedModelId && availableModels.some((m) => m.id === savedModelId)) {
      modelSelect.value = savedModelId;
    }

    // Handle selection changes
    modelSelect.addEventListener("change", () => {
      const modelId = modelSelect.value;
      localStorage.setItem(MODEL_STORAGE_KEY, modelId);
      if (modelId) {
        loadModel(modelId);
      } else {
        unloadCurrentModel();
      }
    });
  }

  function loadModel(modelId) {
    if (!gltfLoader || !threeScene || !three) {
      console.warn("Cannot load model: Three.js or GLTFLoader not ready");
      return;
    }

    const modelConfig = availableModels.find((m) => m.id === modelId);
    if (!modelConfig) {
      console.warn("Model not found:", modelId);
      return;
    }

    // Unload current model first
    unloadCurrentModel();

    // Increment load ID to track this request
    modelLoadId++;
    const thisLoadId = modelLoadId;

    console.log("Loading model:", modelConfig.name, "loadId:", thisLoadId);

    gltfLoader.load(
      modelConfig.url,
      (gltf) => {
        // Ignore if a newer load was started
        if (thisLoadId !== modelLoadId) {
          console.log("Ignoring stale model load:", modelConfig.name);
          // Dispose the loaded model since we don't need it
          gltf.scene.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          return;
        }

        console.log("Model loaded successfully:", modelConfig.name);
        currentModel = gltf.scene;
        currentModelId = modelId;

        // Apply scale
        const scale = modelConfig.scale || 1;
        currentModel.scale.set(scale, scale, scale);

        // Apply position
        const pos = modelConfig.position || [0, 0, 0];
        currentModel.position.set(pos[0], pos[1], pos[2]);

        // Apply rotation if specified
        if (modelConfig.rotation) {
          currentModel.rotation.set(
            modelConfig.rotation[0],
            modelConfig.rotation[1],
            modelConfig.rotation[2]
          );
        }

        // Add to scene
        threeScene.add(currentModel);

        // Setup animation mixer if model has animations
        if (gltf.animations && gltf.animations.length > 0) {
          currentModelMixer = new three.AnimationMixer(currentModel);
          // Play all animations
          gltf.animations.forEach((clip) => {
            const action = currentModelMixer.clipAction(clip);
            action.play();
          });
          console.log(`Playing ${gltf.animations.length} animation(s)`);
        }

        // Initialize model overrides from config
        modelOverrides.scale = modelConfig.scale || 1;
        modelOverrides.posY = modelConfig.position?.[1] || 0;
        modelOverrides.rotY = modelConfig.rotation?.[1] ? (modelConfig.rotation[1] * 180 / Math.PI) : 0;
        modelOverrides.animSpeed = modelConfig.animationSpeed || 1;
        modelOverrides.scalePulse = !modelConfig.noScalePulse;

        // Update UI sliders
        updateModelSettingsUI();
        showModelSettings(true);
      },
      (progress) => {
        if (progress.total > 0) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Loading model: ${pct}%`);
        }
      },
      (error) => {
        console.error("Error loading model:", error);
        currentModel = null;
        currentModelId = null;
      }
    );
  }

  function unloadCurrentModel() {
    console.log("unloadCurrentModel called, currentModelId:", currentModelId);
    if (currentModel && threeScene) {
      console.log("Removing model from scene");
      threeScene.remove(currentModel);
      // Dispose of geometries and materials
      currentModel.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    if (currentModelMixer) {
      currentModelMixer.stopAllAction();
      currentModelMixer = null;
    }
    currentModel = null;
    currentModelId = null;
    showModelSettings(false);
  }

  function showModelSettings(show) {
    const groups = [modelSettingsGroup, modelPosYGroup, modelRotYGroup, modelAnimSpeedGroup];
    groups.forEach((g) => {
      if (g) g.hidden = !show;
    });
  }

  function updateModelSettingsUI() {
    if (modelScaleSlider) {
      modelScaleSlider.value = String(modelOverrides.scale);
      if (modelScaleValue) modelScaleValue.textContent = modelOverrides.scale.toFixed(1);
    }
    if (modelPosYSlider) {
      modelPosYSlider.value = String(modelOverrides.posY);
      if (modelPosYValue) modelPosYValue.textContent = modelOverrides.posY.toFixed(1);
    }
    if (modelRotYSlider) {
      modelRotYSlider.value = String(modelOverrides.rotY);
      if (modelRotYValue) modelRotYValue.textContent = `${Math.round(modelOverrides.rotY)}°`;
    }
    if (modelAnimSpeedSlider) {
      modelAnimSpeedSlider.value = String(modelOverrides.animSpeed);
      if (modelAnimSpeedValue) modelAnimSpeedValue.textContent = `${modelOverrides.animSpeed.toFixed(1)}x`;
    }
    if (scalePulseCheckbox) {
      scalePulseCheckbox.checked = modelOverrides.scalePulse;
    }
  }

  function applyModelOverrides() {
    if (!currentModel) return;

    // Apply scale (base scale, pulse is applied in render loop)
    currentModel.scale.setScalar(modelOverrides.scale);

    // Apply Y position
    currentModel.position.y = modelOverrides.posY;

    // Apply Y rotation (convert degrees to radians)
    currentModel.rotation.y = modelOverrides.rotY * Math.PI / 180;
  }

  function copySettingsToClipboard() {
    console.log("copySettingsToClipboard called, currentModelId:", currentModelId);
    const modelConfig = availableModels.find((m) => m.id === currentModelId);

    let textToCopy;

    if (!currentModelId || !modelConfig) {
      // No model selected - copy just vizParams
      textToCopy = `// Viz params
{
  amplitude: ${vizParams.amplitude},
  smoothing: ${vizParams.smoothing},
  speed: ${vizParams.speed},
  audioReactivity: ${vizParams.audioReactivity},
  zoom: ${vizParams.zoom},
}`;
    } else {
      // Format as JS object for direct paste into models.js
      const scalePulseLine = !modelOverrides.scalePulse ? ",\n    noScalePulse: true" : "";
      textToCopy = `  {
    id: "${currentModelId}",
    name: "${modelConfig.name || currentModelId}",
    url: "${modelConfig.url}",
    scale: ${modelOverrides.scale.toFixed(2)},
    position: [0, ${modelOverrides.posY.toFixed(2)}, 0],
    rotation: [0, ${(modelOverrides.rotY * Math.PI / 180).toFixed(3)}, 0],
    animationSpeed: ${modelOverrides.animSpeed.toFixed(2)}${scalePulseLine}
  },`;
    }

    console.log("Text to copy:", textToCopy);

    // Try clipboard API first, fallback to prompt
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log("Copied to clipboard successfully");
        if (copySettingsBtn) {
          copySettingsBtn.textContent = "Copied!";
          setTimeout(() => { copySettingsBtn.textContent = "Copy Settings JSON"; }, 1500);
        }
      }).catch((err) => {
        console.warn("Clipboard API failed:", err);
        fallbackCopy(textToCopy);
      });
    } else {
      fallbackCopy(textToCopy);
    }
  }

  function fallbackCopy(text) {
    // Fallback: use a temporary textarea
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      console.log("Fallback copy succeeded");
      if (copySettingsBtn) {
        copySettingsBtn.textContent = "Copied!";
        setTimeout(() => { copySettingsBtn.textContent = "Copy Settings JSON"; }, 1500);
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      // Last resort: show in prompt
      window.prompt("Copy this (Ctrl+C):", text);
    }
    document.body.removeChild(textarea);
  }

  // Initialize viz params
  loadVizParams();

  // Initialize model select dropdown (populate options immediately)
  initModelSelect();

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

      const items = [...playlistEl.querySelectorAll(".wa-item:not(.is-dragging):not(.wa-item--placeholder)")];
      const placeholderIndex = items.indexOf(placeholder.nextElementSibling?.closest(".wa-item"));
      let newIndex = placeholderIndex === -1 ? tracks.length - 1 : placeholderIndex;

      if (draggedIndex < newIndex) {
        newIndex = Math.max(0, newIndex);
      }

      if (draggedIndex !== newIndex && draggedIndex >= 0 && draggedIndex < tracks.length) {
        const [removed] = tracks.splice(draggedIndex, 1);
        tracks.splice(newIndex, 0, removed);

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

  // ---- Audio Graph (WebAudio for visualization) ----

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
      analyser.smoothingTimeConstant = vizParams.smoothing;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      freqData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);
    } catch (err) {
      audioCtx = null;
      analyser = null;
      freqData = null;
      timeData = null;
    }
  }

  // iOS-specific audio graph (bypasses canUseWebAudioViz check)
  function ensureIOSAudioGraph() {
    if (!isIOS) return;
    if (audioCtx && analyser && freqData) return;

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
      const source = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8; // Smoother for iOS
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      freqData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);
      console.log("iOS audio graph created successfully");
    } catch (err) {
      console.warn("iOS audio graph failed:", err);
      audioCtx = null;
      analyser = null;
      freqData = null;
      timeData = null;
    }
  }

  // iOS visualization update - feeds audio data to iOS viz
  let iosVizRaf = 0;
  function updateIOSViz() {
    if (!iosViz || !isIOS) return;

    // Get frequency data if available
    let bass = 0, mid = 0, treble = 0, energy = 0;

    if (analyser && freqData) {
      analyser.getByteFrequencyData(freqData);

      // Calculate frequency bands (same logic as main viz)
      const avgBins = (start, end) => {
        const s = Math.max(0, Math.floor(start));
        const e = Math.min(freqData.length, Math.floor(end));
        const n = Math.max(1, e - s);
        let sum = 0;
        for (let i = s; i < e; i++) sum += freqData[i] || 0;
        return sum / (n * 255);
      };

      energy = avgBins(0, freqData.length);
      bass = avgBins(0, Math.max(6, Math.floor(freqData.length * 0.08)));
      mid = avgBins(Math.floor(freqData.length * 0.12), Math.floor(freqData.length * 0.45));
      treble = avgBins(Math.floor(freqData.length * 0.55), freqData.length);
    }

    iosViz.setAudioData(bass, mid, treble, energy);
  }

  function startIOSVizLoop() {
    if (!isIOS || !iosViz) return;
    if (iosVizRaf) return;

    const loop = () => {
      iosVizRaf = requestAnimationFrame(loop);
      updateIOSViz();
    };
    iosVizRaf = requestAnimationFrame(loop);
  }

  function stopIOSVizLoop() {
    if (iosVizRaf) {
      cancelAnimationFrame(iosVizRaf);
      iosVizRaf = 0;
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

  // ---- Score Management ----
  let pendingHighScore = null;
  let sessionHighScore = 0;  // Peak score during current run

  function updateScoreHUD(score, combo) {
    if (scoreValue) scoreValue.textContent = String(score);
    if (comboValue) comboValue.textContent = String(combo);

    // Update session high if current score exceeds it
    if (score > sessionHighScore) {
      sessionHighScore = score;
      if (highScoreValue) highScoreValue.textContent = String(sessionHighScore);
    }

    // Update combo display intensity based on combo level
    if (comboDisplay) {
      // Remove all combo level classes
      comboDisplay.classList.remove('combo-low', 'combo-mid', 'combo-high', 'combo-max');

      // Add appropriate class based on combo level
      if (combo >= 8) {
        comboDisplay.classList.add('combo-max');
      } else if (combo >= 5) {
        comboDisplay.classList.add('combo-high');
      } else if (combo >= 3) {
        comboDisplay.classList.add('combo-mid');
      } else if (combo >= 2) {
        comboDisplay.classList.add('combo-low');
      }
    }
  }

  function showGateHitFeedback(combo, streak, comboIncreased, sizeTier) {
    // Score values by size tier
    const scoreBySize = { small: 100, medium: 50, large: 25 };
    const baseScore = scoreBySize[sizeTier] || 35;
    const totalScore = baseScore * combo;

    // Flash the hit feedback element
    if (hitFeedback) {
      if (comboIncreased) {
        hitFeedback.textContent = `${combo}x COMBO!`;
      } else if (sizeTier === 'small') {
        hitFeedback.textContent = `+${totalScore} GOLD!`;
      } else {
        hitFeedback.textContent = `+${totalScore}`;
      }

      hitFeedback.className = 'hit-feedback gate-hit';
      if (comboIncreased) hitFeedback.classList.add('combo-up');
      if (combo >= 5) hitFeedback.classList.add('high-combo');
      if (sizeTier === 'small') hitFeedback.classList.add('gold-ring');

      // Force reflow to restart animation
      void hitFeedback.offsetWidth;
      hitFeedback.classList.add('show');

      setTimeout(() => {
        hitFeedback.classList.remove('show');
      }, 400);
    }

    // Pulse the combo display
    if (comboDisplay) {
      comboDisplay.classList.add('pulse');
      setTimeout(() => comboDisplay.classList.remove('pulse'), 150);
    }
  }

  function updateFlowHUD(flow, gateStreak) {
    const pct = Math.round(clamp(Number(flow) || 0, 0, 1) * 100);
    if (flowValue) flowValue.textContent = `${pct}%`;
    if (flowBarFill) flowBarFill.style.width = `${pct}%`;
    if (gateStreakValue) gateStreakValue.textContent = String(Math.max(0, Number(gateStreak) || 0));
  }

  let runSummaryTimer = 0;
  function hideRunSummary() {
    if (!runSummary) return;
    runSummary.hidden = true;
    if (runSummaryTimer) {
      clearTimeout(runSummaryTimer);
      runSummaryTimer = 0;
    }
  }

  function showRunSummary(summary) {
    if (!runSummary || !summary) return;
    if (runRank) runRank.textContent = String(summary.rank || 'B');
    if (runFlowAvg) runFlowAvg.textContent = `${Math.round(clamp(Number(summary.flowAvg) || 0, 0, 1) * 100)}%`;
    if (runGateAcc) runGateAcc.textContent = `${Math.round(clamp(Number(summary.gateAccuracy) || 0, 0, 1) * 100)}%`;
    if (runGateStreakMax) runGateStreakMax.textContent = String(Math.max(0, Number(summary.gateStreakMax) || 0));

    runSummary.hidden = false;
    if (runSummaryTimer) clearTimeout(runSummaryTimer);
    runSummaryTimer = setTimeout(hideRunSummary, 8000);
  }

  function resetSessionHighScore() {
    sessionHighScore = 0;
    if (highScoreValue) highScoreValue.textContent = '0';
  }

  function updateHighScoreDisplay() {
    // Now shows session high, initialized to 0
    if (highScoreValue) highScoreValue.textContent = String(sessionHighScore);
  }

  function showHitFeedback(pointsLost) {
    if (hitFeedback) {
      hitFeedback.classList.add('active');
      setTimeout(() => hitFeedback.classList.remove('active'), 200);
    }
  }

  function showHighScoreModal(score, trackTitle) {
    if (!highScoreModal || !EnvironmentMode) return;

    // Check if it's a high score
    if (!EnvironmentMode.isHighScore(trackTitle, score)) {
      return;  // Not a high score, skip modal
    }

    pendingHighScore = { score, trackTitle };

    if (finalScoreDisplay) finalScoreDisplay.textContent = String(score);
    if (finalTrackDisplay) finalTrackDisplay.textContent = trackTitle;
    if (initialsInput) initialsInput.value = '';

    // Show current leaderboard
    updateLeaderboardDisplay(trackTitle);

    highScoreModal.hidden = false;
    if (initialsInput) initialsInput.focus();
  }

  function hideHighScoreModal() {
    if (highScoreModal) highScoreModal.hidden = true;
    pendingHighScore = null;
  }

  function saveHighScore() {
    if (!pendingHighScore || !EnvironmentMode || !initialsInput) return;

    const initials = initialsInput.value.trim() || 'AAA';
    EnvironmentMode.saveHighScore(pendingHighScore.trackTitle, initials, pendingHighScore.score);
    updateHighScoreDisplay();
    hideHighScoreModal();
  }

  function updateLeaderboardDisplay(trackTitle) {
    if (!leaderboardDisplay || !EnvironmentMode) return;

    const scores = EnvironmentMode.getHighScores(trackTitle);
    if (scores.length === 0) {
      leaderboardDisplay.innerHTML = '';
      return;
    }

    let html = '<h3>Leaderboard</h3>';
    scores.forEach((entry, i) => {
      html += `
        <div class="leaderboard-entry">
          <span class="leaderboard-rank">${i + 1}.</span>
          <span class="leaderboard-initials">${entry.initials}</span>
          <span class="leaderboard-score">${entry.score}</span>
        </div>
      `;
    });
    leaderboardDisplay.innerHTML = html;
  }

  // High score modal event handlers
  if (saveScoreBtn) {
    saveScoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveHighScore();
    });
  }
  if (skipScoreBtn) {
    skipScoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideHighScoreModal();
    });
  }
  if (initialsInput) {
    initialsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveHighScore();
      if (e.key === 'Escape') hideHighScoreModal();
    });
  }
  // Close modal when clicking backdrop (outside content)
  if (highScoreModal) {
    highScoreModal.addEventListener('click', (e) => {
      if (e.target === highScoreModal) {
        hideHighScoreModal();
      }
    });
  }

  if (runSummary) {
    runSummary.addEventListener('click', () => {
      hideRunSummary();
    });
  }

  function syncThreeVizMode() {
    if (!threeReady || !threeModes || !bgVizCanvas) return;

    const on = bgVizMode !== "off";
    bgVizCanvas.classList.toggle("is-on", on);

    // Environment mode is the only visualization mode
    const isEnvironment = bgVizMode === "environment";

    // Dispose environment if switching away from it
    if (environmentInstance && !isEnvironment) {
      if (EnvironmentMode) EnvironmentMode.dispose();
      environmentInstance = null;
      console.log("Environment disposed");
    }

    // Initialize environment mode
    if (isEnvironment && !environmentInstance && EnvironmentMode && three && threeScene && threeCamera && threeRenderer) {
      environmentInstance = EnvironmentMode.init(three, threeScene, threeCamera, threeRenderer, currentTrackTitle, gltfLoader);
      console.log("Environment mode initialized for track:", currentTrackTitle);

      // Build track scene now that Three.js is ready (if not already built)
      if (TrackScenes && !currentTrackScene && currentTrackTitle) {
        currentTrackScene = TrackScenes.build(currentTrackTitle, three, threeScene, { freqData, timeData });
        console.log("Track scene built after Three.js ready:", currentTrackTitle, currentTrackScene ? "success" : "not available");
      }

      // Set up score callbacks
      EnvironmentMode.setScoreCallback((score, combo) => {
        updateScoreHUD(score, combo);
      });
      EnvironmentMode.setHitCallback((pointsLost) => {
        showHitFeedback(pointsLost);
      });
      EnvironmentMode.setFlowCallback((payload) => {
        if (!payload) return;
        updateFlowHUD(payload.flow, payload.gateStreak);
      });
      EnvironmentMode.setGateHitCallback((combo, streak, comboIncreased, sizeTier) => {
        showGateHitFeedback(combo, streak, comboIncreased, sizeTier);
      });

      // Update high score display
      updateHighScoreDisplay();
    }

    // Show/hide score HUD based on environment mode
    if (scoreHud) {
      scoreHud.style.display = isEnvironment ? 'flex' : 'none';
    }

    // Disable OrbitControls during environment mode
    if (orbitControls) {
      orbitControls.enabled = !isEnvironment;
    }

    for (const [mode, cfg] of Object.entries(threeModes)) {
      if (!cfg?.group) continue;
      cfg.group.visible = on && mode === bgVizMode && !isEnvironment;
    }

    if (threeCore) {
      threeCore.visible = false; // Core no longer used
    }

    if (threeStars) {
      threeStars.visible = on && !isEnvironment;
    }

    // Hide 3D model during environment mode
    if (currentModel) {
      currentModel.visible = !isEnvironment;
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

    const amplitude = vizParams.amplitude;

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

    // Use stem analysis if available (provides per-stem data)
    // Also build per-stem visualization data with configs from manifest
    let stemVizData = null;
    if (usingStemPlayer && stemPlayer) {
      stemAnalysisData = stemPlayer.analyze();
      if (stemAnalysisData) {
        // Build per-stem visualization data with configs
        const manifest = stemPlayer.manifest;
        if (manifest && manifest.stems) {
          stemVizData = {};
          for (const [stemId, stemConfig] of Object.entries(manifest.stems)) {
            const analysis = stemAnalysisData[stemId];
            if (analysis && stemConfig.visualization) {
              stemVizData[stemId] = {
                analysis: analysis,
                viz: stemConfig.visualization
              };
            }
          }
          // Debug: log stem viz data once per track
          if (!window._stemVizLogged && Object.keys(stemVizData).length > 0) {
            console.log("[StemViz] Per-stem visualization active:", Object.keys(stemVizData));
            for (const [id, data] of Object.entries(stemVizData)) {
              console.log(`  ${id}: target=${data.viz.target}, effect=${data.viz.effect}`);
            }
            window._stemVizLogged = true;
          }
        }

        // Check if we have a single "mix" stem (no individual stems)
        if (stemAnalysisData.mix && !stemAnalysisData.drums) {
          // Single mix track - use mix analysis directly
          const mix = stemAnalysisData.mix;
          bass = mix.bass || 0;
          mid = mix.mid || 0;
          treble = mix.treble || 0;
          energy = mix.energy || 0;
        } else {
          // Combine stem analysis - drums and bass drive rhythm, others add texture
          const drums = stemAnalysisData.drums || { energy: 0, bass: 0, mid: 0, treble: 0 };
          const bassS = stemAnalysisData.bass || { energy: 0, bass: 0, mid: 0, treble: 0 };
          const guitar = stemAnalysisData.guitar || { energy: 0, bass: 0, mid: 0, treble: 0 };
          const vocals = stemAnalysisData.vocals || { energy: 0, bass: 0, mid: 0, treble: 0 };
          const synth = stemAnalysisData.synth || { energy: 0, bass: 0, mid: 0, treble: 0 };

          // Weighted combination - drums and bass have more impact
          bass = drums.bass * 0.4 + bassS.bass * 0.5 + synth.bass * 0.1;
          mid = guitar.mid * 0.3 + vocals.mid * 0.4 + synth.mid * 0.3;
          treble = guitar.treble * 0.3 + vocals.treble * 0.3 + synth.treble * 0.4;
          energy = drums.energy * 0.3 + bassS.energy * 0.2 + guitar.energy * 0.2 + vocals.energy * 0.2 + synth.energy * 0.1;
        }
      }
    } else if (analyser && freqData) {
      analyser.getByteFrequencyData(freqData);
      energy = avgBins(0, freqData.length);
      bass = avgBins(0, Math.max(6, Math.floor(freqData.length * 0.08)));
      mid = avgBins(Math.floor(freqData.length * 0.12), Math.floor(freqData.length * 0.45));
      treble = avgBins(Math.floor(freqData.length * 0.55), Math.floor(freqData.length * 0.92));
    }

    // ---- Audio-reactive speed calculation ----
    const reactivity = vizParams.audioReactivity;
    let bassHit = false;

    if (reactivity > 0) {
      // Calculate spectral flux (rate of change in energy) for "busyness"
      const energyDelta = energy - lastEnergyForSpeed;
      spectralFlux = spectralFlux * 0.88 + Math.abs(energyDelta) * 0.12;
      lastEnergyForSpeed = energy;

      // Beat detection - detect bass hits for speed bursts
      bassHit = bass > 0.5 && bass > lastBassForSpeed + 0.1;
      if (bassHit) {
        globalBeatPulse = Math.min(globalBeatPulse + 0.35, 1.0);
      }
      globalBeatPulse *= 0.93; // Smooth decay
      lastBassForSpeed = bass;

      // Target speed calculation:
      // - Base: energy maps 0→0.35 to 1→1.1 (silence slows down, loud speeds up)
      // - Beat pulse adds transient bursts
      // - Spectral flux adds responsiveness to dynamic/busy audio
      // - Mid/treble activity adds extra liveliness
      const energySpeed = 0.35 + energy * 0.75;
      const beatBoost = globalBeatPulse * 0.5;
      const fluxBoost = spectralFlux * 2.0;
      const harmonyBoost = (mid * 0.15 + treble * 0.1);

      const targetAudioSpeed = clamp(
        energySpeed + beatBoost + fluxBoost + harmonyBoost,
        0.25,  // Minimum during silence (still moves, just slower)
        1.8    // Maximum during intense sections
      );

      // Asymmetric smoothing: fast attack, slow release
      // This makes beats feel punchy while silence fades gracefully
      const smoothUp = 0.18;   // Quick response to louder audio
      const smoothDown = 0.025; // Gradual slowdown during quiet parts
      const smooth = targetAudioSpeed > audioSpeedMultiplier ? smoothUp : smoothDown;
      audioSpeedMultiplier += (targetAudioSpeed - audioSpeedMultiplier) * smooth;
    } else {
      // No reactivity - gradually return to base speed
      audioSpeedMultiplier += (1.0 - audioSpeedMultiplier) * 0.05;
    }

    // Blend between static speed and audio-reactive speed
    const effectiveSpeed = vizParams.speed * (
      (1 - reactivity) + reactivity * audioSpeedMultiplier
    );

    // Apply speed modifier to time
    const t = nowMs * 0.001 * effectiveSpeed;
    const dt = threeLastNowMs ? clamp((nowMs - threeLastNowMs) * 0.001 * effectiveSpeed, 0, 0.05) : 0.016;
    threeLastNowMs = nowMs;

    if (threeStars) {
      threeStars.rotation.y = -t * 0.03;
      threeStars.rotation.x = -0.08;
    }

    // Update environment mode with audio data
    if (bgVizMode === "environment" && EnvironmentMode) {
      EnvironmentMode.update(dt, {
        bass: bass,
        mid: mid,
        treble: treble,
        energy: energy,
        beatPulse: globalBeatPulse,
        beatHit: bassHit,
        stemVizData: stemVizData  // Per-stem visualization data
      });

      // Update EffectsManager with audio data and ship position
      if (typeof EffectsManager !== 'undefined') {
        EffectsManager.setAudioData({ bass, mid, treble, energy });
        // Pass per-stem visualization data if available
        if (stemVizData) {
          EffectsManager.setStemVizData(stemVizData);
        }
        const shipPos = EnvironmentMode.getShipPosition();
        if (shipPos) {
          EffectsManager.setShipPosition(shipPos);
        }
        EffectsManager.render(t, dt);

        // Apply screen shake to camera
        if (effectsConfig.visual.screenShake) {
          const shake = EffectsManager.getShakeOffset();
          if (threeCamera && shake) {
            threeCamera.position.x += shake.x;
            threeCamera.position.y += shake.y;
          }
        }
      }
    }

    // Update custom track scene (snow, particles, etc.)
    if (currentTrackScene && currentTrackScene.update) {
      const shipPos = EnvironmentMode ? EnvironmentMode.getShipPosition() : null;
      const shipSpeed = EnvironmentMode ? EnvironmentMode.getShipSpeed() : 0;
      // Pass drum/percussion energy for scene object pulsing
      const drumEnergy = stemAnalysisData?.drums?.energy || 0;
      const percussionEnergy = stemAnalysisData?.percussion?.energy || 0;
      const drumPulse = Math.max(drumEnergy, percussionEnergy);
      currentTrackScene.update(t, freqData, amplitude, shipPos, shipSpeed, { drumPulse, stemAnalysisData });
    }

    // Update OrbitControls for smooth damping
    if (orbitControls && orbitControls.enabled) {
      orbitControls.update();
    }

    // Update 3D model animations with audio reactivity
    if (currentModelMixer && currentModel) {
      // Audio-reactive animation speed using modelOverrides
      const baseAnimSpeed = modelOverrides.animSpeed;
      const energyMod = 0.5 + energy * 1.0;
      const beatMod = 1 + globalBeatPulse * 0.8;
      const animSpeed = baseAnimSpeed * energyMod * beatMod * effectiveSpeed;

      currentModelMixer.update(dt * animSpeed);

      // Scale pulse with bass (if enabled via modelOverrides)
      if (modelOverrides.scalePulse) {
        const pulse = 1 + bass * 0.1 * amplitude;
        currentModel.scale.setScalar(modelOverrides.scale * pulse);
      }
    }

    // Render animated background first (if environment mode is active)
    if (bgVizMode === "environment" && EnvironmentMode) {
      EnvironmentMode.renderBackground();
      // Don't clear color buffer so background shows through
      threeRenderer.autoClearColor = false;
      threeRenderer.render(threeScene, threeCamera);
      threeRenderer.autoClearColor = true;
    } else {
      threeRenderer.render(threeScene, threeCamera);
    }
  }

  async function ensureThreeViz() {
    console.log("ensureThreeViz called");
    console.log("canUseWebAudioViz:", canUseWebAudioViz(), "| prefersReducedMotion:", prefersReducedMotion, "| isIOS:", isIOS);
    if (!canUseWebAudioViz()) {
      console.log("WebAudio viz disabled");
      return false;
    }
    if (!bgVizCanvas) {
      console.log("No bgVizCanvas found");
      return false;
    }
    if (threeReady) {
      console.log("Three already ready");
      return true;
    }
    if (threeInitPromise) {
      console.log("Three init already in progress");
      return threeInitPromise;
    }

    console.log("Starting Three.js initialization...");
    threeInitPromise = (async () => {
      try {
        console.log("Importing Three.js from:", THREE_CDN);
        const mod = await import(THREE_CDN);
        console.log("Three.js imported successfully");
        three = mod;

        // Try to load OrbitControls separately - visualization works without it
        let OrbitControls = null;
        try {
          const orbitMod = await import(ORBIT_CONTROLS_CDN);
          OrbitControls = orbitMod.OrbitControls;
          if (OrbitControls) {
            console.log("OrbitControls loaded successfully");
          } else {
            console.warn("OrbitControls module loaded but OrbitControls class not found. Keys:", Object.keys(orbitMod));
          }
        } catch (orbitErr) {
          console.warn("OrbitControls failed to load, camera interaction disabled:", orbitErr);
        }

        // Try to load GLTFLoader for 3D model support
        let GLTFLoader = null;
        try {
          const gltfMod = await import(GLTF_LOADER_CDN);
          GLTFLoader = gltfMod.GLTFLoader;
          if (GLTFLoader) {
            console.log("GLTFLoader loaded successfully");
          } else {
            console.warn("GLTFLoader module loaded but GLTFLoader class not found");
          }
        } catch (gltfErr) {
          console.warn("GLTFLoader failed to load, 3D model support disabled:", gltfErr);
        }

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
          AnimationMixer,
        } = mod;

        // Initialize GLTFLoader if available
        if (GLTFLoader) {
          gltfLoader = new GLTFLoader();
        }

        threeRenderer = new WebGLRenderer({
          canvas: bgVizCanvas,
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        });
        threeRenderer.setClearAlpha(0);
        threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

        try {
          if (mod.SRGBColorSpace && "outputColorSpace" in threeRenderer) {
            threeRenderer.outputColorSpace = mod.SRGBColorSpace;
          }
        } catch { /* ignore */ }

        threeScene = new Scene();
        threeCamera = new PerspectiveCamera(60, 1, 0.1, 120);
        threeCamera.position.set(0, -1.2, 9.5);
        threeCamera.lookAt(0, 0.5, 0); // Look upward toward the ceiling

        // Initialize OrbitControls for interactive camera manipulation (if loaded)
        if (OrbitControls) {
          try {
            orbitControls = new OrbitControls(threeCamera, bgVizCanvas);
            orbitControls.enableDamping = true;
            orbitControls.dampingFactor = 0.08;
            orbitControls.enableZoom = true;
            orbitControls.zoomSpeed = 0.8;
            orbitControls.enablePan = true;
            orbitControls.panSpeed = 0.6;
            orbitControls.rotateSpeed = 0.5;
            orbitControls.minDistance = 2;
            orbitControls.maxDistance = 30;
            orbitControls.target.set(0, 0.5, 0); // Match the lookAt target

            // Enable pointer events on the canvas for OrbitControls
            bgVizCanvas.classList.add("has-orbit-controls");
            console.log("OrbitControls initialized successfully");
          } catch (initErr) {
            console.warn("Failed to initialize OrbitControls:", initErr);
            orbitControls = null;
          }
        }

        const ambient = new AmbientLight(0xffffff, 0.55);
        const dir = new DirectionalLight(0xffffff, 0.85);
        dir.position.set(4, 5, 3);
        const dir2 = new DirectionalLight(0xffffff, 0.35);
        dir2.position.set(-4, 2, -5);

        // Track-specific colored spotlight for accent lighting
        const { SpotLight } = mod;
        themeSpotlight = new SpotLight(0xffffff, 2.0, 50, Math.PI / 6, 0.5, 1);
        themeSpotlight.position.set(0, 10, 5);
        themeSpotlight.target.position.set(0, 0, 0);

        threeScene.add(ambient, dir, dir2, themeSpotlight, themeSpotlight.target);

        threeGroup = new Group();
        threeScene.add(threeGroup);

        const accent = new Color(getCssVar("--wa-accent", vizPalette.accent));
        threeThemeTargets = [];
        threeModes = null;
        threeLastNowMs = 0;

        // Center "core" (wireframe knot)
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

        // Stars
        const starCount = 1100;
        const positions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i += 1) {
          const idx = i * 3;
          const r = 6 + Math.random() * 10;
          const theta = Math.random() * Math.PI * 2;
          const u = Math.random() * 2 - 1;
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

        // --- Mode: Wave Grid (Ceiling) ---
        const gridGroup = new Group();
        threeGroup.add(gridGroup);
        const gridGeom = new PlaneGeometry(9.6, 9.6, 64, 64);
        gridGeom.rotateX(Math.PI / 2); // Rotate to horizontal plane facing down
        gridGeom.translate(0, 1.0, 0); // Position above as ceiling
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

        const gridUpdate = ({ t, freqData: f, energy, amplitude }) => {
          gridGroup.rotation.y = t * 0.12;
          if (!f || !f.length) return;

          const amp = amplitude || 1;

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
            // Push vertices downward (negative Y) for ceiling dripping effect
            // Amplitude controls how much the audio affects displacement
            gridPos.array[idx + 1] = gridBase[idx + 1] - (shaped * 1.6 * amp + wave) * fall;
          }
          gridPos.needsUpdate = true;
        };

        // --- Mode: Particle Nebula ---
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

        const nebulaUpdate = ({ t, freqData: f, energy, amplitude }) => {
          nebulaGroup.rotation.y = t * 0.22;
          nebulaGroup.rotation.x = -0.12;
          if (!f || !f.length) return;

          const ampMult = amplitude || 1;

          for (let i = 0; i < nebulaCount; i += 1) {
            const audioVal = (f[nebulaBinArr[i]] || 0) / 255;
            const shaped = Math.pow(audioVal, 1.6);
            const r = nebulaRadArr[i] * (0.65 + shaped * 1.8 * ampMult);
            const idx = i * 3;
            nebulaPosAttr.array[idx + 0] = nebulaDirArr[idx + 0] * r;
            nebulaPosAttr.array[idx + 1] = nebulaDirArr[idx + 1] * r;
            nebulaPosAttr.array[idx + 2] = nebulaDirArr[idx + 2] * r;
          }
          nebulaPosAttr.needsUpdate = true;
          nebulaMat.size = 0.04 + energy * 0.08 * ampMult;
        };

        // --- Mode: Oscilloscope Ring ---
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

        const scopeUpdate = ({ t, bass, amplitude, analyser: a, timeData: td }) => {
          scopeGroup.rotation.y = -t * 0.18;
          scopeGroup.rotation.x = -0.22;
          if (!a || !td || td.length < scopeN) return;
          a.getByteTimeDomainData(td);

          const ampMult = amplitude || 1;
          const baseR = 3.25;
          const ampR = (1.05 + bass * 0.8) * ampMult;
          for (let i = 0; i < scopeN; i += 1) {
            const s = (td[i] - 128) / 128;
            const r = baseR + s * ampR;
            const y = s * 0.9 * ampMult;
            const ang = scopeAngles[i];
            const idx = i * 3;
            scopePosAttr.array[idx + 0] = Math.cos(ang) * r;
            scopePosAttr.array[idx + 1] = y * 0.45;
            scopePosAttr.array[idx + 2] = Math.sin(ang) * r;
          }
          scopePosAttr.needsUpdate = true;
        };

        // --- Mode: Voyage (Cosmic terrain + starfield journey) ---
        const voyageGroup = new Group();
        threeGroup.add(voyageGroup);

        // Terrain mesh - scrolling plane with frequency-based displacement
        const terrainSegW = 80;
        const terrainSegH = 60;
        const terrainW = 24;
        const terrainH = 40;
        const terrainGeom = new PlaneGeometry(terrainW, terrainH, terrainSegW, terrainSegH);
        terrainGeom.rotateX(-Math.PI / 2); // Lay flat
        terrainGeom.translate(0, -2.5, -5); // Position below and ahead

        // Create vertex colors for rainbow spectrum
        const terrainVertCount = terrainGeom.getAttribute("position").count;
        const terrainColors = new Float32Array(terrainVertCount * 3);
        terrainGeom.setAttribute("color", new Float32BufferAttribute(terrainColors, 3));

        const terrainMat = new MeshBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.75,
          wireframe: true,
          blending: AdditiveBlending,
        });
        const terrainMesh = new Mesh(terrainGeom, terrainMat);
        voyageGroup.add(terrainMesh);

        const terrainPos = /** @type {any} */ (terrainGeom.getAttribute("position"));
        const terrainCol = /** @type {any} */ (terrainGeom.getAttribute("color"));
        const terrainBaseY = new Float32Array(terrainPos.count);
        const terrainBaseZ = new Float32Array(terrainPos.count);
        for (let i = 0; i < terrainPos.count; i++) {
          terrainBaseY[i] = terrainPos.array[i * 3 + 1];
          terrainBaseZ[i] = terrainPos.array[i * 3 + 2];
        }

        // Starfield for voyage - particles rushing toward camera
        const voyageStarCount = 1500;
        const voyageStarPos = new Float32Array(voyageStarCount * 3);
        const voyageStarCol = new Float32Array(voyageStarCount * 3);
        const voyageStarBaseZ = new Float32Array(voyageStarCount);
        const voyageStarSpeed = new Float32Array(voyageStarCount);

        for (let i = 0; i < voyageStarCount; i++) {
          const idx = i * 3;
          // Spread stars in a wide tunnel around the view
          const angle = Math.random() * Math.PI * 2;
          const radius = 1.5 + Math.random() * 8;
          voyageStarPos[idx + 0] = Math.cos(angle) * radius;
          voyageStarPos[idx + 1] = -1 + Math.random() * 6; // Mostly above terrain
          voyageStarPos[idx + 2] = -30 + Math.random() * 60; // Spread along Z
          voyageStarBaseZ[i] = voyageStarPos[idx + 2];
          voyageStarSpeed[i] = 0.3 + Math.random() * 0.7; // Variable speed for depth
          // Initial white color
          voyageStarCol[idx + 0] = 1;
          voyageStarCol[idx + 1] = 1;
          voyageStarCol[idx + 2] = 1;
        }

        const voyageStarGeom = new BufferGeometry();
        voyageStarGeom.setAttribute("position", new Float32BufferAttribute(voyageStarPos, 3));
        voyageStarGeom.setAttribute("color", new Float32BufferAttribute(voyageStarCol, 3));

        const voyageStarMat = new PointsMaterial({
          size: 0.08,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          blending: AdditiveBlending,
          depthWrite: false,
        });

        const voyageStars = new Points(voyageStarGeom, voyageStarMat);
        voyageGroup.add(voyageStars);

        const voyageStarPosAttr = /** @type {any} */ (voyageStarGeom.getAttribute("position"));
        const voyageStarColAttr = /** @type {any} */ (voyageStarGeom.getAttribute("color"));

        // Helper: HSL to RGB for rainbow colors
        const hslToRgb = (h, s, l) => {
          const c = (1 - Math.abs(2 * l - 1)) * s;
          const x = c * (1 - Math.abs((h * 6) % 2 - 1));
          const m = l - c / 2;
          let r = 0, g = 0, b = 0;
          if (h < 1/6) { r = c; g = x; b = 0; }
          else if (h < 2/6) { r = x; g = c; b = 0; }
          else if (h < 3/6) { r = 0; g = c; b = x; }
          else if (h < 4/6) { r = 0; g = x; b = c; }
          else if (h < 5/6) { r = x; g = 0; b = c; }
          else { r = c; g = 0; b = x; }
          return [r + m, g + m, b + m];
        };

        // Voyage state for scroll position and beat detection
        let voyageScroll = 0;
        let voyageBeatPulse = 0;
        let voyageLastBass = 0;

        const voyageUpdate = ({ t, dt, bass, mid, treble, energy, amplitude, freqData: f }) => {
          if (!f || !f.length) return;

          const ampMult = amplitude || 1;

          // Beat detection - detect bass hits for speed bursts
          const bassHit = bass > 0.6 && bass > voyageLastBass + 0.15;
          if (bassHit) {
            voyageBeatPulse = Math.min(voyageBeatPulse + 0.5, 1.5);
          }
          voyageBeatPulse *= 0.92; // Decay
          voyageLastBass = bass;

          // Scroll speed based on energy + beat pulses
          const baseSpeed = 4;
          const scrollSpeed = baseSpeed * (0.6 + energy * 0.8 + voyageBeatPulse * 2);
          voyageScroll += dt * scrollSpeed;

          // Update terrain vertices
          const segW1 = terrainSegW + 1;
          const segH1 = terrainSegH + 1;
          const freqBinCount = f.length;

          for (let i = 0; i < terrainPos.count; i++) {
            const idx = i * 3;
            const col = i % segW1;
            const row = Math.floor(i / segW1);

            // X position determines frequency bin (left = bass, right = treble)
            const u = col / terrainSegW;
            const freqIdx = Math.floor(u * freqBinCount * 0.8);
            const freqVal = (f[freqIdx] || 0) / 255;
            const shaped = Math.pow(freqVal, 1.4);

            // Z position for scrolling - wrap around
            const baseZ = terrainBaseZ[i];
            let z = baseZ + voyageScroll;
            // Wrap terrain to create infinite scroll
            const halfH = terrainH / 2;
            while (z > halfH + 10) z -= terrainH;

            // Height based on frequency + wave
            const wave = Math.sin(t * 0.8 + u * 4 + (baseZ + voyageScroll) * 0.3) * 0.3;
            const height = shaped * 3.5 * ampMult + wave * energy;

            terrainPos.array[idx + 1] = terrainBaseY[i] + height;
            terrainPos.array[idx + 2] = z;

            // Rainbow color based on frequency position
            const hue = u * 0.8; // Full spectrum across width
            const brightness = 0.4 + shaped * 0.6;
            const [r, g, b] = hslToRgb(hue, 0.9, brightness);
            terrainCol.array[idx + 0] = r;
            terrainCol.array[idx + 1] = g;
            terrainCol.array[idx + 2] = b;
          }
          terrainPos.needsUpdate = true;
          terrainCol.needsUpdate = true;

          // Update starfield - rush toward camera
          const starSpeed = 15 * (0.5 + energy * 1.0 + voyageBeatPulse * 3);
          for (let i = 0; i < voyageStarCount; i++) {
            const idx = i * 3;

            // Move toward camera (positive Z)
            voyageStarPosAttr.array[idx + 2] += dt * starSpeed * voyageStarSpeed[i];

            // Reset stars that pass the camera
            if (voyageStarPosAttr.array[idx + 2] > 15) {
              voyageStarPosAttr.array[idx + 2] = -30;
              // Randomize position when reset
              const angle = Math.random() * Math.PI * 2;
              const radius = 1.5 + Math.random() * 8;
              voyageStarPosAttr.array[idx + 0] = Math.cos(angle) * radius;
              voyageStarPosAttr.array[idx + 1] = -1 + Math.random() * 6;
            }

            // Color stars based on their position (rainbow gradient)
            const zNorm = (voyageStarPosAttr.array[idx + 2] + 30) / 45;
            const hue = (zNorm * 0.7 + t * 0.1) % 1;
            const [r, g, b] = hslToRgb(hue, 0.85, 0.55 + energy * 0.25);
            voyageStarColAttr.array[idx + 0] = r;
            voyageStarColAttr.array[idx + 1] = g;
            voyageStarColAttr.array[idx + 2] = b;
          }
          voyageStarPosAttr.needsUpdate = true;
          voyageStarColAttr.needsUpdate = true;

          // Star size pulses with beat
          voyageStarMat.size = 0.06 + energy * 0.06 + voyageBeatPulse * 0.08;

          // Subtle camera shake on big beats (optional - affects the whole scene)
          voyageGroup.rotation.x = Math.sin(t * 2) * 0.01 * voyageBeatPulse;
          voyageGroup.rotation.z = Math.cos(t * 1.7) * 0.008 * voyageBeatPulse;
        };

        threeModes = {
          grid: { group: gridGroup, update: gridUpdate },
          nebula: { group: nebulaGroup, update: nebulaUpdate },
          scope: { group: scopeGroup, update: scopeUpdate },
          voyage: { group: voyageGroup, update: voyageUpdate },
        };

        threeReady = true;
        console.log("Three.js initialization complete!");
        resizeThreeRenderer();
        refreshThreeTheme();
        applyVizZoom();
        syncThreeVizMode();

        // Initialize EffectsManager
        if (typeof EffectsManager !== 'undefined') {
          // Three.js is loaded via dynamic `import(...)` (ES module), so there is no global `THREE`.
          // Pass the imported module instead.
          EffectsManager.init(mod, threeScene, threeCamera);
          EffectsManager.update(effectsConfig);
          console.log("EffectsManager initialized");
        }

        // Load saved model if one was selected (dropdown already populated on page load)
        const savedModelId = localStorage.getItem(MODEL_STORAGE_KEY);
        if (savedModelId && availableModels.some((m) => m.id === savedModelId)) {
          loadModel(savedModelId);
        }

        return true;
      } catch (err) {
        console.error("Three.js initialization failed:", err);
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
        themeSpotlight = null;
        if (currentTrackScene) {
          currentTrackScene.dispose();
          currentTrackScene = null;
        }
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

      // Update time UI when using stem player (no native timeupdate event)
      if (usingStemPlayer && stemPlayer && stemPlayer.isPlaying) {
        updateTimeUi();
      }

      if (threeReady && bgVizMode !== "off") {
        resizeThreeRenderer();
        drawVizThree(now);
      }
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
    } catch { /* ignore */ }
  }

  // ---- URL Track Linking ----

  /** Convert track title to URL-friendly slug */
  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/['']/g, '')  // Remove apostrophes
      .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '');  // Trim leading/trailing hyphens
  }

  /** Find track index by slug */
  function findTrackBySlug(slug) {
    if (!slug) return -1;
    const normalizedSlug = slug.toLowerCase();
    return tracks.findIndex(t => {
      const trackSlug = slugify(t.title || '');
      return trackSlug === normalizedSlug;
    });
  }

  /** Update URL hash with current track */
  function updateUrlHash(track) {
    if (!track || !track.title) return;
    const slug = slugify(track.title);
    if (slug) {
      history.replaceState(null, '', `#${slug}`);
    }
  }

  /** Get track slug from URL hash */
  function getTrackSlugFromUrl() {
    const hash = window.location.hash;
    return hash ? hash.slice(1) : null;
  }

  // ---- Playback Functions ----

  async function loadTrack(index, { autoplay = false } = {}) {
    if (!tracks.length) return;
    const safeIndex = clamp(index, 0, tracks.length - 1);
    currentIndex = safeIndex;
    const t = tracks[currentIndex];

    setTrackDisplay(t);
    updatePlaylistUi();
    updateMediaSession();

    seek.value = "0";
    seek.style.setProperty("--progress", "0%");

    // Clean up previous stem player if exists
    if (stemPlayer) {
      stemPlayer.dispose();
      stemPlayer = null;
      usingStemPlayer = false;
      stemAnalysisData = null;
    }

    // Clear lyrics from previous track
    clearLyricsDisplay();

    // Check if track has stems
    if (t.stemsManifest && window.StemPlayer) {
      try {
        console.log("Loading stems for:", t.title);

        // Show loading overlay
        showLoadingOverlay(t.title);
        updateLoadingProgress(0, 100, "Loading manifest...");

        // Ensure audio context exists
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        stemPlayer = new window.StemPlayer(audioCtx);

        // Cache-bust manifest URL to ensure fresh load
        const manifestUrl = t.stemsManifest + '?v=' + Date.now();
        updateLoadingProgress(5, 100, "Loading audio stems...");

        // Use progress callback for real-time loading updates
        await stemPlayer.loadFromManifest(manifestUrl, (loaded, total, current) => {
          // Scale progress from 5-65% during stem loading
          const percent = 5 + Math.round((loaded / total) * 60);
          updateLoadingProgress(percent, 100, `Loading ${current}...`);
        });

        updateLoadingProgress(70, 100, "Loading MIDI data...");
        await stemPlayer.loadAllMidi();

        // Load lyrics if available
        updateLoadingProgress(85, 100, "Loading lyrics...");
        lyricsData = null;
        currentLyricIndex = -1;
        if (stemPlayer.manifest?.lyrics) {
          try {
            const lyricsUrl = t.stemsManifest.substring(0, t.stemsManifest.lastIndexOf('/') + 1) + stemPlayer.manifest.lyrics + '?v=' + Date.now();
            const lyricsResp = await fetch(lyricsUrl);
            if (lyricsResp.ok) {
              const lyricsJson = await lyricsResp.json();
              lyricsData = lyricsJson.lyrics || [];
              console.log("Lyrics loaded:", lyricsData.length, "lines");
            }
          } catch (lyricsErr) {
            console.warn("Failed to load lyrics:", lyricsErr);
          }
        }

        updateLoadingProgress(95, 100, "Initializing...");

        // Set up MIDI event listener for visualization triggers
        stemPlayer.on('midiNote', (event) => {
          // Could trigger visual effects based on note events
          if (event.type === 'noteOn' && event.stemId === 'drums') {
            globalBeatPulse = Math.min(globalBeatPulse + 0.4, 1.0);
          }
        });

        usingStemPlayer = true;
        console.log("Stems loaded successfully:", stemPlayer.getStemIds());

        // Enable minimal effects for stem visualization to work
        // These effects are modulated by stem analysis in EffectsManager
        if (!effectsConfig.aurora.enabled) {
          effectsConfig.aurora.enabled = true;
          effectsConfig.aurora.intensity = 0.4;
          effectsConfig.aurora.ribbons = 4;
        }
        if (!effectsConfig.particles.enabled) {
          effectsConfig.particles.enabled = true;
          effectsConfig.particles.type = 'dust';
          effectsConfig.particles.count = 200;
          effectsConfig.particles.size = 0.4;
          effectsConfig.particles.speed = 0.5;
        }
        if (!effectsConfig.grid.enabled) {
          effectsConfig.grid.enabled = true;
          effectsConfig.grid.intensity = 0.3;
          effectsConfig.grid.floor = true;
          effectsConfig.grid.perspective = true;
        }
        // Apply updated effects config
        applyEffectsToEnvironment();
        console.log("Stem visualization effects enabled");

        updateLoadingProgress(100, 100, "Ready!");

        // Pause regular audio (we won't use it)
        audio.pause();
        audio.src = '';
      } catch (err) {
        console.error("Failed to load stems, falling back to regular audio:", err);
        hideLoadingOverlay();
        if (stemPlayer) {
          stemPlayer.dispose();
          stemPlayer = null;
        }
        usingStemPlayer = false;
      }
    }

    // Fall back to regular audio if no stems or stems failed
    if (!usingStemPlayer && t.url) {
      audio.src = t.url;
      audio.currentTime = 0;
      audio.load();
    }

    // Apply track-specific theme (model, colors, viz mode)
    applyTrackTheme(t);

    // Update URL with track slug
    updateUrlHash(t);

    // Hide loading overlay now that track is ready
    hideLoadingOverlay();

    if (autoplay) {
      void play();
    }
  }

  function selectRandomModel() {
    if (!availableModels.length) return;

    // Pick a random model (different from current if possible)
    let newModelId;
    if (availableModels.length === 1) {
      newModelId = availableModels[0].id;
    } else {
      const otherModels = availableModels.filter((m) => m.id !== currentModelId);
      const pick = otherModels[Math.floor(Math.random() * otherModels.length)];
      newModelId = pick.id;
    }

    // Update the dropdown and load the model
    if (modelSelect) {
      modelSelect.value = newModelId;
    }
    localStorage.setItem(MODEL_STORAGE_KEY, newModelId);
    loadModel(newModelId);
  }

  async function play() {
    console.log("play() called");
    if (!tracks.length) {
      announceToScreenReader("No tracks. Add audio files to play.");
      return;
    }

    if (currentIndex < 0 || currentIndex >= tracks.length) {
      currentIndex = 0;
    }

    if (!audio.src && !usingStemPlayer) {
      await loadTrack(currentIndex, { autoplay: false });
    }

    if (canUseWebAudioViz()) {
      console.log("Calling viz functions from play()...");
      if (!usingStemPlayer) {
        ensureAudioGraph();
      }
      startVizLoop();
      void ensureThreeViz();
      await tryResumeAudioContext();
    } else if (isIOS && iosViz) {
      // iOS: set up audio-reactive visualization
      console.log("Setting up iOS audio-reactive viz...");
      ensureIOSAudioGraph();
      startIOSVizLoop();
      // Resume audio context (requires user gesture on iOS)
      if (audioCtx && audioCtx.state !== "running") {
        try { await audioCtx.resume(); } catch { /* ignore */ }
      }
    } else {
      stopVizLoop();
    }

    try {
      if (usingStemPlayer && stemPlayer) {
        stemPlayer.play();
        updatePlayPauseBtn();
        updateVizPauseState();
        updatePlaylistUi();
        announceToScreenReader(`Now playing: ${trackLabel(tracks[currentIndex])}`);
      } else {
        await audio.play();
        updatePlayPauseBtn();
        updateVizPauseState();
        updatePlaylistUi();
        announceToScreenReader(`Now playing: ${trackLabel(tracks[currentIndex])}`);
      }
    } catch (err) {
      announceToScreenReader("Playback blocked. Tap play again.");
    }
  }

  function pause() {
    if (usingStemPlayer && stemPlayer) {
      stemPlayer.pause();
    } else {
      audio.pause();
    }
    stopVizLoop();
    stopIOSVizLoop();
    updatePlayPauseBtn();
    updateVizPauseState();
    updatePlaylistUi();
  }

  function stop() {
    audio.pause();
    audio.currentTime = 0;
    stopVizLoop();
    stopIOSVizLoop();
    updatePlayPauseBtn();
    updateVizPauseState();
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
    const msg = repeatMode === "off" ? "Repeat off" : repeatMode === "all" ? "Repeat all" : "Repeat one";
    announceToScreenReader(msg);
  }

  function toggleShuffle() {
    shuffle = !shuffle;
    updateButtonsUi();
    announceToScreenReader(`Shuffle ${shuffle ? "on" : "off"}`);
  }

  function updateButtonsUi() {
    if (shuffleBtn) shuffleBtn.setAttribute("aria-pressed", String(shuffle));
    if (repeatBtn) {
      if (repeatMode === "off") {
        repeatBtn.setAttribute("aria-pressed", "false");
        repeatBtn.innerHTML = "&#x1F501;";
      } else if (repeatMode === "all") {
        repeatBtn.setAttribute("aria-pressed", "true");
        repeatBtn.innerHTML = "&#x1F501;";
      } else {
        repeatBtn.setAttribute("aria-pressed", "true");
        repeatBtn.innerHTML = "&#x1F502;";
      }
    }
  }

  function clearPlaylist() {
    stop();
    setTrackDisplay(null);
    announceToScreenReader("Playlist cleared");

    for (const t of tracks) {
      if (t._objectUrl) {
        try {
          URL.revokeObjectURL(t._objectUrl);
        } catch { /* ignore */ }
      }
    }

    tracks = [];
    currentIndex = -1;
    audio.removeAttribute("src");
    audio.load();
    updatePlaylistUi();
    updateTimeUi();
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
    }

    announceToScreenReader(`Added ${newTracks.length} track${newTracks.length > 1 ? "s" : ""}`);
  }

  // ---- Media Session API ----
  function setMediaSessionPlaybackState() {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
    } catch { /* ignore */ }
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
    } catch { /* ignore */ }
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
    } catch { /* ignore */ }
  }

  initMediaSession();

  // ---- Initialize UI ----
  updateButtonsUi();
  updatePlaylistUi();
  updateTimeUi();
  updateVolumeIcon();

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
    audio.volume = 1;
    volume.value = "100";
    volume.style.setProperty("--progress", "100%");
  }

  // Check URL hash for track to load
  if (tracks.length) {
    const urlSlug = getTrackSlugFromUrl();
    const urlTrackIndex = findTrackBySlug(urlSlug);

    if (urlTrackIndex >= 0) {
      // Load track from URL and attempt autoplay
      loadTrack(urlTrackIndex, { autoplay: true });
    } else {
      loadTrack(currentIndex, { autoplay: false });
    }
  } else {
    setTrackDisplay(null);
  }

  // Handle browser back/forward navigation
  window.addEventListener('hashchange', () => {
    const slug = getTrackSlugFromUrl();
    const idx = findTrackBySlug(slug);
    if (idx >= 0 && idx !== currentIndex) {
      loadTrack(idx, { autoplay: !audio.paused });
    }
  });

  // ---- Event Listeners ----

  // Play/Pause button
  playPauseBtn.addEventListener("click", () => {
    if (isPlaybackPaused()) {
      void play();
    } else {
      pause();
    }
  });

  // Track navigation
  if (nextBtn) nextBtn.addEventListener("click", () => next({ autoplay: true }));
  if (prevBtn) prevBtn.addEventListener("click", () => prev({ autoplay: true }));
  if (shuffleBtn) shuffleBtn.addEventListener("click", toggleShuffle);
  if (repeatBtn) repeatBtn.addEventListener("click", cycleRepeatMode);

  // Volume
  volumeBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    updateVolumeIcon();
    announceToScreenReader(audio.muted ? "Muted" : "Unmuted");
  });

  volume.addEventListener("input", () => {
    const v = clamp(Number(volume.value) / 100, 0, 1);
    audio.volume = v;
    audio.muted = false;
    // Also set stem player volume if active
    if (usingStemPlayer && stemPlayer) {
      stemPlayer.setMasterVolume(v);
    }
    volume.style.setProperty("--progress", `${v * 100}%`);
    localStorage.setItem(VOLUME_STORAGE_KEY, String(v));
    updateVolumeIcon();
  });

  // Seek
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
    const dur = getPlaybackDuration();
    if (!Number.isFinite(dur) || dur <= 0) return;
    const ratio = clamp(Number(seek.value) / 1000, 0, 1);
    setPlaybackCurrentTime(ratio * dur);
    updateTimeUi();
  });

  // Playlist modal
  playlistBtn.addEventListener("click", () => {
    playlistOpen ? closePlaylist() : openPlaylist();
  });
  playlistBackdrop.addEventListener("click", closePlaylist);
  closePlaylistBtn.addEventListener("click", closePlaylist);

  // Add/clear tracks
  addBtn.addEventListener("click", () => filePicker.click());
  filePicker.addEventListener("change", () => {
    if (!filePicker.files) return;
    addTracksFromFiles(filePicker.files);
    filePicker.value = "";
  });
  clearBtn.addEventListener("click", clearPlaylist);

  // Filter
  filterInput.addEventListener("input", updatePlaylistUi);

  // Game settings
  vizSettingsBtn.addEventListener("click", () => {
    vizSettingsOpen ? closeVizSettings() : openVizSettings();
  });
  closeVizSettingsBtn.addEventListener("click", closeVizSettings);


  // Audio reactivity slider
  if (vizReactivity) {
    vizReactivity.addEventListener("input", () => {
      vizParams.audioReactivity = clamp(Number(vizReactivity.value) / 100, 0, 1);
      updateVizParamDisplays();
      saveVizParams();
    });
  }

  // Racer model selector
  if (racerModelSelect) {
    // Load saved model selection
    const savedModel = localStorage.getItem('mysongs-racer-model') || 'white-eagle';
    racerModelSelect.value = savedModel;
    // If the saved value isn't available in the (restricted) dropdown, fall back.
    if (racerModelSelect.value !== savedModel) {
      racerModelSelect.value = 'white-eagle';
      localStorage.setItem('mysongs-racer-model', 'white-eagle');
    }

    racerModelSelect.addEventListener("change", () => {
      const modelId = racerModelSelect.value;
      if (EnvironmentMode) {
        EnvironmentMode.setRacerModel(modelId);
      }
    });
  }

  // Cruise speed slider
  if (cruiseSpeedSlider) {
    // Load saved speed
    const savedSpeed = parseFloat(localStorage.getItem('mysongs-cruise-speed') || '1.0');
    cruiseSpeedSlider.value = String(Math.round(savedSpeed * 100));
    if (cruiseSpeedValue) cruiseSpeedValue.textContent = savedSpeed.toFixed(1) + 'x';

    cruiseSpeedSlider.addEventListener("input", () => {
      const multiplier = Number(cruiseSpeedSlider.value) / 100;
      if (cruiseSpeedValue) cruiseSpeedValue.textContent = multiplier.toFixed(1) + 'x';
      if (EnvironmentMode) {
        EnvironmentMode.setSpeedMultiplier(multiplier);
      }
    });
  }

  // Flight control sliders
  if (lateralLimitSlider) {
    lateralLimitSlider.addEventListener("input", () => {
      const val = Number(lateralLimitSlider.value);
      if (lateralLimitValue) lateralLimitValue.textContent = String(val);
      if (EnvironmentMode) EnvironmentMode.setFlightConfig('lateralLimit', val);
    });
  }

  if (minAltitudeSlider) {
    minAltitudeSlider.addEventListener("input", () => {
      const val = Number(minAltitudeSlider.value) / 10;
      if (minAltitudeValue) minAltitudeValue.textContent = val.toFixed(1);
      if (EnvironmentMode) EnvironmentMode.setFlightConfig('flightMinY', val);
    });
  }

  if (maxAltitudeSlider) {
    maxAltitudeSlider.addEventListener("input", () => {
      const val = Number(maxAltitudeSlider.value);
      if (maxAltitudeValue) maxAltitudeValue.textContent = String(val);
      if (EnvironmentMode) EnvironmentMode.setFlightConfig('flightMaxY', val);
    });
  }

  if (steerResponseSlider) {
    steerResponseSlider.addEventListener("input", () => {
      const val = Number(steerResponseSlider.value);
      if (steerResponseValue) steerResponseValue.textContent = String(val);
      if (EnvironmentMode) EnvironmentMode.setFlightConfig('steerResponse', val);
    });
  }

  if (verticalResponseSlider) {
    verticalResponseSlider.addEventListener("input", () => {
      const val = Number(verticalResponseSlider.value);
      if (verticalResponseValue) verticalResponseValue.textContent = String(val);
      if (EnvironmentMode) EnvironmentMode.setFlightConfig('verticalResponse', val);
    });
  }

  if (bankAngleSlider) {
    bankAngleSlider.addEventListener("input", () => {
      const val = Number(bankAngleSlider.value) / 100;
      if (bankAngleValue) bankAngleValue.textContent = Math.round(val * 100) + '%';
      if (EnvironmentMode) EnvironmentMode.setFlightConfig('bankAngle', val);
    });
  }

  // Model settings sliders (kept for future use)
  if (modelScaleSlider) {
    modelScaleSlider.addEventListener("input", () => {
      modelOverrides.scale = clamp(Number(modelScaleSlider.value), 0.1, 5);
      if (modelScaleValue) modelScaleValue.textContent = modelOverrides.scale.toFixed(1);
      applyModelOverrides();
    });
  }

  if (modelPosYSlider) {
    modelPosYSlider.addEventListener("input", () => {
      modelOverrides.posY = clamp(Number(modelPosYSlider.value), -5, 5);
      if (modelPosYValue) modelPosYValue.textContent = modelOverrides.posY.toFixed(1);
      applyModelOverrides();
    });
  }

  if (modelRotYSlider) {
    modelRotYSlider.addEventListener("input", () => {
      modelOverrides.rotY = clamp(Number(modelRotYSlider.value), 0, 360);
      if (modelRotYValue) modelRotYValue.textContent = `${Math.round(modelOverrides.rotY)}°`;
      applyModelOverrides();
    });
  }

  if (modelAnimSpeedSlider) {
    modelAnimSpeedSlider.addEventListener("input", () => {
      modelOverrides.animSpeed = clamp(Number(modelAnimSpeedSlider.value), 0, 3);
      if (modelAnimSpeedValue) modelAnimSpeedValue.textContent = `${modelOverrides.animSpeed.toFixed(1)}x`;
    });
  }

  if (scalePulseCheckbox) {
    scalePulseCheckbox.addEventListener("change", () => {
      modelOverrides.scalePulse = scalePulseCheckbox.checked;
    });
  }

  if (copySettingsBtn) {
    copySettingsBtn.addEventListener("click", copySettingsToClipboard);
  }

  // ---- Effects Controls ----
  // Load saved effects on startup
  loadEffectsConfig();
  updateEffectsUI();

  // Lightning controls
  if (lightningEnabled) {
    lightningEnabled.addEventListener("change", () => {
      effectsConfig.lightning.enabled = lightningEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (lightningIntensity) {
    lightningIntensity.addEventListener("input", () => {
      effectsConfig.lightning.intensity = Number(lightningIntensity.value) / 100;
      if (lightningIntensityValue) lightningIntensityValue.textContent = lightningIntensity.value + '%';
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (lightningFrequency) {
    lightningFrequency.addEventListener("input", () => {
      effectsConfig.lightning.frequency = Number(lightningFrequency.value) / 100;
      if (lightningFrequencyValue) lightningFrequencyValue.textContent = lightningFrequency.value + '%';
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (lightningColor) {
    lightningColor.addEventListener("input", () => {
      effectsConfig.lightning.color = lightningColor.value;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }

  // Aurora controls
  if (auroraEnabled) {
    auroraEnabled.addEventListener("change", () => {
      effectsConfig.aurora.enabled = auroraEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (auroraIntensity) {
    auroraIntensity.addEventListener("input", () => {
      effectsConfig.aurora.intensity = Number(auroraIntensity.value) / 100;
      if (auroraIntensityValue) auroraIntensityValue.textContent = auroraIntensity.value + '%';
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (auroraSpeed) {
    auroraSpeed.addEventListener("input", () => {
      effectsConfig.aurora.speed = Number(auroraSpeed.value) / 100;
      if (auroraSpeedValue) auroraSpeedValue.textContent = auroraSpeed.value + '%';
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (auroraRibbons) {
    auroraRibbons.addEventListener("input", () => {
      effectsConfig.aurora.ribbons = Number(auroraRibbons.value);
      if (auroraRibbonsValue) auroraRibbonsValue.textContent = auroraRibbons.value;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }

  // Grid controls
  if (gridEnabled) {
    gridEnabled.addEventListener("change", () => {
      effectsConfig.grid.enabled = gridEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (gridIntensity) {
    gridIntensity.addEventListener("input", () => {
      effectsConfig.grid.intensity = Number(gridIntensity.value) / 100;
      if (gridIntensityValue) gridIntensityValue.textContent = gridIntensity.value + '%';
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (gridSpacing) {
    gridSpacing.addEventListener("input", () => {
      effectsConfig.grid.spacing = Number(gridSpacing.value);
      if (gridSpacingValue) gridSpacingValue.textContent = gridSpacing.value;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (gridFloor) {
    gridFloor.addEventListener("change", () => {
      effectsConfig.grid.floor = gridFloor.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (gridPerspective) {
    gridPerspective.addEventListener("change", () => {
      effectsConfig.grid.perspective = gridPerspective.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (gridColor) {
    gridColor.addEventListener("input", () => {
      effectsConfig.grid.color = gridColor.value;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }

  // Lights controls
  if (lightsEnabled) {
    lightsEnabled.addEventListener("change", () => {
      effectsConfig.lights.enabled = lightsEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (godRaysEnabled) {
    godRaysEnabled.addEventListener("change", () => {
      effectsConfig.lights.godRays = godRaysEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (pulseLights) {
    pulseLights.addEventListener("change", () => {
      effectsConfig.lights.pulse = pulseLights.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (godRayIntensity) {
    godRayIntensity.addEventListener("input", () => {
      effectsConfig.lights.godRayIntensity = Number(godRayIntensity.value) / 100;
      if (godRayIntensityValue) godRayIntensityValue.textContent = godRayIntensity.value + '%';
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }

  // Particles controls
  if (particlesEnabled) {
    particlesEnabled.addEventListener("change", () => {
      effectsConfig.particles.enabled = particlesEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (particleType) {
    particleType.addEventListener("change", () => {
      effectsConfig.particles.type = particleType.value;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (particleCount) {
    particleCount.addEventListener("input", () => {
      effectsConfig.particles.count = Number(particleCount.value);
      if (particleCountValue) particleCountValue.textContent = particleCount.value;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (particleSize) {
    particleSize.addEventListener("input", () => {
      effectsConfig.particles.size = Number(particleSize.value) / 100;
      if (particleSizeValue) particleSizeValue.textContent = (Number(particleSize.value) / 100).toFixed(1);
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (particleSpeed) {
    particleSpeed.addEventListener("input", () => {
      effectsConfig.particles.speed = Number(particleSpeed.value) / 100;
      if (particleSpeedValue) particleSpeedValue.textContent = (Number(particleSpeed.value) / 100).toFixed(1);
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }

  // Visual style controls
  if (fogDensity) {
    fogDensity.addEventListener("input", () => {
      effectsConfig.visual.fogDensity = Number(fogDensity.value) / 100;
      if (fogDensityValue) fogDensityValue.textContent = fogDensity.value + '%';
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (speedLinesIntensity) {
    speedLinesIntensity.addEventListener("input", () => {
      effectsConfig.visual.speedLines = Number(speedLinesIntensity.value) / 100;
      if (speedLinesValue) speedLinesValue.textContent = speedLinesIntensity.value + '%';
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (colorShiftEnabled) {
    colorShiftEnabled.addEventListener("change", () => {
      effectsConfig.visual.colorShift = colorShiftEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (screenShakeEnabled) {
    screenShakeEnabled.addEventListener("change", () => {
      effectsConfig.visual.screenShake = screenShakeEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }

  // World / Chill Ride controls
  if (pathEnabled) {
    pathEnabled.addEventListener("change", () => {
      effectsConfig.world.pathEnabled = pathEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (parallaxEnabled) {
    parallaxEnabled.addEventListener("change", () => {
      effectsConfig.world.parallaxEnabled = parallaxEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (vistaEnabled) {
    vistaEnabled.addEventListener("change", () => {
      effectsConfig.world.vistaEnabled = vistaEnabled.checked;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }

  if (pathOpacity) {
    pathOpacity.addEventListener("input", () => {
      effectsConfig.world.pathOpacity = Number(pathOpacity.value) / 100;
      if (pathOpacityValue) pathOpacityValue.textContent = `${pathOpacity.value}%`;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (pathLaneOpacity) {
    pathLaneOpacity.addEventListener("input", () => {
      effectsConfig.world.pathLaneOpacity = Number(pathLaneOpacity.value) / 100;
      if (pathLaneOpacityValue) pathLaneOpacityValue.textContent = `${pathLaneOpacity.value}%`;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (parallaxDepth) {
    parallaxDepth.addEventListener("input", () => {
      effectsConfig.world.parallaxFactorZ = Number(parallaxDepth.value) / 100;
      if (parallaxDepthValue) parallaxDepthValue.textContent = `${parallaxDepth.value}%`;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (vistaThreshold) {
    vistaThreshold.addEventListener("input", () => {
      effectsConfig.world.vistaMinEnergy = Number(vistaThreshold.value) / 100;
      if (vistaThresholdValue) vistaThresholdValue.textContent = `${vistaThreshold.value}%`;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (vistaDuration) {
    vistaDuration.addEventListener("input", () => {
      effectsConfig.world.vistaDuration = Number(vistaDuration.value) / 10;
      if (vistaDurationValue) vistaDurationValue.textContent = `${effectsConfig.world.vistaDuration.toFixed(1)}s`;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }
  if (vistaCooldown) {
    vistaCooldown.addEventListener("input", () => {
      effectsConfig.world.vistaCooldown = Number(vistaCooldown.value) / 10;
      if (vistaCooldownValue) vistaCooldownValue.textContent = `${effectsConfig.world.vistaCooldown.toFixed(1)}s`;
      saveEffectsConfig();
      applyEffectsToEnvironment();
    });
  }

  // Band select buttons
  bandButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const effect = btn.getAttribute('data-effect');
      const band = btn.getAttribute('data-band');
      if (effect && band && effectsConfig[effect]) {
        effectsConfig[effect].band = band;
        // Update button states for this effect
        bandButtons.forEach(b => {
          if (b.getAttribute('data-effect') === effect) {
            b.classList.toggle('active', b.getAttribute('data-band') === band);
          }
        });
        saveEffectsConfig();
        applyEffectsToEnvironment();
      }
    });
  });

  // Reset and Randomize buttons
  if (resetEffectsBtn) {
    resetEffectsBtn.addEventListener("click", resetEffectsConfig);
  }
  if (randomizeEffectsBtn) {
    randomizeEffectsBtn.addEventListener("click", randomizeEffectsConfig);
  }

  // Manual effect trigger buttons - enable effect if not enabled, then trigger
  const triggerLightningBtn = $("triggerLightning");
  const triggerAuroraBtn = $("triggerAurora");
  const triggerGridBtn = $("triggerGrid");
  const triggerLightsBtn = $("triggerLights");
  const triggerParticlesBtn = $("triggerParticles");
  const triggerShakeBtn = $("triggerShake");
  const triggerVistaBtn = $("triggerVista");

  /** Helper to enable an effect before triggering */
  function enableEffectAndTrigger(checkbox, configKey, triggerFn) {
    if (checkbox && !checkbox.checked) {
      checkbox.checked = true;
      effectsConfig[configKey].enabled = true;
      saveEffectsConfig();
      applyEffectsToEnvironment();
      // Wait for rebuild, then trigger
      setTimeout(() => {
        if (typeof EffectsManager !== "undefined") triggerFn();
      }, 100);
    } else {
      if (typeof EffectsManager !== "undefined") triggerFn();
    }
  }

  if (triggerLightningBtn) {
    triggerLightningBtn.addEventListener("click", () => {
      enableEffectAndTrigger(lightningEnabled, 'lightning', () => EffectsManager.triggerLightning());
    });
  }
  if (triggerAuroraBtn) {
    triggerAuroraBtn.addEventListener("click", () => {
      enableEffectAndTrigger(auroraEnabled, 'aurora', () => EffectsManager.triggerAurora());
    });
  }
  if (triggerGridBtn) {
    triggerGridBtn.addEventListener("click", () => {
      enableEffectAndTrigger(gridEnabled, 'grid', () => EffectsManager.triggerGrid());
    });
  }
  if (triggerLightsBtn) {
    triggerLightsBtn.addEventListener("click", () => {
      enableEffectAndTrigger(lightsEnabled, 'lights', () => EffectsManager.triggerLights());
    });
  }
  if (triggerParticlesBtn) {
    triggerParticlesBtn.addEventListener("click", () => {
      enableEffectAndTrigger(particlesEnabled, 'particles', () => EffectsManager.triggerParticles());
    });
  }
  if (triggerShakeBtn) {
    triggerShakeBtn.addEventListener("click", () => {
      // Enable screen shake if not enabled
      if (screenShakeEnabled && !screenShakeEnabled.checked) {
        screenShakeEnabled.checked = true;
        effectsConfig.visual.screenShake = true;
        saveEffectsConfig();
        applyEffectsToEnvironment();
      }
      if (typeof EffectsManager !== "undefined") EffectsManager.triggerShake();
    });
  }
  if (triggerVistaBtn) {
    triggerVistaBtn.addEventListener("click", () => {
      // Enable vista if not enabled
      const vistaCheckbox = $("vistaEnabled");
      if (vistaCheckbox && !vistaCheckbox.checked) {
        vistaCheckbox.checked = true;
        if (env && env.world) env.world.vistaEnabled = true;
      }
      if (env) env.triggerVista(1.0, true);
    });
  }

  // Playlist item click
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
  audio.addEventListener("play", () => {
    updatePlayPauseBtn();
    updateVizPauseState();
    setMediaSessionPlaybackState();
  });
  audio.addEventListener("pause", () => {
    updatePlayPauseBtn();
    updateVizPauseState();
    setMediaSessionPlaybackState();
  });
  audio.addEventListener("ended", () => {
    // Check for high score when track ends
    if (EnvironmentMode && bgVizMode === "environment" && currentTrackTitle) {
      // Show Chill Ride run summary (rank/flow/gates)
      try {
        const summary = EnvironmentMode.getRunSummary && EnvironmentMode.getRunSummary();
        if (summary) showRunSummary(summary);
      } catch { /* ignore */ }

      const finalScore = EnvironmentMode.getScore();
      if (finalScore > 0) {
        showHighScoreModal(finalScore, currentTrackTitle);
      }
    }

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
    updatePlayPauseBtn();
    updateVizPauseState();
    const track = tracks[currentIndex];
    const trackName = track ? trackLabel(track) : "track";
    announceToScreenReader(`Error loading ${trackName}`);
  });

  // Visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      stopVizLoop();
      stopIOSVizLoop();
      return;
    }

    if (canUseWebAudioViz() && !audio.paused) {
      ensureAudioGraph();
      startVizLoop();
      void ensureThreeViz();
      void tryResumeAudioContext();
    } else if (isIOS && iosViz && !audio.paused) {
      ensureIOSAudioGraph();
      startIOSVizLoop();
      if (audioCtx && audioCtx.state !== "running") {
        audioCtx.resume().catch(() => {});
      }
    }
  });

  // ---- Drag & drop files ----
  function isFileDrag(e) {
    const dt = e.dataTransfer;
    if (!dt) return false;
    return Array.from(dt.types || []).includes("Files");
  }

  function showDropzone(show) {
    dropzone.classList.toggle("is-active", show);
  }

  const dropTargets = [playlistModal, document.body];
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

    controlBar.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    controlBar.addEventListener("touchend", (e) => {
      if (Date.now() - touchStartTime > SWIPE_TIMEOUT) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.6) return;

      if (deltaX > 0) {
        prev({ autoplay: !audio.paused });
      } else {
        next({ autoplay: !audio.paused });
      }
    }, { passive: true });
  }

  initSwipeGestures();

  // ---- Keyboard shortcuts ----
  function showVolumeToast(vol) {
    let toast = controlBar.querySelector(".wa-volume-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "wa-volume-toast";
      controlBar.appendChild(toast);
    }
    toast.textContent = `Vol: ${Math.round(vol * 100)}%`;
    toast.classList.add("is-visible");
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 700);
  }

  window.addEventListener("keydown", (e) => {
    // Don't trigger when typing in inputs (unless it's the playlist modal filter)
    if (e.target && (/** @type {HTMLElement} */ (e.target)).closest("input, textarea, [contenteditable]")) {
      // Allow Escape to work in filter input
      if (e.key === "Escape" && document.activeElement === filterInput) {
        if (filterInput.value) {
          filterInput.value = "";
          updatePlaylistUi();
        } else {
          filterInput.blur();
        }
        return;
      }
      return;
    }

    const key = e.key.toLowerCase();

    // Handle keyboard shortcuts
    if (key === "m") {
      audio.muted = !audio.muted;
      updateVolumeIcon();
      announceToScreenReader(audio.muted ? "Muted" : "Unmuted");
    } else if (key === "l") {
      playlistOpen ? closePlaylist() : openPlaylist();
    } else if (key === "h") {
      controlBar.classList.toggle("is-hidden");
    } else if (key === "f") {
      e.preventDefault();
      if (!playlistOpen) openPlaylist();
      setTimeout(() => filterInput.focus(), 100);
    } else if (key === "escape") {
      if (vizSettingsOpen) {
        closeVizSettings();
      } else if (playlistOpen) {
        closePlaylist();
      }
    }
  });

  // Resize handling
  window.addEventListener("resize", () => {
    if (threeReady) resizeThreeRenderer();
  });

  // Initialize iOS audio-reactive visualization as fallback
  if (isIOS && bgVizCanvas && window.iOSVisualization) {
    console.log("Initializing iOS audio-reactive particle visualization");
    iosViz = new window.iOSVisualization(bgVizCanvas);
    iosViz.start();
    // Sync initial state if already playing
    if (!audio.paused) {
      iosViz.setPlaying(true);
      ensureIOSAudioGraph();
      startIOSVizLoop();
    }
  }
})();
