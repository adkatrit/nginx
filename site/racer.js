/**
 * AAA Audio-Reactive Racing Game
 * HexGL-inspired physics with procedural audio-driven track generation
 */

(function() {
  'use strict';

  // ============================================================================
  // CONSTANTS - HexGL-derived physics tuning
  // ============================================================================
  const PHYSICS = {
    // Core movement
    thrust: 0.01,
    airResist: 0.03,
    maxSpeed: 3.0,      // Slower, more relaxed pace
    boosterSpeed: 0.4,  // Boost power
    boosterDecay: 0.08, // Fast boost decay

    // Steering
    angularSpeed: 0.01,
    airAngularSpeed: 0.012,
    angularLerp: 0.35,
    driftLerp: 0.3,
    airDrift: 0.1,
    rollAngle: 0.4,
    rollLerp: 0.1,

    // Collision
    repulsionRatio: 0.5,
    repulsionCap: 2.5,
    repulsionLerp: 0.1,
    collisionSpeedDecrease: 0.8,
    shieldDamage: 0.15,

    // Audio modifiers - DIRECT SPEED CONTROL
    // Speed is now directly tied to audio intensity:
    // - Quiet music = slow ship (~80 km/h)
    // - Loud/intense music = fast ship (up to ~350 km/h)
    audioThrustMod: 1.2,      // Bass boosts acceleration rate
    audioSpeedCapMod: 1.0,    // Energy can push max speed higher
    audioAngularMod: 0.3,     // Mid frequencies affect handling
    audioBaseSpeedMod: 0.7    // How strongly audio controls target speed (0-1)
  };

  const TRACK = {
    width: 12,
    segmentLength: 40,
    visibleAhead: 20,
    visibleBehind: 3,
    wallHeight: 3,
    wallThickness: 0.5
  };

  const CAMERA = {
    yOffset: 4.0,
    zOffset: 10.0,
    viewOffset: 15.0,
    speedOffsetMax: 3,  // Less pullback at speed
    lerp: 0.25,         // Much faster camera follow
    fovBase: 70,
    fovSpeedMod: 8,
    fovAudioMod: 4
  };

  // ============================================================================
  // AUDIO REACTOR - Bridges audio analysis to game parameters
  // ============================================================================
  class AudioReactor {
    constructor() {
      this.bass = 0;
      this.mid = 0;
      this.treble = 0;
      this.energy = 0;

      this.beatThreshold = 0.55;
      this.beatCooldown = 0;
      this.beatCooldownTime = 180;
      this.beatDetected = false;
      this.lastBass = 0;

      this.smoothing = {
        bass: 0.18,
        mid: 0.12,
        treble: 0.10,
        energy: 0.08
      };
    }

    update(freqData, dt) {
      if (!freqData || freqData.length === 0) return;

      const bins = freqData.length;

      // Calculate raw frequency band values
      const rawBass = this.avgBins(freqData, 0, Math.floor(bins * 0.08));
      const rawMid = this.avgBins(freqData, Math.floor(bins * 0.12), Math.floor(bins * 0.45));
      const rawTreble = this.avgBins(freqData, Math.floor(bins * 0.55), Math.floor(bins * 0.92));
      const rawEnergy = this.avgBins(freqData, 0, bins);

      // Smooth values with exponential moving average
      this.bass += (rawBass - this.bass) * this.smoothing.bass;
      this.mid += (rawMid - this.mid) * this.smoothing.mid;
      this.treble += (rawTreble - this.treble) * this.smoothing.treble;
      this.energy += (rawEnergy - this.energy) * this.smoothing.energy;

      // Beat detection
      this.beatDetected = false;
      if (this.beatCooldown <= 0) {
        if (rawBass > this.beatThreshold && rawBass > this.lastBass + 0.12) {
          this.beatDetected = true;
          this.beatCooldown = this.beatCooldownTime;
        }
      } else {
        this.beatCooldown -= dt;
      }
      this.lastBass = rawBass;
    }

    avgBins(data, start, end) {
      let sum = 0;
      const count = Math.max(1, end - start);
      for (let i = start; i < end; i++) {
        sum += data[i] || 0;
      }
      return sum / (count * 255);
    }

    getSpeedModifier() {
      return 1 + this.energy * PHYSICS.audioSpeedCapMod;
    }

    getThrustModifier() {
      return 1 + this.bass * PHYSICS.audioThrustMod;
    }

    getVisualIntensity() {
      return this.bass * 0.7 + this.energy * 0.3;
    }
  }

  // ============================================================================
  // SHIP - Player entity with physics state
  // ============================================================================
  class Ship {
    constructor(THREE, scene, gltfLoader) {
      this.THREE = THREE;
      this.scene = scene;
      this.gltfLoader = gltfLoader;

      // Physics state
      this.speed = 0;
      this.boost = 0;
      this.angular = 0;
      this.drift = 0;
      this.roll = 0;
      this.shield = 1.0;

      // Position/movement
      this.position = new THREE.Vector3(0, 1.5, 0);
      this.rotation = new THREE.Euler(0, 0, 0);
      this.velocity = new THREE.Vector3();
      this.repulsionForce = new THREE.Vector3();

      // Input state
      this.steerInput = 0;
      this.boostRequested = false;
      this.braking = false;
      this.airBraking = false;
      this.boostCooldown = 0;

      // Visual
      this.mesh = null;
      this.engineLight = null;
      this.boosterMesh = null;
      this.loaded = false;

      this.createShip();
    }

    createShip() {
      const THREE = this.THREE;

      // Create ship group
      this.mesh = new THREE.Group();
      this.mesh.position.copy(this.position);
      this.scene.add(this.mesh);

      // Try to load GLTF model
      if (this.gltfLoader) {
        this.gltfLoader.load(
          './models/racer_spaceship/scene.gltf',
          (gltf) => {
            const model = gltf.scene;
            // Scale down the large model (original is ~667 units long)
            model.scale.setScalar(0.008);
            // Rotate to face forward (Z+) - 90 degrees more than before
            model.rotation.y = Math.PI + Math.PI / 2;
            this.mesh.add(model);
            this.loaded = true;
            // GLTF model has its own effects, don't add booster
          },
          undefined,
          (error) => {
            console.warn('Failed to load ship model, using fallback:', error);
            this.createFallbackShip();
          }
        );
      } else {
        this.createFallbackShip();
      }

      // Add engine light immediately
      this.engineLight = new THREE.PointLight(0x00ffaa, 2, 8);
      this.engineLight.position.set(0, 0, -1.5);
      this.mesh.add(this.engineLight);
    }

    createFallbackShip() {
      const THREE = this.THREE;

      // Procedural ship from primitives
      const bodyGeom = new THREE.ConeGeometry(0.5, 2.5, 6);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.3
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      this.mesh.add(body);

      // Wings
      const wingGeom = new THREE.BoxGeometry(2.5, 0.1, 0.8);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x00ccff,
        emissive: 0x00ccff,
        emissiveIntensity: 0.2,
        metalness: 0.9,
        roughness: 0.2
      });
      const wings = new THREE.Mesh(wingGeom, wingMat);
      wings.position.z = 0.3;
      this.mesh.add(wings);

      this.loaded = true;
      this.createEngineEffects();
    }

    createEngineEffects() {
      const THREE = this.THREE;

      // Booster flame
      const boosterGeom = new THREE.ConeGeometry(0.3, 1.5, 8);
      boosterGeom.rotateX(-Math.PI / 2);
      const boosterMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      this.boosterMesh = new THREE.Mesh(boosterGeom, boosterMat);
      this.boosterMesh.position.set(0, 0, -1.2);
      this.mesh.add(this.boosterMesh);
    }

    update(dt, audio) {
      const speedRatio = this.speed / PHYSICS.maxSpeed;

      // Audio-modified parameters
      const thrustMod = audio.getThrustModifier();
      const maxSpeedMod = audio.getSpeedModifier();

      // Direct audio-driven target speed
      // Base speed varies from minSpeed to maxSpeed based on audio energy
      const minSpeed = 1.5;  // Minimum speed when audio is silent (~150 km/h)
      const audioEnergy = audio.energy;
      // Use gentler power curve so mid-intensity music still gives good speed
      const audioTargetSpeed = minSpeed + (PHYSICS.maxSpeed * maxSpeedMod - minSpeed) *
                               Math.pow(audioEnergy, 0.5) * PHYSICS.audioBaseSpeedMod;

      // Braking (S/Down) - strong deceleration
      if (this.braking) {
        this.speed -= this.speed * 0.15 * dt * 60;
        this.speed = Math.max(0.5, this.speed);
      } else {
        // Accelerate or decelerate toward the audio-driven target speed
        const speedDiff = audioTargetSpeed - this.speed;
        const accelRate = speedDiff > 0 ? PHYSICS.thrust * thrustMod : PHYSICS.thrust * 0.5;
        this.speed += speedDiff * accelRate * 3 * dt * 60;

        // Also add baseline thrust so there's always some forward momentum
        this.speed += PHYSICS.thrust * 0.3 * dt * 60;
      }

      // Handle boost cooldown
      if (this.boostCooldown > 0) {
        this.boostCooldown -= dt;
      }

      // W/Up triggers boost if not on cooldown
      if (this.boostRequested && this.boostCooldown <= 0) {
        this.applyBoost();
        this.boostCooldown = 3.0; // 3 second cooldown between boosts
      }

      // Apply active boost (overrides audio target speed temporarily)
      if (this.boost > 0) {
        this.speed += this.boost * dt;
        this.boost = Math.max(0, this.boost - PHYSICS.boosterDecay * dt);
      }

      // Light air resistance (less than before since audio now drives speed)
      this.speed -= this.speed * PHYSICS.airResist * 0.5 * dt;

      // Speed cap - allow exceeding audio target during boost
      const effectiveMaxSpeed = Math.max(audioTargetSpeed, PHYSICS.maxSpeed * maxSpeedMod) + this.boost;
      this.speed = Math.max(0.5, Math.min(this.speed, effectiveMaxSpeed));

      // Direct steering - move ship left/right based on input
      // This gives immediate, responsive control
      const steerForce = -this.steerInput * PHYSICS.angularSpeed * 25 * dt * 60;
      this.position.x += steerForce;

      // Angular momentum for smoother visual rotation
      const targetAngular = -this.steerInput * PHYSICS.angularSpeed * 2;
      this.angular += (targetAngular - this.angular) * PHYSICS.angularLerp;

      // Air braking (drift) - adds extra lateral movement
      if (this.airBraking) {
        this.drift += (PHYSICS.airDrift * -this.steerInput - this.drift) * PHYSICS.driftLerp;
      } else {
        this.drift += (0 - this.drift) * PHYSICS.driftLerp;
      }

      // Apply repulsion forces from collision
      this.position.x += this.repulsionForce.x * 0.5;
      this.repulsionForce.multiplyScalar(0.85);

      // Apply drift
      this.position.x += this.drift * this.speed * dt * 60;

      // Move forward
      this.position.z += this.speed * dt * 60;

      // Roll visual (HexGL signature feel) - roll in direction of steer
      const targetRoll = this.steerInput * PHYSICS.rollAngle;
      this.roll += (targetRoll - this.roll) * PHYSICS.rollLerp;

      // Update mesh
      if (this.mesh) {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.z = this.roll;
        this.mesh.rotation.y = -this.angular * 2;
      }

      // Update engine effects
      if (this.boosterMesh) {
        const intensity = 0.5 + speedRatio * 0.5 + audio.bass * 0.3;
        this.boosterMesh.scale.z = 0.5 + intensity;
        this.boosterMesh.material.opacity = 0.4 + intensity * 0.4;
      }

      if (this.engineLight) {
        this.engineLight.intensity = 1 + speedRatio * 2 + audio.bass * 2;
      }
    }

    applyBoost(amount = PHYSICS.boosterSpeed) {
      this.boost = Math.max(this.boost, amount);
    }

    takeDamage(amount) {
      this.shield = Math.max(0, this.shield - amount);
    }

    reset() {
      this.speed = 0;
      this.boost = 0;
      this.boostCooldown = 0;
      this.angular = 0;
      this.drift = 0;
      this.roll = 0;
      this.shield = 1.0;
      this.position.set(0, 1.5, 0);
      this.repulsionForce.set(0, 0, 0);
    }

    dispose() {
      if (this.mesh) {
        this.scene.remove(this.mesh);
        this.mesh.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    }
  }

  // ============================================================================
  // DEFAULT TRACK COLORS - Used when no theme is applied
  // ============================================================================
  const DEFAULT_TRACK_COLORS = {
    floorPrimary: 0x0a0a18,
    floorSecondary: 0x0f0f22,
    wallBase: 0x1a0033,
    wallAccent: 0xff00ff,
    obstacle: 0xff0044,
    boostPad: 0x00ffff,
    centerMarker: 0xff00ff,
    fogColor: 0x000008,
    fogNear: 30,
    fogFar: 200,
    ambientLight: 0x111122,
    ambientIntensity: 0.3
  };

  // ============================================================================
  // DEFAULT VISUAL STYLE - Used when no style is specified
  // ============================================================================
  const DEFAULT_VISUAL_STYLE = {
    wallStyle: "solid",
    floorPattern: "solid",
    glowIntensity: 0.5,
    particleType: "sparks",
    particleDensity: 0.4,
    pulseWithBeat: true,
    skyGradient: [0x000005, 0x000010]
  };

  // ============================================================================
  // TRACK SEGMENT - Individual track piece
  // ============================================================================
  class TrackSegment {
    constructor(THREE, index, zPosition, curvature, width) {
      this.THREE = THREE;
      this.index = index;
      this.zPosition = zPosition;
      this.curvature = curvature;
      this.width = width;
      this.group = new THREE.Group();
      this.obstacles = [];
      this.boostPads = [];
      this.colliders = [];
      this.colors = DEFAULT_TRACK_COLORS;
      this.visualStyle = DEFAULT_VISUAL_STYLE;

      // True curve data (set by generator)
      this.pathX = 0;
      this.pathZ = 0;
      this.trackAngle = 0;
      this.bankAngle = 0;
    }

    build(colors, visualStyle) {
      const THREE = this.THREE;
      const halfWidth = this.width / 2;
      this.colors = colors || DEFAULT_TRACK_COLORS;
      this.visualStyle = visualStyle || DEFAULT_VISUAL_STYLE;

      // Floor - uses theme colors and pattern
      this.buildFloor(THREE, halfWidth);

      // Walls - use theme colors and style
      this.buildWalls(THREE, halfWidth);

      // Center line markers every 4th segment - uses theme color
      if (this.index % 4 === 0) {
        this.buildCenterMarker(THREE);
      }

      // Position segment along curved path
      this.group.position.x = this.pathX;
      this.group.position.z = this.pathZ;

      // Rotate segment to face travel direction
      this.group.rotation.y = -this.trackAngle;

      // Apply banking (roll) for curves
      this.group.rotation.z = this.bankAngle;
    }

    buildFloor(THREE, halfWidth) {
      const floorColor = this.index % 2 === 0 ? this.colors.floorPrimary : this.colors.floorSecondary;
      const pattern = this.visualStyle.floorPattern || "solid";
      const glowIntensity = this.visualStyle.glowIntensity || 0.5;

      // Base floor
      const floorGeom = new THREE.PlaneGeometry(this.width, TRACK.segmentLength, 8, 8);
      const floorMat = new THREE.MeshStandardMaterial({
        color: floorColor,
        emissive: floorColor,
        emissiveIntensity: glowIntensity * 0.1,
        metalness: 0.4,
        roughness: 0.6
      });
      const floor = new THREE.Mesh(floorGeom, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.z = TRACK.segmentLength / 2;
      this.group.add(floor);

      // Add pattern overlay based on style
      if (pattern !== "solid") {
        this.addFloorPattern(THREE, pattern, halfWidth, glowIntensity);
      }
    }

    addFloorPattern(THREE, pattern, halfWidth, glowIntensity) {
      const accentColor = this.colors.wallAccent;

      switch (pattern) {
        case "grid": {
          // Grid lines
          const gridMat = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.15 + glowIntensity * 0.1,
            blending: THREE.AdditiveBlending
          });
          // Horizontal lines
          for (let i = 0; i < 4; i++) {
            const lineGeom = new THREE.PlaneGeometry(this.width, 0.1);
            const line = new THREE.Mesh(lineGeom, gridMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.01, (i + 0.5) * (TRACK.segmentLength / 4));
            this.group.add(line);
          }
          // Vertical lines
          for (let i = -2; i <= 2; i++) {
            const lineGeom = new THREE.PlaneGeometry(0.1, TRACK.segmentLength);
            const line = new THREE.Mesh(lineGeom, gridMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(i * (this.width / 5), 0.01, TRACK.segmentLength / 2);
            this.group.add(line);
          }
          break;
        }
        case "stripes": {
          // Racing stripes
          const stripeMat = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.2 + glowIntensity * 0.15,
            blending: THREE.AdditiveBlending
          });
          // Edge stripes
          const stripeGeom = new THREE.PlaneGeometry(0.5, TRACK.segmentLength);
          const leftStripe = new THREE.Mesh(stripeGeom, stripeMat);
          leftStripe.rotation.x = -Math.PI / 2;
          leftStripe.position.set(-halfWidth + 1, 0.01, TRACK.segmentLength / 2);
          this.group.add(leftStripe);

          const rightStripe = new THREE.Mesh(stripeGeom, stripeMat);
          rightStripe.rotation.x = -Math.PI / 2;
          rightStripe.position.set(halfWidth - 1, 0.01, TRACK.segmentLength / 2);
          this.group.add(rightStripe);
          break;
        }
        case "circuit": {
          // Circuit board pattern
          const circuitMat = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.12 + glowIntensity * 0.08,
            blending: THREE.AdditiveBlending
          });
          // Random circuit-like lines
          const seed = this.index * 12345;
          for (let i = 0; i < 6; i++) {
            const x = ((seed * (i + 1) * 7) % 100) / 100 * this.width - halfWidth;
            const length = 5 + ((seed * (i + 2)) % 15);
            const lineGeom = new THREE.PlaneGeometry(0.08, length);
            const line = new THREE.Mesh(lineGeom, circuitMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.01, (seed * (i + 3) % 30));
            this.group.add(line);
          }
          break;
        }
        case "waves": {
          // Wave pattern (underwater feel)
          const waveMat = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.1 + glowIntensity * 0.1,
            blending: THREE.AdditiveBlending
          });
          for (let i = 0; i < 3; i++) {
            const waveGeom = new THREE.PlaneGeometry(this.width * 0.8, 0.3);
            const wave = new THREE.Mesh(waveGeom, waveMat);
            wave.rotation.x = -Math.PI / 2;
            wave.position.set(
              Math.sin(this.index * 0.5 + i) * 2,
              0.01,
              (i + 0.5) * (TRACK.segmentLength / 3)
            );
            this.group.add(wave);
          }
          break;
        }
        case "hexagon": {
          // Hexagonal pattern
          const hexMat = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.12 + glowIntensity * 0.1,
            blending: THREE.AdditiveBlending
          });
          const hexSize = 2;
          for (let row = 0; row < 3; row++) {
            for (let col = -2; col <= 2; col++) {
              const hexGeom = new THREE.CircleGeometry(hexSize * 0.4, 6);
              const hex = new THREE.Mesh(hexGeom, hexMat);
              hex.rotation.x = -Math.PI / 2;
              const offset = row % 2 === 0 ? 0 : hexSize;
              hex.position.set(
                col * hexSize * 2 + offset,
                0.01,
                row * hexSize * 1.7 + hexSize
              );
              this.group.add(hex);
            }
          }
          break;
        }
      }
    }

    buildWalls(THREE, halfWidth) {
      const isAccentSegment = this.index % 4 === 0;
      const wallColor = isAccentSegment ? this.colors.wallAccent : this.colors.wallBase;
      const wallStyle = this.visualStyle.wallStyle || "solid";
      const glowIntensity = this.visualStyle.glowIntensity || 0.5;

      let wallMat;
      let wallGeom;

      switch (wallStyle) {
        case "wireframe": {
          wallGeom = new THREE.BoxGeometry(TRACK.wallThickness, TRACK.wallHeight, TRACK.segmentLength);
          wallMat = new THREE.MeshBasicMaterial({
            color: wallColor,
            wireframe: true,
            transparent: true,
            opacity: 0.6 + glowIntensity * 0.3
          });
          break;
        }
        case "energy": {
          // Energy barrier style - tall thin glowing panels
          wallGeom = new THREE.BoxGeometry(TRACK.wallThickness * 0.3, TRACK.wallHeight * 1.5, TRACK.segmentLength);
          wallMat = new THREE.MeshBasicMaterial({
            color: wallColor,
            transparent: true,
            opacity: 0.4 + glowIntensity * 0.4,
            blending: THREE.AdditiveBlending
          });
          break;
        }
        case "glass": {
          wallGeom = new THREE.BoxGeometry(TRACK.wallThickness, TRACK.wallHeight, TRACK.segmentLength);
          wallMat = new THREE.MeshPhysicalMaterial({
            color: wallColor,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.6,
            transparent: true,
            opacity: 0.5
          });
          break;
        }
        case "glow": {
          wallGeom = new THREE.BoxGeometry(TRACK.wallThickness, TRACK.wallHeight, TRACK.segmentLength);
          wallMat = new THREE.MeshStandardMaterial({
            color: wallColor,
            emissive: wallColor,
            emissiveIntensity: isAccentSegment ? glowIntensity : glowIntensity * 0.3,
            metalness: 0.2,
            roughness: 0.5
          });
          break;
        }
        default: // solid
          wallGeom = new THREE.BoxGeometry(TRACK.wallThickness, TRACK.wallHeight, TRACK.segmentLength);
          wallMat = new THREE.MeshStandardMaterial({
            color: wallColor,
            emissive: wallColor,
            emissiveIntensity: isAccentSegment ? 0.5 : 0.1,
            metalness: 0.7,
            roughness: 0.3
          });
      }

      const leftWall = new THREE.Mesh(wallGeom, wallMat);
      leftWall.position.set(-halfWidth, TRACK.wallHeight / 2, TRACK.segmentLength / 2);
      leftWall.userData.isWall = true;
      leftWall.userData.side = 'left';
      this.group.add(leftWall);
      this.colliders.push(leftWall);

      const rightWall = new THREE.Mesh(wallGeom, wallMat.clone());
      rightWall.position.set(halfWidth, TRACK.wallHeight / 2, TRACK.segmentLength / 2);
      rightWall.userData.isWall = true;
      rightWall.userData.side = 'right';
      this.group.add(rightWall);
      this.colliders.push(rightWall);
    }

    buildCenterMarker(THREE) {
      const markerGeom = new THREE.PlaneGeometry(0.3, TRACK.segmentLength * 0.8);
      const glowIntensity = this.visualStyle.glowIntensity || 0.5;
      const markerMat = new THREE.MeshBasicMaterial({
        color: this.colors.centerMarker,
        transparent: true,
        opacity: 0.3 + glowIntensity * 0.2,
        blending: THREE.AdditiveBlending
      });
      const marker = new THREE.Mesh(markerGeom, markerMat);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(0, 0.01, TRACK.segmentLength / 2);
      this.group.add(marker);
    }

    addObstacle(type, xOffset) {
      const THREE = this.THREE;

      // Obstacle uses theme color
      const obstacleGeom = new THREE.BoxGeometry(2, 2, 1);
      const obstacleMat = new THREE.MeshStandardMaterial({
        color: this.colors.obstacle,
        emissive: this.colors.obstacle,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.85
      });
      const obstacle = new THREE.Mesh(obstacleGeom, obstacleMat);
      obstacle.position.set(xOffset, 1, TRACK.segmentLength / 2);
      obstacle.userData.isObstacle = true;
      this.group.add(obstacle);
      this.obstacles.push(obstacle);
      this.colliders.push(obstacle);
    }

    addBoostPad(xOffset = 0) {
      const THREE = this.THREE;

      // Boost pad uses theme color
      const padGeom = new THREE.PlaneGeometry(3, 6);
      const padMat = new THREE.MeshBasicMaterial({
        color: this.colors.boostPad,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const pad = new THREE.Mesh(padGeom, padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(xOffset, 0.02, TRACK.segmentLength / 2);
      pad.userData.isBoostPad = true;
      this.group.add(pad);
      this.boostPads.push(pad);
    }

    update(audioIntensity) {
      // Pulse walls with audio
      this.group.children.forEach(child => {
        if (child.userData.isWall && child.material.emissive) {
          child.material.emissiveIntensity = 0.1 + audioIntensity * 0.5;
        }
      });

      // Pulse boost pads
      this.boostPads.forEach(pad => {
        pad.material.opacity = 0.4 + Math.sin(Date.now() * 0.01) * 0.2 + audioIntensity * 0.3;
      });
    }

    dispose() {
      this.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }

  // ============================================================================
  // COURSE PATTERNS - Predefined track sections
  // ============================================================================
  const COURSE_PATTERNS = {
    // Each pattern is an array of segment definitions
    // { curve: curvature change, width: track width multiplier, obstacle: side (-1, 0, 1), boost: boolean }

    // Long straight - good for high bass/speed sections
    straight: {
      name: 'Straight',
      audioTrigger: 'bass',  // Triggered by high bass
      segments: [
        { curve: 0, width: 1.0, boost: true },
        { curve: 0, width: 1.0 },
        { curve: 0, width: 1.0 },
        { curve: 0, width: 1.0, boost: true },
        { curve: 0, width: 1.0 },
        { curve: 0, width: 1.0 }
      ]
    },

    // Gentle S-curve - flowing with the music
    sCurve: {
      name: 'S-Curve',
      audioTrigger: 'mid',
      segments: [
        { curve: 1.5, width: 1.0 },
        { curve: 2.0, width: 1.0 },
        { curve: 1.5, width: 1.0 },
        { curve: 0, width: 1.0 },
        { curve: -1.5, width: 1.0 },
        { curve: -2.0, width: 1.0 },
        { curve: -1.5, width: 1.0 },
        { curve: 0, width: 1.0 }
      ]
    },

    // Chicane - quick left-right-left
    chicane: {
      name: 'Chicane',
      audioTrigger: 'treble',
      segments: [
        { curve: 0, width: 0.9 },
        { curve: 2.5, width: 0.85, obstacle: -1 },
        { curve: -5.0, width: 0.85, obstacle: 1 },
        { curve: 2.5, width: 0.85, obstacle: -1 },
        { curve: 0, width: 0.9 }
      ]
    },

    // Wide sweeping turn
    sweeper: {
      name: 'Sweeper',
      audioTrigger: 'energy',
      segments: [
        { curve: 1.0, width: 1.1 },
        { curve: 1.2, width: 1.1 },
        { curve: 1.4, width: 1.0, boost: true },
        { curve: 1.4, width: 1.0 },
        { curve: 1.2, width: 1.0 },
        { curve: 1.0, width: 1.1 },
        { curve: 0.5, width: 1.1 }
      ]
    },

    // Tight hairpin turn
    hairpin: {
      name: 'Hairpin',
      audioTrigger: 'beat',
      segments: [
        { curve: 0, width: 1.0 },
        { curve: 2.0, width: 0.9 },
        { curve: 3.5, width: 0.8 },
        { curve: 4.0, width: 0.75 },
        { curve: 3.5, width: 0.8 },
        { curve: 2.0, width: 0.9 },
        { curve: 0, width: 1.0, boost: true }
      ]
    },

    // Narrow corridor with obstacles
    gauntlet: {
      name: 'Gauntlet',
      audioTrigger: 'energy',
      segments: [
        { curve: 0, width: 0.7, obstacle: -1 },
        { curve: 0, width: 0.7, obstacle: 1 },
        { curve: 0.5, width: 0.7, obstacle: -1 },
        { curve: 0, width: 0.7, obstacle: 1 },
        { curve: -0.5, width: 0.7, obstacle: -1 },
        { curve: 0, width: 0.8, boost: true }
      ]
    },

    // Slalom - weaving through obstacles
    slalom: {
      name: 'Slalom',
      audioTrigger: 'mid',
      segments: [
        { curve: 1.0, width: 1.0, obstacle: 0 },
        { curve: -1.0, width: 1.0 },
        { curve: -1.0, width: 1.0, obstacle: 0 },
        { curve: 1.0, width: 1.0 },
        { curve: 1.0, width: 1.0, obstacle: 0 },
        { curve: -1.0, width: 1.0 },
        { curve: 0, width: 1.0, boost: true }
      ]
    },

    // Speed boost corridor
    boostRun: {
      name: 'Boost Run',
      audioTrigger: 'bass',
      segments: [
        { curve: 0, width: 0.9, boost: true },
        { curve: 0, width: 0.85, boost: true },
        { curve: 0, width: 0.8, boost: true },
        { curve: 0, width: 0.85 },
        { curve: 0, width: 0.9 }
      ]
    },

    // Oscillating wave pattern
    wave: {
      name: 'Wave',
      audioTrigger: 'mid',
      segments: [
        { curve: 1.5, width: 1.0 },
        { curve: 0, width: 1.0 },
        { curve: -1.5, width: 1.0 },
        { curve: 0, width: 1.0 },
        { curve: 1.5, width: 1.0 },
        { curve: 0, width: 1.0 },
        { curve: -1.5, width: 1.0 },
        { curve: 0, width: 1.0, boost: true }
      ]
    },

    // Funnel - starts wide, gets narrow
    funnel: {
      name: 'Funnel',
      audioTrigger: 'treble',
      segments: [
        { curve: 0, width: 1.3 },
        { curve: 0.3, width: 1.1 },
        { curve: 0.3, width: 0.9, obstacle: -1 },
        { curve: 0, width: 0.7 },
        { curve: -0.3, width: 0.9, obstacle: 1 },
        { curve: -0.3, width: 1.1 },
        { curve: 0, width: 1.3, boost: true }
      ]
    }
  };

  // Pattern selection weights based on audio
  const PATTERN_WEIGHTS = {
    bass: ['straight', 'boostRun', 'sweeper'],
    mid: ['sCurve', 'wave', 'slalom'],
    treble: ['chicane', 'funnel', 'gauntlet'],
    energy: ['sweeper', 'gauntlet', 'hairpin'],
    beat: ['hairpin', 'chicane'],
    random: ['straight', 'sCurve', 'chicane', 'sweeper', 'wave', 'slalom']
  };

  // ============================================================================
  // TRACK GENERATOR - Pattern-based audio-driven track generation
  // ============================================================================
  class TrackGenerator {
    constructor(THREE, scene) {
      this.THREE = THREE;
      this.scene = scene;

      this.segments = [];
      this.segmentPool = [];
      this.nextSegmentIndex = 0;
      this.lastSegmentZ = 0;

      this.curvature = 0;
      this.accumulatedCurve = 0;
      this.accentColor = 0x00ffff;

      // True curved track system - angle-based positioning
      this.trackAngle = 0;           // Current heading angle (radians)
      this.pathX = 0;                // Current X position on curved path
      this.pathZ = 0;                // Current Z position on curved path
      this.bankAngle = 0;            // Current banking angle

      // Theme colors for track elements
      this.themeColors = { ...DEFAULT_TRACK_COLORS };

      // Visual style for track appearance
      this.visualStyle = { ...DEFAULT_VISUAL_STYLE };

      // Pattern queue system
      this.patternQueue = [];      // Queue of segment definitions to generate
      this.currentPattern = null;  // Name of current pattern being generated
      this.patternCooldown = 0;    // Prevent rapid pattern switching

      // Reusable vector for boost pad checks
      this._tempVec = new THREE.Vector3();
    }

    setThemeColors(colors, visualStyle) {
      if (colors) {
        // Merge provided colors with defaults
        this.themeColors = { ...DEFAULT_TRACK_COLORS, ...colors };
        // Update accent color for backwards compatibility
        if (colors.wallAccent) {
          this.accentColor = colors.wallAccent;
        }
      }
      if (visualStyle) {
        // Merge provided visual style with defaults
        this.visualStyle = { ...DEFAULT_VISUAL_STYLE, ...visualStyle };
      }
    }

    generateInitial(count) {
      // Start with a straight section
      this.queuePattern('straight');
      this.queuePattern('straight');

      for (let i = 0; i < count; i++) {
        this.generateNext({ bass: 0, mid: 0, treble: 0, energy: 0, beatDetected: false });
      }
    }

    selectPattern(audio) {
      // Determine which audio characteristic is dominant
      let trigger = 'random';
      let maxVal = 0.3; // Minimum threshold

      if (audio.bass > maxVal) {
        maxVal = audio.bass;
        trigger = 'bass';
      }
      if (audio.mid > maxVal) {
        maxVal = audio.mid;
        trigger = 'mid';
      }
      if (audio.treble > maxVal) {
        maxVal = audio.treble;
        trigger = 'treble';
      }
      if (audio.energy > 0.6) {
        trigger = 'energy';
      }
      if (audio.beatDetected) {
        trigger = 'beat';
      }

      // Select from appropriate pattern pool
      const pool = PATTERN_WEIGHTS[trigger] || PATTERN_WEIGHTS.random;
      const patternName = pool[Math.floor(Math.random() * pool.length)];

      return patternName;
    }

    queuePattern(patternName) {
      const pattern = COURSE_PATTERNS[patternName];
      if (!pattern) return;

      // Randomly mirror the pattern (flip left/right)
      const mirror = Math.random() > 0.5 ? -1 : 1;

      // Add each segment definition to the queue
      pattern.segments.forEach(seg => {
        this.patternQueue.push({
          curve: seg.curve * mirror,
          width: seg.width,
          obstacle: seg.obstacle ? seg.obstacle * mirror : null,
          boost: seg.boost || false,
          patternName: patternName
        });
      });

      this.currentPattern = patternName;
    }

    generateNext(audio) {
      // Check if we need to queue a new pattern
      if (this.patternQueue.length === 0) {
        const patternName = this.selectPattern(audio);
        this.queuePattern(patternName);
      }

      // Get next segment definition from queue
      const segDef = this.patternQueue.shift();

      // Smooth curvature transition
      const targetCurve = segDef.curve;
      this.curvature += (targetCurve - this.curvature) * 0.3;

      // Convert curvature to angular change (radians per segment)
      // Curvature of 5 = about 3 degrees per segment = noticeable curve
      const angleChange = this.curvature * 0.012;
      this.trackAngle += angleChange;

      // Calculate segment position along curved path
      const segX = this.pathX;
      const segZ = this.pathZ;

      // Advance path position using current heading angle
      this.pathX += Math.sin(this.trackAngle) * TRACK.segmentLength;
      this.pathZ += Math.cos(this.trackAngle) * TRACK.segmentLength;

      // Calculate banking angle (tilt into curves)
      // Positive curvature = right turn = bank left (negative roll)
      const targetBank = -this.curvature * 0.04;
      this.bankAngle += (targetBank - this.bankAngle) * 0.3;

      // Legacy accumulated curve for compatibility
      this.accumulatedCurve += this.curvature * 0.8;

      // Calculate width (pattern width * audio narrowing)
      const audioNarrow = 1 - audio.energy * 0.15;
      const width = TRACK.width * segDef.width * audioNarrow;

      // Create or recycle segment
      let segment;
      if (this.segmentPool.length > 0) {
        segment = this.segmentPool.pop();
        segment.index = this.nextSegmentIndex;
        segment.zPosition = this.lastSegmentZ;
        segment.curvature = this.accumulatedCurve;
        segment.width = width;
        // Clear old children
        while (segment.group.children.length > 0) {
          const child = segment.group.children[0];
          segment.group.remove(child);
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        }
        segment.obstacles = [];
        segment.boostPads = [];
        segment.colliders = [];
      } else {
        segment = new TrackSegment(
          this.THREE,
          this.nextSegmentIndex,
          this.lastSegmentZ,
          this.accumulatedCurve,
          width
        );
      }

      // Store curve data for positioning
      segment.pathX = segX;
      segment.pathZ = segZ;
      segment.trackAngle = this.trackAngle;
      segment.bankAngle = this.bankAngle;

      segment.build(this.themeColors, this.visualStyle);

      // Add obstacle if pattern defines one
      if (segDef.obstacle !== null) {
        const obstacleX = segDef.obstacle * (width * 0.3);
        segment.addObstacle('block', obstacleX);
      }

      // Add boost pad if pattern defines one
      if (segDef.boost) {
        segment.addBoostPad(0);
      }

      this.scene.add(segment.group);
      this.segments.push(segment);

      this.lastSegmentZ += TRACK.segmentLength;
      this.nextSegmentIndex++;

      return segment;
    }

    update(shipZ, audio) {
      // Remove segments behind the ship (use pathZ for curved tracks)
      while (this.segments.length > 0 &&
             this.segments[0].pathZ < shipZ - TRACK.segmentLength * TRACK.visibleBehind) {
        const oldSegment = this.segments.shift();
        this.scene.remove(oldSegment.group);
        this.segmentPool.push(oldSegment);
      }

      // Generate new segments ahead (use pathZ for curved tracks)
      while (this.pathZ < shipZ + TRACK.segmentLength * TRACK.visibleAhead) {
        this.generateNext(audio);
      }

      // Update active segments with audio
      const intensity = audio.getVisualIntensity();
      this.segments.forEach(seg => seg.update(intensity));
    }

    getActiveColliders() {
      const colliders = [];
      this.segments.forEach(seg => {
        colliders.push(...seg.colliders);
      });
      return colliders;
    }

    checkBoostPads(position) {
      for (const segment of this.segments) {
        for (const pad of segment.boostPads) {
          pad.getWorldPosition(this._tempVec);
          const dx = position.x - this._tempVec.x;
          const dz = position.z - this._tempVec.z;
          if (Math.abs(dx) < 1.5 && Math.abs(dz) < 3) {
            // Remove the pad after collection
            segment.group.remove(pad);
            segment.boostPads = segment.boostPads.filter(p => p !== pad);
            return true;
          }
        }
      }
      return false;
    }

    setAccentColor(color) {
      this.accentColor = color;
    }

    // Get track info at a given Z position (for ship following)
    getTrackInfoAtZ(z) {
      // Find the segment at or near this Z position
      for (const seg of this.segments) {
        const segStart = seg.pathZ;
        const segEnd = seg.pathZ + TRACK.segmentLength;
        if (z >= segStart && z < segEnd) {
          // Interpolate within segment
          const t = (z - segStart) / TRACK.segmentLength;
          return {
            angle: seg.trackAngle,
            bankAngle: seg.bankAngle,
            centerX: seg.pathX + Math.sin(seg.trackAngle) * TRACK.segmentLength * t,
            centerZ: seg.pathZ + Math.cos(seg.trackAngle) * TRACK.segmentLength * t
          };
        }
      }
      // Default if no segment found
      return { angle: 0, bankAngle: 0, centerX: 0, centerZ: z };
    }

    reset() {
      // Clear all segments
      this.segments.forEach(seg => {
        this.scene.remove(seg.group);
        seg.dispose();
      });
      this.segments = [];
      this.segmentPool = [];
      this.nextSegmentIndex = 0;
      this.lastSegmentZ = 0;
      this.curvature = 0;
      this.accumulatedCurve = 0;
      // Reset curved track state
      this.trackAngle = 0;
      this.pathX = 0;
      this.pathZ = 0;
      this.bankAngle = 0;
      // Clear pattern queue to prevent stale data after restart
      this.patternQueue = [];
      this.currentPattern = null;
      this.patternCooldown = 0;
    }

    dispose() {
      this.reset();
    }
  }

  // ============================================================================
  // COLLISION SYSTEM - Geometric raycasting collision detection
  // ============================================================================
  class CollisionSystem {
    constructor(THREE, ship, trackGenerator) {
      this.THREE = THREE;
      this.ship = ship;
      this.track = trackGenerator;

      this.raycaster = new THREE.Raycaster();
      this.rayLength = 2.0;

      // Ray directions (normalized)
      this.rayDirections = [
        new THREE.Vector3(1, 0, 0),      // Right
        new THREE.Vector3(-1, 0, 0),     // Left
        new THREE.Vector3(0.7, 0, 0.7),  // Forward-right
        new THREE.Vector3(-0.7, 0, 0.7), // Forward-left
        new THREE.Vector3(0, 0, 1)       // Forward
      ];

      // Reusable origin vector to avoid GC pressure
      this._origin = new THREE.Vector3();

      this.result = {
        hit: false,
        left: false,
        right: false,
        front: false,
        point: new THREE.Vector3(),
        normal: new THREE.Vector3()
      };
    }

    check() {
      // Reset result
      this.result.hit = false;
      this.result.left = false;
      this.result.right = false;
      this.result.front = false;

      const colliders = this.track.getActiveColliders();
      if (colliders.length === 0) return this.result;

      // Reuse origin vector instead of cloning
      this._origin.copy(this.ship.position);
      this._origin.y = 1.0; // Ray from ship center height

      for (const dir of this.rayDirections) {
        this.raycaster.set(this._origin, dir);
        this.raycaster.far = this.rayLength;

        const hits = this.raycaster.intersectObjects(colliders, false);
        if (hits.length > 0 && hits[0].distance < this.rayLength) {
          this.result.hit = true;
          this.result.point.copy(hits[0].point);

          if (hits[0].face) {
            this.result.normal.copy(hits[0].face.normal);
          }

          // Determine collision side
          if (dir.x > 0.5) this.result.right = true;
          if (dir.x < -0.5) this.result.left = true;
          if (dir.z > 0.5) this.result.front = true;
        }
      }

      return this.result;
    }

    calculateDamage() {
      const speedRatio = this.ship.speed / PHYSICS.maxSpeed;
      return speedRatio * speedRatio * 0.8 * PHYSICS.shieldDamage;
    }
  }

  // ============================================================================
  // CAMERA CONTROLLER - HexGL-style chase camera
  // ============================================================================
  class CameraController {
    constructor(THREE, camera, target) {
      this.THREE = THREE;
      this.camera = camera;
      this.target = target;

      this.speedOffset = 0;
      this.shakeMagnitude = 0;
      this.shakeDecay = 0.92;

      this.targetPosition = new THREE.Vector3();
      this.lookTarget = new THREE.Vector3();
    }

    update(dt, speedRatio, audio) {
      // Speed-based offset (pulls camera back at high speed)
      const targetSpeedOffset = CAMERA.speedOffsetMax * speedRatio;
      this.speedOffset += (targetSpeedOffset - this.speedOffset) * 0.05;

      // Calculate ideal camera position
      this.targetPosition.copy(this.target.position);
      this.targetPosition.y += CAMERA.yOffset;
      this.targetPosition.z -= CAMERA.zOffset + this.speedOffset;

      // Lerp camera to target
      this.camera.position.lerp(this.targetPosition, CAMERA.lerp);

      // Camera shake
      if (this.shakeMagnitude > 0.01) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeMagnitude;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeMagnitude * 0.5;
        this.shakeMagnitude *= this.shakeDecay;
      }

      // Look ahead of ship
      this.lookTarget.copy(this.target.position);
      this.lookTarget.z += CAMERA.viewOffset;
      this.camera.lookAt(this.lookTarget);

      // Audio-reactive FOV
      const targetFov = CAMERA.fovBase + speedRatio * CAMERA.fovSpeedMod + audio.bass * CAMERA.fovAudioMod;
      this.camera.fov += (targetFov - this.camera.fov) * 0.08;
      this.camera.updateProjectionMatrix();
    }

    triggerShake(magnitude) {
      this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    }

    reset() {
      this.speedOffset = 0;
      this.shakeMagnitude = 0;
    }
  }

  // ============================================================================
  // PARTICLE MANAGER - Collision sparks, engine trails, speed lines
  // ============================================================================
  class ParticleManager {
    constructor(THREE, scene) {
      this.THREE = THREE;
      this.scene = scene;

      this.systems = {};
      this.ambientType = "sparks";
      this.ambientColor = 0xffffff;
      this.ambientDensity = 0.4;
      this.createSystems();
    }

    createSystems() {
      // Speed lines (rushing past camera)
      this.systems.speedLines = this.createSpeedLines();

      // Collision sparks
      this.systems.sparks = this.createSparks();

      // Ambient particles (themed per track)
      this.systems.ambient = this.createAmbientParticles();
    }

    setAmbientStyle(type, color, density) {
      this.ambientType = type || "sparks";
      this.ambientColor = color || 0xffffff;
      this.ambientDensity = density || 0.4;

      // Update ambient particle appearance
      if (this.systems.ambient && this.systems.ambient.mesh) {
        const mat = this.systems.ambient.mesh.material;
        mat.color.setHex(this.ambientColor);

        // Adjust size and opacity based on type
        switch (this.ambientType) {
          case "bubbles":
            mat.size = 0.4;
            mat.opacity = 0.3;
            break;
          case "embers":
            mat.size = 0.15;
            mat.opacity = 0.8;
            break;
          case "dust":
            mat.size = 0.08;
            mat.opacity = 0.4;
            break;
          case "energy":
            mat.size = 0.2;
            mat.opacity = 0.6;
            break;
          case "rain":
            mat.size = 0.05;
            mat.opacity = 0.5;
            break;
          case "snow":
            mat.size = 0.12;
            mat.opacity = 0.6;
            break;
          default: // sparks
            mat.size = 0.1;
            mat.opacity = 0.5;
        }
        mat.needsUpdate = true;
      }
    }

    createAmbientParticles() {
      const THREE = this.THREE;
      const count = 300;

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = [];

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = Math.random() * 15;
        positions[i * 3 + 2] = Math.random() * 120;
        velocities.push({
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.2,
          z: -0.5 - Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2
        });
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });

      const points = new THREE.Points(geometry, material);
      this.scene.add(points);

      return {
        mesh: points,
        geometry,
        positions,
        velocities,
        count
      };
    }

    updateAmbientParticles(ambient, dt, time, shipZ, shipSpeed, audio) {
      const type = this.ambientType;
      const density = this.ambientDensity;
      const visibleCount = Math.floor(ambient.count * density);

      for (let i = 0; i < ambient.count; i++) {
        const idx = i * 3;
        const vel = ambient.velocities[i];

        // Only animate visible particles
        if (i >= visibleCount) {
          ambient.positions[idx + 1] = -100; // Hide excess particles
          continue;
        }

        switch (type) {
          case "bubbles":
            // Slow rising motion with wobble
            ambient.positions[idx] += Math.sin(time * 2 + vel.phase) * 0.02;
            ambient.positions[idx + 1] += 0.03 + audio.mid * 0.02;
            ambient.positions[idx + 2] -= shipSpeed * dt * 0.3;
            break;

          case "embers":
            // Rising with flickering
            ambient.positions[idx] += vel.x * (1 + Math.sin(time * 10 + vel.phase) * 0.5);
            ambient.positions[idx + 1] += 0.05 + audio.bass * 0.03;
            ambient.positions[idx + 2] -= shipSpeed * dt * 0.5;
            break;

          case "dust":
            // Slow floating
            ambient.positions[idx] += Math.sin(time * 0.5 + vel.phase) * 0.01;
            ambient.positions[idx + 1] += Math.cos(time * 0.3 + vel.phase) * 0.01;
            ambient.positions[idx + 2] -= shipSpeed * dt * 0.2;
            break;

          case "energy":
            // Rapid movement with audio reactivity
            ambient.positions[idx] += Math.sin(time * 5 + vel.phase) * 0.05 * (1 + audio.treble);
            ambient.positions[idx + 1] += Math.cos(time * 4 + vel.phase) * 0.03;
            ambient.positions[idx + 2] -= shipSpeed * dt * 0.4;
            break;

          case "rain":
            // Fast falling
            ambient.positions[idx] += vel.x * 0.1;
            ambient.positions[idx + 1] -= 0.3 + audio.energy * 0.1;
            ambient.positions[idx + 2] -= shipSpeed * dt * 0.6;
            break;

          case "snow":
            // Gentle falling with drift
            ambient.positions[idx] += Math.sin(time + vel.phase) * 0.02;
            ambient.positions[idx + 1] -= 0.05;
            ambient.positions[idx + 2] -= shipSpeed * dt * 0.3;
            break;

          default: // sparks
            // Default movement
            ambient.positions[idx] += vel.x * dt;
            ambient.positions[idx + 1] += vel.y * dt;
            ambient.positions[idx + 2] -= shipSpeed * dt * 0.4;
        }

        // Wrap particles around
        if (ambient.positions[idx + 2] < shipZ - 30) {
          ambient.positions[idx] = (Math.random() - 0.5) * 40;
          ambient.positions[idx + 1] = Math.random() * 15;
          ambient.positions[idx + 2] = shipZ + 100 + Math.random() * 20;
        }
        // Wrap Y for rising particles
        if (ambient.positions[idx + 1] > 20) {
          ambient.positions[idx + 1] = -2;
        }
        if (ambient.positions[idx + 1] < -5) {
          ambient.positions[idx + 1] = 15;
        }
      }
      ambient.geometry.attributes.position.needsUpdate = true;
    }

    createSpeedLines() {
      const THREE = this.THREE;
      const count = 200;

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = [];

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = Math.random() * 8;
        positions[i * 3 + 2] = Math.random() * 100;
        velocities.push({
          x: (Math.random() - 0.5) * 0.5,
          y: 0,
          z: -2 - Math.random() * 3
        });
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      const points = new THREE.Points(geometry, material);
      this.scene.add(points);

      return {
        mesh: points,
        geometry,
        positions,
        velocities,
        count
      };
    }

    createSparks() {
      const THREE = this.THREE;
      const maxCount = 100;

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(maxCount * 3);
      const colors = new Float32Array(maxCount * 3);

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });

      const points = new THREE.Points(geometry, material);
      this.scene.add(points);

      return {
        mesh: points,
        geometry,
        positions,
        colors,
        velocities: [],
        lifetimes: new Float32Array(maxCount),
        activeCount: 0,
        maxCount
      };
    }

    emitSparks(position, direction, count = 15) {
      const system = this.systems.sparks;

      for (let i = 0; i < count && system.activeCount < system.maxCount; i++) {
        const idx = system.activeCount * 3;

        // Position with slight randomness
        system.positions[idx] = position.x + (Math.random() - 0.5) * 0.5;
        system.positions[idx + 1] = position.y + (Math.random() - 0.5) * 0.3;
        system.positions[idx + 2] = position.z + (Math.random() - 0.5) * 0.5;

        // Orange/yellow color
        const hue = 0.08 + Math.random() * 0.05;
        const color = new this.THREE.Color().setHSL(hue, 1, 0.6);
        system.colors[idx] = color.r;
        system.colors[idx + 1] = color.g;
        system.colors[idx + 2] = color.b;

        // Velocity away from collision
        system.velocities[system.activeCount] = {
          x: direction * (0.3 + Math.random() * 0.3),
          y: 0.1 + Math.random() * 0.2,
          z: -0.2 - Math.random() * 0.3
        };

        system.lifetimes[system.activeCount] = 1.0;
        system.activeCount++;
      }

      system.geometry.attributes.position.needsUpdate = true;
      system.geometry.attributes.color.needsUpdate = true;
    }

    update(dt, shipZ, shipSpeed, audio) {
      const time = performance.now() * 0.001;

      // Update speed lines
      const lines = this.systems.speedLines;
      if (!lines || !lines.mesh) return;

      const speedFactor = 0.5 + shipSpeed * 0.3 + audio.energy * 0.3;
      lines.mesh.material.opacity = Math.min(0.8, speedFactor * 0.4);

      for (let i = 0; i < lines.count; i++) {
        const idx = i * 3;
        lines.positions[idx + 2] -= lines.velocities[i].z * speedFactor * dt;

        // Wrap around
        if (lines.positions[idx + 2] < shipZ - 20) {
          lines.positions[idx] = (Math.random() - 0.5) * 30;
          lines.positions[idx + 1] = Math.random() * 8;
          lines.positions[idx + 2] = shipZ + 80 + Math.random() * 20;
        }
      }
      lines.geometry.attributes.position.needsUpdate = true;

      // Update ambient particles based on type
      const ambient = this.systems.ambient;
      if (ambient && ambient.mesh) {
        this.updateAmbientParticles(ambient, dt, time, shipZ, shipSpeed, audio);
      }

      // Update sparks
      const sparks = this.systems.sparks;
      for (let i = sparks.activeCount - 1; i >= 0; i--) {
        const idx = i * 3;
        const vel = sparks.velocities[i];

        // Move particle
        sparks.positions[idx] += vel.x * dt * 60;
        sparks.positions[idx + 1] += vel.y * dt * 60;
        sparks.positions[idx + 2] += vel.z * dt * 60;

        // Gravity
        vel.y -= 0.01 * dt * 60;

        // Fade
        sparks.lifetimes[i] -= 0.03 * dt * 60;
        const fade = Math.max(0, sparks.lifetimes[i]);
        sparks.colors[idx] *= 0.98;
        sparks.colors[idx + 1] *= 0.96;
        sparks.colors[idx + 2] *= 0.95;

        // Remove dead particles
        if (sparks.lifetimes[i] <= 0) {
          // Swap with last active
          const lastIdx = (sparks.activeCount - 1) * 3;
          sparks.positions[idx] = sparks.positions[lastIdx];
          sparks.positions[idx + 1] = sparks.positions[lastIdx + 1];
          sparks.positions[idx + 2] = sparks.positions[lastIdx + 2];
          sparks.colors[idx] = sparks.colors[lastIdx];
          sparks.colors[idx + 1] = sparks.colors[lastIdx + 1];
          sparks.colors[idx + 2] = sparks.colors[lastIdx + 2];
          sparks.velocities[i] = sparks.velocities[sparks.activeCount - 1];
          sparks.lifetimes[i] = sparks.lifetimes[sparks.activeCount - 1];
          sparks.activeCount--;
        }
      }
      sparks.geometry.attributes.position.needsUpdate = true;
      sparks.geometry.attributes.color.needsUpdate = true;
    }

    dispose() {
      Object.values(this.systems).forEach(sys => {
        this.scene.remove(sys.mesh);
        sys.geometry.dispose();
        sys.mesh.material.dispose();
      });
    }
  }

  // ============================================================================
  // HUD - Score, shield, speed display
  // ============================================================================
  class HUD {
    constructor() {
      this.scoreEl = document.getElementById('racerScore');
      this.comboEl = document.getElementById('racerCombo');
      this.hudEl = document.getElementById('racerHud');

      // Create additional HUD elements if they don't exist
      this.createElements();
    }

    createElements() {
      if (!this.hudEl) return;

      // Shield bar
      let shieldContainer = document.getElementById('racerShieldContainer');
      if (!shieldContainer) {
        shieldContainer = document.createElement('div');
        shieldContainer.id = 'racerShieldContainer';
        shieldContainer.className = 'racer-shield-container';
        shieldContainer.innerHTML = `
          <div class="racer-shield-label">SHIELD</div>
          <div class="racer-shield-bar">
            <div class="racer-shield-fill" id="racerShieldFill"></div>
          </div>
        `;
        this.hudEl.appendChild(shieldContainer);
      }
      this.shieldFillEl = document.getElementById('racerShieldFill');

      // Speed display
      let speedDisplay = document.getElementById('racerSpeedDisplay');
      if (!speedDisplay) {
        speedDisplay = document.createElement('div');
        speedDisplay.id = 'racerSpeedDisplay';
        speedDisplay.className = 'racer-speed-display';
        speedDisplay.innerHTML = '<span id="racerSpeedValue">0</span> <span class="racer-speed-unit">km/h</span>';
        this.hudEl.appendChild(speedDisplay);
      }
      this.speedValueEl = document.getElementById('racerSpeedValue');

      // Countdown display
      let countdownEl = document.getElementById('racerCountdown');
      if (!countdownEl) {
        countdownEl = document.createElement('div');
        countdownEl.id = 'racerCountdown';
        countdownEl.className = 'racer-countdown';
        this.hudEl.appendChild(countdownEl);
      }
      this.countdownEl = countdownEl;

      // Boost meter
      let boostContainer = document.getElementById('racerBoostContainer');
      if (!boostContainer) {
        boostContainer = document.createElement('div');
        boostContainer.id = 'racerBoostContainer';
        boostContainer.className = 'racer-boost-container';
        boostContainer.innerHTML = `
          <div class="racer-boost-label">BOOST</div>
          <div class="racer-boost-bar">
            <div class="racer-boost-fill" id="racerBoostFill"></div>
          </div>
        `;
        this.hudEl.appendChild(boostContainer);
      }
      this.boostFillEl = document.getElementById('racerBoostFill');
    }

    showCountdown(number) {
      if (this.countdownEl) {
        // Guard against NaN
        if (isNaN(number)) {
          this.countdownEl.textContent = '3';
        } else if (number <= 0) {
          this.countdownEl.textContent = 'GO!';
        } else {
          this.countdownEl.textContent = Math.ceil(number);
        }
        this.countdownEl.style.display = 'flex';
      }
    }

    hideCountdown() {
      if (this.countdownEl) {
        this.countdownEl.style.display = 'none';
      }
    }

    update(score, shield, speed, combo, boostCooldown = 0) {
      if (this.scoreEl) {
        this.scoreEl.textContent = Math.floor(score).toLocaleString();
      }

      if (this.comboEl) {
        if (combo > 1) {
          this.comboEl.textContent = `x${combo} COMBO`;
          this.comboEl.style.opacity = '1';
        } else {
          this.comboEl.style.opacity = '0';
        }
      }

      if (this.shieldFillEl) {
        const percent = Math.max(0, Math.min(100, shield * 100));
        this.shieldFillEl.style.width = percent + '%';

        // Color based on shield level
        if (shield < 0.25) {
          this.shieldFillEl.style.background = '#ff0044';
        } else if (shield < 0.5) {
          this.shieldFillEl.style.background = '#ffaa00';
        } else {
          this.shieldFillEl.style.background = '#00ffaa';
        }
      }

      if (this.boostFillEl) {
        // Boost is ready when cooldown is 0, show as percentage ready
        const boostReady = Math.max(0, 1 - (boostCooldown / 3.0)) * 100; // 3 second cooldown
        this.boostFillEl.style.width = boostReady + '%';

        // Color based on boost status
        if (boostReady >= 100) {
          this.boostFillEl.style.background = '#00ffff'; // Cyan = ready
        } else {
          this.boostFillEl.style.background = '#0066aa'; // Dark blue = charging
        }
      }

      if (this.speedValueEl) {
        // Convert game speed to "km/h" for display (arbitrary multiplier)
        this.speedValueEl.textContent = Math.floor(speed * 100);
      }
    }

    showGameOver(finalScore) {
      if (!this.hudEl) return;

      let gameOverEl = document.getElementById('racerGameOver');
      if (!gameOverEl) {
        gameOverEl = document.createElement('div');
        gameOverEl.id = 'racerGameOver';
        gameOverEl.className = 'racer-game-over';
        this.hudEl.appendChild(gameOverEl);
      }

      gameOverEl.innerHTML = `
        <div class="racer-game-over-title">GAME OVER</div>
        <div class="racer-game-over-score">SCORE: ${Math.floor(finalScore).toLocaleString()}</div>
        <div class="racer-game-over-restart">Press SPACE to restart</div>
      `;
      gameOverEl.style.display = 'flex';
    }

    hideGameOver() {
      const gameOverEl = document.getElementById('racerGameOver');
      if (gameOverEl) {
        gameOverEl.style.display = 'none';
      }
    }

    show() {
      if (this.hudEl) {
        this.hudEl.classList.add('is-active');
      }
    }

    hide() {
      if (this.hudEl) {
        this.hudEl.classList.remove('is-active');
      }
      this.hideGameOver();
      this.hideCountdown();
    }
  }

  // ============================================================================
  // INPUT HANDLER - Keyboard and touch controls
  // ============================================================================
  class InputHandler {
    constructor(ship) {
      this.ship = ship;
      this.keys = {};

      this.onKeyDown = this.onKeyDown.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);

      document.addEventListener('keydown', this.onKeyDown, true);
      document.addEventListener('keyup', this.onKeyUp, true);
    }

    onKeyDown(e) {
      this.keys[e.code] = true;
      this.updateShipInput();

      // Prevent default for game keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    }

    onKeyUp(e) {
      this.keys[e.code] = false;
      this.updateShipInput();
    }

    updateShipInput() {
      // Steering
      let steer = 0;
      if (this.keys['ArrowLeft'] || this.keys['KeyA']) steer -= 1;
      if (this.keys['ArrowRight'] || this.keys['KeyD']) steer += 1;
      this.ship.steerInput = steer;

      // Boost (W/Up triggers boost)
      this.ship.boostRequested = this.keys['ArrowUp'] || this.keys['KeyW'];

      // Braking
      this.ship.braking = this.keys['ArrowDown'] || this.keys['KeyS'];

      // Air braking (for drifting)
      this.ship.airBraking = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    }

    isRestartPressed() {
      return this.keys['Space'];
    }

    dispose() {
      document.removeEventListener('keydown', this.onKeyDown, true);
      document.removeEventListener('keyup', this.onKeyUp, true);
    }
  }

  // ============================================================================
  // RACER GAME - Main orchestrator
  // ============================================================================
  class RacerGame {
    constructor(THREE, scene, camera, renderer, gltfLoader) {
      this.THREE = THREE;
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.gltfLoader = gltfLoader;

      // Game state
      this.states = {
        INIT: 'init',
        COUNTDOWN: 'countdown',
        PLAYING: 'playing',
        GAME_OVER: 'gameover'
      };
      this.state = this.states.INIT;
      this.countdownTime = 3;

      // Core systems
      this.audioReactor = new AudioReactor();
      this.ship = null;
      this.track = null;
      this.collision = null;
      this.cameraController = null;
      this.particles = null;
      this.hud = null;
      this.input = null;

      // Game data
      this.score = 0;
      this.combo = 1;
      this.comboTimer = 0;
      this.distance = 0;

      // Lighting
      this.ambientLight = null;
      this.directionalLight = null;

      // Theme colors
      this.themeColors = { ...DEFAULT_TRACK_COLORS };

      // Visual style
      this.visualStyle = { ...DEFAULT_VISUAL_STYLE };

      // Sky mesh for gradient background
      this.skyMesh = null;

      // Restart debounce flag
      this.restartPending = false;

      this.initialized = false;
    }

    setThemeColors(colors, visualStyle, regenerateTrack = false) {
      // Merge with defaults
      if (colors) {
        this.themeColors = { ...DEFAULT_TRACK_COLORS, ...colors };
      }
      if (visualStyle) {
        this.visualStyle = { ...DEFAULT_VISUAL_STYLE, ...visualStyle };
      }

      // Update track generator colors and visual style
      if (this.track) {
        this.track.setThemeColors(this.themeColors, this.visualStyle);

        // Regenerate track with new colors if requested (for track switching)
        if (regenerateTrack && this.initialized) {
          this.track.reset();
          this.track.generateInitial(TRACK.visibleAhead);
          // Reset ship position to start of new track
          if (this.ship) {
            this.ship.reset();
          }
          if (this.cameraController) {
            this.cameraController.reset();
          }
          // Reset to countdown state for new track
          this.state = this.states.COUNTDOWN;
          this.countdownTime = 3;
          this.distance = 0;
        }
      }

      // Update fog
      if (this.scene && this.themeColors.fogColor !== undefined) {
        if (this.scene.fog) {
          this.scene.fog.color.setHex(this.themeColors.fogColor);
        } else {
          this.scene.fog = new this.THREE.FogExp2(this.themeColors.fogColor, 0.008);
        }
      }

      // Update ambient light
      if (this.ambientLight && this.themeColors.ambientLight !== undefined) {
        this.ambientLight.color.setHex(this.themeColors.ambientLight);
        if (this.themeColors.ambientIntensity !== undefined) {
          this.ambientLight.intensity = this.themeColors.ambientIntensity;
        }
      }

      // Update sky gradient if provided
      if (visualStyle && visualStyle.skyGradient) {
        this.updateSkyGradient(visualStyle.skyGradient);
      }

      // Update ambient particles if provided
      if (visualStyle && this.particles) {
        const particleColor = this.themeColors.wallAccent || 0xffffff;
        this.particles.setAmbientStyle(
          visualStyle.particleType || "sparks",
          particleColor,
          visualStyle.particleDensity || 0.4
        );
      }
    }

    updateSkyGradient(gradient) {
      // Create a gradient background using a shader or simple color
      if (this.scene && gradient && gradient.length >= 2) {
        // For now, use the darker gradient color as background
        this.scene.background = new this.THREE.Color(gradient[1]);
      }
    }

    init(initialColors, initialVisualStyle) {
      if (this.initialized) return;

      // Apply initial theme colors BEFORE creating track
      if (initialColors) {
        this.themeColors = { ...DEFAULT_TRACK_COLORS, ...initialColors };
      }
      if (initialVisualStyle) {
        this.visualStyle = { ...DEFAULT_VISUAL_STYLE, ...initialVisualStyle };
      }

      // Setup lighting (uses theme colors)
      this.setupLighting();

      // Create systems
      this.ship = new Ship(this.THREE, this.scene, this.gltfLoader);
      this.track = new TrackGenerator(this.THREE, this.scene);

      // Apply theme colors to track generator BEFORE generating
      this.track.setThemeColors(this.themeColors, this.visualStyle);

      this.collision = new CollisionSystem(this.THREE, this.ship, this.track);
      this.cameraController = new CameraController(this.THREE, this.camera, this.ship.mesh);
      this.particles = new ParticleManager(this.THREE, this.scene);
      this.hud = new HUD();
      this.input = new InputHandler(this.ship);

      // Apply ambient particle style
      if (this.visualStyle && this.particles) {
        const particleColor = this.themeColors.wallAccent || 0xffffff;
        this.particles.setAmbientStyle(
          this.visualStyle.particleType || "sparks",
          particleColor,
          this.visualStyle.particleDensity || 0.4
        );
      }

      // Generate initial track WITH theme colors applied
      this.track.generateInitial(TRACK.visibleAhead);

      // Start countdown
      this.state = this.states.COUNTDOWN;
      this.countdownTime = 3;

      this.hud.show();
      this.initialized = true;
    }

    setupLighting() {
      // Ambient light - uses theme colors
      const ambientColor = this.themeColors.ambientLight || 0x222244;
      const ambientIntensity = this.themeColors.ambientIntensity || 0.5;
      this.ambientLight = new this.THREE.AmbientLight(ambientColor, ambientIntensity);
      this.scene.add(this.ambientLight);

      // Directional light (sun)
      this.directionalLight = new this.THREE.DirectionalLight(0xffffff, 0.8);
      this.directionalLight.position.set(5, 10, 5);
      this.scene.add(this.directionalLight);

      // Fog for depth - uses theme colors
      const fogColor = this.themeColors.fogColor || 0x000011;
      this.scene.fog = new this.THREE.FogExp2(fogColor, 0.008);

      // Sky/background color - uses theme visual style
      if (this.visualStyle && this.visualStyle.skyGradient) {
        this.scene.background = new this.THREE.Color(this.visualStyle.skyGradient[1]);
      }
    }

    update(timestamp, dt, freqData) {
      if (!this.initialized) return;

      // Update audio analysis
      this.audioReactor.update(freqData, dt * 1000);

      switch (this.state) {
        case this.states.COUNTDOWN:
          this.updateCountdown(dt);
          break;

        case this.states.PLAYING:
          this.updatePlaying(dt);
          break;

        case this.states.GAME_OVER:
          this.updateGameOver(dt);
          break;
      }

      // Always update visuals
      this.particles.update(dt, this.ship.position.z, this.ship.speed, this.audioReactor);
      this.cameraController.update(dt, this.ship.speed / PHYSICS.maxSpeed, this.audioReactor);
      this.hud.update(this.score, this.ship.shield, this.ship.speed, this.combo, this.ship.boostCooldown);
    }

    updateCountdown(dt) {
      this.countdownTime -= dt;

      // Show countdown number
      this.hud.showCountdown(this.countdownTime);

      if (this.countdownTime <= -0.5) {
        // Give a moment for "GO!" to display
        this.state = this.states.PLAYING;
        this.hud.hideCountdown();
        this.hud.hideGameOver();
      }

      // Keep camera at starting position during countdown
      this.cameraController.update(dt, 0, this.audioReactor);
    }

    updatePlaying(dt) {
      // Update ship physics
      this.ship.update(dt, this.audioReactor);

      // Apply curved track following - pull ship toward track center
      const trackInfo = this.track.getTrackInfoAtZ(this.ship.position.z);
      if (trackInfo) {
        // Calculate offset from track center
        const offsetX = this.ship.position.x - trackInfo.centerX;

        // Gentle force pulling toward center (stronger when further off)
        // This keeps the ship on curved tracks without feeling restrictive
        const pullStrength = 0.15;
        const maxPull = 0.3;
        const pullForce = Math.max(-maxPull, Math.min(maxPull, -offsetX * pullStrength * dt * 60));
        this.ship.position.x += pullForce;

        // Optional: tilt ship to match track banking
        if (this.ship.mesh) {
          const targetBankTilt = trackInfo.bankAngle * 0.5; // Partial banking for feel
          this.ship.mesh.rotation.z = this.ship.roll + targetBankTilt;
        }
      }

      // Check collisions
      const collision = this.collision.check();
      if (collision.hit) {
        this.handleCollision(collision);
      }

      // Check boost pads
      if (this.track.checkBoostPads(this.ship.position)) {
        this.ship.applyBoost();
        this.addCombo(5);
      }

      // Update track generation
      this.track.update(this.ship.position.z, this.audioReactor);

      // Update score
      this.distance += this.ship.speed * dt;
      this.score = Math.floor(this.distance * 10 * this.combo);

      // Beat bonus
      if (this.audioReactor.beatDetected) {
        this.addCombo(1);
      }

      // Combo decay
      this.comboTimer -= dt;
      if (this.comboTimer <= 0 && this.combo > 1) {
        this.combo = Math.max(1, this.combo - 1);
        this.comboTimer = 2;
      }

      // Check game over
      if (this.ship.shield <= 0) {
        this.state = this.states.GAME_OVER;
        this.hud.showGameOver(this.score);
      }
    }

    updateGameOver(dt) {
      // Wait for restart input (only trigger on first press, not while held)
      const restartPressed = this.input.isRestartPressed();
      if (restartPressed && !this.restartPending) {
        this.restartPending = true;
        this.restart();
      } else if (!restartPressed) {
        this.restartPending = false;
      }

      // Slowly drift camera up
      this.camera.position.y += 0.02;
    }

    handleCollision(collision) {
      // Calculate damage (HexGL formula)
      const damage = this.collision.calculateDamage();
      this.ship.takeDamage(damage);

      // Apply repulsion force
      if (collision.left) {
        this.ship.repulsionForce.x = Math.min(PHYSICS.repulsionCap, this.ship.speed * PHYSICS.repulsionRatio);
        this.particles.emitSparks(this.ship.position, 1, 15);
      }
      if (collision.right) {
        this.ship.repulsionForce.x = -Math.min(PHYSICS.repulsionCap, this.ship.speed * PHYSICS.repulsionRatio);
        this.particles.emitSparks(this.ship.position, -1, 15);
      }
      if (collision.front) {
        this.ship.speed *= 0.3;
        this.ship.repulsionForce.z = -1;
      }

      // Speed reduction
      this.ship.speed *= PHYSICS.collisionSpeedDecrease;

      // Camera shake
      this.cameraController.triggerShake(damage * 3);

      // Reset combo
      this.combo = 1;
      this.comboTimer = 0;
    }

    addCombo(amount) {
      this.combo += amount;
      this.comboTimer = 3; // Reset combo timer
    }

    restart() {
      this.ship.reset();
      this.track.reset();
      this.track.generateInitial(TRACK.visibleAhead);
      this.cameraController.reset();

      this.score = 0;
      this.combo = 1;
      this.comboTimer = 0;
      this.distance = 0;

      this.state = this.states.COUNTDOWN;
      this.countdownTime = 3;

      this.hud.hideGameOver();
    }

    dispose() {
      if (this.ship) this.ship.dispose();
      if (this.track) this.track.dispose();
      if (this.particles) this.particles.dispose();
      if (this.input) this.input.dispose();
      if (this.hud) this.hud.hide();

      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.directionalLight) this.scene.remove(this.directionalLight);

      this.scene.fog = null;
      this.initialized = false;
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================
  window.AudioRacer = {
    instance: null,
    lastTime: 0,

    init: function(THREE, scene, camera, renderer, gltfLoader, initialColors, initialVisualStyle) {
      if (this.instance) {
        this.instance.dispose();
      }
      this.instance = new RacerGame(THREE, scene, camera, renderer, gltfLoader);
      this.instance.init(initialColors, initialVisualStyle);
      this.lastTime = 0;
      // Return AudioRacer itself so update() calls go through the proper wrapper
      return this;
    },

    update: function(timestamp, freqData, amplitude) {
      if (this.instance) {
        // Use performance.now() for reliable delta time calculation
        // The passed timestamp is scaled by effectiveSpeed which isn't suitable for physics
        const now = performance.now();
        let dt;
        if (this.lastTime === 0) {
          dt = 1 / 60; // First frame default
        } else {
          // Convert to seconds and clamp to prevent physics explosions
          dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) * 0.001));
        }
        this.lastTime = now;

        this.instance.update(timestamp, dt, freqData);
      }
    },

    dispose: function() {
      if (this.instance) {
        this.instance.dispose();
        this.instance = null;
      }
      this.lastTime = 0;
    },

    setThemeColors: function(colors, visualStyle, regenerateTrack = false) {
      if (this.instance) {
        this.instance.setThemeColors(colors, visualStyle, regenerateTrack);
      }
    },

    restart: function() {
      if (this.instance) {
        this.instance.restart();
      }
    },

    getShipPosition: function() {
      if (this.instance && this.instance.ship) {
        return this.instance.ship.position;
      }
      return null;
    },

    getShipSpeed: function() {
      if (this.instance && this.instance.ship) {
        return this.instance.ship.speed;
      }
      return 0;
    }
  };

})();
