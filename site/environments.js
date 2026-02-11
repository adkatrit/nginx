/**
 * Themed Environments - Different visual worlds for each track
 * Uses TRACK_THEMES from themes.js as the single source of truth
 */

(function() {
  'use strict';

  // Environment type mapping based on visualStyle patterns
  const TYPE_MAP = {
    "ocean": { scenery: ["coral", "seaweed", "fish"] },
    "meadow": { scenery: ["flowers", "grass", "butterflies"] },
    "volcanic": { scenery: ["rocks", "lava", "flames"] },
    "cyber": { scenery: ["towers", "holograms", "grids"] },
    "ice": { scenery: ["crystals", "icebergs", "snowdrifts"] },
    "savanna": { scenery: ["acacias", "grass", "rocks"] },
    "blossom": { scenery: ["cherrytrees", "petals", "lanterns"] },
    "industrial": { scenery: ["pipes", "girders", "sparks"] },
    "ancient": { scenery: ["ruins", "pillars", "torches"] },
    "matrix": { scenery: ["nodes", "datastreams", "grids"] },
    "desert": { scenery: ["rocks", "cacti"] }
  };

  // Infer environment type from theme name or visualStyle
  function inferEnvironmentType(themeName, theme) {
    const nameMap = {
      "Data Tide": "ocean",
      "Soft Systems": "meadow",
      "Beast Mode": "volcanic",
      "Dreams Bleed Into Dashboards": "cyber",
      "Signal Integrity": "ice",
      "Gi Mi Di Reins": "savanna",
      "Trade You My Hands": "blossom",
      "Push Harder": "industrial",
      "The Last Dragon": "ancient",
      "Who's Learning Who": "matrix"
    };
    return nameMap[themeName] || "desert";
  }

  /**
   * Convert a TRACK_THEMES entry to environment format
   * This allows themes.js to be the single source of truth
   */
  function convertThemeToEnv(themeName, theme) {
    if (!theme) return null;

    const tc = theme.trackColors || {};
    const vs = theme.visualStyle || {};
    const type = inferEnvironmentType(themeName, theme);

    return {
      type: type,
      // Ground/floor color from trackColors
      groundColor: tc.floorPrimary || 0x1a1a2a,
      // Sky gradient from visualStyle or trackColors
      skyTop: vs.skyGradient ? vs.skyGradient[0] : 0x000510,
      skyBottom: vs.skyGradient ? vs.skyGradient[1] : 0x001830,
      // Fog settings from trackColors
      fogColor: tc.fogColor || 0x000810,
      fogNear: tc.fogNear || 50,
      fogFar: tc.fogFar || 600,
      // Scenery based on type
      scenery: TYPE_MAP[type]?.scenery || ["rocks"],
      // Particle color from spotlight or track accent
      particleColor: theme.spotlightColor || tc.wallAccent || 0xffffff,
      // Particle type from visualStyle
      particleType: vs.particleType || "dust",
      // Additional properties from themes.js
      wallStyle: vs.wallStyle || "solid",
      floorPattern: vs.floorPattern || "solid",
      glowIntensity: vs.glowIntensity || 0.5,
      particleDensity: vs.particleDensity || 0.4,
      pulseWithBeat: vs.pulseWithBeat !== false,
      // Track colors for potential future use
      floorSecondary: tc.floorSecondary,
      wallBase: tc.wallBase,
      wallAccent: tc.wallAccent,
      obstacle: tc.obstacle,
      boostPad: tc.boostPad,
      centerMarker: tc.centerMarker,
      ambientLight: tc.ambientLight,
      ambientIntensity: tc.ambientIntensity,
      // Preserve visualStyle for terrain and other features
      visualStyle: vs
    };
  }

  /**
   * Get environment config for a track title
   * First checks TRACK_THEMES (from themes.js), then falls back to default
   */
  function getEnvironmentTheme(trackTitle) {
    const TRACK_THEMES = window.TRACK_THEMES || {};
    const theme = TRACK_THEMES[trackTitle];

    if (theme) {
      const envTheme = convertThemeToEnv(trackTitle, theme);
      console.log("Environment theme converted from themes.js:", trackTitle, envTheme.type);
      return envTheme;
    }

    return { ...DEFAULT_ENV };
  }

  // Default config when no theme matches
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
    particleType: "dust",
    wallStyle: "solid",
    floorPattern: "solid",
    glowIntensity: 0.5,
    particleDensity: 0.4,
    pulseWithBeat: true
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

    // Dynamic camera following
    cameraLagX: 18.0,          // How quickly camera follows laterally (higher = faster)
    cameraLagY: 14.0,          // How quickly camera follows vertically
    cameraVelocityOffsetX: 0.05, // Camera offset based on lateral velocity
    cameraVelocityOffsetY: 0.04, // Camera offset based on vertical velocity
    cameraPullBack: 0.03,      // Pull camera back when moving fast
    cameraLookAheadVel: 0.15,  // Look ahead based on velocity

    // Controls (smoother steering)
    // Higher = steering reacts faster to key changes
    steerResponse: 23,
    steerResponseShiftMult: 2.1,
    steerSpeedShiftMult: 1.6,

    // Racer model normalization (make different GLTFs appear similarly sized)
    racerNormalizeSize: true,
    racerTargetMaxDim: 1.6, // world units (largest bounding-box dimension after scaling)

    // Flight (this is now a flying game)
    flightEnabled: true,
    flightStartY: 6.0,
    flightMinY: 0.5,
    flightMaxY: 18.0,
    verticalResponse: 17,
    verticalResponseShiftMult: 2.0,
    verticalSpeedMult: 1.0,
    verticalSpeedShiftMult: 1.55,
    pitchFromClimb: 0.22,

    // Realistic flight physics
    physicsEnabled: false,          // Disable for direct responsive control
    lateralDrag: 3.5,               // How quickly lateral velocity decays (higher = more drag)
    verticalDrag: 2.8,              // How quickly vertical velocity decays
    lateralAccel: 28.0,             // Lateral acceleration force
    verticalAccel: 22.0,            // Vertical acceleration force
    maxLateralVel: 25.0,            // Maximum lateral velocity
    maxVerticalVel: 18.0,           // Maximum vertical velocity

    // Speed affects turning (realistic: faster = wider turns)
    turnRadiusFactor: 0.6,          // How much speed reduces turn rate (0=none, 1=strong)
    minTurnRateAtSpeed: 0.35,       // Minimum turn rate multiplier at max speed

    // Banking and roll
    bankAngle: 0.45,                // Max roll angle when turning (radians)
    bankResponse: 4.0,              // How fast ship banks into turns
    bankFromVelocity: 0.4,          // Additional bank from lateral momentum
    pitchFromVertVel: 0.15,         // Pitch from vertical velocity
    pitchResponse: 5.0,             // How fast pitch responds

    // Momentum feel
    driftFactor: 0.15,              // How much lateral momentum persists (0=none, 1=ice)
    verticalDriftFactor: 0.1,       // Vertical momentum persistence

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

    // Flow gates (soft "targets" on the ride)
    gateEnabled: true,
    gateTube: 0.5,
    gateInnerPad: 0.65,          // Shrinks inner radius for leniency
    gateSpawnAhead: 140,         // Distance in front of player
    gateSpawnJitter: 30,
    gateBeatCooldown: 0.4,       // Minimum seconds between beat gates
    gateMinDistance: 120,        // Minimum distance between any gates
    gateSpacingBase: 220,        // Distance between non-beat gates
    gateSpacingQuietBonus: 160,  // Extra spacing when energy is low
    gateFlowBoost: 0.09,
    gateMissFlowPenalty: 0.06,
    // Ring size tiers: [radius, score, flowBoost, color tint]
    gateSizes: [
      { name: 'large',  radius: 9.0,  score: 25,  flowBoost: 0.06, chance: 0.4 },
      { name: 'medium', radius: 6.5,  score: 50,  flowBoost: 0.10, chance: 0.4 },
      { name: 'small',  radius: 4.5,  score: 100, flowBoost: 0.15, chance: 0.2 }
    ],
    gateMinRadius: 3.5,  // Never smaller than this (ensures player can fit)

    // Free-rotation bird flight (fly-by style)
    freeRotation: true,
    forwardSpeed: 0.25,             // base forward speed (slower, smoother glide)
    doubleSpeed: 0.6,               // boosted forward speed
    charRotateYMax: 0.006,          // max yaw speed (gentler turns)
    charRotateYAccel: 0.0003,       // yaw acceleration per frame (slower ramp-up)
    charPosYAccel: 0.006,           // altitude acceleration per frame (gradual)
    charPosYMax: 0.09,              // max altitude speed
    freeRotMinY: 2.0,               // min altitude (fly-by: 27, but our scale is different)
    freeRotMaxY: 40.0,              // max altitude (fly-by: 90)
    freeRotCameraLerp: 0.07,        // camera smoothing (lower = smoother trail)
    freeRotCamY: 7,                 // camera Y offset behind bird (fly-by: 7)
    freeRotCamZ: -10,               // camera Z offset behind bird (fly-by: -10)
    freeRotLookAtZ: 15,             // look-ahead Z distance (fly-by: 15)
    // Bone animation increments per frame (slower for smoother body language)
    neckYStep: 0.035,               // neck yaw step per frame
    neckYMax: 0.7,                  // neck yaw limit (fly-by: 0.7)
    bodyYStep: 0.02,                // body yaw step per frame
    bodyYMax: 0.4,                  // body yaw limit (fly-by: 0.4)
    neckXStep: 0.015,               // neck pitch step per frame
    neckXMax: 0.6,                  // neck pitch limit (fly-by: 0.6)
    bodyXStep: 0.01,                // body pitch step per frame
    bodyXMax: 0.4,                  // body pitch limit (fly-by: 0.4)
    baseAltitude: 6.0               // starting altitude above terrain
  };

  // Available racer models
  // - rotationY: Math.PI = facing away, Math.PI/2 = facing right (towards screen)
  // - collisionRadius: hitbox size for the model (adjusted per model size/shape)
  // - offsetY: vertical offset to position model correctly above ground
  // - collisionOffset: {x, y, z} offset from player position to collision center
  const SELECTABLE_RACERS = /** @type {const} */ (['white-eagle', 'jellyfish', 'stork']);
  const RACER_MODELS = {
    'racer_spaceship': { url: './models/racer_spaceship/scene.gltf', scale: 0.5, rotationY: Math.PI, collisionRadius: 1.2, offsetY: 0 },
    'white-eagle': { url: './models/white-eagle/scene.gltf', scale: 0.04, rotationY: Math.PI * 1.5, collisionRadius: 1.2, offsetY: 0.0, collisionOffset: { x: 0, y: -0.3, z: 0 }, collisionScale: { x: 1.3, y: 0.5, z: 0.5 } },
    'icy_dragon': { url: './models/icy_dragon/scene.gltf', scale: 0.8, rotationY: Math.PI, collisionRadius: 1.5, offsetY: 0 },
    'butterfly': { url: './models/butterfly/scene.gltf', scale: 0.05, rotationY: Math.PI, collisionRadius: 0.5, offsetY: 0.5 },
    'biped_robot': { url: './models/biped_robot/scene.gltf', scale: 0.5, rotationY: Math.PI, collisionRadius: 0.8, offsetY: 0 },
    'jellyfish': { url: './models/jellyfish/scene.gltf', scale: 0.5, rotationY: Math.PI, collisionRadius: 0.6, offsetY: 0.5 },
    'blue-whale': { url: './models/blue-whale/scene.gltf', scale: 0.02, rotationY: Math.PI, collisionRadius: 1.0, offsetY: 0.5 },
    'godzilla': { url: './models/godzilla/scene.gltf', scale: 0.3, rotationY: Math.PI, collisionRadius: 1.2, offsetY: 0 },
    'gorilla': { url: './models/gorilla/scene.gltf', scale: 0.02, rotationY: Math.PI, collisionRadius: 0.6, offsetY: 0 },
    'loggerhead': { url: './models/loggerhead/scene.gltf', scale: 0.1, rotationY: Math.PI, collisionRadius: 0.7, offsetY: 0.3 },
    'stork': { url: './models/fly-by-bird/scene.gltf', scale: 0.45, rotationY: 0, collisionRadius: 1.0, offsetY: 0 }
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
      this.lateralLimit = 100;  // Tunable via Flight Controls panel
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

      // Realistic physics - velocity-based movement
      this.lateralVelocity = 0;      // Current lateral (sideways) velocity
      this.verticalVelocity = 0;     // Current vertical velocity
      this.currentBank = 0;          // Current roll/bank angle
      this.currentPitch = 0;         // Current pitch angle
      this.visualRoll = 0;           // Smoothed visual roll for rendering
      this.visualPitch = 0;          // Smoothed visual pitch for rendering

      this.chunks = [];
      this.nextChunkZ = 0;

      this.sky = null;
      this.sun = null;
      this.animatedBackground = null;
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
        const defaultModel = CONFIG.freeRotation ? 'stork' : 'white-eagle';
        // In free-rotation mode, always use the stork bird model
        const saved = CONFIG.freeRotation ? 'stork' : (localStorage.getItem('mysongs-racer-model') || defaultModel);
        const normalized = (SELECTABLE_RACERS.includes(saved) && RACER_MODELS[saved]) ? saved : defaultModel;
        this.racerModelId = normalized;
        if (normalized !== saved) localStorage.setItem('mysongs-racer-model', normalized);
      }
      this.playerCollisionRadius = 1.5;  // Default, updated when model loads
      this.playerOffsetY = 0;  // Vertical offset for model
      this.playerCollisionOffset = { x: 0, y: 0, z: 0 };  // Offset from player pos to collision center
      this.playerCollisionScale = { x: 1, z: 1 };  // Ellipsoid scale (x=width, z=depth)
      this.showCollisionRadius = false;  // Debug: show collision radius sphere
      this.collisionRadiusMesh = null;   // Debug mesh for collision radius

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
      this.onGateHit = null;  // Callback for gate hit (combo, streak, comboIncreased)

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

      // Free-rotation bird flight state (fly-by style)
      this.freeRotationActive = false;
      this.charNeck = null;           // Neck_Armature bone reference
      this.charBody = null;           // Armature_rootJoint bone reference
      this.isDoubleSpeed = false;     // Space toggle
      this.turnDirection = 0;         // -1 left, 0 none, 1 right (legacy, kept for compat)
      this.charRotateYIncrement = 0;  // Current yaw speed (accelerates per frame)
      this.charPosYIncrement = 0;     // Current altitude speed (accelerates per frame)
      this._lookAtPosZ = 15;          // Camera lookAt Z distance (adjusts with altitude)
      this.idealCameraTarget = null;  // Lazy-init THREE.Vector3 for camera lerp
      this._currentCamPos = null;     // Lazy-init THREE.Vector3 for camera position
      this.sceneryChunks = new Map(); // 2D grid scenery for free-rotation (key: "chunkX,chunkZ")
      this.instancePools = {};         // InstancedMesh pools: { poolName: { mesh, freeList, phases[], maxInstances } }
      this.sharedGeometries = {};      // Shared geometries (created once per theme)
      this.sharedMaterials = {};       // Shared materials (created once per theme)

      // Visual effects
      this.speedLines = null;
      this.trail = [];
      this.cameraShake = { x: 0, y: 0, timer: 0 };

      // Dynamic camera state
      this.smoothCamX = 0;
      this.smoothCamY = CONFIG.flightStartY + CONFIG.cameraHeight;
      this.cameraRoll = 0;

      this.colorShiftHue = 0;
      this.pulsePhase = 0;
      this.ambientLight = null;
      this.directionalLight = null;
      this.hemiLight = null;
      this.visual = {
        fogDensity: 1.0,
        speedLines: 1.0,
        colorShift: CONFIG.colorShiftEnabled,
        screenShake: CONFIG.screenShakeOnHit
      };

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

      // Terrain system (Perlin noise terrain)
      this.terrainManager = null;
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
      const visual = this.effectsConfig?.visual;
      if (visual) {
        if (Number.isFinite(visual.fogDensity)) this.visual.fogDensity = Math.max(0, Math.min(2, visual.fogDensity));
        if (Number.isFinite(visual.speedLines)) this.visual.speedLines = Math.max(0, Math.min(2, visual.speedLines));
        if (typeof visual.colorShift === 'boolean') this.visual.colorShift = visual.colorShift;
        if (typeof visual.screenShake === 'boolean') this.visual.screenShake = visual.screenShake;
      }
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

      // If the track's custom scene handles ALL visuals, skip default scenery
      const terrainCfg = this.theme.visualStyle?.terrain;
      this._sceneOnly = !!(terrainCfg && terrainCfg.noEnvironmentScenery);
      const sceneOnly = this._sceneOnly;

      if (!sceneOnly) {
        this.createSky();
        this.createGroundPlane();
        this.createTerrain();
        this.setupInstancePools();

        if (CONFIG.freeRotation) {
          // Free-rotation: only sky, ground (if no terrain), terrain, and particles
          // Skip ride path, parallax, speed lines, trail, and linear chunks
          this.createParticles();
        } else {
          // Legacy on-rails: full forward-flight visual set
          this.createRidePath();
          this.createParallaxBackdrop();
          this.createParticles();
          this.createSpeedLines();
          this.createTrail();

          for (let i = 0; i < CONFIG.chunksAhead + CONFIG.chunksBehind; i++) {
            this.generateChunk();
          }
        }
      }

      this.createPlayer();
      this.createLighting();
      this.setupInput();

      // Apply any loaded effects panel tuning (path/parallax/vista)
      this.applyEffectsConfig(this.effectsConfig);

      if (CONFIG.freeRotation) {
        this.updateFreeRotationCamera();
      } else {
        this.updateCamera();
      }
      this.initialized = true;
      console.log("Environment initialized:", this.theme.type);
    }

    setTheme(trackTitle) {
      this.theme = getEnvironmentTheme(trackTitle);
      console.log("Environment theme set:", this.theme.type, "for", trackTitle);
    }

    createSky() {
      const THREE = this.THREE;

      const TSL = window._TSL;
      const {
        Fn, float, vec3, vec4, uniform, color,
        positionLocal, positionWorld,
        mix: tslMix, smoothstep: tslSmoothstep, pow: tslPow,
        max: tslMax, abs: tslAbs, dot: tslDot, normalize: tslNormalize,
      } = TSL;

      const skyGeom = new THREE.SphereGeometry(CONFIG.viewDistance * 0.95, 32, 32);

      // TSL uniforms
      const uTopColor = uniform(new THREE.Color(this.theme.skyTop));
      const uBottomColor = uniform(new THREE.Color(this.theme.skyBottom));
      const uHorizonColor = uniform(new THREE.Color(0xff6030));
      const uSunGlowColor = uniform(new THREE.Color(0xffcc66));
      const uOffset = uniform(10);
      const uExponent = uniform(0.4);
      const uSunsetIntensity = uniform(0.7);
      const uSunPosition = uniform(new THREE.Vector3(0, 0.05, -1).normalize());

      // Store uniform refs for later updates
      this.skyUniforms = {
        topColor: uTopColor,
        bottomColor: uBottomColor,
        horizonColor: uHorizonColor,
        sunGlowColor: uSunGlowColor,
        offset: uOffset,
        exponent: uExponent,
        sunsetIntensity: uSunsetIntensity,
        sunPosition: uSunPosition,
      };

      const skyColorNode = Fn(() => {
        const dir = tslNormalize(positionLocal);
        const worldPos = positionWorld;
        const h = tslNormalize(worldPos.add(vec3(0, uOffset, 0))).y;

        // Base sky gradient
        const hClamped = tslMax(h, float(0));
        const gradientFactor = tslMax(tslPow(hClamped, uExponent), float(0));
        let skyColor = tslMix(uBottomColor, uTopColor, gradientFactor).toVar();

        // Sunset band at horizon
        const horizonFactor = tslPow(
          float(1).sub(tslSmoothstep(float(0), float(0.35), tslAbs(h))),
          float(1.5)
        );

        // Warm horizon glow
        const sunsetColor = tslMix(uHorizonColor, uSunGlowColor, tslSmoothstep(float(-0.1), float(0.15), h));
        skyColor.assign(tslMix(skyColor, sunsetColor, horizonFactor.mul(uSunsetIntensity)));

        // Sun glow
        const sunDot = tslMax(float(0), tslDot(dir, uSunPosition));
        const sunGlow = tslPow(sunDot, float(8)).mul(0.6);
        const sunCore = tslPow(sunDot, float(64)).mul(1.5);

        skyColor.addAssign(vec3(uSunGlowColor).mul(sunGlow).mul(uSunsetIntensity));
        skyColor.addAssign(vec3(1.0, 0.95, 0.8).mul(sunCore).mul(uSunsetIntensity));

        // Purple tint at top
        const purpleTint = tslSmoothstep(float(0.3), float(0.8), h).mul(uSunsetIntensity).mul(0.2);
        skyColor.assign(tslMix(skyColor, vec3(0.4, 0.2, 0.5), purpleTint));

        return vec4(skyColor, float(1));
      })();

      const skyMat = new TSL.MeshBasicNodeMaterial({
        side: THREE.BackSide,
        colorNode: skyColorNode,
      });

      this.sky = new THREE.Mesh(skyGeom, skyMat);
      this.scene.add(this.sky);

      // Cache base colors for vista tinting
      this._baseSkyTop = uTopColor.value.clone();
      this._baseSkyBottom = uBottomColor.value.clone();

      // Create animated background from theme
      this.createAnimatedBackground();
    }

    createAnimatedBackground() {
      // Clean up existing background
      if (this.animatedBackground) {
        this.animatedBackground.dispose();
        this.animatedBackground = null;
      }

      // Check if AnimatedBackground class is available
      if (typeof window.AnimatedBackground === 'undefined') {
        console.warn("AnimatedBackground class not available - backgrounds.js may not be loaded");
        return;
      }

      // Get background effect config from theme
      const bgEffect = this.theme.visualStyle?.backgroundEffect;
      if (!bgEffect) {
        console.log("No backgroundEffect in theme visualStyle:", this.theme.visualStyle);
        return;
      }

      try {
        // Create animated background with theme config
        this.animatedBackground = new window.AnimatedBackground(this.THREE, this.scene, {
          type: bgEffect.type || 'topo',
          color1: bgEffect.color1,
          color2: bgEffect.color2,
          color3: bgEffect.color3,
          accent: bgEffect.accent,
          speed: bgEffect.speed || 1.0,
          intensity: bgEffect.intensity || 0.5,
          scale: bgEffect.scale || 1.0,
          sunX: bgEffect.sunX,
          sunY: bgEffect.sunY,
          sunSize: bgEffect.sunSize,
          sunColor: bgEffect.sunColor,
          sunIntensity: bgEffect.sunIntensity
        });

        // Hide the sky sphere so the animated background shows through
        if (this.sky) {
          this.sky.visible = false;
          console.log("Sky sphere hidden for animated background");
        }

        console.log("Animated background created:", bgEffect.type, bgEffect);
      } catch (err) {
        console.error("Error creating animated background:", err);
      }
    }

    createGroundPlane() {
      const THREE = this.THREE;

      // Skip ground plane if terrain is enabled (terrain replaces it)
      const terrainConfig = this.theme.visualStyle?.terrain;
      if (terrainConfig && terrainConfig.enabled !== false) {
        console.log('Ground plane skipped - terrain enabled');
        return;
      }

      // Skip ground plane if explicitly disabled (for tracks with custom scenes)
      if (terrainConfig && terrainConfig.enabled === false && terrainConfig.noGroundPlane) {
        console.log('Ground plane skipped - custom scene handles ground');
        return;
      }

      const planeSize = CONFIG.viewDistance * 2;
      const floorPattern = this.theme.floorPattern || 'solid';
      const glowIntensity = this.theme.glowIntensity || 0.5;
      const baseColor = new THREE.Color(this.theme.groundColor);
      const accentColor = new THREE.Color(this.theme.particleColor || 0xffffff);

      // Create geometry with more subdivisions for patterns
      const segments = floorPattern === 'solid' ? 32 : 128;
      const planeGeom = new THREE.PlaneGeometry(planeSize, planeSize, segments, segments);

      // Choose material based on floor pattern
      let planeMat;
      if (floorPattern === 'solid') {
        planeMat = new THREE.MeshStandardMaterial({
          color: this.theme.groundColor,
          roughness: 0.95,
          metalness: 0
        });
      } else {
        // TSL pattern-based floor
        const TSL = window._TSL;
        const {
          Fn, float, vec2, vec3, vec4, uniform,
          positionWorld, fwidth: tslFwidth,
          mix: tslMix, sin: tslSin, step: tslStep, smoothstep: tslSmoothstep,
          fract: tslFract, floor: tslFloor, mod: tslMod,
          abs: tslAbs, min: tslMin, max: tslMax, dot: tslDot,
        } = TSL;

        const uBaseColor = uniform(baseColor);
        const uAccentColor = uniform(accentColor);
        const uGlowIntensity = uniform(glowIntensity);
        const uTime = uniform(0);
        const uEnergy = uniform(0);

        // Store uniform refs for updates
        this.floorUniforms = { time: uTime, energy: uEnergy };

        // Build pattern function based on type (selected at creation time — no runtime branching)
        const patternId = this.getPatternId(floorPattern);

        const patternNode = Fn(() => {
          const worldUV = positionWorld.xz;

          let patternValue;
          if (patternId === 1) {
            // Grid pattern
            const spacing = float(10);
            const gx = tslAbs(tslFract(worldUV.x.div(spacing).sub(0.5)).sub(0.5)).div(tslFwidth(worldUV.x.div(spacing)));
            const gy = tslAbs(tslFract(worldUV.y.div(spacing).sub(0.5)).sub(0.5)).div(tslFwidth(worldUV.y.div(spacing)));
            patternValue = float(1).sub(tslMin(tslMin(gx, gy), float(1)));
          } else if (patternId === 2) {
            // Stripes
            patternValue = tslStep(float(0.5), tslFract(worldUV.x.div(5)));
          } else if (patternId === 3) {
            // Circuit
            const spacing = float(8);
            const gx = tslAbs(tslFract(worldUV.x.div(spacing).sub(0.5)).sub(0.5)).div(tslFwidth(worldUV.x.div(spacing)));
            const gy = tslAbs(tslFract(worldUV.y.div(spacing).sub(0.5)).sub(0.5)).div(tslFwidth(worldUV.y.div(spacing)));
            const lines = float(1).sub(tslMin(tslMin(gx, gy), float(1)));
            const cell = vec2(tslFloor(worldUV.x.div(spacing)), tslFloor(worldUV.y.div(spacing)));
            const dots = tslStep(float(0.8), tslFract(tslSin(tslDot(cell, vec2(127.1, 311.7))).mul(43758.5453)));
            patternValue = tslMax(lines.mul(0.6), dots);
          } else if (patternId === 4) {
            // Waves
            patternValue = tslSin(worldUV.x.mul(0.1).add(uTime)).mul(0.5)
              .add(tslSin(worldUV.y.mul(0.15).add(uTime.mul(0.7))).mul(0.3))
              .add(0.5);
          } else if (patternId === 5) {
            // Hexagon
            const hp = worldUV.mul(0.1);
            const qx = hp.x.mul(2.0 * 0.5773503);
            const qy = hp.y.add(hp.x.mul(0.5773503));
            const pix = tslFloor(qx);
            const piy = tslFloor(qy);
            const pfx = tslFract(qx);
            const pfy = tslFract(qy);
            const v = tslMod(pix.add(piy), float(3));
            const ca = tslStep(float(1), v);
            const cb = tslStep(float(2), v);
            const max1 = tslStep(pfx, pfy);
            const may = tslStep(pfy, pfx);
            const e = tslDot(vec2(max1, may),
              vec2(float(1).sub(pfy).add(ca.mul(pfx.add(pfy).sub(1))).add(cb.mul(pfy.sub(pfx.mul(2)))),
                   float(1).sub(pfx).add(ca.mul(pfx.add(pfy).sub(1))).add(cb.mul(pfx.sub(pfy.mul(2))))));
            patternValue = tslSmoothstep(float(0), float(0.1), e);
          } else {
            patternValue = float(0);
          }

          // Energy pulse
          const pulse = float(1).add(uEnergy.mul(uGlowIntensity).mul(0.5));
          const pv = patternValue.mul(pulse);

          // Mix colors
          const c = tslMix(uBaseColor, uAccentColor, pv.mul(uGlowIntensity)).toVar();
          c.addAssign(vec3(uAccentColor).mul(pv).mul(uGlowIntensity).mul(0.3));
          return vec4(c, float(1));
        })();

        planeMat = new TSL.MeshBasicNodeMaterial({
          side: THREE.FrontSide,
          colorNode: patternNode,
        });
        this.groundPlaneMat = planeMat; // Store reference for updates
      }

      this.groundPlane = new THREE.Mesh(planeGeom, planeMat);
      this.groundPlane.rotation.x = -Math.PI / 2;
      this.scene.add(this.groundPlane);
    }

    getPatternId(pattern) {
      const patterns = { solid: 0, grid: 1, stripes: 2, circuit: 3, waves: 4, hexagon: 5 };
      return patterns[pattern] || 0;
    }

    createTerrain() {
      // Check if TerrainSystem is available and terrain is enabled
      if (typeof TerrainSystem === 'undefined') {
        console.log('Terrain: TerrainSystem not available');
        return;
      }

      const terrainConfig = this.theme.visualStyle?.terrain || this.theme.terrain;
      console.log('Terrain config:', terrainConfig);
      if (!terrainConfig || terrainConfig.enabled === false) {
        console.log('Terrain: disabled or no config');
        return;
      }

      // Merge terrain config with fog colors from theme
      const config = {
        ...terrainConfig,
        fogColor: this.theme.fogColor,
        fogNear: this.theme.fogNear,
        fogFar: this.theme.fogFar,
        seed: this.trackTitle ? this.hashString(this.trackTitle) : 12345
      };

      this.terrainManager = new TerrainSystem.TerrainManager(
        this.THREE,
        this.scene,
        config
      );

      // Initial chunk generation around starting position
      this.terrainManager.updateChunks(this.lateralPos, this.distance);
      console.log('Terrain created with', this.terrainManager.chunks.size, 'chunks');
    }

    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
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

      const TSL = window._TSL;
      const {
        Fn, float, vec2, vec3, vec4, uniform, uv: tslUV,
        mix: tslMix, smoothstep: tslSmoothstep, step: tslStep,
        abs: tslAbs, pow: tslPow, max: tslMax, clamp: tslClamp, fract: tslFract,
      } = TSL;

      const uAccentU = uniform(accent);
      const uOpacityU = uniform(this.world.pathOpacity);
      const uLaneOpacityU = uniform(this.world.pathLaneOpacity);
      const uTimeU = uniform(0);
      const uBeatU = uniform(0);
      const uFlowU = uniform(0);
      const uWidthU = uniform(w);

      // Store uniform refs for updates
      this.pathUniforms = {
        uAccent: uAccentU, uOpacity: uOpacityU, uLaneOpacity: uLaneOpacityU,
        uTime: uTimeU, uBeat: uBeatU, uFlow: uFlowU, uWidth: uWidthU,
      };

      // TSL line helper: 1D line centered at x0 with half-width w
      const tslLine = (xVal, x0, lw) => {
        const d = tslAbs(xVal.sub(x0));
        return float(1).sub(tslSmoothstep(float(0), lw, d));
      };

      const pathColorNode = Fn(() => {
        const vuv = tslUV();
        const x = vuv.x.sub(0.5).mul(2); // -1..1 across ribbon
        const y = vuv.y;                 // 0..1 forward

        // Soft fade at edges and ends
        const edge = tslAbs(x);
        const edgeFade = tslSmoothstep(float(1), float(0.55), edge);
        const endFade = tslSmoothstep(float(0.02), float(0.18), y).mul(tslSmoothstep(float(0.98), float(0.70), y));

        // Lane positions
        const halfW = tslMax(float(1), uWidthU.mul(0.5));
        const laneN = float(14).div(halfW);
        const wLane = float(0.012);
        const lanes = tslLine(x, laneN.negate(), wLane)
          .add(tslLine(x, float(0), wLane))
          .add(tslLine(x, laneN, wLane));

        // Center dashed guide
        const dash = tslStep(tslFract(y.mul(18).add(uTimeU.mul(0.7))), float(0.45));
        const center = tslLine(x, float(0), wLane.mul(0.85)).mul(dash);

        // Base ribbon glow
        const centerGlow = tslPow(edgeFade, float(1.8));
        const base = uOpacityU.mul(centerGlow);

        // Audio modulation
        const vibe = float(0.85).add(uFlowU.mul(0.25)).add(uBeatU.mul(0.20));

        const laneAlpha = uLaneOpacityU.mul(
          tslClamp(lanes, 0, 1).mul(0.65).add(center.mul(0.55))
        );
        const alpha = tslClamp(base.add(laneAlpha).mul(endFade), 0, 1).mul(vibe);

        // Color: slightly desaturated accent
        const col = tslMix(vec3(0.02), uAccentU, float(0.55)).toVar();
        col.addAssign(vec3(uAccentU).mul(laneAlpha.mul(0.35).add(base.mul(0.15))));

        return vec4(col, alpha);
      })();

      this.pathRibbonMat = new TSL.MeshBasicNodeMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        colorNode: pathColorNode,
      });

      this.pathRibbon = new THREE.Mesh(geom, this.pathRibbonMat);
      this.pathRibbon.position.y = this.world.pathOffsetAhead;
      this.pathGroup.add(this.pathRibbon);

      // Lane line meshes are no longer needed (kept null for cleanup consistency)
      this.pathLaneLines = null;
      this.pathLaneMat = null;
    }

    createParallaxBackdrop() {
      return; // All tracks have custom scene builders — parallax shapes not needed
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

    triggerVista(energy, force = false) {
      if (!this.world.vistaEnabled && !force) return;
      if (this.vista.cooldown > 0 && !force) return;
      if (!force && energy < this.world.vistaMinEnergy) return;

      // Use provided energy or default to max for forced triggers
      const effectiveEnergy = force ? 1.0 : energy;

      this.vista.duration = this.world.vistaDuration;
      this.vista.timer = this.world.vistaDuration;
      this.vista.cooldown = this.world.vistaCooldown;
      this.vista.intensity = Math.min(1, 0.35 + effectiveEnergy * 0.85);
    }

    updateVista(dt) {
      if (!this.world.vistaEnabled) return;
      if (this.vista.cooldown > 0) this.vista.cooldown = Math.max(0, this.vista.cooldown - dt);
      if (this.vista.timer <= 0) {
        // Ensure base colors are restored
        if (this.scene.fog && this._baseFogColor) this.scene.fog.color.copy(this._baseFogColor);
        if (this.sky && this.skyUniforms && this._baseSkyTop && this._baseSkyBottom) {
          this.skyUniforms.topColor.value.copy(this._baseSkyTop);
          this.skyUniforms.bottomColor.value.copy(this._baseSkyBottom);
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
      if (this.sky && this.skyUniforms && this._baseSkyTop && this._baseSkyBottom) {
        this.skyUniforms.topColor.value.copy(this._baseSkyTop.clone().lerp(accent, 0.18 + k * 0.45));
        this.skyUniforms.bottomColor.value.copy(this._baseSkyBottom.clone().lerp(accent, 0.12 + k * 0.35));
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
      const beat = this.theme.pulseWithBeat === false ? 0 : (this.audioData.beatPulse || 0);
      if (this.pathUniforms) {
        this.pathUniforms.uTime.value = this.time;
        this.pathUniforms.uBeat.value = beat;
        this.pathUniforms.uFlow.value = this.flow;
        this.pathUniforms.uOpacity.value = this.world.pathOpacity;
        this.pathUniforms.uLaneOpacity.value = this.world.pathLaneOpacity;
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
        console.log('createPlayer: loading model', this.racerModelId, 'gltfLoader:', !!this.gltfLoader);
        this.loadRacerModel(this.racerModelId);
      } else {
        console.warn('createPlayer: cannot load model - gltfLoader:', !!this.gltfLoader, 'modelConfig:', !!modelConfig, 'racerModelId:', this.racerModelId);
      }
    }

    createFallbackPlayer() {
      // No visible fallback - just wait for the actual model to load
      this.fallbackShip = null;
      this.leftGlow = null;
      this.rightGlow = null;
    }

    loadRacerModel(modelId) {
      const modelConfig = RACER_MODELS[modelId];
      if (!modelConfig || !this.gltfLoader) {
        console.warn('Cannot load racer model:', modelId);
        return;
      }

      const THREE = this.THREE;
      console.log('Loading racer model:', modelId, 'url:', modelConfig.url, 'freeRotation:', CONFIG.freeRotation);

      this.gltfLoader.load(
        modelConfig.url,
        (gltf) => {
          console.log('GLTF loaded successfully:', modelId, 'animations:', gltf.animations?.length || 0);
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
              // Skip normalization in free-rotation mode (bird uses its own scale)
              if (CONFIG.racerNormalizeSize && !CONFIG.freeRotation && maxDim0 > 1e-6) {
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
              action.setEffectiveTimeScale(0.6);
              action.play();
            });
            console.log(`Playing ${gltf.animations.length} animation(s) for ${modelId}`);
          }

          // Find bird bones for free-rotation bending (fly-by style)
          if (CONFIG.freeRotation) {
            this.charNeck = model.getObjectByName('Neck_Armature') || null;
            this.charBody = model.getObjectByName('Armature_rootJoint') || null;
            if (this.charNeck) console.log('Found bird neck bone: Neck_Armature');
            if (this.charBody) console.log('Found bird body bone: Armature_rootJoint');
          }

          // Apply vertical offset for model positioning
          if (modelConfig.offsetY !== undefined) {
            model.position.y += modelConfig.offsetY;
            this.playerOffsetY = modelConfig.offsetY;
          }

          // Set collision radius, offset, and scale for this model
          this.playerCollisionRadius = modelConfig.collisionRadius || 1.5;
          this.playerCollisionOffset = modelConfig.collisionOffset || { x: 0, y: 0, z: 0 };
          this.playerCollisionScale = modelConfig.collisionScale || { x: 1, z: 1 };

          // Update collision radius debug mesh if visible
          if (this.showCollisionRadius) {
            this.updateCollisionRadiusMesh();
          }

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
          console.error('Failed to load racer model:', modelId, 'url:', modelConfig.url, error);
        }
      );
    }

    addModelGlow(model) {
      // No engine glows for animal/creature models - they look out of place
      this.leftGlow = null;
      this.rightGlow = null;
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

    updateCollisionRadiusMesh() {
      const THREE = this.THREE;

      if (this.showCollisionRadius) {
        // Create or update the collision radius visualization
        if (!this.collisionRadiusMesh) {
          const geometry = new THREE.SphereGeometry(1, 24, 16);
          const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.6
          });
          this.collisionRadiusMesh = new THREE.Mesh(geometry, material);
          this.collisionRadiusMesh.name = 'collision-radius-debug';
        }

        // Update scale to match current collision radius and ellipsoid scale
        const radius = this.playerCollisionRadius || 1.5;
        const scaleX = this.playerCollisionScale?.x || 1;
        const scaleY = this.playerCollisionScale?.y || 1;
        const scaleZ = this.playerCollisionScale?.z || 1;
        // Apply ellipsoid: X=width, Y=height, Z=depth (football shape)
        this.collisionRadiusMesh.scale.set(radius * scaleX, radius * scaleY, radius * scaleZ);

        // Add to scene if not already added
        if (!this.collisionRadiusMesh.parent) {
          this.scene.add(this.collisionRadiusMesh);
        }
        this.collisionRadiusMesh.visible = true;
        console.log('Collision ellipsoid debug ON - radius:', radius.toFixed(2), 'scale: x=' + scaleX.toFixed(2) + ' y=' + scaleY.toFixed(2) + ' z=' + scaleZ.toFixed(2));
      } else {
        // Hide the mesh
        if (this.collisionRadiusMesh) {
          this.collisionRadiusMesh.visible = false;
        }
        console.log('Collision radius debug OFF');
      }
    }

    setSpeedMultiplier(multiplier) {
      this.speedMultiplier = Math.max(0.25, Math.min(2.0, multiplier));
      localStorage.setItem('mysongs-cruise-speed', String(this.speedMultiplier));
      console.log('Cruise speed set to:', this.speedMultiplier.toFixed(2) + 'x');
    }

    getSpeedMultiplier() {
      return this.speedMultiplier;
    }

    setFlightConfig(key, value) {
      // Update the CONFIG value and store the lateral limit for use in updateMovement
      if (key === 'lateralLimit') {
        this.lateralLimit = value;
        console.log('Lateral limit set to:', value);
      } else if (key in CONFIG) {
        CONFIG[key] = value;
        console.log(`Flight config ${key} set to:`, value);
      }
    }

    createParticles() {
      const THREE = this.THREE;
      const TSL = window._TSL;
      const density = this.theme.particleDensity || 0.4;
      const baseCount = 800;
      const particleCount = Math.floor(baseCount * (0.3 + density * 1.4));
      const pType = this.theme.particleType || 'dust';
      const isRising = pType === 'bubbles' || pType === 'embers';
      const isFalling = pType === 'snow' || pType === 'rain';
      const glowIntensity = this.theme.glowIntensity || 0.5;
      const sizeMap = { dust: 0.3, sparks: 0.5, bubbles: 0.6, embers: 0.4, snow: 0.5, rain: 0.15, petals: 0.7, code: 0.3, data: 0.4 };
      const baseSize = sizeMap[pType] || 0.4;

      // Try GPU compute particles if native WebGPU is available
      if (navigator.gpu && TSL && TSL.StorageBufferAttribute) {
        try {
          this._createGPUParticles(THREE, TSL, particleCount, pType, isRising, isFalling, glowIntensity, baseSize);
          return;
        } catch (e) {
          console.warn('GPU compute particles failed, falling back to CPU:', e);
        }
      }

      // CPU fallback (original implementation)
      this._createCPUParticles(THREE, particleCount, pType, isRising, isFalling, glowIntensity, baseSize);
    }

    _createCPUParticles(THREE, particleCount, pType, isRising, isFalling, glowIntensity, baseSize) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = [];

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = this.lateralPos + (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = this.altitude + (Math.random() - 0.5) * 22;
        positions[i * 3 + 2] = this.distance + Math.random() * 200;

        let vy = (Math.random() - 0.5) * 0.1;
        if (isRising) vy = Math.abs(vy) + 0.05;
        if (isFalling) vy = -Math.abs(vy) - 0.1;

        velocities.push({
          x: (Math.random() - 0.5) * 0.2,
          y: vy,
          z: -0.5 - Math.random() * 0.5
        });
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: this.theme.particleColor,
        size: baseSize * (0.8 + glowIntensity * 0.4),
        transparent: true,
        opacity: 0.5 + glowIntensity * 0.3,
        blending: THREE.AdditiveBlending
      });

      this.particles = new THREE.Points(geometry, material);
      this.particles.userData.velocities = velocities;
      this.particles.userData.particleCount = particleCount;
      this.particles.userData.gpuCompute = false;
      this.scene.add(this.particles);
    }

    _createGPUParticles(THREE, TSL, particleCount, pType, isRising, isFalling, glowIntensity, baseSize) {
      const {
        Fn, float, vec2, vec3, vec4, uniform,
        instanceIndex, storage, compute,
        sin: tslSin, cos: tslCos, abs: tslAbs, fract: tslFract,
        max: tslMax, min: tslMin, select,
        StorageBufferAttribute,
      } = TSL;

      // Buffer layout: 8 floats per particle — pos(3) + vel(3) + life(1) + seed(1)
      const particleData = new Float32Array(particleCount * 8);
      for (let i = 0; i < particleCount; i++) {
        const base = i * 8;
        // Position
        particleData[base + 0] = this.lateralPos + (Math.random() - 0.5) * 100;
        particleData[base + 1] = this.altitude + (Math.random() - 0.5) * 22;
        particleData[base + 2] = this.distance + Math.random() * 200;
        // Velocity
        particleData[base + 3] = (Math.random() - 0.5) * 0.2;
        let vy = (Math.random() - 0.5) * 0.1;
        if (isRising) vy = Math.abs(vy) + 0.05;
        if (isFalling) vy = -Math.abs(vy) - 0.1;
        particleData[base + 4] = vy;
        particleData[base + 5] = -0.5 - Math.random() * 0.5;
        // Life (0-1) and seed
        particleData[base + 6] = Math.random();
        particleData[base + 7] = Math.random();
      }

      const storageBuffer = new StorageBufferAttribute(particleData, 8);

      // Compute uniforms
      this.particleComputeUniforms = {
        uEnergy: uniform(0),
        uBass: uniform(0),
        uDeltaTime: uniform(0.016),
        uPlayerX: uniform(this.lateralPos),
        uPlayerY: uniform(this.altitude),
        uPlayerZ: uniform(this.distance),
        uSpeed: uniform(0),
      };
      const pu = this.particleComputeUniforms;

      // Compute shader: update positions, recycle when behind player
      const computeShader = Fn(() => {
        const idx = instanceIndex;
        const particle = storage(storageBuffer, 'vec4', particleCount);
        // Read pos and vel from storage (each particle = 2 vec4s packed)
        const posLife = particle.element(idx.mul(2));
        const velSeed = particle.element(idx.mul(2).add(1));

        const px = posLife.x.toVar();
        const py = posLife.y.toVar();
        const pz = posLife.z.toVar();
        const vx = velSeed.x;
        const vy = velSeed.y;
        const vz = velSeed.z;
        const seed = velSeed.w;

        // Update position
        px.addAssign(vx.mul(float(1).add(pu.uEnergy)));
        py.addAssign(vy.add(pu.uBass.mul(0.03)));
        pz.addAssign(vz.sub(pu.uSpeed.mul(0.5)).mul(pu.uDeltaTime).mul(60));

        // Respawn when behind player
        const behind = pz.lessThan(pu.uPlayerZ.sub(30));
        // Hash-based pseudo-random for new position
        const h1 = tslFract(tslSin(seed.mul(43758.5453)).mul(12345.6789));
        const h2 = tslFract(tslSin(seed.mul(12345.6789)).mul(43758.5453));
        const h3 = tslFract(tslSin(seed.add(0.1).mul(43758.5453)).mul(12345.6789));
        px.assign(select(behind, pu.uPlayerX.add(h1.sub(0.5).mul(100)), px));
        py.assign(select(behind, pu.uPlayerY.add(h2.sub(0.5).mul(22)), py));
        pz.assign(select(behind, pu.uPlayerZ.add(float(50)).add(h3.mul(150)), pz));

        // Write back
        posLife.assign(vec4(px, py, pz, posLife.w));
      });

      this.particleCompute = computeShader().compute(particleCount);

      // Geometry with storage buffer positions
      const geometry = new THREE.BufferGeometry();
      // Use the first 3 components of each 8-float stride for position
      // We need to create a separate position buffer that reads from storage
      const positionArray = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positionArray[i * 3] = particleData[i * 8];
        positionArray[i * 3 + 1] = particleData[i * 8 + 1];
        positionArray[i * 3 + 2] = particleData[i * 8 + 2];
      }
      const posAttr = new StorageBufferAttribute(positionArray, 3);
      geometry.setAttribute('position', posAttr);

      // PointsNodeMaterial with audio-reactive size
      const uOpacity = uniform(0.5 + glowIntensity * 0.3);
      this._particleOpacityUniform = uOpacity;

      const material = new TSL.PointsNodeMaterial({
        color: this.theme.particleColor,
        size: baseSize * (0.8 + glowIntensity * 0.4),
        transparent: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false,
      });
      material.opacityNode = uOpacity;

      this.particles = new THREE.Points(geometry, material);
      this.particles.frustumCulled = false;
      this.particles.userData.particleCount = particleCount;
      this.particles.userData.gpuCompute = true;
      this.particles.userData.storageBuffer = storageBuffer;
      this.particles.userData.posAttr = posAttr;
      this.scene.add(this.particles);
      console.log('GPU compute particles created:', particleCount);
    }

    createLighting() {
      const THREE = this.THREE;
      const glowIntensity = this.theme.glowIntensity || 0.5;
      const ambientIntensity = this.theme.ambientIntensity || 0.4;

      // Main light colored by sky, intensity affected by glow
      const mainLightIntensity = 1.0 + glowIntensity * 0.4;
      this.directionalLight = new THREE.DirectionalLight(this.theme.skyBottom, mainLightIntensity);
      this.directionalLight.position.set(100, 80, 100);
      this.scene.add(this.directionalLight);

      // Ambient from theme or ground color
      const ambientColor = this.theme.ambientLight || this.theme.groundColor;
      this.ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
      this.scene.add(this.ambientLight);

      // Hemisphere
      this.hemiLight = new THREE.HemisphereLight(this.theme.skyTop, this.theme.groundColor, 0.5);
      this.scene.add(this.hemiLight);
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
      const chunkZ = this.nextChunkZ;
      const chunkKey = `linear_${chunkZ}`;

      // Linear mode: x spans -50 to +50 (width=100), z spans chunkZ to chunkZ+chunkSize
      this._generateChunkInstanced(chunkKey, -50, chunkZ, CONFIG.chunkSize, 100);

      this.chunks.push({ z: chunkZ, key: chunkKey });
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

    // ─── InstancedMesh Pool System ───────────────────────────────────────

    setupInstancePools() {
      const THREE = this.THREE;
      this.disposeInstancePools();
      this.instancePools = {};
      this.sharedGeometries = {};
      this.sharedMaterials = {};

      const type = this.theme.type;
      const MAX = 200;

      // Helper to create a pool
      const mkPool = (name, geom, mat, maxInstances = MAX) => {
        const mesh = new THREE.InstancedMesh(geom, mat, maxInstances);
        mesh.count = 0;
        mesh.frustumCulled = false;
        this.scene.add(mesh);
        this.instancePools[name] = {
          mesh,
          maxInstances,
          freeList: [],  // indices freed by chunk removal (reuse first)
          // Per-instance data: swayPhase, pulsePhase, baseMatrix, baseScale
          phases: new Array(maxInstances),
          chunkMap: new Map(), // chunkKey → [indices]
        };
      };

      // Shared geometries
      const G = this.sharedGeometries;
      G.dodecahedron = new THREE.DodecahedronGeometry(1, 0);
      G.sphere = new THREE.SphereGeometry(1, 8, 8);
      G.cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
      G.cone = new THREE.ConeGeometry(1, 1, 6);
      G.box = new THREE.BoxGeometry(1, 1, 1);
      G.icosahedron = new THREE.IcosahedronGeometry(1, 0);
      G.octahedron = new THREE.OctahedronGeometry(1, 0);

      // Shared materials
      const M = this.sharedMaterials;

      switch (type) {
        case 'desert':
          M.cactus = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.7 });
          M.sandRock = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.85, flatShading: true });
          mkPool('cactusStem', G.cylinder, M.cactus);
          mkPool('cactusArm', G.cylinder, M.cactus);
          mkPool('rock', G.dodecahedron, M.sandRock);
          break;

        case 'ocean':
          M.coralPink = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.8 });
          M.coralCyan = new THREE.MeshStandardMaterial({ color: 0x00bfff, roughness: 0.8 });
          M.seaweed = new THREE.MeshStandardMaterial({ color: 0x228b22 });
          mkPool('coralPink', G.sphere, M.coralPink);
          mkPool('coralCyan', G.sphere, M.coralCyan);
          mkPool('seaweed', G.cylinder, M.seaweed);
          break;

        case 'meadow':
          M.stemGreen = new THREE.MeshStandardMaterial({ color: 0x228b22 });
          M.petalPink = new THREE.MeshStandardMaterial({ color: 0xff69b4 });
          M.petalGold = new THREE.MeshStandardMaterial({ color: 0xffd700 });
          M.petalRed = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
          M.petalPurple = new THREE.MeshStandardMaterial({ color: 0xdda0dd });
          M.petalBlue = new THREE.MeshStandardMaterial({ color: 0x87ceeb });
          M.grass = new THREE.MeshStandardMaterial({ color: 0x90ee90 });
          mkPool('flowerStem', G.cylinder, M.stemGreen);
          mkPool('flowerPetal', G.sphere, M.petalPink);  // single color pool, we'll vary via pool selection
          mkPool('grassBlade', G.cone, M.grass);
          break;

        case 'volcanic':
          M.darkRock = new THREE.MeshStandardMaterial({ color: 0x2a1010, roughness: 0.85, flatShading: true });
          M.lavaGlow = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8 });
          mkPool('volcanicRock', G.dodecahedron, M.darkRock);
          mkPool('lavaGlow', G.sphere, M.lavaGlow);
          break;

        case 'cyber':
          M.towerDark = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.8, roughness: 0.2 });
          M.neonLine = new THREE.MeshBasicMaterial({ color: this.theme.particleColor });
          mkPool('towerBody', G.box, M.towerDark);
          mkPool('neonLine', G.box, M.neonLine);
          break;

        case 'ice':
          M.crystal = new THREE.MeshPhysicalMaterial({
            color: 0x88ffff, metalness: 0.1, roughness: 0.1,
            transmission: 0.5, transparent: true, opacity: 0.8
          });
          mkPool('crystal', G.cone, M.crystal);
          break;

        case 'savanna':
          M.trunk = new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.95 });
          M.canopy = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.32, 0.45, 0.40),
            emissive: new THREE.Color().setHSL(0.32, 0.55, 0.08),
            emissiveIntensity: 0.55, roughness: 0.9
          });
          mkPool('trunk', G.cylinder, M.trunk);
          mkPool('branch', G.cylinder, M.trunk);
          mkPool('canopy', G.icosahedron, M.canopy);
          break;

        case 'blossom':
          M.cherryTrunk = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.95 });
          M.blossom = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.93, 0.55, 0.72),
            emissive: new THREE.Color().setHSL(0.93, 0.8, 0.18),
            emissiveIntensity: 0.65, roughness: 0.85
          });
          mkPool('trunk', G.cylinder, M.cherryTrunk);
          mkPool('branch', G.cylinder, M.cherryTrunk);
          mkPool('blossom', G.icosahedron, M.blossom);
          break;

        case 'industrial':
          M.pipe = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
          M.girder = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.6 });
          mkPool('pipe', G.cylinder, M.pipe);
          mkPool('girder', G.box, M.girder);
          break;

        case 'ancient':
          M.pillar = new THREE.MeshStandardMaterial({ color: 0x696969 });
          M.rubble = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.85, flatShading: true });
          mkPool('pillar', G.cylinder, M.pillar);
          mkPool('rubble', G.dodecahedron, M.rubble);
          break;

        case 'matrix':
          M.dataNode = new THREE.MeshBasicMaterial({ color: this.theme.particleColor, transparent: true, opacity: 0.8 });
          M.dataStream = new THREE.MeshBasicMaterial({ color: this.theme.particleColor, transparent: true, opacity: 0.3 });
          mkPool('dataNode', G.octahedron, M.dataNode);
          mkPool('dataStream', G.box, M.dataStream);
          break;
      }
    }

    // Allocate an instance index from a pool (returns -1 if full)
    _allocInstance(poolName) {
      const pool = this.instancePools[poolName];
      if (!pool) return -1;
      if (pool.freeList.length > 0) {
        return pool.freeList.pop();
      }
      if (pool.mesh.count < pool.maxInstances) {
        return pool.mesh.count++;
      }
      return -1; // pool full
    }

    // Set instance matrix from position, rotation, scale components
    _setInstanceMatrix(poolName, index, px, py, pz, rx, ry, rz, sx, sy, sz) {
      const pool = this.instancePools[poolName];
      if (!pool) return;
      // Reuse cached temp objects
      if (!this._imTmp) {
        this._imTmp = {
          m: new this.THREE.Matrix4(),
          q: new this.THREE.Quaternion(),
          e: new this.THREE.Euler(),
          p: new this.THREE.Vector3(),
          s: new this.THREE.Vector3(),
        };
      }
      const { m, q, e, p, s } = this._imTmp;
      e.set(rx, ry, rz);
      q.setFromEuler(e);
      p.set(px, py, pz);
      s.set(sx, sy, sz);
      m.compose(p, q, s);
      pool.mesh.setMatrixAt(index, m);
      // Store base matrix for animation (must clone since m is reused)
      pool.phases[index] = pool.phases[index] || {};
      pool.phases[index].baseMatrix = m.clone();
      pool.phases[index].baseScale = { x: sx, y: sy, z: sz };
    }

    // Register chunk instances for later cleanup
    _registerChunkInstance(chunkKey, poolName, index) {
      const pool = this.instancePools[poolName];
      if (!pool) return;
      if (!pool.chunkMap.has(chunkKey)) {
        pool.chunkMap.set(chunkKey, []);
      }
      pool.chunkMap.get(chunkKey).push(index);
    }

    // Generate scenery instances for a chunk using InstancedMesh pools
    // chunkWorldX/chunkWorldZ: world-space origin of chunk
    // chunkSizeX/chunkSizeZ: dimensions (chunkSizeX defaults to chunkSizeZ for 2D chunks)
    _generateChunkInstanced(chunkKey, chunkWorldX, chunkWorldZ, chunkSizeZ, chunkSizeX) {
      const sceneryCount = 15;
      const type = this.theme.type;
      const sizeX = chunkSizeX !== undefined ? chunkSizeX : chunkSizeZ;

      for (let i = 0; i < sceneryCount; i++) {
        const x = chunkWorldX + Math.random() * sizeX;
        const z = chunkWorldZ + Math.random() * chunkSizeZ;
        let y = 0;
        if (this.terrainManager) {
          const terrainY = this.terrainManager.getTerrainHeightAt(x, z);
          if (terrainY !== null) y = terrainY;
        }

        switch (type) {
          case 'desert': this._spawnDesert(chunkKey, x, y, z); break;
          case 'ocean': this._spawnOcean(chunkKey, x, y, z); break;
          case 'meadow': this._spawnMeadow(chunkKey, x, y, z); break;
          case 'volcanic': this._spawnVolcanic(chunkKey, x, y, z); break;
          case 'cyber': this._spawnCyber(chunkKey, x, y, z); break;
          case 'ice': this._spawnIce(chunkKey, x, y, z); break;
          case 'savanna': this._spawnSavanna(chunkKey, x, y, z); break;
          case 'blossom': this._spawnBlossom(chunkKey, x, y, z); break;
          case 'industrial': this._spawnIndustrial(chunkKey, x, y, z); break;
          case 'ancient': this._spawnAncient(chunkKey, x, y, z); break;
          case 'matrix': this._spawnMatrix(chunkKey, x, y, z); break;
          default: this._spawnDesert(chunkKey, x, y, z); break;
        }
      }

      // Mark all modified pools as needing update
      for (const pool of Object.values(this.instancePools)) {
        pool.mesh.instanceMatrix.needsUpdate = true;
      }
    }

    // ─── Per-theme spawn functions ────────────────────────────────────────

    _spawnDesert(ck, x, y, z) {
      if (Math.random() > 0.6) {
        // Cactus: stem + optional arm
        const height = 3 + Math.random() * 5;
        const idx = this._allocInstance('cactusStem');
        if (idx >= 0) {
          this._setInstanceMatrix('cactusStem', idx, x, y + height / 2, z, 0, 0, 0, 0.45, height, 0.45);
          const phase = Math.random() * Math.PI * 2;
          this.instancePools['cactusStem'].phases[idx].swayPhase = phase;
          this._registerChunkInstance(ck, 'cactusStem', idx);
        }
        if (Math.random() > 0.5) {
          const aidx = this._allocInstance('cactusArm');
          if (aidx >= 0) {
            const armLen = height * 0.4;
            // Arm offset from stem center
            this._setInstanceMatrix('cactusArm', aidx,
              x - 0.6, y + height * 0.45, z,
              0, 0, Math.PI / 4,
              0.275, armLen, 0.275);
            this.instancePools['cactusArm'].phases[aidx].swayPhase =
              this.instancePools['cactusStem'].phases[idx]?.swayPhase || 0;
            this._registerChunkInstance(ck, 'cactusArm', aidx);
          }
        }
      } else {
        // Rock
        const size = 0.5 + Math.random() * 2;
        const idx = this._allocInstance('rock');
        if (idx >= 0) {
          const rx = Math.random() * 0.4;
          const ry = Math.random() * Math.PI * 2;
          const rz = Math.random() * 0.4;
          const sx = size * (0.7 + Math.random() * 0.6);
          const sy = size * (0.6 + Math.random() * 0.4);
          const sz = size * (0.7 + Math.random() * 0.6);
          this._setInstanceMatrix('rock', idx, x, y + size * 0.4, z, rx, ry, rz, sx, sy, sz);
          this._registerChunkInstance(ck, 'rock', idx);
        }
      }
    }

    _spawnOcean(ck, x, y, z) {
      if (Math.random() > 0.5) {
        // Coral
        const poolName = Math.random() > 0.5 ? 'coralPink' : 'coralCyan';
        const size = 1 + Math.random();
        const idx = this._allocInstance(poolName);
        if (idx >= 0) {
          const scaleY = 0.6 + Math.random() * 0.4;
          this._setInstanceMatrix(poolName, idx, x, y + 0.5, z, 0, 0, 0, size, size * scaleY, size);
          const phase = Math.random() * Math.PI * 2;
          this.instancePools[poolName].phases[idx].swayPhase = phase;
          this._registerChunkInstance(ck, poolName, idx);
        }
      } else {
        // Seaweed: 3 strands
        const height = 2 + Math.random() * 3;
        const phase = Math.random() * Math.PI * 2;
        for (let s = 0; s < 3; s++) {
          const idx = this._allocInstance('seaweed');
          if (idx >= 0) {
            const ox = (Math.random() - 0.5) * 0.5;
            const oz = (Math.random() - 0.5) * 0.5;
            const rz = (Math.random() - 0.5) * 0.3;
            this._setInstanceMatrix('seaweed', idx,
              x + ox, y + height / 2, z + oz,
              0, 0, rz,
              0.125, height, 0.125);
            this.instancePools['seaweed'].phases[idx].swayPhase = phase;
            this._registerChunkInstance(ck, 'seaweed', idx);
          }
        }
      }
    }

    _spawnMeadow(ck, x, y, z) {
      if (Math.random() > 0.7) {
        // Flower: stem + petal sphere
        const idx = this._allocInstance('flowerStem');
        if (idx >= 0) {
          this._setInstanceMatrix('flowerStem', idx, x, y + 0.5, z, 0, 0, 0, 0.05, 1, 0.05);
          const phase = Math.random() * Math.PI * 2;
          this.instancePools['flowerStem'].phases[idx].swayPhase = phase;
          this._registerChunkInstance(ck, 'flowerStem', idx);
        }
        const pidx = this._allocInstance('flowerPetal');
        if (pidx >= 0) {
          this._setInstanceMatrix('flowerPetal', pidx, x, y + 1.1, z, 0, 0, 0, 0.3, 0.3, 0.3);
          this.instancePools['flowerPetal'].phases[pidx].swayPhase =
            this.instancePools['flowerStem'].phases[idx]?.swayPhase || 0;
          this._registerChunkInstance(ck, 'flowerPetal', pidx);
        }
      } else {
        // Grass: 5 blades
        const phase = Math.random() * Math.PI * 2;
        for (let b = 0; b < 5; b++) {
          const idx = this._allocInstance('grassBlade');
          if (idx >= 0) {
            const ox = (Math.random() - 0.5) * 0.4;
            const oz = (Math.random() - 0.5) * 0.4;
            const rz = (Math.random() - 0.5) * 0.3;
            this._setInstanceMatrix('grassBlade', idx,
              x + ox, y + 0.5, z + oz,
              0, 0, rz,
              0.3, 1, 0.3);
            this.instancePools['grassBlade'].phases[idx].swayPhase = phase;
            this._registerChunkInstance(ck, 'grassBlade', idx);
          }
        }
      }
    }

    _spawnVolcanic(ck, x, y, z) {
      const size = 0.5 + Math.random() * 2;
      const idx = this._allocInstance('volcanicRock');
      if (idx >= 0) {
        const rx = Math.random() * 0.4;
        const ry = Math.random() * Math.PI * 2;
        const rz = Math.random() * 0.4;
        const sx = size * (0.7 + Math.random() * 0.6);
        const sy = size * (0.6 + Math.random() * 0.4);
        const sz = size * (0.7 + Math.random() * 0.6);
        this._setInstanceMatrix('volcanicRock', idx, x, y + size * 0.4, z, rx, ry, rz, sx, sy, sz);
        this.instancePools['volcanicRock'].phases[idx].pulsePhase = Math.random() * Math.PI * 2;
        this._registerChunkInstance(ck, 'volcanicRock', idx);
      }
      // Optional lava glow
      if (Math.random() > 0.5) {
        const gidx = this._allocInstance('lavaGlow');
        if (gidx >= 0) {
          this._setInstanceMatrix('lavaGlow', gidx, x, y + 0.1, z, 0, 0, 0, 0.2, 0.2, 0.2);
          this.instancePools['lavaGlow'].phases[gidx].pulsePhase =
            this.instancePools['volcanicRock'].phases[idx]?.pulsePhase || 0;
          this._registerChunkInstance(ck, 'lavaGlow', gidx);
        }
      }
    }

    _spawnCyber(ck, x, y, z) {
      const height = 5 + Math.random() * 10;
      const idx = this._allocInstance('towerBody');
      if (idx >= 0) {
        this._setInstanceMatrix('towerBody', idx, x, y + height / 2, z, 0, 0, 0, 1, height, 1);
        this.instancePools['towerBody'].phases[idx].pulsePhase = Math.random() * Math.PI * 2;
        this._registerChunkInstance(ck, 'towerBody', idx);
      }
      // 3 neon lines
      for (let n = 0; n < 3; n++) {
        const nidx = this._allocInstance('neonLine');
        if (nidx >= 0) {
          const ny = y + (n + 1) * (height / 4);
          this._setInstanceMatrix('neonLine', nidx, x, ny, z + 0.5, 0, 0, 0, 1.1, 0.1, 0.05);
          this.instancePools['neonLine'].phases[nidx].pulsePhase =
            this.instancePools['towerBody'].phases[idx]?.pulsePhase || 0;
          this._registerChunkInstance(ck, 'neonLine', nidx);
        }
      }
    }

    _spawnIce(ck, x, y, z) {
      const height = 1 + Math.random() * 3;
      const idx = this._allocInstance('crystal');
      if (idx >= 0) {
        const rz = (Math.random() - 0.5) * 0.3;
        this._setInstanceMatrix('crystal', idx, x, y + height / 2, z, 0, 0, rz, 0.5, height, 0.5);
        this.instancePools['crystal'].phases[idx].pulsePhase = Math.random() * Math.PI * 2;
        this._registerChunkInstance(ck, 'crystal', idx);
      }
    }

    _spawnSavanna(ck, x, y, z) {
      const overallScale = 0.75 + Math.random() * 0.6;
      const trunkHeight = 3.2 + Math.random() * 2.6;
      const trunkRadiusTop = 0.16 + Math.random() * 0.06;
      const trunkRadiusBottom = trunkRadiusTop + 0.18 + Math.random() * 0.08;
      const phase = Math.random() * Math.PI * 2;

      // Trunk
      const tidx = this._allocInstance('trunk');
      if (tidx >= 0) {
        const lean = (Math.random() - 0.5) * 0.12;
        // CylinderGeometry(1,1,1) → scale to (radiusBottom, height, radiusBottom), approximate taper
        const avgRadius = (trunkRadiusTop + trunkRadiusBottom) / 2;
        this._setInstanceMatrix('trunk', tidx,
          x, y + (trunkHeight / 2) * overallScale, z,
          0, 0, lean,
          avgRadius * overallScale, trunkHeight * overallScale, avgRadius * overallScale);
        this.instancePools['trunk'].phases[tidx].swayPhase = phase;
        this._registerChunkInstance(ck, 'trunk', tidx);
      }

      // Branches
      const branchCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < branchCount; i++) {
        const bidx = this._allocInstance('branch');
        if (bidx >= 0) {
          const len = 1.4 + Math.random() * 1.6;
          const r0 = trunkRadiusTop * (0.95 - i * 0.1);
          const r1 = Math.max(0.05, r0 * 0.55);
          const avgR = (r0 + r1) / 2;
          const by = y + trunkHeight * (0.62 + Math.random() * 0.22) * overallScale;
          const side = i % 2 === 0 ? 1 : -1;
          const bx = x + side * (0.25 + Math.random() * 0.2) * overallScale;
          const bz = z + (Math.random() - 0.5) * 0.25 * overallScale;
          this._setInstanceMatrix('branch', bidx,
            bx, by, bz,
            (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.6, side * (0.9 + Math.random() * 0.35),
            avgR * overallScale, len * overallScale, avgR * overallScale);
          this.instancePools['branch'].phases[bidx].swayPhase = phase;
          this._registerChunkInstance(ck, 'branch', bidx);
        }
      }

      // Canopy blobs
      const canopyBaseY = trunkHeight + 0.35 + Math.random() * 0.4;
      const canopyRadius = 1.8 + Math.random() * 1.1;
      const canopyCount = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < canopyCount; i++) {
        const cidx = this._allocInstance('canopy');
        if (cidx >= 0) {
          const ang = (i / canopyCount) * Math.PI * 2 + Math.random() * 0.6;
          const r = canopyRadius * (0.25 + Math.random() * 0.55);
          const blobScale = (1.35 + Math.random() * 1.15) * overallScale;
          const cx = x + Math.cos(ang) * r * overallScale;
          const cy = y + (canopyBaseY + (Math.random() - 0.5) * 0.4) * overallScale;
          const cz = z + Math.sin(ang) * r * 0.55 * overallScale;
          this._setInstanceMatrix('canopy', cidx,
            cx, cy, cz,
            Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI,
            blobScale, blobScale, blobScale);
          this.instancePools['canopy'].phases[cidx].swayPhase = phase;
          this._registerChunkInstance(ck, 'canopy', cidx);
        }
      }
    }

    _spawnBlossom(ck, x, y, z) {
      const overallScale = 0.85 + Math.random() * 0.55;
      const trunkHeight = 2.8 + Math.random() * 1.6;
      const phase = Math.random() * Math.PI * 2;

      // Trunk
      const tidx = this._allocInstance('trunk');
      if (tidx >= 0) {
        const lean = (Math.random() - 0.5) * 0.18;
        const avgR = (0.14 + 0.28) / 2;
        this._setInstanceMatrix('trunk', tidx,
          x, y + (trunkHeight / 2) * overallScale, z,
          0, 0, lean,
          avgR * overallScale, trunkHeight * overallScale, avgR * overallScale);
        this.instancePools['trunk'].phases[tidx].swayPhase = phase;
        this._registerChunkInstance(ck, 'trunk', tidx);
      }

      // Branches
      const branchCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < branchCount; i++) {
        const bidx = this._allocInstance('branch');
        if (bidx >= 0) {
          const len = 1.1 + Math.random() * 1.4;
          const r0 = 0.12 + Math.random() * 0.06;
          const r1 = Math.max(0.04, r0 * 0.55);
          const avgR = (r0 + r1) / 2;
          const side = i % 2 === 0 ? 1 : -1;
          const by = y + trunkHeight * (0.55 + Math.random() * 0.25) * overallScale;
          const bx = x + side * (0.12 + Math.random() * 0.25) * overallScale;
          const bz = z + (Math.random() - 0.5) * 0.25 * overallScale;
          this._setInstanceMatrix('branch', bidx,
            bx, by, bz,
            (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.9, side * (0.8 + Math.random() * 0.55),
            avgR * overallScale, len * overallScale, avgR * overallScale);
          this.instancePools['branch'].phases[bidx].swayPhase = phase;
          this._registerChunkInstance(ck, 'branch', bidx);
        }
      }

      // Blossom blobs
      const blossomCenterY = trunkHeight + 0.7 + Math.random() * 0.4;
      const blossomCount = 6 + Math.floor(Math.random() * 6);
      for (let i = 0; i < blossomCount; i++) {
        const bidx = this._allocInstance('blossom');
        if (bidx >= 0) {
          const ang = Math.random() * Math.PI * 2;
          const r = 1.3 + Math.random() * 1.5;
          const blobScale = (0.65 + Math.random() * 0.85) * overallScale;
          const bx = x + Math.cos(ang) * r * overallScale;
          const by = y + (blossomCenterY + (Math.random() - 0.5) * 0.55) * overallScale;
          const bz = z + Math.sin(ang) * r * overallScale;
          this._setInstanceMatrix('blossom', bidx,
            bx, by, bz,
            Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI,
            blobScale, blobScale, blobScale);
          this.instancePools['blossom'].phases[bidx].swayPhase = phase;
          this._registerChunkInstance(ck, 'blossom', bidx);
        }
      }
    }

    _spawnIndustrial(ck, x, y, z) {
      if (Math.random() > 0.5) {
        // Pipe
        const idx = this._allocInstance('pipe');
        if (idx >= 0) {
          this._setInstanceMatrix('pipe', idx, x, y + 1, z, 0, 0, Math.PI / 2, 0.3, 4, 0.3);
          this._registerChunkInstance(ck, 'pipe', idx);
        }
      } else {
        // Girder
        const idx = this._allocInstance('girder');
        if (idx >= 0) {
          const rz = (Math.random() - 0.5) * 0.2;
          this._setInstanceMatrix('girder', idx, x, y + 2.5, z, 0, 0, rz, 0.5, 5, 0.5);
          this._registerChunkInstance(ck, 'girder', idx);
        }
      }
    }

    _spawnAncient(ck, x, y, z) {
      // Pillar
      const height = 2 + Math.random() * 4;
      const idx = this._allocInstance('pillar');
      if (idx >= 0) {
        // CylinderGeometry(0.5, 0.6, height) → scale unit cylinder
        this._setInstanceMatrix('pillar', idx, x, y + height / 2, z, 0, 0, 0, 0.55, height, 0.55);
        this.instancePools['pillar'].phases[idx].pulsePhase = Math.random() * Math.PI * 2;
        this._registerChunkInstance(ck, 'pillar', idx);
      }
      // 3 rubble rocks
      for (let r = 0; r < 3; r++) {
        const ridx = this._allocInstance('rubble');
        if (ridx >= 0) {
          const rscale = 0.3 + Math.random() * 0.3;
          const rx = x + (Math.random() - 0.5) * 2;
          const rz2 = z + (Math.random() - 0.5) * 2;
          this._setInstanceMatrix('rubble', ridx,
            rx, y, rz2,
            Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4,
            rscale, rscale * 0.7, rscale);
          this.instancePools['rubble'].phases[ridx].pulsePhase =
            this.instancePools['pillar'].phases[idx]?.pulsePhase || 0;
          this._registerChunkInstance(ck, 'rubble', ridx);
        }
      }
    }

    _spawnMatrix(ck, x, y, z) {
      const nodeY = 1 + Math.random() * 2;
      // Data node
      const idx = this._allocInstance('dataNode');
      if (idx >= 0) {
        this._setInstanceMatrix('dataNode', idx, x, y + nodeY, z, 0, 0, 0, 0.5, 0.5, 0.5);
        this.instancePools['dataNode'].phases[idx].pulsePhase = Math.random() * Math.PI * 2;
        this._registerChunkInstance(ck, 'dataNode', idx);
      }
      // Data stream
      const sidx = this._allocInstance('dataStream');
      if (sidx >= 0) {
        this._setInstanceMatrix('dataStream', sidx, x, y + 1.5, z, 0, 0, 0, 0.05, 3, 0.05);
        this.instancePools['dataStream'].phases[sidx].pulsePhase =
          this.instancePools['dataNode'].phases[idx]?.pulsePhase || 0;
        this._registerChunkInstance(ck, 'dataStream', sidx);
      }
    }

    // Free instances belonging to a chunk
    _freeChunkInstances(chunkKey) {
      const _zeroMatrix = new this.THREE.Matrix4().makeScale(0, 0, 0);
      for (const pool of Object.values(this.instancePools)) {
        const indices = pool.chunkMap.get(chunkKey);
        if (!indices) continue;
        for (const idx of indices) {
          // Hide by scaling to zero
          pool.mesh.setMatrixAt(idx, _zeroMatrix);
          pool.freeList.push(idx);
          pool.phases[idx] = null;
        }
        pool.mesh.instanceMatrix.needsUpdate = true;
        pool.chunkMap.delete(chunkKey);
      }
    }

    // Dispose all instance pools
    disposeInstancePools() {
      for (const pool of Object.values(this.instancePools)) {
        this.scene.remove(pool.mesh);
        pool.mesh.dispose();
      }
      this.instancePools = {};
      for (const geom of Object.values(this.sharedGeometries)) {
        geom.dispose();
      }
      this.sharedGeometries = {};
      for (const mat of Object.values(this.sharedMaterials)) {
        mat.dispose();
      }
      this.sharedMaterials = {};
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
          if (CONFIG.freeRotation) this.turnDirection = 1;
          e.preventDefault();
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this._rightDown = true;
          if (CONFIG.freeRotation) this.turnDirection = -1;
          e.preventDefault();
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          this._upDown = true;
          e.preventDefault();
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this._downDown = true;
          e.preventDefault();
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          if (!CONFIG.freeRotation) this._shiftDown = true;
        } else if (e.code === 'Space') {
          e.preventDefault();
          if (CONFIG.freeRotation) {
            // Toggle double speed
            this.isDoubleSpeed = !this.isDoubleSpeed;
          } else {
            // Boost (afterburner) for forward speed
            if (!this.boosting) {
              this.boosting = true;
              this.boostTimer = CONFIG.boostDuration;
            }
          }
        } else if (e.code === 'KeyR') {
          // Toggle collision radius debug visualization
          this.showCollisionRadius = !this.showCollisionRadius;
          this.updateCollisionRadiusMesh();
        }
      };
      this._onKeyUp = (e) => {
        if (shouldIgnoreKey(e)) return;

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this._leftDown = false;
          if (CONFIG.freeRotation && !this._rightDown) this.turnDirection = 0;
          else if (CONFIG.freeRotation && this._rightDown) this.turnDirection = -1;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this._rightDown = false;
          if (CONFIG.freeRotation && !this._leftDown) this.turnDirection = 0;
          else if (CONFIG.freeRotation && this._leftDown) this.turnDirection = 1;
        }
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
        this.turnDirection = 0;
        this.isDoubleSpeed = false;
        this.charRotateYIncrement = 0;
        this.charPosYIncrement = 0;
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

    /**
     * Set per-stem visualization data from manifest
     * @param {Object} data - { stemId: { analysis: {energy, bass, mid, treble}, viz: {target, effect, color} } }
     */
    setStemVizData(data) {
      this.stemVizData = data;

      // Process stem data into effect accumulators
      if (data) {
        let drumEnergy = 0, bassDeform = 0, vocalFog = 0, synthPulse = 0;

        // Helper to apply stem overrides (enabled/threshold/gain)
        const getEffectiveEnergy = (stemId, rawEnergy) => {
          if (!window.getStemEffectOverride) return rawEnergy;
          const override = window.getStemEffectOverride(stemId);
          if (!override.enabled) return 0;
          const threshold = override.threshold || 0;
          if (rawEnergy < threshold) return 0;
          return ((rawEnergy - threshold) / (1 - threshold)) * (override.gain || 1);
        };

        for (const [stemId, stemData] of Object.entries(data)) {
          const { analysis, viz } = stemData;
          if (!analysis || !viz) continue;

          // Apply stem overrides to energy values
          const e = getEffectiveEnergy(stemId, analysis.energy || 0);
          const b = getEffectiveEnergy(stemId, analysis.bass || 0);

          // Accumulate effects based on target/effect type
          if (viz.target === 'terrain' && viz.effect === 'impact') {
            drumEnergy = Math.max(drumEnergy, e);
          }
          if (viz.target === 'terrain' && viz.effect === 'deformation') {
            bassDeform = Math.max(bassDeform, b);
          }
          if (viz.target === 'atmosphere' && viz.effect === 'fog') {
            vocalFog = Math.max(vocalFog, e);
          }
          if (viz.target === 'background' && viz.effect === 'pulse') {
            synthPulse = Math.max(synthPulse, e);
          }
        }

        // Store for use in update loop
        this.stemEffects = {
          drumEnergy,
          bassDeform,
          vocalFog,
          synthPulse
        };
      }
    }

    _clamp01(v) {
      return Math.max(0, Math.min(1, v));
    }

    updateFloorPattern(dt, energy, bass) {
      if (!this.groundPlane || !this.floorUniforms) return;
      const pulseEnabled = this.theme.pulseWithBeat !== false;
      const reactiveEnergy = pulseEnabled ? energy : 0;
      const reactiveBass = pulseEnabled ? bass : 0;
      this.floorUniforms.time.value = this.time;
      this.floorUniforms.energy.value = Math.min(1, Math.max(0, reactiveEnergy + reactiveBass * 0.4));
    }

    resetForTrack(trackTitle) {
      const THREE = this.THREE;
      this.setTheme(trackTitle);
      this.trackTitle = trackTitle;

      // Reset movement + run state
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
      this.time = 0;

      // Reset physics state
      this.lateralVelocity = 0;
      this.verticalVelocity = 0;
      this.currentBank = 0;
      this.currentPitch = 0;
      this.visualRoll = 0;
      this.visualPitch = 0;

      // Reset free-rotation state
      this.turnDirection = 0;
      this.isDoubleSpeed = false;
      this.charRotateYIncrement = 0;
      this.charPosYIncrement = 0;
      this._lookAtPosZ = CONFIG.freeRotLookAtZ || 15;
      this.idealCameraTarget = null;
      this._currentCamPos = null;
      this.freeRotationActive = false;
      if (this.player) {
        this.player.rotation.set(0, 0, 0);
        this.player.position.set(0, CONFIG.freeRotation ? CONFIG.baseAltitude : this.altitude, 0);
      }
      // Reset bird bone rotations
      if (this.charNeck) this.charNeck.rotation.set(0, 0, 0);
      if (this.charBody) this.charBody.rotation.set(0, 0, 0);

      // Reset camera state
      this.smoothCamX = 0;
      this.smoothCamY = CONFIG.flightStartY + CONFIG.cameraHeight;
      this.cameraRoll = 0;

      this.score = 0;
      this.combo = 1;
      this.comboTimer = 0;
      this.lastHitTime = 0;
      this.hitCooldown = 0;

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
      this._lastGateTime = -999;
      this._nextGateZ = CONFIG.gateSpawnAhead;

      // Clear flow gates
      if (this.flowGateGroup) {
        this.scene.remove(this.flowGateGroup);
        this.flowGateGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.flowGateGroup = null;
      }
      this.flowGates = [];
      this.flowGateGroup = new THREE.Group();
      this.flowGateGroup.name = 'flow-gates';
      this.scene.add(this.flowGateGroup);

      // Clear themed geometry
      const disposeObject = (obj) => {
        if (!obj) return;
        this.scene.remove(obj);
        obj.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      };

      disposeObject(this.sky);
      this.sky = null;
      disposeObject(this.groundPlane);
      this.groundPlane = null;
      disposeObject(this.particles);
      this.particles = null;
      disposeObject(this.pathGroup);
      this.pathGroup = null;
      this.pathRibbon = null;
      this.pathRibbonMat = null;
      this.pathLaneLines = null;
      this.pathLaneMat = null;
      disposeObject(this.parallaxGroup);
      this.parallaxGroup = null;
      this.parallaxObjects = [];
      disposeObject(this.speedLines);
      this.speedLines = null;

      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.directionalLight) this.scene.remove(this.directionalLight);
      if (this.hemiLight) this.scene.remove(this.hemiLight);
      this.ambientLight = null;
      this.directionalLight = null;
      this.hemiLight = null;

      // Clear chunks/scenery (InstancedMesh pools)
      this.disposeInstancePools();
      this.chunks = [];
      this.nextChunkZ = 0;
      this.sceneryChunks.clear();

      // Clear terrain
      if (this.terrainManager) {
        this.terrainManager.dispose();
        this.terrainManager = null;
      }

      // Recreate theme-driven systems
      this.scene.fog = new THREE.Fog(this.theme.fogColor, this.theme.fogNear, this.theme.fogFar);
      this._baseFogColor = new THREE.Color(this.theme.fogColor);

      if (!this._sceneOnly) {
        this.createSky();
        this.createGroundPlane();
        this.createTerrain();

        if (CONFIG.freeRotation) {
          this.createParticles();
        } else {
          if (this.world.pathEnabled) this.createRidePath();
          if (this.world.parallaxEnabled) this.createParallaxBackdrop();
          this.createParticles();
          this.createSpeedLines();
          this.createTrail();

          for (let i = 0; i < CONFIG.chunksAhead + CONFIG.chunksBehind; i++) {
            this.generateChunk();
          }
        }
      }
      this.createLighting();

      if (this.player) {
        this.player.position.set(0, this.altitude, 0);
        this.player.rotation.set(0, 0, 0);
      }

      this.updateCamera();
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

      // Pick a random size tier based on weighted chances
      const roll = Math.random();
      let cumulative = 0;
      let sizeTier = CONFIG.gateSizes[0];
      for (const tier of CONFIG.gateSizes) {
        cumulative += tier.chance;
        if (roll < cumulative) {
          sizeTier = tier;
          break;
        }
      }

      // Ensure radius is never smaller than player model + buffer
      const playerRadius = this.playerCollisionRadius || 1.5;
      const minAllowedRadius = Math.max(CONFIG.gateMinRadius, playerRadius * 2.5);
      const radius = Math.max(minAllowedRadius, sizeTier.radius);
      const tube = CONFIG.gateTube;

      // Color-code by size: small=gold, medium=cyan, large=green
      const baseAccent = new THREE.Color(this.theme.particleColor || 0xffffff);
      let ringColor;
      if (sizeTier.name === 'small') {
        ringColor = new THREE.Color(0xffd700); // Gold for high value
      } else if (sizeTier.name === 'medium') {
        ringColor = baseAccent.clone().lerp(new THREE.Color(0xffffff), 0.3);
      } else {
        ringColor = new THREE.Color(0x00ff88); // Green for easy
      }

      // Main ring - brighter and thicker
      const geom = new THREE.TorusGeometry(radius, tube, 12, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const gate = new THREE.Mesh(geom, mat);
      gate.name = 'flow-gate';

      // Outer glow ring for visibility
      const glowGeom = new THREE.TorusGeometry(radius, tube * 2.5, 8, 48);
      const glowMat = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glowRing = new THREE.Mesh(glowGeom, glowMat);
      glowRing.name = 'flow-gate-glow';
      gate.add(glowRing);

      // Favor a few soft "lanes" plus a little randomness
      const lanes = [-14, 0, 14];
      const laneX = lanes[Math.floor(Math.random() * lanes.length)];
      const x = Math.max(-28, Math.min(28, laneX + (Math.random() - 0.5) * 3));
      const z = this.distance + CONFIG.gateSpawnAhead + Math.random() * CONFIG.gateSpawnJitter;

      // Vertical lanes for flying (so you actually have to fly through them)
      // Account for terrain height if terrain exists
      let terrainClearance = 0;
      if (this.terrainManager) {
        const terrainY = this.terrainManager.getTerrainHeightAt(x, z);
        if (terrainY !== null) {
          terrainClearance = Math.max(0, terrainY + 3.0);
        }
      }
      const yMin = Math.max(CONFIG.flightMinY + 1.0, terrainClearance);
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
        spawnedAt: this.time,
        sizeTier: sizeTier.name,
        score: sizeTier.score,
        flowBoost: sizeTier.flowBoost
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

        // Pulse animation for visibility (before resolution)
        if (!data.resolved && gate.material) {
          const pulse = 1 + Math.sin(this.time * 4 + data.spawnedAt) * 0.15;
          gate.scale.setScalar(pulse);
          // Also pulse the glow ring if present
          const glow = gate.children.find(c => c.name === 'flow-gate-glow');
          if (glow && glow.material) {
            glow.material.opacity = 0.25 + Math.sin(this.time * 4 + data.spawnedAt) * 0.15;
          }
        }

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

            // Use gate-specific flowBoost (smaller rings give more flow)
            const flowBoost = data.flowBoost || CONFIG.gateFlowBoost;
            this.flow = this._clamp01(this.flow + flowBoost + (this.audioData.beatPulse || 0) * 0.03);

            // Combo increases based on consecutive gate hits
            // Every 2 gates in a row increases combo by 1 (up to max)
            const oldCombo = this.combo;
            const comboFromStreak = Math.min(CONFIG.maxCombo, 1 + Math.floor(this.gateStreak / 2));
            if (comboFromStreak > this.combo) {
              this.combo = comboFromStreak;
              this.comboTimer = 0; // Reset decay timer on combo increase
            }

            // Gate reward: use gate-specific score (smaller rings worth more)
            const gateScore = data.score || 35;
            this.score += gateScore * this.combo;

            // Trigger gate hit callback for visual feedback
            if (this.onGateHit) {
              this.onGateHit(this.combo, this.gateStreak, this.combo > oldCombo, data.sizeTier);
            }

            // Visual burst: brighten and scale gate briefly
            if (gate.material) {
              gate.material.opacity = 1.0;
              gate.scale.setScalar(1.3);
            }
          } else {
            this.gatesMissed += 1;
            this.gateStreak = 0;
            // Missing a gate resets combo
            this.combo = 1;
            this.comboTimer = 0;
            this.flow = this._clamp01(this.flow - CONFIG.gateMissFlowPenalty);
          }

          // Update score display immediately on gate hit/miss
          if (this.onScoreChange) {
            this.onScoreChange(Math.floor(this.score), this.combo);
          }

          // Visual: fade quickly after resolve
          if (gate.material && !passed) {
            gate.material.opacity = 0.18;
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

      // === FREE-ROTATION PATH (fly-by style bird flight) ===
      if (CONFIG.freeRotation) {
        // Activate free-rotation on first update
        if (!this.freeRotationActive) this.freeRotationActive = true;

        // Movement: yaw + forward + terrain-follow
        this.updateFreeRotation(dt);
        // Bird bone animation (neck/body bending on turns)
        this.updateBirdBones();
        // Animate wing flapping etc.
        if (this.modelAnimationMixer) this.modelAnimationMixer.update(dt);

        // Scenery in 2D grid around player
        this.updateSceneryChunks2D();
        this.updateScenery(bass, mid, energy);

        // Terrain: symmetric grid for omnidirectional flight
        if (this.terrainManager) {
          this.terrainManager.updateChunks(
            this.player.position.x, this.player.position.z,
            0, 0, 4  // symmetricRange=4
          );
        }

        // Update positions of sky/ground to follow player
        if (this.groundPlane) {
          this.groundPlane.position.set(this.lateralPos, 0, this.distance);
        }
        if (this.sky) {
          this.sky.position.set(this.lateralPos, 0, this.distance);
        }

        // Particles + lighting
        this.updateParticles(dt, energy, bass);
        this.updateLighting(dt, bass, energy);

        // Vista moments still work
        if (beatHit) this.triggerVista(energy);
        this.updateVista(dt);

        // Camera: smooth trailing lerp
        this.updateFreeRotationCamera();

        // Stem-specific effects (fog, background, terrain audio) - shared path
        this._updateStemEffects(dt, bass, mid, treble, energy);

        return; // Skip legacy path
      }

      // === LEGACY ON-RAILS PATH (unchanged) ===

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
      this.speed += (targetSpeed - this.speed) * 0.1;
      this.distance += this.speed * dt * 60;

      // === REALISTIC FLIGHT PHYSICS ===
      if (CONFIG.physicsEnabled) {
        // Get input targets
        const steerTarget = (this._leftDown ? 1 : 0) + (this._rightDown ? -1 : 0);
        const climbTarget = (this._upDown ? -1 : 0) + (this._downDown ? 1 : 0);

        // Smooth input signals
        const steerResponse = CONFIG.steerResponse * (this._shiftDown ? CONFIG.steerResponseShiftMult : 1);
        const steerK = 1 - Math.exp(-steerResponse * dt);
        this.steerInput += (steerTarget - this.steerInput) * steerK;

        const climbResponse = CONFIG.verticalResponse * (this._shiftDown ? CONFIG.verticalResponseShiftMult : 1);
        const climbK = 1 - Math.exp(-climbResponse * dt);
        this.verticalInput += (climbTarget - this.verticalInput) * climbK;

        // Speed affects turning - faster = harder to turn (wider radius)
        const speedRatio = Math.min(1, this.speed / CONFIG.maxSpeed);
        const turnRateMultiplier = 1.0 - (speedRatio * CONFIG.turnRadiusFactor * (1 - CONFIG.minTurnRateAtSpeed));

        // Apply acceleration to velocities (with turn rate reduction at speed)
        const lateralAccel = CONFIG.lateralAccel * turnRateMultiplier * (this._shiftDown ? 1.4 : 1);
        this.lateralVelocity += this.steerInput * lateralAccel * dt;

        if (CONFIG.flightEnabled) {
          const verticalAccel = CONFIG.verticalAccel * (this._shiftDown ? 1.4 : 1);
          this.verticalVelocity += this.verticalInput * verticalAccel * dt;
        }

        // Apply drag (velocity decays over time)
        const lateralDragFactor = Math.exp(-CONFIG.lateralDrag * dt);
        const verticalDragFactor = Math.exp(-CONFIG.verticalDrag * dt);

        // Add drift factor - some momentum persists even with drag
        const effectiveLateralDrag = lateralDragFactor + (1 - lateralDragFactor) * CONFIG.driftFactor;
        const effectiveVerticalDrag = verticalDragFactor + (1 - verticalDragFactor) * CONFIG.verticalDriftFactor;

        this.lateralVelocity *= effectiveLateralDrag;
        this.verticalVelocity *= effectiveVerticalDrag;

        // Clamp velocities
        this.lateralVelocity = Math.max(-CONFIG.maxLateralVel, Math.min(CONFIG.maxLateralVel, this.lateralVelocity));
        this.verticalVelocity = Math.max(-CONFIG.maxVerticalVel, Math.min(CONFIG.maxVerticalVel, this.verticalVelocity));

        // Apply velocities to position
        this.lateralPos += this.lateralVelocity * dt;
        this.lateralPos = Math.max(-this.lateralLimit, Math.min(this.lateralLimit, this.lateralPos));

        if (CONFIG.flightEnabled) {
          this.altitude += this.verticalVelocity * dt;
          this.altitude = Math.max(CONFIG.flightMinY, Math.min(CONFIG.flightMaxY, this.altitude));
        } else {
          this.altitude = 0.8;
          this.verticalVelocity = 0;
        }

        // === BANKING AND ROLL PHYSICS ===
        // Target bank based on steering input + lateral velocity
        const inputBank = this.steerInput * CONFIG.bankAngle;
        const velocityBank = (this.lateralVelocity / CONFIG.maxLateralVel) * CONFIG.bankAngle * CONFIG.bankFromVelocity;
        const targetBank = -(inputBank + velocityBank); // Negative for correct direction

        // Smooth bank transition
        const bankK = 1 - Math.exp(-CONFIG.bankResponse * dt);
        this.currentBank += (targetBank - this.currentBank) * bankK;
        // Clamp bank to safe range (max ~45 degrees)
        const maxBank = 0.8;
        this.currentBank = Math.max(-maxBank, Math.min(maxBank, this.currentBank));

        // Target pitch based on vertical input + vertical velocity
        const inputPitch = this.verticalInput * CONFIG.pitchFromClimb;
        const velocityPitch = (this.verticalVelocity / CONFIG.maxVerticalVel) * CONFIG.pitchFromVertVel;
        const targetPitch = inputPitch + velocityPitch;

        // Smooth pitch transition
        const pitchK = 1 - Math.exp(-CONFIG.pitchResponse * dt);
        this.currentPitch += (targetPitch - this.currentPitch) * pitchK;

        // Extra smooth visual roll/pitch for rendering (prevents jitter)
        this.visualRoll += (this.currentBank - this.visualRoll) * 0.15;
        this.visualPitch += (this.currentPitch - this.visualPitch) * 0.15;

      } else {
        // === LEGACY NON-PHYSICS MOVEMENT ===
        // Steering
        const steerTarget = (this._leftDown ? 1 : 0) + (this._rightDown ? -1 : 0);
        const steerResponse = CONFIG.steerResponse * (this._shiftDown ? CONFIG.steerResponseShiftMult : 1);
        const steerK = 1 - Math.exp(-steerResponse * dt);
        this.steerInput += (steerTarget - this.steerInput) * steerK;
        const steerSpeedMult = this._shiftDown ? CONFIG.steerSpeedShiftMult : 1;
        const steerSpeed = 0.4 * this.speed * steerSpeedMult;
        this.lateralPos += this.steerInput * steerSpeed * dt * 60;
        this.lateralPos = Math.max(-this.lateralLimit, Math.min(this.lateralLimit, this.lateralPos));

        // Flight (vertical control)
        if (CONFIG.flightEnabled) {
          const climbTarget = (this._upDown ? -1 : 0) + (this._downDown ? 1 : 0);
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

        // Legacy visual roll (for non-physics mode)
        this.visualRoll = -this.steerInput * 0.35;
        this.visualPitch = this.verticalInput * CONFIG.pitchFromClimb;
      }

      // Chill Ride: flow + gates (disabled in free-rotation mode)
      this.updateFlow(dt);
      if (CONFIG.gateEnabled && !CONFIG.freeRotation) {
        // Spawn gates on beats (throttled), plus gentle distance-based spacing.
        // Always enforce minimum distance between gates for achievability
        const canSpawnBeatGate = beatHit &&
          (this.time - this._lastGateTime) > CONFIG.gateBeatCooldown &&
          (this._nextGateZ - this.distance) < CONFIG.gateMinDistance;

        if (canSpawnBeatGate) {
          this.spawnFlowGate();
          this._lastGateTime = this.time;
          this._nextGateZ = this.distance + CONFIG.gateMinDistance;
        }
        if (this.distance >= this._nextGateZ) {
          this.spawnFlowGate();
          const spacing = Math.max(CONFIG.gateMinDistance, CONFIG.gateSpacingBase + (1 - energy) * CONFIG.gateSpacingQuietBonus);
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

        // Use physics-based visual roll/pitch if available, otherwise use legacy
        if (CONFIG.physicsEnabled) {
          this.player.rotation.z = this.visualRoll;
          this.player.rotation.x = this.visualPitch;
        } else {
          const targetRoll = -this.steerInput * 0.35;
          const targetPitch = this.verticalInput * CONFIG.pitchFromClimb;
          this.player.rotation.z += (targetRoll - this.player.rotation.z) * 0.12;
          this.player.rotation.x += (targetPitch - this.player.rotation.x) * 0.12;
        }

        // Update collision radius debug mesh position (with model-specific offset)
        if (this.collisionRadiusMesh && this.collisionRadiusMesh.visible) {
          const offset = this.playerCollisionOffset || { x: 0, y: 0, z: 0 };
          this.collisionRadiusMesh.position.set(
            this.player.position.x + offset.x,
            this.player.position.y + offset.y,
            this.player.position.z + offset.z
          );
        }
      }

      // Update model animations
      if (this.modelAnimationMixer) {
        this.modelAnimationMixer.update(dt);
      }

      this.updateChunks();
      this.updateTerrain();
      this.updateTerrainCollision();
      this.updateScenery(bass, mid, energy);
      this.updateParticles(dt, energy, bass);
      this.updateSpeedLines(dt, energy);
      this.updateLighting(dt, bass, energy);
      this.updateFloorPattern(dt, energy, bass);
      this.updateVista(dt);
      this.updateCollisions(dt);
      this.updateScore(dt);
      this.emitFlowUpdate(dt);

      // Stem-specific effects (fog, background, terrain audio)
      this._updateStemEffects(dt, bass, mid, treble, energy);

      this.updateCamera();
    }

    /** Shared stem-specific effects (fog, animated background, terrain audio reactivity) */
    _updateStemEffects(dt, bass, mid, treble, energy) {
      const stemFx = this.stemEffects || {};
      const vocalFog = stemFx.vocalFog || 0;
      const synthPulse = stemFx.synthPulse || 0;
      const drumEnergy = stemFx.drumEnergy || 0;
      const bassDeform = stemFx.bassDeform || 0;

      if (this.scene.fog) {
        const fogMult = this.visual?.fogDensity ?? 1.0;
        // Vocals increase fog density (bring it closer)
        const vocalFogEffect = vocalFog * 30;
        this.scene.fog.near = this.theme.fogNear - energy * 10 * fogMult - vocalFogEffect;
        this.scene.fog.far = this.theme.fogFar - energy * 50 * fogMult - vocalFogEffect * 2;
      }

      // Update animated background with full audio data for reactive effects
      if (this.animatedBackground) {
        this.animatedBackground.update(dt, {
          energy: energy,
          bass: bass,
          mid: mid,
          treble: treble,
          drumEnergy: drumEnergy,
          bassDeform: bassDeform,
          synthPulse: synthPulse,
          vocalEnergy: vocalFog
        });
      }

      // Update terrain with audio reactivity (stem effects)
      if (this.terrainManager) {
        if (!this._lastTerrainLog || this.time - this._lastTerrainLog > 1) {
          if (bassDeform > 0.01 || drumEnergy > 0.01) {
            console.log("[Terrain Audio] bass:", bassDeform.toFixed(2), "drums:", drumEnergy.toFixed(2));
          }
          this._lastTerrainLog = this.time;
        }
        this.terrainManager.update({
          bassDeform: bassDeform,
          drumImpact: drumEnergy,
          playerZ: this.distance
        }, this.time);
      }
    }

    updateTerrain() {
      if (!this.terrainManager) return;
      this.terrainManager.updateChunks(this.lateralPos, this.distance);
    }

    updateTerrainCollision() {
      if (!this.terrainManager) return;

      const terrainHeight = this.terrainManager.getTerrainHeightAt(this.lateralPos, this.distance);
      if (terrainHeight === null) return;

      const clearance = terrainHeight + (this.theme.visualStyle?.terrain?.collisionMargin || 1.5);

      // Soft push: gently push player above terrain
      if (this.altitude < clearance) {
        const pushStrength = 0.3;
        this.altitude += (clearance - this.altitude) * pushStrength;
        // Ensure we don't go below terrain
        this.altitude = Math.max(this.altitude, clearance);
      }
    }

    updateCollisions(dt) {
      if (this.hitCooldown > 0) {
        this.hitCooldown -= dt;
        return;
      }

      const playerX = this.lateralPos;
      const playerZ = this.distance;
      // Use model-specific collision radius and ellipsoid scale
      const playerRadius = this.playerCollisionRadius || 1.5;
      const scaleX = this.playerCollisionScale?.x || 1;
      const scaleZ = this.playerCollisionScale?.z || 1;

      for (const chunk of this.chunks) {
        if (!chunk.objects) continue; // InstancedMesh chunks have no objects array
        for (const obj of chunk.objects) {
          if (!obj.userData.isObstacle) continue;

          const dx = playerX - obj.position.x;
          const dz = playerZ - obj.position.z;
          const objRadius = obj.userData.collisionRadius || 2;

          // Ellipsoid collision: normalize distances by ellipsoid radii
          const radiusX = playerRadius * scaleX;
          const radiusZ = playerRadius * scaleZ;
          const normalizedDist = Math.sqrt(
            (dx / (radiusX + objRadius)) ** 2 +
            (dz / (radiusZ + objRadius)) ** 2
          );

          if (normalizedDist < 1) {
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
      // Rhythm bonuses:
      //   Sync: up to +0.5x when APM matches a BPM harmonic (0.25x–4x)
      //   Beat: up to +0.25x when tapping at a steady rhythm (any tempo)
      const sync = typeof window.getRhythmSync === 'function' ? window.getRhythmSync() : 0;
      const beat = typeof window.getRhythmRegularity === 'function' ? window.getRhythmRegularity() : 0;
      const rhythmMultiplier = 1 + sync * 0.5 + beat * 0.25;
      // Accumulate score based on speed, combo, and rhythm
      const pointsPerSecond = 10 * this.combo * (this.speed / CONFIG.baseSpeed) * rhythmMultiplier;
      this.score += pointsPerSecond * dt;

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
      if (this._sceneOnly) return;
      while (this.nextChunkZ < this.distance + CONFIG.chunkSize * CONFIG.chunksAhead) {
        this.generateChunk();
      }
      while (this.chunks.length > 0 &&
             this.chunks[0].z < this.distance - CONFIG.chunkSize * CONFIG.chunksBehind) {
        const old = this.chunks.shift();
        this._freeChunkInstances(old.key);
      }
    }

    updateScenery(bass, mid, energy) {
      if (this.theme.pulseWithBeat === false) {
        bass = 0;
        mid = 0;
      }

      // Reuse cached temp objects to avoid per-frame GC pressure
      if (!this._sceneryTmp) {
        this._sceneryTmp = {
          pos: new this.THREE.Vector3(),
          quat: new this.THREE.Quaternion(),
          scale: new this.THREE.Vector3(),
          euler: new this.THREE.Euler(),
          mat: new this.THREE.Matrix4(),
        };
      }
      const { pos: _pos, quat: _quat, scale: _scale, euler: _euler, mat: _mat } = this._sceneryTmp;

      for (const pool of Object.values(this.instancePools)) {
        let dirty = false;
        for (let i = 0; i < pool.mesh.count; i++) {
          const phaseData = pool.phases[i];
          if (!phaseData || !phaseData.baseMatrix) continue;

          if (phaseData.swayPhase !== undefined && mid > 0.01) {
            const sway = mid * 0.1 * Math.sin(this.time * 3 + phaseData.swayPhase);
            // Decompose base, apply sway rotation on Z
            phaseData.baseMatrix.decompose(_pos, _quat, _scale);
            _euler.setFromQuaternion(_quat);
            _euler.z += sway;
            _quat.setFromEuler(_euler);
            _mat.compose(_pos, _quat, _scale);
            pool.mesh.setMatrixAt(i, _mat);
            dirty = true;
          } else if (phaseData.pulsePhase !== undefined && bass > 0.01) {
            const pulse = 1 + bass * 0.2 * Math.sin(this.time * 2 + phaseData.pulsePhase);
            phaseData.baseMatrix.decompose(_pos, _quat, _scale);
            const bs = phaseData.baseScale;
            _scale.set(bs.x * pulse, bs.y * pulse, bs.z * pulse);
            _mat.compose(_pos, _quat, _scale);
            pool.mesh.setMatrixAt(i, _mat);
            dirty = true;
          }
        }
        if (dirty) {
          pool.mesh.instanceMatrix.needsUpdate = true;
        }
      }
    }

    updateParticles(dt, energy, bass) {
      if (!this.particles) return;

      if (this.particles.userData.gpuCompute && this.particleCompute && this.renderer) {
        // GPU compute path
        const pu = this.particleComputeUniforms;
        pu.uEnergy.value = energy;
        pu.uBass.value = bass;
        pu.uDeltaTime.value = dt;
        pu.uPlayerX.value = this.lateralPos;
        pu.uPlayerY.value = this.altitude;
        pu.uPlayerZ.value = this.distance;
        pu.uSpeed.value = this.speed;

        this.renderer.computeAsync(this.particleCompute);

        if (this._particleOpacityUniform) {
          this._particleOpacityUniform.value = 0.3 + energy * 0.5;
        }
      } else {
        // CPU fallback path
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
    }

    updateSpeedLines(dt, energy) {
      if (!this.speedLines) return;

      const positions = this.speedLines.geometry.attributes.position.array;
      const velocities = this.speedLines.userData.velocities;
      const intensity = this.visual?.speedLines ?? 1.0;

      // Only show speed lines at high speed
      const speedRatio = (this.speed - CONFIG.speedLinesMinSpeed) / (CONFIG.maxSpeed - CONFIG.speedLinesMinSpeed);
      const opacity = Math.max(0, Math.min(0.8, speedRatio * (0.3 + energy * 0.5) * intensity));
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

      const glowIntensity = this.theme.glowIntensity || 0.5;
      const ambientIntensity = this.theme.ambientIntensity || 0.4;
      const baseDirectionalIntensity = 1.0 + glowIntensity * 0.4;

      if (this.theme.pulseWithBeat === false) {
        if (this.ambientLight) {
          this.ambientLight.intensity = ambientIntensity;
        }
        if (this.directionalLight) {
          this.directionalLight.intensity = baseDirectionalIntensity;
        }
        return;
      }

      this.pulsePhase += dt * 2;
      const pulse = 1 + Math.sin(this.pulsePhase) * CONFIG.pulseIntensity * bass;

      if (this.ambientLight) {
        this.ambientLight.intensity = 0.4 * pulse;
      }
      if (this.directionalLight) {
        this.directionalLight.intensity = 1.2 * (1 + energy * 0.3);
      }

      // Color shift based on speed/combo
      if (this.visual?.colorShift && this.combo > 1) {
        this.colorShiftHue += dt * CONFIG.colorShiftSpeed * (this.combo / CONFIG.maxCombo);
        if (this.colorShiftHue > 1) this.colorShiftHue -= 1;
      }
    }

    // === FREE-ROTATION BIRD FLIGHT (fly-by style) ===

    updateFreeRotation(dt) {
      const player = this.player;
      if (!player) return;
      const neck = this.charNeck;
      const body = this.charBody;

      // Always move forward in facing direction
      player.translateZ(this.isDoubleSpeed ? CONFIG.doubleSpeed : CONFIG.forwardSpeed);

      // --- Up arrow: ascend (slower — climbing is harder) ---
      if (this._upDown) {
        if (player.position.y < CONFIG.freeRotMaxY) {
          player.position.y += this.charPosYIncrement * 0.5;
          if (this.charPosYIncrement < CONFIG.charPosYMax) this.charPosYIncrement += CONFIG.charPosYAccel * 0.5;
          if (neck && neck.rotation.x > -CONFIG.neckXMax) neck.rotation.x -= CONFIG.neckXStep * 0.5;
          if (body && body.rotation.x > -CONFIG.bodyXMax) body.rotation.x -= CONFIG.bodyXStep * 0.5;
        } else {
          // At ceiling — revert pitch bones
          if ((neck && neck.rotation.x < 0) || (body && body.rotation.x < 0)) {
            player.position.y += this.charPosYIncrement * 0.5;
            if (neck) neck.rotation.x += CONFIG.neckXStep * 0.5;
            if (body) body.rotation.x += CONFIG.bodyXStep * 0.5;
          }
        }
      }

      // --- Down arrow: descend with acceleration + pitch bones ---
      if (this._downDown) {
        if (player.position.y > CONFIG.freeRotMinY) {
          player.position.y -= this.charPosYIncrement;
          if (this.charPosYIncrement < CONFIG.charPosYMax) this.charPosYIncrement += CONFIG.charPosYAccel;
          if (neck && neck.rotation.x < CONFIG.neckXMax) neck.rotation.x += CONFIG.neckXStep;
          if (body && body.rotation.x < CONFIG.bodyXMax) body.rotation.x += CONFIG.bodyXStep;
        } else {
          // At floor — revert pitch bones
          if ((neck && neck.rotation.x > 0) || (body && body.rotation.x > 0)) {
            player.position.y -= this.charPosYIncrement;
            if (neck) neck.rotation.x -= CONFIG.neckXStep;
            if (body) body.rotation.x -= CONFIG.bodyXStep;
          }
        }
      }

      // --- Left arrow: yaw left with acceleration + yaw bones ---
      if (this._leftDown) {
        player.rotateY(this.charRotateYIncrement);
        const yMax = this.isDoubleSpeed ? CONFIG.charRotateYMax * 2 : CONFIG.charRotateYMax;
        if (this.charRotateYIncrement < yMax) this.charRotateYIncrement += CONFIG.charRotateYAccel;
        if (neck && neck.rotation.y > -CONFIG.neckYMax) neck.rotation.y -= CONFIG.neckYStep;
        if (body && body.rotation.y < CONFIG.bodyYMax) body.rotation.y += CONFIG.bodyYStep;
      }

      // --- Right arrow: yaw right with acceleration + yaw bones ---
      if (this._rightDown) {
        player.rotateY(-this.charRotateYIncrement);
        const yMax = this.isDoubleSpeed ? CONFIG.charRotateYMax * 2 : CONFIG.charRotateYMax;
        if (this.charRotateYIncrement < yMax) this.charRotateYIncrement += CONFIG.charRotateYAccel;
        if (neck && neck.rotation.y < CONFIG.neckYMax) neck.rotation.y += CONFIG.neckYStep;
        if (body && body.rotation.y > -CONFIG.bodyYMax) body.rotation.y -= CONFIG.bodyYStep;
      }

      // --- Revert altitude (neither up nor down pressed, or both) ---
      if ((!this._upDown && !this._downDown) || (this._upDown && this._downDown)) {
        if (this.charPosYIncrement > 0) this.charPosYIncrement -= CONFIG.charPosYAccel;
        // Reverting from going up
        if ((neck && neck.rotation.x < 0) || (body && body.rotation.x < 0)) {
          player.position.y += this.charPosYIncrement;
          if (neck) neck.rotation.x += CONFIG.neckXStep;
          if (body) body.rotation.x += CONFIG.bodyXStep;
        }
        // Reverting from going down
        if ((neck && neck.rotation.x > 0) || (body && body.rotation.x > 0)) {
          player.position.y -= this.charPosYIncrement;
          if (neck) neck.rotation.x -= CONFIG.neckXStep;
          if (body) body.rotation.x -= CONFIG.bodyXStep;
        }
      }

      // --- Revert yaw (neither left nor right pressed, or both) ---
      if ((!this._leftDown && !this._rightDown) || (this._leftDown && this._rightDown)) {
        if (this.charRotateYIncrement > 0) this.charRotateYIncrement -= CONFIG.charRotateYAccel;
        // Reverting from going left
        if ((neck && neck.rotation.y < 0) || (body && body.rotation.y > 0)) {
          player.rotateY(this.charRotateYIncrement);
          if (neck) neck.rotation.y += CONFIG.neckYStep;
          if (body) body.rotation.y -= CONFIG.bodyYStep;
        }
        // Reverting from going right
        if ((neck && neck.rotation.y > 0) || (body && body.rotation.y < 0)) {
          player.rotateY(-this.charRotateYIncrement);
          if (neck) neck.rotation.y -= CONFIG.neckYStep;
          if (body) body.rotation.y += CONFIG.bodyYStep;
        }
      }

      // Legacy compatibility values for particles, lighting, etc.
      this.speed = this.isDoubleSpeed ? CONFIG.doubleSpeed : CONFIG.forwardSpeed;
      this.distance = player.position.z;
      this.lateralPos = player.position.x;
      this.altitude = player.position.y;
    }

    updateFreeRotationCamera() {
      const player = this.player;
      const camera = this.camera;
      if (!player || !camera) return;
      const THREE = this.THREE;

      // Ideal position: behind/above player, rotated by player's quaternion
      const idealPos = new THREE.Vector3(0, CONFIG.freeRotCamY, CONFIG.freeRotCamZ)
        .applyQuaternion(player.quaternion)
        .add(player.position);

      // Adjust lookAt Z based on altitude (fly-by: pulls in at high altitude)
      if (!this._leftDown && !this._rightDown && !this._upDown && !this._downDown) {
        if (player.position.y > 30 && this._lookAtPosZ > 5) this._lookAtPosZ -= 0.2;
        if (player.position.y <= 30 && this._lookAtPosZ < CONFIG.freeRotLookAtZ) this._lookAtPosZ += 0.2;
      }

      // Ideal look target: ahead of player (fly-by: (0, -1.2, lookAtPosZ))
      const idealTarget = new THREE.Vector3(0, -1.2, this._lookAtPosZ)
        .applyQuaternion(player.quaternion)
        .add(player.position);

      // Snap camera on first frame, then lerp
      if (!this.idealCameraTarget) {
        this.idealCameraTarget = idealTarget.clone();
        this._currentCamPos = idealPos.clone();
        camera.position.copy(idealPos);
        camera.lookAt(this.idealCameraTarget);
        return;
      }

      // fly-by: currentPos.copy(ideal), then camera.position.lerp(currentPos, 0.14)
      // Position is lerped, lookAt snaps to ideal each frame
      this._currentCamPos.copy(idealPos);
      this.idealCameraTarget.copy(idealTarget);
      camera.position.lerp(this._currentCamPos, CONFIG.freeRotCameraLerp);
      camera.lookAt(this.idealCameraTarget);
    }

    updateBirdBones() {
      // Bone animation is now integrated into updateFreeRotation()
      // (direct per-frame increments matching fly-by, not lerp)
    }

    updateSceneryChunks2D() {
      if (this._sceneOnly) return;
      const player = this.player;
      if (!player) return;

      const chunkSize = CONFIG.chunkSize;
      const range = 2; // ±2 chunks around player
      const playerChunkX = Math.floor(player.position.x / chunkSize);
      const playerChunkZ = Math.floor(player.position.z / chunkSize);

      const neededKeys = new Set();

      for (let dx = -range; dx <= range; dx++) {
        for (let dz = -range; dz <= range; dz++) {
          const cx = playerChunkX + dx;
          const cz = playerChunkZ + dz;
          const key = `${cx},${cz}`;
          neededKeys.add(key);

          if (!this.sceneryChunks.has(key)) {
            this._generateChunkInstanced(key, cx * chunkSize, cz * chunkSize, chunkSize);
            this.sceneryChunks.set(key, true);
          }
        }
      }

      // Remove chunks outside range
      for (const [key] of this.sceneryChunks) {
        if (!neededKeys.has(key)) {
          this._freeChunkInstances(key);
          this.sceneryChunks.delete(key);
        }
      }
    }

    triggerScreenShake() {
      if (!this.visual?.screenShake) return;
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
      this.updateCameraShake(0.016);

      // Direct camera follow - no lag, instant response
      const camX = this.lateralPos + this.cameraShake.x;
      const camY = this.altitude + CONFIG.cameraHeight + Math.sin(this.time * 2) * 0.2 + this.cameraShake.y;
      const camZ = this.distance - CONFIG.cameraDistance;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.lateralPos, this.altitude + 1.8, this.distance + CONFIG.cameraLookAhead);
    }

    renderBackground() {
      if (this.animatedBackground && this.renderer) {
        this.animatedBackground.render(this.renderer);
      }
    }

    dispose() {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      if (this._onBlur) window.removeEventListener('blur', this._onBlur);

      // InstancedMesh scenery cleanup
      this.disposeInstancePools();
      this.chunks = [];
      this.sceneryChunks.clear();

      // Terrain cleanup
      if (this.terrainManager) {
        this.terrainManager.dispose();
        this.terrainManager = null;
      }

      [this.sky, this.groundPlane, this.player, this.particles, this.speedLines].forEach(obj => {
        if (obj) {
          this.scene.remove(obj);
          obj.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        }
      });

      // Dispose animated background
      if (this.animatedBackground) {
        this.animatedBackground.dispose();
        this.animatedBackground = null;
      }

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

      // Collision radius debug mesh cleanup
      if (this.collisionRadiusMesh) {
        this.scene.remove(this.collisionRadiusMesh);
        if (this.collisionRadiusMesh.geometry) this.collisionRadiusMesh.geometry.dispose();
        if (this.collisionRadiusMesh.material) this.collisionRadiusMesh.material.dispose();
        this.collisionRadiusMesh = null;
      }

      this.scene.fog = null;
      this.initialized = false;
    }
  }

  // Export
  window.ThemedEnvironment = ThemedEnvironment;
  // Export environment theme getter (themes are now derived from TRACK_THEMES)
  window.getEnvironmentTheme = getEnvironmentTheme;
  window.DEFAULT_ENV = DEFAULT_ENV;

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
          // Pass per-stem visualization data if available
          if (audioData.stemVizData) {
            this.instance.setStemVizData(audioData.stemVizData);
          }
        }
        this.instance.update(dt);
      }
    },

    changeTrack(trackTitle) {
      if (this.currentTrack !== trackTitle && this.instance) {
        console.log("Environment: changing track to", trackTitle);
        this.instance.resetForTrack(trackTitle);
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

    setFlightConfig(key, value) {
      if (this.instance) {
        this.instance.setFlightConfig(key, value);
      }
    },

    dispose() {
      if (this.instance) {
        this.instance.dispose();
        this.instance = null;
      }
    },

    renderBackground() {
      if (this.instance) {
        this.instance.renderBackground();
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

    setGateHitCallback(callback) {
      if (this.instance) {
        this.instance.onGateHit = callback;
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
