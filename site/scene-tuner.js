/**
 * Scene Tuner - Test Track Controls
 * Press 'T' to toggle the tuning panel
 * Controls Preetham sky, atmosphere, lighting, and fog
 */
window.SceneTuner = (function() {
  'use strict';

  let panel = null;
  let isVisible = false;
  let currentConfig = {};
  let updateCallbacks = [];

  const defaultParams = {
    sun: {
      elevation: { value: 5, min: -5, max: 90, step: 0.5, label: 'Elevation °' },
      azimuth: { value: 0, min: -180, max: 180, step: 1, label: 'Azimuth °' },
    },
    atmosphere: {
      turbidity: { value: 4, min: 1, max: 20, step: 0.5, label: 'Turbidity' },
      rayleigh: { value: 2, min: 0, max: 10, step: 0.25, label: 'Rayleigh' },
      mieCoefficient: { value: 0.005, min: 0, max: 0.1, step: 0.001, label: 'Mie Coeff' },
      mieDirectionalG: { value: 0.8, min: 0, max: 0.999, step: 0.01, label: 'Mie Dir G' },
      exposure: { value: 0.5, min: 0, max: 2, step: 0.05, label: 'Exposure' },
    },
    lighting: {
      sunIntensity: { value: 2.0, min: 0, max: 5, step: 0.1, label: 'Sun Light' },
      ambientIntensity: { value: 0.6, min: 0, max: 2, step: 0.1, label: 'Ambient' },
    },
    fog: {
      near: { value: 100, min: 0, max: 400, step: 10, label: 'Fog Near' },
      far: { value: 500, min: 100, max: 1500, step: 50, label: 'Fog Far' },
    },
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
          flex: 0 0 50px;
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

  function offUpdate(callback) {
    updateCallbacks = updateCallbacks.filter(cb => cb !== callback);
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
    offUpdate,
    getConfig,
    getParam,
    setParam,
    loadConfig
  };
})();
