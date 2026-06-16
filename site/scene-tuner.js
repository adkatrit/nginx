/**
 * Scene Tuner - Live parameter tuning for flight engine visuals
 * App.js owns the T-key — calls SceneTuner.toggle()
 * 8 sections: Sun, Atmosphere, Lighting, Fog, Water, Terrain, Flight, Stars
 */
window.SceneTuner = (function() {
  'use strict';

  let panel = null;
  let isVisible = false;
  let currentConfig = {};
  let updateCallbacks = [];

  // ── Parameter definitions ──
  // type: 'slider' (default), 'color', 'toggle'
  const defaultParams = {
    sun: {
      baseSunElevation:  { value: -5, min: -10, max: 90, step: 0.5, label: 'Base Elevation °' },
      sunElevationRange: { value: 10, min: 2,   max: 30, step: 0.5, label: 'Elevation Range' },
      sunAzimuth:        { value: 0,  min: -180, max: 180, step: 1, label: 'Azimuth °' },
    },
    atmosphere: {
      baseTurbidity:      { value: 4,     min: 1,    max: 20,    step: 0.5,   label: 'Turbidity' },
      baseRayleigh:       { value: 2,     min: 0,    max: 10,    step: 0.25,  label: 'Rayleigh' },
      baseMieCoefficient: { value: 0.005, min: 0,    max: 0.1,   step: 0.001, label: 'Mie Coeff' },
      baseMieDirectionalG:{ value: 0.8,   min: 0,    max: 0.999, step: 0.01,  label: 'Mie Dir G' },
      baseExposure:       { value: 0.5,   min: 0,    max: 2,     step: 0.05,  label: 'Exposure' },
    },
    lighting: {
      baseSunIntensity:   { value: 0.1, min: 0, max: 3, step: 0.05, label: 'Sun Intensity' },
      sunIntensityRange:  { value: 1.6, min: 0, max: 5, step: 0.1,  label: 'Sun Range' },
      baseHemiIntensity:  { value: 0.04, min: 0, max: 1, step: 0.01, label: 'Hemi Intensity' },
      hemiIntensityRange: { value: 0.46, min: 0, max: 2, step: 0.05, label: 'Hemi Range' },
    },
    fog: {
      fogColor:      { value: 0x0a0a14, type: 'color', label: 'Night Color' },
      fogColorLight: { value: 0x8c7a5e, type: 'color', label: 'Day Color' },
      fogDensity:    { value: 0.006,    min: 0.0001, max: 0.02, step: 0.0001, label: 'Night Density' },
      fogDensityDay: { value: 0.0002,   min: 0.0,    max: 0.01, step: 0.0001, label: 'Day Density' },
    },
    water: {
      waterY:         { value: -6,      min: -20, max: 5,   step: 0.5,  label: 'Water Y' },
      waterColor:     { value: 0x1a5c6e, type: 'color', label: 'Water Color' },
      waterOpacity:   { value: 0.85,    min: 0,   max: 1,   step: 0.05, label: 'Opacity' },
      waterRoughness: { value: 0.3,     min: 0,   max: 1,   step: 0.05, label: 'Roughness' },
      waterMetalness: { value: 0.6,     min: 0,   max: 1,   step: 0.05, label: 'Metalness' },
    },
    ocean: {
      waveHeight:  { value: 1.2, min: 0,   max: 4,   step: 0.05, label: 'Wave Height' },
      choppiness:  { value: 1.0, min: 0,   max: 2.5, step: 0.05, label: 'Choppiness' },
      waveScale:   { value: 1.0, min: 0.3, max: 3.0, step: 0.05, label: 'Wave Scale' },
      foamStart:   { value: 1.6, min: 0,   max: 5,   step: 0.05, label: 'Foam Start' },
      foamEnd:     { value: 2.6, min: 0,   max: 6,   step: 0.05, label: 'Foam End' },
      foamAmount:  { value: 0.8, min: 0,   max: 1,   step: 0.05, label: 'Foam Amount' },
      glint:       { value: 1.0, min: 0,   max: 5,   step: 0.1,  label: 'Glint' },
      glintTight:  { value: 90,  min: 8,   max: 320, step: 4,    label: 'Glint Tightness' },
    },
    terrain: {
      flatShading:      { value: true, type: 'toggle', label: 'Flat Shading' },
      roughness:        { value: 0.85, min: 0, max: 1, step: 0.05, label: 'Roughness' },
      metalness:        { value: 0.05, min: 0, max: 1, step: 0.05, label: 'Metalness' },
      emissiveIntensity:{ value: 0.12, min: 0, max: 1, step: 0.01, label: 'Emissive' },
      sceneryDensity:   { value: 8,    min: 0, max: 30, step: 1,   label: 'Scenery Density' },
      fresnelStrength:  { value: 0.7,  min: 0, max: 1,   step: 0.05, label: 'Fresnel' },
      specIntensity:    { value: 1.5,  min: 0, max: 5,   step: 0.1,  label: 'Spec Intensity' },
      specPower:        { value: 256,  min: 8, max: 512,  step: 8,    label: 'Spec Tightness' },
      sssStrength:      { value: 0.3,  min: 0, max: 1,   step: 0.05, label: 'SSS Strength' },
    },
    flight: {
      forwardSpeed:  { value: 0.25, min: 0.05, max: 1.0, step: 0.01, label: 'Speed' },
      doubleSpeed:   { value: 0.6,  min: 0.1,  max: 2.0, step: 0.05, label: 'Boost Speed' },
      minY:          { value: 2,    min: -10,  max: 20,  step: 1,    label: 'Min Y' },
      maxY:          { value: 90,   min: 20,   max: 200, step: 5,    label: 'Max Y' },
      camY:          { value: 7,    min: 0,    max: 30,  step: 0.5,  label: 'Cam Y' },
      camZ:          { value: -10,  min: -30,  max: 0,   step: 0.5,  label: 'Cam Z' },
      lookAtZ:       { value: 15,   min: 5,    max: 50,  step: 1,    label: 'LookAt Z' },
      pitchAltScale: { value: 2.0,  min: 0.5,  max: 5.0, step: 0.1,  label: 'Pitch Alt Scale' },
    },
    stars: {
      starCount:    { value: 4600, min: 200,  max: 10000, step: 100,  label: 'Star Count' },
      starBrtMin:   { value: 0.6,  min: 0,    max: 0.6,   step: 0.01, label: 'Star Brt Min' },
      starBrtPow:   { value: 5.0,  min: 0.3,  max: 5.0,   step: 0.1,  label: 'Brt Curve' },
      starSizeMin:  { value: 0.1,  min: 0.1,  max: 3.0,   step: 0.1,  label: 'Size Min' },
      starSizeMax:  { value: 2.1,  min: 0.5,  max: 6.0,   step: 0.1,  label: 'Size Max' },
      starWarmth:   { value: 0.8,  min: 0,    max: 1.0,   step: 0.05, label: 'Color Warmth' },
      brightCount:  { value: 35,   min: 0,    max: 300,   step: 5,    label: 'Bright Count' },
      brightSize:   { value: 1.0,  min: 1.0,  max: 12.0,  step: 0.5,  label: 'Bright Size' },
      brightAlpha:  { value: 0.15, min: 0.1,  max: 1.0,   step: 0.05, label: 'Bright Alpha' },
      mwCount:      { value: 2200, min: 0,    max: 12000, step: 200,  label: 'MW Count' },
      mwBrt:        { value: 0.18, min: 0,    max: 0.6,   step: 0.01, label: 'MW Bright' },
      mwTilt:       { value: 52,   min: 0,    max: 90,    step: 1,    label: 'MW Tilt °' },
      mwAzimuth:    { value: 25,   min: 0,    max: 360,   step: 1,    label: 'MW Azimuth °' },
      mwWidth:      { value: 0.12, min: 0.02, max: 0.5,   step: 0.01, label: 'MW Width' },
      moonElev:     { value: 55,   min: 5,    max: 85,    step: 1,    label: 'Moon Elev °' },
      moonAz:       { value: 135,  min: 0,    max: 360,   step: 1,    label: 'Moon Az °' },
      moonSize:     { value: 18,   min: 3,    max: 50,    step: 1,    label: 'Moon Size' },
      moonGlow:     { value: 3.0,  min: 1.0,  max: 6.0,   step: 0.25, label: 'Moon Glow' },
      moonBrt:      { value: 0.95, min: 0,    max: 1.0,   step: 0.05, label: 'Moon Bright' },
      domeOpacity:  { value: 1.0,  min: 0,    max: 3.0,   step: 0.05, label: 'Dome Opacity' },
      fadePower:    { value: 4.1,  min: 0.5,  max: 5.0,   step: 0.1,  label: 'Fade Speed' },
    },
  };

  // ── Helpers ──

  /** Convert integer color (0x1a5c6e) to hex string (#1a5c6e) */
  function intToHex(n) {
    return '#' + (n & 0xffffff).toString(16).padStart(6, '0');
  }

  /** Convert hex string (#1a5c6e) to integer (0x1a5c6e) */
  function hexToInt(s) {
    return parseInt(s.replace('#', ''), 16);
  }

  /** Format a number for display — show decimals only when needed */
  function fmt(v, step) {
    if (step >= 1) return String(Math.round(v));
    const decimals = Math.max(0, -Math.floor(Math.log10(step)));
    return v.toFixed(Math.min(decimals, 4));
  }

  // ── Panel creation ──

  function createPanel() {
    panel = document.createElement('div');
    panel.id = 'scene-tuner';
    panel.innerHTML = `
      <style>
        #scene-tuner {
          position: fixed;
          top: 10px;
          right: 10px;
          width: 320px;
          max-height: 90vh;
          background: rgba(0,0,0,0.92);
          border: 1px solid #444;
          border-radius: 8px;
          font-family: monospace;
          font-size: 11px;
          color: #ddd;
          z-index: 10000;
          overflow-y: auto;
          display: none;
        }
        #scene-tuner.visible { display: block; }
        #scene-tuner .header {
          padding: 8px 12px;
          background: #222;
          border-bottom: 1px solid #444;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        #scene-tuner .header h3 { margin: 0; color: #0fa; }
        #scene-tuner .copy-btn {
          background: #0a8;
          color: #fff;
          border: none;
          padding: 4px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
        }
        #scene-tuner .copy-btn:hover { background: #0c9; }
        #scene-tuner .section {
          border-bottom: 1px solid #333;
          padding: 8px 12px;
        }
        #scene-tuner .section-title {
          color: #888;
          text-transform: uppercase;
          font-size: 10px;
          margin-bottom: 6px;
          cursor: pointer;
          user-select: none;
        }
        #scene-tuner .section-title:hover { color: #aaa; }
        #scene-tuner .section-content { display: block; }
        #scene-tuner .section.collapsed .section-content { display: none; }
        #scene-tuner .param {
          display: flex;
          align-items: center;
          margin: 4px 0;
          gap: 6px;
        }
        #scene-tuner .param label {
          flex: 0 0 100px;
          color: #999;
        }
        #scene-tuner .param input[type="range"] {
          flex: 1;
          height: 4px;
        }
        #scene-tuner .param .value {
          flex: 0 0 55px;
          text-align: right;
          color: #0fa;
          font-size: 10px;
        }
        #scene-tuner .param input[type="color"] {
          width: 32px;
          height: 20px;
          border: 1px solid #555;
          border-radius: 3px;
          background: transparent;
          cursor: pointer;
          padding: 0;
        }
        #scene-tuner .param .toggle-switch {
          position: relative;
          width: 36px;
          height: 18px;
          background: #333;
          border-radius: 9px;
          cursor: pointer;
          transition: background 0.2s;
        }
        #scene-tuner .param .toggle-switch.on { background: #0a8; }
        #scene-tuner .param .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          background: #ddd;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        #scene-tuner .param .toggle-switch.on::after { transform: translateX(18px); }
        #scene-tuner .config-output {
          padding: 8px 12px;
          background: #111;
          max-height: 150px;
          overflow-y: auto;
        }
        #scene-tuner .config-output pre {
          margin: 0;
          font-size: 9px;
          color: #888;
          white-space: pre-wrap;
        }
        #scene-tuner .perf-bar {
          padding: 6px 12px;
          background: #181818;
          border-bottom: 1px solid #333;
          font-size: 10px;
          line-height: 1.6;
          display: none;
        }
        #scene-tuner.visible .perf-bar { display: block; }
        #scene-tuner .perf-bar .perf-row {
          display: flex;
          justify-content: space-between;
        }
        #scene-tuner .perf-bar .perf-label { color: #666; }
        #scene-tuner .perf-bar .perf-val { color: #0fa; font-weight: bold; }
        #scene-tuner .perf-bar .perf-val.warn { color: #fa0; }
        #scene-tuner .perf-bar .perf-val.bad { color: #f44; }
      </style>
      <div class="header">
        <h3>Scene Tuner</h3>
        <button class="copy-btn" id="tuner-copy">Copy Config</button>
      </div>
      <div class="perf-bar" id="tuner-perf">
        <div class="perf-row"><span class="perf-label">FPS</span><span class="perf-val" id="perf-fps">--</span></div>
        <div class="perf-row"><span class="perf-label">Frame</span><span class="perf-val" id="perf-frame">--</span></div>
        <div class="perf-row"><span class="perf-label">Draw calls</span><span class="perf-val" id="perf-draws">--</span></div>
        <div class="perf-row"><span class="perf-label">Triangles</span><span class="perf-val" id="perf-tris">--</span></div>
        <div class="perf-row"><span class="perf-label">Geometries</span><span class="perf-val" id="perf-geoms">--</span></div>
        <div class="perf-row"><span class="perf-label">Textures</span><span class="perf-val" id="perf-texs">--</span></div>
        <div class="perf-row"><span class="perf-label">Chunks (near/far)</span><span class="perf-val" id="perf-chunks">--</span></div>
      </div>
      <div id="tuner-sections"></div>
      <div class="config-output">
        <pre id="tuner-config-output">{}</pre>
      </div>
    `;
    document.body.appendChild(panel);

    const sectionsContainer = panel.querySelector('#tuner-sections');
    for (const [sectionName, params] of Object.entries(defaultParams)) {
      const section = document.createElement('div');
      section.className = 'section collapsed'; // start collapsed
      section.dataset.section = sectionName;
      section.innerHTML = `
        <div class="section-title">${sectionName.toUpperCase()} ▶</div>
        <div class="section-content"></div>
      `;

      const content = section.querySelector('.section-content');
      for (const [paramName, config] of Object.entries(params)) {
        if (!currentConfig[sectionName]) currentConfig[sectionName] = {};
        currentConfig[sectionName][paramName] = config.value;

        const param = document.createElement('div');
        param.className = 'param';
        param.dataset.paramRow = paramName;
        const controlType = config.type || 'slider';

        if (controlType === 'color') {
          param.innerHTML = `
            <label>${config.label}</label>
            <input type="color"
                   data-section="${sectionName}"
                   data-param="${paramName}"
                   data-control="color"
                   value="${intToHex(config.value)}">
            <span class="value">${intToHex(config.value)}</span>
          `;
        } else if (controlType === 'toggle') {
          param.innerHTML = `
            <label>${config.label}</label>
            <div class="toggle-switch ${config.value ? 'on' : ''}"
                 data-section="${sectionName}"
                 data-param="${paramName}"
                 data-control="toggle"></div>
            <span class="value">${config.value ? 'ON' : 'OFF'}</span>
          `;
        } else {
          // slider (default)
          param.innerHTML = `
            <label>${config.label}</label>
            <input type="range"
                   data-section="${sectionName}"
                   data-param="${paramName}"
                   data-control="slider"
                   min="${config.min}"
                   max="${config.max}"
                   step="${config.step}"
                   value="${config.value}">
            <span class="value">${fmt(config.value, config.step)}</span>
          `;
        }
        content.appendChild(param);
      }

      // Collapse/expand toggle
      const titleEl = section.querySelector('.section-title');
      titleEl.addEventListener('click', () => {
        section.classList.toggle('collapsed');
        titleEl.textContent = sectionName.toUpperCase() + (section.classList.contains('collapsed') ? ' ▶' : ' ▼');
      });

      sectionsContainer.appendChild(section);
    }

    // ── Event listeners ──

    // Sliders
    panel.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const sec = e.target.dataset.section;
        const par = e.target.dataset.param;
        const value = parseFloat(e.target.value);
        const step = defaultParams[sec][par].step;
        e.target.nextElementSibling.textContent = fmt(value, step);
        currentConfig[sec][par] = value;
        updateConfigOutput();
        notifyUpdate(sec, par, value);
      });
    });

    // Color pickers
    panel.querySelectorAll('input[type="color"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const sec = e.target.dataset.section;
        const par = e.target.dataset.param;
        const hex = e.target.value;
        const intVal = hexToInt(hex);
        e.target.nextElementSibling.textContent = hex;
        currentConfig[sec][par] = intVal;
        updateConfigOutput();
        notifyUpdate(sec, par, intVal);
      });
    });

    // Toggles
    panel.querySelectorAll('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const el = e.currentTarget;
        const sec = el.dataset.section;
        const par = el.dataset.param;
        const isOn = !el.classList.contains('on');
        el.classList.toggle('on', isOn);
        el.nextElementSibling.textContent = isOn ? 'ON' : 'OFF';
        currentConfig[sec][par] = isOn;
        updateConfigOutput();
        notifyUpdate(sec, par, isOn);
      });
    });

    // Copy button — paste-ready terrain-themes.js block (theme params only)
    panel.querySelector('#tuner-copy').addEventListener('click', () => {
      const output = buildThemeExport();
      navigator.clipboard.writeText(output).then(() => {
        const btn = panel.querySelector('#tuner-copy');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Config', 1500);
      });
    });
  }

  /** Build a paste-ready terrain-themes.js config block (excludes flight & stars) */
  function buildThemeExport() {
    const c = currentConfig;
    const lines = ['{'];

    // Sun
    lines.push(`  baseSunElevation: ${c.sun.baseSunElevation},`);
    lines.push(`  sunElevationRange: ${c.sun.sunElevationRange},`);
    lines.push(`  sunAzimuth: ${c.sun.sunAzimuth},`);

    // Atmosphere
    lines.push(`  baseTurbidity: ${c.atmosphere.baseTurbidity},`);
    lines.push(`  baseRayleigh: ${c.atmosphere.baseRayleigh},`);
    lines.push(`  baseMieCoefficient: ${c.atmosphere.baseMieCoefficient},`);
    lines.push(`  baseMieDirectionalG: ${c.atmosphere.baseMieDirectionalG},`);
    lines.push(`  baseExposure: ${c.atmosphere.baseExposure},`);

    // Lighting
    lines.push(`  baseSunIntensity: ${c.lighting.baseSunIntensity},`);
    lines.push(`  sunIntensityRange: ${c.lighting.sunIntensityRange},`);
    lines.push(`  baseHemiIntensity: ${c.lighting.baseHemiIntensity},`);
    lines.push(`  hemiIntensityRange: ${c.lighting.hemiIntensityRange},`);

    // Fog — hex literal format
    lines.push(`  fogColor: 0x${(c.fog.fogColor & 0xffffff).toString(16).padStart(6, '0')},`);
    lines.push(`  fogColorLight: 0x${(c.fog.fogColorLight & 0xffffff).toString(16).padStart(6, '0')},`);
    lines.push(`  fogDensity: ${c.fog.fogDensity},`);
    lines.push(`  fogDensityDay: ${c.fog.fogDensityDay},`);

    // Water
    lines.push(`  waterY: ${c.water.waterY},`);
    lines.push(`  waterColor: 0x${(c.water.waterColor & 0xffffff).toString(16).padStart(6, '0')},`);
    lines.push(`  waterOpacity: ${c.water.waterOpacity},`);
    lines.push(`  waterRoughness: ${c.water.waterRoughness},`);
    lines.push(`  waterMetalness: ${c.water.waterMetalness},`);

    // Terrain — nested terrainMatProps
    lines.push(`  terrainMatProps: {`);
    lines.push(`    flatShading: ${c.terrain.flatShading},`);
    lines.push(`    roughness: ${c.terrain.roughness},`);
    lines.push(`    metalness: ${c.terrain.metalness},`);
    lines.push(`    emissiveIntensity: ${c.terrain.emissiveIntensity},`);
    lines.push(`  },`);
    lines.push(`  sceneryDensity: ${c.terrain.sceneryDensity},`);

    lines.push('}');
    return lines.join('\n');
  }

  function updateConfigOutput() {
    const output = panel?.querySelector('#tuner-config-output');
    if (output) output.textContent = buildThemeExport();
  }

  function notifyUpdate(section, param, value) {
    updateCallbacks.forEach(cb => cb(section, param, value, currentConfig));
  }

  function toggle() {
    if (!panel) init();
    isVisible = !isVisible;
    panel.classList.toggle('visible', isVisible);
  }

  function show() {
    if (!panel) init();
    isVisible = true;
    panel.classList.add('visible');
  }

  function hide() {
    isVisible = false;
    if (panel) panel.classList.remove('visible');
  }

  function onUpdate(callback) {
    updateCallbacks.push(callback);
  }

  function offUpdate(callback) {
    updateCallbacks = updateCallbacks.filter(cb => cb !== callback);
  }

  function getConfig() {
    return { ...currentConfig };
  }

  function getParam(section, param) {
    return currentConfig[section]?.[param];
  }

  /** Set a single param and update its DOM control */
  function setParam(section, param, value) {
    if (!currentConfig[section]) return;
    currentConfig[section][param] = value;
    if (!panel) return;

    const def = defaultParams[section]?.[param];
    if (!def) return;
    const controlType = def.type || 'slider';

    if (controlType === 'color') {
      const input = panel.querySelector(`input[type="color"][data-section="${section}"][data-param="${param}"]`);
      if (input) {
        const hex = intToHex(value);
        input.value = hex;
        input.nextElementSibling.textContent = hex;
      }
    } else if (controlType === 'toggle') {
      const toggle = panel.querySelector(`.toggle-switch[data-section="${section}"][data-param="${param}"]`);
      if (toggle) {
        toggle.classList.toggle('on', !!value);
        toggle.nextElementSibling.textContent = value ? 'ON' : 'OFF';
      }
    } else {
      const input = panel.querySelector(`input[type="range"][data-section="${section}"][data-param="${param}"]`);
      if (input) {
        input.value = value;
        input.nextElementSibling.textContent = fmt(value, def.step);
      }
    }
  }

  function loadConfig(config) {
    for (const [section, params] of Object.entries(config)) {
      for (const [param, value] of Object.entries(params)) {
        setParam(section, param, value);
      }
    }
    updateConfigOutput();
  }

  /**
   * Sync all knobs from current theme / flight / star state.
   * Called by track-scenes.js when theme changes or on initial setup.
   */
  function syncFromTheme(theme, fly, starCfg) {
    if (!theme) return;

    // Sun
    if (theme.baseSunElevation != null)  setParam('sun', 'baseSunElevation', theme.baseSunElevation);
    if (theme.sunElevationRange != null) setParam('sun', 'sunElevationRange', theme.sunElevationRange);
    if (theme.sunAzimuth != null)        setParam('sun', 'sunAzimuth', theme.sunAzimuth);

    // Atmosphere
    if (theme.baseTurbidity != null)       setParam('atmosphere', 'baseTurbidity', theme.baseTurbidity);
    if (theme.baseRayleigh != null)        setParam('atmosphere', 'baseRayleigh', theme.baseRayleigh);
    if (theme.baseMieCoefficient != null)  setParam('atmosphere', 'baseMieCoefficient', theme.baseMieCoefficient);
    if (theme.baseMieDirectionalG != null) setParam('atmosphere', 'baseMieDirectionalG', theme.baseMieDirectionalG);
    if (theme.baseExposure != null)        setParam('atmosphere', 'baseExposure', theme.baseExposure);

    // Lighting
    if (theme.baseSunIntensity != null)   setParam('lighting', 'baseSunIntensity', theme.baseSunIntensity);
    if (theme.sunIntensityRange != null)  setParam('lighting', 'sunIntensityRange', theme.sunIntensityRange);
    if (theme.baseHemiIntensity != null)  setParam('lighting', 'baseHemiIntensity', theme.baseHemiIntensity);
    if (theme.hemiIntensityRange != null) setParam('lighting', 'hemiIntensityRange', theme.hemiIntensityRange);

    // Fog
    if (theme.fogColor != null)      setParam('fog', 'fogColor', theme.fogColor);
    if (theme.fogColorLight != null) setParam('fog', 'fogColorLight', theme.fogColorLight);
    if (theme.fogDensity != null)    setParam('fog', 'fogDensity', theme.fogDensity);
    if (theme.fogDensityDay != null) setParam('fog', 'fogDensityDay', theme.fogDensityDay);

    // Water — hide section if theme has no water planes (waterY <= -100)
    const hasWaterPlanes = theme.waterY == null || theme.waterY > -100;
    setSectionVisible('water', hasWaterPlanes);
    if (hasWaterPlanes) {
      if (theme.waterY != null)         setParam('water', 'waterY', theme.waterY);
      if (theme.waterColor != null)     setParam('water', 'waterColor', theme.waterColor);
      if (theme.waterOpacity != null)   setParam('water', 'waterOpacity', theme.waterOpacity);
      if (theme.waterRoughness != null) setParam('water', 'waterRoughness', theme.waterRoughness);
      if (theme.waterMetalness != null) setParam('water', 'waterMetalness', theme.waterMetalness);
    }

    // Terrain
    if (theme.terrainMatProps) {
      if (theme.terrainMatProps.flatShading != null)      setParam('terrain', 'flatShading', theme.terrainMatProps.flatShading);
      if (theme.terrainMatProps.roughness != null)        setParam('terrain', 'roughness', theme.terrainMatProps.roughness);
      if (theme.terrainMatProps.metalness != null)        setParam('terrain', 'metalness', theme.terrainMatProps.metalness);
      if (theme.terrainMatProps.emissiveIntensity != null) setParam('terrain', 'emissiveIntensity', theme.terrainMatProps.emissiveIntensity);
    }
    if (theme.sceneryDensity != null) setParam('terrain', 'sceneryDensity', theme.sceneryDensity);

    // Water shader params — only visible for GPU-animated water themes (Data Tide)
    const hasWaterShader = !!theme.gpuAnimated;
    for (const p of waterShaderParams) {
      setParamVisible('terrain', p, hasWaterShader);
    }

    // Flight
    if (fly) {
      for (const key of ['forwardSpeed', 'doubleSpeed', 'minY', 'maxY', 'camY', 'camZ', 'lookAtZ', 'pitchAltScale']) {
        if (fly[key] != null) setParam('flight', key, fly[key]);
      }
    }

    // Stars
    if (starCfg) {
      for (const [k, v] of Object.entries(starCfg)) {
        if (defaultParams.stars[k]) setParam('stars', k, v);
      }
    }

    updateConfigOutput();
  }

  // ── Performance stats ──

  let chunkStats = { near: 0, far: 0, nearSegs: 20, farSegs: 6, water: 0, scenery: 0 };
  let frameTimes = [];
  let lastFrameTime = 0;
  let statsRafId = null;

  function updateStats() {
    if (!isVisible || !panel) { statsRafId = null; return; }

    const now = performance.now();
    if (lastFrameTime > 0) frameTimes.push(now - lastFrameTime);
    lastFrameTime = now;
    if (frameTimes.length > 60) frameTimes.shift();

    // Update every 10 frames to avoid layout thrash
    if (frameTimes.length % 10 === 0 && frameTimes.length > 0) {
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = 1000 / avg;
      setPerf('fps', fps.toFixed(0), fps < 30 ? 'bad' : fps < 50 ? 'warn' : '');
      setPerf('frame', avg.toFixed(1) + ' ms', avg > 33 ? 'bad' : avg > 20 ? 'warn' : '');

      const renderer = window.EnvironmentMode?.instance?.renderer;
      if (renderer && renderer.info) {
        const info = renderer.info;
        const draws = info.render?.calls ?? 0;
        const geoms = info.memory?.geometries ?? 0;
        const texs = info.memory?.textures ?? 0;
        setPerf('draws', draws, draws > 800 ? 'bad' : draws > 400 ? 'warn' : '');
        setPerf('geoms', geoms, geoms > 800 ? 'bad' : geoms > 400 ? 'warn' : '');
        setPerf('texs', texs, texs > 100 ? 'warn' : '');
      }

      // Compute triangles from chunk data (WebGPU doesn't report renderer.info.render.triangles)
      const ns = chunkStats.nearSegs, fs = chunkStats.farSegs;
      const nearTris = chunkStats.near * ns * ns * 2;
      const farTris = chunkStats.far * fs * fs * 2;
      const waterTris = chunkStats.water * 2;
      const totalTris = nearTris + farTris + waterTris;
      setPerf('tris', formatK(totalTris) + ' terrain', totalTris > 2000000 ? 'bad' : totalTris > 500000 ? 'warn' : '');
      setPerf('chunks', `${chunkStats.near} / ${chunkStats.far} (${chunkStats.near + chunkStats.far} + ${chunkStats.water}w + ${chunkStats.scenery}s)`);
    }

    statsRafId = requestAnimationFrame(updateStats);
  }

  function setPerf(id, value, cls) {
    const el = panel?.querySelector('#perf-' + id);
    if (!el) return;
    el.textContent = value;
    el.className = 'perf-val' + (cls ? ' ' + cls : '');
  }

  function formatK(n) {
    return n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
  }

  /** Called by track-scenes.js to report chunk counts + seg counts */
  function reportChunks(near, far, nearSegs, farSegs, water, scenery) {
    chunkStats.near = near;
    chunkStats.far = far;
    chunkStats.nearSegs = nearSegs;
    chunkStats.farSegs = farSegs;
    chunkStats.water = water;
    chunkStats.scenery = scenery;
  }

  // Start/stop stats loop when visibility changes
  function startStats() {
    if (!statsRafId) {
      lastFrameTime = 0;
      frameTimes = [];
      statsRafId = requestAnimationFrame(updateStats);
    }
  }

  function stopStats() {
    if (statsRafId) {
      cancelAnimationFrame(statsRafId);
      statsRafId = null;
    }
  }

  // ── Init ──

  function init() {
    if (!panel) {
      createPanel();
      updateConfigOutput();
      console.log('[SceneTuner] Initialized — app.js T-key toggles');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Section / param visibility ──

  const waterShaderParams = ['fresnelStrength', 'specIntensity', 'specPower', 'sssStrength'];

  /** Hide/show an entire section by name */
  function setSectionVisible(sectionName, visible) {
    if (!panel) return;
    const el = panel.querySelector(`.section[data-section="${sectionName}"]`);
    if (el) el.style.display = visible ? '' : 'none';
  }

  /** Hide/show individual param rows within a section */
  function setParamVisible(sectionName, paramName, visible) {
    if (!panel) return;
    const secEl = panel.querySelector(`.section[data-section="${sectionName}"]`);
    if (!secEl) return;
    const row = secEl.querySelector(`[data-param-row="${paramName}"]`);
    if (row) row.style.display = visible ? '' : 'none';
  }

  // Patch toggle to start/stop stats
  const _origToggle = toggle;
  function toggleWithStats() {
    _origToggle();
    if (isVisible) startStats(); else stopStats();
  }

  return {
    toggle: toggleWithStats,
    show() { show(); startStats(); },
    hide() { hide(); stopStats(); },
    onUpdate,
    offUpdate,
    getConfig,
    getParam,
    setParam,
    loadConfig,
    syncFromTheme,
    reportChunks,
  };
})();
