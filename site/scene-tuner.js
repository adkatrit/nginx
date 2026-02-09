/**
 * Scene Tuner - Real-time visual parameter tuning
 * Press 'T' to toggle the tuning panel
 * Adjust sliders/inputs to tune visuals, then copy config
 */
window.SceneTuner = (function() {
  'use strict';

  let panel = null;
  let isVisible = false;
  let currentConfig = {};
  let updateCallbacks = [];

  // Default tunable parameters (tuned for Trade You My Hands)
  const defaultParams = {
    // Ground shader
    ground: {
      patternScale: { value: 25, min: 1, max: 100, step: 1, label: 'Pattern Scale' },
      veinThickness: { value: 0.09, min: 0.01, max: 0.5, step: 0.01, label: 'Vein Thickness' },
      glowIntensity: { value: 0, min: 0, max: 3, step: 0.1, label: 'Glow Intensity' },
      dataFlowSpeed: { value: 6, min: 0, max: 10, step: 0.5, label: 'Data Flow Speed' },
      nodeSize: { value: 0.21, min: 0.01, max: 0.3, step: 0.01, label: 'Node Size' },
      baseColorR: { value: 0.105, min: 0, max: 0.5, step: 0.005, label: 'Base R' },
      baseColorG: { value: 0.13, min: 0, max: 0.5, step: 0.005, label: 'Base G' },
      baseColorB: { value: 0.12, min: 0, max: 0.5, step: 0.005, label: 'Base B' },
      glowColorR: { value: 0.3, min: 0, max: 1, step: 0.05, label: 'Glow R' },
      glowColorG: { value: 0.65, min: 0, max: 1, step: 0.05, label: 'Glow G' },
      glowColorB: { value: 0.75, min: 0, max: 1, step: 0.05, label: 'Glow B' },
    },
    // Audio reactivity
    audio: {
      bassMultiplier: { value: 6, min: 1, max: 20, step: 0.5, label: 'Bass Multiplier' },
      synthMultiplier: { value: 4, min: 1, max: 20, step: 0.5, label: 'Synth Multiplier' },
      drumSmoothing: { value: 0.85, min: 0.5, max: 0.99, step: 0.01, label: 'Drum Smoothing' },
      bassSmoothing: { value: 0.8, min: 0.5, max: 0.99, step: 0.01, label: 'Bass Smoothing' },
      vocalSmoothing: { value: 0.9, min: 0.5, max: 0.99, step: 0.01, label: 'Vocal Smoothing' },
    },
    // Fog
    fog: {
      density: { value: 0.003, min: 0, max: 0.02, step: 0.001, label: 'Fog Density' },
      colorH: { value: 0.02, min: 0, max: 1, step: 0.01, label: 'Fog Hue' },
      colorS: { value: 0.1, min: 0, max: 1, step: 0.05, label: 'Fog Saturation' },
      colorL: { value: 0.015, min: 0, max: 0.1, step: 0.005, label: 'Fog Lightness' },
    },
    // Sky
    sky: {
      luminosityMin: { value: 0.35, min: 0.1, max: 1, step: 0.05, label: 'Luminosity Min' },
      luminosityRange: { value: 1.15, min: 0, max: 2, step: 0.1, label: 'Luminosity Range' },
      sunGlowIntensity: { value: 0.15, min: 0, max: 1, step: 0.05, label: 'Sun Glow' },
      horizonIntensity: { value: 0.1, min: 0, max: 1, step: 0.05, label: 'Horizon Glow' },
    },
    // Trees
    trees: {
      trunkGlowBase: { value: 0.05, min: 0, max: 0.5, step: 0.01, label: 'Trunk Glow Base' },
      trunkGlowMult: { value: 1.5, min: 0, max: 5, step: 0.1, label: 'Trunk Glow Mult' },
      leafGlowBase: { value: 0.02, min: 0, max: 0.3, step: 0.01, label: 'Leaf Glow Base' },
      leafGlowMult: { value: 0.5, min: 0, max: 2, step: 0.1, label: 'Leaf Glow Mult' },
    },
    // Fireflies
    fireflies: {
      baseSize: { value: 0.5, min: 0.1, max: 2, step: 0.1, label: 'Base Size' },
      sizeMultiplier: { value: 0.5, min: 0, max: 2, step: 0.1, label: 'Size Multiplier' },
      baseOpacity: { value: 0.7, min: 0, max: 1, step: 0.05, label: 'Base Opacity' },
      swarmIntensity: { value: 1.5, min: 0.5, max: 5, step: 0.25, label: 'Swarm Intensity' },
    }
  };

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
          background: rgba(0,0,0,0.9);
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
          flex: 0 0 45px;
          text-align: right;
          color: #0fa;
        }
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
      </style>
      <div class="header">
        <h3>Scene Tuner</h3>
        <button class="copy-btn" id="tuner-copy">Copy Config</button>
      </div>
      <div id="tuner-sections"></div>
      <div class="config-output">
        <pre id="tuner-config-output">{}</pre>
      </div>
    `;
    document.body.appendChild(panel);

    // Build sections
    const sectionsContainer = panel.querySelector('#tuner-sections');
    for (const [sectionName, params] of Object.entries(defaultParams)) {
      const section = document.createElement('div');
      section.className = 'section';
      section.innerHTML = `
        <div class="section-title">${sectionName.toUpperCase()} ▼</div>
        <div class="section-content"></div>
      `;

      const content = section.querySelector('.section-content');
      for (const [paramName, config] of Object.entries(params)) {
        const param = document.createElement('div');
        param.className = 'param';
        param.innerHTML = `
          <label>${config.label}</label>
          <input type="range"
                 data-section="${sectionName}"
                 data-param="${paramName}"
                 min="${config.min}"
                 max="${config.max}"
                 step="${config.step}"
                 value="${config.value}">
          <span class="value">${config.value}</span>
        `;
        content.appendChild(param);

        // Initialize currentConfig
        if (!currentConfig[sectionName]) currentConfig[sectionName] = {};
        currentConfig[sectionName][paramName] = config.value;
      }

      // Collapse toggle
      section.querySelector('.section-title').addEventListener('click', () => {
        section.classList.toggle('collapsed');
      });

      sectionsContainer.appendChild(section);
    }

    // Event listeners
    panel.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const section = e.target.dataset.section;
        const param = e.target.dataset.param;
        const value = parseFloat(e.target.value);

        e.target.nextElementSibling.textContent = value;
        currentConfig[section][param] = value;

        updateConfigOutput();
        notifyUpdate(section, param, value);
      });
    });

    // Copy button
    panel.querySelector('#tuner-copy').addEventListener('click', () => {
      const json = JSON.stringify(currentConfig, null, 2);
      navigator.clipboard.writeText(json).then(() => {
        const btn = panel.querySelector('#tuner-copy');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Config', 1500);
      });
    });

    // Keyboard toggle
    document.addEventListener('keydown', (e) => {
      if (e.key === 't' || e.key === 'T') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        toggle();
      }
    });
  }

  function updateConfigOutput() {
    const output = panel.querySelector('#tuner-config-output');
    output.textContent = JSON.stringify(currentConfig, null, 2);
  }

  function notifyUpdate(section, param, value) {
    updateCallbacks.forEach(cb => cb(section, param, value, currentConfig));
  }

  function toggle() {
    isVisible = !isVisible;
    panel.classList.toggle('visible', isVisible);
  }

  function show() {
    isVisible = true;
    panel.classList.add('visible');
  }

  function hide() {
    isVisible = false;
    panel.classList.remove('visible');
  }

  function onUpdate(callback) {
    updateCallbacks.push(callback);
  }

  function getConfig() {
    return { ...currentConfig };
  }

  function getParam(section, param) {
    return currentConfig[section]?.[param];
  }

  function setParam(section, param, value) {
    if (currentConfig[section]) {
      currentConfig[section][param] = value;
      // Update slider if panel exists
      const input = panel?.querySelector(`input[data-section="${section}"][data-param="${param}"]`);
      if (input) {
        input.value = value;
        input.nextElementSibling.textContent = value;
      }
      updateConfigOutput();
    }
  }

  function loadConfig(config) {
    for (const [section, params] of Object.entries(config)) {
      for (const [param, value] of Object.entries(params)) {
        setParam(section, param, value);
      }
    }
  }

  // Initialize on load
  function init() {
    if (!panel) {
      createPanel();
      updateConfigOutput();
      console.log('[SceneTuner] Initialized - Press T to toggle');
    }
  }

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    toggle,
    show,
    hide,
    onUpdate,
    getConfig,
    getParam,
    setParam,
    loadConfig
  };
})();
