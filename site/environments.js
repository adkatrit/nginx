/**
 * Themed Environments - Different visual worlds for each track
 * Automatically selects environment based on track theme
 */

(function() {
  'use strict';

  // Environment configurations for each track
  const ENVIRONMENT_THEMES = {
    "Data Tide": {
      type: "ocean",
      groundColor: 0x001a2c,
      skyTop: 0x000510,
      skyBottom: 0x001830,
      fogColor: 0x000810,
      fogNear: 50,
      fogFar: 600,
      scenery: ["coral", "seaweed", "fish"],
      particleColor: 0x00bfff,
      particleType: "bubbles"
    },
    "Soft Systems": {
      type: "meadow",
      groundColor: 0x1a3020,
      skyTop: 0x87ceeb,
      skyBottom: 0xc8e6c9,
      fogColor: 0xc8e6c9,
      fogNear: 80,
      fogFar: 700,
      scenery: ["flowers", "grass", "butterflies"],
      particleColor: 0x98fb98,
      particleType: "petals"
    },
    "Beast Mode": {
      type: "volcanic",
      groundColor: 0x1a0808,
      skyTop: 0x0a0000,
      skyBottom: 0x1a0505,
      fogColor: 0x0a0000,
      fogNear: 40,
      fogFar: 500,
      scenery: ["rocks", "lava", "flames"],
      particleColor: 0xff4400,
      particleType: "embers"
    },
    "Dreams Bleed Into Dashboards": {
      type: "cyber",
      groundColor: 0x0a0015,
      skyTop: 0x05000a,
      skyBottom: 0x150020,
      fogColor: 0x08000f,
      fogNear: 60,
      fogFar: 550,
      scenery: ["towers", "holograms", "grids"],
      particleColor: 0xff00ff,
      particleType: "data"
    },
    "Signal Integrity": {
      type: "ice",
      groundColor: 0x1a2a3a,
      skyTop: 0x87ceeb,
      skyBottom: 0xe0f7fa,
      fogColor: 0xe0f7fa,
      fogNear: 70,
      fogFar: 800,
      scenery: ["crystals", "icebergs", "snowdrifts"],
      particleColor: 0x88ffff,
      particleType: "snow"
    },
    "Gi Mi Di Reins": {
      type: "savanna",
      groundColor: 0x8b7355,
      skyTop: 0xff8c00,
      skyBottom: 0xffd700,
      fogColor: 0xffecd2,
      fogNear: 80,
      fogFar: 800,
      scenery: ["acacias", "grass", "rocks"],
      particleColor: 0xffd700,
      particleType: "dust"
    },
    "Trade You My Hands": {
      type: "blossom",
      groundColor: 0x2d1f1f,
      skyTop: 0xffb6c1,
      skyBottom: 0xffc0cb,
      fogColor: 0xffc0cb,
      fogNear: 70,
      fogFar: 650,
      scenery: ["cherrytrees", "petals", "lanterns"],
      particleColor: 0xffb6c1,
      particleType: "petals"
    },
    "Push Harder": {
      type: "industrial",
      groundColor: 0x1c1c1c,
      skyTop: 0x2a2020,
      skyBottom: 0x100808,
      fogColor: 0x100808,
      fogNear: 50,
      fogFar: 500,
      scenery: ["pipes", "girders", "sparks"],
      particleColor: 0xff4500,
      particleType: "sparks"
    },
    "The Last Dragon": {
      type: "ancient",
      groundColor: 0x1a1025,
      skyTop: 0x030208,
      skyBottom: 0x100818,
      fogColor: 0x050310,
      fogNear: 60,
      fogFar: 600,
      scenery: ["ruins", "pillars", "torches"],
      particleColor: 0xff6600,
      particleType: "embers"
    },
    "Who's Learning Who": {
      type: "matrix",
      groundColor: 0x000800,
      skyTop: 0x000400,
      skyBottom: 0x001000,
      fogColor: 0x001000,
      fogNear: 50,
      fogFar: 550,
      scenery: ["nodes", "datastreams", "grids"],
      particleColor: 0x00ff00,
      particleType: "code"
    }
  };

  // Default desert config
  const DEFAULT_ENV = {
    type: "desert",
    groundColor: 0xd4a574,
    skyTop: 0x4a90c2,
    skyBottom: 0xffecd2,
    fogColor: 0xffecd2,
    fogNear: 70,
    fogFar: 800,
    scenery: ["rocks", "cacti"],
    particleColor: 0xd4a574,
    particleType: "dust"
  };

  const CONFIG = {
    // Movement - reduced defaults for smoother, chiller experience
    baseSpeed: 1.0,        // Reduced from 2.0 for relaxed cruising
    maxSpeed: 2.5,         // Reduced from 4.0
    boostSpeed: 4.0,       // Reduced from 6.0
    boostDuration: 2.5,
    speedMultiplier: 1.0,  // Can be adjusted via UI (0.25 - 2.0)

    // Terrain - increased for better visibility at high speeds
    chunkSize: 100,
    chunksAhead: 8,      // Increased from 4 for longer draw distance
    chunksBehind: 1,
    viewDistance: 800,   // Increased from 400

    // Camera
    cameraHeight: 4,
    cameraDistance: 12,
    cameraLookAhead: 20,
    cameraFar: 1200,     // Camera far plane for long draw distance
    cameraShakeIntensity: 0.5,
    cameraShakeDuration: 0.3,

    // Controls (smoother steering)
    // Higher = steering reacts faster to key changes
    steerResponse: 16,
    steerResponseShiftMult: 2.1,
    steerSpeedShiftMult: 1.6,

    // Racer model normalization (make different GLTFs appear similarly sized)
    racerNormalizeSize: true,
    racerTargetMaxDim: 1.6, // world units (largest bounding-box dimension after scaling)

    // Flight (this is now a flying game)
    flightEnabled: true,
    flightStartY: 6.0,
    flightMinY: 1.2,
    flightMaxY: 18.0,
    verticalResponse: 14,
    verticalResponseShiftMult: 2.0,
    verticalSpeedMult: 1.0,
    verticalSpeedShiftMult: 1.55,
    pitchFromClimb: 0.22,

    // Ride path (visual readability)
    pathEnabled: true,
    pathWidth: 30,
    pathLength: 260,
    pathOffsetAhead: 110,
    pathOpacity: 0.18,
    pathLaneOpacity: 0.28,

    // Parallax silhouettes (depth)
    parallaxEnabled: true,
    parallaxFactorZ: 0.28,     // 0..1 (lower = slower, more depth)
    parallaxFactorX: 0.22,
    parallaxSpanZ: 1400,
    parallaxCount: 26,
    parallaxXRange: [85, 150],

    // Vista moments (wow)
    vistaEnabled: true,
    vistaMinEnergy: 0.68,
    vistaDuration: 2.6,
    vistaCooldown: 5.0,

    // Visual Effects
    speedLinesEnabled: true,
    speedLinesCount: 100,
    speedLinesMinSpeed: 3.0,
    trailEnabled: true,
    trailLength: 20,
    trailFadeRate: 0.95,
    pulseEnabled: true,
    pulseIntensity: 0.3,
    colorShiftEnabled: true,
    colorShiftSpeed: 0.5,
    bloomEnabled: true,
    bloomIntensity: 0.5,
    screenShakeOnHit: true,

    // Particles
    particleCount: 500,
    particleSpeedMultiplier: 1.5,
    particleSizeRange: [0.1, 0.5],

    // Scoring
    baseScorePerSecond: 10,
    comboBuildTime: 5,
    maxCombo: 10,
    hitPenalty: 50,
    hitCooldownTime: 1.0,

    // Chill Ride "Flow" + Gates
    // Flow is a 0..1 meter that rewards smooth, centered steering.
    flowStart: 0.75,
    flowCenterWeight: 0.35,
    flowAccelWeight: 0.85,
    flowAccelRef: 220,            // Higher = more forgiving steering
    flowRiseRate: 0.35,
    flowFallRate: 0.55,
    flowCollisionPenalty: 0.18,

    // Flow gates (soft “targets” on the ride)
    gateEnabled: true,
    gateRadius: 7.0,
    gateTube: 0.32,
    gateInnerPad: 0.65,          // Shrinks inner radius for leniency
    gateSpawnAhead: 140,         // Distance in front of player
    gateSpawnJitter: 30,
    gateBeatCooldown: 0.28,      // Minimum seconds between beat gates
    gateSpacingBase: 220,        // Distance between non-beat gates
    gateSpacingQuietBonus: 160,  // Extra spacing when energy is low
    gateScore: 35,
    gateFlowBoost: 0.09,
    gateMissFlowPenalty: 0.06
  };

  // Available racer models
  // - rotationY: Math.PI = facing away, Math.PI/2 = facing right (towards screen)
  // - collisionRadius: hitbox size for the model (adjusted per model size/shape)
  // - offsetY: vertical offset to position model correctly above ground
  const SELECTABLE_RACERS = /** @type {const} */ (['white-eagle', 'jellyfish']);
  const RACER_MODELS = {
    'racer_spaceship': { url: './models/racer_spaceship/scene.gltf', scale: 0.5, rotationY: Math.PI, collisionRadius: 1.2, offsetY: 0 },
    'white-eagle': { url: './models/white-eagle/scene.gltf', scale: 0.04, rotationY: Math.PI * 1.5, collisionRadius: 1.6, offsetY: 0.0 },
    'icy_dragon': { url: './models/icy_dragon/scene.gltf', scale: 0.8, rotationY: Math.PI, collisionRadius: 1.5, offsetY: 0 },
    'butterfly': { url: './models/butterfly/scene.gltf', scale: 0.05, rotationY: Math.PI, collisionRadius: 0.5, offsetY: 0.5 },
    'biped_robot': { url: './models/biped_robot/scene.gltf', scale: 0.5, rotationY: Math.PI, collisionRadius: 0.8, offsetY: 0 },
    'jellyfish': { url: './models/jellyfish/scene.gltf', scale: 0.5, rotationY: Math.PI, collisionRadius: 0.6, offsetY: 0.5 },
    'blue-whale': { url: './models/blue-whale/scene.gltf', scale: 0.02, rotationY: Math.PI, collisionRadius: 1.0, offsetY: 0.5 },
    'godzilla': { url: './models/godzilla/scene.gltf', scale: 0.3, rotationY: Math.PI, collisionRadius: 1.2, offsetY: 0 },
    'gorilla': { url: './models/gorilla/scene.gltf', scale: 0.02, rotationY: Math.PI, collisionRadius: 0.6, offsetY: 0 },
    'loggerhead': { url: './models/loggerhead/scene.gltf', scale: 0.1, rotationY: Math.PI, collisionRadius: 0.7, offsetY: 0.3 }
  };

  class ThemedEnvironment {
    constructor(THREE, scene, camera, renderer, gltfLoader) {
      this.THREE = THREE;
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.gltfLoader = gltfLoader;

      this.theme = { ...DEFAULT_ENV };
      this.distance = 0;
      this.lateralPos = 0;
      this.altitude = CONFIG.flightStartY;
      this.speed = CONFIG.baseSpeed;
      this.steerInput = 0;
      this.verticalInput = 0;
      this._leftDown = false;
      this._rightDown = false;
      this._upDown = false;
      this._downDown = false;
      this._shiftDown = false;
      this.boosting = false;
      this.boostTimer = 0;

      this.chunks = [];
      this.nextChunkZ = 0;

      this.sky = null;
      this.sun = null;
      this.particles = null;
      this.groundPlane = null;
      this.player = null;
      this.playerModel = null;   // GLTF model reference
      this.modelAnimationMixer = null;  // Animation mixer for GLTF model
      this.leftGlow = null;
      this.rightGlow = null;

      this.audioData = { bass: 0, mid: 0, treble: 0, energy: 0, beatPulse: 0, beatHit: false };
      this.time = 0;
      this.initialized = false;

      // Racer model configuration (restricted to a small set for the "flying game")
      {
        const saved = localStorage.getItem('mysongs-racer-model') || 'white-eagle';
        const normalized = (SELECTABLE_RACERS.includes(saved) && RACER_MODELS[saved]) ? saved : 'white-eagle';
        this.racerModelId = normalized;
        if (normalized !== saved) localStorage.setItem('mysongs-racer-model', normalized);
      }
      this.playerCollisionRadius = 1.5;  // Default, updated when model loads
      this.playerOffsetY = 0;  // Vertical offset for model

      // Speed multiplier (0.25 to 2.0, default 1.0)
      const savedSpeed = parseFloat(localStorage.getItem('mysongs-cruise-speed') || '1.0');
      this.speedMultiplier = Math.max(0.25, Math.min(2.0, savedSpeed));

      // Scoring system
      this.score = 0;
      this.combo = 1;
      this.comboTimer = 0;
      this.lastHitTime = 0;
      this.hitCooldown = 0;
      this.trackTitle = null;
      this.onScoreChange = null;  // Callback for score updates
      this.onHit = null;  // Callback for collision

      // Chill Ride "Flow" system
      this.flow = CONFIG.flowStart;
      this.flowMax = this.flow;
      this.flowSum = 0;
      this.flowTime = 0;
      this._lastLateralPos = 0;
      this._lastLateralVel = 0;
      this._lastAltitude = this.altitude;
      this._lastAltitudeVel = 0;
      this._flowHudTimer = 0;
      this.onFlowChange = null; // Callback for flow/gates updates

      // Flow gates
      this.flowGateGroup = null;
      this.flowGates = [];
      this.gateStreak = 0;
      this.maxGateStreak = 0;
      this.gatesHit = 0;
      this.gatesMissed = 0;
      this._lastGateTime = -999;
      this._nextGateZ = 0;

      // Visual effects
      this.speedLines = null;
      this.trail = [];
      this.cameraShake = { x: 0, y: 0, timer: 0 };
      this.colorShiftHue = 0;
      this.pulsePhase = 0;
      this.ambientLight = null;
      this.directionalLight = null;

      // Ride path overlay (ribbon + lane lines)
      this.pathGroup = null;
      this.pathRibbon = null;
      this.pathRibbonMat = null;
      this.pathLaneLines = null;
      this.pathLaneMat = null;

      // Parallax backdrop (silhouettes)
      this.parallaxGroup = null;
      this.parallaxObjects = [];

      // Vista moments (sky/fog/lighting tint)
      this.vista = { timer: 0, duration: CONFIG.vistaDuration, cooldown: 0, intensity: 0 };
      this._baseFogColor = null;
      this._baseSkyTop = null;
      this._baseSkyBottom = null;

      // World tuning (can be overridden via effects panel)
      this.world = {
        pathEnabled: CONFIG.pathEnabled,
        pathWidth: CONFIG.pathWidth,
        pathLength: CONFIG.pathLength,
        pathOffsetAhead: CONFIG.pathOffsetAhead,
        pathOpacity: CONFIG.pathOpacity,
        pathLaneOpacity: CONFIG.pathLaneOpacity,

        parallaxEnabled: CONFIG.parallaxEnabled,
        parallaxFactorZ: CONFIG.parallaxFactorZ,
        parallaxFactorX: CONFIG.parallaxFactorX,
        parallaxSpanZ: CONFIG.parallaxSpanZ,
        parallaxCount: CONFIG.parallaxCount,
        parallaxXRange: CONFIG.parallaxXRange,

        vistaEnabled: CONFIG.vistaEnabled,
        vistaMinEnergy: CONFIG.vistaMinEnergy,
        vistaDuration: CONFIG.vistaDuration,
        vistaCooldown: CONFIG.vistaCooldown
      };
    }

    applyEffectsConfig(config) {
      this.effectsConfig = config || this.effectsConfig;
      const world = this.effectsConfig?.world;
      if (!world) return;

      const prev = { ...this.world };

      // Merge supported world parameters
      if (typeof world.pathEnabled === 'boolean') this.world.pathEnabled = world.pathEnabled;
      if (Number.isFinite(world.pathOpacity)) this.world.pathOpacity = Math.max(0, Math.min(1, world.pathOpacity));
      if (Number.isFinite(world.pathLaneOpacity)) this.world.pathLaneOpacity = Math.max(0, Math.min(1, world.pathLaneOpacity));

      if (typeof world.parallaxEnabled === 'boolean') this.world.parallaxEnabled = world.parallaxEnabled;
      if (Number.isFinite(world.parallaxFactorZ)) this.world.parallaxFactorZ = Math.max(0.05, Math.min(0.9, world.parallaxFactorZ));
      // Keep X tied to Z for a coherent feel, unless explicitly provided later.
      this.world.parallaxFactorX = Math.max(0.05, Math.min(0.9, this.world.parallaxFactorZ * 0.8));

      if (typeof world.vistaEnabled === 'boolean') this.world.vistaEnabled = world.vistaEnabled;
      if (Number.isFinite(world.vistaMinEnergy)) this.world.vistaMinEnergy = Math.max(0, Math.min(1, world.vistaMinEnergy));
      if (Number.isFinite(world.vistaDuration)) this.world.vistaDuration = Math.max(0.5, Math.min(10, world.vistaDuration));
      if (Number.isFinite(world.vistaCooldown)) this.world.vistaCooldown = Math.max(0.5, Math.min(20, world.vistaCooldown));

      // Rebuild systems if toggles changed
      const pathToggleChanged = prev.pathEnabled !== this.world.pathEnabled;
      const parallaxToggleChanged = prev.parallaxEnabled !== this.world.parallaxEnabled;

      if (pathToggleChanged) {
        if (this.pathGroup) {
          this.scene.remove(this.pathGroup);
          this.pathGroup.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          this.pathGroup = null;
          this.pathRibbon = null;
          this.pathRibbonMat = null;
          this.pathLaneLines = null;
          this.pathLaneMat = null;
        }
        if (this.world.pathEnabled) this.createRidePath();
      }

      if (parallaxToggleChanged) {
        if (this.parallaxGroup) {
          this.scene.remove(this.parallaxGroup);
          this.parallaxGroup.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          this.parallaxGroup = null;
          this.parallaxObjects = [];
        }
        if (this.world.parallaxEnabled) this.createParallaxBackdrop();
      }

      // Vista values are used dynamically; no rebuild needed.
    }

    init(trackTitle) {
      this.setTheme(trackTitle);
      this.trackTitle = trackTitle;
      const THREE = this.THREE;

      // Reset score for new track
      this.score = 0;
      this.combo = 1;
      this.comboTimer = 0;
      this.lastHitTime = 0;
      this.hitCooldown = 0;

      // Flight reset
      this.altitude = CONFIG.flightStartY;
      this.verticalInput = 0;
      this._upDown = false;
      this._downDown = false;

      // Reset flow + gate stats for new track/run
      this.flow = CONFIG.flowStart;
      this.flowMax = this.flow;
      this.flowSum = 0;
      this.flowTime = 0;
      this._lastLateralPos = this.lateralPos;
      this._lastLateralVel = 0;
      this._lastAltitude = this.altitude;
      this._lastAltitudeVel = 0;
      this._flowHudTimer = 0;

      this.gateStreak = 0;
      this.maxGateStreak = 0;
      this.gatesHit = 0;
      this.gatesMissed = 0;
      this.flowGates = [];
      this._lastGateTime = -999;
      this._nextGateZ = this.distance + CONFIG.gateSpawnAhead;

      // Create a dedicated group for flow gates
      if (this.flowGateGroup) {
        this.scene.remove(this.flowGateGroup);
        this.flowGateGroup = null;
      }
      this.flowGateGroup = new THREE.Group();
      this.flowGateGroup.name = 'flow-gates';
      this.scene.add(this.flowGateGroup);

      // Set camera far plane for long draw distance
      if (this.camera) {
        this.camera.far = CONFIG.cameraFar;
        this.camera.updateProjectionMatrix();
      }

      this.scene.fog = new THREE.Fog(this.theme.fogColor, this.theme.fogNear, this.theme.fogFar);
      this._baseFogColor = new THREE.Color(this.theme.fogColor);

      this.createSky();
      this.createGroundPlane();
      this.createRidePath();
      this.createParallaxBackdrop();
      this.createPlayer();
      this.createParticles();
      this.createLighting();
      this.createSpeedLines();
      this.createTrail();
      this.setupInput();

      for (let i = 0; i < CONFIG.chunksAhead + CONFIG.chunksBehind; i++) {
        this.generateChunk();
      }

      // Apply any loaded effects panel tuning (path/parallax/vista)
      this.applyEffectsConfig(this.effectsConfig);

      this.updateCamera();
      this.initialized = true;
      console.log("Environment initialized:", this.theme.type);
    }

    setTheme(trackTitle) {
      this.theme = ENVIRONMENT_THEMES[trackTitle] || { ...DEFAULT_ENV };
      console.log("Environment theme set:", this.theme.type, "for", trackTitle);
    }

    createSky() {
      const THREE = this.THREE;

      const skyGeom = new THREE.SphereGeometry(CONFIG.viewDistance * 0.95, 32, 32);
      const skyMat = new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(this.theme.skyTop) },
          bottomColor: { value: new THREE.Color(this.theme.skyBottom) },
          offset: { value: 10 },
          exponent: { value: 0.4 }
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }
        `,
        side: THREE.BackSide
      });

      this.sky = new THREE.Mesh(skyGeom, skyMat);
      this.scene.add(this.sky);

      // Cache base colors for vista tinting
      this._baseSkyTop = skyMat.uniforms.topColor.value.clone();
      this._baseSkyBottom = skyMat.uniforms.bottomColor.value.clone();
    }

    createGroundPlane() {
      const THREE = this.THREE;

      const planeSize = CONFIG.viewDistance * 2;
      const planeGeom = new THREE.PlaneGeometry(planeSize, planeSize, 32, 32);
      const planeMat = new THREE.MeshStandardMaterial({
        color: this.theme.groundColor,
        roughness: 0.95,
        metalness: 0
      });

      this.groundPlane = new THREE.Mesh(planeGeom, planeMat);
      this.groundPlane.rotation.x = -Math.PI / 2;
      this.scene.add(this.groundPlane);
    }

    createRidePath() {
      if (!this.world.pathEnabled) return;
      const THREE = this.THREE;

      if (this.pathGroup) {
        this.scene.remove(this.pathGroup);
        this.pathGroup = null;
      }

      this.pathGroup = new THREE.Group();
      this.pathGroup.name = 'ride-path';
      // Lay the path flat on the ground (XZ plane)
      this.pathGroup.rotation.x = -Math.PI / 2;
      this.pathGroup.position.y = 0.02;
      this.scene.add(this.pathGroup);

      const w = this.world.pathWidth;
      const l = this.world.pathLength;
      // Single shader-based ribbon: subtle edge fade + distance fade + lane/dash lines.
      // This avoids the "big bright sticker" look and integrates with the scene.
      const geom = new THREE.PlaneGeometry(w, l, 1, 1);
      const accent = new THREE.Color(this.theme.particleColor || 0xffffff);

      this.pathRibbonMat = new THREE.ShaderMaterial({
        uniforms: {
          uAccent: { value: accent },
          uOpacity: { value: this.world.pathOpacity },
          uLaneOpacity: { value: this.world.pathLaneOpacity },
          uTime: { value: 0 },
          uBeat: { value: 0 },
          uFlow: { value: 0 },
          uWidth: { value: w },
          uLength: { value: l },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform vec3 uAccent;
          uniform float uOpacity;
          uniform float uLaneOpacity;
          uniform float uTime;
          uniform float uBeat;
          uniform float uFlow;
          uniform float uWidth;
          uniform float uLength;
          varying vec2 vUv;

          float saturate(float x) { return clamp(x, 0.0, 1.0); }

          // 1D line centered at x0 with half-width w
          float line(float x, float x0, float w) {
            float d = abs(x - x0);
            return 1.0 - smoothstep(0.0, w, d);
          }

          void main() {
            // vUv.x: 0..1 across width, vUv.y: 0..1 along length
            float x = (vUv.x - 0.5) * 2.0; // -1..1 across ribbon
            float y = vUv.y;               // 0..1 forward

            // Soft fade at edges and ends to avoid hard rectangles
            float edge = abs(x);
            float edgeFade = smoothstep(1.0, 0.55, edge);
            float endFade = smoothstep(0.02, 0.18, y) * smoothstep(0.98, 0.70, y);

            // Lane positions derived from current width (approx 3 lanes at -14,0,14)
            float halfW = max(1.0, uWidth * 0.5);
            float laneN = 14.0 / halfW; // normalized lane offset in [-1..1]
            float wLane = 0.012;        // line thickness (in normalized space)
            float lanes =
              line(x, -laneN, wLane) +
              line(x,  0.0,   wLane) +
              line(x,  laneN, wLane);

            // Center dashed guide (subtle)
            float dashFreq = 18.0;
            float dash = step(fract(y * dashFreq + uTime * 0.7), 0.45);
            float center = line(x, 0.0, wLane * 0.85) * dash;

            // Base ribbon glow (center-weighted), but kept subtle
            float centerGlow = pow(edgeFade, 1.8);
            float base = uOpacity * centerGlow;

            // Audio/flow modulation: tiny, so it doesn't become distracting
            float vibe = 0.85 + uFlow * 0.25 + uBeat * 0.20;

            float laneAlpha = uLaneOpacity * (0.65 * saturate(lanes) + 0.55 * center);
            float alpha = saturate((base + laneAlpha) * endFade) * vibe;

            // Color: slightly desaturated accent for comfort
            vec3 color = mix(vec3(0.02), uAccent, 0.55);
            color += uAccent * (0.35 * laneAlpha + 0.15 * base);

            // Prefer standard alpha blending for better integration
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending
      });

      this.pathRibbon = new THREE.Mesh(geom, this.pathRibbonMat);
      this.pathRibbon.position.y = this.world.pathOffsetAhead;
      this.pathGroup.add(this.pathRibbon);

      // Lane line meshes are no longer needed (kept null for cleanup consistency)
      this.pathLaneLines = null;
      this.pathLaneMat = null;
    }

    createParallaxBackdrop() {
      if (!this.world.parallaxEnabled) return;
      const THREE = this.THREE;

      if (this.parallaxGroup) {
        this.scene.remove(this.parallaxGroup);
        this.parallaxGroup = null;
      }
      this.parallaxGroup = new THREE.Group();
      this.parallaxGroup.name = 'parallax-backdrop';
      this.scene.add(this.parallaxGroup);
      this.parallaxObjects = [];

      const accent = this.theme.particleColor || 0xffffff;
      const dark = new THREE.Color(0x020205);
      const emissive = new THREE.Color(accent).multiplyScalar(0.05);

      const mat = new THREE.MeshStandardMaterial({
        color: dark,
        emissive,
        emissiveIntensity: 1.0,
        roughness: 1.0,
        metalness: 0.0
      });

      const span = this.world.parallaxSpanZ;
      const n = this.world.parallaxCount;
      for (let i = 0; i < n; i++) {
        const kind = Math.random();
        const h = 10 + Math.random() * 40;
        const geom = kind < 0.6
          ? new THREE.ConeGeometry(6 + Math.random() * 10, h, 7 + Math.floor(Math.random() * 4))
          : new THREE.BoxGeometry(10 + Math.random() * 18, h, 10 + Math.random() * 18);

        const m = mat.clone();
        m.emissive = emissive.clone().multiplyScalar(0.5 + Math.random() * 1.2);

        const mesh = new THREE.Mesh(geom, m);
        const side = Math.random() > 0.5 ? 1 : -1;
        const xr = this.world.parallaxXRange;
        mesh.position.x = side * (xr[0] + Math.random() * (xr[1] - xr[0]));
        mesh.position.y = h * 0.5 - 1;
        mesh.position.z = (Math.random() - 0.5) * span;
        mesh.rotation.y = Math.random() * Math.PI * 2;
        mesh.scale.setScalar(0.65 + Math.random() * 0.9);

        this.parallaxGroup.add(mesh);
        this.parallaxObjects.push(mesh);
      }
    }

    triggerVista(energy) {
      if (!this.world.vistaEnabled) return;
      if (this.vista.cooldown > 0) return;
      if (energy < this.world.vistaMinEnergy) return;

      this.vista.duration = this.world.vistaDuration;
      this.vista.timer = this.world.vistaDuration;
      this.vista.cooldown = this.world.vistaCooldown;
      this.vista.intensity = Math.min(1, 0.35 + energy * 0.85);
    }

    updateVista(dt) {
      if (!this.world.vistaEnabled) return;
      if (this.vista.cooldown > 0) this.vista.cooldown = Math.max(0, this.vista.cooldown - dt);
      if (this.vista.timer <= 0) {
        // Ensure base colors are restored
        if (this.scene.fog && this._baseFogColor) this.scene.fog.color.copy(this._baseFogColor);
        if (this.sky && this.sky.material && this._baseSkyTop && this._baseSkyBottom) {
          const u = this.sky.material.uniforms;
          if (u?.topColor?.value) u.topColor.value.copy(this._baseSkyTop);
          if (u?.bottomColor?.value) u.bottomColor.value.copy(this._baseSkyBottom);
        }
        return;
      }

      this.vista.timer = Math.max(0, this.vista.timer - dt);
      const t = this.vista.timer / Math.max(1e-6, this.vista.duration);
      const ease = (1 - t) * (1 - t) * (3 - 2 * (1 - t)); // smoothstep-ish
      const k = ease * this.vista.intensity;

      const accent = new this.THREE.Color(this.theme.particleColor || 0xffffff);
      const fogTarget = this._baseFogColor ? this._baseFogColor.clone().lerp(accent, 0.28 + k * 0.35) : accent;

      if (this.scene.fog && this._baseFogColor) {
        this.scene.fog.color.copy(fogTarget);
      }
      if (this.sky && this.sky.material && this._baseSkyTop && this._baseSkyBottom) {
        const u = this.sky.material.uniforms;
        if (u?.topColor?.value) u.topColor.value.copy(this._baseSkyTop.clone().lerp(accent, 0.18 + k * 0.45));
        if (u?.bottomColor?.value) u.bottomColor.value.copy(this._baseSkyBottom.clone().lerp(accent, 0.12 + k * 0.35));
      }

      // Gentle lighting boost
      if (this.ambientLight) this.ambientLight.intensity = 0.35 + k * 0.25;
      if (this.directionalLight) this.directionalLight.intensity = 1.0 + k * 0.55;
    }

    updateRidePath(dt, bass, energy) {
      if (!this.world.pathEnabled || !this.pathGroup) return;
      // Keep it centered on the ship and positioned ahead.
      this.pathGroup.position.x = this.lateralPos;
      this.pathGroup.position.z = this.distance;
      // In a flying game, keep the guide plane near the ship (not stuck on the ground).
      this.pathGroup.position.y = Math.max(0.02, this.altitude - 2.6);

      // Subtle audio/flow pulse
      const beat = this.audioData.beatPulse || 0;
      if (this.pathRibbonMat?.uniforms) {
        this.pathRibbonMat.uniforms.uTime.value = this.time;
        this.pathRibbonMat.uniforms.uBeat.value = beat;
        this.pathRibbonMat.uniforms.uFlow.value = this.flow;
        this.pathRibbonMat.uniforms.uOpacity.value = this.world.pathOpacity;
        this.pathRibbonMat.uniforms.uLaneOpacity.value = this.world.pathLaneOpacity;
      }
    }

    updateParallax(dt) {
      if (!this.world.parallaxEnabled || !this.parallaxGroup || !this.parallaxObjects.length) return;
      const span = this.world.parallaxSpanZ;

      // Parallax follows slowly in X/Z to give depth.
      this.parallaxGroup.position.x = this.lateralPos * this.world.parallaxFactorX;
      this.parallaxGroup.position.z = this.distance * this.world.parallaxFactorZ;

      // Wrap objects to keep them around the player.
      const behindZ = this.distance - 260;
      const aheadZ = this.distance + CONFIG.viewDistance * 0.9;
      for (const obj of this.parallaxObjects) {
        const worldZ = this.parallaxGroup.position.z + obj.position.z;
        if (worldZ < behindZ) obj.position.z += span;
        else if (worldZ > aheadZ) obj.position.z -= span;
      }
    }

    createPlayer() {
      const THREE = this.THREE;
      this.player = new THREE.Group();
      this.player.position.set(0, this.altitude, 0);
      this.scene.add(this.player);

      // Set initial collision radius from model config
      const modelConfig = RACER_MODELS[this.racerModelId];
      if (modelConfig) {
        this.playerCollisionRadius = modelConfig.collisionRadius || 1.5;
        this.playerOffsetY = modelConfig.offsetY || 0;
      }

      // Create a fallback simple ship first (will be hidden if GLTF loads)
      this.createFallbackPlayer();

      // Try to load GLTF model
      if (this.gltfLoader && modelConfig) {
        this.loadRacerModel(this.racerModelId);
      }
    }

    createFallbackPlayer() {
      const THREE = this.THREE;
      const accentColor = this.theme.particleColor;

      // Simple fallback ship
      this.fallbackShip = new THREE.Group();

      const bodyGeom = new THREE.BoxGeometry(1.2, 0.4, 3);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.7,
        roughness: 0.3
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.5;
      this.fallbackShip.add(body);

      // Accent stripe
      const stripeGeom = new THREE.BoxGeometry(1.25, 0.1, 3.05);
      const stripeMat = new THREE.MeshBasicMaterial({ color: accentColor });
      const stripe = new THREE.Mesh(stripeGeom, stripeMat);
      stripe.position.y = 0.55;
      this.fallbackShip.add(stripe);

      // Cockpit
      const cockpitGeom = new THREE.SphereGeometry(0.5, 16, 16);
      cockpitGeom.scale(0.8, 0.6, 1.2);
      const cockpitMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.9,
        roughness: 0.1
      });
      const cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
      cockpit.position.set(0, 0.7, 0.3);
      this.fallbackShip.add(cockpit);

      // Engine pods
      const podGeom = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
      const podMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.6,
        roughness: 0.4
      });

      const leftPod = new THREE.Mesh(podGeom, podMat);
      leftPod.rotation.x = Math.PI / 2;
      leftPod.position.set(-0.8, 0.4, -0.8);
      this.fallbackShip.add(leftPod);

      const rightPod = new THREE.Mesh(podGeom, podMat);
      rightPod.rotation.x = Math.PI / 2;
      rightPod.position.set(0.8, 0.4, -0.8);
      this.fallbackShip.add(rightPod);

      // Engine glow with theme color
      const glowGeom = new THREE.SphereGeometry(0.25, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: accentColor,
        transparent: true,
        opacity: 0.8
      });

      this.leftGlow = new THREE.Mesh(glowGeom, glowMat.clone());
      this.leftGlow.position.set(-0.8, 0.4, -1.6);
      this.fallbackShip.add(this.leftGlow);

      this.rightGlow = new THREE.Mesh(glowGeom, glowMat.clone());
      this.rightGlow.position.set(0.8, 0.4, -1.6);
      this.fallbackShip.add(this.rightGlow);

      this.player.add(this.fallbackShip);
    }

    loadRacerModel(modelId) {
      const modelConfig = RACER_MODELS[modelId];
      if (!modelConfig || !this.gltfLoader) {
        console.warn('Cannot load racer model:', modelId);
        return;
      }

      const THREE = this.THREE;
      console.log('Loading racer model:', modelId);

      this.gltfLoader.load(
        modelConfig.url,
        (gltf) => {
          // Remove fallback ship when model loads
          if (this.fallbackShip) {
            this.player.remove(this.fallbackShip);
            this.fallbackShip = null;
          }

          // Stop old animations and remove old model if switching
          if (this.modelAnimationMixer) {
            this.modelAnimationMixer.stopAllAction();
            this.modelAnimationMixer = null;
          }
          if (this.playerModel) {
            this.player.remove(this.playerModel);
          }

          const model = gltf.scene;

          // Wrap the raw GLTF scene so our scaling/rotation doesn't fight animations,
          // and so centering offsets scale correctly.
          const wrapper = new THREE.Group();
          wrapper.name = `racer-${modelId}`;
          wrapper.add(model);

          // Measure bounds in wrapper space (no extra rotation/scale yet)
          let finalScale = modelConfig.scale || 1;
          try {
            wrapper.updateWorldMatrix(true, true);
            const box0 = new THREE.Box3().setFromObject(wrapper);
            if (!box0.isEmpty()) {
              const size0 = new THREE.Vector3();
              box0.getSize(size0);
              const maxDim0 = Math.max(size0.x, size0.y, size0.z);

              // Normalize visual size across wildly different model unit systems
              if (CONFIG.racerNormalizeSize && maxDim0 > 1e-6) {
                finalScale = CONFIG.racerTargetMaxDim / maxDim0;
              }

              // Recenter the raw model around its bounds (important for flight roll/pitch).
              const center0 = new THREE.Vector3();
              box0.getCenter(center0);
              model.position.sub(center0);
            }
          } catch (e) {
            console.warn('Model bounds normalization failed:', modelId, e);
          }

          // Apply final wrapper transforms
          wrapper.scale.setScalar(finalScale);
          if (modelConfig.rotationY !== undefined) {
            wrapper.rotation.y = modelConfig.rotationY;
          }

          // Set up animations if the model has any
          if (gltf.animations && gltf.animations.length > 0) {
            this.modelAnimationMixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              const action = this.modelAnimationMixer.clipAction(clip);
              action.play();
            });
            console.log(`Playing ${gltf.animations.length} animation(s) for ${modelId}`);
          }

          // Apply vertical offset for model positioning
          if (modelConfig.offsetY !== undefined) {
            model.position.y += modelConfig.offsetY;
            this.playerOffsetY = modelConfig.offsetY;
          }

          // Set collision radius for this model
          this.playerCollisionRadius = modelConfig.collisionRadius || 1.5;

          // Add engine glow effect to loaded model
          this.addModelGlow(model);

          this.playerModel = wrapper;
          this.player.add(wrapper);

          // Save selection
          localStorage.setItem('mysongs-racer-model', modelId);
          this.racerModelId = modelId;

          console.log('Racer model loaded:', modelId, 'collision radius:', this.playerCollisionRadius);
        },
        (progress) => {
          // Loading progress
        },
        (error) => {
          console.error('Failed to load racer model:', modelId, error);
          // Fallback ship is already visible
        }
      );
    }

    addModelGlow(model) {
      const THREE = this.THREE;
      const accentColor = this.theme.particleColor;

      // Add subtle glow lights to the model
      const glowLight = new THREE.PointLight(accentColor, 1, 5);
      glowLight.position.set(0, 0, -1);
      model.add(glowLight);

      // Create engine trail glow spheres attached to model
      const glowGeom = new THREE.SphereGeometry(0.3, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: accentColor,
        transparent: true,
        opacity: 0.6
      });

      this.leftGlow = new THREE.Mesh(glowGeom, glowMat.clone());
      this.leftGlow.position.set(-0.5, 0, -1.5);
      model.add(this.leftGlow);

      this.rightGlow = new THREE.Mesh(glowGeom, glowMat.clone());
      this.rightGlow.position.set(0.5, 0, -1.5);
      model.add(this.rightGlow);
    }

    setRacerModel(modelId) {
      if (!modelId) return;
      if (!SELECTABLE_RACERS.includes(modelId)) return;
      if (!RACER_MODELS[modelId]) return;
      this.loadRacerModel(modelId);
    }

    getAvailableRacerModels() {
      return SELECTABLE_RACERS.slice();
    }

    setSpeedMultiplier(multiplier) {
      this.speedMultiplier = Math.max(0.25, Math.min(2.0, multiplier));
      localStorage.setItem('mysongs-cruise-speed', String(this.speedMultiplier));
      console.log('Cruise speed set to:', this.speedMultiplier.toFixed(2) + 'x');
    }

    getSpeedMultiplier() {
      return this.speedMultiplier;
    }

    createParticles() {
      const THREE = this.THREE;
      const particleCount = 800;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = [];

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = this.lateralPos + (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = this.altitude + (Math.random() - 0.5) * 22;
        positions[i * 3 + 2] = this.distance + Math.random() * 200;
        velocities.push({
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.1,
          z: -0.5 - Math.random() * 0.5
        });
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: this.theme.particleColor,
        size: 0.4,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      this.particles = new THREE.Points(geometry, material);
      this.particles.userData.velocities = velocities;
      this.scene.add(this.particles);
    }

    createLighting() {
      const THREE = this.THREE;

      // Main light colored by sky
      this.directionalLight = new THREE.DirectionalLight(this.theme.skyBottom, 1.2);
      this.directionalLight.position.set(100, 80, 100);
      this.scene.add(this.directionalLight);

      // Ambient from ground color
      this.ambientLight = new THREE.AmbientLight(this.theme.groundColor, 0.4);
      this.scene.add(this.ambientLight);

      // Hemisphere
      const hemi = new THREE.HemisphereLight(this.theme.skyTop, this.theme.groundColor, 0.5);
      this.scene.add(hemi);
    }

    createSpeedLines() {
      if (!CONFIG.speedLinesEnabled) return;

      const THREE = this.THREE;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(CONFIG.speedLinesCount * 6);  // 2 points per line
      const velocities = [];

      for (let i = 0; i < CONFIG.speedLinesCount; i++) {
        const x = this.lateralPos + (Math.random() - 0.5) * 60;
        const y = Math.max(
          CONFIG.flightMinY,
          Math.min(CONFIG.flightMaxY, this.altitude + (Math.random() - 0.5) * 14)
        );
        const z = this.distance + Math.random() * 100;
        const length = 2 + Math.random() * 4;

        positions[i * 6] = x;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 2] = z;
        positions[i * 6 + 3] = x;
        positions[i * 6 + 4] = y;
        positions[i * 6 + 5] = z - length;

        velocities.push({ x, y, z, length });
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });

      this.speedLines = new THREE.LineSegments(geometry, material);
      this.speedLines.userData.velocities = velocities;
      this.scene.add(this.speedLines);
    }

    createTrail() {
      if (!CONFIG.trailEnabled) return;
      this.trail = [];  // Trail positions stored here
    }

    generateChunk() {
      const THREE = this.THREE;
      const chunkZ = this.nextChunkZ;
      const chunk = { z: chunkZ, objects: [] };

      // Generate scenery based on theme type
      const sceneryCount = 15;
      for (let i = 0; i < sceneryCount; i++) {
        const obj = this.createSceneryObject();
        if (obj) {
          obj.position.set(
            (Math.random() - 0.5) * 100,
            0,
            chunkZ + Math.random() * CONFIG.chunkSize
          );
          // Chill Ride: scenery is decorative only (no collisions).
          // Keep objects for visuals, but do not flag them as obstacles.
          if (obj.userData) {
            obj.userData.isObstacle = false;
          }
          this.scene.add(obj);
          chunk.objects.push(obj);
        }
      }

      this.chunks.push(chunk);
      this.nextChunkZ += CONFIG.chunkSize;
    }

    createSceneryObject() {
      const THREE = this.THREE;
      const type = this.theme.type;

      // Create different objects based on environment type
      switch (type) {
        case "ocean":
          return this.createCoralOrSeaweed();
        case "meadow":
          return this.createFlowerOrGrass();
        case "volcanic":
          return this.createVolcanicRock();
        case "cyber":
          return this.createCyberTower();
        case "ice":
          return this.createCrystal();
        case "savanna":
          return this.createSavannaTree();
        case "blossom":
          return this.createCherryTree();
        case "industrial":
          return this.createIndustrialObject();
        case "ancient":
          return this.createRuin();
        case "matrix":
          return this.createDataNode();
        default:
          return this.createDesertObject();
      }
    }

    createDesertObject() {
      const THREE = this.THREE;
      if (Math.random() > 0.6) {
        return this.createCactus();
      } else {
        return this.createRock(0x8b7355);
      }
    }

    createCactus() {
      const THREE = this.THREE;
      const group = new THREE.Group();
      const height = 3 + Math.random() * 5;
      const mat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.7 });

      const stemGeom = new THREE.CylinderGeometry(0.4, 0.5, height, 8);
      const stem = new THREE.Mesh(stemGeom, mat);
      stem.position.y = height / 2;
      group.add(stem);

      if (Math.random() > 0.5) {
        const armGeom = new THREE.CylinderGeometry(0.25, 0.3, height * 0.4, 8);
        const arm = new THREE.Mesh(armGeom, mat);
        arm.position.set(-0.6, height * 0.45, 0);
        arm.rotation.z = Math.PI / 4;
        group.add(arm);
      }

      group.userData.swayPhase = Math.random() * Math.PI * 2;
      return group;
    }

    createRock(color) {
      const THREE = this.THREE;
      const size = 0.5 + Math.random() * 2;
      const geom = new THREE.DodecahedronGeometry(size, 0);
      const positions = geom.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] *= 0.7 + Math.random() * 0.6;
        positions[i + 1] *= 0.6 + Math.random() * 0.4;
        positions[i + 2] *= 0.7 + Math.random() * 0.6;
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: color || this.theme.groundColor,
        roughness: 0.85,
        flatShading: true
      });

      const rock = new THREE.Mesh(geom, mat);
      rock.position.y = size * 0.4;
      rock.rotation.set(Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4);
      return rock;
    }

    createCoralOrSeaweed() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      if (Math.random() > 0.5) {
        // Coral
        const coralGeom = new THREE.SphereGeometry(1 + Math.random(), 8, 8);
        const coralMat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0xff6b6b : 0x00bfff,
          roughness: 0.8
        });
        const coral = new THREE.Mesh(coralGeom, coralMat);
        coral.scale.y = 0.6 + Math.random() * 0.4;
        coral.position.y = 0.5;
        group.add(coral);
      } else {
        // Seaweed
        const height = 2 + Math.random() * 3;
        const seaweedGeom = new THREE.CylinderGeometry(0.1, 0.15, height, 6);
        const seaweedMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        for (let i = 0; i < 3; i++) {
          const strand = new THREE.Mesh(seaweedGeom, seaweedMat);
          strand.position.set((Math.random() - 0.5) * 0.5, height / 2, (Math.random() - 0.5) * 0.5);
          strand.rotation.z = (Math.random() - 0.5) * 0.3;
          group.add(strand);
        }
      }

      group.userData.swayPhase = Math.random() * Math.PI * 2;
      return group;
    }

    createFlowerOrGrass() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      if (Math.random() > 0.7) {
        // Flower
        const stemGeom = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const stem = new THREE.Mesh(stemGeom, stemMat);
        stem.position.y = 0.5;
        group.add(stem);

        const petalGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const colors = [0xff69b4, 0xffd700, 0xff6b6b, 0xdda0dd, 0x87ceeb];
        const petalMat = new THREE.MeshStandardMaterial({
          color: colors[Math.floor(Math.random() * colors.length)]
        });
        const petals = new THREE.Mesh(petalGeom, petalMat);
        petals.position.y = 1.1;
        group.add(petals);
      } else {
        // Grass tuft
        const grassGeom = new THREE.ConeGeometry(0.3, 1, 4);
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x90ee90 });
        for (let i = 0; i < 5; i++) {
          const blade = new THREE.Mesh(grassGeom, grassMat);
          blade.position.set((Math.random() - 0.5) * 0.4, 0.5, (Math.random() - 0.5) * 0.4);
          blade.rotation.z = (Math.random() - 0.5) * 0.3;
          group.add(blade);
        }
      }

      group.userData.swayPhase = Math.random() * Math.PI * 2;
      return group;
    }

    createVolcanicRock() {
      const THREE = this.THREE;
      const rock = this.createRock(0x2a1010);

      // Add glow cracks
      if (Math.random() > 0.5) {
        const glowGeom = new THREE.SphereGeometry(0.2, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0xff4400,
          transparent: true,
          opacity: 0.8
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.y = 0.1;
        rock.add(glow);
      }

      rock.userData.pulsePhase = Math.random() * Math.PI * 2;
      return rock;
    }

    createCyberTower() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      const height = 5 + Math.random() * 10;
      const towerGeom = new THREE.BoxGeometry(1, height, 1);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.8,
        roughness: 0.2
      });
      const tower = new THREE.Mesh(towerGeom, towerMat);
      tower.position.y = height / 2;
      group.add(tower);

      // Neon lines
      const lineMat = new THREE.MeshBasicMaterial({ color: this.theme.particleColor });
      for (let i = 0; i < 3; i++) {
        const lineGeom = new THREE.BoxGeometry(1.1, 0.1, 0.05);
        const line = new THREE.Mesh(lineGeom, lineMat);
        line.position.y = (i + 1) * (height / 4);
        line.position.z = 0.5;
        group.add(line);
      }

      group.userData.pulsePhase = Math.random() * Math.PI * 2;
      return group;
    }

    createCrystal() {
      const THREE = this.THREE;
      const height = 1 + Math.random() * 3;
      const geom = new THREE.ConeGeometry(0.5, height, 6);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x88ffff,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.5,
        transparent: true,
        opacity: 0.8
      });
      const crystal = new THREE.Mesh(geom, mat);
      crystal.position.y = height / 2;
      crystal.rotation.z = (Math.random() - 0.5) * 0.3;
      crystal.userData.pulsePhase = Math.random() * Math.PI * 2;
      return crystal;
    }

    createSavannaTree() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      // More convincing acacia-ish silhouette:
      // - tapered trunk + 2-3 branches
      // - clustered canopy blobs with color variation
      const trunkHeight = 3.2 + Math.random() * 2.6;
      const trunkRadiusTop = 0.16 + Math.random() * 0.06;
      const trunkRadiusBottom = trunkRadiusTop + 0.18 + Math.random() * 0.08;

      const trunkGeom = new THREE.CylinderGeometry(trunkRadiusTop, trunkRadiusBottom, trunkHeight, 10);
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x7a4a2a,
        roughness: 0.95,
        metalness: 0.0
      });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = trunkHeight / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.12; // slight lean
      group.add(trunk);

      const branchMat = trunkMat;
      const branchCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < branchCount; i++) {
        const len = 1.4 + Math.random() * 1.6;
        const r0 = trunkRadiusTop * (0.95 - i * 0.1);
        const r1 = Math.max(0.05, r0 * 0.55);
        const branchGeom = new THREE.CylinderGeometry(r1, r0, len, 8);
        const branch = new THREE.Mesh(branchGeom, branchMat);
        const y = trunkHeight * (0.62 + Math.random() * 0.22);
        const side = i % 2 === 0 ? 1 : -1;
        branch.position.set(side * (0.25 + Math.random() * 0.2), y, (Math.random() - 0.5) * 0.25);
        branch.rotation.z = side * (0.9 + Math.random() * 0.35);
        branch.rotation.y = (Math.random() - 0.5) * 0.6;
        branch.rotation.x = (Math.random() - 0.5) * 0.25;
        group.add(branch);
      }

      // Canopy cluster
      const canopyBaseY = trunkHeight + 0.35 + Math.random() * 0.4;
      const canopyRadius = 1.8 + Math.random() * 1.1;
      const canopyCount = 4 + Math.floor(Math.random() * 4);
      const canopyGeom = new THREE.IcosahedronGeometry(1, 0);
      const greenHue = 0.28 + Math.random() * 0.08;
      const canopyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(greenHue, 0.45, 0.35 + Math.random() * 0.1),
        emissive: new THREE.Color().setHSL(greenHue, 0.55, 0.08),
        emissiveIntensity: 0.55,
        roughness: 0.9,
        metalness: 0.0
      });

      for (let i = 0; i < canopyCount; i++) {
        const blob = new THREE.Mesh(canopyGeom, canopyMat);
        const ang = (i / canopyCount) * Math.PI * 2 + Math.random() * 0.6;
        const r = canopyRadius * (0.25 + Math.random() * 0.55);
        blob.position.set(Math.cos(ang) * r, canopyBaseY + (Math.random() - 0.5) * 0.4, Math.sin(ang) * r * 0.55);
        blob.scale.setScalar(1.35 + Math.random() * 1.15);
        blob.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        group.add(blob);
      }

      // Overall scale variation
      group.scale.setScalar(0.75 + Math.random() * 0.6);

      group.userData.swayPhase = Math.random() * Math.PI * 2;
      return group;
    }

    createCherryTree() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      // More “tree-like” cherry silhouette:
      // - trunk + branching
      // - blossom clusters (with slight emissive glow)
      const trunkHeight = 2.8 + Math.random() * 1.6;
      const trunkGeom = new THREE.CylinderGeometry(0.14, 0.28, trunkHeight, 10);
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x4a3728,
        roughness: 0.95,
        metalness: 0.0
      });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = trunkHeight / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.18;
      group.add(trunk);

      const branchCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < branchCount; i++) {
        const len = 1.1 + Math.random() * 1.4;
        const r0 = 0.12 + Math.random() * 0.06;
        const r1 = Math.max(0.04, r0 * 0.55);
        const branchGeom = new THREE.CylinderGeometry(r1, r0, len, 8);
        const branch = new THREE.Mesh(branchGeom, trunkMat);
        const side = i % 2 === 0 ? 1 : -1;
        branch.position.set(side * (0.12 + Math.random() * 0.25), trunkHeight * (0.55 + Math.random() * 0.25), (Math.random() - 0.5) * 0.25);
        branch.rotation.z = side * (0.8 + Math.random() * 0.55);
        branch.rotation.y = (Math.random() - 0.5) * 0.9;
        branch.rotation.x = (Math.random() - 0.5) * 0.3;
        group.add(branch);
      }

      const blossomGeom = new THREE.IcosahedronGeometry(1, 0);
      const pinkHue = 0.92 + Math.random() * 0.06;
      const blossomMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(pinkHue % 1, 0.55, 0.72),
        emissive: new THREE.Color().setHSL(pinkHue % 1, 0.8, 0.18),
        emissiveIntensity: 0.65,
        roughness: 0.85,
        metalness: 0.0
      });

      const blossomCenterY = trunkHeight + 0.7 + Math.random() * 0.4;
      const blossomCount = 6 + Math.floor(Math.random() * 6);
      for (let i = 0; i < blossomCount; i++) {
        const blob = new THREE.Mesh(blossomGeom, blossomMat);
        const ang = Math.random() * Math.PI * 2;
        const r = 1.3 + Math.random() * 1.5;
        blob.position.set(Math.cos(ang) * r, blossomCenterY + (Math.random() - 0.5) * 0.55, Math.sin(ang) * r);
        blob.scale.setScalar(0.65 + Math.random() * 0.85);
        blob.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        group.add(blob);
      }

      group.scale.setScalar(0.85 + Math.random() * 0.55);

      group.userData.swayPhase = Math.random() * Math.PI * 2;
      return group;
    }

    createIndustrialObject() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      if (Math.random() > 0.5) {
        // Pipe
        const pipeGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
        const pipe = new THREE.Mesh(pipeGeom, pipeMat);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.y = 1;
        group.add(pipe);
      } else {
        // Girder
        const girderGeom = new THREE.BoxGeometry(0.5, 5, 0.5);
        const girderMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.6 });
        const girder = new THREE.Mesh(girderGeom, girderMat);
        girder.position.y = 2.5;
        girder.rotation.z = (Math.random() - 0.5) * 0.2;
        group.add(girder);
      }

      return group;
    }

    createRuin() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      // Broken pillar
      const height = 2 + Math.random() * 4;
      const pillarGeom = new THREE.CylinderGeometry(0.5, 0.6, height, 8);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.y = height / 2;
      group.add(pillar);

      // Rubble
      for (let i = 0; i < 3; i++) {
        const rubble = this.createRock(0x555555);
        rubble.scale.setScalar(0.3 + Math.random() * 0.3);
        rubble.position.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
        group.add(rubble);
      }

      group.userData.pulsePhase = Math.random() * Math.PI * 2;
      return group;
    }

    createDataNode() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      // Glowing sphere
      const nodeGeom = new THREE.OctahedronGeometry(0.5);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: this.theme.particleColor,
        transparent: true,
        opacity: 0.8
      });
      const node = new THREE.Mesh(nodeGeom, nodeMat);
      node.position.y = 1 + Math.random() * 2;
      group.add(node);

      // Vertical data stream
      const streamGeom = new THREE.BoxGeometry(0.05, 3, 0.05);
      const streamMat = new THREE.MeshBasicMaterial({
        color: this.theme.particleColor,
        transparent: true,
        opacity: 0.3
      });
      const stream = new THREE.Mesh(streamGeom, streamMat);
      stream.position.y = 1.5;
      group.add(stream);

      group.userData.pulsePhase = Math.random() * Math.PI * 2;
      return group;
    }

    setupInput() {
      const shouldIgnoreKey = (e) => {
        const t = /** @type {any} */ (e.target);
        if (!t) return false;
        const tag = (t.tagName || '').toUpperCase();
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!t.isContentEditable;
      };

      this._onKeyDown = (e) => {
        if (shouldIgnoreKey(e)) return;

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this._leftDown = true;
          e.preventDefault();
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this._rightDown = true;
          e.preventDefault();
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          this._upDown = true;
          e.preventDefault();
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this._downDown = true;
          e.preventDefault();
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          this._shiftDown = true;
        } else if (e.code === 'Space') {
          // Boost (afterburner) for forward speed
          e.preventDefault();
          if (!this.boosting) {
            this.boosting = true;
            this.boostTimer = CONFIG.boostDuration;
          }
        }
      };
      this._onKeyUp = (e) => {
        if (shouldIgnoreKey(e)) return;

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this._leftDown = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this._rightDown = false;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') this._upDown = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') this._downDown = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this._shiftDown = false;
      };
      this._onBlur = () => {
        this._leftDown = false;
        this._rightDown = false;
        this._upDown = false;
        this._downDown = false;
        this._shiftDown = false;
      };
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
      window.addEventListener('blur', this._onBlur);
    }

    setAudioData(bass, mid, treble, energy, beatPulse = 0, beatHit = false) {
      this.audioData.bass = bass;
      this.audioData.mid = mid;
      this.audioData.treble = treble;
      this.audioData.energy = energy;
      this.audioData.beatPulse = beatPulse;
      this.audioData.beatHit = !!beatHit;
    }

    _clamp01(v) {
      return Math.max(0, Math.min(1, v));
    }

    updateFlow(dt) {
      // Approximate smooth flight by measuring lateral + vertical acceleration.
      const safeDt = Math.max(1e-6, dt);
      const vel = (this.lateralPos - this._lastLateralPos) / safeDt;
      const accel = (vel - this._lastLateralVel) / safeDt;
      this._lastLateralPos = this.lateralPos;
      this._lastLateralVel = vel;

      const velY = (this.altitude - this._lastAltitude) / safeDt;
      const accelY = (velY - this._lastAltitudeVel) / safeDt;
      this._lastAltitude = this.altitude;
      this._lastAltitudeVel = velY;

      const centerNorm = Math.min(1, Math.abs(this.lateralPos) / 40);
      const accelNormX = Math.min(1, Math.abs(accel) / CONFIG.flowAccelRef);
      const accelNormY = Math.min(1, Math.abs(accelY) / CONFIG.flowAccelRef);
      const accelNorm = Math.min(1, Math.hypot(accelNormX, accelNormY) / Math.SQRT2);

      const smoothness = this._clamp01(
        1 - (accelNorm * CONFIG.flowAccelWeight + centerNorm * CONFIG.flowCenterWeight)
      );

      // Map smoothness to a target flow floor+ceiling.
      const targetFlow = this._clamp01(0.25 + smoothness * 0.75);

      // Asymmetric response: falling is a bit faster than rising.
      const rate = targetFlow > this.flow ? CONFIG.flowRiseRate : CONFIG.flowFallRate;
      const k = 1 - Math.exp(-rate * dt);
      this.flow += (targetFlow - this.flow) * k;

      this.flowMax = Math.max(this.flowMax, this.flow);
      this.flowSum += this.flow * dt;
      this.flowTime += dt;
    }

    spawnFlowGate() {
      if (!CONFIG.gateEnabled || !this.flowGateGroup) return;
      const THREE = this.THREE;

      const accent = this.theme.particleColor || 0xffffff;
      const radius = CONFIG.gateRadius;
      const tube = CONFIG.gateTube;
      const geom = new THREE.TorusGeometry(radius, tube, 10, 48);
      const mat = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const gate = new THREE.Mesh(geom, mat);
      gate.name = 'flow-gate';

      // Favor a few soft "lanes" plus a little randomness
      const lanes = [-14, 0, 14];
      const laneX = lanes[Math.floor(Math.random() * lanes.length)];
      const x = Math.max(-28, Math.min(28, laneX + (Math.random() - 0.5) * 3));
      const z = this.distance + CONFIG.gateSpawnAhead + Math.random() * CONFIG.gateSpawnJitter;

      // Vertical lanes for flying (so you actually have to fly through them)
      const yMin = CONFIG.flightMinY + 1.0;
      const yMax = CONFIG.flightMaxY - 1.0;
      const yLanes = [
        yMin + (yMax - yMin) * 0.25,
        yMin + (yMax - yMin) * 0.5,
        yMin + (yMax - yMin) * 0.75,
      ];
      const laneY = yLanes[Math.floor(Math.random() * yLanes.length)];
      const y = Math.max(yMin, Math.min(yMax, laneY + (Math.random() - 0.5) * 2.0));

      gate.position.set(x, y, z);
      // A torus is oriented in the XY plane by default (normal +Z),
      // which is exactly what we want: a vertical gate you fly through along Z.
      gate.rotation.set(0, 0, 0);

      const innerRadius = Math.max(0.01, (radius - tube * 2.0) * CONFIG.gateInnerPad);
      gate.userData.flowGate = {
        innerRadius,
        resolved: false,
        spawnedAt: this.time
      };

      this.flowGateGroup.add(gate);
      this.flowGates.push(gate);
    }

    updateFlowGates() {
      if (!CONFIG.gateEnabled || !this.flowGates.length) return;

      const playerX = this.lateralPos;
      const playerY = this.altitude;
      const playerZ = this.distance;
      const playerRadius = this.playerCollisionRadius || 1.5;

      for (let i = this.flowGates.length - 1; i >= 0; i--) {
        const gate = this.flowGates[i];
        const data = gate?.userData?.flowGate;
        if (!gate || !data) {
          this.flowGates.splice(i, 1);
          continue;
        }

        const dz = gate.position.z - playerZ;

        // Resolve once we pass the gate plane
        if (!data.resolved && dz < 0) {
          data.resolved = true;

          const dx = playerX - gate.position.x;
          const dy = playerY - gate.position.y;
          const distXY = Math.sqrt(dx * dx + dy * dy);

          const passRadius = Math.max(0.01, data.innerRadius - playerRadius * 0.25);
          const passed = distXY <= passRadius;

          if (passed) {
            this.gatesHit += 1;
            this.gateStreak += 1;
            this.maxGateStreak = Math.max(this.maxGateStreak, this.gateStreak);

            this.flow = this._clamp01(this.flow + CONFIG.gateFlowBoost + (this.audioData.beatPulse || 0) * 0.03);

            // Gate reward: small score bump + gently helps combo progression.
            this.score += CONFIG.gateScore * Math.max(1, this.combo);
            this.comboTimer = Math.max(0, this.comboTimer - 0.35);
          } else {
            this.gatesMissed += 1;
            this.gateStreak = 0;
            this.flow = this._clamp01(this.flow - CONFIG.gateMissFlowPenalty);
          }

          // Visual: fade quickly after resolve
          if (gate.material) {
            gate.material.opacity = passed ? 0.45 : 0.18;
          }
        }

        // Cleanup once far behind the player
        if (dz < -90) {
          if (this.flowGateGroup) this.flowGateGroup.remove(gate);
          gate.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          this.flowGates.splice(i, 1);
        }
      }
    }

    emitFlowUpdate(dt) {
      if (!this.onFlowChange) return;
      this._flowHudTimer += dt;
      if (this._flowHudTimer < 0.08) return; // ~12.5Hz
      this._flowHudTimer = 0;
      this.onFlowChange({
        flow: this.flow,
        gateStreak: this.gateStreak,
        gatesHit: this.gatesHit,
        gatesMissed: this.gatesMissed
      });
    }

    update(dt) {
      if (!this.initialized) return;

      this.time += dt;
      const { bass, mid, treble, energy, beatHit } = this.audioData;

      // Handle boost timer
      if (this.boosting) {
        this.boostTimer -= dt;
        if (this.boostTimer <= 0) {
          this.boosting = false;
          this.boostTimer = 0;
        }
      }

      // Speed - boost overrides normal speed, apply speedMultiplier for user-adjustable cruising
      let targetSpeed;
      if (this.boosting) {
        targetSpeed = CONFIG.boostSpeed * this.speedMultiplier;
      } else {
        targetSpeed = (CONFIG.baseSpeed + (CONFIG.maxSpeed - CONFIG.baseSpeed) * energy) * this.speedMultiplier;
      }
      this.speed += (targetSpeed - this.speed) * 0.1;  // Smoother acceleration (was 0.15)
      this.distance += this.speed * dt * 60;

      // Steering
      const steerTarget = (this._leftDown ? 1 : 0) + (this._rightDown ? -1 : 0);
      // Smooth the steering signal to avoid "pause" when switching directions quickly.
      // Exponential smoothing keeps it framerate-independent.
      const steerResponse = CONFIG.steerResponse * (this._shiftDown ? CONFIG.steerResponseShiftMult : 1);
      const steerK = 1 - Math.exp(-steerResponse * dt);
      this.steerInput += (steerTarget - this.steerInput) * steerK;
      const steerSpeedMult = this._shiftDown ? CONFIG.steerSpeedShiftMult : 1;
      const steerSpeed = 0.4 * this.speed * steerSpeedMult;
      this.lateralPos += this.steerInput * steerSpeed * dt * 60;
      this.lateralPos = Math.max(-40, Math.min(40, this.lateralPos));

      // Flight (vertical control)
      if (CONFIG.flightEnabled) {
        const climbTarget = (this._upDown ? 1 : 0) + (this._downDown ? -1 : 0);
        const climbResponse = CONFIG.verticalResponse * (this._shiftDown ? CONFIG.verticalResponseShiftMult : 1);
        const climbK = 1 - Math.exp(-climbResponse * dt);
        this.verticalInput += (climbTarget - this.verticalInput) * climbK;

        const climbSpeedMult = (this._shiftDown ? CONFIG.verticalSpeedShiftMult : 1) * CONFIG.verticalSpeedMult;
        const climbSpeed = 0.32 * this.speed * climbSpeedMult;
        this.altitude += this.verticalInput * climbSpeed * dt * 60;
        this.altitude = Math.max(CONFIG.flightMinY, Math.min(CONFIG.flightMaxY, this.altitude));
      } else {
        this.altitude = 0.8;
        this.verticalInput = 0;
      }

      // Chill Ride: flow + gates
      this.updateFlow(dt);
      if (CONFIG.gateEnabled) {
        // Spawn gates on beats (throttled), plus gentle distance-based spacing.
        if (beatHit && (this.time - this._lastGateTime) > CONFIG.gateBeatCooldown) {
          this.spawnFlowGate();
          this._lastGateTime = this.time;
          this._nextGateZ = Math.max(this._nextGateZ, this.distance + CONFIG.gateSpacingBase * 0.6);
        }
        if (this.distance >= this._nextGateZ) {
          this.spawnFlowGate();
          const spacing = CONFIG.gateSpacingBase + (1 - energy) * CONFIG.gateSpacingQuietBonus;
          this._nextGateZ = this.distance + spacing;
          this._lastGateTime = this.time;
        }
        this.updateFlowGates();
      }

      // Trigger short "vista moments" on energetic beat hits
      if (beatHit) {
        this.triggerVista(energy);
      }

      // Update positions
      if (this.groundPlane) {
        this.groundPlane.position.z = this.distance;
        this.groundPlane.position.x = this.lateralPos;
      }
      if (this.sky) {
        this.sky.position.z = this.distance;
        this.sky.position.x = this.lateralPos;
      }

      // Readability + depth layers
      this.updateRidePath(dt, bass, energy);
      this.updateParallax(dt);

      // Player
      if (this.player) {
        this.player.position.x = this.lateralPos;
        this.player.position.z = this.distance;
        const bob = Math.sin(this.time * 3.6) * 0.06;
        this.player.position.y = this.altitude + bob;

        const targetRoll = -this.steerInput * 0.35;
        const targetPitch = this.verticalInput * CONFIG.pitchFromClimb;
        this.player.rotation.z += (targetRoll - this.player.rotation.z) * 0.12;
        this.player.rotation.x += (targetPitch - this.player.rotation.x) * 0.12;

        const boostGlow = this.boosting ? 0.5 : 0;
        const glowIntensity = 0.5 + energy * 0.5 + boostGlow;
        const glowScale = this.boosting ? 1.5 + bass * 0.5 : 0.8 + bass * 0.5;
        if (this.leftGlow) {
          this.leftGlow.scale.setScalar(glowScale);
          this.leftGlow.material.opacity = glowIntensity;
          this.leftGlow.material.color.setHex(this.boosting ? 0x00ffff : 0xff6600);
        }
        if (this.rightGlow) {
          this.rightGlow.scale.setScalar(glowScale);
          this.rightGlow.material.opacity = glowIntensity;
          this.rightGlow.material.color.setHex(this.boosting ? 0x00ffff : 0xff6600);
        }
      }

      // Update model animations
      if (this.modelAnimationMixer) {
        this.modelAnimationMixer.update(dt);
      }

      this.updateChunks();
      this.updateScenery(bass, mid, energy);
      this.updateParticles(dt, energy, bass);
      this.updateSpeedLines(dt, energy);
      this.updateLighting(dt, bass, energy);
      this.updateVista(dt); // after lighting so vista can tint lighting too
      this.updateCollisions(dt);
      this.updateScore(dt);
      this.emitFlowUpdate(dt);

      if (this.scene.fog) {
        this.scene.fog.near = this.theme.fogNear - energy * 10;
        this.scene.fog.far = this.theme.fogFar - energy * 50;
      }

      this.updateCamera();
    }

    updateCollisions(dt) {
      if (this.hitCooldown > 0) {
        this.hitCooldown -= dt;
        return;
      }

      const playerX = this.lateralPos;
      const playerZ = this.distance;
      // Use model-specific collision radius
      const playerRadius = this.playerCollisionRadius || 1.5;

      for (const chunk of this.chunks) {
        for (const obj of chunk.objects) {
          if (!obj.userData.isObstacle) continue;

          const dx = playerX - obj.position.x;
          const dz = playerZ - obj.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const collisionDist = playerRadius + (obj.userData.collisionRadius || 2);

          if (dist < collisionDist) {
            // Collision!
            this.handleCollision();
            return;
          }
        }
      }
    }

    handleCollision() {
      // Lose points and reset combo
      const pointsLost = Math.floor(CONFIG.hitPenalty * this.combo);
      this.score = Math.max(0, this.score - pointsLost);
      this.combo = 1;
      this.comboTimer = 0;
      this.hitCooldown = CONFIG.hitCooldownTime;
      this.lastHitTime = this.time;
      this.flow = this._clamp01(this.flow - CONFIG.flowCollisionPenalty);
      this.gateStreak = 0;

      // Visual feedback
      this.triggerScreenShake();

      // Trigger callback
      if (this.onHit) {
        this.onHit(pointsLost);
      }
      if (this.onScoreChange) {
        this.onScoreChange(this.score, this.combo);
      }
    }

    updateScore(dt) {
      // Accumulate score based on speed and combo
      const pointsPerSecond = 10 * this.combo * (this.speed / CONFIG.baseSpeed);
      this.score += pointsPerSecond * dt;

      // Build combo over time without hitting
      const flowBoost = 0.35 + this.flow * 1.15; // 0.35..1.5
      this.comboTimer += dt * flowBoost;
      if (this.comboTimer >= CONFIG.comboBuildTime) {  // Every N seconds (flow-weighted) without hit
        this.combo = Math.min(this.combo + 1, 10);  // Max 10x combo
        this.comboTimer = 0;
      }

      // Trigger callback
      if (this.onScoreChange) {
        this.onScoreChange(Math.floor(this.score), this.combo);
      }
    }

    getScore() {
      return Math.floor(this.score);
    }

    getCombo() {
      return this.combo;
    }

    getRunSummary() {
      const avgFlow = this.flowTime > 0 ? (this.flowSum / this.flowTime) : this.flow;
      const gateTotal = this.gatesHit + this.gatesMissed;
      const gateAccuracy = gateTotal > 0 ? (this.gatesHit / gateTotal) : 0;

      let rank = 'C';
      if (avgFlow >= 0.78 && gateAccuracy >= 0.82) rank = 'S';
      else if (avgFlow >= 0.62 && gateAccuracy >= 0.65) rank = 'A';
      else if (avgFlow >= 0.45 || gateAccuracy >= 0.45) rank = 'B';

      return {
        score: Math.floor(this.score),
        combo: this.combo,
        flow: this.flow,
        flowAvg: avgFlow,
        flowMax: this.flowMax,
        gatesHit: this.gatesHit,
        gatesMissed: this.gatesMissed,
        gateAccuracy,
        gateStreakMax: this.maxGateStreak,
        rank
      };
    }

    updateChunks() {
      while (this.nextChunkZ < this.distance + CONFIG.chunkSize * CONFIG.chunksAhead) {
        this.generateChunk();
      }
      while (this.chunks.length > 0 &&
             this.chunks[0].z < this.distance - CONFIG.chunkSize * CONFIG.chunksBehind) {
        const old = this.chunks.shift();
        old.objects.forEach(obj => {
          this.scene.remove(obj);
          obj.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        });
      }
    }

    updateScenery(bass, mid, energy) {
      this.chunks.forEach(chunk => {
        chunk.objects.forEach(obj => {
          if (obj.userData.swayPhase !== undefined) {
            const sway = mid * 0.1 * Math.sin(this.time * 3 + obj.userData.swayPhase);
            obj.rotation.z = sway;
          }
          if (obj.userData.pulsePhase !== undefined) {
            const pulse = 1 + bass * 0.2 * Math.sin(this.time * 2 + obj.userData.pulsePhase);
            obj.scale.setScalar(pulse);
          }
        });
      });
    }

    updateParticles(dt, energy, bass) {
      if (!this.particles) return;
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;

      for (let i = 0; i < velocities.length; i++) {
        const v = velocities[i];
        positions[i * 3] += v.x * (1 + energy);
        positions[i * 3 + 1] += v.y + bass * 0.03;
        positions[i * 3 + 2] += (v.z - this.speed * 0.5) * dt * 60;

        if (positions[i * 3 + 2] < this.distance - 30) {
          positions[i * 3] = this.lateralPos + (Math.random() - 0.5) * 100;
          positions[i * 3 + 1] = this.altitude + (Math.random() - 0.5) * 22;
          positions[i * 3 + 2] = this.distance + 50 + Math.random() * 150;
        }
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.material.opacity = 0.3 + energy * 0.5;
    }

    updateSpeedLines(dt, energy) {
      if (!this.speedLines) return;

      const positions = this.speedLines.geometry.attributes.position.array;
      const velocities = this.speedLines.userData.velocities;

      // Only show speed lines at high speed
      const speedRatio = (this.speed - CONFIG.speedLinesMinSpeed) / (CONFIG.maxSpeed - CONFIG.speedLinesMinSpeed);
      const opacity = Math.max(0, Math.min(0.8, speedRatio * (0.3 + energy * 0.5)));
      this.speedLines.material.opacity = opacity;

      if (opacity <= 0) return;

      for (let i = 0; i < velocities.length; i++) {
        const v = velocities[i];

        // Move lines backward (towards camera)
        positions[i * 6 + 2] -= this.speed * dt * 60 * CONFIG.particleSpeedMultiplier;
        positions[i * 6 + 5] -= this.speed * dt * 60 * CONFIG.particleSpeedMultiplier;

        // Respawn lines ahead
        if (positions[i * 6 + 2] < this.distance - 20) {
          const x = this.lateralPos + (Math.random() - 0.5) * 60;
          const y = Math.max(
            CONFIG.flightMinY,
            Math.min(CONFIG.flightMaxY, this.altitude + (Math.random() - 0.5) * 14)
          );
          const z = this.distance + 50 + Math.random() * 100;
          const length = 2 + Math.random() * 4 + this.speed;

          positions[i * 6] = x;
          positions[i * 6 + 1] = y;
          positions[i * 6 + 2] = z;
          positions[i * 6 + 3] = x;
          positions[i * 6 + 4] = y;
          positions[i * 6 + 5] = z - length;
        }
      }

      this.speedLines.geometry.attributes.position.needsUpdate = true;
    }

    updateLighting(dt, bass, energy) {
      if (!CONFIG.pulseEnabled) return;

      this.pulsePhase += dt * 2;
      const pulse = 1 + Math.sin(this.pulsePhase) * CONFIG.pulseIntensity * bass;

      if (this.ambientLight) {
        this.ambientLight.intensity = 0.4 * pulse;
      }
      if (this.directionalLight) {
        this.directionalLight.intensity = 1.2 * (1 + energy * 0.3);
      }

      // Color shift based on speed/combo
      if (CONFIG.colorShiftEnabled && this.combo > 1) {
        this.colorShiftHue += dt * CONFIG.colorShiftSpeed * (this.combo / CONFIG.maxCombo);
        if (this.colorShiftHue > 1) this.colorShiftHue -= 1;
      }
    }

    triggerScreenShake() {
      if (!CONFIG.screenShakeOnHit) return;
      this.cameraShake.timer = CONFIG.cameraShakeDuration;
    }

    updateCameraShake(dt) {
      if (this.cameraShake.timer > 0) {
        this.cameraShake.timer -= dt;
        const intensity = CONFIG.cameraShakeIntensity * (this.cameraShake.timer / CONFIG.cameraShakeDuration);
        this.cameraShake.x = (Math.random() - 0.5) * 2 * intensity;
        this.cameraShake.y = (Math.random() - 0.5) * 2 * intensity;
      } else {
        this.cameraShake.x = 0;
        this.cameraShake.y = 0;
      }
    }

    updateCamera() {
      this.updateCameraShake(0.016);  // Approximate dt

      const camX = this.lateralPos + this.cameraShake.x;
      const camY = this.altitude + CONFIG.cameraHeight + Math.sin(this.time * 2) * 0.2 + this.cameraShake.y;
      const camZ = this.distance - CONFIG.cameraDistance;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.lateralPos, this.altitude + 1.8, this.distance + CONFIG.cameraLookAhead);
    }

    dispose() {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      if (this._onBlur) window.removeEventListener('blur', this._onBlur);

      this.chunks.forEach(chunk => {
        chunk.objects.forEach(obj => {
          this.scene.remove(obj);
          obj.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        });
      });
      this.chunks = [];

      [this.sky, this.groundPlane, this.player, this.particles, this.speedLines].forEach(obj => {
        if (obj) {
          this.scene.remove(obj);
          obj.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        }
      });

      // Ride path cleanup
      if (this.pathGroup) {
        this.scene.remove(this.pathGroup);
        this.pathGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.pathGroup = null;
        this.pathRibbon = null;
        this.pathRibbonMat = null;
        this.pathLaneLines = null;
        this.pathLaneMat = null;
      }

      // Parallax backdrop cleanup
      if (this.parallaxGroup) {
        this.scene.remove(this.parallaxGroup);
        this.parallaxGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.parallaxGroup = null;
        this.parallaxObjects = [];
      }

      // Flow gates cleanup
      if (this.flowGateGroup) {
        this.scene.remove(this.flowGateGroup);
        this.flowGates.forEach(gate => {
          if (!gate) return;
          gate.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        });
        this.flowGates = [];
        this.flowGateGroup = null;
      }

      this.scene.fog = null;
      this.initialized = false;
    }
  }

  // Export
  window.ThemedEnvironment = ThemedEnvironment;
  window.ENVIRONMENT_THEMES = ENVIRONMENT_THEMES;

  // Export racer models list
  window.RACER_MODELS = RACER_MODELS;

  window.EnvironmentMode = {
    instance: null,
    currentTrack: null,
    gltfLoader: null,

    init(THREE, scene, camera, renderer, trackTitle, gltfLoader) {
      if (this.instance) {
        this.instance.dispose();
      }
      this.currentTrack = trackTitle;
      this.gltfLoader = gltfLoader || this.gltfLoader;
      this.instance = new ThemedEnvironment(THREE, scene, camera, renderer, this.gltfLoader);
      this.instance.init(trackTitle);
      return this.instance;
    },

    setGltfLoader(loader) {
      this.gltfLoader = loader;
      if (this.instance) {
        this.instance.gltfLoader = loader;
      }
    },

    update(dt, audioData) {
      if (this.instance) {
        if (audioData) {
          this.instance.setAudioData(
            audioData.bass || 0,
            audioData.mid || 0,
            audioData.treble || 0,
            audioData.energy || 0,
            audioData.beatPulse || 0,
            !!audioData.beatHit
          );
        }
        this.instance.update(dt);
      }
    },

    changeTrack(trackTitle) {
      if (this.currentTrack !== trackTitle && this.instance) {
        console.log("Environment: changing track to", trackTitle);
        // For now just update theme - could do full rebuild if needed
        this.instance.setTheme(trackTitle);
      }
      this.currentTrack = trackTitle;
    },

    setRacerModel(modelId) {
      if (this.instance) {
        this.instance.setRacerModel(modelId);
      }
    },

    getAvailableRacerModels() {
      return SELECTABLE_RACERS.slice();
    },

    setSpeedMultiplier(multiplier) {
      if (this.instance) {
        this.instance.setSpeedMultiplier(multiplier);
      }
    },

    getSpeedMultiplier() {
      return this.instance ? this.instance.getSpeedMultiplier() : 1.0;
    },

    getShipPosition() {
      if (this.instance) {
        return { x: this.instance.lateralPos, y: this.instance.altitude || 0, z: this.instance.distance };
      }
      return null;
    },

    getShipSpeed() {
      return this.instance ? this.instance.speed : 0;
    },

    setEffectsConfig(config) {
      if (this.instance) {
        this.instance.applyEffectsConfig(config);
      }
    },

    dispose() {
      if (this.instance) {
        this.instance.dispose();
        this.instance = null;
      }
    },

    // Score management
    getScore() {
      return this.instance ? this.instance.getScore() : 0;
    },

    getCombo() {
      return this.instance ? this.instance.getCombo() : 1;
    },

    setScoreCallback(callback) {
      if (this.instance) {
        this.instance.onScoreChange = callback;
      }
    },

    setHitCallback(callback) {
      if (this.instance) {
        this.instance.onHit = callback;
      }
    },

    setFlowCallback(callback) {
      if (this.instance) {
        this.instance.onFlowChange = callback;
      }
    },

    getRunSummary() {
      return this.instance ? this.instance.getRunSummary() : null;
    },

    // High score storage
    getHighScores(trackTitle) {
      try {
        const key = `highscores_${this.sanitizeKey(trackTitle)}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error("Error loading high scores:", e);
        return [];
      }
    },

    saveHighScore(trackTitle, initials, score) {
      try {
        const key = `highscores_${this.sanitizeKey(trackTitle)}`;
        const scores = this.getHighScores(trackTitle);
        scores.push({
          initials: initials.toUpperCase().slice(0, 3),
          score: score,
          date: Date.now()
        });
        // Sort by score descending, keep top 10
        scores.sort((a, b) => b.score - a.score);
        const topScores = scores.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(topScores));
        return topScores;
      } catch (e) {
        console.error("Error saving high score:", e);
        return [];
      }
    },

    isHighScore(trackTitle, score) {
      const scores = this.getHighScores(trackTitle);
      if (scores.length < 10) return true;
      return score > scores[scores.length - 1].score;
    },

    getTopScore(trackTitle) {
      const scores = this.getHighScores(trackTitle);
      return scores.length > 0 ? scores[0].score : 0;
    },

    sanitizeKey(str) {
      return (str || "unknown").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    }
  };

})();
