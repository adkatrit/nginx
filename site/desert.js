/**
 * Desert Runner - Audio-reactive procedural desert experience
 * Fast movement through an endless procedurally generated desert
 */

(function() {
  'use strict';

  const DESERT = {
    // Movement - similar to racer speeds
    baseSpeed: 2.0,
    maxSpeed: 4.0,

    // Terrain
    chunkSize: 100,        // Size of each terrain chunk
    chunksAhead: 4,        // Chunks to generate ahead
    chunksBehind: 1,       // Chunks to keep behind

    // Scenery density per chunk (no dunes for flat desert)
    dunesPerChunk: 0,
    rocksPerChunk: 12,
    cactiPerChunk: 8,

    // Visual settings
    viewDistance: 400,
    cameraHeight: 4,
    cameraDistance: 12,
    cameraLookAhead: 20,

    // Colors
    sandLight: 0xe8c9a0,
    sandMid: 0xd4a574,
    sandDark: 0xc4956a,
    rockColor: 0x8b7355,
    cactusColor: 0x2d5a27,
    skyTop: 0x4a90c2,
    skyHorizon: 0xffecd2,
    sunColor: 0xffd93d
  };

  class DesertRunner {
    constructor(THREE, scene, camera, renderer) {
      this.THREE = THREE;
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;

      // Position along the desert
      this.distance = 0;
      this.lateralPos = 0;  // Left/right position
      this.speed = DESERT.baseSpeed;

      // Input
      this.steerInput = 0;

      // Terrain chunks
      this.chunks = [];
      this.nextChunkZ = 0;

      // Scene elements
      this.sky = null;
      this.sun = null;
      this.dustParticles = null;
      this.groundPlane = null;
      this.player = null;  // Visible player character

      // Audio data
      this.audioData = { bass: 0, mid: 0, treble: 0, energy: 0 };

      this.time = 0;
      this.initialized = false;
    }

    init() {
      const THREE = this.THREE;

      // Desert fog
      this.scene.fog = new THREE.Fog(0xffecd2, 30, DESERT.viewDistance);

      this.createSky();
      this.createSun();
      this.createGroundPlane();
      this.createPlayer();
      this.createDustParticles();
      this.createLighting();
      this.setupInput();

      // Generate initial terrain chunks
      for (let i = 0; i < DESERT.chunksAhead + DESERT.chunksBehind; i++) {
        this.generateChunk();
      }

      this.updateCamera();
      this.initialized = true;
      console.log("Desert runner initialized");
    }

    createSky() {
      const THREE = this.THREE;

      const skyGeom = new THREE.SphereGeometry(DESERT.viewDistance * 0.95, 32, 32);
      const skyMat = new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(DESERT.skyTop) },
          bottomColor: { value: new THREE.Color(DESERT.skyHorizon) },
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

    createSun() {
      const THREE = this.THREE;

      const sunGeom = new THREE.SphereGeometry(20, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({
        color: DESERT.sunColor,
        transparent: true,
        opacity: 0.95
      });
      this.sun = new THREE.Mesh(sunGeom, sunMat);
      this.sun.position.set(150, 100, 200);
      this.scene.add(this.sun);

      // Glow
      const glowGeom = new THREE.SphereGeometry(35, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffffdd,
        transparent: true,
        opacity: 0.25
      });
      const glow = new THREE.Mesh(glowGeom, glowMat);
      this.sun.add(glow);
    }

    createGroundPlane() {
      const THREE = this.THREE;

      // Large flat plane that moves with player
      const planeSize = DESERT.viewDistance * 2;
      const planeGeom = new THREE.PlaneGeometry(planeSize, planeSize, 32, 32);

      const planeMat = new THREE.MeshStandardMaterial({
        color: DESERT.sandMid,
        roughness: 0.95,
        metalness: 0
      });

      this.groundPlane = new THREE.Mesh(planeGeom, planeMat);
      this.groundPlane.rotation.x = -Math.PI / 2;
      this.groundPlane.receiveShadow = true;
      this.scene.add(this.groundPlane);
    }

    createPlayer() {
      const THREE = this.THREE;

      // Create a sleek desert speeder/hoverbike
      this.player = new THREE.Group();

      // Main body - elongated shape
      const bodyGeom = new THREE.BoxGeometry(1.2, 0.4, 3);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xcc8844,
        metalness: 0.6,
        roughness: 0.3
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.5;
      this.player.add(body);

      // Cockpit
      const cockpitGeom = new THREE.SphereGeometry(0.5, 16, 16);
      cockpitGeom.scale(0.8, 0.6, 1.2);
      const cockpitMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
      });
      const cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
      cockpit.position.set(0, 0.7, 0.3);
      this.player.add(cockpit);

      // Engine pods (left and right)
      const podGeom = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
      const podMat = new THREE.MeshStandardMaterial({
        color: 0x884422,
        metalness: 0.5,
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

      // Engine glow
      const glowGeom = new THREE.SphereGeometry(0.25, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
      });

      this.leftGlow = new THREE.Mesh(glowGeom, glowMat.clone());
      this.leftGlow.position.set(-0.8, 0.4, -1.6);
      this.player.add(this.leftGlow);

      this.rightGlow = new THREE.Mesh(glowGeom, glowMat.clone());
      this.rightGlow.position.set(0.8, 0.4, -1.6);
      this.player.add(this.rightGlow);

      // Initial position
      this.player.position.set(0, 0.8, 0);
      this.scene.add(this.player);
    }

    createDustParticles() {
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
          y: (Math.random() - 0.5) * 0.05,
          z: -0.5 - Math.random() * 0.5  // Moving backward relative to player
        });
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0xd4a574,
        size: 0.4,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });

      this.dustParticles = new THREE.Points(geometry, material);
      this.dustParticles.userData.velocities = velocities;
      this.scene.add(this.dustParticles);
    }

    createLighting() {
      const THREE = this.THREE;

      // Warm directional sun
      const sunLight = new THREE.DirectionalLight(0xfff0d0, 1.5);
      sunLight.position.set(150, 100, 200);
      this.scene.add(sunLight);

      // Ambient
      const ambient = new THREE.AmbientLight(0xffecd2, 0.6);
      this.scene.add(ambient);

      // Hemisphere
      const hemi = new THREE.HemisphereLight(DESERT.skyTop, DESERT.sandDark, 0.4);
      this.scene.add(hemi);
    }

    generateChunk() {
      const THREE = this.THREE;
      const chunkZ = this.nextChunkZ;

      const chunk = {
        z: chunkZ,
        objects: []
      };

      // Generate dunes
      for (let i = 0; i < DESERT.dunesPerChunk; i++) {
        const dune = this.createDune();
        dune.position.set(
          (Math.random() - 0.5) * 80,
          0,
          chunkZ + Math.random() * DESERT.chunkSize
        );
        dune.rotation.y = Math.random() * Math.PI;
        this.scene.add(dune);
        chunk.objects.push(dune);
      }

      // Generate rocks
      for (let i = 0; i < DESERT.rocksPerChunk; i++) {
        const rock = this.createRock();
        rock.position.set(
          (Math.random() - 0.5) * 100,
          0,
          chunkZ + Math.random() * DESERT.chunkSize
        );
        this.scene.add(rock);
        chunk.objects.push(rock);
      }

      // Generate cacti
      for (let i = 0; i < DESERT.cactiPerChunk; i++) {
        const cactus = this.createCactus();
        cactus.position.set(
          (Math.random() - 0.5) * 90,
          0,
          chunkZ + Math.random() * DESERT.chunkSize
        );
        this.scene.add(cactus);
        chunk.objects.push(cactus);
      }

      this.chunks.push(chunk);
      this.nextChunkZ += DESERT.chunkSize;
    }

    createDune() {
      const THREE = this.THREE;

      const width = 20 + Math.random() * 40;
      const height = 4 + Math.random() * 12;
      const depth = 15 + Math.random() * 25;

      const geom = new THREE.SphereGeometry(1, 12, 8);
      geom.scale(width, height, depth);

      // Flatten bottom
      const positions = geom.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        if (positions[i + 1] < 0) {
          positions[i + 1] *= 0.3;
        }
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: DESERT.sandLight,
        roughness: 0.95,
        metalness: 0
      });

      const dune = new THREE.Mesh(geom, mat);
      dune.position.y = height * 0.2;
      dune.userData.pulsePhase = Math.random() * Math.PI * 2;
      dune.userData.baseY = dune.position.y;
      return dune;
    }

    createRock() {
      const THREE = this.THREE;

      const size = 0.5 + Math.random() * 3;
      const geom = new THREE.DodecahedronGeometry(size, 0);

      // Distort for organic look
      const positions = geom.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] *= 0.7 + Math.random() * 0.6;
        positions[i + 1] *= 0.6 + Math.random() * 0.4;
        positions[i + 2] *= 0.7 + Math.random() * 0.6;
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: DESERT.rockColor,
        roughness: 0.85,
        metalness: 0.1,
        flatShading: true
      });

      const rock = new THREE.Mesh(geom, mat);
      rock.position.y = size * 0.4;
      rock.rotation.set(Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4);
      return rock;
    }

    createCactus() {
      const THREE = this.THREE;
      const group = new THREE.Group();

      const height = 3 + Math.random() * 5;
      const mat = new THREE.MeshStandardMaterial({
        color: DESERT.cactusColor,
        roughness: 0.7,
        metalness: 0.1
      });

      // Main stem
      const stemGeom = new THREE.CylinderGeometry(0.4, 0.5, height, 8);
      const stem = new THREE.Mesh(stemGeom, mat);
      stem.position.y = height / 2;
      group.add(stem);

      // Random arms
      if (Math.random() > 0.4) {
        const armHeight = height * 0.4;
        const armGeom = new THREE.CylinderGeometry(0.25, 0.3, armHeight, 8);

        const leftArm = new THREE.Mesh(armGeom, mat);
        leftArm.position.set(-0.6, height * 0.45, 0);
        leftArm.rotation.z = Math.PI / 4;
        group.add(leftArm);

        const leftUp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.25, armHeight * 0.6, 8),
          mat
        );
        leftUp.position.set(-1.1, height * 0.6, 0);
        group.add(leftUp);
      }

      if (Math.random() > 0.4) {
        const armHeight = height * 0.35;
        const armGeom = new THREE.CylinderGeometry(0.25, 0.3, armHeight, 8);

        const rightArm = new THREE.Mesh(armGeom, mat);
        rightArm.position.set(0.6, height * 0.35, 0);
        rightArm.rotation.z = -Math.PI / 4;
        group.add(rightArm);

        const rightUp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.25, armHeight * 0.5, 8),
          mat
        );
        rightUp.position.set(1.0, height * 0.5, 0);
        group.add(rightUp);
      }

      group.userData.swayPhase = Math.random() * Math.PI * 2;
      return group;
    }

    setupInput() {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.steerInput = 1;  // Reversed: left key steers right
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.steerInput = -1; // Reversed: right key steers left
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA' ||
            e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.steerInput = 0;
        }
      });
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

      // Speed tied to audio energy
      const targetSpeed = DESERT.baseSpeed + (DESERT.maxSpeed - DESERT.baseSpeed) * energy;
      this.speed += (targetSpeed - this.speed) * 0.1;

      // Move forward
      this.distance += this.speed * dt * 60;

      // Lateral steering
      const steerSpeed = 0.4 * this.speed;
      this.lateralPos += this.steerInput * steerSpeed * dt * 60;
      this.lateralPos = Math.max(-40, Math.min(40, this.lateralPos));

      // Update ground plane position
      if (this.groundPlane) {
        this.groundPlane.position.z = this.distance;
        this.groundPlane.position.x = this.lateralPos;
      }

      // Update sky position
      if (this.sky) {
        this.sky.position.z = this.distance;
        this.sky.position.x = this.lateralPos;
      }

      // Update sun position (follows but stays in sky)
      if (this.sun) {
        this.sun.position.z = this.distance + 200;
        this.sun.position.x = this.lateralPos + 150;
        // Pulse with energy
        const pulse = 1 + energy * 0.3;
        this.sun.scale.setScalar(pulse);
      }

      // Update player position and effects
      if (this.player) {
        this.player.position.x = this.lateralPos;
        this.player.position.z = this.distance;
        this.player.position.y = 0.8 + Math.sin(this.time * 4) * 0.1; // Hover bob

        // Tilt into turns
        const targetRoll = -this.steerInput * 0.3;
        this.player.rotation.z += (targetRoll - this.player.rotation.z) * 0.1;

        // Engine glow intensity with speed/energy
        const glowIntensity = 0.5 + energy * 0.5 + this.speed * 0.1;
        if (this.leftGlow) {
          this.leftGlow.scale.setScalar(0.8 + bass * 0.5);
          this.leftGlow.material.opacity = glowIntensity;
        }
        if (this.rightGlow) {
          this.rightGlow.scale.setScalar(0.8 + bass * 0.5);
          this.rightGlow.material.opacity = glowIntensity;
        }
      }

      // Manage terrain chunks
      this.updateChunks();

      // Update audio-reactive elements
      this.updateSceneryAudio(bass, mid, energy);

      // Update dust particles
      this.updateDust(dt, energy, bass);

      // Update fog with energy
      if (this.scene.fog) {
        this.scene.fog.near = 30 - energy * 15;
        this.scene.fog.far = DESERT.viewDistance - energy * 80;
      }

      // Update camera
      this.updateCamera();
    }

    updateChunks() {
      // Generate new chunks ahead
      while (this.nextChunkZ < this.distance + DESERT.chunkSize * DESERT.chunksAhead) {
        this.generateChunk();
      }

      // Remove old chunks behind
      while (this.chunks.length > 0 &&
             this.chunks[0].z < this.distance - DESERT.chunkSize * DESERT.chunksBehind) {
        const oldChunk = this.chunks.shift();
        oldChunk.objects.forEach(obj => {
          this.scene.remove(obj);
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      }
    }

    updateSceneryAudio(bass, mid, energy) {
      this.chunks.forEach(chunk => {
        chunk.objects.forEach(obj => {
          // Dunes pulse with bass
          if (obj.userData.pulsePhase !== undefined) {
            const pulse = 1 + bass * 0.2 * Math.sin(this.time * 2 + obj.userData.pulsePhase);
            obj.scale.y = pulse;
          }
          // Cacti sway with mid
          if (obj.userData.swayPhase !== undefined) {
            const sway = mid * 0.15 * Math.sin(this.time * 3 + obj.userData.swayPhase);
            obj.rotation.z = sway;
          }
        });
      });
    }

    updateDust(dt, energy, bass) {
      if (!this.dustParticles) return;

      const positions = this.dustParticles.geometry.attributes.position.array;
      const velocities = this.dustParticles.userData.velocities;

      for (let i = 0; i < velocities.length; i++) {
        const v = velocities[i];

        // Move particles (relative to player movement)
        positions[i * 3] += v.x * (1 + energy);
        positions[i * 3 + 1] += v.y + bass * 0.03;
        positions[i * 3 + 2] += (v.z - this.speed * 0.5) * dt * 60;

        // Reset particles that go behind
        if (positions[i * 3 + 2] < this.distance - 30) {
          positions[i * 3] = this.lateralPos + (Math.random() - 0.5) * 100;
          positions[i * 3 + 1] = Math.random() * 20;
          positions[i * 3 + 2] = this.distance + 50 + Math.random() * 150;
        }
      }

      this.dustParticles.geometry.attributes.position.needsUpdate = true;
      this.dustParticles.material.opacity = 0.3 + energy * 0.4;
      this.dustParticles.material.size = 0.3 + energy * 0.4;
    }

    updateCamera() {
      // Chase camera behind and above
      const camX = this.lateralPos;
      const camY = DESERT.cameraHeight + Math.sin(this.time * 2) * 0.2; // Subtle bob
      const camZ = this.distance - DESERT.cameraDistance;

      this.camera.position.set(camX, camY, camZ);

      // Look ahead
      const lookZ = this.distance + DESERT.cameraLookAhead;
      this.camera.lookAt(this.lateralPos, 2, lookZ);
    }

    dispose() {
      // Clean up chunks
      this.chunks.forEach(chunk => {
        chunk.objects.forEach(obj => {
          this.scene.remove(obj);
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      });
      this.chunks = [];

      if (this.sky) {
        this.scene.remove(this.sky);
        this.sky.geometry.dispose();
        this.sky.material.dispose();
      }

      if (this.sun) {
        this.scene.remove(this.sun);
      }

      if (this.groundPlane) {
        this.scene.remove(this.groundPlane);
        this.groundPlane.geometry.dispose();
        this.groundPlane.material.dispose();
      }

      if (this.player) {
        this.scene.remove(this.player);
        this.player.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }

      if (this.dustParticles) {
        this.scene.remove(this.dustParticles);
        this.dustParticles.geometry.dispose();
        this.dustParticles.material.dispose();
      }

      this.scene.fog = null;
      this.initialized = false;
    }
  }

  // Export
  window.DesertExplorer = DesertRunner;

  window.DesertMode = {
    instance: null,

    init(THREE, scene, camera, renderer) {
      if (this.instance) {
        this.instance.dispose();
      }
      this.instance = new DesertRunner(THREE, scene, camera, renderer);
      this.instance.init();
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

    dispose() {
      if (this.instance) {
        this.instance.dispose();
        this.instance = null;
      }
    }
  };

})();
