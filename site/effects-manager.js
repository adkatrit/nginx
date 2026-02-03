/**
 * EffectsManager - Handles all visual effects for the music visualizer
 * Lightning, Aurora, Grid, God Rays, Particles, and Visual Style effects
 */
const EffectsManager = (function() {
  'use strict';

  let THREE = null;
  let scene = null;
  let camera = null;
  let config = null;
  let initialized = false;

  // Effect objects
  const effects = {
    lightning: { bolts: [], lastStrike: 0, group: null },
    aurora: { ribbons: [], group: null },
    grid: { floor: null, perspective: [], group: null },
    lights: { godRays: null, pulsingLights: [], group: null },
    particles: { system: null, geometry: null, material: null, velocities: [] },
    visual: { colorShiftHue: 0, shakeOffset: { x: 0, y: 0 } }
  };

  // Audio data for reactivity
  let audioData = { bass: 0, mid: 0, treble: 0, energy: 0 };
  let shipPosition = { x: 0, y: 0, z: 0 };

  /**
   * Initialize the effects manager
   */
  function init(threeLib, sceneRef, cameraRef) {
    THREE = threeLib;
    scene = sceneRef;
    camera = cameraRef;

    // Create groups for organization
    effects.lightning.group = new THREE.Group();
    effects.lightning.group.name = 'lightning-effects';
    scene.add(effects.lightning.group);

    effects.aurora.group = new THREE.Group();
    effects.aurora.group.name = 'aurora-effects';
    scene.add(effects.aurora.group);

    effects.grid.group = new THREE.Group();
    effects.grid.group.name = 'grid-effects';
    scene.add(effects.grid.group);

    effects.lights.group = new THREE.Group();
    effects.lights.group.name = 'lights-effects';
    scene.add(effects.lights.group);

    initialized = true;
    console.log("EffectsManager initialized");
  }

  /**
   * Update configuration from UI
   */
  function update(newConfig) {
    config = newConfig;
    if (!initialized) return;

    // Rebuild effects if needed
    rebuildLightning();
    rebuildAurora();
    rebuildGrid();
    rebuildLights();
    rebuildParticles();
  }

  /**
   * Set audio data for reactivity
   */
  function setAudioData(data) {
    audioData = data;
  }

  /**
   * Set ship position for effects positioning
   */
  function setShipPosition(pos) {
    shipPosition = pos;
  }

  // ============================================================================
  // LIGHTNING EFFECT
  // ============================================================================
  function rebuildLightning() {
    if (!config || !effects.lightning.group) return;

    // Clear existing bolts
    while (effects.lightning.group.children.length > 0) {
      const child = effects.lightning.group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      effects.lightning.group.remove(child);
    }
    effects.lightning.bolts = [];

    if (!config.lightning.enabled) return;

    // Pre-create lightning bolt geometries
    for (let i = 0; i < 5; i++) {
      const bolt = createLightningBolt();
      bolt.visible = false;
      effects.lightning.group.add(bolt);
      effects.lightning.bolts.push(bolt);
    }
  }

  function createLightningBolt() {
    const points = [];
    const segments = 15;
    const startY = 30;
    const endY = -5;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = startY - t * (startY - endY);
      const x = (Math.random() - 0.5) * 8 * Math.sin(t * Math.PI);
      const z = (Math.random() - 0.5) * 4;
      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const color = new THREE.Color(config?.lightning?.color || '#00ffff');
    const material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Line(geometry, material);
  }

  function updateLightning(time, deltaTime) {
    if (!config?.lightning?.enabled || !effects.lightning.group) return;

    const bandValue = getAudioBandValue(config.lightning.band);
    const threshold = 1 - config.lightning.frequency;
    const timeSinceStrike = time - effects.lightning.lastStrike;

    // Trigger lightning based on audio and frequency
    if (bandValue > threshold * 0.8 && timeSinceStrike > 0.1) {
      const bolt = effects.lightning.bolts[Math.floor(Math.random() * effects.lightning.bolts.length)];
      if (bolt) {
        // Regenerate bolt path
        const points = [];
        const segments = 15;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const y = 30 - t * 35;
          const x = (Math.random() - 0.5) * 10 * Math.sin(t * Math.PI);
          const z = (Math.random() - 0.5) * 6;
          points.push(new THREE.Vector3(x, y, z));
        }
        bolt.geometry.setFromPoints(points);

        // Position near ship
        bolt.position.set(
          shipPosition.x + (Math.random() - 0.5) * 40,
          0,
          shipPosition.z + 20 + Math.random() * 30
        );

        bolt.material.opacity = config.lightning.intensity;
        bolt.material.color.set(config.lightning.color);
        bolt.visible = true;
        bolt.userData.fadeTime = time;
        effects.lightning.lastStrike = time;
      }
    }

    // Fade out bolts
    effects.lightning.bolts.forEach(bolt => {
      if (bolt.visible && bolt.userData.fadeTime) {
        const fadeElapsed = time - bolt.userData.fadeTime;
        bolt.material.opacity = Math.max(0, config.lightning.intensity * (1 - fadeElapsed * 5));
        if (bolt.material.opacity <= 0) {
          bolt.visible = false;
        }
      }
    });

    // Position group to follow ship
    effects.lightning.group.position.z = shipPosition.z;
  }

  // ============================================================================
  // AURORA EFFECT
  // ============================================================================
  function rebuildAurora() {
    if (!config || !effects.aurora.group) return;

    // Clear existing ribbons
    while (effects.aurora.group.children.length > 0) {
      const child = effects.aurora.group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      effects.aurora.group.remove(child);
    }
    effects.aurora.ribbons = [];

    if (!config.aurora.enabled) return;

    // Create aurora ribbons
    const ribbonCount = config.aurora.ribbons;
    for (let i = 0; i < ribbonCount; i++) {
      const ribbon = createAuroraRibbon(i, ribbonCount);
      effects.aurora.group.add(ribbon);
      effects.aurora.ribbons.push(ribbon);
    }
  }

  function createAuroraRibbon(index, total) {
    const width = 60;
    const height = 8;
    const segments = 50;

    const geometry = new THREE.PlaneGeometry(width, height, segments, 1);

    // Create gradient colors
    const colors = [];
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const t = (x + width / 2) / width;
      const hue = 0.3 + t * 0.4 + index * 0.1; // Green to cyan to blue
      const color = new THREE.Color().setHSL(hue % 1, 0.8, 0.5);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3 * config.aurora.intensity,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const ribbon = new THREE.Mesh(geometry, material);
    ribbon.position.set(0, 15 + index * 3, 30);
    ribbon.rotation.x = -0.3;
    ribbon.userData = { phase: index * Math.PI / total, baseY: 15 + index * 3 };

    return ribbon;
  }

  function updateAurora(time, deltaTime) {
    if (!config?.aurora?.enabled || !effects.aurora.group) return;

    const bandValue = getAudioBandValue(config.aurora.band);
    const speed = config.aurora.speed;

    effects.aurora.ribbons.forEach((ribbon, i) => {
      // Wave motion
      const positions = ribbon.geometry.attributes.position.array;
      for (let j = 0; j < positions.length; j += 3) {
        const x = positions[j];
        const wave = Math.sin(x * 0.1 + time * speed * 2 + ribbon.userData.phase) * 2;
        const audioWave = bandValue * Math.sin(x * 0.2 + time * 3) * 3;
        positions[j + 1] = wave + audioWave;
      }
      ribbon.geometry.attributes.position.needsUpdate = true;

      // Opacity based on audio
      ribbon.material.opacity = 0.2 + bandValue * 0.4 * config.aurora.intensity;

      // Follow ship
      ribbon.position.z = shipPosition.z + 30 + i * 5;
    });
  }

  // ============================================================================
  // GRID EFFECT
  // ============================================================================
  function rebuildGrid() {
    if (!config || !effects.grid.group) return;

    // Clear existing grid
    while (effects.grid.group.children.length > 0) {
      const child = effects.grid.group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      effects.grid.group.remove(child);
    }
    effects.grid.perspective = [];

    if (!config.grid.enabled) return;

    const color = new THREE.Color(config.grid.color);
    const spacing = config.grid.spacing;

    // Floor grid
    if (config.grid.floor) {
      const gridSize = 200;
      const divisions = Math.floor(gridSize / spacing);

      const floorGrid = new THREE.GridHelper(gridSize, divisions, color, color);
      floorGrid.material.transparent = true;
      floorGrid.material.opacity = config.grid.intensity;
      floorGrid.material.blending = THREE.AdditiveBlending;
      floorGrid.position.y = -2;
      effects.grid.floor = floorGrid;
      effects.grid.group.add(floorGrid);
    }

    // Perspective lines (vertical pillars of light)
    if (config.grid.perspective) {
      const lineCount = 20;
      for (let i = 0; i < lineCount; i++) {
        const geometry = new THREE.BufferGeometry();
        const x = (i - lineCount / 2) * spacing * 2;
        const points = [
          new THREE.Vector3(x, -2, 0),
          new THREE.Vector3(x, 25, 0)
        ];
        geometry.setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: config.grid.intensity * 0.5,
          blending: THREE.AdditiveBlending
        });

        const line = new THREE.Line(geometry, material);
        effects.grid.perspective.push(line);
        effects.grid.group.add(line);
      }
    }
  }

  function updateGrid(time, deltaTime) {
    if (!config?.grid?.enabled || !effects.grid.group) return;

    const bandValue = getAudioBandValue(config.grid.band);

    // Pulse opacity with audio
    if (effects.grid.floor) {
      effects.grid.floor.material.opacity = config.grid.intensity * (0.5 + bandValue * 0.5);
      effects.grid.floor.position.z = shipPosition.z;
    }

    // Animate perspective lines
    effects.grid.perspective.forEach((line, i) => {
      line.position.z = shipPosition.z;
      const pulse = Math.sin(time * 2 + i * 0.3) * 0.2;
      line.material.opacity = config.grid.intensity * (0.3 + bandValue * 0.5 + pulse);
    });
  }

  // ============================================================================
  // LIGHTS / GOD RAYS EFFECT
  // ============================================================================
  function rebuildLights() {
    if (!config || !effects.lights.group) return;

    // Clear existing lights
    while (effects.lights.group.children.length > 0) {
      const child = effects.lights.group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      effects.lights.group.remove(child);
    }
    effects.lights.pulsingLights = [];

    if (!config.lights.enabled) return;

    // Create god rays (volumetric light shafts)
    if (config.lights.godRays) {
      const rayCount = 5;
      for (let i = 0; i < rayCount; i++) {
        const geometry = new THREE.ConeGeometry(3, 40, 8, 1, true);
        const material = new THREE.MeshBasicMaterial({
          color: 0xffffcc,
          transparent: true,
          opacity: config.lights.godRayIntensity * 0.15,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        });

        const ray = new THREE.Mesh(geometry, material);
        ray.rotation.x = Math.PI;
        ray.position.set(
          (i - rayCount / 2) * 15,
          35,
          0
        );
        ray.userData = { baseX: ray.position.x, phase: i * Math.PI / rayCount };
        effects.lights.pulsingLights.push(ray);
        effects.lights.group.add(ray);
      }
    }

    // Create pulsing point lights
    const lightColors = [0xff6600, 0x00ff66, 0x6600ff, 0xff0066];
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(lightColors[i], 0.5, 30);
      light.position.set(
        (i - 1.5) * 10,
        5 + Math.random() * 5,
        10
      );
      light.userData = { baseIntensity: 0.5, phase: i * Math.PI / 2 };
      effects.lights.pulsingLights.push(light);
      effects.lights.group.add(light);
    }
  }

  function updateLights(time, deltaTime) {
    if (!config?.lights?.enabled || !effects.lights.group) return;

    const bandValue = getAudioBandValue(config.lights.band);

    effects.lights.group.position.z = shipPosition.z;

    effects.lights.pulsingLights.forEach((light, i) => {
      if (light.isPointLight) {
        // Pulsing point lights
        if (config.lights.pulse) {
          const pulse = Math.sin(time * 3 + light.userData.phase);
          light.intensity = light.userData.baseIntensity * (1 + bandValue * 2 + pulse * 0.3);
        }
      } else {
        // God rays
        if (config.lights.godRays) {
          const sway = Math.sin(time * 0.5 + light.userData.phase) * 5;
          light.position.x = light.userData.baseX + sway;
          light.material.opacity = config.lights.godRayIntensity * (0.1 + bandValue * 0.2);
        }
      }
    });
  }

  // ============================================================================
  // PARTICLES EFFECT
  // ============================================================================
  function rebuildParticles() {
    if (!config || !scene) return;

    // Remove existing particle system
    if (effects.particles.system) {
      scene.remove(effects.particles.system);
      if (effects.particles.geometry) effects.particles.geometry.dispose();
      if (effects.particles.material) effects.particles.material.dispose();
    }

    if (!config.particles.enabled) return;

    const count = config.particles.count;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    effects.particles.velocities = [];

    // Particle type determines color and behavior
    const typeColors = {
      dust: { h: 0.1, s: 0.3, l: 0.6 },
      sparks: { h: 0.08, s: 0.9, l: 0.6 },
      bubbles: { h: 0.55, s: 0.6, l: 0.7 },
      embers: { h: 0.05, s: 0.9, l: 0.5 },
      snow: { h: 0, s: 0, l: 0.95 },
      stars: { h: 0.15, s: 0.2, l: 0.9 }
    };

    const typeConfig = typeColors[config.particles.type] || typeColors.dust;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 25 - 5;
      positions[i * 3 + 2] = Math.random() * 150;

      const hue = typeConfig.h + (Math.random() - 0.5) * 0.1;
      const color = new THREE.Color().setHSL(hue, typeConfig.s, typeConfig.l);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      effects.particles.velocities.push({
        x: (Math.random() - 0.5) * 0.1,
        y: config.particles.type === 'bubbles' ? 0.05 : -0.02,
        z: (Math.random() - 0.5) * 0.1
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: config.particles.size,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    effects.particles.system = new THREE.Points(geometry, material);
    effects.particles.geometry = geometry;
    effects.particles.material = material;
    scene.add(effects.particles.system);
  }

  function updateParticles(time, deltaTime) {
    if (!config?.particles?.enabled || !effects.particles.system) return;

    const bandValue = getAudioBandValue(config.particles.band);
    const positions = effects.particles.geometry.attributes.position.array;
    const speed = config.particles.speed;

    for (let i = 0; i < config.particles.count; i++) {
      const vel = effects.particles.velocities[i];

      // Move particles
      positions[i * 3] += vel.x * speed * (1 + bandValue);
      positions[i * 3 + 1] += vel.y * speed;
      positions[i * 3 + 2] += vel.z * speed;

      // Respawn if out of bounds relative to ship
      const pz = positions[i * 3 + 2];
      if (pz < shipPosition.z - 20) {
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = Math.random() * 25 - 5;
        positions[i * 3 + 2] = shipPosition.z + 50 + Math.random() * 100;
      } else if (pz > shipPosition.z + 150) {
        positions[i * 3 + 2] = shipPosition.z - 10;
      }

      // Y bounds
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 20;
      } else if (positions[i * 3 + 1] > 25) {
        positions[i * 3 + 1] = -5;
      }
    }

    effects.particles.geometry.attributes.position.needsUpdate = true;

    // Update size based on config
    effects.particles.material.size = config.particles.size * (0.8 + bandValue * 0.4);
  }

  // ============================================================================
  // VISUAL STYLE EFFECTS
  // ============================================================================
  function updateVisualStyle(time, deltaTime) {
    if (!config) return;

    // Color shift
    if (config.visual.colorShift) {
      effects.visual.colorShiftHue += deltaTime * 0.1;
      if (effects.visual.colorShiftHue > 1) effects.visual.colorShiftHue = 0;

      // Apply to various materials
      const shiftColor = new THREE.Color().setHSL(effects.visual.colorShiftHue, 0.7, 0.5);
      effects.lightning.bolts.forEach(bolt => {
        if (bolt.material) bolt.material.color.copy(shiftColor);
      });
    }

    // Screen shake (return offset for camera)
    if (config.visual.screenShake && audioData.energy > 0.7) {
      const intensity = (audioData.energy - 0.7) * 3;
      effects.visual.shakeOffset.x = (Math.random() - 0.5) * intensity * 0.5;
      effects.visual.shakeOffset.y = (Math.random() - 0.5) * intensity * 0.3;
    } else {
      effects.visual.shakeOffset.x *= 0.9;
      effects.visual.shakeOffset.y *= 0.9;
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  function getAudioBandValue(band) {
    switch (band) {
      case 'bass': return audioData.bass || 0;
      case 'mid': return audioData.mid || 0;
      case 'treble': return audioData.treble || 0;
      case 'energy': return audioData.energy || 0;
      default: return audioData.energy || 0;
    }
  }

  /**
   * Main update loop - call this from the render loop
   */
  function render(time, deltaTime) {
    if (!initialized || !config) return;

    updateLightning(time, deltaTime);
    updateAurora(time, deltaTime);
    updateGrid(time, deltaTime);
    updateLights(time, deltaTime);
    updateParticles(time, deltaTime);
    updateVisualStyle(time, deltaTime);
  }

  /**
   * Get screen shake offset for camera
   */
  function getShakeOffset() {
    return effects.visual.shakeOffset;
  }

  /**
   * Get fog density multiplier
   */
  function getFogDensityMultiplier() {
    return config?.visual?.fogDensity || 1.0;
  }

  /**
   * Get speed lines intensity
   */
  function getSpeedLinesIntensity() {
    return config?.visual?.speedLines || 1.0;
  }

  /**
   * Dispose all effects
   */
  function dispose() {
    if (!scene) return;

    [effects.lightning.group, effects.aurora.group, effects.grid.group, effects.lights.group].forEach(group => {
      if (group) {
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
      }
    });

    if (effects.particles.system) {
      scene.remove(effects.particles.system);
      if (effects.particles.geometry) effects.particles.geometry.dispose();
      if (effects.particles.material) effects.particles.material.dispose();
    }

    initialized = false;
  }

  // Public API
  return {
    init,
    update,
    render,
    setAudioData,
    setShipPosition,
    getShakeOffset,
    getFogDensityMultiplier,
    getSpeedLinesIntensity,
    dispose
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EffectsManager;
}
