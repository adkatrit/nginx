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
      fogNear: 20,
      fogFar: 300,
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
      fogNear: 40,
      fogFar: 350,
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
      fogNear: 15,
      fogFar: 200,
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
      fogNear: 25,
      fogFar: 250,
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
      fogNear: 30,
      fogFar: 400,
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
      fogNear: 40,
      fogFar: 400,
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
      fogNear: 35,
      fogFar: 300,
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
      fogNear: 20,
      fogFar: 200,
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
      fogNear: 25,
      fogFar: 280,
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
      fogNear: 20,
      fogFar: 250,
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
    fogNear: 30,
    fogFar: 400,
    scenery: ["rocks", "cacti"],
    particleColor: 0xd4a574,
    particleType: "dust"
  };

  const CONFIG = {
    // Movement
    baseSpeed: 2.0,
    maxSpeed: 4.0,
    boostSpeed: 6.0,
    boostDuration: 2.5,

    // Terrain
    chunkSize: 100,
    chunksAhead: 4,
    chunksBehind: 1,
    viewDistance: 400,

    // Camera
    cameraHeight: 4,
    cameraDistance: 12,
    cameraLookAhead: 20,
    cameraShakeIntensity: 0.5,
    cameraShakeDuration: 0.3,

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
    hitCooldownTime: 1.0
  };

  class ThemedEnvironment {
    constructor(THREE, scene, camera, renderer) {
      this.THREE = THREE;
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;

      this.theme = { ...DEFAULT_ENV };
      this.distance = 0;
      this.lateralPos = 0;
      this.speed = CONFIG.baseSpeed;
      this.steerInput = 0;
      this.boosting = false;
      this.boostTimer = 0;

      this.chunks = [];
      this.nextChunkZ = 0;

      this.sky = null;
      this.sun = null;
      this.particles = null;
      this.groundPlane = null;
      this.player = null;
      this.leftGlow = null;
      this.rightGlow = null;

      this.audioData = { bass: 0, mid: 0, treble: 0, energy: 0 };
      this.time = 0;
      this.initialized = false;

      // Scoring system
      this.score = 0;
      this.combo = 1;
      this.comboTimer = 0;
      this.lastHitTime = 0;
      this.hitCooldown = 0;
      this.trackTitle = null;
      this.onScoreChange = null;  // Callback for score updates
      this.onHit = null;  // Callback for collision

      // Visual effects
      this.speedLines = null;
      this.trail = [];
      this.cameraShake = { x: 0, y: 0, timer: 0 };
      this.colorShiftHue = 0;
      this.pulsePhase = 0;
      this.ambientLight = null;
      this.directionalLight = null;
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

      this.scene.fog = new THREE.Fog(this.theme.fogColor, this.theme.fogNear, this.theme.fogFar);

      this.createSky();
      this.createGroundPlane();
      this.createPlayer();
      this.createParticles();
      this.createLighting();
      this.createSpeedLines();
      this.createTrail();
      this.setupInput();

      for (let i = 0; i < CONFIG.chunksAhead + CONFIG.chunksBehind; i++) {
        this.generateChunk();
      }

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

    createPlayer() {
      const THREE = this.THREE;
      this.player = new THREE.Group();

      // Speeder body - color based on theme
      const accentColor = this.theme.particleColor;

      const bodyGeom = new THREE.BoxGeometry(1.2, 0.4, 3);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.7,
        roughness: 0.3
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.5;
      this.player.add(body);

      // Accent stripe
      const stripeGeom = new THREE.BoxGeometry(1.25, 0.1, 3.05);
      const stripeMat = new THREE.MeshBasicMaterial({ color: accentColor });
      const stripe = new THREE.Mesh(stripeGeom, stripeMat);
      stripe.position.y = 0.55;
      this.player.add(stripe);

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
      this.player.add(cockpit);

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
      this.player.add(leftPod);

      const rightPod = new THREE.Mesh(podGeom, podMat);
      rightPod.rotation.x = Math.PI / 2;
      rightPod.position.set(0.8, 0.4, -0.8);
      this.player.add(rightPod);

      // Engine glow with theme color
      const glowGeom = new THREE.SphereGeometry(0.25, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: accentColor,
        transparent: true,
        opacity: 0.8
      });

      this.leftGlow = new THREE.Mesh(glowGeom, glowMat.clone());
      this.leftGlow.position.set(-0.8, 0.4, -1.6);
      this.player.add(this.leftGlow);

      this.rightGlow = new THREE.Mesh(glowGeom, glowMat.clone());
      this.rightGlow.position.set(0.8, 0.4, -1.6);
      this.player.add(this.rightGlow);

      this.player.position.set(0, 0.8, 0);
      this.scene.add(this.player);
    }

    createParticles() {
      const THREE = this.THREE;
      const particleCount = 800;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = [];

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = Math.random() * 20;
        positions[i * 3 + 2] = Math.random() * 200;
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
        const x = (Math.random() - 0.5) * 60;
        const y = Math.random() * 15 + 2;
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
          // Set collision radius based on object type (default 2)
          if (!obj.userData.collisionRadius) {
            obj.userData.collisionRadius = 2;
          }
          obj.userData.isObstacle = true;
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

      // Trunk
      const trunkHeight = 3 + Math.random() * 2;
      const trunkGeom = new THREE.CylinderGeometry(0.2, 0.4, trunkHeight, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = trunkHeight / 2;
      group.add(trunk);

      // Flat canopy (acacia style)
      const canopyGeom = new THREE.CylinderGeometry(2, 2.5, 0.8, 8);
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0x556b2f });
      const canopy = new THREE.Mesh(canopyGeom, canopyMat);
      canopy.position.y = trunkHeight + 0.4;
      group.add(canopy);

      group.userData.swayPhase = Math.random() * Math.PI * 2;
      return group;
    }

    createCherryTree() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      // Trunk
      const trunkGeom = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 1.5;
      group.add(trunk);

      // Pink blossoms
      const blossomGeom = new THREE.SphereGeometry(1.5, 8, 8);
      const blossomMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1 });
      const blossom = new THREE.Mesh(blossomGeom, blossomMat);
      blossom.position.y = 3.5;
      group.add(blossom);

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
      this._onKeyDown = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.steerInput = 1;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.steerInput = -1;
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          // Activate boost if not already boosting
          if (!this.boosting) {
            this.boosting = true;
            this.boostTimer = CONFIG.boostDuration;
          }
        }
      };
      this._onKeyUp = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA' ||
            e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.steerInput = 0;
        }
      };
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
    }

    setAudioData(bass, mid, treble, energy) {
      this.audioData.bass = bass;
      this.audioData.mid = mid;
      this.audioData.treble = treble;
      this.audioData.energy = energy;
    }

    update(dt) {
      if (!this.initialized) return;

      this.time += dt;
      const { bass, mid, treble, energy } = this.audioData;

      // Handle boost timer
      if (this.boosting) {
        this.boostTimer -= dt;
        if (this.boostTimer <= 0) {
          this.boosting = false;
          this.boostTimer = 0;
        }
      }

      // Speed - boost overrides normal speed
      let targetSpeed;
      if (this.boosting) {
        targetSpeed = CONFIG.boostSpeed;
      } else {
        targetSpeed = CONFIG.baseSpeed + (CONFIG.maxSpeed - CONFIG.baseSpeed) * energy;
      }
      this.speed += (targetSpeed - this.speed) * 0.15;
      this.distance += this.speed * dt * 60;

      // Steering
      const steerSpeed = 0.4 * this.speed;
      this.lateralPos += this.steerInput * steerSpeed * dt * 60;
      this.lateralPos = Math.max(-40, Math.min(40, this.lateralPos));

      // Update positions
      if (this.groundPlane) {
        this.groundPlane.position.z = this.distance;
        this.groundPlane.position.x = this.lateralPos;
      }
      if (this.sky) {
        this.sky.position.z = this.distance;
        this.sky.position.x = this.lateralPos;
      }

      // Player
      if (this.player) {
        this.player.position.x = this.lateralPos;
        this.player.position.z = this.distance;
        this.player.position.y = 0.8 + Math.sin(this.time * 4) * 0.1;
        const targetRoll = -this.steerInput * 0.3;
        this.player.rotation.z += (targetRoll - this.player.rotation.z) * 0.1;

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

      this.updateChunks();
      this.updateScenery(bass, mid, energy);
      this.updateParticles(dt, energy, bass);
      this.updateSpeedLines(dt, energy);
      this.updateLighting(dt, bass, energy);
      this.updateCollisions(dt);
      this.updateScore(dt);

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
      const playerRadius = 1.5;  // Player collision radius

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
      this.comboTimer += dt;
      if (this.comboTimer >= 5) {  // Every 5 seconds without hit
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
          positions[i * 3 + 1] = Math.random() * 20;
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
          const y = Math.random() * 15 + 2;
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
      const camY = CONFIG.cameraHeight + Math.sin(this.time * 2) * 0.2 + this.cameraShake.y;
      const camZ = this.distance - CONFIG.cameraDistance;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.lateralPos, 2, this.distance + CONFIG.cameraLookAhead);
    }

    dispose() {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);

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

      this.scene.fog = null;
      this.initialized = false;
    }
  }

  // Export
  window.ThemedEnvironment = ThemedEnvironment;
  window.ENVIRONMENT_THEMES = ENVIRONMENT_THEMES;

  window.EnvironmentMode = {
    instance: null,
    currentTrack: null,

    init(THREE, scene, camera, renderer, trackTitle) {
      if (this.instance) {
        this.instance.dispose();
      }
      this.currentTrack = trackTitle;
      this.instance = new ThemedEnvironment(THREE, scene, camera, renderer);
      this.instance.init(trackTitle);
      return this.instance;
    },

    update(dt, audioData) {
      if (this.instance) {
        if (audioData) {
          this.instance.setAudioData(
            audioData.bass || 0,
            audioData.mid || 0,
            audioData.treble || 0,
            audioData.energy || 0
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
