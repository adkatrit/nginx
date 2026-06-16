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
      const height = 12 + Math.random() * 51;
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
      const height = 8 + Math.random() * 34;
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
      const height = 3 + Math.random() * 7.5;
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
      const height = 15 + Math.random() * 45;
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
      const height = 12 + Math.random() * 43.5;
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
      const height = 0.5 + Math.random() * 12.25;
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
  // TRADE YOU MY HANDS - Dense Cybernetic Jungle
  // Towering bio-mechanical trees, glowing data vines, bioluminescent undergrowth
  // Theme: Nature and technology in symbiosis - organic circuits, living code
  // ═══════════════════════════════════════════════════════════════════════════
  function buildTradeHands(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Very light fog - ground visible
    scene.fog = new THREE.FogExp2(0x030101, 0.003);

    // === MYCELIUM NETWORK GROUND (TSL) ===
    const TSL = window._TSL;
    const {
      Fn, float, vec2, vec3, vec4, uniform, uv: tslUV,
      positionWorld,
      mix: tslMix, sin: tslSin, cos: tslCos, abs: tslAbs, pow: tslPow,
      step: tslStep, smoothstep: tslSmoothstep, clamp: tslClamp,
      fract: tslFract, floor: tslFloor, dot: tslDot,
      length: tslLength, sqrt: tslSqrt, min: tslMin, max: tslMax,
      normalize: tslNormalize, atan2: tslAtan2, exp: tslExp, select,
      mx_noise_float,
    } = TSL;

    // TSL hash
    const hash = (p) => tslFract(tslSin(tslDot(p, vec2(127.1, 311.7))).mul(43758.5453));
    // TSL noise (value noise via hash)
    const noise2d = (p) => {
      const i = vec2(tslFloor(p.x), tslFloor(p.y));
      const f = vec2(tslFract(p.x), tslFract(p.y));
      const fx = f.x.mul(f.x).mul(float(3).sub(f.x.mul(2)));
      const fy = f.y.mul(f.y).mul(float(3).sub(f.y.mul(2)));
      const a = hash(i);
      const b = hash(i.add(vec2(1, 0)));
      const c = hash(i.add(vec2(0, 1)));
      const d = hash(i.add(vec2(1, 1)));
      return tslMix(tslMix(a, b, fx), tslMix(c, d, fx), fy);
    };

    // Voronoi (unrolled 3x3 = 9 iterations)
    const voronoi = (p) => {
      const n = vec2(tslFloor(p.x), tslFloor(p.y));
      const f = vec2(tslFract(p.x), tslFract(p.y));
      let minDist = float(8).toVar();
      let secondDist = float(8).toVar();
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const g = vec2(i, j);
          const ng = n.add(g);
          const ox = hash(ng);
          const oy = hash(ng.add(100));
          const diffX = float(i).add(ox).sub(f.x);
          const diffY = float(j).add(oy).sub(f.y);
          const dd = diffX.mul(diffX).add(diffY.mul(diffY));
          // Two-pass min tracking using select
          const newSecond = select(dd.lessThan(minDist), minDist, select(dd.lessThan(secondDist), dd, secondDist));
          const newMin = select(dd.lessThan(minDist), dd, minDist);
          minDist.assign(newMin);
          secondDist.assign(newSecond);
        }
      }
      return vec2(tslSqrt(minDist), tslSqrt(secondDist));
    };

    const groundUniforms = {
      time: uniform(0),
      bassEnergy: uniform(0),
      drumEnergy: uniform(0),
      patternScale: uniform(25),
      veinThickness: uniform(0.09),
      glowIntensity: uniform(0),
      dataFlowSpeed: uniform(6),
      nodeSize: uniform(0.21),
      baseColor: uniform(new THREE.Vector3(0.105, 0.13, 0.12)),
      glowColor: uniform(new THREE.Vector3(0.3, 0.65, 0.75)),
    };

    const groundColorNode = Fn(() => {
      const worldPos = positionWorld;
      const geomUV = tslUV();
      const uvCoord = worldPos.xz.mul(groundUniforms.patternScale).mul(0.02);

      // Edge fade
      const dist = tslLength(geomUV.sub(0.5)).mul(2);
      const fade = tslSmoothstep(float(0.7), float(1), dist);

      // Mycelium network
      const vor = voronoi(uvCoord);
      const edge = vor.y.sub(vor.x);
      const vt = groundUniforms.veinThickness;
      const veins = tslSmoothstep(float(0), vt, edge).mul(float(1).sub(tslSmoothstep(vt, vt.mul(2.5), edge)));

      // Fine network
      const vor2 = voronoi(uvCoord.mul(2));
      const edge2 = vor2.y.sub(vor2.x);
      const fineVeins = tslSmoothstep(float(0), vt.mul(0.67), edge2)
        .mul(float(1).sub(tslSmoothstep(vt.mul(0.67), vt.mul(1.67), edge2)));

      // Data streams
      const flow = tslFract(vor.x.mul(4).sub(groundUniforms.time.mul(groundUniforms.dataFlowSpeed)));
      const dataStream = veins.mul(tslSmoothstep(float(0), float(0.15), flow)).mul(tslSmoothstep(float(0.5), float(0.25), flow));

      // Colors
      const darkSoil = groundUniforms.baseColor;
      const myceliumGlow = groundUniforms.glowColor;
      const dataColor = vec3(0.2, 1.0, 0.9);
      const nodeColor = vec3(0.9, 0.3, 1.0);

      // Base ground with noise variation
      const c = vec3(darkSoil).mul(float(0.8).add(noise2d(uvCoord.mul(3)).mul(0.4))).toVar();

      // Glowing mycelium
      const bassGlow = groundUniforms.glowIntensity.add(groundUniforms.bassEnergy.mul(1.2));
      c.addAssign(vec3(myceliumGlow).mul(veins).mul(bassGlow));
      c.addAssign(vec3(myceliumGlow).mul(fineVeins).mul(bassGlow).mul(0.4));

      // Flowing data
      c.addAssign(dataColor.mul(dataStream).mul(float(0.6).add(groundUniforms.bassEnergy)));

      // Nodes
      const nodes = tslSmoothstep(groundUniforms.nodeSize, float(0), vor.x);
      c.addAssign(nodeColor.mul(nodes).mul(float(0.4).add(groundUniforms.drumEnergy.mul(1.2))));

      // Spots
      const spots = tslSmoothstep(float(0.72), float(0.78), noise2d(uvCoord.mul(0.5).add(groundUniforms.time.mul(0.1))));
      c.addAssign(vec3(0.1, 0.6, 0.4).mul(spots).mul(float(0.3).add(groundUniforms.bassEnergy.mul(0.5))));

      // Edge fade
      c.assign(tslMix(c, vec3(0.01, 0.005, 0.005), fade));

      return vec4(c, 1);
    })();

    const groundMat = new TSL.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      colorNode: groundColorNode,
    });

    // EXPOSE GLOBALLY for scene tuner access
    window._tradeHandsGround = {
      uniforms: groundUniforms,
      material: groundMat
    };
    console.log('[Trade You My Hands] Ground exposed globally:', window._tradeHandsGround);

    // Large terrain plane with displacement
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000, 100, 100),
      groundMat
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -1.5;  // Above the grid floor (at y=-2)
    groundPlane.renderOrder = 1;  // Render after other ground elements
    scene.add(groundPlane);

    // === SUNRISE SKY SHADER - TSL Vocal Reactive ===
    const skyUniforms = {
      time: uniform(0),
      vocalEnergy: uniform(0),
      bassEnergy: uniform(0),
      drumEnergy: uniform(0),
      luminosityMin: uniform(0.35),
      luminosityRange: uniform(1.15),
      sunGlowIntensity: uniform(0.15),
      horizonIntensity: uniform(0.1),
    };

    const sunriseColorNode = Fn(() => {
      const worldPos = positionWorld;
      const dir = tslNormalize(worldPos);
      const y = dir.y;
      const x = tslAtan2(dir.x, dir.z).div(3.14159);
      const v = skyUniforms.vocalEnergy;
      const b = skyUniforms.bassEnergy;
      const d = skyUniforms.drumEnergy;

      // Colors
      const groundColor = vec3(0.015, 0.01, 0.008);
      const twilight = vec3(0.12, 0.04, 0.16);
      const rose = vec3(0.3, 0.07, 0.12);
      const coral = vec3(0.55, 0.15, 0.06);
      const orange = vec3(0.8, 0.3, 0.04);
      const gold = vec3(0.9, 0.5, 0.06);

      // Ground below horizon
      const groundFade = tslSmoothstep(float(-0.5), float(-0.05), y);
      const groundOut = vec3(groundColor).mul(float(0.3).add(groundFade.mul(0.7)));

      // Build sky gradient using select chains (replaces if/else)
      const t1 = y.add(0.05).div(0.1);
      const t2 = y.sub(0.05).div(0.07);
      const t3 = y.sub(0.12).div(0.08);
      const t4 = y.sub(0.2).div(0.1);
      const t5 = y.sub(0.3).div(0.12);
      const t6 = y.sub(0.42).div(0.58);
      const baseColor = select(y.lessThan(0.05),
        tslMix(groundColor.mul(2), twilight, tslClamp(t1, 0, 1)),
        select(y.lessThan(0.12),
          tslMix(twilight, rose, tslClamp(t2, 0, 1)),
          select(y.lessThan(0.2),
            tslMix(rose, coral, tslClamp(t3, 0, 1)),
            select(y.lessThan(0.3),
              tslMix(coral, orange, tslClamp(t4, 0, 1)),
              select(y.lessThan(0.42),
                tslMix(orange, gold, tslClamp(t5, 0, 1)),
                tslMix(gold, twilight, tslClamp(t6, 0, 1))
              )))));

      // Luminosity
      const luminosity = skyUniforms.luminosityMin.add(v.mul(skyUniforms.luminosityRange));
      const c = baseColor.mul(luminosity).toVar();

      // Sun glow
      const sunDist = tslLength(vec2(x, y.sub(0.08)));
      const sunGlow = tslSmoothstep(float(0.35), float(0.05), sunDist);
      c.addAssign(gold.mul(sunGlow).mul(skyUniforms.sunGlowIntensity.add(v.mul(0.6))).mul(luminosity));

      // Horizon line
      const horizonLine = tslExp(tslAbs(y.sub(0.03)).negate().mul(25));
      c.addAssign(orange.mul(horizonLine).mul(skyUniforms.horizonIntensity.add(v.mul(0.4))).mul(luminosity));

      // Light rays (always compute, multiply by threshold mask so rays vanish when v <= 0.25)
      const rayAngle = x.mul(8);
      const rays = tslPow(tslAbs(tslSin(rayAngle)), float(10));
      const rayMask = tslSmoothstep(float(0.06), float(0.3), y).mul(tslSmoothstep(float(0.55), float(0.2), y));
      const rayThreshold = tslMax(float(0), v.sub(0.25));
      const rayIntensity = rays.mul(rayMask).mul(rayThreshold).mul(1.2);
      c.addAssign(coral.mul(rayIntensity).mul(0.3));

      // Drum flash
      c.mulAssign(float(1).add(d.mul(0.4).mul(tslSmoothstep(float(0.2), float(-0.2), y))));

      // Bass purple depth
      const bassColor = vec3(0.1, 0.03, 0.15);
      c.addAssign(bassColor.mul(b).mul(tslSmoothstep(float(0.1), float(-0.1), y)).mul(0.5));

      // Select ground vs sky based on y position
      const result = select(y.lessThan(-0.05), groundOut, c);
      return vec4(result, 1);
    })();

    const skyMat = new TSL.MeshBasicNodeMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      colorNode: sunriseColorNode,
    });

    const skyGeom = new THREE.SphereGeometry(200, 32, 32);
    const sky = new THREE.Mesh(skyGeom, skyMat);
    scene.add(sky);

    // === COLOR PALETTE (warm sunrise tones) ===
    const JUNGLE_DARK = 0x1a0a0a;
    const JUNGLE_GREEN = 0x2a3a2a;
    const CYBER_TEAL = 0x00ffaa;
    const CYBER_BLUE = 0x00aaff;
    const BIOLUM_PINK = 0xff44aa;
    const BIOLUM_ORANGE = 0xffaa22;

    // === TREES - Tall procedural jungle trees with cybernetic elements ===
    const trees = [];
    const treeGroup = new THREE.Group();
    const TREE_SPACING = 8;
    const TREES_AHEAD = 25;
    const TREES_BEHIND = 8;
    let nextTreeZ = -60;

    // Create circuit texture for bark
    function createCircuitCanvas() {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Dark bark base
      ctx.fillStyle = '#0a1a0d';
      ctx.fillRect(0, 0, 128, 256);

      // Circuit lines
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;

      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        let x = Math.random() * 128;
        let y = 0;
        ctx.moveTo(x, y);
        while (y < 256) {
          y += 10 + Math.random() * 30;
          if (Math.random() > 0.5) {
            x += (Math.random() - 0.5) * 40;
            x = Math.max(5, Math.min(123, x));
          }
          ctx.lineTo(x, y);
          // Occasional node
          if (Math.random() > 0.7) {
            ctx.fillStyle = '#00ffaa';
            ctx.fillRect(x - 2, y - 2, 4, 4);
          }
        }
        ctx.stroke();
      }

      return canvas;
    }

    const circuitCanvas = createCircuitCanvas();
    const circuitTexture = new THREE.CanvasTexture(circuitCanvas);
    circuitTexture.wrapS = THREE.RepeatWrapping;
    circuitTexture.wrapT = THREE.RepeatWrapping;

    function spawnTree(z) {
      const treeObj = new THREE.Group();
      const side = Math.random() > 0.5 ? 1 : -1;
      const xOffset = side * (5 + Math.random() * 12);

      // Tree height varies significantly for dense canopy feel
      const height = 18 + Math.random() * 42;
      const trunkRadius = 0.4 + Math.random() * 0.5;

      // Trunk - tapered cylinder with circuit bark
      const trunkGeom = new THREE.CylinderGeometry(
        trunkRadius * 0.6, trunkRadius, height, 8, 4
      );
      const trunkMat = new THREE.MeshStandardMaterial({
        color: JUNGLE_DARK,
        roughness: 0.9,
        metalness: 0.1,
        emissive: CYBER_TEAL,
        emissiveIntensity: 0.05,
        emissiveMap: circuitTexture
      });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = height / 2 - 5;
      treeObj.add(trunk);

      // Glowing data veins running up trunk
      const vineCount = 2 + Math.floor(Math.random() * 3);
      for (let v = 0; v < vineCount; v++) {
        const vineGeom = new THREE.BufferGeometry();
        const vinePoints = [];
        const vineAngle = (v / vineCount) * Math.PI * 2 + Math.random() * 0.5;

        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const spiralAngle = vineAngle + t * Math.PI * (1 + Math.random());
          const r = trunkRadius + 0.05 + Math.sin(t * Math.PI * 4) * 0.08;
          vinePoints.push(
            Math.cos(spiralAngle) * r,
            t * height - 5,
            Math.sin(spiralAngle) * r
          );
        }
        vineGeom.setAttribute('position', new THREE.Float32BufferAttribute(vinePoints, 3));

        const vineMat = new THREE.LineBasicMaterial({
          color: Math.random() > 0.5 ? CYBER_TEAL : CYBER_BLUE,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          linewidth: 2  // Thicker lines
        });
        const vine = new THREE.Line(vineGeom, vineMat);
        vine.userData.vineMat = vineMat;
        treeObj.add(vine);
      }

      // Canopy - multiple layered leaf clusters
      const canopyLayers = 3 + Math.floor(Math.random() * 3);
      for (let layer = 0; layer < canopyLayers; layer++) {
        const layerHeight = height - 3 - layer * 3 + Math.random() * 2;
        const layerRadius = 2 + (canopyLayers - layer) * 1.5 + Math.random() * 2;

        // Leaf cluster geometry - stretched icosahedron
        const leafGeom = new THREE.IcosahedronGeometry(layerRadius, 1);
        leafGeom.scale(1, 0.4, 1);

        const leafMat = new THREE.MeshStandardMaterial({
          color: JUNGLE_GREEN,
          roughness: 0.7,
          metalness: 0.2,
          transparent: true,
          opacity: 0.85,
          emissive: CYBER_TEAL,
          emissiveIntensity: 0.03,
          side: THREE.DoubleSide
        });

        const leaves = new THREE.Mesh(leafGeom, leafMat);
        leaves.position.y = layerHeight;
        leaves.position.x = (Math.random() - 0.5) * 2;
        leaves.position.z = (Math.random() - 0.5) * 2;
        leaves.rotation.y = Math.random() * Math.PI;
        leaves.userData.leafMat = leafMat;
        treeObj.add(leaves);
      }

      // Occasional hanging vines with data nodes
      if (Math.random() > 0.4) {
        const hangingVineCount = 1 + Math.floor(Math.random() * 3);
        for (let hv = 0; hv < hangingVineCount; hv++) {
          const vineLen = 4 + Math.random() * 8;
          const vineGeom = new THREE.CylinderGeometry(0.02, 0.02, vineLen, 4);
          const vineMat = new THREE.MeshBasicMaterial({
            color: 0x2a4a3a,
            transparent: true,
            opacity: 0.7
          });
          const hangVine = new THREE.Mesh(vineGeom, vineMat);
          hangVine.position.set(
            (Math.random() - 0.5) * 3,
            height - 5 - vineLen / 2,
            (Math.random() - 0.5) * 3
          );
          treeObj.add(hangVine);

          // Glowing node at bottom
          const nodeGeom = new THREE.SphereGeometry(0.08, 8, 8);
          const nodeMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? BIOLUM_PINK : BIOLUM_ORANGE,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
          });
          const node = new THREE.Mesh(nodeGeom, nodeMat);
          node.position.copy(hangVine.position);
          node.position.y -= vineLen / 2;
          node.userData.nodeMat = nodeMat;
          node.userData.baseY = node.position.y;
          node.userData.phase = Math.random() * Math.PI * 2;
          treeObj.add(node);
        }
      }

      treeObj.position.set(xOffset, 0, z + Math.random() * 4);
      treeObj.rotation.y = Math.random() * Math.PI * 2;
      treeObj.userData = {
        spawnZ: z,
        phase: Math.random() * Math.PI * 2,
        trunkMat,
        swaySpeed: 0.2 + Math.random() * 0.3
      };

      treeGroup.add(treeObj);
      trees.push(treeObj);
    }

    // Initial tree spawning
    for (let z = -60; z < 200; z += TREE_SPACING) {
      spawnTree(z);
      nextTreeZ = z + TREE_SPACING;
    }
    scene.add(treeGroup);

    // === BIOLUMINESCENT UNDERGROWTH ===
    const undergrowth = [];
    const undergrowthGroup = new THREE.Group();
    const UNDERGROWTH_SPACING = 3;
    let nextUndergrowthZ = -50;

    function spawnUndergrowth(z) {
      const plantGroup = new THREE.Group();
      const side = Math.random() > 0.5 ? 1 : -1;
      const xOffset = side * (2 + Math.random() * 15);

      // Glowing mushroom cluster or fern
      const plantType = Math.random();

      if (plantType < 0.5) {
        // Bioluminescent mushroom cluster
        const mushCount = 2 + Math.floor(Math.random() * 4);
        for (let m = 0; m < mushCount; m++) {
          const capRadius = 0.15 + Math.random() * 0.25;
          const stemHeight = 0.2 + Math.random() * 0.4;

          // Stem
          const stemGeom = new THREE.CylinderGeometry(0.03, 0.04, stemHeight, 6);
          const stemMat = new THREE.MeshStandardMaterial({
            color: 0x2a3a2a,
            roughness: 0.8
          });
          const stem = new THREE.Mesh(stemGeom, stemMat);
          stem.position.set(
            (Math.random() - 0.5) * 0.5,
            stemHeight / 2 - 4.5,
            (Math.random() - 0.5) * 0.5
          );
          plantGroup.add(stem);

          // Glowing cap
          const capGeom = new THREE.SphereGeometry(capRadius, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
          const glowColor = Math.random() > 0.5 ? BIOLUM_PINK : CYBER_TEAL;
          const capMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
          });
          const cap = new THREE.Mesh(capGeom, capMat);
          cap.position.copy(stem.position);
          cap.position.y += stemHeight / 2;
          cap.userData.capMat = capMat;
          cap.userData.phase = Math.random() * Math.PI * 2;
          plantGroup.add(cap);
        }
      } else {
        // Cyber fern with glowing edges
        const frondCount = 3 + Math.floor(Math.random() * 4);
        for (let f = 0; f < frondCount; f++) {
          const frondLen = 0.8 + Math.random() * 1.2;
          const frondAngle = (f / frondCount) * Math.PI * 2;

          const frondShape = new THREE.Shape();
          frondShape.moveTo(0, 0);
          frondShape.quadraticCurveTo(frondLen * 0.5, frondLen * 0.3, frondLen, 0);
          frondShape.quadraticCurveTo(frondLen * 0.5, -frondLen * 0.1, 0, 0);

          const frondGeom = new THREE.ShapeGeometry(frondShape);
          const frondMat = new THREE.MeshBasicMaterial({
            color: 0x1a3a2a,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
          });
          const frond = new THREE.Mesh(frondGeom, frondMat);
          frond.position.y = -4.5;
          frond.rotation.y = frondAngle;
          frond.rotation.x = -0.3 - Math.random() * 0.4;
          plantGroup.add(frond);

          // Glowing edge line
          const edgeGeom = new THREE.BufferGeometry();
          const edgePoints = [];
          for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const x = t * frondLen;
            const y = Math.sin(t * Math.PI) * frondLen * 0.2;
            edgePoints.push(x, y, 0);
          }
          edgeGeom.setAttribute('position', new THREE.Float32BufferAttribute(edgePoints, 3));
          const edgeMat = new THREE.LineBasicMaterial({
            color: CYBER_TEAL,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
          });
          const edge = new THREE.Line(edgeGeom, edgeMat);
          edge.position.copy(frond.position);
          edge.rotation.copy(frond.rotation);
          edge.userData.edgeMat = edgeMat;
          plantGroup.add(edge);
        }
      }

      plantGroup.position.set(xOffset, 0, z + Math.random() * 2);
      plantGroup.userData = { spawnZ: z, phase: Math.random() * Math.PI * 2 };

      undergrowthGroup.add(plantGroup);
      undergrowth.push(plantGroup);
    }

    for (let z = -50; z < 180; z += UNDERGROWTH_SPACING) {
      spawnUndergrowth(z);
      nextUndergrowthZ = z + UNDERGROWTH_SPACING;
    }
    scene.add(undergrowthGroup);

    // === CYBERNETIC FIREFLIES ===
    const fireflyCount = 400;
    const fireflyGeom = new THREE.BufferGeometry();
    const fireflyPos = new Float32Array(fireflyCount * 3);
    const fireflyColors = new Float32Array(fireflyCount * 3);
    const fireflyData = [];

    for (let i = 0; i < fireflyCount; i++) {
      fireflyPos[i * 3] = (Math.random() - 0.5) * 50;
      fireflyPos[i * 3 + 1] = -4 + Math.random() * 20;
      fireflyPos[i * 3 + 2] = Math.random() * 80;

      // Color varies between teal, pink, and orange
      const colorChoice = Math.random();
      let col;
      if (colorChoice < 0.5) {
        col = new THREE.Color(CYBER_TEAL);
      } else if (colorChoice < 0.8) {
        col = new THREE.Color(BIOLUM_PINK);
      } else {
        col = new THREE.Color(BIOLUM_ORANGE);
      }
      fireflyColors[i * 3] = col.r;
      fireflyColors[i * 3 + 1] = col.g;
      fireflyColors[i * 3 + 2] = col.b;

      fireflyData.push({
        speed: 0.3 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.04,
        driftY: (Math.random() - 0.5) * 0.02,
        pulseSpeed: 2 + Math.random() * 4
      });
    }
    fireflyGeom.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
    fireflyGeom.setAttribute('color', new THREE.BufferAttribute(fireflyColors, 3));

    const fireflyMat = new THREE.PointsMaterial({
      size: 0.5,  // Much larger base size
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    const fireflies = new THREE.Points(fireflyGeom, fireflyMat);
    scene.add(fireflies);

    // === CANOPY LIGHT RAYS ===
    const rayCount = 8;
    const rays = [];
    for (let i = 0; i < rayCount; i++) {
      const rayGeom = new THREE.CylinderGeometry(0.1, 2, 25, 8, 1, true);
      const rayMat = new THREE.MeshBasicMaterial({
        color: 0xaaffaa,
        transparent: true,
        opacity: 0.03,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ray = new THREE.Mesh(rayGeom, rayMat);
      ray.position.set(
        (Math.random() - 0.5) * 30,
        8,
        i * 15
      );
      ray.rotation.x = 0.1 + Math.random() * 0.2;
      ray.rotation.z = (Math.random() - 0.5) * 0.3;
      ray.userData = {
        baseX: ray.position.x,
        phase: Math.random() * Math.PI * 2,
        rayMat
      };
      group.add(ray);
      rays.push(ray);
    }

    // === AMBIENT JUNGLE MIST PARTICLES ===
    const mistCount = 300;
    const mistGeom = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);

    for (let i = 0; i < mistCount; i++) {
      mistPos[i * 3] = (Math.random() - 0.5) * 60;
      mistPos[i * 3 + 1] = -4 + Math.random() * 6;
      mistPos[i * 3 + 2] = Math.random() * 100;
    }
    mistGeom.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));

    const mistMat = new THREE.PointsMaterial({
      size: 1.5,
      color: 0x88aa88,
      transparent: true,
      opacity: 0.15,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const mist = new THREE.Points(mistGeom, mistMat);
    scene.add(mist);

    // === LIGHTING ===
    // Warm sunset ambient with slight green tint for jungle
    const ambientLight = new THREE.AmbientLight(0x2a1a15, 0.5);
    scene.add(ambientLight);

    // Cyan accent light (follows ship) - cybernetic element
    const cyberLight = new THREE.PointLight(CYBER_TEAL, 1.5, 25);
    cyberLight.position.set(0, 2, 0);
    group.add(cyberLight);

    // Pink/orange accent for sunset warmth
    const pinkLight = new THREE.PointLight(0xff6644, 1.2, 30);
    pinkLight.position.set(5, -2, 5);
    group.add(pinkLight);

    // Warm sunset directional light from horizon
    const moonLight = new THREE.DirectionalLight(0xff8855, 0.6);
    moonLight.position.set(0, 5, 50);
    scene.add(moonLight);

    scene.add(group);

    let initialized = false;
    let lastDrumPulse = 0;
    let lastBassPulse = 0;
    let lastVocalPulse = 0;
    let lastSynthPulse = 0;

    // === TUNABLE AUDIO REACTIVITY MULTIPLIERS ===
    let bassMultiplier = 6;
    let synthMultiplier = 4;
    let drumSmoothing = 0.85;
    let bassSmoothing = 0.8;
    let vocalSmoothing = 0.9;

    // === TUNABLE TREE PARAMETERS ===
    let trunkGlowBase = 0.05;
    let trunkGlowMult = 1.5;
    let leafGlowBase = 0.02;
    let leafGlowMult = 0.5;

    // === TUNABLE FIREFLY PARAMETERS ===
    let fireflyBaseSize = 0.5;
    let fireflySizeMult = 0.5;
    let fireflyBaseOpacity = 0.7;
    let fireflySwarmIntensity = 1.5;

    // === SCENE TUNER INTEGRATION ===
    if (window.SceneTuner) {
      window.SceneTuner.onUpdate((section, param, value) => {
        console.log('[SceneTuner] Update:', section, param, value);

        // Ground shader parameters - USE GLOBAL REFERENCE
        if (section === 'ground' && window._tradeHandsGround) {
          const u = window._tradeHandsGround.uniforms;
          console.log('[SceneTuner] Ground param via global:', param, '=', value);
          if (param === 'patternScale') u.patternScale.value = value;
          if (param === 'veinThickness') u.veinThickness.value = value;
          if (param === 'glowIntensity') u.glowIntensity.value = value;
          if (param === 'dataFlowSpeed') u.dataFlowSpeed.value = value;
          if (param === 'nodeSize') u.nodeSize.value = value;
          if (param === 'baseColorR') u.baseColor.value.x = value;
          if (param === 'baseColorG') u.baseColor.value.y = value;
          if (param === 'baseColorB') u.baseColor.value.z = value;
          if (param === 'glowColorR') u.glowColor.value.x = value;
          if (param === 'glowColorG') u.glowColor.value.y = value;
          if (param === 'glowColorB') u.glowColor.value.z = value;
          // Verify uniform update worked
          console.log('[SceneTuner] Uniform values now:', {
            patternScale: u.patternScale.value,
            glowIntensity: u.glowIntensity.value,
            materialUniforms: window._tradeHandsGround.material.uniforms.patternScale.value
          });
        }
        // Audio reactivity
        if (section === 'audio') {
          if (param === 'bassMultiplier') bassMultiplier = value;
          if (param === 'synthMultiplier') synthMultiplier = value;
          if (param === 'drumSmoothing') drumSmoothing = value;
          if (param === 'bassSmoothing') bassSmoothing = value;
          if (param === 'vocalSmoothing') vocalSmoothing = value;
        }
        // Fog
        if (section === 'fog') {
          if (param === 'density') scene.fog.density = value;
        }
        // Sky shader
        if (section === 'sky') {
          if (param === 'luminosityMin') skyUniforms.luminosityMin.value = value;
          if (param === 'luminosityRange') skyUniforms.luminosityRange.value = value;
          if (param === 'sunGlowIntensity') skyUniforms.sunGlowIntensity.value = value;
          if (param === 'horizonIntensity') skyUniforms.horizonIntensity.value = value;
          // TSL uniforms update automatically, no needsUpdate required
        }
        // Trees
        if (section === 'trees') {
          if (param === 'trunkGlowBase') trunkGlowBase = value;
          if (param === 'trunkGlowMult') trunkGlowMult = value;
          if (param === 'leafGlowBase') leafGlowBase = value;
          if (param === 'leafGlowMult') leafGlowMult = value;
        }
        // Fireflies
        if (section === 'fireflies') {
          if (param === 'baseSize') fireflyBaseSize = value;
          if (param === 'sizeMultiplier') fireflySizeMult = value;
          if (param === 'baseOpacity') fireflyBaseOpacity = value;
          if (param === 'swarmIntensity') fireflySwarmIntensity = value;
        }
      });
      console.log('[Trade You My Hands] Scene tuner connected - Press T to toggle');
    }

    return {
      group,
      // STRICT 1:1 stem-to-effect mapping (4 stems only)
      stemEffects: {
        drums: { target: 'terrain', effect: 'impact', color: '#ff4444' },
        bass: { target: 'trees', effect: 'glow', color: '#4444ff' },
        vocals: { target: 'sky', effect: 'brightness', color: '#ffaa44' },
        synth: { target: 'fireflies', effect: 'activity', color: '#00ffaa' }
      },

      update(time, freq, amplitude, shipPos, shipSpeed, stemData) {
        const shipZ = shipPos ? shipPos.z : 0;

        // STRICT 1:1 STEM MAPPING - Only 4 stems
        const drumEnergy = getEffectiveStemEnergy('drums', stemData?.drums?.energy || 0);
        // Bass is weak in this track - amplify with tunable multiplier
        const rawBass = getEffectiveStemEnergy('bass', stemData?.bass?.energy || 0);
        const bassEnergy = Math.min(1.0, rawBass * bassMultiplier);
        const vocalEnergy = getEffectiveStemEnergy('vocals', stemData?.vocals?.energy || 0);
        // Synth is also minimal - amplify with tunable multiplier
        const rawSynth = getEffectiveStemEnergy('synth', stemData?.synth?.energy || 0);
        const synthEnergy = Math.min(1.0, rawSynth * synthMultiplier);

        // Smooth energy transitions - tunable smoothing
        lastDrumPulse = lastDrumPulse * drumSmoothing + drumEnergy * (1 - drumSmoothing);
        lastBassPulse = lastBassPulse * bassSmoothing + bassEnergy * (1 - bassSmoothing);
        lastVocalPulse = lastVocalPulse * vocalSmoothing + vocalEnergy * (1 - vocalSmoothing);
        lastSynthPulse = lastSynthPulse * bassSmoothing + synthEnergy * (1 - bassSmoothing);

        // === SUNRISE SKY & GROUND - Follow player ===
        if (shipPos) {
          sky.position.set(shipPos.x, shipPos.y, shipPos.z);
          groundPlane.position.x = shipPos.x;
          groundPlane.position.z = shipPos.z;
        }

        // Update ground shader - mycelium reacts to bass, terrain to drums
        groundUniforms.time.value = time;
        groundUniforms.bassEnergy.value = lastBassPulse;
        groundUniforms.drumEnergy.value = lastDrumPulse;

        // Update sky shader uniforms - full stem reactivity
        skyUniforms.time.value = time;
        skyUniforms.vocalEnergy.value = lastVocalPulse;
        skyUniforms.bassEnergy.value = lastBassPulse;
        skyUniforms.drumEnergy.value = lastDrumPulse;

        // Fog - very light, clears more with vocals
        scene.fog.color.setHSL(
          0.02 + lastVocalPulse * 0.02,
          0.1 + lastVocalPulse * 0.1,
          0.015 + lastVocalPulse * 0.02
        );
        scene.fog.density = 0.003 - lastVocalPulse * 0.001;

        // === TREE SPAWNING & CLEANUP ===
        const spawnTreeZ = shipZ + TREES_AHEAD * TREE_SPACING;
        const cleanTreeZ = shipZ - TREES_BEHIND * TREE_SPACING;

        while (nextTreeZ < spawnTreeZ) {
          spawnTree(nextTreeZ);
          nextTreeZ += TREE_SPACING;
        }

        for (let i = trees.length - 1; i >= 0; i--) {
          if (trees[i].userData.spawnZ < cleanTreeZ) {
            const t = trees[i];
            treeGroup.remove(t);
            t.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            trees.splice(i, 1);
          }
        }

        // === ANIMATE TREES ===
        trees.forEach(tree => {
          const data = tree.userData;

          // Gentle swaying
          tree.rotation.z = Math.sin(time * data.swaySpeed + data.phase) * 0.02;

          // BASS → Tree trunk glows cyan-blue (bass now amplified)
          if (data.trunkMat) {
            // Tunable base glow, scales up with bass
            data.trunkMat.emissiveIntensity = trunkGlowBase + lastBassPulse * trunkGlowMult;
            data.trunkMat.emissive.setHex(0x00aaff);
          }

          // Animate data vines and nodes - react to amplified bass
          tree.traverse(child => {
            if (child.userData.vineMat) {
              // Vines glow brighter with bass
              child.userData.vineMat.opacity = 0.4 + lastBassPulse * 0.6;
            }
            if (child.userData.leafMat) {
              // Leaves glow cyan with bass - tunable
              child.userData.leafMat.emissiveIntensity = leafGlowBase + lastBassPulse * leafGlowMult;
              child.userData.leafMat.emissive.setHex(0x00ffaa);
            }
            if (child.userData.nodeMat) {
              // Hanging nodes pulse with bass
              const nodePhase = child.userData.phase;
              child.userData.nodeMat.opacity = 0.4 + Math.sin(time * 3 + nodePhase) * 0.2 + lastBassPulse * 0.4;
              child.position.y = child.userData.baseY + Math.sin(time * 2 + nodePhase) * 0.15;
            }
          });
        });

        // === UNDERGROWTH SPAWNING & CLEANUP ===
        const spawnUnderZ = shipZ + 60;
        const cleanUnderZ = shipZ - 30;

        while (nextUndergrowthZ < spawnUnderZ) {
          spawnUndergrowth(nextUndergrowthZ);
          nextUndergrowthZ += UNDERGROWTH_SPACING;
        }

        for (let i = undergrowth.length - 1; i >= 0; i--) {
          if (undergrowth[i].userData.spawnZ < cleanUnderZ) {
            const u = undergrowth[i];
            undergrowthGroup.remove(u);
            u.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            undergrowth.splice(i, 1);
          }
        }

        // === ANIMATE UNDERGROWTH ===
        // Ambient glow with subtle drum response
        undergrowth.forEach(plant => {
          plant.traverse(child => {
            if (child.userData.capMat) {
              const p = child.userData.phase;
              // Ambient pulse + drum flash
              child.userData.capMat.opacity = 0.3 + Math.sin(time * 2 + p) * 0.15 + lastDrumPulse * 0.25;
            }
            if (child.userData.edgeMat) {
              child.userData.edgeMat.opacity = 0.25 + lastDrumPulse * 0.3;
            }
          });
        });

        // === ANIMATE FIREFLIES ===
        const ffPos = fireflyGeom.attributes.position.array;
        if (!initialized && shipPos) {
          for (let i = 0; i < fireflyCount; i++) {
            ffPos[i * 3 + 2] = shipZ - 20 + Math.random() * 60;
          }
          initialized = true;
        }

        // SYNTH → Firefly swarm activity (green-cyan glow)
        // Tunable base movement, synth adds frenzy
        const swarmIntensity = fireflySwarmIntensity + lastSynthPulse * 4;
        for (let i = 0; i < fireflyCount; i++) {
          const d = fireflyData[i];

          // Movement - always active, even more with synth
          ffPos[i * 3] += (Math.sin(time * d.speed + d.phase) * 0.05 + d.driftX) * swarmIntensity;
          ffPos[i * 3 + 1] += (Math.cos(time * d.speed * 0.7 + d.phase) * 0.03 + d.driftY) * swarmIntensity;

          // Boundary wrapping
          if (ffPos[i * 3] < -30) ffPos[i * 3] = 30;
          if (ffPos[i * 3] > 30) ffPos[i * 3] = -30;
          if (ffPos[i * 3 + 1] < -5) ffPos[i * 3 + 1] = 15;
          if (ffPos[i * 3 + 1] > 20) ffPos[i * 3 + 1] = -4;

          // Keep near ship
          if (ffPos[i * 3 + 2] < shipZ - 25 || ffPos[i * 3 + 2] > shipZ + 40) {
            ffPos[i * 3 + 2] = shipZ - 20 + Math.random() * 60;
            ffPos[i * 3] = (Math.random() - 0.5) * 50;
          }
        }
        fireflyGeom.attributes.position.needsUpdate = true;
        // Tunable base visibility - synth boosts further
        fireflyMat.opacity = fireflyBaseOpacity + lastSynthPulse * 0.3;
        fireflyMat.size = fireflyBaseSize + lastSynthPulse * fireflySizeMult;

        // === ANIMATE CANOPY RAYS ===
        rays.forEach((ray, idx) => {
          const rd = ray.userData;
          // Gentle drift
          ray.position.x = rd.baseX + Math.sin(time * 0.3 + rd.phase) * 2;
          ray.position.z = shipZ + idx * 15 - 10;

          // DRUMS → Ray opacity (flash on drum hits)
          rd.rayMat.opacity = 0.02 + lastDrumPulse * 0.1;
        });

        // === ANIMATE MIST ===
        const mPos = mistGeom.attributes.position.array;
        for (let i = 0; i < mistCount; i++) {
          mPos[i * 3] += 0.01;
          if (mPos[i * 3] > 35) mPos[i * 3] = -35;

          if (mPos[i * 3 + 2] < shipZ - 30 || mPos[i * 3 + 2] > shipZ + 70) {
            mPos[i * 3 + 2] = shipZ - 25 + Math.random() * 90;
          }
        }
        mistGeom.attributes.position.needsUpdate = true;

        // === LIGHTS ===
        cyberLight.intensity = 1.5 + lastDrumPulse * 3;
        pinkLight.intensity = 0.8 + lastBassPulse * 2;
        pinkLight.position.x = Math.sin(time * 0.5) * 8;

        // Group follows ship
        group.position.z = shipZ;
      },

      dispose() {
        // Sky cleanup
        scene.remove(sky);
        skyGeom.dispose();
        skyMat.dispose();

        // Ground cleanup
        scene.remove(groundPlane);
        groundPlane.geometry.dispose();
        groundMat.dispose();

        scene.remove(treeGroup);
        treeGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(undergrowthGroup);
        undergrowthGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(fireflies);
        fireflyGeom.dispose();
        fireflyMat.dispose();
        scene.remove(mist);
        mistGeom.dispose();
        mistMat.dispose();
        scene.remove(ambientLight);
        scene.remove(moonLight);
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(group);
        scene.fog = null;

        // Clean up global reference
        delete window._tradeHandsGround;
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
      const height = 20 + Math.random() * 70;
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
      const height = 25 + Math.random() * 80;  // 25-105 units tall
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
  // TURN YOUR PHONE FACE DOWN - "The Letting Go"
  // Pure audio-reactive: Phones slowly turn face-down as you disconnect
  // Warm fireflies emerge, stars reveal themselves, intimacy grows with vocals
  // ═══════════════════════════════════════════════════════════════════════════
  function buildPhoneFaceDown(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Hide any EffectsManager effects that persist from user settings
    const hiddenEffects = [];
    scene.traverse(child => {
      if (child.name === 'grid-effects' || child.name === 'lightning-effects' ||
          child.name === 'aurora-effects' || child.name === 'lights-effects' ||
          child.name === 'ride-path' || child.name === 'parallax-backdrop') {
        child.visible = false;
        hiddenEffects.push(child);
      }
    });

    // ═══════════════════════════════════════════════════════════════════════
    // SKY — Physically-based atmospheric scattering (Preetham model)
    // ═══════════════════════════════════════════════════════════════════════
    // Preetham atmospheric sky — TSL NodeMaterial
    // Scattering coefficients computed per-pixel (moved from vertex shader)
    const TSL2 = window._TSL;
    const {
      Fn: Fn2, float: float2, vec2: vec22, vec3: vec32, vec4: vec42, uniform: uniform2,
      positionWorld: positionWorld2, cameraPosition: tslCameraPosition2,
      mix: mix2, smoothstep: smoothstep2, clamp: clamp2,
      sin: sin2, cos: cos2, abs: abs2, pow: pow2, exp: exp2,
      max: max2, dot: dot2, normalize: normalize2, length: length2,
      sqrt: sqrt2,
    } = TSL2;

    const skyUniforms = {
      turbidity: uniform2(10),
      rayleigh: uniform2(3),
      mieCoefficient: uniform2(0.005),
      mieDirectionalG: uniform2(0.7),
      sunPosition: uniform2(new THREE.Vector3()),
      up: uniform2(new THREE.Vector3(0, 1, 0)),
      exposure: uniform2(0.45),
    };

    const preethamColorNode = Fn2(() => {
      const worldPos = positionWorld2;
      const direction = normalize2(worldPos.sub(tslCameraPosition2));

      const upDir = skyUniforms.up;
      const sunPos2 = skyUniforms.sunPosition;
      const sunDirection = normalize2(sunPos2);

      // Precompute scattering (was in vertex shader)
      const totalRayleigh = vec32(5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5);
      const MieConst = vec32(1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14);
      const cutoffAngle = float2(1.6110731556870734);
      const steepness = float2(1.5);
      const EE = float2(1000);
      const e = float2(2.71828182845904523536);

      // Sun intensity
      const zenithAngleCos = clamp2(dot2(sunDirection, upDir), -1, 1);
      // acos not directly available in TSL — use identity: acos(x) = pi/2 - asin(x), or approximate
      // Actually we can use the ternary approach: compute via the exponential
      // sunIntensity = EE * max(0, 1 - e^(-(cutoffAngle - acos(zenithAngleCos)) / steepness))
      // For TSL we use .acos() chain method if available, or compute manually
      const zenithAngle = zenithAngleCos.acos();
      const sunE = EE.mul(max2(float2(0), float2(1).sub(pow2(e, cutoffAngle.sub(zenithAngle).div(steepness).negate()))));

      // Sunfade
      const sunfade = float2(1).sub(clamp2(float2(1).sub(exp2(sunPos2.y.div(450000))), 0, 1));

      // Coefficients
      const rayleighCoefficient = skyUniforms.rayleigh.sub(float2(1).sub(sunfade));
      const betaR = totalRayleigh.mul(rayleighCoefficient);
      const mieC = skyUniforms.turbidity.mul(0.2).mul(10e-18);
      const betaM = MieConst.mul(0.434).mul(mieC).mul(skyUniforms.mieCoefficient);

      // Fragment computations
      const pi = float2(3.141592653589793);
      const rayleighZenithLength = float2(8400);
      const mieZenithLength = float2(1250);
      const sunAngularDiameterCos = float2(0.999956676946448);

      const dirZenith = max2(float2(0), dot2(upDir, direction)).acos();
      const invFactor = cos2(dirZenith).add(pow2(float2(93.885).sub(dirZenith.mul(180).div(pi)), float2(-1.253)).mul(0.15)).reciprocal();
      const sR = rayleighZenithLength.mul(invFactor);
      const sM = mieZenithLength.mul(invFactor);

      const Fex = exp2(betaR.mul(sR).add(betaM.mul(sM)).negate());

      const cosTheta = dot2(direction, sunDirection);

      // Rayleigh phase
      const THREE_OVER_SIXTEENPI = float2(0.05968310365946075);
      const rPhase = THREE_OVER_SIXTEENPI.mul(float2(1).add(pow2(cosTheta.mul(0.5).add(0.5), float2(2))));
      const betaRTheta = betaR.mul(rPhase);

      // Mie phase (Henyey-Greenstein)
      const ONE_OVER_FOURPI = float2(0.07957747154594767);
      const g = skyUniforms.mieDirectionalG;
      const g2 = pow2(g, float2(2));
      const hgInverse = pow2(float2(1).sub(g.mul(2).mul(cosTheta)).add(g2), float2(1.5)).reciprocal();
      const mPhase = ONE_OVER_FOURPI.mul(float2(1).sub(g2)).mul(hgInverse);
      const betaMTheta = betaM.mul(mPhase);

      // In-scattering
      const betaSum = betaR.add(betaM);
      const scatterRatio = betaRTheta.add(betaMTheta).div(betaSum);
      const Lin = pow2(scatterRatio.mul(sunE).mul(vec32(1, 1, 1).sub(Fex)), vec32(1.5, 1.5, 1.5)).toVar();

      // Multiple scattering correction
      const sunDotUp = float2(1).sub(dot2(upDir, sunDirection));
      const msCorrection = clamp2(pow2(sunDotUp, float2(5)), 0, 1);
      Lin.mulAssign(mix2(vec32(1, 1, 1), pow2(scatterRatio.mul(sunE).mul(Fex), vec32(0.5, 0.5, 0.5)), msCorrection));

      // L0 + solar disc
      const L0 = vec32(0.1, 0.1, 0.1).mul(Fex).toVar();
      const sundisk = smoothstep2(sunAngularDiameterCos, sunAngularDiameterCos.add(0.00002), cosTheta);
      L0.addAssign(Fex.mul(sunE).mul(19000).mul(sundisk));

      const texColor = Lin.add(L0).mul(0.04).add(vec32(0, 0.0003, 0.00075));
      const gammaExp = float2(1).div(float2(1.2).add(sunfade.mul(1.2)));
      const retColor = pow2(texColor, vec32(gammaExp, gammaExp, gammaExp)).toVar();

      // ACES filmic tone mapping
      const mapped = retColor.mul(skyUniforms.exposure);
      const a = float2(2.51); const b = float2(0.03);
      const c2 = float2(2.43); const d = float2(0.59); const ee = float2(0.14);
      retColor.assign(clamp2(
        mapped.mul(mapped.mul(a).add(b)).div(mapped.mul(mapped.mul(c2).add(d)).add(ee)),
        0, 1));

      // sRGB gamma
      retColor.assign(pow2(retColor, vec32(1.0 / 2.2)));

      return vec42(retColor, 1);
    })();

    const skyMat = new TSL2.MeshBasicNodeMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      colorNode: preethamColorNode,
    });

    const sky = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skyMat);
    sky.scale.setScalar(80);
    scene.add(sky);

    // Sun position: low on the horizon, straight ahead (+Z)
    const sunElevation = 3;
    const phi = (90 - sunElevation) * Math.PI / 180;
    const theta = 0; // +Z direction
    const sunPos = new THREE.Vector3();
    sunPos.setFromSphericalCoords(1, phi, theta);
    skyUniforms.sunPosition.value.copy(sunPos);

    scene.add(group);

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════
    let lastSynthPulse = 0;
    let lastVocalPulse = 0;
    let lastKeyboardPulse = 0;
    let disconnectProgress = 0;
    const baseSunElevation = 3;

    return {
      group,
      stemEffects: {
        drums: { target: 'sky', effect: 'pulse', color: '#ffaa44' },
        bass: { target: 'sky', effect: 'rumble', color: '#ffcc88' },
        vocals: { target: 'sky', effect: 'glow', color: '#ffcc88' },
        synth: { target: 'sky + sun', effect: 'elevation', color: '#ffddaa' },
        guitar: { target: 'sky', effect: 'shimmer', color: '#ffdd66' },
        keyboard: { target: 'sky turbidity', effect: 'haze', color: '#ffaa88' },
        percussion: { target: 'sky', effect: 'pulse', color: '#ffee88' },
        fx: { target: 'sky', effect: 'flash', color: '#ff88ff' }
      },

      update(time, freq, amplitude, shipPos, shipSpeed, audioExtra) {
        const shipZ = shipPos ? shipPos.z : 0;

        // Sky follows player
        sky.position.set(0, 0, shipZ);

        // Keep EffectsManager grids/effects hidden (they can be rebuilt at runtime)
        for (const fx of hiddenEffects) fx.visible = false;

        // Get stem energies
        const vocalEnergy = getEffectiveStemEnergy('vocals', audioExtra?.vocals?.energy || 0);
        const backingEnergy = getEffectiveStemEnergy('backing-vocals', audioExtra?.['backing-vocals']?.energy || 0);
        const synthEnergy = getEffectiveStemEnergy('synth', audioExtra?.synth?.energy || 0);
        const keyboardEnergy = getEffectiveStemEnergy('keyboard', audioExtra?.keyboard?.energy || 0);

        const combinedVocals = Math.max(vocalEnergy, backingEnergy * 0.7);

        lastVocalPulse = lastVocalPulse * 0.88 + combinedVocals * 0.12;
        lastSynthPulse = lastSynthPulse * 0.9 + synthEnergy * 0.1;
        lastKeyboardPulse = lastKeyboardPulse * 0.9 + keyboardEnergy * 0.1;

        disconnectProgress = Math.min(1, disconnectProgress + 0.0003 + lastVocalPulse * 0.002);

        // Sky reacts to music
        const dynElevation = baseSunElevation + lastSynthPulse * 4 + disconnectProgress * 3;
        const dynPhi = (90 - dynElevation) * Math.PI / 180;
        sunPos.setFromSphericalCoords(1, dynPhi, 0);
        skyUniforms.sunPosition.value.copy(sunPos);

        skyUniforms.turbidity.value = 10 + lastKeyboardPulse * 8;
        skyUniforms.mieCoefficient.value = 0.005 + lastVocalPulse * 0.015;
        skyUniforms.exposure.value = 0.4 + disconnectProgress * 0.2 + lastSynthPulse * 0.1;

        group.position.z = shipZ;
      },

      dispose() {
        // Restore hidden effects for other tracks
        for (const fx of hiddenEffects) fx.visible = true;

        scene.remove(sky);
        sky.geometry.dispose();
        skyMat.dispose();

        group.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
        scene.remove(group);
      }
    };
  }





  // ═══════════════════════════════════════════════════════════════════════════
  // TEST - Simple Preetham sky + flying bird
  // ═══════════════════════════════════════════════════════════════════════════
  function buildFlightScene(THREE, scene, audioData, themeName) {
    console.log('[Flight] buildFlightScene called, theme:', themeName);
    const group = new THREE.Group();

    // ── Theme system ──
    const THEMES = window.TERRAIN_THEMES || {};
    let activeTheme = THEMES[themeName] || THEMES["Terms & Conditions"] || Object.values(THEMES)[0];
    if (!activeTheme) {
      console.error('[Flight] No terrain themes available!');
      return { group, update() {}, dispose() { scene.remove(group); } };
    }
    let CHUNK_SIZE = activeTheme.chunkSize || 80;
    let CHUNK_SEGS = activeTheme.chunkSegs || 20;
    let CHUNK_RANGE = activeTheme.chunkRange || 5;
    let currentTime = 0;

    // Hide environment visuals — sky sphere, ground plane, scenery (rocks/cacti), effects
    const hiddenEffects = [];
    scene.traverse(child => {
      if (child.name === 'grid-effects' || child.name === 'lightning-effects' ||
          child.name === 'aurora-effects' || child.name === 'lights-effects' ||
          child.name === 'ride-path' || child.name === 'parallax-backdrop') {
        child.visible = false;
        hiddenEffects.push(child);
      }
      // Hide environment sky sphere (large BackSide sphere)
      if (child.isMesh && child.geometry?.parameters?.radius > 700 &&
          child.material?.side === THREE.BackSide) {
        child.visible = false;
        hiddenEffects.push(child);
      }
      // Hide environment ground plane (large flat plane)
      if (child.isMesh && child.geometry?.parameters?.width > 1000 &&
          child.rotation?.x === -Math.PI / 2) {
        child.visible = false;
        hiddenEffects.push(child);
      }
      // Hide environment instanced scenery (rocks, cacti, etc.)
      if (child.isInstancedMesh) {
        child.visible = false;
        hiddenEffects.push(child);
      }
      // Hide environment audio-reactive terrain chunks (terrain.js TSL shaders)
      if (child.isMesh && child.material?._tslUniforms) {
        child.visible = false;
        hiddenEffects.push(child);
      }
    });

    // Kill environment fog — we want a clear day
    scene.fog = null;
    // Also disable fog on the EnvironmentMode instance so it doesn't re-apply it each frame
    if (window.EnvironmentMode?.instance) {
      window.EnvironmentMode.instance.theme.fogNear = 99999;
      window.EnvironmentMode.instance.theme.fogFar = 100000;
      console.log('[Flight] Disabled environment fog');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PREETHAM SKY
    // ═══════════════════════════════════════════════════════════════════════
    const TSL = window._TSL;
    if (!TSL) {
      console.error('[Flight] window._TSL not available! Preetham sky cannot be created.');
      return { group, update() {}, dispose() { scene.remove(group); } };
    }
    console.log('[Flight] TSL available, building Preetham sky');
    const {
      Fn, float, vec2, vec3, vec4, uniform,
      positionWorld, cameraPosition: tslCameraPosition,
      mix, smoothstep, clamp: tslClamp,
      sin: tslSin, cos: tslCos, abs: tslAbs, pow: tslPow, exp: tslExp,
      max: tslMax, dot: tslDot, normalize: tslNormalize, length: tslLength,
      sqrt: tslSqrt,
    } = TSL;

    const skyUniforms = {
      turbidity: uniform(4),
      rayleigh: uniform(2),
      mieCoefficient: uniform(0.005),
      mieDirectionalG: uniform(0.8),
      sunPosition: uniform(new THREE.Vector3()),
      up: uniform(new THREE.Vector3(0, 1, 0)),
      exposure: uniform(0.5),
    };


    const preethamColorNode = Fn(() => {
      const worldPos = positionWorld;
      const direction = tslNormalize(worldPos.sub(tslCameraPosition));

      const upDir = skyUniforms.up;
      const sunDirection = tslNormalize(skyUniforms.sunPosition);

      const totalRayleigh = vec3(5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5);
      const MieConst = vec3(1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14);
      const cutoffAngle = float(1.6110731556870734);
      const steepness = float(1.5);
      const EE = float(1000);
      const e = float(2.71828182845904523536);

      const zenithAngleCos = tslClamp(tslDot(sunDirection, upDir), -1, 1);
      const zenithAngle = zenithAngleCos.acos();
      const sunE = EE.mul(tslMax(float(0), float(1).sub(tslPow(e, cutoffAngle.sub(zenithAngle).div(steepness).negate()))));

      const sunfade = float(1).sub(tslClamp(float(1).sub(tslExp(skyUniforms.sunPosition.y.div(450000))), 0, 1));
      const rayleighCoefficient = skyUniforms.rayleigh.sub(float(1).sub(sunfade));
      const betaR = totalRayleigh.mul(rayleighCoefficient);
      const mieC = skyUniforms.turbidity.mul(0.2).mul(10e-18);
      const betaM = MieConst.mul(0.434).mul(mieC).mul(skyUniforms.mieCoefficient);

      const pi = float(3.141592653589793);
      const rayleighZenithLength = float(8400);
      const mieZenithLength = float(1250);
      const sunAngularDiameterCos = float(0.999956676946448);

      const dirZenith = tslMax(float(0), tslDot(upDir, direction)).acos();
      const invFactor = tslCos(dirZenith).add(tslPow(float(93.885).sub(dirZenith.mul(180).div(pi)), float(-1.253)).mul(0.15)).reciprocal();
      const sR = rayleighZenithLength.mul(invFactor);
      const sM = mieZenithLength.mul(invFactor);

      const Fex = tslExp(betaR.mul(sR).add(betaM.mul(sM)).negate());
      const cosTheta = tslDot(direction, sunDirection);

      const THREE_OVER_SIXTEENPI = float(0.05968310365946075);
      const rPhase = THREE_OVER_SIXTEENPI.mul(float(1).add(tslPow(cosTheta.mul(0.5).add(0.5), float(2))));
      const betaRTheta = betaR.mul(rPhase);

      const ONE_OVER_FOURPI = float(0.07957747154594767);
      const g = skyUniforms.mieDirectionalG;
      const g2 = tslPow(g, float(2));
      const hgInverse = tslPow(float(1).sub(g.mul(2).mul(cosTheta)).add(g2), float(1.5)).reciprocal();
      const mPhase = ONE_OVER_FOURPI.mul(float(1).sub(g2)).mul(hgInverse);
      const betaMTheta = betaM.mul(mPhase);

      const betaSum = betaR.add(betaM);
      const scatterRatio = betaRTheta.add(betaMTheta).div(betaSum);
      const Lin = tslPow(scatterRatio.mul(sunE).mul(vec3(1, 1, 1).sub(Fex)), vec3(1.5, 1.5, 1.5)).toVar();

      const sunDotUp = float(1).sub(tslDot(upDir, sunDirection));
      const msCorrection = tslClamp(tslPow(sunDotUp, float(5)), 0, 1);
      Lin.mulAssign(mix(vec3(1, 1, 1), tslPow(scatterRatio.mul(sunE).mul(Fex), vec3(0.5, 0.5, 0.5)), msCorrection));

      const L0 = vec3(0.1, 0.1, 0.1).mul(Fex).toVar();
      const sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos.add(0.00002), cosTheta);
      L0.addAssign(Fex.mul(sunE).mul(19000).mul(sundisk));

      const texColor = Lin.add(L0).mul(0.04).add(vec3(0, 0.0003, 0.00075));
      const gammaExp = float(1).div(float(1.2).add(sunfade.mul(1.2)));
      const retColor = tslPow(texColor, vec3(gammaExp, gammaExp, gammaExp)).toVar();

      // ACES tone mapping
      const mapped = retColor.mul(skyUniforms.exposure);
      const a = float(2.51); const b = float(0.03);
      const c = float(2.43); const d = float(0.59); const ee = float(0.14);
      retColor.assign(tslClamp(
        mapped.mul(mapped.mul(a).add(b)).div(mapped.mul(mapped.mul(c).add(d)).add(ee)),
        0, 1));

      retColor.assign(tslPow(retColor, vec3(1.0 / 2.2)));

      // Night sky enhancement — natural deep-blue gradient + airglow when sun is below horizon
      const sunDirUp = tslDot(sunDirection, upDir);
      const nightFade = float(1).sub(smoothstep(float(-0.15), float(0.0), sunDirUp));
      const skyAlt = tslClamp(tslDot(direction, upDir), float(0), float(1));
      // Deep blue zenith → warm-grey horizon. Boosted since fog removal —
      // the fog veil used to provide most of the night sky's luminance.
      const nightZenith = vec3(0.05, 0.055, 0.16);
      const nightHoriz = vec3(0.12, 0.10, 0.09);
      const nightGrad = mix(nightHoriz, nightZenith, tslPow(skyAlt, float(0.5)));
      // Airglow band ~10° above horizon (real atmospheric phenomenon — faint green/amber)
      // Use x*x instead of pow(x,2) — WGSL pow() is undefined for negative bases
      const agDist = skyAlt.sub(float(0.17)).div(float(0.06));
      const agStrength = tslExp(agDist.mul(agDist).negate());
      const airglowCol = vec3(0.016, 0.026, 0.008).mul(agStrength);
      retColor.addAssign(nightGrad.add(airglowCol).mul(nightFade));

      // Twilight — warm horizon glow around the sun's azimuth before sunrise
      // and through low-sun "perpetual dusk" themes. The fog color lerp used
      // to fake this; with fog gone it is modeled explicitly. Display-space
      // addition, same as the night gradient above.
      const flatDir = tslNormalize(vec3(direction.x, float(0.001), direction.z));
      const flatSun = tslNormalize(vec3(sunDirection.x, float(0.001), sunDirection.z));
      const azAlign = tslClamp(tslDot(flatDir, flatSun), float(0), float(1));
      const horizonBand = tslExp(skyAlt.mul(skyAlt).mul(float(-22)));
      const twilightRamp = smoothstep(float(-0.28), float(-0.02), sunDirUp)
        .mul(float(1).sub(smoothstep(float(0.02), float(0.18), sunDirUp)));
      const twilightCol = vec3(0.55, 0.26, 0.10)
        .mul(tslPow(azAlign, float(5)))
        .mul(horizonBand)
        .mul(twilightRamp);
      retColor.addAssign(twilightCol);

      return vec4(retColor, 1);
    })();

    const skyMat = new TSL.MeshBasicNodeMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      colorNode: preethamColorNode,
    });

    // Sky + star dome must be LARGER than the ocean plane (half-extent ~1400)
    // so the opaque water always occludes them — otherwise the additive star
    // dome paints stars over the distant sea. Sits just inside the camera far.
    const skyGeom = new THREE.SphereGeometry(1190, 32, 32);
    const sky = new THREE.Mesh(skyGeom, skyMat);
    group.add(sky);  // child of group so it auto-follows shipZ
    console.log('[Flight] Sky sphere added to group, radius=500, material side=BackSide');

    // ═══════════════════════════════════════════════════════════════════════
    // NIGHT SKY DOME — stars, moon and milky way painted on a texture mapped
    // to a sphere. Renders at infinite apparent distance (no parallax).
    // ═══════════════════════════════════════════════════════════════════════
    const STAR_MAP_W = 2048, STAR_MAP_H = 1024;
    const starMapCanvas = document.createElement('canvas');
    starMapCanvas.width = STAR_MAP_W;
    starMapCanvas.height = STAR_MAP_H;
    const smCtx = starMapCanvas.getContext('2d');

    // Tunable star dome parameters (defaults match scene-tuner.js)
    const starCfg = {
      starCount: 4600, starBrtMin: 0.56, starBrtPow: 5.0,
      starSizeMin: 0.1, starSizeMax: 2.1, starWarmth: 0.8,
      brightCount: 35, brightSize: 1.0, brightAlpha: 1.0,
      mwCount: 1400, mwBrt: 0.18, mwTilt: 63, mwAzimuth: 25, mwWidth: 0.12,
      moonElev: 55, moonAz: 135, moonSize: 18, moonGlow: 3.0, moonBrt: 0.95,
      domeOpacity: 0.15, fadePower: 4.1,
    };

    // Seeded PRNG so repaints with same params give identical star placement
    function mulberry32(seed) {
      return function() {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    function paintStarDome(cfg) {
      const rand = mulberry32(42);  // deterministic seed
      const W = STAR_MAP_W, H = STAR_MAP_H;

      // Helpers
      function skyToPixel(theta, phi) {
        return [theta / (Math.PI * 2) * W, phi / Math.PI * H];
      }
      function paintGlow(cx, cy, radius, r, g, b, alpha) {
        const grad = smCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.3, `rgba(${r},${g},${b},${alpha * 0.6})`);
        grad.addColorStop(0.7, `rgba(${r},${g},${b},${alpha * 0.15})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        smCtx.fillStyle = grad;
        smCtx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }

      smCtx.clearRect(0, 0, W, H);
      smCtx.fillStyle = '#000';
      smCtx.fillRect(0, 0, W, H);

      // ── Background stars ──
      const sizeRange = cfg.starSizeMax - cfg.starSizeMin;
      for (let i = 0; i < cfg.starCount; i++) {
        const theta = rand() * Math.PI * 2;
        const phi = Math.acos(-0.08 + rand() * 1.08);
        const [px, py] = skyToPixel(theta, phi);

        const brt = cfg.starBrtMin + Math.pow(rand(), cfg.starBrtPow) * (1 - cfg.starBrtMin);
        const temp = rand() * cfg.starWarmth;
        const sr = Math.round((1.0 - temp) * brt * 255);
        const sg = Math.round((0.9 - temp * 0.33) * brt * 255);
        const sb = Math.round((0.7 + temp) * brt * 255);
        const size = cfg.starSizeMin + brt * sizeRange;

        if (size < 1.2) {
          smCtx.fillStyle = `rgba(${sr},${sg},${sb},${brt})`;
          smCtx.fillRect(Math.round(px) - 0.5, Math.round(py) - 0.5, 1.5, 1.5);
        } else {
          paintGlow(px, py, size, sr, sg, sb, brt);
        }
      }

      // ── Bright prominent stars ──
      for (let i = 0; i < cfg.brightCount; i++) {
        const theta = rand() * Math.PI * 2;
        const phi = Math.acos(0.1 + rand() * 0.9);
        const [px, py] = skyToPixel(theta, phi);

        const spectral = rand();
        let cr, cg, cb;
        if (spectral < 0.2) { cr = 180; cg = 205; cb = 255; }
        else if (spectral < 0.4) { cr = 255; cg = 242; cb = 204; }
        else if (spectral < 0.55) { cr = 255; cg = 191; cb = 128; }
        else if (spectral < 0.65) { cr = 255; cg = 140; cb = 102; }
        else { cr = 242; cg = 242; cb = 255; }

        const bSize = cfg.brightSize * (0.75 + rand() * 0.5);
        paintGlow(px, py, bSize, cr, cg, cb, cfg.brightAlpha);
        smCtx.fillStyle = `rgba(${cr},${cg},${cb},1.0)`;
        smCtx.beginPath();
        smCtx.arc(px, py, 0.8, 0, Math.PI * 2);
        smCtx.fill();
      }

      // ── Milky Way band ──
      if (cfg.mwCount > 0) {
        const tiltRad = cfg.mwTilt * Math.PI / 180;
        const azRad = cfg.mwAzimuth * Math.PI / 180;
        const ct = Math.cos(tiltRad), st = Math.sin(tiltRad);
        const ca = Math.cos(azRad), sa = Math.sin(azRad);

        for (let i = 0; i < cfg.mwCount; i++) {
          const mwAngle = rand() * Math.PI * 2;
          const mwSpread = (rand() + rand() + rand() - 1.5) * cfg.mwWidth;
          let mx = Math.cos(mwAngle), my = mwSpread, mz = Math.sin(mwAngle);

          // Tilt around X
          const rmy = my * ct - mz * st, rmz = my * st + mz * ct;
          my = rmy; mz = rmz;
          // Rotate around Y
          const rmx = mx * ca + mz * sa;
          mz = -mx * sa + mz * ca; mx = rmx;

          const len = Math.sqrt(mx * mx + my * my + mz * mz);
          mx /= len; my /= len; mz /= len;

          const mwPhi = Math.acos(my);
          const mwTheta = Math.atan2(mz, mx);
          const mwThetaPos = mwTheta < 0 ? mwTheta + Math.PI * 2 : mwTheta;
          const [mwPx, mwPy] = skyToPixel(mwThetaPos, mwPhi);

          const distFromCenter = Math.min(1, Math.abs(mwSpread) / Math.max(0.01, cfg.mwWidth));
          const densityNoise = Math.sin(mwAngle * 3 + 1.5) * 0.3 + Math.cos(mwAngle * 7) * 0.15 + 0.55;
          const mwB = (cfg.mwBrt * 0.33 + rand() * cfg.mwBrt) * (1 - distFromCenter * 0.5) * densityNoise;

          const mr = Math.round(mwB * 0.9 * 255);
          const mg = Math.round(mwB * 0.92 * 255);
          const mb = Math.round(mwB * 255);
          smCtx.fillStyle = `rgba(${mr},${mg},${mb},${mwB})`;
          smCtx.fillRect(Math.round(mwPx), Math.round(mwPy), 1.5, 1.5);
        }
      }

    }

    // Initial paint
    paintStarDome(starCfg);

    const starMapTexture = new THREE.CanvasTexture(starMapCanvas);
    starMapTexture.magFilter = THREE.LinearFilter;
    starMapTexture.minFilter = THREE.LinearMipmapLinearFilter;

    const starDomeMat = new THREE.MeshBasicMaterial({
      map: starMapTexture,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      opacity: 0,
    });
    // Radius 1180 (just inside the sky at 1190) so the opaque ocean, which
    // extends to ~1400, always sits in front and occludes it — no star bleed.
    const starDomeGeom = new THREE.SphereGeometry(1180, 48, 24);
    const starDome = new THREE.Mesh(starDomeGeom, starDomeMat);
    starDome.renderOrder = 1;
    starDome.frustumCulled = false;
    group.add(starDome);

    // Repaint debounce for tuner interaction
    let starRepaintTimer = 0;
    function scheduleStarRepaint() {
      clearTimeout(starRepaintTimer);
      starRepaintTimer = setTimeout(() => {
        paintStarDome(starCfg);
        starMapTexture.needsUpdate = true;
      }, 80);
    }

    // ── Moon sprite — separate from dome so it can track opposite the sun ──
    function paintMoonCanvas(cfg) {
      const mCanvas = document.createElement('canvas');
      mCanvas.width = 128; mCanvas.height = 128;
      const mc = mCanvas.getContext('2d');
      const cx = 64, cy = 64, r = 22;

      // Atmospheric glow
      const glowR = r * cfg.moonGlow;
      const glow = mc.createRadialGradient(cx, cy, r * 0.5, cx, cy, glowR);
      glow.addColorStop(0, `rgba(200, 210, 240, ${0.3 * cfg.moonBrt})`);
      glow.addColorStop(0.4, `rgba(180, 195, 230, ${0.12 * cfg.moonBrt})`);
      glow.addColorStop(0.7, `rgba(140, 160, 210, ${0.03 * cfg.moonBrt})`);
      glow.addColorStop(1, 'rgba(100, 130, 190, 0)');
      mc.fillStyle = glow;
      mc.fillRect(0, 0, 128, 128);

      // Moon disc
      const disc = mc.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, r);
      disc.addColorStop(0, `rgba(235, 235, 245, ${0.95 * cfg.moonBrt})`);
      disc.addColorStop(0.7, `rgba(215, 215, 230, ${0.9 * cfg.moonBrt})`);
      disc.addColorStop(1, `rgba(180, 185, 200, ${0.75 * cfg.moonBrt})`);
      mc.beginPath(); mc.arc(cx, cy, r, 0, Math.PI * 2);
      mc.fillStyle = disc; mc.fill();

      // Mare features (relative to disc radius)
      const mare = [
        { dx: -0.22, dy: -0.17, r: 0.33, a: 0.18 },
        { dx: 0.22,  dy: -0.28, r: 0.22, a: 0.15 },
        { dx: -0.06, dy: 0.22,  r: 0.39, a: 0.12 },
        { dx: 0.33,  dy: 0.11,  r: 0.17, a: 0.14 },
        { dx: -0.33, dy: 0.17,  r: 0.17, a: 0.11 },
      ];
      for (const m of mare) {
        const mx2 = cx + m.dx * r, my2 = cy + m.dy * r, mr2 = m.r * r;
        const mg = mc.createRadialGradient(mx2, my2, 0, mx2, my2, mr2);
        mg.addColorStop(0, `rgba(90, 95, 115, ${m.a * cfg.moonBrt})`);
        mg.addColorStop(0.7, `rgba(90, 95, 115, ${m.a * 0.4 * cfg.moonBrt})`);
        mg.addColorStop(1, 'rgba(90, 95, 115, 0)');
        mc.fillStyle = mg;
        mc.fillRect(mx2 - mr2, my2 - mr2, mr2 * 2, mr2 * 2);
      }
      return mCanvas;
    }

    let moonTexture = new THREE.CanvasTexture(paintMoonCanvas(starCfg));
    const moonMat = new THREE.SpriteMaterial({
      map: moonTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const moon = new THREE.Sprite(moonMat);
    moon.renderOrder = 1;
    moon.visible = false;
    group.add(moon);

    // Pre-allocated vector for moon positioning
    const _moonPos = new THREE.Vector3();

    function updateMoonSprite() {
      const scale = starCfg.moonSize * 3;
      moon.scale.set(scale, scale, 1);
    }
    updateMoonSprite();

    function repaintMoon() {
      moonTexture.dispose();
      moonTexture = new THREE.CanvasTexture(paintMoonCanvas(starCfg));
      moonMat.map = moonTexture;
      moonMat.needsUpdate = true;
      updateMoonSprite();
    }

    console.log('[Flight] Star dome texture (%dx%d) + moon sprite ready', STAR_MAP_W, STAR_MAP_H);

    // ═══════════════════════════════════════════════════════════════════════
    // VOLUMETRIC CLOUDS — raymarched slab on an upper sky shell.
    // Density from three's MaterialX fractal noise (mx_fractal_noise_float),
    // 8 march steps unrolled at graph-build time, lit from above with a
    // forward-scattering silver lining toward the sun. Tinting follows the
    // day cycle (warm dark at dawn → white at noon). Built defensively:
    // any failure leaves the scene cloudless but intact.
    // ═══════════════════════════════════════════════════════════════════════
    let cloudMesh = null;
    let cloudUniforms = null;
    try {
      const mxFractal = TSL.mx_fractal_noise_float;
      if (typeof mxFractal !== 'function') throw new Error('mx noise unavailable');

      cloudUniforms = {
        time: uniform(0),
        coverage: uniform(activeTheme.cloudCoverage ?? 0.42),
        lightCol: uniform(new THREE.Color(1, 1, 1)),
        ambientCol: uniform(new THREE.Color(0.25, 0.28, 0.34)),
      };

      const CLOUD_BASE = 150, CLOUD_TOP = 240, CLOUD_STEPS = 8;
      const cloudColorNode = Fn(() => {
        const dir = tslNormalize(positionWorld.sub(tslCameraPosition));
        const dy = tslMax(dir.y, float(0.02));
        const t0 = float(CLOUD_BASE).sub(tslCameraPosition.y).div(dy);
        const t1 = float(CLOUD_TOP).sub(tslCameraPosition.y).div(dy);
        const stepT = t1.sub(t0).div(CLOUD_STEPS);

        const trans = float(1).toVar();
        const lightAcc = float(0).toVar();
        for (let s = 0; s < CLOUD_STEPS; s++) {
          const tt = t0.add(stepT.mul(s + 0.5));
          const p = tslCameraPosition.add(dir.mul(tt));
          // Puffy height profile: zero at slab edges, full in the middle
          const hf = tslClamp(p.y.sub(CLOUD_BASE).div(CLOUD_TOP - CLOUD_BASE), 0, 1);
          const hProfile = smoothstep(float(0), float(0.25), hf)
            .mul(float(1).sub(smoothstep(float(0.65), float(1), hf)));
          const np = vec3(
            p.x.mul(0.0032).add(cloudUniforms.time.mul(0.006)),
            p.y.mul(0.0085),
            p.z.mul(0.0032),
          );
          const nn = mxFractal(np, 3, 2.0, 0.55, 1.0).mul(0.32).add(0.5);
          const edge0 = float(1).sub(cloudUniforms.coverage);
          const dens = smoothstep(edge0, edge0.add(0.22), nn).mul(hProfile);
          const a = dens.mul(0.42);
          // Lit from above — tops bright, undersides shaded
          const lit = float(0.35).add(hf.mul(0.65));
          lightAcc.addAssign(trans.mul(a).mul(lit));
          trans.mulAssign(float(1).sub(a));
        }

        const horizonFade = smoothstep(float(0.015), float(0.12), dir.y);
        const alpha = float(1).sub(trans).mul(horizonFade);
        // Forward scattering: silver lining when looking toward the sun
        const sunDirN = tslNormalize(skyUniforms.sunPosition);
        const cosSun = tslClamp(tslDot(dir, sunDirN), 0, 1);
        const silver = tslPow(cosSun, float(8)).mul(0.55).add(1);
        const cloudCol = mix(cloudUniforms.ambientCol, cloudUniforms.lightCol,
          tslClamp(lightAcc, 0, 1)).mul(silver);
        return vec4(cloudCol, alpha);
      })();

      const cloudMat = new TSL.MeshBasicNodeMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        colorNode: cloudColorNode,
      });
      // Upper shell only (clouds never render below the horizon band)
      const cloudGeom = new THREE.SphereGeometry(478, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.62);
      cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
      cloudMesh.renderOrder = 3; // over star dome + moon so clouds occlude them
      cloudMesh.frustumCulled = false;
      group.add(cloudMesh);
      console.log('[Flight] Volumetric cloud layer ready');
    } catch (err) {
      console.warn('[Flight] Volumetric clouds unavailable:', err);
      cloudMesh = null;
      cloudUniforms = null;
    }

    // ── Cloud shadows: dappled moving shade on the ground, driven by the same
    // fractal noise + wind drift as the clouds overhead. Routed through the
    // terrain material's aoNode (additive — darkens patches but preserves the
    // vertex-color terrain and its lighting), so a shader failure degrades to
    // a shadowless-but-intact world rather than a black one. ──
    function applyCloudShadow(mat) {
      if (!mat || !cloudUniforms || !TSL) return;
      try {
        const mxFractal = TSL.mx_fractal_noise_float;
        if (typeof mxFractal !== 'function') return;
        mat.aoNode = Fn(() => {
          const p = positionWorld;
          const sd = tslNormalize(skyUniforms.sunPosition);
          // Offset the ground sample toward the sun so shade falls where the
          // cloud actually blocks the light, not straight below it
          const dy = tslMax(sd.y, float(0.3));
          const offX = sd.x.div(dy).mul(60);
          const offZ = sd.z.div(dy).mul(60);
          const np = vec3(
            p.x.add(offX).mul(0.0034).add(cloudUniforms.time.mul(0.006)),
            float(0),
            p.z.add(offZ).mul(0.0034),
          );
          const n = mxFractal(np, 3, 2.0, 0.55, 1.0).mul(0.32).add(0.5);
          const edge0 = float(1).sub(cloudUniforms.coverage);
          const shadow = smoothstep(edge0, edge0.add(0.18), n);
          // 1.0 = full sun, 0.45 = deep under-cloud shade
          return float(1).sub(shadow.mul(0.55));
        })();
      } catch (e) {
        console.warn('[Flight] Cloud shadow node failed:', e);
      }
    }


    // ═══════════════════════════════════════════════════════════════════════
    // SHOOTING STARS — audio-reactive, triggered by drum hits
    // ═══════════════════════════════════════════════════════════════════════
    const SHOOTING_POOL = 6;  // sized for crash-cymbal volleys (3 at once) + ambient strays
    const SHOOTING_TRAIL = 10;
    const shootingStars = [];

    for (let si = 0; si < SHOOTING_POOL; si++) {
      const positions = new Float32Array(SHOOTING_TRAIL * 3);
      const colors = new Float32Array(SHOOTING_TRAIL * 3);
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });

      const line = new THREE.Line(geom, mat);
      line.visible = false;
      line.frustumCulled = false;
      line.renderOrder = 2;
      group.add(line);

      shootingStars.push({
        active: false, progress: 0,
        startPos: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        speed: 0,
        line, geom, mat,
      });
    }

    function launchShootingStar() {
      const star = shootingStars.find(s => !s.active);
      if (!star) return;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.35; // upper sky
      const r = 480;

      star.startPos.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );

      // Direction tangent to sphere with slight downward drift
      const radial = star.startPos.clone().normalize();
      const arbitrary = Math.abs(radial.y) < 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);
      const tangent = new THREE.Vector3().crossVectors(radial, arbitrary).normalize();
      tangent.y -= 0.3;
      tangent.normalize();

      star.direction.copy(tangent);
      star.speed = 180 + Math.random() * 120;
      star.progress = 0;
      star.active = true;
      star.line.visible = true;
    }

    let lastStarTime = 0;

    // Sun position (base values from theme - tuner can override)
    let baseSunElevation = activeTheme.baseSunElevation;
    let sunAzimuth = activeTheme.sunAzimuth;
    let baseTurbidity = activeTheme.baseTurbidity;
    let baseRayleigh = activeTheme.baseRayleigh;
    let baseMieCoefficient = activeTheme.baseMieCoefficient;
    let baseMieDirectionalG = activeTheme.baseMieDirectionalG;
    let baseExposure = activeTheme.baseExposure;
    let sunElevationRange = activeTheme.sunElevationRange || 10;
    let baseSunIntensity = activeTheme.baseSunIntensity || 0.1;
    let sunIntensityRange = activeTheme.sunIntensityRange || 1.6;
    let baseHemiIntensity = activeTheme.baseHemiIntensity || 0.04;
    let hemiIntensityRange = activeTheme.hemiIntensityRange || 0.46;
    let fogDensityDay = activeTheme.fogDensityDay ?? 0.0002;
    let fogColorLight = activeTheme.fogColorLight || 0x8c7a5e;

    const sunPos = new THREE.Vector3();
    const phi = (90 - baseSunElevation) * Math.PI / 180;
    sunPos.setFromSphericalCoords(1, phi, sunAzimuth * Math.PI / 180);
    skyUniforms.sunPosition.value.copy(sunPos);

    // ═══════════════════════════════════════════════════════════════════════
    // LIGHTING - match Preetham sun
    // ═══════════════════════════════════════════════════════════════════════
    const sunLight = new THREE.DirectionalLight(0xff8844, 0.1);  // Starts dim (sun below horizon)
    sunLight.position.copy(sunPos).multiplyScalar(100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 320;
    // Tighter frustum than the visible terrain — concentrates shadow texels
    // where the bird actually is, for crisp contact shadows near the camera
    sunLight.shadow.camera.left = -70;
    sunLight.shadow.camera.right = 70;
    sunLight.shadow.camera.top = 70;
    sunLight.shadow.camera.bottom = -70;
    // normalBias offsets samples along the surface normal — the single most
    // effective cure for shadow acne on sloped procedural terrain. bias trims
    // the rest. Tuned conservative to avoid peter-panning.
    sunLight.shadow.normalBias = 0.8;
    sunLight.shadow.bias = -0.0002;
    scene.add(sunLight);

    // Shadows were configured on every mesh but never switched on at the
    // renderer — enable soft shadow mapping now (biggest single realism win).
    try {
      const envRenderer = window.EnvironmentMode?.instance?.renderer;
      if (envRenderer && envRenderer.shadowMap) {
        envRenderer.shadowMap.enabled = true;
        envRenderer.shadowMap.type = THREE.PCFSoftShadowMap ?? envRenderer.shadowMap.type;
      }
    } catch (e) { console.warn('[Flight] Shadow enable failed:', e); }
    const hemiLight = new THREE.HemisphereLight(0xffccaa, 0x553311, 0.04);  // Starts dim
    scene.add(hemiLight);

    // Moonlight — a cool, dim directional fill that rises as the sun sets, so
    // night reads as moonlit (deep blue, soft shadows) instead of black. It
    // also gives the reflective water something to glint off of after dark.
    const moonLight = new THREE.DirectionalLight(0x9fb6e8, 0);
    scene.add(moonLight);
    scene.add(moonLight.target);
    const _moonDir = new THREE.Vector3();
    const _nightWater = new THREE.Color(0x0e1d33); // deep moonlit blue (never black)

    // No fog — it hid the scenery. Depth comes from the sky gradient and
    // distance LOD instead. (Per-frame code guards on scene.fog === null.)
    scene.fog = null;

    // ═══════════════════════════════════════════════════════════════════════
    // WORLD SEED — changes every 30 minutes for terrain variety
    // ═══════════════════════════════════════════════════════════════════════
    const halfHour = Math.floor(Date.now() / (30 * 60 * 1000));
    const seedA = ((halfHour * 374761393) ^ (halfHour >>> 3)) & 0x7fffffff;
    const seedB = ((halfHour * 668265263) ^ (halfHour >>> 5)) & 0x7fffffff;
    const worldSeedX = (seedA % 10000) - 5000;
    const worldSeedZ = (seedB % 10000) - 5000;
    console.log('[Flight] World seed offset:', worldSeedX, worldSeedZ, '(changes every 30 min)');

    // ═══════════════════════════════════════════════════════════════════════
    // NOISE — hash-based 2D value noise + fBm
    // ═══════════════════════════════════════════════════════════════════════
    function _hash(ix, iy) {
      let h = ix * 374761393 + iy * 668265263;
      h = ((h ^ (h >>> 13)) * 1274126177) | 0;
      return ((h ^ (h >>> 16)) & 0x7fffffff) / 0x7fffffff;
    }
    function noise2D(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const n00 = _hash(ix, iy), n10 = _hash(ix + 1, iy);
      const n01 = _hash(ix, iy + 1), n11 = _hash(ix + 1, iy + 1);
      return (n00 + (n10 - n00) * sx) + ((n01 + (n11 - n01) * sx) - (n00 + (n10 - n00) * sx)) * sy;
    }
    function fbm(x, y, octaves) {
      let val = 0, amp = 1, freq = 1, maxAmp = 0;
      for (let i = 0; i < octaves; i++) {
        val += noise2D(x * freq, y * freq) * amp;
        maxAmp += amp;
        amp *= 0.5;
        freq *= 2;
      }
      return val / maxAmp; // 0–1
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TERRAIN — noise-based mountains, valleys & water
    // ═══════════════════════════════════════════════════════════════════════
    // Chunk constants come from activeTheme (updated by setTheme)
    // CHUNK_SIZE, CHUNK_SEGS, CHUNK_RANGE declared at top of function
    const terrainChunks = new Map();  // "cx,cz" → { mesh }
    const waterChunks = new Map();
    const sceneryChunks = new Map();

    function terrainHeight(x, z) {
      return activeTheme.terrainHeight(x + worldSeedX, z + worldSeedZ, noise2D, fbm, currentTime);
    }

    let terrainMat = null;
    if (!activeTheme.useWaterMesh) {
      terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: activeTheme.terrainMatProps.flatShading,
        roughness: activeTheme.terrainMatProps.roughness,
        metalness: activeTheme.terrainMatProps.metalness,
        emissiveIntensity: activeTheme.terrainMatProps.emissiveIntensity,
        emissive: new THREE.Color(0xffffff),
      });
      applyCloudShadow(terrainMat);
    }

    let waterMat = new THREE.MeshStandardMaterial({
      color: activeTheme.waterColor,
      transparent: true,
      opacity: activeTheme.waterOpacity,
      roughness: activeTheme.waterRoughness,
      metalness: activeTheme.waterMetalness,
      side: THREE.DoubleSide,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // WaterMesh — Three.js TSL/WebGPU reflective ocean (used by Data Tide)
    // Lazy-loaded: only imported when a useWaterMesh theme is active
    // ═══════════════════════════════════════════════════════════════════════
    let waterMeshObj = null;      // WaterMesh instance (or null if not active)
    let waterMeshReady = false;   // true once async import + creation completes
    let waterMeshPending = false; // creation in flight — chunk water stands down
    let waterDistortBase = 3.7;   // resting distortion — music swells around this

    // ═══════════════════════════════════════════════════════════════════════
    // GERSTNER OCEAN — real geometric waves + crest foam (open-ocean themes).
    // A tessellated plane displaced in a TSL positionNode by a sum of Gerstner
    // waves (world-anchored so swells roll past as you fly), shaded with
    // fresnel sky reflection + sun/moon specular, with white foam on the
    // steep crests. Built guarded: if the shader can't be constructed we fall
    // back to the flat reflective WaterMesh.
    // ═══════════════════════════════════════════════════════════════════════
    let oceanMesh = null, oceanUniforms = null;
    // Live-tunable ocean look (Scene Tuner → 'ocean' section). The per-frame
    // loop pushes these into the shader uniforms; amp also gets a bass lift.
    const oceanCfg = {
      ampBase: 1.1, choppy: 1.0, waveScale: 0.95,
      foamLo: 0.35, foamHi: 1.05, foamAmt: 0.0, // foam off (tuned)
      glint: 1.0, specPow: 128,
      detail: 2.15, detailScale: 0.05,
    };

    function createGerstnerOcean(planeSize) {
      if (!TSL || typeof TSL.MeshBasicNodeMaterial !== 'function') return false;
      try {
        const T = TSL;
        const mxFractal = T.mx_fractal_noise_float;
        const hasNoise = typeof mxFractal === 'function';
        oceanUniforms = {
          time: T.uniform(0),
          amp: T.uniform(1.2),       // wave height (live)
          choppy: T.uniform(1.0),    // horizontal pinch (live)
          waveScale: T.uniform(1.0), // wavelength multiplier (live)
          foamLo: T.uniform(1.6),
          foamHi: T.uniform(2.6),
          foamAmt: T.uniform(0.8),
          glint: T.uniform(1.0),
          specPow: T.uniform(90),
          detail: T.uniform(0.7),    // fractal-noise height (breaks tiling)
          detailScale: T.uniform(0.035),
          sunDir: T.uniform(new THREE.Vector3(0, 1, 0)),
          sunCol: T.uniform(new THREE.Color(1.4, 1.3, 1.1)),
          deepCol: T.uniform(new THREE.Color(0x0a2a3a)),
          skyCol: T.uniform(new THREE.Color(0x9fc2e0)),
          foamCol: T.uniform(new THREE.Color(0xeaf4fb)),
          originX: T.uniform(0),
          originZ: T.uniform(0),
        };

        // A few long swells for the rolling motion; the pseudo-random surface
        // detail comes from fractal noise (a handful of sines always tiles).
        const defs = [
          { dir: [1.0, 0.18], len: 127, amp: 1.4, steep: 0.3 },
          { dir: [0.6, 0.8],  len: 71,  amp: 0.9, steep: 0.3 },
          { dir: [-0.4, 1.0], len: 41,  amp: 0.5, steep: 0.28 },
        ];
        const N = defs.length;
        const waves = defs.map(w => {
          const L = Math.hypot(w.dir[0], w.dir[1]);
          const ndx = w.dir[0] / L, ndz = w.dir[1] / L;
          const k = (2 * Math.PI) / w.len;
          return { ndx, ndz, k, omega: Math.sqrt(9.8 * k), amp: w.amp, Q: w.steep / (k * w.amp * N) };
        });

        // Gerstner swell (analytic gradient). waveScale divides spatial freq.
        const fields = (wx, wz) => {
          const sx = wx.div(oceanUniforms.waveScale);
          const sz = wz.div(oceanUniforms.waveScale);
          let dx = T.float(0), dy = T.float(0), dz = T.float(0), gx = T.float(0), gz = T.float(0);
          for (const w of waves) {
            const phase = sx.mul(w.k * w.ndx).add(sz.mul(w.k * w.ndz)).sub(oceanUniforms.time.mul(w.omega));
            const c = T.cos(phase), s = T.sin(phase);
            dx = dx.add(c.mul(w.Q * w.amp * w.ndx));
            dz = dz.add(c.mul(w.Q * w.amp * w.ndz));
            dy = dy.add(s.mul(w.amp));
            gx = gx.add(c.mul(w.amp * w.k * w.ndx).div(oceanUniforms.waveScale));
            gz = gz.add(c.mul(w.amp * w.k * w.ndz).div(oceanUniforms.waveScale));
          }
          return { dx, dy, dz, gx, gz };
        };

        // Fractal-noise surface detail at world (wx,wz), evolving with time.
        // This is what makes the sea look pseudo-random instead of tiled.
        const noiseAt = (wx, wz) => {
          if (!hasNoise) return T.float(0);
          const p = T.vec3(
            wx.mul(oceanUniforms.detailScale),
            oceanUniforms.time.mul(0.12),
            wz.mul(oceanUniforms.detailScale),
          );
          return mxFractal(p, 4, 2.0, 0.5, 1.0);
        };

        const mat = new T.MeshBasicNodeMaterial({ transparent: false, side: THREE.DoubleSide });

        // Flat surface — wave motion comes from the colorNode normals, not
        // geometric displacement (which discarded triangles at grazing angles,
        // showing the sky-dome through the sea). Same approach as WaterMesh.
        mat.positionNode = T.Fn(() => {
          return T.positionLocal;
        })();

        mat.colorNode = T.Fn(() => {
          const wx = T.positionWorld.x, wz = T.positionWorld.z;
          const f = fields(wx, wz);
          const a = oceanUniforms.amp;
          const d = oceanUniforms.detail;
          // Total height + finite-difference normal over (swell + noise) so the
          // pseudo-random detail actually catches light and foam.
          const e = T.float(2.0);
          const nh0 = noiseAt(wx, wz);
          const nhx = noiseAt(wx.add(e), wz);
          const nhz = noiseAt(wx, wz.add(e));
          const h0 = f.dy.mul(a).add(nh0.mul(d));
          const gradX = f.gx.mul(a).add(nhx.sub(nh0).div(e).mul(d));
          const gradZ = f.gz.mul(a).add(nhz.sub(nh0).div(e).mul(d));
          const n = T.normalize(T.vec3(gradX.mul(-1), T.float(1), gradZ.mul(-1)));
          const viewDir = T.normalize(T.cameraPosition.sub(T.positionWorld));
          const sunDir = T.normalize(oceanUniforms.sunDir);
          const fres = T.clamp(T.pow(T.float(1).sub(T.max(T.dot(n, viewDir), T.float(0))), T.float(5)), T.float(0), T.float(1));
          const body = T.mix(oceanUniforms.deepCol, oceanUniforms.skyCol, fres.mul(0.85).add(0.15));
          const half = T.normalize(viewDir.add(sunDir));
          const spec = T.pow(T.max(T.dot(n, half), T.float(0)), oceanUniforms.specPow).mul(oceanUniforms.sunCol).mul(oceanUniforms.glint);
          const foam = T.smoothstep(oceanUniforms.foamLo, oceanUniforms.foamHi, h0).mul(oceanUniforms.foamAmt);
          const col = T.mix(body, oceanUniforms.foamCol, foam).add(spec).add(T.vec3(0.025, 0.06, 0.1));
          return T.vec4(col, T.float(1));
        })();

        const geo = new THREE.PlaneGeometry(planeSize, planeSize, 300, 300);
        geo.rotateX(-Math.PI / 2);
        oceanMesh = new THREE.Mesh(geo, mat);
        oceanMesh.frustumCulled = false;
        oceanMesh.receiveShadow = false;
        scene.add(oceanMesh);
        console.log('[Flight] Gerstner ocean created');
        return true;
      } catch (e) {
        console.warn('[Flight] Gerstner ocean failed — falling back to WaterMesh:', e);
        if (oceanMesh) { scene.remove(oceanMesh); }
        oceanMesh = null; oceanUniforms = null;
        return false;
      }
    }

    function disposeGerstnerOcean() {
      if (oceanMesh) {
        scene.remove(oceanMesh);
        oceanMesh.geometry.dispose();
        oceanMesh.material.dispose();
      }
      oceanMesh = null; oceanUniforms = null;
    }

    // Any theme with water gets the real reflective ocean. The old flat
    // MeshStandardMaterial chunk planes had nothing to reflect and rendered
    // black at low sun; they remain only as a fallback if the import fails.
    function themeWantsWater(theme) {
      return !!theme.useWaterMesh || (typeof theme.waterY === 'number' && theme.waterY > -500);
    }

    async function createWaterMeshForTheme(theme) {
      if (!themeWantsWater(theme)) return;
      waterMeshPending = true;
      // Open-ocean themes (Data Tide): geometric Gerstner ocean, live-tunable
      // via the Scene Tuner 'ocean' section (press T). Falls back to WaterMesh.
      if (theme.useWaterMesh) {
        const size = (theme.waterMeshConfig && theme.waterMeshConfig.size) || 2800;
        if (createGerstnerOcean(size)) {
          oceanMesh.position.y = -2;
          waterMeshReady = true;
          waterMeshPending = false;
          return;
        }
      }
      try {
        const { WaterMesh } = await import('three/addons/objects/WaterMesh.js');
        const cfg = theme.waterMeshConfig || {};
        const loader = new THREE.TextureLoader();
        const waterNormals = await loader.loadAsync('textures/waternormals.jpg');
        waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

        // Sized to the camera's draw distance (far=1200), not 10000 — huge
        // coordinates + two giant triangles starved the depth buffer and
        // made shorelines z-fight. Tessellation keeps depth interpolation
        // local so the terrain intersection stays stable.
        const planeSize = cfg.size || 2800;
        const geom = new THREE.PlaneGeometry(planeSize, planeSize, 32, 32);
        geom.rotateX(-Math.PI / 2);

        waterDistortBase = cfg.distortionScale ?? 3.7;
        waterMeshObj = new WaterMesh(geom, {
          waterNormals,
          sunDirection: new THREE.Vector3(sunPos.x, sunPos.y, sunPos.z),
          sunColor: cfg.sunColor ?? 0xffffff,
          waterColor: cfg.waterColor ?? theme.waterColor ?? 0x001e0f,
          distortionScale: waterDistortBase,
          size: cfg.textureSize ?? 1.0,
          alpha: cfg.alpha ?? 0.96,
        });
        // useWaterMesh themes are pure ocean at base level; terrain themes
        // flood their valleys at the theme's water line
        waterMeshObj.position.y = theme.useWaterMesh ? -2 : theme.waterY;
        // Remember the daylight base color so the night-water lerp has an anchor
        if (waterMeshObj.waterColor && waterMeshObj.waterColor.value) {
          waterMeshObj._baseWaterColor = waterMeshObj.waterColor.value.clone();
        }
        scene.add(waterMeshObj);
        waterMeshReady = true;
        console.log('[Flight] WaterMesh created for', theme.name || 'theme');
      } catch (err) {
        console.error('[Flight] Failed to create WaterMesh:', err);
        waterMeshObj = null;
        waterMeshReady = false;
        waterMeshPending = false; // chunk-plane fallback may take over
      }
    }

    function disposeWaterMesh() {
      if (waterMeshObj) {
        scene.remove(waterMeshObj);
        waterMeshObj.geometry.dispose();
        waterMeshObj.material.dispose();
        waterMeshObj = null;
      }
      disposeGerstnerOcean();
      waterMeshReady = false;
      waterMeshPending = false;
    }

    // Kick off WaterMesh creation for any theme with water
    createWaterMeshForTheme(activeTheme);

    const FAR_SEGS = 6;  // reduced segments for distant LOD chunks

    function spawnTerrainChunk(cx, cz, far) {
      const segs = far ? FAR_SEGS : CHUNK_SEGS;
      const geom = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segs, segs);
      geom.rotateX(-Math.PI / 2);
      const pos = geom.attributes.position;
      const colors = new Float32Array(pos.count * 3);

      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i), lz = pos.getZ(i);
        const wx = lx + cx * CHUNK_SIZE, wz = lz + cz * CHUNK_SIZE;
        let h = terrainHeight(wx, wz);
        pos.setY(i, h);

        // Approximate slope from neighbours
        const hx = terrainHeight(wx + 1, wz);
        const hz = terrainHeight(wx, wz + 1);
        const slope = Math.sqrt((hx - h) * (hx - h) + (hz - h) * (hz - h));

        // Two noise frequencies — coarse patches + fine grain (seeded)
        const sx = wx + worldSeedX, sz = wz + worldSeedZ;
        const n1 = fbm(sx * 0.02 + 200, sz * 0.02 + 200, 2);
        const n2 = fbm(sx * 0.1 + 500, sz * 0.1 + 500, 2);
        const nPatch = (n1 - 0.5) * 2;
        const nGrain = (n2 - 0.5) * 2;

        const c = activeTheme.colorVertex(h, slope, nPatch, nGrain, activeTheme.waterY);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }

      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geom.computeVertexNormals();
      const mesh = new THREE.Mesh(geom, terrainMat);
      mesh.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
      mesh.receiveShadow = true;
      mesh.castShadow = !far;  // skip shadow casting for distant chunks
      scene.add(mesh);
      terrainChunks.set(`${cx},${cz}`, { mesh, far: !!far });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WATER — flat plane at WATER_Y, fills valleys naturally
    // ═══════════════════════════════════════════════════════════════════════
    function spawnWaterChunk(cx, cz) {
      if (activeTheme.waterY <= -500) return;  // water disabled for this theme
      if (waterMeshPending || waterMeshReady) return;  // real ocean handles it
      const geom = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 1, 1);
      geom.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geom, waterMat);
      mesh.position.set(cx * CHUNK_SIZE, activeTheme.waterY, cz * CHUNK_SIZE);
      mesh.receiveShadow = true;
      scene.add(mesh);
      waterChunks.set(`${cx},${cz}`, { mesh });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCENERY — theme-driven materials, geometries, spawning
    // ═══════════════════════════════════════════════════════════════════════
    let sceneryMats = activeTheme.sceneryMaterials ? activeTheme.sceneryMaterials(THREE) : {};
    let sceneryGeoms = activeTheme.sceneryGeometries ? activeTheme.sceneryGeometries(THREE) : {};

    function spawnSceneryChunk(cx, cz) {
      const objects = [];
      const seed = Math.abs((cx + worldSeedX) * 374761 + (cz + worldSeedZ) * 668265) % 100000;
      const density = activeTheme.sceneryDensity != null ? activeTheme.sceneryDensity : 8;

      for (let i = 0; i < density; i++) {
        const s = _hash(seed + i * 3, seed + i * 7 + 1000);
        const s2 = _hash(seed + i * 5 + 500, seed + i * 11 + 2000);
        const s3 = _hash(seed + i * 13 + 800, seed + i * 17 + 3000);

        const x = (s - 0.5) * CHUNK_SIZE * 0.9 + cx * CHUNK_SIZE;
        const z = (s2 - 0.5) * CHUNK_SIZE * 0.9 + cz * CHUNK_SIZE;
        const h = terrainHeight(x, z);

        if (!activeTheme.spawnSceneryObject) continue;
        const obj = activeTheme.spawnSceneryObject(x, z, h, activeTheme.waterY, s, s3, THREE, sceneryMats, sceneryGeoms);
        if (!obj) continue;

        // Themes already flag castShadow; also receive so objects ground each
        // other (a tree's shadow falls across the rock beside it)
        obj.traverse(c => { if (c.isMesh) c.receiveShadow = true; });

        scene.add(obj);
        objects.push(obj);
      }

      sceneryChunks.set(`${cx},${cz}`, { objects });
    }

    const CHUNK_AHEAD = 16;  // extra chunks forward (LOD) for deep horizon
    let chunkDirX = 0, chunkDirZ = 1;  // forward direction in world (updated per frame)

    function updateChunks2D(posX, posZ) {
      const pcx = Math.round(posX / CHUNK_SIZE);
      const pcz = Math.round(posZ / CHUNK_SIZE);
      const needed = new Set();
      const baseR2 = (CHUNK_RANGE + 0.5) * (CHUNK_RANGE + 0.5);
      const totalR = CHUNK_RANGE + CHUNK_AHEAD;
      const totalR2 = (totalR + 0.5) * (totalR + 0.5);

      for (let dx = -totalR; dx <= totalR; dx++) {
        for (let dz = -totalR; dz <= totalR; dz++) {
          const dist2 = dx * dx + dz * dz;
          if (dist2 > totalR2) continue;
          const isFar = dist2 > baseR2;
          // Beyond base radius — only include if in forward cone
          if (isFar) {
            const dot = dx * chunkDirX + dz * chunkDirZ;
            if (dot <= 0) continue;
          }
          const cx = pcx + dx, cz = pcz + dz;
          const key = `${cx},${cz}`;
          needed.add(key);

          const existing = terrainChunks.get(key);
          if (!existing) {
            // New chunk — spawn at appropriate LOD
            spawnTerrainChunk(cx, cz, isFar);
            spawnWaterChunk(cx, cz);
            if (!isFar) spawnSceneryChunk(cx, cz);  // skip scenery for far chunks
          } else if (existing.far && !isFar) {
            // Was far LOD, now inside base radius — upgrade to full detail
            existing.mesh.geometry.dispose();
            scene.remove(existing.mesh);
            terrainChunks.delete(key);
            spawnTerrainChunk(cx, cz, false);
            if (!sceneryChunks.has(key)) spawnSceneryChunk(cx, cz);
          }
        }
      }

      // Remove chunks outside needed set
      for (const [key, ch] of terrainChunks) {
        if (!needed.has(key)) { ch.mesh.geometry.dispose(); scene.remove(ch.mesh); terrainChunks.delete(key); }
      }
      for (const [key, ch] of waterChunks) {
        if (!needed.has(key)) { ch.mesh.geometry.dispose(); scene.remove(ch.mesh); waterChunks.delete(key); }
      }
      for (const [key, ch] of sceneryChunks) {
        if (!needed.has(key)) { for (const obj of ch.objects) scene.remove(obj); sceneryChunks.delete(key); }
      }

      // Report chunk counts to perf stats
      if (window.SceneTuner?.reportChunks) {
        let near = 0, far = 0;
        for (const [, ch] of terrainChunks) { if (ch.far) far++; else near++; }
        let sceneryCount = 0;
        for (const [, ch] of sceneryChunks) sceneryCount += ch.objects.length;
        window.SceneTuner.reportChunks(near, far, CHUNK_SEGS, FAR_SEGS, waterChunks.size, sceneryCount);
      }
    }

    // Pre-fill visible area (skip for WaterMesh themes — they use a single plane)
    if (!activeTheme.useWaterMesh) {
      updateChunks2D(0, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BIRD - fly-by style rotation-based flight
    // ═══════════════════════════════════════════════════════════════════════
    let bird = null;       // movement container (position, yaw)
    let birdModel = null;  // visual model inside bird (pitch applied here)
    let birdMixer = null;
    let birdAction = null;
    let wasFlapping = false;
    let charNeck = null;
    let charBody = null;
    let birdPitch = 0;     // current whole-body pitch (+ = nose down, - = nose up)

    import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load('./models/fly-by-bird/scene.gltf', (gltf) => {
        birdModel = gltf.scene;
        birdModel.scale.setScalar(0.9);
        birdModel.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        // Wrap model in a movement container — pitch goes on birdModel,
        // position/yaw go on bird. This keeps dive angle visual-only.
        bird = new THREE.Group();
        // Start low and skimming — more cinematic, and you climb into the
        // world as the track opens (was 25, felt detached up high)
        bird.position.set(0, 10, 0);
        bird.add(birdModel);
        charNeck = birdModel.getObjectByName('Neck_Armature') || null;
        charBody = birdModel.getObjectByName('Armature_rootJoint') || null;
        scene.add(bird);

        if (gltf.animations && gltf.animations.length > 0) {
          birdMixer = new THREE.AnimationMixer(birdModel);
          birdAction = birdMixer.clipAction(gltf.animations[0]);
          birdAction.play();
          birdAction.fadeOut(0.01);
        }
        console.log('[Flight] Bird loaded (fly-by rotation mode)');
      });
    }).catch(err => console.warn('[Flight] Could not load bird:', err));

    scene.add(group);


    console.log('[Flight] Sun position:', sunPos.x.toFixed(3), sunPos.y.toFixed(3), sunPos.z.toFixed(3));
    console.log('[Flight] Sky sphere radius: 500, camera far should be >= 500');
    console.log('[Flight] Scene children:', scene.children.length);

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════
    // Fly-by rotation state (matches github.com/jessehhydee/fly-by)
    let charRotateYIncrement = 0;
    // charPosYIncrement removed — altitude is now driven by birdPitch
    const FLY = {
      forwardSpeed: 0.25,
      doubleSpeed: 0.6,
      // Turn rate tuned for rhythm-gate steering (originally 0.0015/0.000075,
      // ~5°/s). Now ~26°/s arriving in ~4 frames — effectively proportional
      // control; the camera lerp provides the smoothing.
      rotateYMax: 0.0075,
      rotateYAccel: 0.0019,
      pitchAltScale: 2.0,   // multiplier for pitch-driven altitude change
      minY: 2,
      maxY: 90,
      // Precision strafe: immediate lateral velocity on left/right, layered
      // over yaw. Yaw steers the course; strafe wins the gate. ~10 u/s
      // arriving in ~5 frames, reversal in ~0.3s.
      strafeMax: 0.17,
      strafeResp: 0.18,
      strafeBank: 0.5,      // visual roll into the slip (radians)
      strafeYawLean: 0.45,  // visual nose-yaw into the slip — carve, not crab
      neckYStep: 0.018, neckYMax: 0.7,
      bodyYStep: 0.01,  bodyYMax: 0.4,
      neckXStep: 0.008, neckXMax: 0.6,
      bodyXStep: 0.005, bodyXMax: 0.4,
      flapLift: 0.025,
      camLerp: 0.07,
      camY: 7,
      camZ: -10,
      lookAtZ: 15,
      // Whole-body pitch for dive/climb
      divePitchMax: 0.30,     // ~17° nose-down — gentle descent
      divePitchStep: 0.015,   // quicker tilt — vertical gate response
      climbPitchMax: 0.22,    // ~13° nose-up — gentler climb
      climbPitchStep: 0.015,
      pitchReturn: 0.025,     // how fast pitch returns to level
    };
    let isDoubleSpeed = false;
    let lookAtPosZ = FLY.lookAtZ;
    let strafeVel = 0; // current sideslip velocity (units/frame)
    // Smooth camera state (we own these — env camera must not interfere)
    let camSmooth = null;
    let camSmoothTarget = null;

    // Keyboard controls
    const birdKeys = {};
    const onBirdKeyDown = (e) => {
      birdKeys[e.code] = true;
      if (e.code === 'Space') { e.preventDefault(); isDoubleSpeed = !isDoubleSpeed; }
    };
    const onBirdKeyUp = (e) => { birdKeys[e.code] = false; };
    document.addEventListener('keydown', onBirdKeyDown);
    document.addEventListener('keyup', onBirdKeyUp);

    // ── Mouse look-around: click-drag to orbit camera, release to spring back ──
    let mouseDragging = false;
    let dragYaw = 0;
    let dragPitch = 0;
    const MOUSE_SENS = 0.003;
    const DRAG_RETURN = 0.08;
    const PITCH_LIMIT = Math.PI / 3; // ±60°
    // Pre-allocate camera math objects (never allocate in render loop)
    const _dragEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    const _dragQuat = new THREE.Quaternion();
    const _camQuat = new THREE.Quaternion();
    const _idealPos = new THREE.Vector3();
    const _idealTarget = new THREE.Vector3();

    const onMouseDown = (e) => {
      if (e.button === 0 && bird && e.target.tagName === 'CANVAS') {
        mouseDragging = true;
      }
    };
    const onMouseMove = (e) => {
      if (!mouseDragging) return;
      dragYaw -= e.movementX * MOUSE_SENS;
      dragPitch += e.movementY * MOUSE_SENS;
      dragPitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, dragPitch));
    };
    const onMouseUp = (e) => {
      if (e.button === 0) mouseDragging = false;
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // ═══════════════════════════════════════════════════════════════════════
    // MUSIC REACTIVITY — the world listens back
    //
    // Two layers, following the AC/DC philosophy from the scene-director spec:
    //  • MIDI pulses (frame-perfect, via MidiRouter → onMidi): kick punches
    //    light + ground shockwaves, snare flashes the sky, crash launches
    //    shooting-star volleys, bass pitch swells water/fog, chords tint
    //    the atmosphere.
    //  • FFT baselines (continuous, via update()'s stemData): keep mix-only
    //    tracks alive and give MIDI hits a bed to land on.
    // All values are transient multipliers/offsets applied AFTER the scene's
    // own day-cycle math each frame, so the base look is never corrupted.
    // ═══════════════════════════════════════════════════════════════════════
    const pulse = {
      kick: 0, snare: 0, hat: 0, crash: 0,
      bassSwell: 0, vocal: 0, energy: 0,
      chordHue: 0, chordMix: 0,
    };
    let terrainEmissiveBase = activeTheme.terrainMatProps?.emissiveIntensity || 0;
    let waterRoughBase = activeTheme.waterRoughness;
    let baseFov = 0;            // captured from the env camera on first frame
    let lastPulseTime = 0;
    let shadowFrame = 0;        // throttles shadow-map re-renders (~every 3rd frame)
    let musicSpeedLift = 1;     // flight speed rides the energy of the mix
    let prevBassE = 0;          // onset detection for tracks without MIDI
    let onsetCooldown = 0;
    let lastFwdSpeed = FLY.forwardSpeed; // sampled per frame for gate placement
    let flowLevel = 0;          // rhythm-gate FLOW (0..1) — earned spectacle
    const _chordColor = new THREE.Color();
    const _birdState = { position: null, quaternion: null, speedPerSec: 0 };

    // ── Shockwave rings: expanding ground pulses on kick/tom hits ──
    const RING_POOL = 6;
    const shockRings = [];
    const ringGeom = new THREE.RingGeometry(0.82, 1, 48);
    ringGeom.rotateX(-Math.PI / 2);
    for (let ri = 0; ri < RING_POOL; ri++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffddaa,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(ringGeom, mat);
      mesh.visible = false;
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      scene.add(mesh);  // world-space (group follows the bird)
      shockRings.push({ mesh, mat, active: false, age: 0, life: 1, intensity: 0 });
    }

    function spawnShockRing(intensity, colorHex) {
      if (!bird) return;
      const ring = shockRings.find(r => !r.active);
      if (!ring) return;
      const groundY = Math.max(terrainHeight(bird.position.x, bird.position.z), activeTheme.waterY);
      ring.mesh.position.set(bird.position.x, groundY + 0.4, bird.position.z);
      ring.mesh.scale.setScalar(2.5);
      ring.mat.color.setHex(colorHex);
      ring.mat.opacity = 0;
      ring.mesh.visible = true;
      ring.active = true;
      ring.age = 0;
      ring.life = 0.9 + intensity * 0.4;
      ring.intensity = intensity;
    }

    function updateShockRings(udt) {
      for (const ring of shockRings) {
        if (!ring.active) continue;
        ring.age += udt;
        const t = ring.age / ring.life;
        if (t >= 1) {
          ring.active = false;
          ring.mesh.visible = false;
          continue;
        }
        const radius = 2.5 + t * (28 + ring.intensity * 30);
        ring.mesh.scale.setScalar(radius);
        ring.mat.opacity = (1 - t) * (1 - t) * 0.55 * ring.intensity;
      }
    }

    // Frame-perfect MIDI events, enriched by MidiRouter (kind/velocity01/pitch01)
    function onMidiEvent(ev) {
      if (!ev || ev.type !== 'noteOn') return;
      const v = ev.velocity01 != null ? ev.velocity01 : (ev.velocity || 100) / 127;
      switch (ev.kind) {
        case 'kick':
          pulse.kick = Math.min(1, Math.max(pulse.kick, 0.55 + v * 0.45));
          if (v > 0.35) spawnShockRing(v, 0xffddaa);
          break;
        case 'snare':
          pulse.snare = Math.max(pulse.snare, 0.45 + v * 0.55);
          break;
        case 'hihat':
          pulse.hat = Math.max(pulse.hat, 0.35 + v * 0.65);
          break;
        case 'ride':
          pulse.hat = Math.max(pulse.hat, 0.25 + v * 0.4);
          break;
        case 'crash':
          pulse.crash = Math.max(pulse.crash, 0.65 + v * 0.35);
          for (let i = 0; i < 3; i++) launchShootingStar();
          break;
        case 'tom':
          pulse.kick = Math.max(pulse.kick, 0.3 + v * 0.3);
          if (v > 0.4) spawnShockRing(v * 0.7, 0x88ccff);
          break;
        case 'perc':
          pulse.hat = Math.max(pulse.hat, 0.2 + v * 0.4);
          break;
        case 'bass': {
          // Low notes bend the world more than high ones (pitch-weighted)
          const lowness = 1 - (ev.pitch01 != null ? ev.pitch01 : 0.5);
          pulse.bassSwell = Math.max(pulse.bassSwell, (0.35 + v * 0.65) * (0.45 + lowness * 0.55));
          break;
        }
        case 'vocal':
          pulse.vocal = Math.max(pulse.vocal, 0.3 + v * 0.7);
          break;
        case 'chord':
          pulse.chordHue = ev.hue != null ? ev.hue : pulse.chordHue;
          pulse.chordMix = Math.min(0.6, pulse.chordMix + 0.3 + v * 0.2);
          break;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCENE TUNER WIRING
    // ═══════════════════════════════════════════════════════════════════════
    const tunerCallback = (section, param, value) => {
      if (section === 'sun') {
        if (param === 'baseSunElevation') baseSunElevation = value;
        else if (param === 'sunElevationRange') sunElevationRange = value;
        else if (param === 'sunAzimuth') sunAzimuth = value;
      } else if (section === 'atmosphere') {
        if (param === 'baseTurbidity') baseTurbidity = value;
        else if (param === 'baseRayleigh') baseRayleigh = value;
        else if (param === 'baseMieCoefficient') baseMieCoefficient = value;
        else if (param === 'baseMieDirectionalG') baseMieDirectionalG = value;
        else if (param === 'baseExposure') baseExposure = value;
      } else if (section === 'lighting') {
        if (param === 'baseSunIntensity') baseSunIntensity = value;
        else if (param === 'sunIntensityRange') sunIntensityRange = value;
        else if (param === 'baseHemiIntensity') baseHemiIntensity = value;
        else if (param === 'hemiIntensityRange') hemiIntensityRange = value;
      } else if (section === 'fog') {
        if (param === 'fogDensity') {
          activeTheme.fogDensity = value;
          if (scene.fog) scene.fog.density = value; // immediate feedback
        }
        else if (param === 'fogDensityDay') {
          fogDensityDay = value;
        }
        else if (param === 'fogColor') {
          activeTheme.fogColor = value;
          if (scene.fog) scene.fog.color.setHex(value);
        }
        else if (param === 'fogColorLight') fogColorLight = value;
      } else if (section === 'water') {
        if (param === 'waterY') {
          for (const [, ch] of waterChunks) ch.mesh.position.y = value;
          if (waterMeshObj && !activeTheme.useWaterMesh) waterMeshObj.position.y = value;
        } else if (param === 'waterColor') {
          waterMat.color.setHex(value);
        } else if (param === 'waterOpacity') {
          waterMat.opacity = value;
        } else if (param === 'waterRoughness') {
          waterMat.roughness = value;
          waterRoughBase = value;
        } else if (param === 'waterMetalness') {
          waterMat.metalness = value;
        }
      } else if (section === 'terrain') {
        if (param === 'flatShading') {
          terrainMat.flatShading = value;
          terrainMat.needsUpdate = true;
        } else if (param === 'roughness') {
          terrainMat.roughness = value;
        } else if (param === 'metalness') {
          terrainMat.metalness = value;
        } else if (param === 'emissiveIntensity') {
          terrainMat.emissiveIntensity = value;
          terrainEmissiveBase = value;
        } else if (param === 'sceneryDensity') {
          activeTheme.sceneryDensity = value;
        } else if (terrainMat._waterUniforms && param in terrainMat._waterUniforms) {
          terrainMat._waterUniforms[param].value = value;
        }
      } else if (section === 'flight') {
        if (param in FLY) FLY[param] = value;
      } else if (section === 'ocean') {
        // Live ocean tuning → oceanCfg (applied to uniforms each frame)
        const map = {
          waveHeight: 'ampBase', choppiness: 'choppy', waveScale: 'waveScale',
          foamStart: 'foamLo', foamEnd: 'foamHi', foamAmount: 'foamAmt',
          glint: 'glint', glintTight: 'specPow',
          detail: 'detail', detailScale: 'detailScale',
        };
        if (map[param]) oceanCfg[map[param]] = value;
      } else if (section === 'stars') {
        if (param in starCfg) {
          starCfg[param] = value;
          const moonParams = ['moonBrt', 'moonGlow', 'moonSize'];
          const runtimeOnly = ['domeOpacity', 'fadePower', 'moonElev', 'moonAz'];
          if (moonParams.includes(param)) {
            repaintMoon();
          } else if (!runtimeOnly.includes(param)) {
            scheduleStarRepaint();
          }
          if (param === 'moonSize') updateMoonSprite();
        }
      }
    };
    if (window.SceneTuner) {
      window.SceneTuner.onUpdate(tunerCallback);
      window.SceneTuner.syncFromTheme(activeTheme, FLY, starCfg);
    }

    return {
      group,
      // Tell app.js not to force-enable EffectsManager effects (grid, aurora, etc.)
      disableEffects: { grid: true, aurora: true, lightning: true, lights: true, particles: true },

      // Frame-perfect MIDI events (enriched by MidiRouter in app.js)
      onMidi: onMidiEvent,

      // Live music pulse state — app.js drives post-processing from this
      getMusicPulse() { return pulse; },

      // ── Rhythm-gate API (rhythm-gates.js) ──
      getBirdState() {
        if (!bird) return null;
        _birdState.position = bird.position;
        _birdState.quaternion = bird.quaternion;
        _birdState.speedPerSec = lastFwdSpeed * 60;
        return _birdState;
      },
      getGroundHeight(x, z) {
        return Math.max(terrainHeight(x, z), activeTheme.waterY);
      },
      onGateHit(strength, perfect) {
        pulse.kick = Math.min(1, Math.max(pulse.kick, 0.45 + strength * 0.4));
        if (perfect) {
          pulse.crash = Math.max(pulse.crash, 0.4);
          spawnShockRing(0.9, 0xffd700);
        }
      },
      setFlow(f) {
        flowLevel = Math.max(0, Math.min(1, f || 0));
      },

      setTheme(newThemeName) {
        const newTheme = THEMES[newThemeName];
        if (!newTheme) {
          console.warn('[Flight] Unknown theme:', newThemeName, '— keeping current');
          return;
        }
        if (newTheme === activeTheme) return;
        console.log('[Flight] Hot-swapping theme to:', newThemeName);

        // 1. Dispose current WaterMesh or terrain materials
        disposeWaterMesh();
        if (terrainMat) terrainMat.dispose();
        waterMat.dispose();
        for (const m of Object.values(sceneryMats)) m.dispose();
        for (const g of Object.values(sceneryGeoms)) g.dispose();

        // 2. Clear all terrain/water/scenery chunks
        for (const [, ch] of terrainChunks) {
          ch.mesh.geometry.dispose();
          scene.remove(ch.mesh);
        }
        terrainChunks.clear();

        for (const [, ch] of waterChunks) {
          ch.mesh.geometry.dispose();
          scene.remove(ch.mesh);
        }
        waterChunks.clear();

        for (const [, ch] of sceneryChunks) {
          for (const obj of ch.objects) {
            obj.traverse(c => { if (c.geometry) c.geometry.dispose(); });
            scene.remove(obj);
          }
        }
        sceneryChunks.clear();

        // 3. Swap theme reference
        activeTheme = newTheme;

        // 4. Recreate materials from new theme (real ocean for any water)
        terrainMat = null;
        createWaterMeshForTheme(activeTheme);
        if (!activeTheme.useWaterMesh) {
          terrainMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            flatShading: activeTheme.terrainMatProps.flatShading,
            roughness: activeTheme.terrainMatProps.roughness,
            metalness: activeTheme.terrainMatProps.metalness,
            emissiveIntensity: activeTheme.terrainMatProps.emissiveIntensity,
            emissive: new THREE.Color(0xffffff),
          });
          applyCloudShadow(terrainMat);
        }

        waterMat = new THREE.MeshStandardMaterial({
          color: activeTheme.waterColor,
          transparent: true,
          opacity: activeTheme.waterOpacity,
          roughness: activeTheme.waterRoughness,
          metalness: activeTheme.waterMetalness,
          side: THREE.DoubleSide,
        });

        // 5. Create new scenery materials/geometries
        sceneryMats = activeTheme.sceneryMaterials ? activeTheme.sceneryMaterials(THREE) : {};
        sceneryGeoms = activeTheme.sceneryGeometries ? activeTheme.sceneryGeometries(THREE) : {};

        // 6. Update atmosphere variables
        baseSunElevation = activeTheme.baseSunElevation;
        sunAzimuth = activeTheme.sunAzimuth;
        baseTurbidity = activeTheme.baseTurbidity;
        baseRayleigh = activeTheme.baseRayleigh;
        baseMieCoefficient = activeTheme.baseMieCoefficient;
        baseMieDirectionalG = activeTheme.baseMieDirectionalG;
        baseExposure = activeTheme.baseExposure;

        // Fog stays off (removed — it hid the scenery)

        // 7. Update chunk constants
        CHUNK_SIZE = activeTheme.chunkSize || 80;
        CHUNK_SEGS = activeTheme.chunkSegs || 20;
        CHUNK_RANGE = activeTheme.chunkRange || 5;

        // 8. Re-hide any new environment objects (ground plane, sky, etc.)
        scene.traverse(child => {
          if (child.name === 'grid-effects' || child.name === 'lightning-effects' ||
              child.name === 'aurora-effects' || child.name === 'lights-effects' ||
              child.name === 'ride-path' || child.name === 'parallax-backdrop') {
            child.visible = false;
            if (!hiddenEffects.includes(child)) hiddenEffects.push(child);
          }
          if (child.isMesh && child.geometry?.parameters?.width > 1000 &&
              child.rotation?.x === -Math.PI / 2) {
            child.visible = false;
            if (!hiddenEffects.includes(child)) hiddenEffects.push(child);
          }
          if (child.isInstancedMesh) {
            child.visible = false;
            if (!hiddenEffects.includes(child)) hiddenEffects.push(child);
          }
          if (child.isMesh && child.material?._tslUniforms) {
            child.visible = false;
            if (!hiddenEffects.includes(child)) hiddenEffects.push(child);
          }
        });

        // 9. Regenerate chunks around bird (skip for WaterMesh themes)
        if (!activeTheme.useWaterMesh) {
          const posX = bird ? bird.position.x : 0;
          const posZ = bird ? bird.position.z : 0;
          updateChunks2D(posX, posZ);
        }

        // Update new lighting/fog range variables from theme (with fallbacks)
        sunElevationRange = activeTheme.sunElevationRange || 10;
        baseSunIntensity = activeTheme.baseSunIntensity || 0.1;
        sunIntensityRange = activeTheme.sunIntensityRange || 1.6;
        baseHemiIntensity = activeTheme.baseHemiIntensity || 0.04;
        hemiIntensityRange = activeTheme.hemiIntensityRange || 0.46;
        fogDensityDay = activeTheme.fogDensityDay ?? 0.0002;
        fogColorLight = activeTheme.fogColorLight || 0x8c7a5e;

        // Music-reactivity baselines follow the new theme
        terrainEmissiveBase = activeTheme.terrainMatProps?.emissiveIntensity || 0;
        waterRoughBase = activeTheme.waterRoughness;
        if (cloudUniforms) cloudUniforms.coverage.value = activeTheme.cloudCoverage ?? 0.42;

        if (window.SceneTuner) window.SceneTuner.syncFromTheme(activeTheme, FLY, starCfg);

        console.log('[Flight] Theme swap complete:', newThemeName);
      },

      update(time, freq, amplitude, shipPos, shipSpeed, stemData) {
        currentTime = time;
        const shipX = shipPos ? shipPos.x : 0;
        const shipZ = shipPos ? shipPos.z : 0;

        // Keep effects hidden
        for (const fx of hiddenEffects) fx.visible = false;

        // Sun rises with song progress over baseSunElevation → baseSunElevation + sunElevationRange
        const SUN_START = baseSunElevation;
        const SUN_END = baseSunElevation + sunElevationRange;
        let songProgress = 0;
        const sp = window.currentStemPlayer;
        if (sp && sp.getDuration && sp.getDuration() > 0) {
          songProgress = Math.min(1, Math.max(0, (sp.getCurrentTime() || 0) / sp.getDuration()));
        } else {
          // Fallback: DOM audio element
          const aud = document.getElementById('playerAudio');
          if (aud && aud.duration > 0) songProgress = aud.currentTime / aud.duration;
        }
        const dynElevation = SUN_START + songProgress * (SUN_END - SUN_START);
        const dynPhi = (90 - dynElevation) * Math.PI / 180;
        const dynTheta = sunAzimuth * Math.PI / 180;
        sunPos.setFromSphericalCoords(1, dynPhi, dynTheta);
        skyUniforms.sunPosition.value.copy(sunPos);
        if (terrainMat && terrainMat._sunDirUniform) terrainMat._sunDirUniform.value.copy(sunPos);
        // (water light direction handled in the moonlight block below — by day
        // it glints off the sun, after dark off the moon)

        // Natural sun-linked lighting: derive everything from sun elevation
        // smoothstep maps elevation smoothly: 0 at -5° (below horizon) → 1 at +5° (above)
        const sunT = Math.max(0, Math.min(1, (dynElevation - SUN_START) / (SUN_END - SUN_START)));
        const sunFactor = sunT * sunT * (3 - 2 * sunT);  // smoothstep curve

        // Atmosphere: golden-hour haze near horizon, cleaner sky when sun is up
        const horizonProximity = 1 - Math.abs(dynElevation) / Math.max(Math.abs(SUN_START), Math.abs(SUN_END));
        skyUniforms.turbidity.value = baseTurbidity + (1 - sunFactor) * 3 + horizonProximity * 2;
        skyUniforms.rayleigh.value = baseRayleigh + sunFactor * 1.5;
        skyUniforms.mieCoefficient.value = baseMieCoefficient + horizonProximity * 0.02;
        skyUniforms.mieDirectionalG.value = baseMieDirectionalG + horizonProximity * 0.12;
        // Floors keep the pre-dawn start readable (themes were authored
        // when fog supplied most of the early-track luminance)
        skyUniforms.exposure.value = Math.max(baseExposure, 0.18) + sunFactor * 0.5;

        // Light intensities driven by sun elevation (hemi set in moon block below)
        sunLight.intensity = baseSunIntensity + sunFactor * sunIntensityRange;

        // Sun color shifts: warm orange near horizon → warm golden when higher
        const warmth = 1 - sunFactor * 0.15;  // 1.0 (warm) → 0.85 (stays warm)
        sunLight.color.setRGB(1, 0.53 + sunFactor * 0.17, 0.27 + sunFactor * 0.23);

        // ── Moonlight: cool fill that rises as the sun sets, so night reads as
        // moonlit (deep blue, soft) instead of black, and the reflective water
        // has a luminary to glint off after dark. ──
        const moonElevNow = -dynElevation + starCfg.moonElev;
        const moonAzNow = (sunAzimuth + 180 + starCfg.moonAz) * Math.PI / 180;
        const moonPhiNow = (90 - moonElevNow) * Math.PI / 180;
        _moonDir.setFromSphericalCoords(1, moonPhiNow, moonAzNow);
        const night = 1 - sunFactor;                                   // 0 day → 1 night
        const moonUp = Math.max(0, Math.min(1, (moonElevNow + 5) / 18)); // above horizon
        const moonStrength = night * moonUp;

        const mbx = bird ? bird.position.x : shipX;
        const mbz = bird ? bird.position.z : shipZ;
        moonLight.intensity = moonStrength * 0.45;
        moonLight.position.set(mbx + _moonDir.x * 120, _moonDir.y * 120, mbz + _moonDir.z * 120);
        moonLight.target.position.set(mbx, 0, mbz);
        moonLight.target.updateMatrixWorld();

        // Hemisphere ambient: warm by day, cool by night, with a small moon
        // lift so terrain/water never crush to pure black
        hemiLight.intensity = Math.max(baseHemiIntensity, 0.1) + sunFactor * hemiIntensityRange + moonStrength * 0.12;
        const nb = night * 0.5; // night blend toward cool blue
        hemiLight.color.setRGB(
          warmth * (1 - nb) + 0.50 * nb,
          0.8 * warmth * (1 - nb) + 0.62 * nb,
          0.67 * warmth * (1 - nb) + 0.85 * nb,
        );

        // Reflective water: glint off the sun by day, the moon after dark, and
        // lift its base toward a moonlit blue at night so it's never a black void.
        // The glint is driven HDR-bright (sunColor > 1) so it blooms into real
        // sparkle through the post chain. Brightness is held STEADY — the moving
        // normal map sparkles the highlight on its own; modulating sunColor over
        // time made the whole reflection pulse (read as ripples↔smooth).
        if (waterMeshObj) {
          if (waterMeshObj.sunDirection) {
            waterMeshObj.sunDirection.value.copy(sunFactor > 0.18 ? sunPos : _moonDir);
          }
          if (waterMeshObj.sunColor) {
            if (sunFactor > 0.18) {
              const g = 1.5;                            // HDR warm sun glint → blooms
              waterMeshObj.sunColor.value.setRGB(g, g * 0.95, g * 0.85);
            } else {
              const g = 1.0;                            // cool moonglade reflection
              waterMeshObj.sunColor.value.setRGB(g * 0.68, g * 0.8, g);
            }
          }
          if (waterMeshObj.waterColor && waterMeshObj._baseWaterColor) {
            waterMeshObj.waterColor.value.copy(waterMeshObj._baseWaterColor)
              .lerp(_nightWater, night * 0.6);
          }
        }

        // Gerstner ocean: animate waves, follow the bird (world-anchored), and
        // grade colors/specular with the day cycle. Gentle bass lifts the swell.
        if (oceanMesh && oceanUniforms) {
          const obx = bird ? bird.position.x : shipX;
          const obz = bird ? bird.position.z : shipZ;
          oceanMesh.position.set(obx, oceanMesh.position.y, obz);
          oceanUniforms.time.value = time;
          oceanUniforms.originX.value = obx;
          oceanUniforms.originZ.value = obz;
          // Live-tunable look (Scene Tuner) + a bass lift on the height
          oceanUniforms.amp.value = oceanCfg.ampBase * (1 + pulse.bassSwell * 0.4);
          oceanUniforms.choppy.value = oceanCfg.choppy;
          oceanUniforms.waveScale.value = oceanCfg.waveScale;
          oceanUniforms.foamLo.value = oceanCfg.foamLo;
          oceanUniforms.foamHi.value = oceanCfg.foamHi;
          oceanUniforms.foamAmt.value = oceanCfg.foamAmt;
          oceanUniforms.glint.value = oceanCfg.glint;
          oceanUniforms.specPow.value = oceanCfg.specPow;
          oceanUniforms.detail.value = oceanCfg.detail;
          oceanUniforms.detailScale.value = oceanCfg.detailScale;
          oceanUniforms.sunDir.value.copy(sunFactor > 0.18 ? sunPos : _moonDir);
          if (sunFactor > 0.18) oceanUniforms.sunCol.value.setRGB(1.7, 1.5, 1.2); // HDR warm glint
          else oceanUniforms.sunCol.value.setRGB(0.55, 0.66, 0.85);              // cool moonglade
          const skB = 0.18 + sunFactor * 0.8;
          oceanUniforms.skyCol.value.setRGB(skB * 0.62, skB * 0.8, skB);
          const dpB = 0.7 + sunFactor * 0.3;
          oceanUniforms.deepCol.value.setRGB(0.04 * dpB, 0.18 * dpB, 0.27 * dpB);
        }

        // Volumetric clouds: wind drift + day-cycle tinting. Dawn lights the
        // tops warm and dim; midday reads white with cool shaded undersides.
        if (cloudUniforms) {
          cloudUniforms.time.value = time;
          const cb = 0.12 + sunFactor * 0.95;
          cloudUniforms.lightCol.value.setRGB(
            cb,
            cb * (0.62 + sunFactor * 0.38),
            cb * (0.5 + sunFactor * 0.5),
          );
          const ab = 0.05 + sunFactor * 0.3;
          cloudUniforms.ambientCol.value.setRGB(ab * 0.85, ab * 0.9, ab * 1.1);
        }

        // Renderer tone mapping exposure — darkens/brightens the ENTIRE scene (terrain, water, bird, everything)
        const envRenderer = window.EnvironmentMode?.instance?.renderer;
        if (envRenderer) {
          if (envRenderer.toneMapping === THREE.NoToneMapping) {
            envRenderer.toneMapping = THREE.ACESFilmicToneMapping;
          }
          // Floor raised (0.15 → 0.45 over time) — pre-dawn should feel like
          // early morning, not night; the day cycle still brightens from here
          envRenderer.toneMappingExposure = 0.45 + sunFactor * 0.55;  // 0.45 (dawn) → 1.0 (bright)

          // Throttle shadow-map re-renders: the sun and scene change slowly,
          // so a full caster pass every frame is wasted GPU. Update every 3rd
          // frame (~imperceptible lag on the bird's shadow) to bank back the
          // cost of enabling shadows. Expert-recommended for near-static lights.
          if (envRenderer.shadowMap) {
            if (envRenderer.shadowMap.autoUpdate !== false) envRenderer.shadowMap.autoUpdate = false;
            shadowFrame = (shadowFrame + 1) % 3;
            envRenderer.shadowMap.needsUpdate = (shadowFrame === 0);
          }
        }

        // ── Star dome fade + moon + shooting stars ──
        const starDarkness = Math.max(0, 1 - sunFactor * starCfg.fadePower);
        const dt = lastStarTime > 0 ? time - lastStarTime : 0.016;
        if (starDarkness > 0) {
          starDome.visible = true;
          starDomeMat.opacity = starDarkness * starCfg.domeOpacity;

          // Moon tracks opposite the sun (180° offset in azimuth, mirrored elevation)
          const moonElev = -dynElevation + starCfg.moonElev;  // rises as sun sets
          const moonAz = (sunAzimuth + 180 + starCfg.moonAz) % 360;
          const moonPhiRad = (90 - moonElev) * Math.PI / 180;
          const moonThetaRad = moonAz * Math.PI / 180;
          const moonDist = 498;
          _moonPos.setFromSphericalCoords(moonDist, moonPhiRad, moonThetaRad);
          moon.position.copy(_moonPos);
          moon.visible = true;
          moonMat.opacity = starDarkness * starCfg.moonBrt;

          // Shooting stars — random chance per frame at night
          if (Math.random() < 0.003 && starDarkness > 0.3) {
            launchShootingStar();
          }

          // Animate active shooting stars
          for (const ss of shootingStars) {
            if (!ss.active) continue;
            ss.progress += dt;
            const t = ss.progress / 0.8; // 0→1 over 0.8s
            if (t >= 1) {
              ss.active = false;
              ss.line.visible = false;
              continue;
            }
            const dist = ss.speed * ss.progress;
            const posAttr = ss.geom.getAttribute('position');
            const colAttr = ss.geom.getAttribute('color');
            const fadeOut = t < 0.4 ? 1 : 1 - (t - 0.4) / 0.6;
            for (let j = 0; j < SHOOTING_TRAIL; j++) {
              const trailFrac = j / (SHOOTING_TRAIL - 1);
              const offset = dist - trailFrac * 35;
              const px = ss.startPos.x + ss.direction.x * offset;
              const py = ss.startPos.y + ss.direction.y * offset;
              const pz = ss.startPos.z + ss.direction.z * offset;
              posAttr.array[j * 3]     = px;
              posAttr.array[j * 3 + 1] = py;
              posAttr.array[j * 3 + 2] = pz;
              const brt = (1 - trailFrac) * fadeOut * starDarkness;
              colAttr.array[j * 3]     = brt;
              colAttr.array[j * 3 + 1] = brt;
              colAttr.array[j * 3 + 2] = brt * 0.85;
            }
            posAttr.needsUpdate = true;
            colAttr.needsUpdate = true;
          }
        } else {
          starDome.visible = false;
          moon.visible = false;
          for (const ss of shootingStars) {
            if (ss.active) { ss.active = false; ss.line.visible = false; }
          }
        }
        lastStarTime = time;

        // ── MUSIC REACTIVITY: decay pulses, blend FFT baselines, modulate ──
        // Runs after the day-cycle assignments above so everything here is a
        // transient offset on top of the scene's true state (AC over DC).
        const udt = Math.min(0.05, Math.max(0.001, lastPulseTime > 0 ? time - lastPulseTime : 0.016));
        lastPulseTime = time;

        pulse.kick *= Math.exp(-udt * 9);
        pulse.snare *= Math.exp(-udt * 11);
        pulse.hat *= Math.exp(-udt * 13);
        pulse.crash *= Math.exp(-udt * 3.2);
        pulse.bassSwell *= Math.exp(-udt * 4.5);
        pulse.vocal *= Math.exp(-udt * 3.5);
        pulse.chordMix *= Math.exp(-udt * 1.1);

        // Continuous FFT layer — carries mix-only tracks, beds the MIDI hits
        let drumsE = 0, bassE = 0, vocalE = 0, melodicE = 0;
        if (stemData) {
          if (stemData.mix && !stemData.drums) {
            const m = stemData.mix;
            drumsE = (m.bass || 0) * 0.8;
            bassE = m.bass || 0;
            vocalE = (m.mid || 0) * 0.7;
            melodicE = (m.treble || 0) * 0.8;
          } else {
            drumsE = stemData.drums ? stemData.drums.energy || 0 : 0;
            bassE = stemData.bass ? stemData.bass.energy || 0 : 0;
            vocalE = (stemData.vocals ? stemData.vocals.energy || 0 : 0)
              + (stemData['backing-vocals'] ? stemData['backing-vocals'].energy || 0 : 0) * 0.5;
            melodicE = (stemData.synth ? stemData.synth.energy || 0 : 0) * 0.6
              + (stemData.keyboard ? stemData.keyboard.energy || 0 : 0) * 0.4
              + (stemData.guitar ? stemData.guitar.energy || 0 : 0) * 0.4;
          }
        }
        const energyTarget = Math.min(1, drumsE * 0.5 + bassE * 0.3 + vocalE * 0.2 + melodicE * 0.2);
        pulse.energy += (energyTarget - pulse.energy) * Math.min(1, udt * 4);

        // Onset fallback for tracks without MIDI: a sharp rise in low-end
        // energy reads as a kick so mix-only tracks still punch
        if (onsetCooldown > 0) onsetCooldown -= udt;
        if (bassE - prevBassE > 0.12 && bassE > 0.3 && onsetCooldown <= 0 && pulse.kick < 0.3) {
          pulse.kick = Math.max(pulse.kick, 0.5 + Math.min(0.4, (bassE - prevBassE)));
          if (bassE > 0.45) spawnShockRing(Math.min(1, bassE), 0xffddaa);
          onsetCooldown = 0.18;
        }
        prevBassE = bassE;

        const bassSwellEff = Math.min(1, Math.max(pulse.bassSwell, bassE * 0.75));
        const vocalEff = Math.min(1, Math.max(pulse.vocal, vocalE * 0.8));
        const hatEff = Math.min(1, Math.max(pulse.hat, melodicE * 0.3));

        // Light: kick punches the sun, snare flashes the sky dome
        sunLight.intensity *= 1 + pulse.kick * 0.5 + pulse.crash * 0.25;
        hemiLight.intensity *= 1 + pulse.snare * 0.9 + vocalEff * 0.2;
        skyUniforms.exposure.value += pulse.snare * 0.08 + pulse.crash * 0.14 + vocalEff * 0.04;

        // Terrain glows with the beat
        if (terrainMat) {
          terrainMat.emissiveIntensity = terrainEmissiveBase + pulse.kick * 0.07 + pulse.crash * 0.05;
        }

        // Water: keep a steady rippled surface (the normal map animates itself
        // and varies spatially). Only a gentle bass breath on the distortion —
        // pulsing the GLOBAL distortionScale made the whole sea go smooth↔choppy
        // in unison, which read as the surface oscillating.
        if (waterMeshObj && waterMeshObj.distortionScale && typeof waterMeshObj.distortionScale.value === 'number') {
          waterMeshObj.distortionScale.value = waterDistortBase * (1 + bassSwellEff * 0.25);
        }
        if (typeof waterRoughBase === 'number') {
          waterMat.roughness = Math.max(0.02, waterRoughBase * (1 - hatEff * 0.3 - bassSwellEff * 0.1));
        }

        // Chords tint the sky light toward the actual harmony
        if (pulse.chordMix > 0.02) {
          _chordColor.setHSL(pulse.chordHue, 0.5, 0.55);
          hemiLight.color.lerp(_chordColor, pulse.chordMix * 0.35);
        }

        // Night sky: hats twinkle the stars, vocals breathe through the moon
        if (starDome.visible) {
          starDomeMat.opacity *= 1 + hatEff * 0.45;
          moonMat.opacity *= 1 + vocalEff * 0.25;
        }

        // Shockwave rings + musical flight speed. High FLOW (rhythm gates)
        // earns extra pace and a brighter world — spectacle as reward.
        updateShockRings(udt);
        musicSpeedLift = 1 + pulse.energy * 0.4 + pulse.kick * 0.12 + flowLevel * 0.18;
        if (terrainMat) terrainMat.emissiveIntensity += flowLevel * 0.02;

        // Use bird's actual position for terrain/sun (bird uses translateZ, so position tracks real flight path)
        const posX = bird ? bird.position.x : shipX;
        const posZ = bird ? bird.position.z : shipZ;

        // Update sun light to match sky, centered on bird for shadows
        sunLight.position.copy(sunPos).multiplyScalar(100);
        sunLight.position.x += posX;
        sunLight.position.z += posZ;
        sunLight.target.position.set(posX, 0, posZ);
        sunLight.target.updateMatrixWorld();

        // Update forward direction for directional chunk loading
        if (bird) {
          chunkDirX = Math.sin(bird.rotation.y);
          chunkDirZ = Math.cos(bird.rotation.y);
        }

        // Real ocean follows the bird for every theme that has water
        if (waterMeshObj) {
          waterMeshObj.position.x = posX;
          waterMeshObj.position.z = posZ;
        }

        // Spawn/cleanup terrain + scenery in 2D grid around bird
        // (skip for pure-ocean themes — no terrain chunks there)
        if (!activeTheme.useWaterMesh) {
          updateChunks2D(posX, posZ);

          // Animate terrain if theme requires it (e.g. ocean waves)
          if (activeTheme.animated && activeTheme.animateChunks) {
            activeTheme.animateChunks(terrainChunks, time, activeTheme, noise2D, fbm, CHUNK_SIZE);
          }
        }

        // ── Fly-by bird flight (rotation-based, matches jessehhydee/fly-by) ──
        if (bird) {
          const leftDown  = birdKeys['ArrowLeft']  || birdKeys['KeyA'];
          const rightDown = birdKeys['ArrowRight'] || birdKeys['KeyD'];
          const upDown    = birdKeys['ArrowUp']    || birdKeys['KeyW'];
          const downDown  = birdKeys['ArrowDown']  || birdKeys['KeyS'];
          const flapping  = birdKeys['ShiftLeft']  || birdKeys['ShiftRight'];

          // Always move forward in facing direction; the music lifts the pace
          const fwdSpeed = (isDoubleSpeed ? FLY.doubleSpeed : FLY.forwardSpeed) * musicSpeedLift;
          lastFwdSpeed = fwdSpeed;
          bird.translateZ(fwdSpeed);

          // ── Flapping: gentle lift ──
          if (flapping && bird.position.y < FLY.maxY) {
            bird.position.y += FLY.flapLift;
          }

          // ── Up: pitch nose-up (climb) ──
          if (upDown) {
            if (birdPitch > -FLY.climbPitchMax) birdPitch -= FLY.climbPitchStep;
            if (charNeck && charNeck.rotation.x > -FLY.neckXMax) charNeck.rotation.x -= FLY.neckXStep * 0.5;
            if (charBody && charBody.rotation.x > -FLY.bodyXMax) charBody.rotation.x -= FLY.bodyXStep * 0.5;
          }
          // ── Down: pitch nose-down (dive) ──
          if (downDown) {
            if (birdPitch < FLY.divePitchMax) birdPitch += FLY.divePitchStep;
            if (charNeck && charNeck.rotation.x < FLY.neckXMax) charNeck.rotation.x += FLY.neckXStep;
            if (charBody && charBody.rotation.x < FLY.bodyXMax) charBody.rotation.x += FLY.bodyXStep;
          }

          // ── Pitch-driven altitude: sin(pitch) * speed ──
          // Positive pitch = nose down = descend, negative = nose up = ascend
          if (birdPitch !== 0) {
            const altDelta = Math.sin(birdPitch) * fwdSpeed * FLY.pitchAltScale;
            bird.position.y -= altDelta;
            bird.position.y = Math.max(FLY.minY, Math.min(FLY.maxY, bird.position.y));
          }

          // ── Left: yaw left ──
          if (leftDown) {
            bird.rotateY(charRotateYIncrement);
            const yMax = isDoubleSpeed ? FLY.rotateYMax * 2 : FLY.rotateYMax;
            if (charRotateYIncrement < yMax) charRotateYIncrement += FLY.rotateYAccel;
            if (charNeck && charNeck.rotation.y > -FLY.neckYMax) charNeck.rotation.y -= FLY.neckYStep;
            if (charBody && charBody.rotation.y < FLY.bodyYMax) charBody.rotation.y += FLY.bodyYStep;
          }
          // ── Right: yaw right ──
          if (rightDown) {
            bird.rotateY(-charRotateYIncrement);
            const yMax = isDoubleSpeed ? FLY.rotateYMax * 2 : FLY.rotateYMax;
            if (charRotateYIncrement < yMax) charRotateYIncrement += FLY.rotateYAccel;
            if (charNeck && charNeck.rotation.y < FLY.neckYMax) charNeck.rotation.y += FLY.neckYStep;
            if (charBody && charBody.rotation.y > -FLY.bodyYMax) charBody.rotation.y -= FLY.bodyYStep;
          }

          // ── Revert pitch & neck/body (no up/down) ──
          if ((!upDown && !downDown) || (upDown && downDown)) {
            // Smoothly return whole-body pitch to level
            if (birdPitch > FLY.pitchReturn) birdPitch -= FLY.pitchReturn;
            else if (birdPitch < -FLY.pitchReturn) birdPitch += FLY.pitchReturn;
            else birdPitch = 0;
            // Revert neck/body bone tilt toward neutral
            if (charNeck && charNeck.rotation.x < 0) charNeck.rotation.x += FLY.neckXStep;
            if (charNeck && charNeck.rotation.x > 0) charNeck.rotation.x -= FLY.neckXStep;
            if (charBody && charBody.rotation.x < 0) charBody.rotation.x += FLY.bodyXStep;
            if (charBody && charBody.rotation.x > 0) charBody.rotation.x -= FLY.bodyXStep;
          }

          // ── Apply whole-body pitch to visual model ──
          if (birdModel) birdModel.rotation.x = birdPitch;

          // ── Revert yaw (no left/right) ──
          if ((!leftDown && !rightDown) || (leftDown && rightDown)) {
            if (charRotateYIncrement > 0) charRotateYIncrement -= FLY.rotateYAccel;
            if ((charNeck && charNeck.rotation.y < 0) || (charBody && charBody.rotation.y > 0)) {
              bird.rotateY(charRotateYIncrement);
              if (charNeck) charNeck.rotation.y += FLY.neckYStep;
              if (charBody) charBody.rotation.y -= FLY.bodyYStep;
            }
            if ((charNeck && charNeck.rotation.y > 0) || (charBody && charBody.rotation.y < 0)) {
              bird.rotateY(-charRotateYIncrement);
              if (charNeck) charNeck.rotation.y -= FLY.neckYStep;
              if (charBody) charBody.rotation.y += FLY.bodyYStep;
            }
          }

          // ── Precision strafe: left/right sideslip with immediate response.
          // Yaw above still carries the course; this wins the gate. ──
          const strafeInput = (leftDown ? 1 : 0) - (rightDown ? 1 : 0);
          strafeVel += (strafeInput * FLY.strafeMax - strafeVel) * FLY.strafeResp;
          if (Math.abs(strafeVel) > 0.0001) bird.translateX(strafeVel);
          if (birdModel) {
            // Carve, don't crab: nose yaws and wings bank INTO the slip so the
            // body agrees with the velocity vector. Visual only — flight path
            // stays snappy. Slip + is toward +X (screen-left); banking left =
            // left wing down = NEGATIVE z-roll viewed from the chase camera.
            const slip = strafeVel / FLY.strafeMax;
            birdModel.rotation.z += (-slip * FLY.strafeBank - birdModel.rotation.z) * 0.12;
            birdModel.rotation.y += (slip * FLY.strafeYawLean - birdModel.rotation.y) * 0.1;
          }

          // ── Ground collision: never clip through terrain, water, or scenery ──
          const groundH = Math.max(terrainHeight(bird.position.x, bird.position.z), activeTheme.waterY);
          const clearance = 3; // above treetops/rocks
          if (bird.position.y < groundH + clearance) {
            bird.position.y = groundH + clearance;
            if (birdPitch > 0) birdPitch = 0; // level out on ground hit (cancel dive)
          }

          // ── Wing animation on flap ──
          if (birdMixer) {
            if (flapping && !wasFlapping && birdAction) {
              birdAction.reset().setEffectiveTimeScale(0.6).setEffectiveWeight(1).fadeIn(0.8).play();
            } else if (!flapping && wasFlapping && birdAction) {
              birdAction.fadeOut(1.2);
            }
            wasFlapping = flapping;
            birdMixer.update(0.016);
          }

          // ── Hide env player, use this bird instead ──
          const env = window.EnvironmentMode?.instance;
          if (env?.player) env.player.visible = false;

          // ── Camera: quaternion-based trailing follow + mouse look-around ──
          const cam = env?.camera;
          if (cam) {
            // Smooth spring-back when not dragging
            if (!mouseDragging) {
              dragYaw *= (1 - DRAG_RETURN);
              dragPitch *= (1 - DRAG_RETURN);
              if (Math.abs(dragYaw) < 0.001) dragYaw = 0;
              if (Math.abs(dragPitch) < 0.001) dragPitch = 0;
            }

            // Combine bird orientation with mouse drag orbit
            _dragEuler.set(dragPitch, dragYaw, 0);
            _dragQuat.setFromEuler(_dragEuler);
            _camQuat.multiplyQuaternions(bird.quaternion, _dragQuat);

            _idealPos.set(0, FLY.camY, FLY.camZ)
              .applyQuaternion(_camQuat)
              .add(bird.position);

            // Dynamic look-ahead (pulls in at high altitude)
            if (!leftDown && !rightDown && !upDown && !downDown) {
              if (bird.position.y > 60 && lookAtPosZ > 5) lookAtPosZ -= 0.2;
              if (bird.position.y <= 60 && lookAtPosZ < FLY.lookAtZ) lookAtPosZ += 0.2;
            }

            _idealTarget.set(0, -1.2, lookAtPosZ)
              .applyQuaternion(_camQuat)
              .add(bird.position);

            if (!camSmooth) {
              camSmooth = _idealPos.clone();
              camSmoothTarget = _idealTarget.clone();
            } else {
              camSmooth.lerp(_idealPos, FLY.camLerp);
              camSmoothTarget.lerp(_idealTarget, FLY.camLerp);
            }
            cam.position.copy(camSmooth);
            cam.lookAt(camSmoothTarget);
            // (No beat-driven FOV/shake — the camera holds a steady frame.)
          }
        }

        // Track bird position for terrain/sky (use bird if loaded, else env shipPos)
        const birdX = bird ? bird.position.x : shipX;
        const birdZ = bird ? bird.position.z : shipZ;
        group.position.set(birdX, 0, birdZ);
      },

      dispose() {
        // Remove bird keyboard + mouse listeners
        document.removeEventListener('keydown', onBirdKeyDown);
        document.removeEventListener('keyup', onBirdKeyUp);
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Music reactivity: shockwave rings + camera FOV restore
        for (const ring of shockRings) {
          scene.remove(ring.mesh);
          ring.mat.dispose();
        }
        ringGeom.dispose();
        const envCam = window.EnvironmentMode?.instance?.camera;
        if (envCam && baseFov > 0) {
          envCam.fov = baseFov;
          envCam.updateProjectionMatrix();
        }

        // Restore renderer tone mapping + shadow auto-update for other scenes
        const envRenderer = window.EnvironmentMode?.instance?.renderer;
        if (envRenderer) {
          envRenderer.toneMapping = THREE.NoToneMapping;
          envRenderer.toneMappingExposure = 1;
          if (envRenderer.shadowMap) {
            envRenderer.shadowMap.autoUpdate = true;
            envRenderer.shadowMap.needsUpdate = true;
          }
        }

        // Clear fog
        scene.fog = null;

        // Restore player visibility
        const env = window.EnvironmentMode?.instance;
        if (env?.player) env.player.visible = true;

        // Restore hidden effects
        for (const fx of hiddenEffects) fx.visible = true;

        // Bird
        if (bird) {
          scene.remove(bird);
          bird.traverse(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
              if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
              else c.material.dispose();
            }
          });
        }

        // WaterMesh
        disposeWaterMesh();

        // Terrain
        for (const [, ch] of terrainChunks) {
          ch.mesh.geometry.dispose();
          scene.remove(ch.mesh);
        }
        terrainChunks.clear();
        if (terrainMat) terrainMat.dispose();

        // Water
        for (const [, ch] of waterChunks) {
          ch.mesh.geometry.dispose();
          scene.remove(ch.mesh);
        }
        waterChunks.clear();
        waterMat.dispose();

        // Scenery
        for (const [, ch] of sceneryChunks) {
          for (const obj of ch.objects) {
            obj.traverse(c => { if (c.geometry) c.geometry.dispose(); });
            scene.remove(obj);
          }
        }
        sceneryChunks.clear();
        for (const m of Object.values(sceneryMats)) m.dispose();
        for (const g of Object.values(sceneryGeoms)) g.dispose();

        // Tuner
        if (window.SceneTuner) window.SceneTuner.offUpdate(tunerCallback);

        // Lights & fog
        scene.remove(sunLight);
        scene.remove(hemiLight);
        scene.remove(moonLight);
        scene.remove(moonLight.target);
        scene.fog = null;

        // Star dome + moon textures (not auto-disposed by material.dispose)
        clearTimeout(starRepaintTimer);
        starMapTexture.dispose();
        moonTexture.dispose();

        // Group (sky, stars, shooting stars)
        group.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
        scene.remove(group);
      }
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API - Scene builder registry
  // ═══════════════════════════════════════════════════════════════════════════
  return {
    builders: {
      "Terms & Conditions": (T, s, a) => buildFlightScene(T, s, a, "Terms & Conditions"),
      "Data Tide": (T, s, a) => buildFlightScene(T, s, a, "Data Tide"),
      "Soft Systems": (T, s, a) => buildFlightScene(T, s, a, "Soft Systems"),
      "Beast Mode": (T, s, a) => buildFlightScene(T, s, a, "Beast Mode"),
      "Dreams Bleed Into Dashboards": (T, s, a) => buildFlightScene(T, s, a, "Dreams Bleed Into Dashboards"),
      "Signal Integrity": (T, s, a) => buildFlightScene(T, s, a, "Signal Integrity"),
      "Gi Mi Di Reins": (T, s, a) => buildFlightScene(T, s, a, "Gi Mi Di Reins"),
      "Trade You My Hands": (T, s, a) => buildFlightScene(T, s, a, "Trade You My Hands"),
      "Push Harder": (T, s, a) => buildFlightScene(T, s, a, "Push Harder"),
      "The Last Dragon": (T, s, a) => buildFlightScene(T, s, a, "The Last Dragon"),
      "Who's Learning Who": (T, s, a) => buildFlightScene(T, s, a, "Who's Learning Who"),
      "Turn Your Phone Face Down": (T, s, a) => buildFlightScene(T, s, a, "Turn Your Phone Face Down"),
      "Test": (T, s, a) => buildFlightScene(T, s, a, "Test"),
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
