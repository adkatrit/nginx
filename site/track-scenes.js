/*
  TRACK-SPECIFIC SCENE BUILDERS
  =============================
  Each track gets a completely unique visual experience.
  These builders create custom Three.js scenes with bespoke effects.
*/

window.TrackScenes = (function() {
  "use strict";

  // Shared utilities
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Get effective stem energy respecting enabled/threshold/gain overrides
  function getEffectiveStemEnergy(stemId, rawEnergy) {
    if (!window.getStemEffectOverride) return rawEnergy;
    const override = window.getStemEffectOverride(stemId);
    if (!override.enabled) return 0;
    const threshold = override.threshold || 0;
    if (rawEnergy < threshold) return 0;
    // Remap from threshold-1 to 0-1, then apply gain
    return ((rawEnergy - threshold) / (1 - threshold)) * (override.gain || 1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA TIDE - Underwater bioluminescent data ocean with coral towers
  // ═══════════════════════════════════════════════════════════════════════════
  function buildDataTide(THREE, scene, audioData) {
    const group = new THREE.Group();
    const particles = [];
    const currents = [];
    const lights = [];

    // Deep ocean fog - darker, more mysterious
    scene.fog = new THREE.FogExp2(0x000810, 0.012);

    // CONTINUOUSLY GENERATED CORAL TOWERS
    const corals = [];
    const coralGroup = new THREE.Group();
    const CORAL_SPACING = 8;
    const CORALS_AHEAD = 25;
    const CORALS_BEHIND = 8;
    let nextCoralZ = -50;
    let coralSideToggle = 0;

    // Helper: Create a single coral at given Z
    function spawnCoral(z) {
      const height = 12 + Math.random() * 30;
      const baseRadius = 0.5 + Math.random() * 1;
      const segments = 6 + Math.floor(Math.random() * 4);

      const coralPiece = new THREE.Group();

      const stemGeom = new THREE.CylinderGeometry(baseRadius * 0.3, baseRadius, height, segments);
      const hue = 0.5 + Math.random() * 0.2;
      const stemMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.3),
        roughness: 0.6,
        metalness: 0.3,
        emissive: new THREE.Color().setHSL(hue, 1, 0.3),
        emissiveIntensity: 0.2 + Math.random() * 0.2
      });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.y = height / 2;
      coralPiece.add(stem);

      const tipGeom = new THREE.SphereGeometry(baseRadius * 0.8, 8, 8);
      const tipMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.6),
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const tip = new THREE.Mesh(tipGeom, tipMat);
      tip.position.y = height;
      coralPiece.add(tip);

      const side = coralSideToggle % 2 === 0 ? -1 : 1;
      coralSideToggle++;
      const xOffset = 10 + Math.random() * 20;
      coralPiece.position.set(
        side * xOffset,
        -3,
        z + Math.random() * 5
      );
      coralPiece.rotation.z = (Math.random() - 0.5) * 0.2;
      coralPiece.userData = {
        baseHeight: height,
        baseEmissive: stemMat.emissiveIntensity,
        phase: Math.random() * Math.PI * 2,
        stem: stem,
        tip: tip,
        stemMat: stemMat,
        tipMat: tipMat,
        spawnZ: z
      };
      coralGroup.add(coralPiece);
      corals.push(coralPiece);
    }

    // Initial spawn
    for (let z = -50; z < 150; z += CORAL_SPACING) {
      spawnCoral(z);
      nextCoralZ = z + CORAL_SPACING;
    }
    scene.add(coralGroup);

    let lastDrumPulse = 0;

    // Dramatic underwater lighting rig
    const mainLight = new THREE.DirectionalLight(0x0066ff, 0.3);
    mainLight.position.set(0, 20, 0);
    group.add(mainLight);

    // Volumetric god rays from above (multiple spotlights)
    for (let i = 0; i < 4; i++) {
      const spotlight = new THREE.SpotLight(0x00aaff, 2, 50, Math.PI / 8, 0.5, 1);
      spotlight.position.set(
        (Math.random() - 0.5) * 20,
        15,
        (Math.random() - 0.5) * 20
      );
      spotlight.target.position.set(
        spotlight.position.x + (Math.random() - 0.5) * 10,
        -10,
        spotlight.position.z + (Math.random() - 0.5) * 10
      );
      group.add(spotlight);
      group.add(spotlight.target);
      lights.push({ light: spotlight, phase: Math.random() * Math.PI * 2 });
    }

    // Bioluminescent point lights (floating orbs of light)
    const bioLights = [];
    for (let i = 0; i < 8; i++) {
      const pointLight = new THREE.PointLight(
        new THREE.Color().setHSL(0.5 + Math.random() * 0.15, 1, 0.5),
        1,
        15
      );
      pointLight.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 30
      );
      group.add(pointLight);
      bioLights.push({
        light: pointLight,
        basePos: pointLight.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4
      });
    }

    // Bioluminescent particle field
    const particleCount = 3000;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      // Bioluminescent colors: cyan, blue, green, occasional pink
      const hue = Math.random() > 0.9 ? 0.85 : 0.45 + Math.random() * 0.2;
      const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.4);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.05 + Math.random() * 0.25;
      velocities.push({
        x: (Math.random() - 0.5) * 0.015,
        y: (Math.random() - 0.5) * 0.008,
        z: (Math.random() - 0.5) * 0.015,
        phase: Math.random() * Math.PI * 2
      });
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    group.add(particleSystem);

    // Caustic light rays (light shafts from above)
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const rayGeom = new THREE.CylinderGeometry(0.05, 3, 30, 6, 1, true);
      const rayMat = new THREE.MeshBasicMaterial({
        color: 0x00ddff,
        transparent: true,
        opacity: 0.015,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ray = new THREE.Mesh(rayGeom, rayMat);
      ray.position.set(
        (Math.random() - 0.5) * 40,
        12,
        (Math.random() - 0.5) * 40
      );
      ray.rotation.x = Math.PI;
      ray.userData = { phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.5 };
      group.add(ray);
      currents.push(ray);
    }

    // Floating data streams (ribbons)
    const ribbonCount = 8;
    for (let i = 0; i < ribbonCount; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-25 + Math.random() * 10, Math.random() * 12 - 6, -15),
        new THREE.Vector3(-8 + Math.random() * 5, Math.random() * 12 - 6, Math.random() * 10 - 5),
        new THREE.Vector3(8 + Math.random() * 5, Math.random() * 12 - 6, Math.random() * 10 - 5),
        new THREE.Vector3(25 + Math.random() * 10, Math.random() * 12 - 6, 15)
      ]);
      const tubeGeom = new THREE.TubeGeometry(curve, 64, 0.03, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.5 + Math.random() * 0.15, 1, 0.6),
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      tube.userData = { offset: Math.random() * 100 };
      group.add(tube);
    }

    scene.add(group);

    return {
      group,
      stemEffects: {
        drums: { target: 'corals', effect: 'scale pulse', color: '#00ffaa' },
        bass: { target: 'caustic rays', effect: 'opacity wave', color: '#0066ff' },
        vocals: { target: 'fog + bio lights', effect: 'atmosphere glow', color: '#44ffff' },
        synth: { target: 'particles', effect: 'swarm speed', color: '#00ccff' },
        guitar: { target: 'spotlights', effect: 'beam intensity', color: '#88ffdd' }
      },
      update(time, freq, amplitude, shipPos, shipSpeed, audioExtra) {
        // STRICT 1:1 STEM MAPPING - respects enabled/threshold/gain overrides
        const drumEnergy = getEffectiveStemEnergy('drums', audioExtra?.drums?.energy || 0);
        const bassEnergy = getEffectiveStemEnergy('bass', audioExtra?.bass?.energy || 0);
        const vocalEnergy = getEffectiveStemEnergy('vocals', audioExtra?.vocals?.energy || 0);
        const synthEnergy = getEffectiveStemEnergy('synth', audioExtra?.synth?.energy || 0);
        const guitarEnergy = getEffectiveStemEnergy('guitar', audioExtra?.guitar?.energy || 0);

        // Smooth drum pulse for coral animations
        lastDrumPulse = lastDrumPulse * 0.75 + drumEnergy * 0.25;

        const shipZ = shipPos ? shipPos.z : 0;

        // CONTINUOUS GENERATION: Spawn new corals ahead, remove behind
        const coralSpawnAheadZ = shipZ + CORALS_AHEAD * CORAL_SPACING;
        const coralCleanupZ = shipZ - CORALS_BEHIND * CORAL_SPACING;

        while (nextCoralZ < coralSpawnAheadZ) {
          spawnCoral(nextCoralZ);
          nextCoralZ += CORAL_SPACING;
        }

        for (let i = corals.length - 1; i >= 0; i--) {
          const c = corals[i];
          if (c.userData.spawnZ < coralCleanupZ) {
            coralGroup.remove(c);
            c.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            corals.splice(i, 1);
          }
        }

        // DRUMS → Corals pulse and glow
        corals.forEach(coral => {
          const data = coral.userData;
          if (data.stem && data.tip) {
            const drumScale = 1 + lastDrumPulse * 1.5;
            coral.scale.set(1 + lastDrumPulse * 0.5, drumScale, 1 + lastDrumPulse * 0.5);
            data.stemMat.emissiveIntensity = data.baseEmissive + lastDrumPulse * 2;
            data.tipMat.opacity = 0.7 + lastDrumPulse * 0.3;
          }
        });

        // VOCALS → Background atmosphere (bio lights + fog density feel)
        bioLights.forEach((bl, i) => {
          bl.light.position.x = bl.basePos.x + Math.sin(time * bl.speed + bl.phase) * 4;
          bl.light.position.y = bl.basePos.y + Math.cos(time * bl.speed * 0.7 + bl.phase) * 3;
          bl.light.position.z = bl.basePos.z + Math.sin(time * bl.speed * 0.5 + bl.phase * 2) * 4;
          bl.light.intensity = 1 + vocalEnergy * 6 + Math.sin(time * 2 + bl.phase) * 0.5;
        });

        // GUITAR → Spotlights beam intensity
        lights.forEach((l, i) => {
          l.light.intensity = 2 + guitarEnergy * 10;
          l.light.angle = Math.PI / 8 + Math.sin(time * 0.5 + l.phase) * 0.15;
        });

        // SYNTH → Particles swarm speed
        const pos = particleGeom.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const v = velocities[i];
          const idx = i * 3;
          const synthBoost = 1 + synthEnergy * 3;
          pos[idx] += (v.x + Math.sin(time * 0.5 + v.phase) * 0.01) * synthBoost;
          pos[idx + 1] += (v.y + Math.cos(time * 0.3 + v.phase) * 0.006) * synthBoost;
          pos[idx + 2] += (v.z + Math.sin(time * 0.4 + v.phase) * 0.01) * synthBoost;

          if (pos[idx] > 25) pos[idx] = -25;
          if (pos[idx] < -25) pos[idx] = 25;
          if (pos[idx + 1] > 12) pos[idx + 1] = -12;
          if (pos[idx + 1] < -12) pos[idx + 1] = 12;
          if (pos[idx + 2] > 25) pos[idx + 2] = -25;
          if (pos[idx + 2] < -25) pos[idx + 2] = 25;
        }
        particleGeom.attributes.position.needsUpdate = true;
        particleMat.opacity = 0.7 + synthEnergy * 0.3;
        particleMat.size = 0.2 + synthEnergy * 0.3;

        // BASS → Caustic rays opacity
        currents.forEach((ray, i) => {
          ray.material.opacity = 0.02 + bassEnergy * 0.12;
          ray.scale.x = 1 + Math.sin(time * ray.userData.speed + ray.userData.phase) * 0.5 + bassEnergy * 0.5;
          ray.scale.z = ray.scale.x;
          ray.position.x += Math.sin(time * 0.2 + ray.userData.phase) * 0.03;
        });

        // Follow ship Z position
        const zoomOscillation = Math.sin(time * 0.15) * 4 + Math.sin(time * 0.08) * 2;
        group.position.z = shipZ + zoomOscillation;

        // Gentle vertical drift
        group.position.y = Math.sin(time * 0.1) * 0.5;
      },
      dispose() {
        scene.remove(coralGroup);
        coralGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BEAST MODE - Aggressive geometric shards and lightning
  // ═══════════════════════════════════════════════════════════════════════════
  function buildBeastMode(THREE, scene, audioData) {
    const group = new THREE.Group();
    const shards = [];
    const lightning = [];

    // Dark aggressive atmosphere
    scene.fog = new THREE.Fog(0x100000, 5, 40);

    // Floating aggressive shards
    const shardCount = 50;
    for (let i = 0; i < shardCount; i++) {
      const geom = new THREE.TetrahedronGeometry(0.3 + Math.random() * 0.5, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff2200,
        emissive: 0x440000,
        roughness: 0.3,
        metalness: 0.8,
        flatShading: true
      });
      const shard = new THREE.Mesh(geom, mat);
      shard.position.set(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 25
      );
      shard.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      shard.userData = {
        basePos: shard.position.clone(),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        phase: Math.random() * Math.PI * 2,
        explodeDir: new THREE.Vector3(
          (Math.random() - 0.5),
          (Math.random() - 0.5),
          (Math.random() - 0.5)
        ).normalize()
      };
      group.add(shard);
      shards.push(shard);
    }

    // Lightning bolt creator
    function createLightning() {
      const points = [];
      let pos = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        10,
        (Math.random() - 0.5) * 10
      );
      points.push(pos.clone());

      for (let i = 0; i < 8; i++) {
        pos = pos.clone();
        pos.x += (Math.random() - 0.5) * 4;
        pos.y -= 2 + Math.random() * 2;
        pos.z += (Math.random() - 0.5) * 4;
        points.push(pos.clone());
      }

      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 1,
        linewidth: 2
      });
      const bolt = new THREE.Line(geom, mat);
      bolt.userData = { life: 1, decay: 0.05 + Math.random() * 0.05 };
      return bolt;
    }

    // Dramatic red/orange lighting rig
    const mainSpot = new THREE.SpotLight(0xff2200, 5, 60, Math.PI / 4, 0.3, 1);
    mainSpot.position.set(0, 15, 10);
    mainSpot.target.position.set(0, 0, 0);
    group.add(mainSpot);
    group.add(mainSpot.target);

    // Side accent lights
    const light1 = new THREE.PointLight(0xff4400, 3, 35);
    light1.position.set(8, 5, 8);
    group.add(light1);

    const light2 = new THREE.PointLight(0xff0000, 2.5, 30);
    light2.position.set(-8, -3, -8);
    group.add(light2);

    // Flicker lights for intensity
    const flickerLight = new THREE.PointLight(0xffaa00, 0, 20);
    flickerLight.position.set(0, 0, 5);
    group.add(flickerLight);

    // Rim light from behind
    const rimLight = new THREE.DirectionalLight(0xff6600, 1);
    rimLight.position.set(0, 5, -15);
    group.add(rimLight);

    scene.add(group);

    let lastBassHit = 0;
    let screenShake = 0;
    let flickerIntensity = 0;

    return {
      group,
      update(time, freq, amplitude, shipPos, shipSpeed) {
        const bassEnergy = freq ? (freq[0] + freq[1] + freq[2] + freq[3]) / 4 / 255 : 0;
        const highEnergy = freq ? (freq[80] + freq[100] + freq[120]) / 3 / 255 : 0;
        const midEnergy = freq ? (freq[20] + freq[40] + freq[60]) / 3 / 255 : 0;

        // Follow the ship's Z position
        const shipZ = shipPos ? shipPos.z : 0;

        // Detect bass hits for explosions
        if (bassEnergy > 0.7 && time - lastBassHit > 0.15) {
          lastBassHit = time;
          screenShake = 0.6;
          flickerIntensity = 8;

          // Spawn lightning on big hits
          if (bassEnergy > 0.75) {
            const bolt = createLightning();
            group.add(bolt);
            lightning.push(bolt);
          }
        }

        // Decay effects
        screenShake *= 0.88;
        flickerIntensity *= 0.85;

        // Animate shards
        shards.forEach((shard, i) => {
          shard.rotation.x += shard.userData.rotSpeed.x * (1 + bassEnergy * 4);
          shard.rotation.y += shard.userData.rotSpeed.y * (1 + bassEnergy * 4);
          shard.rotation.z += shard.userData.rotSpeed.z * (1 + bassEnergy * 4);

          const explodeFactor = bassEnergy > 0.5 ? (bassEnergy - 0.5) * 6 : 0;
          shard.position.copy(shard.userData.basePos);
          shard.position.addScaledVector(shard.userData.explodeDir, explodeFactor * 2.5);

          shard.material.emissiveIntensity = 0.3 + bassEnergy * 3;
          shard.position.y += Math.sin(time * 2 + shard.userData.phase) * 0.02;
        });

        // Update lightning
        for (let i = lightning.length - 1; i >= 0; i--) {
          const bolt = lightning[i];
          bolt.userData.life -= bolt.userData.decay;
          bolt.material.opacity = bolt.userData.life;

          if (bolt.userData.life <= 0) {
            group.remove(bolt);
            bolt.geometry.dispose();
            bolt.material.dispose();
            lightning.splice(i, 1);
          }
        }

        // Dramatic light pulsing
        mainSpot.intensity = 3 + bassEnergy * 8;
        mainSpot.angle = Math.PI / 4 + bassEnergy * 0.2;
        light1.intensity = 2 + bassEnergy * 5 + Math.random() * flickerIntensity * 0.5;
        light2.intensity = 1.5 + highEnergy * 4;
        flickerLight.intensity = flickerIntensity + bassEnergy * 3;
        rimLight.intensity = 0.5 + midEnergy * 2;

        // Color shift on intensity
        const hue = 0.02 + bassEnergy * 0.05;
        mainSpot.color.setHSL(hue, 1, 0.5);

        // Camera shake effect + follow ship Z
        group.position.set(
          (Math.random() - 0.5) * screenShake * 1.5,
          (Math.random() - 0.5) * screenShake * 1.5,
          shipZ + (Math.random() - 0.5) * screenShake
        );
      },
      dispose() {
        lightning.forEach(bolt => {
          bolt.geometry.dispose();
          bolt.material.dispose();
        });
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOFT SYSTEMS - Ethereal clouds and gentle organic shapes
  // ═══════════════════════════════════════════════════════════════════════════
  function buildSoftSystems(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Soft foggy atmosphere
    scene.fog = new THREE.FogExp2(0x151520, 0.015);

    // === CONTINUOUSLY GENERATED FLOATING CLOUDS ===
    const clouds = [];
    const cloudGroup = new THREE.Group();
    const CLOUD_SPACING = 12;
    const CLOUDS_AHEAD = 20;
    const CLOUDS_BEHIND = 8;
    let nextCloudZ = -50;
    let cloudSideToggle = 0;

    function spawnCloud(z) {
      const cloudPiece = new THREE.Group();
      const numSpheres = 3 + Math.floor(Math.random() * 4);
      const baseRadius = 1 + Math.random() * 2;
      const hue = 0.25 + Math.random() * 0.15; // Green-cyan range

      for (let i = 0; i < numSpheres; i++) {
        const radius = baseRadius * (0.4 + Math.random() * 0.6);
        const geom = new THREE.SphereGeometry(radius, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(hue, 0.4, 0.6),
          transparent: true,
          opacity: 0.12 + Math.random() * 0.1,
          roughness: 1,
          metalness: 0,
          emissive: new THREE.Color().setHSL(hue, 0.5, 0.2),
          emissiveIntensity: 0.3
        });
        const sphere = new THREE.Mesh(geom, mat);
        sphere.position.set(
          (Math.random() - 0.5) * baseRadius * 2,
          (Math.random() - 0.5) * baseRadius,
          (Math.random() - 0.5) * baseRadius
        );
        cloudPiece.add(sphere);
      }

      // Position cloud to sides of path
      const side = cloudSideToggle % 2 === 0 ? -1 : 1;
      cloudSideToggle++;
      const xOffset = 8 + Math.random() * 15;
      const yOffset = -2 + Math.random() * 12;
      cloudPiece.position.set(side * xOffset, yOffset, z);
      cloudPiece.userData = {
        spawnZ: z,
        phase: Math.random() * Math.PI * 2,
        floatSpeed: 0.3 + Math.random() * 0.3,
        baseY: yOffset
      };
      cloudGroup.add(cloudPiece);
      clouds.push(cloudPiece);
    }

    // Initial cloud spawn
    for (let z = -50; z < 180; z += CLOUD_SPACING) {
      spawnCloud(z);
      nextCloudZ = z + CLOUD_SPACING;
    }
    scene.add(cloudGroup);

    // === CONTINUOUSLY GENERATED SOFT PILLARS ===
    const pillars = [];
    const pillarGroup = new THREE.Group();
    const PILLAR_SPACING = 8;
    const PILLARS_AHEAD = 25;
    const PILLARS_BEHIND = 8;
    let nextPillarZ = -40;
    let pillarSideToggle = 0;

    function spawnPillar(z) {
      const height = 8 + Math.random() * 20;
      const radius = 0.3 + Math.random() * 0.5;
      const hue = 0.3 + Math.random() * 0.1;

      const geom = new THREE.CylinderGeometry(radius * 0.7, radius, height, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.3, 0.5),
        transparent: true,
        opacity: 0.25,
        roughness: 0.8,
        metalness: 0.1,
        emissive: new THREE.Color().setHSL(hue, 0.6, 0.3),
        emissiveIntensity: 0.2
      });
      const pillar = new THREE.Mesh(geom, mat);

      const side = pillarSideToggle % 2 === 0 ? -1 : 1;
      pillarSideToggle++;
      const xOffset = 6 + Math.random() * 12;
      pillar.position.set(side * xOffset, height / 2 - 5, z);
      pillar.userData = {
        spawnZ: z,
        baseEmissive: mat.emissiveIntensity,
        height: height,
        mat: mat
      };
      pillarGroup.add(pillar);
      pillars.push(pillar);

      // Add glowing orb at top
      const orbGeom = new THREE.SphereGeometry(radius * 1.5, 12, 12);
      const orbMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.6),
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });
      const orb = new THREE.Mesh(orbGeom, orbMat);
      orb.position.set(side * xOffset, height - 4, z);
      orb.userData = { mat: orbMat, phase: Math.random() * Math.PI * 2 };
      pillarGroup.add(orb);
      pillars.push(orb);
    }

    for (let z = -40; z < 160; z += PILLAR_SPACING) {
      spawnPillar(z);
      nextPillarZ = z + PILLAR_SPACING;
    }
    scene.add(pillarGroup);

    // Gentle particle dust (2000 particles)
    const dustCount = 2000;
    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 60;
      dustPos[i * 3 + 1] = Math.random() * 25 - 5;
      dustPos[i * 3 + 2] = Math.random() * 200 - 50;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xaaffcc,
      size: 0.08,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0x303050, 0.6);
    group.add(ambientLight);

    // Dynamic lights that respond to audio
    const vocalLight = new THREE.PointLight(0x88ffaa, 1, 40);
    vocalLight.position.set(0, 8, 0);
    group.add(vocalLight);

    const bassLight = new THREE.PointLight(0x4488ff, 0.5, 30);
    bassLight.position.set(0, -3, 0);
    group.add(bassLight);

    scene.add(group);

    let lastDrumPulse = 0;

    return {
      group,
      // STRICT 1:1 stem-to-effect mapping
      stemEffects: {
        drums: { target: 'pillars', effect: 'emissive pulse', color: '#88ffaa' },
        bass: { target: 'clouds', effect: 'breathing scale', color: '#4488ff' },
        vocals: { target: 'atmosphere lights', effect: 'background glow', color: '#aaffcc' },
        synth: { target: 'dust particles', effect: 'opacity', color: '#66ffbb' },
        guitar: { target: 'orbs', effect: 'brightness', color: '#ffaa66' }
      },
      update(time, freq, amplitude, shipPos, shipSpeed, stemData) {
        const shipZ = shipPos ? shipPos.z : 0;

        // STRICT 1:1 STEM MAPPING - respects enabled/threshold/gain overrides
        const drumsEnergy = getEffectiveStemEnergy('drums', stemData?.drums?.energy || 0);
        const bassEnergy = getEffectiveStemEnergy('bass', stemData?.bass?.energy || 0);
        const vocalsEnergy = getEffectiveStemEnergy('vocals', stemData?.vocals?.energy || 0);
        const synthEnergy = getEffectiveStemEnergy('synth', stemData?.synth?.energy || 0);
        const guitarEnergy = getEffectiveStemEnergy('guitar', stemData?.guitar?.energy || 0);

        // Drum pulse detection
        if (drumsEnergy > 0.6 && time - lastDrumPulse > 0.15) {
          lastDrumPulse = time;
        }
        const drumPulse = Math.max(0, 1 - (time - lastDrumPulse) * 4);

        // === CONTINUOUS CLOUD GENERATION ===
        const cloudSpawnZ = shipZ + CLOUDS_AHEAD * CLOUD_SPACING;
        const cloudCleanZ = shipZ - CLOUDS_BEHIND * CLOUD_SPACING;

        while (nextCloudZ < cloudSpawnZ) {
          spawnCloud(nextCloudZ);
          nextCloudZ += CLOUD_SPACING;
        }

        // BASS → Clouds breathing scale
        for (let i = clouds.length - 1; i >= 0; i--) {
          const cloud = clouds[i];
          if (cloud.userData.spawnZ < cloudCleanZ) {
            cloudGroup.remove(cloud);
            cloud.traverse(c => {
              if (c.geometry) c.geometry.dispose();
              if (c.material) c.material.dispose();
            });
            clouds.splice(i, 1);
          } else {
            const breathe = 1 + Math.sin(time * cloud.userData.floatSpeed + cloud.userData.phase) * 0.15;
            const bassBreath = 1 + bassEnergy * 0.5;
            cloud.scale.setScalar(breathe * bassBreath);
            cloud.position.y = cloud.userData.baseY + Math.sin(time * 0.5 + cloud.userData.phase) * 1.5;
            cloud.traverse(c => {
              if (c.material && c.material.opacity !== undefined) {
                c.material.opacity = 0.1 + bassEnergy * 0.15;
              }
            });
          }
        }

        // === CONTINUOUS PILLAR GENERATION ===
        const pillarSpawnZ = shipZ + PILLARS_AHEAD * PILLAR_SPACING;
        const pillarCleanZ = shipZ - PILLARS_BEHIND * PILLAR_SPACING;

        while (nextPillarZ < pillarSpawnZ) {
          spawnPillar(nextPillarZ);
          nextPillarZ += PILLAR_SPACING;
        }

        // DRUMS → Pillars emissive pulse, GUITAR → Orbs brightness
        for (let i = pillars.length - 1; i >= 0; i--) {
          const obj = pillars[i];
          if (obj.userData.spawnZ < pillarCleanZ) {
            pillarGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            pillars.splice(i, 1);
          } else if (obj.userData.mat && obj.userData.baseEmissive !== undefined) {
            obj.userData.mat.emissiveIntensity = obj.userData.baseEmissive + drumPulse * 0.8;
          } else if (obj.userData.phase !== undefined && obj.userData.mat) {
            const pulse = Math.sin(time * 2 + obj.userData.phase) * 0.2;
            obj.userData.mat.opacity = 0.3 + pulse + guitarEnergy * 0.5;
          }
        }

        // SYNTH → Dust particles opacity
        dust.position.z = shipZ;
        dustMat.opacity = 0.3 + synthEnergy * 0.5;

        // VOCALS → Background atmosphere lights
        vocalLight.intensity = 0.8 + vocalsEnergy * 2;
        vocalLight.position.z = shipZ;
        bassLight.intensity = 0.3 + vocalsEnergy * 1.5;
        bassLight.position.z = shipZ;

        group.position.z = shipZ;
      },
      dispose() {
        clouds.forEach(c => {
          c.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        });
        pillars.forEach(p => {
          if (p.geometry) p.geometry.dispose();
          if (p.material) p.material.dispose();
        });
        scene.remove(cloudGroup);
        scene.remove(pillarGroup);
        scene.remove(dust);
        dustGeom.dispose();
        dustMat.dispose();
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DREAMS BLEED INTO DASHBOARDS - Glitched reality with HUD elements
  // ═══════════════════════════════════════════════════════════════════════════
  function buildDreamsDashboards(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Glitchy fog
    scene.fog = new THREE.Fog(0x0a0410, 5, 60);

    // === CONTINUOUSLY GENERATED HOLOGRAPHIC BILLBOARDS ===
    const billboards = [];
    const billboardGroup = new THREE.Group();
    const BILLBOARD_SPACING = 15;
    const BILLBOARDS_AHEAD = 18;
    const BILLBOARDS_BEHIND = 6;
    let nextBillboardZ = -40;
    let billboardSideToggle = 0;

    function spawnBillboard(z) {
      const width = 4 + Math.random() * 6;
      const height = 3 + Math.random() * 4;
      const hue = Math.random();

      // Main billboard panel
      const panelGeom = new THREE.PlaneGeometry(width, height);
      const panelMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.4),
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const panel = new THREE.Mesh(panelGeom, panelMat);

      // Glowing border
      const borderGeom = new THREE.EdgesGeometry(panelGeom);
      const borderMat = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.7),
        transparent: true,
        opacity: 0.8
      });
      const border = new THREE.LineSegments(borderGeom, borderMat);
      panel.add(border);

      // Scan line effect
      const scanGeom = new THREE.PlaneGeometry(width * 0.95, 0.05);
      const scanMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });
      const scanLine = new THREE.Mesh(scanGeom, scanMat);
      scanLine.position.z = 0.01;
      panel.add(scanLine);

      const side = billboardSideToggle % 2 === 0 ? -1 : 1;
      billboardSideToggle++;
      const xOffset = 12 + Math.random() * 10;
      const yOffset = 2 + Math.random() * 8;
      panel.position.set(side * xOffset, yOffset, z);
      panel.rotation.y = side * -0.3;

      panel.userData = {
        spawnZ: z,
        hue: hue,
        scanLine: scanLine,
        scanY: -height / 2,
        scanSpeed: 0.05 + Math.random() * 0.08,
        height: height,
        panelMat: panelMat,
        borderMat: borderMat
      };
      billboardGroup.add(panel);
      billboards.push(panel);
    }

    for (let z = -40; z < 180; z += BILLBOARD_SPACING) {
      spawnBillboard(z);
      nextBillboardZ = z + BILLBOARD_SPACING;
    }
    scene.add(billboardGroup);

    // === CONTINUOUSLY GENERATED DATA PILLARS ===
    const dataPillars = [];
    const pillarGroup = new THREE.Group();
    const PILLAR_SPACING = 10;
    const PILLARS_AHEAD = 20;
    const PILLARS_BEHIND = 6;
    let nextPillarZ = -30;
    let pillarSideToggle = 0;

    function spawnDataPillar(z) {
      const pillarPiece = new THREE.Group();
      const height = 15 + Math.random() * 25;
      const radius = 0.3 + Math.random() * 0.4;

      // Main pillar (wireframe)
      const pillarGeom = new THREE.CylinderGeometry(radius, radius * 1.5, height, 6);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.y = height / 2 - 5;
      pillarPiece.add(pillar);

      // Data rings traveling up the pillar
      const numRings = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numRings; i++) {
        const ringGeom = new THREE.RingGeometry(radius * 1.2, radius * 1.8, 6);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.7, 1, 0.5),
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -5 + (i / numRings) * height;
        ring.userData = { speed: 0.1 + Math.random() * 0.15, maxY: height - 5, minY: -5 };
        pillarPiece.add(ring);
      }

      const side = pillarSideToggle % 2 === 0 ? -1 : 1;
      pillarSideToggle++;
      const xOffset = 6 + Math.random() * 8;
      pillarPiece.position.set(side * xOffset, 0, z);
      pillarPiece.userData = {
        spawnZ: z,
        pillarMat: pillarMat,
        height: height
      };
      pillarGroup.add(pillarPiece);
      dataPillars.push(pillarPiece);
    }

    for (let z = -30; z < 150; z += PILLAR_SPACING) {
      spawnDataPillar(z);
      nextPillarZ = z + PILLAR_SPACING;
    }
    scene.add(pillarGroup);

    // HUD ring elements (follow camera)
    const rings = [];
    for (let i = 0; i < 5; i++) {
      const ringGeom = new THREE.RingGeometry(2 + i * 1.5, 2.1 + i * 1.5, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.8 + i * 0.05, 1, 0.5),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.z = -5 - i * 2;
      ring.userData = { baseZ: ring.position.z, rotSpeed: 0.01 * (i % 2 === 0 ? 1 : -1), mat: ringMat };
      group.add(ring);
      rings.push(ring);
    }

    // Floating glitch particles (1500)
    const glitchCount = 1500;
    const glitchGeom = new THREE.BufferGeometry();
    const glitchPos = new Float32Array(glitchCount * 3);
    const glitchColors = new Float32Array(glitchCount * 3);
    for (let i = 0; i < glitchCount; i++) {
      glitchPos[i * 3] = (Math.random() - 0.5) * 50;
      glitchPos[i * 3 + 1] = Math.random() * 20 - 5;
      glitchPos[i * 3 + 2] = Math.random() * 200 - 50;
      const hue = Math.random() * 0.3 + 0.7; // Magenta to cyan range
      const col = new THREE.Color().setHSL(hue, 1, 0.6);
      glitchColors[i * 3] = col.r;
      glitchColors[i * 3 + 1] = col.g;
      glitchColors[i * 3 + 2] = col.b;
    }
    glitchGeom.setAttribute('position', new THREE.BufferAttribute(glitchPos, 3));
    glitchGeom.setAttribute('color', new THREE.BufferAttribute(glitchColors, 3));
    const glitchMat = new THREE.PointsMaterial({
      size: 0.12,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    const glitchParticles = new THREE.Points(glitchGeom, glitchMat);
    scene.add(glitchParticles);

    // Cyberpunk lighting
    const magentaSpot = new THREE.SpotLight(0xff00ff, 4, 50, Math.PI / 5, 0.5, 1);
    magentaSpot.position.set(8, 10, 0);
    group.add(magentaSpot);

    const cyanSpot = new THREE.SpotLight(0x00ffff, 4, 50, Math.PI / 5, 0.5, 1);
    cyanSpot.position.set(-8, 10, 0);
    group.add(cyanSpot);

    const strobeLight = new THREE.PointLight(0xffffff, 0, 40);
    group.add(strobeLight);

    scene.add(group);

    let glitchIntensity = 0;
    let lastDrumHit = 0;

    return {
      group,
      // STRICT 1:1 stem-to-effect mapping
      stemEffects: {
        drums: { target: 'HUD rings', effect: 'glitch displacement', color: '#ff00ff' },
        bass: { target: 'billboards', effect: 'brightness', color: '#00ffff' },
        vocals: { target: 'strobe + spots', effect: 'background atmosphere', color: '#ffffff' },
        synth: { target: 'data pillars', effect: 'ring speed', color: '#ff00aa' },
        guitar: { target: 'particles', effect: 'color shift', color: '#ffff00' }
      },
      update(time, freq, amplitude, shipPos, shipSpeed, stemData) {
        const shipZ = shipPos ? shipPos.z : 0;

        // STRICT 1:1 STEM MAPPING - respects enabled/threshold/gain overrides
        const drumsEnergy = getEffectiveStemEnergy('drums', stemData?.drums?.energy || 0);
        const bassEnergy = getEffectiveStemEnergy('bass', stemData?.bass?.energy || 0);
        const vocalsEnergy = getEffectiveStemEnergy('vocals', stemData?.vocals?.energy || 0);
        const synthEnergy = getEffectiveStemEnergy('synth', stemData?.synth?.energy || 0);
        const guitarEnergy = getEffectiveStemEnergy('guitar', stemData?.guitar?.energy || 0);

        // Drum hit detection for glitch
        if (drumsEnergy > 0.6 && time - lastDrumHit > 0.15) {
          glitchIntensity = 1;
          lastDrumHit = time;
        }
        glitchIntensity *= 0.92;

        // === CONTINUOUS BILLBOARD GENERATION ===
        const billboardSpawnZ = shipZ + BILLBOARDS_AHEAD * BILLBOARD_SPACING;
        const billboardCleanZ = shipZ - BILLBOARDS_BEHIND * BILLBOARD_SPACING;

        while (nextBillboardZ < billboardSpawnZ) {
          spawnBillboard(nextBillboardZ);
          nextBillboardZ += BILLBOARD_SPACING;
        }

        for (let i = billboards.length - 1; i >= 0; i--) {
          const bb = billboards[i];
          if (bb.userData.spawnZ < billboardCleanZ) {
            billboardGroup.remove(bb);
            bb.traverse(c => {
              if (c.geometry) c.geometry.dispose();
              if (c.material) c.material.dispose();
            });
            billboards.splice(i, 1);
          } else {
            // Bass drives billboard brightness
            bb.userData.panelMat.opacity = 0.1 + bassEnergy * 0.3;
            bb.userData.borderMat.opacity = 0.5 + bassEnergy * 0.5;

            // Animate scan line
            bb.userData.scanY += bb.userData.scanSpeed * (1 + synthEnergy * 2);
            if (bb.userData.scanY > bb.userData.height / 2) {
              bb.userData.scanY = -bb.userData.height / 2;
            }
            bb.userData.scanLine.position.y = bb.userData.scanY;
          }
        }

        // === CONTINUOUS PILLAR GENERATION ===
        const pillarSpawnZ = shipZ + PILLARS_AHEAD * PILLAR_SPACING;
        const pillarCleanZ = shipZ - PILLARS_BEHIND * PILLAR_SPACING;

        while (nextPillarZ < pillarSpawnZ) {
          spawnDataPillar(nextPillarZ);
          nextPillarZ += PILLAR_SPACING;
        }

        for (let i = dataPillars.length - 1; i >= 0; i--) {
          const dp = dataPillars[i];
          if (dp.userData.spawnZ < pillarCleanZ) {
            pillarGroup.remove(dp);
            dp.traverse(c => {
              if (c.geometry) c.geometry.dispose();
              if (c.material) c.material.dispose();
            });
            dataPillars.splice(i, 1);
          } else {
            // Synth drives data ring speed
            dp.traverse(c => {
              if (c.userData && c.userData.speed) {
                c.position.y += c.userData.speed * (1 + synthEnergy * 3);
                if (c.position.y > c.userData.maxY) c.position.y = c.userData.minY;
              }
            });
            dp.userData.pillarMat.opacity = 0.2 + drumsEnergy * 0.4;
          }
        }

        // HUD rings - drums drive glitch displacement
        group.position.z = shipZ;
        rings.forEach((ring, i) => {
          ring.rotation.z += ring.userData.rotSpeed * (1 + synthEnergy * 2);
          ring.userData.mat.opacity = 0.2 + vocalsEnergy * 0.5;

          if (glitchIntensity > 0.3 && Math.random() > 0.6) {
            ring.position.x = (Math.random() - 0.5) * glitchIntensity * 2;
            ring.position.y = (Math.random() - 0.5) * glitchIntensity * 2;
          } else {
            ring.position.x *= 0.85;
            ring.position.y *= 0.85;
          }
        });

        // Glitch particles - guitar drives color shift
        glitchParticles.position.z = shipZ;
        glitchMat.opacity = 0.4 + drumsEnergy * 0.4;
        const colors = glitchGeom.attributes.color.array;
        if (guitarEnergy > 0.3) {
          for (let i = 0; i < glitchCount; i++) {
            if (Math.random() > 0.95) {
              const hue = (time * 0.5 + Math.random()) % 1;
              const col = new THREE.Color().setHSL(hue, 1, 0.6);
              colors[i * 3] = col.r;
              colors[i * 3 + 1] = col.g;
              colors[i * 3 + 2] = col.b;
            }
          }
          glitchGeom.attributes.color.needsUpdate = true;
        }

        // VOCALS → Background atmosphere (strobe + ambient spots)
        strobeLight.intensity = vocalsEnergy * 10 + glitchIntensity * 15;
        strobeLight.position.z = shipZ;
        magentaSpot.intensity = 3 + vocalsEnergy * 8;
        cyanSpot.intensity = 3 + vocalsEnergy * 8;
        magentaSpot.position.z = shipZ;
        cyanSpot.position.z = shipZ;
      },
      dispose() {
        billboards.forEach(b => b.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        }));
        dataPillars.forEach(p => p.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        }));
        scene.remove(billboardGroup);
        scene.remove(pillarGroup);
        glitchGeom.dispose();
        glitchMat.dispose();
        scene.remove(glitchParticles);
        group.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL INTEGRITY - Clean technical oscilloscope and data streams
  // ═══════════════════════════════════════════════════════════════════════════
  function buildSignalIntegrity(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Clean icy fog
    scene.fog = new THREE.Fog(0x000815, 10, 80);

    // === CONTINUOUSLY GENERATED SIGNAL TOWERS ===
    const towers = [];
    const towerGroup = new THREE.Group();
    const TOWER_SPACING = 12;
    const TOWERS_AHEAD = 20;
    const TOWERS_BEHIND = 6;
    let nextTowerZ = -50;
    let towerSideToggle = 0;

    function spawnTower(z) {
      const towerPiece = new THREE.Group();
      const height = 12 + Math.random() * 25;
      const radius = 0.2 + Math.random() * 0.3;

      // Main tower (ice crystal-like)
      const towerGeom = new THREE.CylinderGeometry(radius * 0.3, radius, height, 4);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x88ddff,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        metalness: 0.8,
        emissive: 0x004466,
        emissiveIntensity: 0.3
      });
      const tower = new THREE.Mesh(towerGeom, towerMat);
      tower.position.y = height / 2 - 5;
      towerPiece.add(tower);

      // Signal rings at different heights
      const numRings = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numRings; i++) {
        const ringGeom = new THREE.TorusGeometry(radius * 3, 0.05, 8, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = height * 0.3 + (i / numRings) * height * 0.5;
        ring.userData = { baseY: ring.position.y, phase: Math.random() * Math.PI * 2, mat: ringMat };
        towerPiece.add(ring);
      }

      // Antenna light at top
      const lightGeom = new THREE.SphereGeometry(radius * 0.8, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const lightOrb = new THREE.Mesh(lightGeom, lightMat);
      lightOrb.position.y = height - 4;
      lightOrb.userData = { mat: lightMat, phase: Math.random() * Math.PI * 2 };
      towerPiece.add(lightOrb);

      const side = towerSideToggle % 2 === 0 ? -1 : 1;
      towerSideToggle++;
      const xOffset = 8 + Math.random() * 12;
      towerPiece.position.set(side * xOffset, 0, z);
      towerPiece.userData = {
        spawnZ: z,
        towerMat: towerMat,
        height: height
      };
      towerGroup.add(towerPiece);
      towers.push(towerPiece);
    }

    for (let z = -50; z < 180; z += TOWER_SPACING) {
      spawnTower(z);
      nextTowerZ = z + TOWER_SPACING;
    }
    scene.add(towerGroup);

    // === CONTINUOUSLY GENERATED WAVEFORM PYLONS ===
    const pylons = [];
    const pylonGroup = new THREE.Group();
    const PYLON_SPACING = 6;
    const PYLONS_AHEAD = 30;
    const PYLONS_BEHIND = 5;
    let nextPylonZ = -30;

    function spawnPylon(z) {
      const height = 0.5 + Math.random() * 8;
      const geom = new THREE.BoxGeometry(0.15, height, 0.15);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      const pylon = new THREE.Mesh(geom, mat);
      const xPos = (Math.random() - 0.5) * 8; // Spread around center
      pylon.position.set(xPos, height / 2 - 4, z);
      pylon.userData = {
        spawnZ: z,
        baseHeight: height,
        mat: mat,
        xPos: xPos
      };
      pylonGroup.add(pylon);
      pylons.push(pylon);
    }

    for (let z = -30; z < 150; z += PYLON_SPACING) {
      spawnPylon(z);
      nextPylonZ = z + PYLON_SPACING;
    }
    scene.add(pylonGroup);

    // 3D Oscilloscope waveform (follows camera)
    const wavePoints = 256;
    const waveGeom = new THREE.BufferGeometry();
    const wavePositions = new Float32Array(wavePoints * 3);
    for (let i = 0; i < wavePoints; i++) {
      wavePositions[i * 3] = (i / wavePoints - 0.5) * 20;
      wavePositions[i * 3 + 1] = 0;
      wavePositions[i * 3 + 2] = 0;
    }
    waveGeom.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
    const waveMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9
    });
    const waveform = new THREE.Line(waveGeom, waveMat);
    waveform.position.z = 2;
    group.add(waveform);

    // Data stream particles (2000)
    const streamCount = 2000;
    const streamGeom = new THREE.BufferGeometry();
    const streamPos = new Float32Array(streamCount * 3);
    const streamVel = [];
    for (let i = 0; i < streamCount; i++) {
      streamPos[i * 3] = (Math.random() - 0.5) * 50;
      streamPos[i * 3 + 1] = Math.random() * 25 - 5;
      streamPos[i * 3 + 2] = Math.random() * 200 - 50;
      streamVel.push(-0.08 - Math.random() * 0.15);
    }
    streamGeom.setAttribute('position', new THREE.BufferAttribute(streamPos, 3));
    const streamMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const streams = new THREE.Points(streamGeom, streamMat);
    scene.add(streams);

    // Clean icy lighting
    const mainLight = new THREE.PointLight(0x00ffff, 2, 50);
    group.add(mainLight);

    const accentLight = new THREE.PointLight(0x00ff88, 1, 40);
    group.add(accentLight);

    scene.add(group);

    let lastDrumHit = 0;

    return {
      group,
      // STRICT 1:1 stem-to-effect mapping
      stemEffects: {
        drums: { target: 'tower lights', effect: 'flash pulse', color: '#00ffff' },
        bass: { target: 'signal rings', effect: 'expansion', color: '#0088ff' },
        vocals: { target: 'ambient lighting', effect: 'background glow', color: '#00ffaa' },
        synth: { target: 'waveform pylons', effect: 'height', color: '#00ff88' },
        guitar: { target: 'data particles', effect: 'fall speed', color: '#88ffff' }
      },
      update(time, freq, amplitude, shipPos, shipSpeed, stemData) {
        const shipZ = shipPos ? shipPos.z : 0;

        // STRICT 1:1 STEM MAPPING - respects enabled/threshold/gain overrides
        const drumsEnergy = getEffectiveStemEnergy('drums', stemData?.drums?.energy || 0);
        const bassEnergy = getEffectiveStemEnergy('bass', stemData?.bass?.energy || 0);
        const vocalsEnergy = getEffectiveStemEnergy('vocals', stemData?.vocals?.energy || 0);
        const synthEnergy = getEffectiveStemEnergy('synth', stemData?.synth?.energy || 0);
        const guitarEnergy = getEffectiveStemEnergy('guitar', stemData?.guitar?.energy || 0);

        // Drum pulse detection - more sensitive
        if (drumsEnergy > 0.4 && time - lastDrumHit > 0.12) {
          lastDrumHit = time;
        }
        const drumPulse = Math.max(0, 1 - (time - lastDrumHit) * 4);

        // === CONTINUOUS TOWER GENERATION ===
        const towerSpawnZ = shipZ + TOWERS_AHEAD * TOWER_SPACING;
        const towerCleanZ = shipZ - TOWERS_BEHIND * TOWER_SPACING;

        while (nextTowerZ < towerSpawnZ) {
          spawnTower(nextTowerZ);
          nextTowerZ += TOWER_SPACING;
        }

        for (let i = towers.length - 1; i >= 0; i--) {
          const t = towers[i];
          if (t.userData.spawnZ < towerCleanZ) {
            towerGroup.remove(t);
            t.traverse(c => {
              if (c.geometry) c.geometry.dispose();
              if (c.material) c.material.dispose();
            });
            towers.splice(i, 1);
          } else {
            // Update tower elements with INTENSE reactivity
            t.traverse(c => {
              if (c.userData) {
                // Signal rings - bass EXPANDS dramatically
                if (c.userData.baseY !== undefined) {
                  const wave = Math.sin(time * 3 + c.userData.phase) * 0.5;
                  c.scale.setScalar(1 + bassEnergy * 2 + wave * 0.3 + drumPulse * 1.5);
                  c.userData.mat.opacity = 0.5 + bassEnergy * 0.5 + drumPulse * 0.3;
                }
                // Light orbs - drums FLASH intensely
                if (c.userData.mat && c.userData.phase !== undefined && c.userData.baseY === undefined) {
                  c.userData.mat.opacity = 0.6 + drumPulse * 0.4 + Math.sin(time * 4 + c.userData.phase) * 0.2;
                  c.scale.setScalar(1 + drumPulse * 2);
                }
              }
            });
            // Tower emissive FLARES on drums
            t.userData.towerMat.emissiveIntensity = 0.3 + drumsEnergy * 1.2 + drumPulse * 0.8;
          }
        }

        // === CONTINUOUS PYLON GENERATION ===
        const pylonSpawnZ = shipZ + PYLONS_AHEAD * PYLON_SPACING;
        const pylonCleanZ = shipZ - PYLONS_BEHIND * PYLON_SPACING;

        while (nextPylonZ < pylonSpawnZ) {
          spawnPylon(nextPylonZ);
          nextPylonZ += PYLON_SPACING;
        }

        for (let i = pylons.length - 1; i >= 0; i--) {
          const p = pylons[i];
          if (p.userData.spawnZ < pylonCleanZ) {
            pylonGroup.remove(p);
            p.geometry.dispose();
            p.material.dispose();
            pylons.splice(i, 1);
          } else {
            // Synth drives pylon height DRAMATICALLY
            const synthWave = Math.sin(time * 6 + p.userData.spawnZ * 0.3) * synthEnergy * 8;
            const newHeight = p.userData.baseHeight + synthWave + vocalsEnergy * 6 + drumPulse * 4;
            p.scale.y = Math.max(0.1, newHeight / p.userData.baseHeight);
            p.position.y = (p.userData.baseHeight * p.scale.y) / 2 - 4;
            p.userData.mat.opacity = 0.6 + synthEnergy * 0.4 + drumPulse * 0.3;
          }
        }

        // Oscilloscope - vocals drive INTENSE amplitude
        group.position.z = shipZ;
        const wavePos = waveGeom.attributes.position.array;
        for (let i = 0; i < wavePoints; i++) {
          const baseWave = Math.sin(time * 3 + i * 0.1) * 0.5;
          const vocalWave = Math.sin(time * 8 + i * 0.2) * vocalsEnergy * 6;
          const drumBounce = Math.sin(time * 15 + i * 0.5) * drumPulse * 2;
          wavePos[i * 3 + 1] = baseWave + vocalWave + drumBounce;
        }
        waveGeom.attributes.position.needsUpdate = true;
        waveMat.opacity = 0.7 + vocalsEnergy * 0.3 + drumPulse * 0.2;

        // Data streams - FASTER on guitar and drums
        streams.position.z = shipZ;
        const sPos = streamGeom.attributes.position.array;
        const speedMult = 1 + guitarEnergy * 4 + drumPulse * 2;
        for (let i = 0; i < streamCount; i++) {
          sPos[i * 3 + 1] += streamVel[i] * speedMult;
          if (sPos[i * 3 + 1] < -10) {
            sPos[i * 3 + 1] = 20;
            sPos[i * 3] = (Math.random() - 0.5) * 50;
          }
        }
        streamGeom.attributes.position.needsUpdate = true;
        streamMat.opacity = 0.5 + drumsEnergy * 0.5 + drumPulse * 0.2;
        streamMat.size = 0.1 + drumPulse * 0.15;

        // VOCALS → Background atmosphere lighting
        mainLight.intensity = 2 + vocalsEnergy * 8;
        mainLight.position.z = shipZ;
        accentLight.intensity = 1.2 + vocalsEnergy * 6;
        accentLight.position.z = shipZ;
      },
      dispose() {
        towers.forEach(t => t.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        }));
        pylons.forEach(p => {
          p.geometry.dispose();
          p.material.dispose();
        });
        scene.remove(towerGroup);
        scene.remove(pylonGroup);
        waveGeom.dispose();
        waveMat.dispose();
        streamGeom.dispose();
        streamMat.dispose();
        scene.remove(streams);
        group.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GI MI DI REINS - Wild freedom, speed lines, particle trails
  // ═══════════════════════════════════════════════════════════════════════════
  function buildGiMiDiReins(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Speed atmosphere
    scene.fog = new THREE.FogExp2(0x080810, 0.02);

    // Speed lines (long thin cylinders rushing past)
    const speedLines = [];
    const lineCount = 100;
    for (let i = 0; i < lineCount; i++) {
      const length = 5 + Math.random() * 20;
      const geom = new THREE.CylinderGeometry(0.02, 0.02, length, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 1, 0.6),
        transparent: true,
        opacity: 0.4 + Math.random() * 0.3
      });
      const line = new THREE.Mesh(geom, mat);
      line.rotation.x = Math.PI / 2;
      line.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        -20 + Math.random() * 40
      );
      line.userData = {
        speed: 0.3 + Math.random() * 0.5,
        resetZ: -30
      };
      group.add(line);
      speedLines.push(line);
    }

    // Particle trail burst
    const trailCount = 2000;
    const trailGeom = new THREE.BufferGeometry();
    const trailPos = new Float32Array(trailCount * 3);
    const trailVel = [];
    for (let i = 0; i < trailCount; i++) {
      trailPos[i * 3] = (Math.random() - 0.5) * 5;
      trailPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      trailPos[i * 3 + 2] = Math.random() * -50;
      trailVel.push({
        x: (Math.random() - 0.5) * 0.1,
        y: (Math.random() - 0.5) * 0.1,
        z: 0.2 + Math.random() * 0.3
      });
    }
    trailGeom.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0xffdd00,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const trails = new THREE.Points(trailGeom, trailMat);
    group.add(trails);

    // Golden light
    const goldLight = new THREE.PointLight(0xffdd00, 2, 30);
    goldLight.position.set(0, 0, 5);
    group.add(goldLight);

    scene.add(group);

    return {
      group,
      // STRICT 1:1 stem-to-effect mapping
      stemEffects: {
        drums: { target: 'speed lines', effect: 'velocity', color: '#ffaa55' },
        bass: { target: 'particle trails', effect: 'density', color: '#cc8844' },
        vocals: { target: 'golden light', effect: 'background glow', color: '#ffcc66' },
        synth: { target: 'trail opacity', effect: 'intensity', color: '#ff8844' }
      },
      update(time, freq, amplitude, shipPos, shipSpeed, stemData) {
        const shipZ = shipPos ? shipPos.z : 0;

        // STRICT 1:1 STEM MAPPING - respects enabled/threshold/gain overrides
        const drumEnergy = getEffectiveStemEnergy('drums', stemData?.drums?.energy || 0);
        const bassEnergy = getEffectiveStemEnergy('bass', stemData?.bass?.energy || 0);
        const vocalEnergy = getEffectiveStemEnergy('vocals', stemData?.vocals?.energy || 0);
        const synthEnergy = getEffectiveStemEnergy('synth', stemData?.synth?.energy || 0);

        // Follow ship position
        group.position.z = shipZ;

        // DRUMS → Speed lines velocity
        const speedMultiplier = 1 + drumEnergy * 8;
        speedLines.forEach(line => {
          line.position.z += line.userData.speed * speedMultiplier;
          if (line.position.z > 20) {
            line.position.z = line.userData.resetZ;
            line.position.x = (Math.random() - 0.5) * 30;
            line.position.y = (Math.random() - 0.5) * 20;
          }
          line.material.opacity = 0.4 + drumEnergy * 0.6;
        });

        // BASS → Particle trails density/burst
        const tPos = trailGeom.attributes.position.array;
        for (let i = 0; i < trailCount; i++) {
          const v = trailVel[i];
          tPos[i * 3] += v.x * (1 + bassEnergy * 2);
          tPos[i * 3 + 1] += v.y * (1 + bassEnergy * 2);
          tPos[i * 3 + 2] += v.z * speedMultiplier;

          if (tPos[i * 3 + 2] > 20) {
            tPos[i * 3] = (Math.random() - 0.5) * 5;
            tPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
            tPos[i * 3 + 2] = -50;
          }
        }
        trailGeom.attributes.position.needsUpdate = true;

        // SYNTH → Trail opacity/size
        trailMat.opacity = 0.5 + synthEnergy * 0.5;
        trailMat.size = 0.1 + synthEnergy * 0.15;

        // VOCALS → Background golden light
        goldLight.intensity = 2 + vocalEnergy * 10;
      },
      dispose() {
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADE YOU MY HANDS - Metamorphosis / Human-AI Symbiosis
  // Crystalline cocoons that burst into butterflies, orbital light spirals
  // Theme: "Give up control, gain full control" - liberation through partnership
  // ═══════════════════════════════════════════════════════════════════════════
  function buildTradeHands(THREE, scene, audioData) {
    const group = new THREE.Group();
    // Lighter fog to let sakura background show through
    scene.fog = new THREE.FogExp2(0x1a1028, 0.004);

    // === COCOONS - Continuously generated crystalline forms ===
    const cocoons = [];
    const cocoonGroup = new THREE.Group();
    const COCOON_SPACING = 12;
    const COCOONS_AHEAD = 20;
    const COCOONS_BEHIND = 6;
    let nextCocoonZ = -40;

    function spawnCocoon(z) {
      // Crystalline cocoon shape - elongated icosahedron
      const geom = new THREE.IcosahedronGeometry(1.2 + Math.random() * 0.8, 1);
      geom.scale(0.6, 1.4, 0.6);

      const isGold = Math.random() > 0.4;
      const hue = isGold ? 0.12 : 0.55; // Gold or cyan
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.6, 0.4),
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7,
        emissive: new THREE.Color().setHSL(hue, 0.8, 0.15),
        emissiveIntensity: 0.5
      });

      const cocoon = new THREE.Mesh(geom, mat);
      const side = Math.random() > 0.5 ? 1 : -1;
      cocoon.position.set(
        side * (6 + Math.random() * 10),
        -2 + Math.random() * 8,
        z + Math.random() * 6
      );
      cocoon.rotation.set(
        Math.random() * 0.3,
        Math.random() * Math.PI * 2,
        Math.random() * 0.5 - 0.25
      );

      // Inner glow core
      const coreGeom = new THREE.IcosahedronGeometry(0.5, 0);
      const coreMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.9, 0.7),
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });
      const core = new THREE.Mesh(coreGeom, coreMat);
      cocoon.add(core);

      cocoon.userData = {
        spawnZ: z,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.3 + Math.random() * 0.4,
        hue,
        mat,
        coreMat,
        hatched: false,
        hatchProgress: 0
      };

      cocoonGroup.add(cocoon);
      cocoons.push(cocoon);
    }

    for (let z = -40; z < 200; z += COCOON_SPACING) {
      spawnCocoon(z);
      nextCocoonZ = z + COCOON_SPACING;
    }
    scene.add(cocoonGroup);

    // === BUTTERFLIES - Born from cocoons on drum hits ===
    const butterflies = [];
    const butterflyGroup = new THREE.Group();
    scene.add(butterflyGroup);

    function spawnButterfly(position, hue) {
      // Simple wing geometry
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.bezierCurveTo(0.8, 0.3, 1.2, 1.2, 0.3, 1.5);
      wingShape.bezierCurveTo(-0.2, 1.0, 0, 0.3, 0, 0);

      const wingGeom = new THREE.ShapeGeometry(wingShape);
      const wingMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.6),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });

      const butterfly = new THREE.Group();

      const leftWing = new THREE.Mesh(wingGeom, wingMat);
      leftWing.scale.set(0.8, 0.8, 0.8);
      leftWing.position.x = -0.1;
      butterfly.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeom.clone(), wingMat.clone());
      rightWing.scale.set(-0.8, 0.8, 0.8);
      rightWing.position.x = 0.1;
      butterfly.add(rightWing);

      butterfly.position.copy(position);
      butterfly.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          0.08 + Math.random() * 0.08,
          (Math.random() - 0.5) * 0.1
        ),
        phase: Math.random() * Math.PI * 2,
        wingSpeed: 8 + Math.random() * 4,
        leftWing,
        rightWing,
        life: 1.0,
        wingMat
      };

      butterflyGroup.add(butterfly);
      butterflies.push(butterfly);
    }

    // === ORBITAL SPIRAL - Partnership energy around ship ===
    const spiralCount = 200;
    const spiralGeom = new THREE.BufferGeometry();
    const spiralPos = new Float32Array(spiralCount * 3);
    const spiralColors = new Float32Array(spiralCount * 3);

    for (let i = 0; i < spiralCount; i++) {
      const t = i / spiralCount;
      const angle = t * Math.PI * 6;
      const radius = 3 + t * 5;
      spiralPos[i * 3] = Math.cos(angle) * radius;
      spiralPos[i * 3 + 1] = (t - 0.5) * 8;
      spiralPos[i * 3 + 2] = Math.sin(angle) * radius;

      const hue = t * 0.15 + 0.08; // Gold to amber
      const col = new THREE.Color().setHSL(hue, 0.7, 0.6);
      spiralColors[i * 3] = col.r;
      spiralColors[i * 3 + 1] = col.g;
      spiralColors[i * 3 + 2] = col.b;
    }
    spiralGeom.setAttribute('position', new THREE.BufferAttribute(spiralPos, 3));
    spiralGeom.setAttribute('color', new THREE.BufferAttribute(spiralColors, 3));

    const spiralMat = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const spiral = new THREE.Points(spiralGeom, spiralMat);
    group.add(spiral);

    // === AMBIENT PARTICLES - Floating energy motes ===
    const moteCount = 600;
    const moteGeom = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    const moteColors = new Float32Array(moteCount * 3);
    const moteData = [];

    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 60;
      motePos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      motePos[i * 3 + 2] = Math.random() * 100;

      const hue = Math.random() > 0.6 ? 0.12 : 0.55;
      const col = new THREE.Color().setHSL(hue, 0.5, 0.7);
      moteColors[i * 3] = col.r;
      moteColors[i * 3 + 1] = col.g;
      moteColors[i * 3 + 2] = col.b;

      moteData.push({
        speed: 0.5 + Math.random() * 1,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.02
      });
    }
    moteGeom.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    moteGeom.setAttribute('color', new THREE.BufferAttribute(moteColors, 3));

    const moteMat = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const motes = new THREE.Points(moteGeom, moteMat);
    scene.add(motes);

    // === LIGHTS ===
    const goldLight = new THREE.PointLight(0xffaa44, 2, 40);
    goldLight.position.set(0, 3, 0);
    group.add(goldLight);

    const cyanLight = new THREE.PointLight(0x44aaff, 1.5, 35);
    cyanLight.position.set(-5, -2, 5);
    group.add(cyanLight);

    const ambientGlow = new THREE.AmbientLight(0x1a1020, 0.3);
    scene.add(ambientGlow);

    scene.add(group);

    let initialized = false;
    let lastDrumPulse = 0;
    let lastVocalPulse = 0;

    return {
      group,
      // STRICT 1:1 stem-to-effect mapping
      stemEffects: {
        drums: { target: 'cocoons', effect: 'pulse scale', color: '#ffcc66' },
        bass: { target: 'motes', effect: 'drift intensity', color: '#8866ff' },
        vocals: { target: 'ambient lights', effect: 'background glow', color: '#ff99bb' },
        synth: { target: 'spiral trail', effect: 'opacity', color: '#66ffcc' },
        guitar: { target: 'butterflies', effect: 'flutter speed', color: '#ffaa44' }
      },
      update(time, freq, amplitude, shipPos, shipSpeed, stemData) {
        const shipZ = shipPos ? shipPos.z : 0;

        // STRICT 1:1 STEM MAPPING - respects enabled/threshold/gain overrides
        const drumEnergy = getEffectiveStemEnergy('drums', stemData?.drums?.energy || 0);
        const bassEnergy = getEffectiveStemEnergy('bass', stemData?.bass?.energy || 0);
        const vocalEnergy = getEffectiveStemEnergy('vocals', stemData?.vocals?.energy || 0);
        const synthEnergy = getEffectiveStemEnergy('synth', stemData?.synth?.energy || 0);
        const guitarEnergy = getEffectiveStemEnergy('guitar', stemData?.guitar?.energy || 0);

        // Smooth drum pulse
        lastDrumPulse = lastDrumPulse * 0.85 + drumEnergy * 0.15;
        lastVocalPulse = lastVocalPulse * 0.9 + vocalEnergy * 0.1;

        // === COCOON GENERATION ===
        const spawnZ = shipZ + COCOONS_AHEAD * COCOON_SPACING;
        const cleanZ = shipZ - COCOONS_BEHIND * COCOON_SPACING;

        while (nextCocoonZ < spawnZ) {
          spawnCocoon(nextCocoonZ);
          nextCocoonZ += COCOON_SPACING;
        }

        // Cleanup old cocoons
        for (let i = cocoons.length - 1; i >= 0; i--) {
          if (cocoons[i].userData.spawnZ < cleanZ) {
            const c = cocoons[i];
            cocoonGroup.remove(c);
            c.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            cocoons.splice(i, 1);
          }
        }

        // === ANIMATE COCOONS ===
        cocoons.forEach(cocoon => {
          const data = cocoon.userData;

          // Gentle pulsing
          const breathe = 1 + Math.sin(time * data.pulseSpeed + data.phase) * 0.1;
          const pulse = 1 + lastDrumPulse * 0.3;
          cocoon.scale.setScalar(breathe * pulse);

          // Glow intensity with vocals
          data.mat.emissiveIntensity = 0.3 + lastVocalPulse * 0.8 + lastDrumPulse * 0.5;
          if (data.coreMat) {
            data.coreMat.opacity = 0.3 + lastVocalPulse * 0.4 + lastDrumPulse * 0.3;
          }

          // Hatch on strong drum hits
          if (!data.hatched && lastDrumPulse > 0.5 && Math.random() > 0.7) {
            data.hatched = true;
            spawnButterfly(cocoon.position.clone(), data.hue);
            data.mat.opacity = 0.3;
          }

          // Slow rotation
          cocoon.rotation.y += 0.003;
        });

        // === ANIMATE BUTTERFLIES ===
        for (let i = butterflies.length - 1; i >= 0; i--) {
          const b = butterflies[i];
          const data = b.userData;

          // Wing flapping
          const wingAngle = Math.sin(time * data.wingSpeed + data.phase) * 0.8;
          data.leftWing.rotation.y = wingAngle;
          data.rightWing.rotation.y = -wingAngle;

          // Movement
          b.position.add(data.velocity);
          b.position.x += Math.sin(time * 2 + data.phase) * 0.03;

          // Fade out
          data.life -= 0.003;
          data.wingMat.opacity = data.life * 0.7;

          // Remove dead butterflies
          if (data.life <= 0 || b.position.y > 20) {
            butterflyGroup.remove(b);
            b.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            butterflies.splice(i, 1);
          }
        }

        // === ANIMATE SPIRAL ===
        const sPos = spiralGeom.attributes.position.array;
        for (let i = 0; i < spiralCount; i++) {
          const t = i / spiralCount;
          const angle = t * Math.PI * 6 + time * 0.5;
          const radius = 3 + t * 5 + lastDrumPulse * 2;
          sPos[i * 3] = Math.cos(angle) * radius;
          sPos[i * 3 + 1] = (t - 0.5) * 8 + Math.sin(time + t * 10) * 0.5;
          sPos[i * 3 + 2] = Math.sin(angle) * radius;
        }
        spiralGeom.attributes.position.needsUpdate = true;
        // SYNTH → Spiral trail opacity
        spiralMat.opacity = 0.4 + synthEnergy * 0.6;
        spiralMat.size = 0.3 + synthEnergy * 0.3;

        // BASS → Motes drift intensity
        const mPos = moteGeom.attributes.position.array;
        if (!initialized && shipPos) {
          for (let i = 0; i < moteCount; i++) {
            mPos[i * 3 + 2] = shipZ - 30 + Math.random() * 80;
          }
          initialized = true;
        }

        for (let i = 0; i < moteCount; i++) {
          const d = moteData[i];
          const bassDrift = 1 + bassEnergy * 2;
          mPos[i * 3] += (Math.sin(time * d.speed + d.phase) * 0.02 + d.drift) * bassDrift;
          mPos[i * 3 + 1] += Math.cos(time * d.speed * 0.7 + d.phase) * 0.015 * bassDrift;

          // Keep near ship
          if (mPos[i * 3 + 2] < shipZ - 35 || mPos[i * 3 + 2] > shipZ + 50) {
            mPos[i * 3 + 2] = shipZ - 30 + Math.random() * 80;
            mPos[i * 3] = (Math.random() - 0.5) * 60;
          }
        }
        moteGeom.attributes.position.needsUpdate = true;
        moteMat.opacity = 0.3 + bassEnergy * 0.4;
        moteMat.size = 0.4 + bassEnergy * 0.3;

        // VOCALS → Background ambient lights
        goldLight.intensity = 1.5 + vocalEnergy * 4;
        cyanLight.intensity = 1 + vocalEnergy * 3;
        cyanLight.position.x = Math.sin(time * 0.3) * 8;

        // Group follows ship
        group.position.z = shipZ;
      },

      dispose() {
        scene.remove(cocoonGroup);
        cocoonGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(butterflyGroup);
        butterflyGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(motes);
        moteGeom.dispose();
        moteMat.dispose();
        scene.remove(ambientGlow);
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUSH HARDER - Relentless forward tunnel, building intensity
  // ═══════════════════════════════════════════════════════════════════════════
  function buildPushHarder(THREE, scene, audioData) {
    const group = new THREE.Group();

    scene.fog = new THREE.Fog(0x080808, 5, 40);

    // Tunnel rings
    const rings = [];
    const ringCount = 30;
    for (let i = 0; i < ringCount; i++) {
      const geom = new THREE.RingGeometry(3, 3.3, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(geom, mat);
      ring.position.z = -i * 3;
      ring.userData = { baseZ: ring.position.z };
      group.add(ring);
      rings.push(ring);
    }

    // Energy particles rushing forward
    const particleCount = 1500;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 3;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = -Math.random() * 90;
      velocities.push(0.3 + Math.random() * 0.5);
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.1,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    group.add(particles);

    // Pulsing center light
    const coreLight = new THREE.PointLight(0xff4400, 3, 20);
    coreLight.position.set(0, 0, 5);
    group.add(coreLight);

    scene.add(group);

    let intensity = 0;

    return {
      group,
      update(time, freq, amplitude, shipPos, shipSpeed) {
        const bassEnergy = freq ? (freq[0] + freq[1] + freq[2] + freq[3]) / 4 / 255 : 0;
        const energy = freq ? freq.reduce((a, b) => a + b, 0) / freq.length / 255 : 0;
        const shipZ = shipPos ? shipPos.z : 0;

        // Follow ship position
        group.position.z = shipZ;

        // Build intensity over time
        intensity = lerp(intensity, bassEnergy, 0.1);
        const speedMult = 1 + intensity * 4;

        // Rush rings toward camera
        rings.forEach((ring, i) => {
          ring.position.z += 0.3 * speedMult;
          if (ring.position.z > 5) {
            ring.position.z = -ringCount * 3;
          }
          ring.scale.setScalar(1 + bassEnergy * 0.5);
          ring.material.opacity = 0.2 + bassEnergy * 0.5;

          // Pulse color intensity
          const hue = 0.05 + bassEnergy * 0.05;
          ring.material.color.setHSL(hue, 1, 0.4 + bassEnergy * 0.3);
        });

        // Rush particles
        const pos = particleGeom.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          pos[i * 3 + 2] += velocities[i] * speedMult;
          if (pos[i * 3 + 2] > 10) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1 + Math.random() * 3;
            pos[i * 3] = Math.cos(angle) * radius;
            pos[i * 3 + 1] = Math.sin(angle) * radius;
            pos[i * 3 + 2] = -90;
          }
        }
        particleGeom.attributes.position.needsUpdate = true;

        coreLight.intensity = 2 + bassEnergy * 5;
        particleMat.opacity = 0.5 + energy * 0.5;
      },
      dispose() {
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE LAST DRAGON - Epic fire realm with ruined towers, embers and smoke
  // ═══════════════════════════════════════════════════════════════════════════
  function buildLastDragon(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Fiery atmosphere
    scene.fog = new THREE.FogExp2(0x1a0800, 0.015);

    // CONTINUOUSLY GENERATED RUINED TOWERS
    const towers = [];
    const towerGroup = new THREE.Group();
    const TOWER_SPACING = 10;
    const TOWERS_AHEAD = 25;
    const TOWERS_BEHIND = 8;
    let nextTowerZ = -50;
    let towerSideToggle = 0;

    // Helper: Create a single tower at given Z
    function spawnTower(z) {
      const height = 20 + Math.random() * 40;
      const baseRadius = 1 + Math.random() * 2;
      const topRadius = baseRadius * (0.3 + Math.random() * 0.4);

      const geom = new THREE.CylinderGeometry(topRadius, baseRadius, height, 6 + Math.floor(Math.random() * 4));
      const mat = new THREE.MeshStandardMaterial({
        color: 0x1a1008,
        roughness: 0.9,
        metalness: 0.2,
        emissive: 0xff3300,
        emissiveIntensity: 0.1 + Math.random() * 0.1
      });
      const tower = new THREE.Mesh(geom, mat);

      const side = towerSideToggle % 2 === 0 ? -1 : 1;
      towerSideToggle++;
      const xOffset = 12 + Math.random() * 25;
      tower.position.set(
        side * xOffset,
        height / 2 - 3,
        z + Math.random() * 6
      );
      tower.rotation.z = (Math.random() - 0.5) * 0.15;
      tower.rotation.y = Math.random() * Math.PI;
      tower.userData = {
        baseHeight: height,
        baseEmissive: mat.emissiveIntensity,
        phase: Math.random() * Math.PI * 2,
        spawnZ: z
      };
      towerGroup.add(tower);
      towers.push(tower);

      // Add fire glow at base of some towers
      if (Math.random() > 0.5) {
        const fireGeom = new THREE.SphereGeometry(1.5 + Math.random(), 8, 8);
        const fireMat = new THREE.MeshBasicMaterial({
          color: 0xff4400,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending
        });
        const fire = new THREE.Mesh(fireGeom, fireMat);
        fire.position.set(tower.position.x, 0, z + Math.random() * 6);
        fire.userData = { isFire: true, phase: Math.random() * Math.PI * 2, spawnZ: z };
        towerGroup.add(fire);
        towers.push(fire);
      }
    }

    // Initial spawn
    for (let z = -50; z < 200; z += TOWER_SPACING) {
      spawnTower(z);
      nextTowerZ = z + TOWER_SPACING;
    }
    scene.add(towerGroup);

    let lastDrumPulse = 0;

    // Fire particles (rising embers)
    const emberCount = 1000;
    const emberGeom = new THREE.BufferGeometry();
    const emberPos = new Float32Array(emberCount * 3);
    const emberVel = [];
    const emberLife = [];

    for (let i = 0; i < emberCount; i++) {
      emberPos[i * 3] = (Math.random() - 0.5) * 30;
      emberPos[i * 3 + 1] = Math.random() * -5;
      emberPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      emberVel.push({
        x: (Math.random() - 0.5) * 0.02,
        y: 0.03 + Math.random() * 0.05,
        z: (Math.random() - 0.5) * 0.02
      });
      emberLife.push(Math.random());
    }

    emberGeom.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const embers = new THREE.Points(emberGeom, emberMat);
    group.add(embers);

    // Smoke clouds (dark translucent spheres)
    const smokeClouds = [];
    for (let i = 0; i < 20; i++) {
      const geom = new THREE.SphereGeometry(1 + Math.random() * 2, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x222222,
        transparent: true,
        opacity: 0.15
      });
      const smoke = new THREE.Mesh(geom, mat);
      smoke.position.set(
        (Math.random() - 0.5) * 25,
        Math.random() * 10,
        (Math.random() - 0.5) * 25
      );
      smoke.userData = {
        vel: { x: (Math.random() - 0.5) * 0.01, y: 0.01 + Math.random() * 0.02 },
        phase: Math.random() * Math.PI * 2
      };
      group.add(smoke);
      smokeClouds.push(smoke);
    }

    // Epic fire lighting rig
    // Main fire glow from below
    const fireLight1 = new THREE.PointLight(0xff4400, 4, 40);
    fireLight1.position.set(0, -3, 0);
    group.add(fireLight1);

    // Surrounding fire spots
    const fireLight2 = new THREE.SpotLight(0xff6600, 3, 35, Math.PI / 5, 0.4, 1);
    fireLight2.position.set(8, 3, 8);
    fireLight2.target.position.set(0, 2, 0);
    group.add(fireLight2);
    group.add(fireLight2.target);

    const fireLight3 = new THREE.SpotLight(0xff2200, 3, 35, Math.PI / 5, 0.4, 1);
    fireLight3.position.set(-8, 3, -8);
    fireLight3.target.position.set(0, 2, 0);
    group.add(fireLight3);
    group.add(fireLight3.target);

    // Dramatic back light (rim lighting for dragon silhouette)
    const rimLight = new THREE.DirectionalLight(0xff8800, 1.5);
    rimLight.position.set(0, 10, -20);
    group.add(rimLight);

    // Ambient fire glow
    const ambientFire = new THREE.HemisphereLight(0xff4400, 0x330000, 0.4);
    group.add(ambientFire);

    // Flickering ember lights scattered around
    const emberLights = [];
    for (let i = 0; i < 6; i++) {
      const el = new THREE.PointLight(0xff5500, 0.5, 12);
      el.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 5,
        (Math.random() - 0.5) * 20
      );
      group.add(el);
      emberLights.push({ light: el, phase: Math.random() * Math.PI * 2 });
    }

    scene.add(group);

    return {
      group,
      update(time, freq, amplitude, shipPos, shipSpeed, audioExtra) {
        const shipZ = shipPos ? shipPos.z : 0;
        const bassEnergy = freq ? (freq[0] + freq[1] + freq[2]) / 3 / 255 : 0;
        const midEnergy = freq ? (freq[20] + freq[40]) / 2 / 255 : 0;
        const energy = freq ? freq.reduce((a, b) => a + b, 0) / freq.length / 255 : 0;

        // Get drum pulse
        const drumPulse = audioExtra?.drumPulse || 0;
        lastDrumPulse = lastDrumPulse * 0.85 + drumPulse * 0.15;

        // CONTINUOUS GENERATION: Spawn new towers ahead, remove behind
        const towerSpawnAheadZ = shipZ + TOWERS_AHEAD * TOWER_SPACING;
        const towerCleanupZ = shipZ - TOWERS_BEHIND * TOWER_SPACING;

        while (nextTowerZ < towerSpawnAheadZ) {
          spawnTower(nextTowerZ);
          nextTowerZ += TOWER_SPACING;
        }

        for (let i = towers.length - 1; i >= 0; i--) {
          const t = towers[i];
          if (t.userData.spawnZ < towerCleanupZ) {
            towerGroup.remove(t);
            if (t.geometry) t.geometry.dispose();
            if (t.material) t.material.dispose();
            towers.splice(i, 1);
          }
        }

        // DRUM PULSE: Towers glow and scale on hits
        towers.forEach(tower => {
          if (tower.userData.isFire) {
            // Fire orbs pulse dramatically
            const firePulse = 1 + lastDrumPulse * 1.5;
            tower.scale.setScalar(firePulse);
            tower.material.opacity = 0.4 + lastDrumPulse * 0.6;
          } else if (tower.userData.baseHeight) {
            // Towers: scale Y and glow emissive on drum hits
            const drumScale = 1 + lastDrumPulse * 0.3;
            tower.scale.set(1 + lastDrumPulse * 0.1, drumScale, 1 + lastDrumPulse * 0.1);
            tower.material.emissiveIntensity = tower.userData.baseEmissive + lastDrumPulse * 0.8;
          }
        });

        // Rise embers with more intensity
        const ePos = emberGeom.attributes.position.array;
        for (let i = 0; i < emberCount; i++) {
          const v = emberVel[i];
          ePos[i * 3] += v.x + (Math.random() - 0.5) * 0.025;
          ePos[i * 3 + 1] += v.y * (1 + bassEnergy * 3 + lastDrumPulse * 2);
          ePos[i * 3 + 2] += v.z + (Math.random() - 0.5) * 0.025;

          if (ePos[i * 3 + 1] > 18) {
            ePos[i * 3] = (Math.random() - 0.5) * 35;
            ePos[i * 3 + 1] = -5;
            ePos[i * 3 + 2] = (Math.random() - 0.5) * 35;
          }
        }
        emberGeom.attributes.position.needsUpdate = true;

        // Drift smoke with more turbulence
        smokeClouds.forEach(smoke => {
          smoke.position.x += smoke.userData.vel.x + (Math.random() - 0.5) * 0.02;
          smoke.position.y += smoke.userData.vel.y * (1 + bassEnergy);
          smoke.scale.setScalar(1 + Math.sin(time + smoke.userData.phase) * 0.3 + bassEnergy * 0.5 + lastDrumPulse * 0.3);
          smoke.material.opacity = 0.1 + energy * 0.1;

          if (smoke.position.y > 18) {
            smoke.position.y = -5;
            smoke.position.x = (Math.random() - 0.5) * 30;
          }
        });

        // Dramatic flickering fire lights - flash on drums
        const flicker1 = Math.random() * 0.8;
        const flicker2 = Math.random() * 0.6;
        fireLight1.intensity = 3 + bassEnergy * 6 + flicker1 + lastDrumPulse * 4;
        fireLight2.intensity = 2 + midEnergy * 5 + flicker2 + lastDrumPulse * 3;
        fireLight3.intensity = 2 + midEnergy * 5 + flicker2 + lastDrumPulse * 3;

        // Color shift based on intensity
        const hue = 0.05 + bassEnergy * 0.03;
        fireLight1.color.setHSL(hue, 1, 0.5);
        fireLight2.color.setHSL(hue + 0.02, 1, 0.5);

        // Rim light pulses with music
        rimLight.intensity = 1 + energy * 2 + lastDrumPulse * 2;

        // Ember lights flicker
        emberLights.forEach((el, i) => {
          el.light.intensity = 0.3 + Math.sin(time * 8 + el.phase) * 0.3 + bassEnergy * 1.5 + lastDrumPulse * 2;
        });

        emberMat.opacity = 0.7 + bassEnergy * 0.3;
        emberMat.size = 0.1 + bassEnergy * 0.08 + lastDrumPulse * 0.05;

        // Epic zoom oscillation
        const zoomOscillation = Math.sin(time * 0.12) * 5 + Math.sin(time * 0.07) * 2.5;
        const bassZoom = bassEnergy * 2 + lastDrumPulse * 1.5;
        group.position.z = shipZ + zoomOscillation - bassZoom;

        // Slight tilt for epic feel
        group.rotation.x = Math.sin(time * 0.08) * 0.03;
        group.rotation.y = Math.sin(time * 0.06) * 0.02;
      },
      dispose() {
        scene.remove(towerGroup);
        towerGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WHO'S LEARNING WHO - Neural network, data nodes, scanning
  // ═══════════════════════════════════════════════════════════════════════════
  function buildWhosLearning(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Use theme's fog settings instead of overriding here
    // (Theme has fogNear: 30, fogFar: 200 which works better with animated backgrounds)

    // Neural network nodes
    const nodes = [];
    const nodeCount = 60;
    const nodePositions = [];

    for (let i = 0; i < nodeCount; i++) {
      const geom = new THREE.SphereGeometry(0.15, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
      });
      const node = new THREE.Mesh(geom, mat);
      node.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 20
      );
      nodePositions.push(node.position.clone());
      node.userData = { pulsePhase: Math.random() * Math.PI * 2 };
      group.add(node);
      nodes.push(node);
    }

    // Connections between nearby nodes
    const connections = [];
    const connectionMat = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    });

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < 6) {
          const geom = new THREE.BufferGeometry().setFromPoints([
            nodePositions[i],
            nodePositions[j]
          ]);
          const line = new THREE.Line(geom, connectionMat.clone());
          line.userData = { nodeA: i, nodeB: j };
          group.add(line);
          connections.push(line);
        }
      }
    }

    // Matrix code rain
    const codeCount = 500;
    const codeGeom = new THREE.BufferGeometry();
    const codePos = new Float32Array(codeCount * 3);
    const codeVel = [];

    for (let i = 0; i < codeCount; i++) {
      codePos[i * 3] = (Math.random() - 0.5) * 40;
      codePos[i * 3 + 1] = Math.random() * 20;
      codePos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      codeVel.push(-0.05 - Math.random() * 0.15);
    }

    codeGeom.setAttribute('position', new THREE.BufferAttribute(codePos, 3));
    const codeMat = new THREE.PointsMaterial({
      color: 0x00ff00,
      size: 0.08,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const codeRain = new THREE.Points(codeGeom, codeMat);
    group.add(codeRain);

    // Scanning beam
    const scanGeom = new THREE.PlaneGeometry(30, 0.1);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const scanBeam = new THREE.Mesh(scanGeom, scanMat);
    scanBeam.rotation.x = Math.PI / 2;
    group.add(scanBeam);

    // Green ambient
    const greenLight = new THREE.PointLight(0x00ff00, 1.5, 30);
    greenLight.position.set(0, 5, 5);
    group.add(greenLight);

    scene.add(group);

    return {
      group,
      update(time, freq, amplitude, shipPos, shipSpeed) {
        const shipZ = shipPos ? shipPos.z : 0;
        const energy = freq ? freq.reduce((a, b) => a + b, 0) / freq.length / 255 : 0;
        const bassEnergy = freq ? (freq[0] + freq[1]) / 2 / 255 : 0;

        // Pulse nodes
        nodes.forEach((node, i) => {
          const pulse = 1 + Math.sin(time * 2 + node.userData.pulsePhase) * 0.3;
          node.scale.setScalar(pulse * (1 + energy));
          node.material.opacity = 0.5 + energy * 0.5;
        });

        // Pulse connections
        connections.forEach(conn => {
          conn.material.opacity = 0.1 + energy * 0.3;
        });

        // Code rain
        const cPos = codeGeom.attributes.position.array;
        for (let i = 0; i < codeCount; i++) {
          cPos[i * 3 + 1] += codeVel[i] * (1 + bassEnergy * 2);
          if (cPos[i * 3 + 1] < -10) {
            cPos[i * 3 + 1] = 20;
            cPos[i * 3] = (Math.random() - 0.5) * 40;
          }
        }
        codeGeom.attributes.position.needsUpdate = true;

        // Scanning beam
        scanBeam.position.y = Math.sin(time * 0.5) * 8;
        scanMat.opacity = 0.2 + bassEnergy * 0.3;

        greenLight.intensity = 1 + energy * 2;
        codeMat.opacity = 0.3 + energy * 0.4;

        // Follow the ship
        group.position.z = shipZ;
      },
      dispose() {
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        // Don't clear fog - let the environment theme manage it
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TERMS & CONDITIONS - Digital dystopia, glass towers, holographic contracts
  // ═══════════════════════════════════════════════════════════════════════════
  function buildTermsConditions(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Cold digital fog - blue tinted
    scene.fog = new THREE.FogExp2(0x0a1020, 0.012);

    // CONTINUOUSLY GENERATED GLASS TOWERS (corporate buildings)
    const towers = [];
    const towerGroup = new THREE.Group();
    const TOWER_SPACING = 12;
    const TOWERS_AHEAD = 20;
    const TOWERS_BEHIND = 6;
    let nextTowerZ = -60;
    let towerSideToggle = 0;

    // Helper: Create a glass corporate tower
    function spawnTower(z) {
      const towerPiece = new THREE.Group();

      // Main tower body - glass/chrome
      const height = 25 + Math.random() * 45;  // 25-70 units tall
      const width = 3 + Math.random() * 4;
      const depth = 3 + Math.random() * 4;

      const bodyGeom = new THREE.BoxGeometry(width, height, depth);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1a2a3a,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x0066aa,
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.85
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = height / 2;
      towerPiece.add(body);

      // Window grid lines (horizontal)
      const windowCount = Math.floor(height / 3);
      for (let w = 0; w < windowCount; w++) {
        const lineGeom = new THREE.BoxGeometry(width + 0.1, 0.08, depth + 0.1);
        const lineMat = new THREE.MeshBasicMaterial({
          color: 0x00aaff,
          transparent: true,
          opacity: 0.3
        });
        const line = new THREE.Mesh(lineGeom, lineMat);
        line.position.y = 2 + w * 3;
        towerPiece.add(line);
      }

      // Glowing top beacon
      const beaconGeom = new THREE.SphereGeometry(0.5, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.y = height + 1;
      towerPiece.add(beacon);

      // Position
      const side = towerSideToggle % 2 === 0 ? -1 : 1;
      towerSideToggle++;
      const xOffset = 15 + Math.random() * 20;
      towerPiece.position.set(
        side * xOffset,
        0,
        z + Math.random() * 6
      );

      towerPiece.userData = {
        height: height,
        spawnZ: z,
        body: body,
        bodyMat: bodyMat,
        beacon: beacon,
        beaconMat: beaconMat
      };

      towerGroup.add(towerPiece);
      towers.push(towerPiece);
    }

    // Initial towers
    for (let z = -60; z < 180; z += TOWER_SPACING) {
      spawnTower(z);
      nextTowerZ = z + TOWER_SPACING;
    }
    scene.add(towerGroup);

    // FLOATING HOLOGRAPHIC "TERMS" PANELS
    const panels = [];
    const panelGroup = new THREE.Group();
    const PANEL_SPACING = 20;
    const PANELS_AHEAD = 15;
    const PANELS_BEHIND = 5;
    let nextPanelZ = -40;

    function spawnPanel(z) {
      const panelWidth = 4 + Math.random() * 3;
      const panelHeight = 2 + Math.random() * 2;

      const panelGeom = new THREE.PlaneGeometry(panelWidth, panelHeight);
      const panelMat = new THREE.MeshBasicMaterial({
        color: 0x00ddff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const panel = new THREE.Mesh(panelGeom, panelMat);

      // Add border glow
      const borderGeom = new THREE.EdgesGeometry(panelGeom);
      const borderMat = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6
      });
      const border = new THREE.LineSegments(borderGeom, borderMat);
      panel.add(border);

      // Random position floating in space
      panel.position.set(
        (Math.random() - 0.5) * 30,
        3 + Math.random() * 12,
        z + Math.random() * 10
      );
      panel.rotation.y = (Math.random() - 0.5) * 0.8;
      panel.rotation.x = (Math.random() - 0.5) * 0.2;

      panel.userData = {
        spawnZ: z,
        floatPhase: Math.random() * Math.PI * 2,
        floatSpeed: 0.3 + Math.random() * 0.4,
        baseY: panel.position.y
      };

      panelGroup.add(panel);
      panels.push(panel);
    }

    for (let z = -40; z < 120; z += PANEL_SPACING) {
      spawnPanel(z);
      nextPanelZ = z + PANEL_SPACING;
    }
    scene.add(panelGroup);

    // DATA RAIN (matrix-style falling characters/particles)
    const rainCount = 2000;
    const rainGeom = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    const rainVel = [];

    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 80;
      rainPos[i * 3 + 1] = Math.random() * 40;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      rainVel.push(0.05 + Math.random() * 0.15);
    }
    rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const rain = new THREE.Points(rainGeom, rainMat);
    group.add(rain);

    // NOTIFICATION PARTICLES (floating icons/alerts)
    const notifCount = 100;
    const notifGeom = new THREE.BufferGeometry();
    const notifPos = new Float32Array(notifCount * 3);
    const notifData = [];

    for (let i = 0; i < notifCount; i++) {
      notifPos[i * 3] = (Math.random() - 0.5) * 40;
      notifPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      notifPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      notifData.push({
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        orbit: 2 + Math.random() * 3
      });
    }
    notifGeom.setAttribute('position', new THREE.BufferAttribute(notifPos, 3));

    const notifMat = new THREE.PointsMaterial({
      color: 0xff4466,
      size: 0.4,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const notifications = new THREE.Points(notifGeom, notifMat);
    group.add(notifications);

    // MIRROR FLOOR (reflective ground plane)
    const floorGeom = new THREE.PlaneGeometry(200, 400);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a1525,
      roughness: 0.1,
      metalness: 0.95,
      emissive: 0x001122,
      emissiveIntensity: 0.2
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    scene.add(floor);

    // Lighting
    const blueLight = new THREE.PointLight(0x0088ff, 3, 40);
    blueLight.position.set(0, 10, 0);
    group.add(blueLight);

    const cyanLight = new THREE.PointLight(0x00ffff, 2, 35);
    cyanLight.position.set(-10, 5, 5);
    group.add(cyanLight);

    const pinkAccent = new THREE.PointLight(0xff4488, 1.5, 25);
    pinkAccent.position.set(10, 3, -5);
    group.add(pinkAccent);

    // Ambient
    const ambient = new THREE.HemisphereLight(0x0044aa, 0x000511, 0.4);
    group.add(ambient);

    scene.add(group);

    let lastDrumPulse = 0;
    let initialized = false;

    return {
      group,
      // STRICT 1:1 stem-to-effect mapping
      stemEffects: {
        drums: { target: 'towers', effect: 'flash pulse', color: '#00ffff' },
        bass: { target: 'data rain', effect: 'fall speed', color: '#0066aa' },
        vocals: { target: 'ambient lights', effect: 'background glow', color: '#00ddff' },
        synth: { target: 'notifications', effect: 'burst size', color: '#0088ff' },
        guitar: { target: 'panels', effect: 'scale pulse', color: '#66ddff' }
      },
      update(time, freq, amplitude, shipPos, shipSpeed, audioExtra) {
        const shipZ = shipPos ? shipPos.z : 0;

        // STRICT 1:1 STEM MAPPING - respects enabled/threshold/gain overrides
        const drumEnergy = getEffectiveStemEnergy('drums', audioExtra?.drums?.energy || 0);
        const bassEnergy = getEffectiveStemEnergy('bass', audioExtra?.bass?.energy || 0);
        const vocalEnergy = getEffectiveStemEnergy('vocals', audioExtra?.vocals?.energy || 0);
        const synthEnergy = getEffectiveStemEnergy('synth', audioExtra?.synth?.energy || 0);
        const guitarEnergy = getEffectiveStemEnergy('guitar', audioExtra?.guitar?.energy || 0);

        // Slower decay = longer lasting effects
        lastDrumPulse = lastDrumPulse * 0.75 + drumEnergy * 0.25;

        // CONTINUOUS GENERATION: Towers
        const towerSpawnZ = shipZ + TOWERS_AHEAD * TOWER_SPACING;
        const towerCleanZ = shipZ - TOWERS_BEHIND * TOWER_SPACING;

        while (nextTowerZ < towerSpawnZ) {
          spawnTower(nextTowerZ);
          nextTowerZ += TOWER_SPACING;
        }

        for (let i = towers.length - 1; i >= 0; i--) {
          if (towers[i].userData.spawnZ < towerCleanZ) {
            const t = towers[i];
            towerGroup.remove(t);
            t.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            towers.splice(i, 1);
          }
        }

        // CONTINUOUS GENERATION: Panels
        const panelSpawnZ = shipZ + PANELS_AHEAD * PANEL_SPACING;
        const panelCleanZ = shipZ - PANELS_BEHIND * PANEL_SPACING;

        while (nextPanelZ < panelSpawnZ) {
          spawnPanel(nextPanelZ);
          nextPanelZ += PANEL_SPACING;
        }

        for (let i = panels.length - 1; i >= 0; i--) {
          if (panels[i].userData.spawnZ < panelCleanZ) {
            const p = panels[i];
            panelGroup.remove(p);
            p.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            panels.splice(i, 1);
          }
        }

        // DRUMS → Towers flash and pulse
        towers.forEach(tower => {
          const data = tower.userData;
          if (data.bodyMat) {
            data.bodyMat.emissiveIntensity = 0.1 + lastDrumPulse * 2;
            const scaleBoost = 1 + lastDrumPulse * 0.15;
            tower.scale.set(scaleBoost, 1 + lastDrumPulse * 0.1, scaleBoost);
            if (data.beaconMat) {
              data.beaconMat.opacity = 0.6 + lastDrumPulse * 0.4;
              data.beacon.scale.setScalar(1 + lastDrumPulse * 2);
            }
          }
        });

        // GUITAR → Panels scale pulse
        panels.forEach(panel => {
          const data = panel.userData;
          panel.position.y = data.baseY + Math.sin(time * data.floatSpeed + data.floatPhase) * 1.5;
          panel.material.opacity = 0.15 + guitarEnergy * 0.6;
          const panelScale = 1 + guitarEnergy * 0.8;
          panel.scale.setScalar(panelScale);
        });

        // BASS → Data rain fall speed
        const rPos = rainGeom.attributes.position.array;
        if (!initialized && shipPos) {
          for (let i = 0; i < rainCount; i++) {
            rPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
          }
          initialized = true;
        }

        const rainSpeedMult = 1 + bassEnergy * 6;
        for (let i = 0; i < rainCount; i++) {
          rPos[i * 3 + 1] -= rainVel[i] * rainSpeedMult;
          if (rPos[i * 3 + 1] < -5) {
            rPos[i * 3 + 1] = 35 + Math.random() * 5;
            rPos[i * 3] = (Math.random() - 0.5) * 80;
            rPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
          }
          if (rPos[i * 3 + 2] < shipZ - 45 || rPos[i * 3 + 2] > shipZ + 45) {
            rPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
          }
        }
        rainGeom.attributes.position.needsUpdate = true;
        rainMat.opacity = 0.5 + bassEnergy * 0.5;
        rainMat.size = 0.15 + bassEnergy * 0.2;

        // SYNTH → Notification particles burst
        const nPos = notifGeom.attributes.position.array;
        for (let i = 0; i < notifCount; i++) {
          const d = notifData[i];
          const burstForce = synthEnergy * 0.2;
          nPos[i * 3] += Math.sin(time * d.speed + d.phase) * 0.03 + (Math.random() - 0.5) * burstForce;
          nPos[i * 3 + 1] += Math.cos(time * d.speed * 0.7 + d.phase) * 0.02 + burstForce * 0.5;
        }
        notifGeom.attributes.position.needsUpdate = true;
        notifMat.opacity = 0.6 + synthEnergy * 0.4;
        notifMat.size = 0.4 + synthEnergy * 0.8;

        // Move floor with ship
        floor.position.z = shipZ;
        floorMat.emissiveIntensity = 0.2 + drumEnergy * 0.8;

        // Lights follow ship
        group.position.z = shipZ;

        // VOCALS → Background ambient lights
        blueLight.intensity = 3 + vocalEnergy * 10;
        cyanLight.intensity = 2 + vocalEnergy * 8;
        pinkAccent.intensity = 1.5 + vocalEnergy * 6;
      },
      dispose() {
        scene.remove(towerGroup);
        towerGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(panelGroup);
        panelGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(floor);
        floorGeom.dispose();
        floorMat.dispose();
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TURN YOUR PHONE FACE DOWN - Warm, intimate, human connection vs digital
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // TURN YOUR PHONE FACE DOWN - "The Quiet Room"
  // A scene about genuine human connection when you put down your phone
  // ═══════════════════════════════════════════════════════════════════════════
  function buildPhoneFaceDown(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Deep intimate atmosphere - warm amber transitioning from cold
    scene.fog = new THREE.FogExp2(0x0a0805, 0.018);

    // ═══════════════════════════════════════════════════════════════════════
    // HEARTBEAT CORE - Central pulsing warmth (drums)
    // ═══════════════════════════════════════════════════════════════════════
    const heartbeatGroup = new THREE.Group();

    // Inner core - bright warm center
    const coreGeom = new THREE.SphereGeometry(1.5, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffaa66,
      transparent: true,
      opacity: 0.9
    });
    const heartCore = new THREE.Mesh(coreGeom, coreMat);
    heartbeatGroup.add(heartCore);

    // Middle pulse ring
    const midGeom = new THREE.SphereGeometry(3, 24, 24);
    const midMat = new THREE.MeshBasicMaterial({
      color: 0xff8844,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const heartMid = new THREE.Mesh(midGeom, midMat);
    heartbeatGroup.add(heartMid);

    // Outer glow aura
    const auraGeom = new THREE.SphereGeometry(6, 20, 20);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xff6633,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending
    });
    const heartAura = new THREE.Mesh(auraGeom, auraMat);
    heartbeatGroup.add(heartAura);

    // Central point light
    const heartLight = new THREE.PointLight(0xffaa66, 4, 50);
    heartbeatGroup.add(heartLight);

    heartbeatGroup.position.set(0, 6, 0);
    group.add(heartbeatGroup);

    // ═══════════════════════════════════════════════════════════════════════
    // GROUND RIPPLES - Circular waves spreading outward (bass)
    // ═══════════════════════════════════════════════════════════════════════
    const ripples = [];
    const rippleGroup = new THREE.Group();
    const MAX_RIPPLES = 8;

    function createRipple(intensity) {
      const ripple = new THREE.Group();

      // Ring geometry
      const ringGeom = new THREE.RingGeometry(0.5, 1.5, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffcc88,
        transparent: true,
        opacity: 0.6 * intensity,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ripple.add(ring);

      ripple.userData = {
        age: 0,
        maxAge: 3,
        ringMat: ringMat,
        startOpacity: 0.6 * intensity
      };

      ripple.position.y = 0.1;
      rippleGroup.add(ripple);
      ripples.push(ripple);

      // Limit ripples
      while (ripples.length > MAX_RIPPLES) {
        const old = ripples.shift();
        rippleGroup.remove(old);
        old.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }
    }

    rippleGroup.position.y = 0;
    group.add(rippleGroup);

    // ═══════════════════════════════════════════════════════════════════════
    // ASCENDING PHONES - Phones floating up and fading (synth)
    // ═══════════════════════════════════════════════════════════════════════
    const phones = [];
    const phoneGroup = new THREE.Group();
    const PHONE_COUNT = 25;

    function spawnPhone(shipZ) {
      const phoneWidth = 0.8 + Math.random() * 0.4;
      const phoneHeight = phoneWidth * 2;
      const phone = new THREE.Group();

      // Phone body
      const bodyGeom = new THREE.BoxGeometry(phoneWidth, phoneHeight, 0.08);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.2,
        metalness: 0.9,
        transparent: true,
        opacity: 0.9
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      phone.add(body);

      // Screen glow (starts blue, will fade)
      const screenGeom = new THREE.PlaneGeometry(phoneWidth * 0.88, phoneHeight * 0.88);
      const screenMat = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      const screen = new THREE.Mesh(screenGeom, screenMat);
      screen.position.z = 0.045;
      phone.add(screen);

      // Notification badges
      const notifColors = [0xff3344, 0x44ff66, 0xffaa00, 0x44aaff];
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        const notifGeom = new THREE.CircleGeometry(0.06, 8);
        const notifMat = new THREE.MeshBasicMaterial({
          color: notifColors[Math.floor(Math.random() * notifColors.length)],
          transparent: true,
          opacity: 0.9
        });
        const notif = new THREE.Mesh(notifGeom, notifMat);
        notif.position.set(
          (Math.random() - 0.5) * phoneWidth * 0.7,
          (Math.random() - 0.5) * phoneHeight * 0.7,
          0.05
        );
        phone.add(notif);
      }

      // Start below, will float up
      phone.position.set(
        (Math.random() - 0.5) * 35,
        -5 + Math.random() * 8,
        shipZ + (Math.random() - 0.5) * 60
      );
      phone.rotation.z = (Math.random() - 0.5) * 0.3;
      phone.rotation.y = Math.random() * 0.2;

      phone.userData = {
        riseSpeed: 0.02 + Math.random() * 0.015,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        driftX: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2,
        bodyMat: bodyMat,
        screenMat: screenMat,
        fadeHeight: 25 + Math.random() * 10
      };

      phoneGroup.add(phone);
      phones.push(phone);
    }

    // Initial phones
    for (let i = 0; i < PHONE_COUNT; i++) {
      spawnPhone(0);
      // Spread initial heights
      phones[i].position.y = -5 + Math.random() * 35;
    }
    scene.add(phoneGroup);

    // ═══════════════════════════════════════════════════════════════════════
    // CONNECTION THREADS - Ethereal lines between warm points (guitar)
    // ═══════════════════════════════════════════════════════════════════════
    const connectionPoints = [];
    const threads = [];
    const threadGroup = new THREE.Group();
    const POINT_COUNT = 12;

    // Create warm connection points
    for (let i = 0; i < POINT_COUNT; i++) {
      const angle = (i / POINT_COUNT) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      const point = {
        x: Math.cos(angle) * radius,
        y: 3 + Math.random() * 10,
        z: Math.sin(angle) * radius,
        phase: Math.random() * Math.PI * 2
      };
      connectionPoints.push(point);

      // Warm glow at each point
      const glowGeom = new THREE.SphereGeometry(0.4, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffcc88,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Mesh(glowGeom, glowMat);
      glow.position.set(point.x, point.y, point.z);
      point.mesh = glow;
      point.mat = glowMat;
      threadGroup.add(glow);
    }

    // Create threads between nearby points
    for (let i = 0; i < connectionPoints.length; i++) {
      const p1 = connectionPoints[i];
      const p2 = connectionPoints[(i + 1) % connectionPoints.length];
      const p3 = connectionPoints[(i + 3) % connectionPoints.length];

      [p2, p3].forEach(target => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(p1.x, p1.y, p1.z),
          new THREE.Vector3((p1.x + target.x) / 2, (p1.y + target.y) / 2 + 3, (p1.z + target.z) / 2),
          new THREE.Vector3(target.x, target.y, target.z)
        );
        const points = curve.getPoints(20);
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0xffaa66,
          transparent: true,
          opacity: 0.15,
          blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(lineGeom, lineMat);
        line.userData = { mat: lineMat, baseOpacity: 0.15 };
        threadGroup.add(line);
        threads.push(line);
      });
    }

    group.add(threadGroup);

    // ═══════════════════════════════════════════════════════════════════════
    // CONVERSATION SPARKS - Particles near center (vocals)
    // ═══════════════════════════════════════════════════════════════════════
    const sparkCount = 400;
    const sparkGeom = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkData = [];

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 8;
      sparkPos[i * 3] = Math.cos(angle) * radius;
      sparkPos[i * 3 + 1] = 4 + Math.random() * 8;
      sparkPos[i * 3 + 2] = Math.sin(angle) * radius;
      sparkData.push({
        baseRadius: radius,
        angle: angle,
        yBase: sparkPos[i * 3 + 1],
        phase: Math.random() * Math.PI * 2,
        orbitSpeed: 0.2 + Math.random() * 0.3
      });
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: 0xffffcc,
      size: 0.15,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const sparks = new THREE.Points(sparkGeom, sparkMat);
    group.add(sparks);

    // ═══════════════════════════════════════════════════════════════════════
    // AMBIENT DUST - Floating warm particles (percussion)
    // ═══════════════════════════════════════════════════════════════════════
    const dustCount = 600;
    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustData = [];

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 60;
      dustPos[i * 3 + 1] = Math.random() * 25;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      dustData.push({
        phase: Math.random() * Math.PI * 2,
        speed: 0.1 + Math.random() * 0.2,
        driftX: (Math.random() - 0.5) * 0.02,
        driftY: (Math.random() - 0.5) * 0.01
      });
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    const dustMat = new THREE.PointsMaterial({
      color: 0xffddaa,
      size: 0.12,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    group.add(dust);

    // ═══════════════════════════════════════════════════════════════════════
    // AMBIENT LIGHTING
    // ═══════════════════════════════════════════════════════════════════════
    const warmLight1 = new THREE.PointLight(0xffaa66, 2, 40);
    warmLight1.position.set(-15, 8, -10);
    group.add(warmLight1);

    const warmLight2 = new THREE.PointLight(0xff8855, 1.5, 35);
    warmLight2.position.set(15, 6, 10);
    group.add(warmLight2);

    const ambient = new THREE.HemisphereLight(0xffcc99, 0x111008, 0.25);
    group.add(ambient);

    scene.add(group);

    // State
    let lastBassHit = 0;
    let bassThreshold = 0.5;
    let lastBassEnergy = 0;
    let heartbeatPhase = 0;
    let initialized = false;

    return {
      group,
      stemEffects: {
        drums: { target: 'heartbeat', effect: 'pulse', color: '#ffaa66' },
        bass: { target: 'ripples', effect: 'spawn waves', color: '#ffcc88' },
        vocals: { target: 'sparks', effect: 'glow intensity', color: '#ffffcc' },
        synth: { target: 'phones', effect: 'rise speed', color: '#4488ff' },
        guitar: { target: 'threads', effect: 'brightness', color: '#ffaa66' },
        percussion: { target: 'dust', effect: 'shimmer', color: '#ffddaa' }
      },
      update(time, freq, amplitude, shipPos, shipSpeed, audioExtra) {
        const shipZ = shipPos ? shipPos.z : 0;

        // Get stem energies
        const drumEnergy = getEffectiveStemEnergy('drums', audioExtra?.drums?.energy || 0);
        const bassEnergy = getEffectiveStemEnergy('bass', audioExtra?.bass?.energy || 0);
        const vocalEnergy = getEffectiveStemEnergy('vocals', audioExtra?.vocals?.energy || 0);
        const synthEnergy = getEffectiveStemEnergy('synth', audioExtra?.synth?.energy || 0);
        const guitarEnergy = getEffectiveStemEnergy('guitar', audioExtra?.guitar?.energy || 0);
        const percEnergy = getEffectiveStemEnergy('percussion', audioExtra?.percussion?.energy || 0);

        // ═══════════════════════════════════════════════════════════════════
        // DRUMS → Heartbeat pulse
        // ═══════════════════════════════════════════════════════════════════
        heartbeatPhase += 0.05 + drumEnergy * 0.15;
        const heartbeat = Math.sin(heartbeatPhase) * 0.5 + 0.5;
        const drumPulse = 1 + drumEnergy * 1.5;

        heartCore.scale.setScalar(1 + heartbeat * 0.3 * drumPulse);
        heartMid.scale.setScalar(1 + heartbeat * 0.4 * drumPulse);
        heartAura.scale.setScalar(1 + heartbeat * 0.5 + drumEnergy * 0.8);

        coreMat.opacity = 0.7 + drumEnergy * 0.3;
        midMat.opacity = 0.2 + drumEnergy * 0.4;
        auraMat.opacity = 0.08 + drumEnergy * 0.2;
        heartLight.intensity = 3 + drumEnergy * 8;

        // ═══════════════════════════════════════════════════════════════════
        // BASS → Ground ripples
        // ═══════════════════════════════════════════════════════════════════
        // Detect bass hits
        if (bassEnergy > bassThreshold && lastBassEnergy < bassThreshold) {
          createRipple(bassEnergy);
        }
        lastBassEnergy = bassEnergy;

        // Update ripples
        const dt = 0.016;
        for (let i = ripples.length - 1; i >= 0; i--) {
          const ripple = ripples[i];
          const data = ripple.userData;
          data.age += dt;

          // Expand outward
          const progress = data.age / data.maxAge;
          const scale = 1 + progress * 25;
          ripple.scale.setScalar(scale);

          // Fade out
          data.ringMat.opacity = data.startOpacity * (1 - progress);

          if (data.age > data.maxAge) {
            rippleGroup.remove(ripple);
            ripple.traverse(c => {
              if (c.geometry) c.geometry.dispose();
              if (c.material) c.material.dispose();
            });
            ripples.splice(i, 1);
          }
        }

        // ═══════════════════════════════════════════════════════════════════
        // SYNTH → Phones rise and fade
        // ═══════════════════════════════════════════════════════════════════
        phones.forEach(phone => {
          const data = phone.userData;

          // Rise faster with synth
          phone.position.y += data.riseSpeed * (1 + synthEnergy * 2);
          phone.position.x += data.driftX + Math.sin(time + data.phase) * 0.01;
          phone.rotation.z += data.rotSpeed;

          // Fade as it rises
          const fadeProgress = Math.max(0, (phone.position.y - 15) / data.fadeHeight);
          data.bodyMat.opacity = 0.9 * (1 - fadeProgress);
          data.screenMat.opacity = 0.7 * (1 - fadeProgress * 1.2);

          // Respawn when faded
          if (phone.position.y > data.fadeHeight + 15 || data.bodyMat.opacity <= 0) {
            phone.position.y = -5 + Math.random() * 3;
            phone.position.x = (Math.random() - 0.5) * 35;
            phone.position.z = shipZ + (Math.random() - 0.5) * 60;
            data.bodyMat.opacity = 0.9;
            data.screenMat.opacity = 0.7;
          }
        });

        // ═══════════════════════════════════════════════════════════════════
        // GUITAR → Connection threads glow
        // ═══════════════════════════════════════════════════════════════════
        connectionPoints.forEach((p, i) => {
          const wobble = Math.sin(time * 0.5 + p.phase) * 2;
          p.mesh.position.y = p.y + wobble;
          p.mat.opacity = 0.3 + guitarEnergy * 0.6;
          p.mesh.scale.setScalar(1 + guitarEnergy * 0.8);
        });

        threads.forEach(thread => {
          thread.userData.mat.opacity = thread.userData.baseOpacity + guitarEnergy * 0.4;
        });

        // ═══════════════════════════════════════════════════════════════════
        // VOCALS → Conversation sparks orbit and glow
        // ═══════════════════════════════════════════════════════════════════
        const sPos = sparkGeom.attributes.position.array;
        for (let i = 0; i < sparkCount; i++) {
          const d = sparkData[i];
          // Orbit around center, faster with vocals
          d.angle += d.orbitSpeed * 0.02 * (1 + vocalEnergy * 2);
          const r = d.baseRadius + Math.sin(time * 2 + d.phase) * 1;
          sPos[i * 3] = Math.cos(d.angle) * r;
          sPos[i * 3 + 1] = d.yBase + Math.sin(time * 0.8 + d.phase) * 1.5;
          sPos[i * 3 + 2] = Math.sin(d.angle) * r;
        }
        sparkGeom.attributes.position.needsUpdate = true;
        sparkMat.opacity = 0.3 + vocalEnergy * 0.6;
        sparkMat.size = 0.12 + vocalEnergy * 0.25;

        // ═══════════════════════════════════════════════════════════════════
        // PERCUSSION → Dust shimmer
        // ═══════════════════════════════════════════════════════════════════
        const dPos = dustGeom.attributes.position.array;
        if (!initialized && shipPos) {
          for (let i = 0; i < dustCount; i++) {
            dPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
          }
          initialized = true;
        }

        for (let i = 0; i < dustCount; i++) {
          const d = dustData[i];
          dPos[i * 3] += d.driftX + (Math.random() - 0.5) * percEnergy * 0.1;
          dPos[i * 3 + 1] += d.driftY + Math.sin(time * d.speed + d.phase) * 0.01;

          // Keep near ship
          if (dPos[i * 3 + 2] < shipZ - 45 || dPos[i * 3 + 2] > shipZ + 45) {
            dPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
            dPos[i * 3] = (Math.random() - 0.5) * 60;
            dPos[i * 3 + 1] = Math.random() * 25;
          }
        }
        dustGeom.attributes.position.needsUpdate = true;
        dustMat.opacity = 0.25 + percEnergy * 0.4;
        dustMat.size = 0.1 + percEnergy * 0.15;

        // Group follows ship
        group.position.z = shipZ;
        threadGroup.position.z = shipZ;
        rippleGroup.position.z = shipZ;
      },
      dispose() {
        scene.remove(phoneGroup);
        phoneGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API - Scene builder registry
  // ═══════════════════════════════════════════════════════════════════════════
  return {
    builders: {
      "Data Tide": buildDataTide,
      "Soft Systems": buildSoftSystems,
      "Beast Mode": buildBeastMode,
      "Dreams Bleed Into Dashboards": buildDreamsDashboards,
      "Signal Integrity": buildSignalIntegrity,
      "Gi Mi Di Reins": buildGiMiDiReins,
      "Trade You My Hands": buildTradeHands,
      "Push Harder": buildPushHarder,
      "The Last Dragon": buildLastDragon,
      "Who's Learning Who": buildWhosLearning,
      "Terms & Conditions": buildTermsConditions,
      "Turn Your Phone Face Down": buildPhoneFaceDown
    },

    build(trackTitle, THREE, scene, audioData) {
      const builder = this.builders[trackTitle];
      if (builder) {
        console.log("Building custom scene for:", trackTitle);
        return builder(THREE, scene, audioData);
      }
      console.log("No custom scene for:", trackTitle);
      return null;
    }
  };
})();
