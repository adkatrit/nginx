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
      update(time, freq, amplitude, shipPos, shipSpeed, audioExtra) {
        const bassEnergy = freq ? (freq[0] + freq[1] + freq[2]) / 3 / 255 : 0;
        const midEnergy = freq ? (freq[10] + freq[20] + freq[30]) / 3 / 255 : 0;
        const highEnergy = freq ? (freq[60] + freq[80] + freq[100]) / 3 / 255 : 0;

        // Get drum pulse
        const drumPulse = audioExtra?.drumPulse || 0;
        lastDrumPulse = lastDrumPulse * 0.85 + drumPulse * 0.15;

        // Follow the ship's Z position so scene stays with racer
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

        // DRUM PULSE: Coral towers grow and glow on drum hits
        corals.forEach(coral => {
          const data = coral.userData;
          if (data.stem && data.tip) {
            // Scale coral taller on drum hits
            const drumScale = 1 + lastDrumPulse * 0.5;
            coral.scale.set(1 + lastDrumPulse * 0.2, drumScale, 1 + lastDrumPulse * 0.2);

            // Glow brighter on hits
            data.stemMat.emissiveIntensity = data.baseEmissive + lastDrumPulse * 0.6;
            data.tipMat.opacity = 0.6 + lastDrumPulse * 0.4;
          }
        });

        // Animate bioluminescent point lights
        bioLights.forEach((bl, i) => {
          bl.light.position.x = bl.basePos.x + Math.sin(time * bl.speed + bl.phase) * 3;
          bl.light.position.y = bl.basePos.y + Math.cos(time * bl.speed * 0.7 + bl.phase) * 2;
          bl.light.position.z = bl.basePos.z + Math.sin(time * bl.speed * 0.5 + bl.phase * 2) * 3;
          bl.light.intensity = 0.5 + midEnergy * 2 + Math.sin(time * 2 + bl.phase) * 0.3 + lastDrumPulse * 2;
        });

        // Pulse spotlights with bass and drums
        lights.forEach((l, i) => {
          l.light.intensity = 1 + bassEnergy * 4 + lastDrumPulse * 3;
          l.light.angle = Math.PI / 8 + Math.sin(time * 0.5 + l.phase) * 0.1;
        });

        // Animate particles with current flow
        const pos = particleGeom.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const v = velocities[i];
          const idx = i * 3;

          pos[idx] += v.x + Math.sin(time * 0.5 + v.phase) * 0.008;
          pos[idx + 1] += v.y + Math.cos(time * 0.3 + v.phase) * 0.004;
          pos[idx + 2] += v.z + Math.sin(time * 0.4 + v.phase) * 0.008;

          // More particle movement on drum hits
          if (bassEnergy > 0.5 || lastDrumPulse > 0.3) {
            const boost = Math.max(bassEnergy, lastDrumPulse);
            pos[idx] += (Math.random() - 0.5) * boost * 0.1;
            pos[idx + 1] += (Math.random() - 0.5) * boost * 0.1;
          }

          if (pos[idx] > 25) pos[idx] = -25;
          if (pos[idx] < -25) pos[idx] = 25;
          if (pos[idx + 1] > 12) pos[idx + 1] = -12;
          if (pos[idx + 1] < -12) pos[idx + 1] = 12;
          if (pos[idx + 2] > 25) pos[idx + 2] = -25;
          if (pos[idx + 2] < -25) pos[idx + 2] = 25;
        }
        particleGeom.attributes.position.needsUpdate = true;

        // Animate caustic rays
        currents.forEach((ray, i) => {
          ray.material.opacity = 0.01 + highEnergy * 0.04 + lastDrumPulse * 0.03;
          ray.scale.x = 1 + Math.sin(time * ray.userData.speed + ray.userData.phase) * 0.4 + lastDrumPulse * 0.3;
          ray.scale.z = ray.scale.x;
          ray.position.x += Math.sin(time * 0.2 + ray.userData.phase) * 0.02;
        });

        particleMat.opacity = 0.6 + bassEnergy * 0.4;
        particleMat.size = 0.15 + midEnergy * 0.15 + lastDrumPulse * 0.1;

        // Follow ship Z position with smooth oscillation overlay
        const zoomOscillation = Math.sin(time * 0.15) * 4 + Math.sin(time * 0.08) * 2;
        const audioZoom = bassEnergy * 1.5 + lastDrumPulse * 1;
        group.position.z = shipZ + zoomOscillation - audioZoom;

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
    scene.fog = new THREE.FogExp2(0x202030, 0.02);

    // Floating soft spheres (like bubbles/clouds)
    const spheres = [];
    const sphereCount = 30;
    for (let i = 0; i < sphereCount; i++) {
      const radius = 0.3 + Math.random() * 1.5;
      const geom = new THREE.SphereGeometry(radius, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.3 + Math.random() * 0.15, 0.3, 0.7),
        transparent: true,
        opacity: 0.15 + Math.random() * 0.15,
        roughness: 1,
        metalness: 0
      });
      const sphere = new THREE.Mesh(geom, mat);
      sphere.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 30
      );
      sphere.userData = {
        baseScale: sphere.scale.clone(),
        phase: Math.random() * Math.PI * 2,
        floatSpeed: 0.2 + Math.random() * 0.3,
        breathSpeed: 0.5 + Math.random() * 0.5
      };
      group.add(sphere);
      spheres.push(sphere);
    }

    // Gentle particle dust
    const dustCount = 1000;
    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i++) {
      dustPos[i] = (Math.random() - 0.5) * 50;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xaaffaa,
      size: 0.05,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    group.add(dust);

    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    group.add(ambientLight);

    const softLight = new THREE.PointLight(0x88ffaa, 1, 50);
    softLight.position.set(0, 5, 0);
    group.add(softLight);

    scene.add(group);

    return {
      group,
      update(time, freq, amplitude, shipPos, shipSpeed) {
        const bassEnergy = freq ? (freq[0] + freq[1]) / 2 / 255 : 0;
        const midEnergy = freq ? (freq[20] + freq[40]) / 2 / 255 : 0;
        const shipZ = shipPos ? shipPos.z : 0;

        // Gentle breathing spheres
        spheres.forEach(sphere => {
          const breathe = 1 + Math.sin(time * sphere.userData.breathSpeed + sphere.userData.phase) * 0.1;
          const audioBreath = 1 + midEnergy * 0.2;
          sphere.scale.setScalar(breathe * audioBreath);

          // Gentle floating
          sphere.position.y += Math.sin(time * sphere.userData.floatSpeed + sphere.userData.phase) * 0.003;
          sphere.position.x += Math.cos(time * sphere.userData.floatSpeed * 0.5) * 0.002;

          // Soft opacity pulse
          sphere.material.opacity = 0.1 + midEnergy * 0.15;
        });

        // Dust drift
        dust.rotation.y += 0.0002;
        dust.rotation.x += 0.0001;
        dustMat.opacity = 0.2 + bassEnergy * 0.2;

        // Light pulse
        softLight.intensity = 0.8 + midEnergy * 0.5;

        // Follow ship Z + gentle oscillating zoom
        const zoomOscillation = Math.sin(time * 0.1) * 3 + Math.sin(time * 0.05) * 1.5;
        group.position.z = shipZ + zoomOscillation;

        // Slight vertical and horizontal sway
        group.position.y = Math.sin(time * 0.08) * 0.8;
        group.position.x = Math.sin(time * 0.06) * 0.5;
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
  // DREAMS BLEED INTO DASHBOARDS - Glitched reality with HUD elements
  // ═══════════════════════════════════════════════════════════════════════════
  function buildDreamsDashboards(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Glitchy fog
    scene.fog = new THREE.Fog(0x100818, 2, 30);

    // HUD ring elements
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
      ring.userData = { baseZ: ring.position.z, rotSpeed: 0.01 * (i % 2 === 0 ? 1 : -1) };
      group.add(ring);
      rings.push(ring);
    }

    // Floating glitch cubes
    const cubes = [];
    for (let i = 0; i < 40; i++) {
      const size = 0.1 + Math.random() * 0.4;
      const geom = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
        transparent: true,
        opacity: 0.6,
        wireframe: Math.random() > 0.5
      });
      const cube = new THREE.Mesh(geom, mat);
      cube.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 20
      );
      cube.userData = {
        basePos: cube.position.clone(),
        glitchOffset: new THREE.Vector3(),
        glitchTimer: Math.random() * 100
      };
      group.add(cube);
      cubes.push(cube);
    }

    // Scan lines (horizontal bars)
    const scanLines = [];
    for (let i = 0; i < 10; i++) {
      const lineGeom = new THREE.PlaneGeometry(30, 0.02);
      const lineMat = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.position.set(0, -8 + i * 1.8, 2);
      line.userData = { speed: 0.05 + Math.random() * 0.1 };
      group.add(line);
      scanLines.push(line);
    }

    // Cyberpunk neon lighting rig
    // Main magenta spotlight
    const magentaSpot = new THREE.SpotLight(0xff00ff, 4, 40, Math.PI / 5, 0.5, 1);
    magentaSpot.position.set(8, 8, 8);
    magentaSpot.target.position.set(0, 0, 0);
    group.add(magentaSpot);
    group.add(magentaSpot.target);

    // Cyan counter light
    const cyanSpot = new THREE.SpotLight(0x00ffff, 4, 40, Math.PI / 5, 0.5, 1);
    cyanSpot.position.set(-8, 8, 8);
    cyanSpot.target.position.set(0, 0, 0);
    group.add(cyanSpot);
    group.add(cyanSpot.target);

    // Point lights for neon glow
    const neonLight1 = new THREE.PointLight(0xff00ff, 3, 25);
    neonLight1.position.set(5, 3, 5);
    group.add(neonLight1);

    const neonLight2 = new THREE.PointLight(0x00ffff, 3, 25);
    neonLight2.position.set(-5, -3, 5);
    group.add(neonLight2);

    // Additional accent lights
    const yellowAccent = new THREE.PointLight(0xffff00, 1, 15);
    yellowAccent.position.set(0, 5, -5);
    group.add(yellowAccent);

    // Glitch strobe light
    const strobeLight = new THREE.PointLight(0xffffff, 0, 30);
    strobeLight.position.set(0, 0, 5);
    group.add(strobeLight);

    scene.add(group);

    let glitchIntensity = 0;

    return {
      group,
      update(time, freq, amplitude, shipPos, shipSpeed) {
        const bassEnergy = freq ? (freq[0] + freq[2]) / 2 / 255 : 0;
        const highEnergy = freq ? (freq[60] + freq[80] + freq[100]) / 3 / 255 : 0;
        const midEnergy = freq ? (freq[20] + freq[40]) / 2 / 255 : 0;
        const shipZ = shipPos ? shipPos.z : 0;

        // Follow ship position
        group.position.z = shipZ;

        // Trigger glitch on bass hits
        if (bassEnergy > 0.7) {
          glitchIntensity = 1;
        }
        glitchIntensity *= 0.9;

        // Rotate HUD rings
        rings.forEach((ring, i) => {
          ring.rotation.z += ring.userData.rotSpeed * (1 + highEnergy * 2);
          ring.material.opacity = 0.25 + highEnergy * 0.5;

          if (glitchIntensity > 0.3 && Math.random() > 0.7) {
            ring.position.x = (Math.random() - 0.5) * glitchIntensity;
            ring.position.y = (Math.random() - 0.5) * glitchIntensity;
          } else {
            ring.position.x *= 0.85;
            ring.position.y *= 0.85;
          }
        });

        // Glitch cubes
        cubes.forEach(cube => {
          cube.rotation.x += 0.01 + highEnergy * 0.02;
          cube.rotation.y += 0.015 + highEnergy * 0.02;

          cube.userData.glitchTimer -= 1;
          if (cube.userData.glitchTimer <= 0 || glitchIntensity > 0.5) {
            if (Math.random() > 0.6) {
              cube.userData.glitchOffset.set(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
              );
              cube.material.color.setHSL(Math.random(), 1, 0.5);
            }
            cube.userData.glitchTimer = 15 + Math.random() * 60;
          }

          cube.position.copy(cube.userData.basePos).add(cube.userData.glitchOffset);
          cube.userData.glitchOffset.multiplyScalar(0.92);
        });

        // Animate scan lines
        scanLines.forEach(line => {
          line.position.y += line.userData.speed * (1 + bassEnergy);
          if (line.position.y > 10) line.position.y = -10;
          line.material.opacity = 0.15 + bassEnergy * 0.4;
        });

        // Dynamic neon lighting
        const magentaPulse = 1 + Math.sin(time * 3) * 0.3;
        const cyanPulse = 1 + Math.cos(time * 3) * 0.3;

        magentaSpot.intensity = 3 * magentaPulse + bassEnergy * 5;
        cyanSpot.intensity = 3 * cyanPulse + highEnergy * 5;

        neonLight1.intensity = 2 + bassEnergy * 4;
        neonLight2.intensity = 2 + highEnergy * 4;
        yellowAccent.intensity = 0.5 + midEnergy * 2;

        // Strobe on glitch
        strobeLight.intensity = glitchIntensity * 10;

        // Color cycling for extra trippy effect
        const hueShift = time * 0.1;
        neonLight1.color.setHSL((0.83 + hueShift) % 1, 1, 0.5);
        neonLight2.color.setHSL((0.5 + hueShift) % 1, 1, 0.5);
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
  // SIGNAL INTEGRITY - Clean technical oscilloscope and data streams
  // ═══════════════════════════════════════════════════════════════════════════
  function buildSignalIntegrity(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Clean dark background
    scene.fog = new THREE.Fog(0x000510, 10, 50);

    // 3D Oscilloscope waveform
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

    // Secondary waveform (frequency)
    const freqGeom = new THREE.BufferGeometry();
    const freqPositions = new Float32Array(128 * 3);
    for (let i = 0; i < 128; i++) {
      freqPositions[i * 3] = (i / 128 - 0.5) * 20;
      freqPositions[i * 3 + 1] = 0;
      freqPositions[i * 3 + 2] = -2;
    }
    freqGeom.setAttribute('position', new THREE.BufferAttribute(freqPositions, 3));
    const freqMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.7
    });
    const freqLine = new THREE.Line(freqGeom, freqMat);
    group.add(freqLine);

    // Grid floor
    const gridHelper = new THREE.GridHelper(40, 40, 0x004444, 0x002222);
    gridHelper.position.y = -5;
    group.add(gridHelper);

    // Data stream particles
    const streamCount = 500;
    const streamGeom = new THREE.BufferGeometry();
    const streamPos = new Float32Array(streamCount * 3);
    const streamVel = [];
    for (let i = 0; i < streamCount; i++) {
      streamPos[i * 3] = (Math.random() - 0.5) * 30;
      streamPos[i * 3 + 1] = Math.random() * 20 - 10;
      streamPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      streamVel.push(-0.05 - Math.random() * 0.1);
    }
    streamGeom.setAttribute('position', new THREE.BufferAttribute(streamPos, 3));
    const streamMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.08,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const streams = new THREE.Points(streamGeom, streamMat);
    group.add(streams);

    // Clean lighting
    const mainLight = new THREE.PointLight(0x00ffff, 1.5, 30);
    mainLight.position.set(0, 5, 10);
    group.add(mainLight);

    scene.add(group);

    return {
      group,
      update(time, freq, timeData, amplitude, shipPos, shipSpeed) {
        const shipZ = shipPos ? shipPos.z : 0;
        group.position.z = shipZ;

        // Update oscilloscope from time domain data
        const wavePos = waveGeom.attributes.position.array;
        if (timeData) {
          for (let i = 0; i < Math.min(wavePoints, timeData.length); i++) {
            wavePos[i * 3 + 1] = ((timeData[i] / 255) - 0.5) * 6;
          }
        }
        waveGeom.attributes.position.needsUpdate = true;

        // Update frequency display
        const freqPos = freqGeom.attributes.position.array;
        if (freq) {
          for (let i = 0; i < Math.min(128, freq.length); i++) {
            freqPos[i * 3 + 1] = (freq[i] / 255) * 5 - 5;
          }
        }
        freqGeom.attributes.position.needsUpdate = true;

        // Animate data streams (falling down like matrix)
        const sPos = streamGeom.attributes.position.array;
        for (let i = 0; i < streamCount; i++) {
          sPos[i * 3 + 1] += streamVel[i];
          if (sPos[i * 3 + 1] < -10) {
            sPos[i * 3 + 1] = 10;
            sPos[i * 3] = (Math.random() - 0.5) * 30;
            sPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
          }
        }
        streamGeom.attributes.position.needsUpdate = true;

        const energy = freq ? freq.reduce((a, b) => a + b, 0) / freq.length / 255 : 0;
        mainLight.intensity = 1 + energy * 2;
        waveMat.opacity = 0.6 + energy * 0.4;
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
      update(time, freq, amplitude, shipPos, shipSpeed) {
        const bassEnergy = freq ? (freq[0] + freq[1] + freq[2]) / 3 / 255 : 0;
        const energy = freq ? freq.reduce((a, b) => a + b, 0) / freq.length / 255 : 0;
        const shipZ = shipPos ? shipPos.z : 0;

        // Follow ship position
        group.position.z = shipZ;

        const speedMultiplier = 1 + bassEnergy * 3;

        // Rush speed lines toward camera
        speedLines.forEach(line => {
          line.position.z += line.userData.speed * speedMultiplier;
          if (line.position.z > 20) {
            line.position.z = line.userData.resetZ;
            line.position.x = (Math.random() - 0.5) * 30;
            line.position.y = (Math.random() - 0.5) * 20;
          }
          line.material.opacity = 0.3 + bassEnergy * 0.5;
        });

        // Animate particle trails
        const tPos = trailGeom.attributes.position.array;
        for (let i = 0; i < trailCount; i++) {
          const v = trailVel[i];
          tPos[i * 3] += v.x;
          tPos[i * 3 + 1] += v.y;
          tPos[i * 3 + 2] += v.z * speedMultiplier;

          if (tPos[i * 3 + 2] > 20) {
            tPos[i * 3] = (Math.random() - 0.5) * 5;
            tPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
            tPos[i * 3 + 2] = -50;
          }
        }
        trailGeom.attributes.position.needsUpdate = true;

        trailMat.opacity = 0.4 + energy * 0.6;
        goldLight.intensity = 1.5 + bassEnergy * 4;
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
  // TRADE YOU MY HANDS - Intimate, warm bamboo forest with snow
  // ═══════════════════════════════════════════════════════════════════════════
  function buildTradeHands(THREE, scene, audioData) {
    const group = new THREE.Group();  // For orbs/lights that follow ship
    scene.fog = new THREE.FogExp2(0x1a1010, 0.012);

    // CONTINUOUSLY GENERATED BAMBOO PILLARS
    const pillars = [];
    const pillarGroup = new THREE.Group();
    const PILLAR_SPACING = 6;        // Z spacing between pillars
    const PILLARS_AHEAD = 25;        // How many to keep ahead of ship
    const PILLARS_BEHIND = 8;        // How many to keep behind ship
    let nextSpawnZ = -50;            // Next Z position to spawn at
    let sideToggle = 0;              // Alternates left/right placement

    // Helper: Create a single pillar at given Z
    function spawnPillar(z) {
      const height = 15 + Math.random() * 25;
      const radius = 0.3 + Math.random() * 0.4;
      const geom = new THREE.CylinderGeometry(radius * 0.7, radius, height, 8);
      const hue = 0.08 + Math.random() * 0.06;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.4, 0.25 + Math.random() * 0.15),
        roughness: 0.8,
        metalness: 0.1,
        emissive: new THREE.Color().setHSL(hue, 0.6, 0.05),
        emissiveIntensity: 0.3
      });
      const pillar = new THREE.Mesh(geom, mat);

      const side = sideToggle % 2 === 0 ? -1 : 1;
      sideToggle++;
      const xOffset = 8 + Math.random() * 15;
      pillar.position.set(
        side * xOffset,
        height / 2 - 2,
        z + Math.random() * 4
      );
      pillar.rotation.z = (Math.random() - 0.5) * 0.1;
      pillar.userData = {
        baseScale: 1,
        baseHeight: height,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 0.5,
        spawnZ: z
      };
      pillarGroup.add(pillar);
      pillars.push(pillar);

      // Add glow orb at top of some pillars
      if (Math.random() > 0.6) {
        const glowGeom = new THREE.SphereGeometry(0.8 + Math.random() * 0.5, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.95 + Math.random() * 0.1, 0.7, 0.6),
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.set(pillar.position.x, height - 1, z + Math.random() * 4);
        glow.userData = { baseY: height - 1, phase: Math.random() * Math.PI * 2, isGlow: true, spawnZ: z };
        pillarGroup.add(glow);
        pillars.push(glow);
      }
    }

    // Initial spawn
    for (let z = -50; z < 150; z += PILLAR_SPACING) {
      spawnPillar(z);
      nextSpawnZ = z + PILLAR_SPACING;
    }
    scene.add(pillarGroup);

    // Snow particles - WORLD SPACE (not in group)
    const particleCount = 1200;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      const hue = 0.95 + Math.random() * 0.1;
      const color = new THREE.Color().setHSL(hue % 1, 0.4, 0.75);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
      fog: false
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Orbs follow ship
    const orbs = [];
    for (let i = 0; i < 10; i++) {
      const geom = new THREE.SphereGeometry(0.5 + Math.random(), 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.95 + Math.random() * 0.1, 0.5, 0.6),
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
      });
      const orb = new THREE.Mesh(geom, mat);
      orb.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 15);
      orb.userData = { phase: Math.random() * Math.PI * 2 };
      group.add(orb);
      orbs.push(orb);
    }

    const warmLight = new THREE.PointLight(0xffaa88, 2, 35);
    warmLight.position.set(0, 5, 0);
    group.add(warmLight);

    const pinkLight = new THREE.PointLight(0xffbbcc, 1.5, 30);
    pinkLight.position.set(-8, 0, -5);
    group.add(pinkLight);

    scene.add(group);
    let initialized = false;
    let lastDrumPulse = 0;

    return {
      group,
      update(time, freq, amplitude, shipPos, shipSpeed, audioExtra) {
        const midEnergy = freq ? (freq[20] + freq[40] + freq[60]) / 3 / 255 : 0;
        const shipZ = shipPos ? shipPos.z : 0;

        // Get drum pulse from audio extra data
        const drumPulse = audioExtra?.drumPulse || 0;

        // DRUM PULSE EFFECT: Scale pillars dramatically on drum hits
        const pulseDecay = 0.15;  // How fast the pulse decays
        lastDrumPulse = lastDrumPulse * (1 - pulseDecay) + drumPulse * pulseDecay;
        const bigPulse = lastDrumPulse > 0.3;  // Strong hit threshold

        // CONTINUOUS GENERATION: Spawn new pillars ahead, remove behind
        const spawnAheadZ = shipZ + PILLARS_AHEAD * PILLAR_SPACING;
        const cleanupBehindZ = shipZ - PILLARS_BEHIND * PILLAR_SPACING;

        // Spawn new pillars ahead
        while (nextSpawnZ < spawnAheadZ) {
          spawnPillar(nextSpawnZ);
          nextSpawnZ += PILLAR_SPACING;
        }

        // Remove pillars that are too far behind
        for (let i = pillars.length - 1; i >= 0; i--) {
          const p = pillars[i];
          if (p.userData.spawnZ < cleanupBehindZ) {
            pillarGroup.remove(p);
            if (p.geometry) p.geometry.dispose();
            if (p.material) p.material.dispose();
            pillars.splice(i, 1);
          }
        }

        // Animate pillars with drum pulse
        pillars.forEach((pillar, i) => {
          if (pillar.userData.baseHeight) {
            // Bamboo pillars: scale Y (grow taller) on drum hits
            const breathe = 1 + Math.sin(time * pillar.userData.pulseSpeed + pillar.userData.phase) * 0.05;
            const drumScale = 1 + lastDrumPulse * 0.4;  // Up to 40% taller on hits
            pillar.scale.set(
              breathe + lastDrumPulse * 0.2,  // Slightly wider
              drumScale,  // Taller
              breathe + lastDrumPulse * 0.2
            );
            // Flash emissive on strong hits
            if (pillar.material.emissive) {
              pillar.material.emissiveIntensity = 0.3 + lastDrumPulse * 1.5;
            }
          } else if (pillar.userData.isGlow) {
            // Glow orbs: pulse opacity and scale
            const glowPulse = 1 + lastDrumPulse * 0.8;
            pillar.scale.setScalar(glowPulse);
            pillar.material.opacity = 0.4 + lastDrumPulse * 0.6;
          }
        });

        // Orbs/lights follow ship
        group.position.z = shipZ;

        const pos = particleGeom.attributes.position.array;

        // On first update, spread particles around current ship position
        if (!initialized && shipPos) {
          for (let i = 0; i < particleCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 1] = Math.random() * 15 - 3;
            pos[i * 3 + 2] = shipZ - 10 + Math.random() * 100;
          }
          initialized = true;
          particleGeom.attributes.position.needsUpdate = true;
          return;
        }

        // Particles in world space - respawn relative to ship position
        for (let i = 0; i < particleCount; i++) {
          const pz = pos[i * 3 + 2];
          if (pz < shipZ - 15) {
            pos[i * 3] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 1] = Math.random() * 15 - 3;
            pos[i * 3 + 2] = shipZ + 40 + Math.random() * 60;
          } else if (pz > shipZ + 100) {
            pos[i * 3] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 1] = Math.random() * 15 - 3;
            pos[i * 3 + 2] = shipZ - 10 + Math.random() * 30;
          }
          pos[i * 3 + 1] -= 0.03;
          if (pos[i * 3 + 1] < -10) {
            pos[i * 3 + 1] = 12 + Math.random() * 3;
          }
        }
        particleGeom.attributes.position.needsUpdate = true;

        orbs.forEach(orb => {
          const breathe = 1 + Math.sin(time * 0.5 + orb.userData.phase) * 0.15;
          const orbPulse = 1 + lastDrumPulse * 0.5;  // Orbs also pulse with drums
          orb.scale.setScalar(breathe * orbPulse);
          orb.material.opacity = 0.1 + midEnergy * 0.08 + lastDrumPulse * 0.2;
        });

        warmLight.intensity = 1.5 + midEnergy + lastDrumPulse * 2;  // Flash on drums
        pinkLight.intensity = 1 + Math.sin(time * 0.3) * 0.4 + lastDrumPulse * 1.5;
        particleMat.opacity = 0.6 + midEnergy * 0.2;
      },
      dispose() {
        scene.remove(particles);
        particleGeom.dispose();
        particleMat.dispose();
        scene.remove(pillarGroup);
        pillarGroup.traverse(child => {
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
      update(time, freq, amplitude, shipPos, shipSpeed, audioExtra) {
        const shipZ = shipPos ? shipPos.z : 0;
        const bassEnergy = freq ? (freq[0] + freq[1] + freq[2]) / 3 / 255 : 0;
        const midEnergy = freq ? (freq[20] + freq[40]) / 2 / 255 : 0;
        const highEnergy = freq ? (freq[80] + freq[100]) / 2 / 255 : 0;

        const drumPulse = audioExtra?.drumPulse || 0;
        lastDrumPulse = lastDrumPulse * 0.85 + drumPulse * 0.15;

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

        // Animate towers on drum hits
        towers.forEach(tower => {
          const data = tower.userData;
          if (data.bodyMat) {
            // Flash emissive on drums
            data.bodyMat.emissiveIntensity = 0.05 + lastDrumPulse * 0.3;
            // Beacon pulses
            if (data.beaconMat) {
              data.beaconMat.opacity = 0.5 + lastDrumPulse * 0.5 + Math.sin(time * 2) * 0.2;
              data.beacon.scale.setScalar(1 + lastDrumPulse * 0.8);
            }
          }
        });

        // Animate floating panels
        panels.forEach(panel => {
          const data = panel.userData;
          // Float up and down
          panel.position.y = data.baseY + Math.sin(time * data.floatSpeed + data.floatPhase) * 0.8;
          // Pulse opacity with vocals/mids
          panel.material.opacity = 0.1 + midEnergy * 0.15 + lastDrumPulse * 0.1;
          // Scale on drum hits
          panel.scale.setScalar(1 + lastDrumPulse * 0.2);
        });

        // Animate data rain
        const rPos = rainGeom.attributes.position.array;
        if (!initialized && shipPos) {
          for (let i = 0; i < rainCount; i++) {
            rPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
          }
          initialized = true;
        }

        for (let i = 0; i < rainCount; i++) {
          rPos[i * 3 + 1] -= rainVel[i] * (1 + bassEnergy * 2 + lastDrumPulse);
          if (rPos[i * 3 + 1] < -5) {
            rPos[i * 3 + 1] = 35 + Math.random() * 5;
            rPos[i * 3] = (Math.random() - 0.5) * 80;
            rPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
          }
          // Keep rain in range of ship
          if (rPos[i * 3 + 2] < shipZ - 45 || rPos[i * 3 + 2] > shipZ + 45) {
            rPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
          }
        }
        rainGeom.attributes.position.needsUpdate = true;
        rainMat.opacity = 0.4 + highEnergy * 0.4 + lastDrumPulse * 0.2;

        // Animate notification particles
        const nPos = notifGeom.attributes.position.array;
        for (let i = 0; i < notifCount; i++) {
          const d = notifData[i];
          nPos[i * 3] += Math.sin(time * d.speed + d.phase) * 0.02;
          nPos[i * 3 + 1] += Math.cos(time * d.speed * 0.7 + d.phase) * 0.015;
        }
        notifGeom.attributes.position.needsUpdate = true;
        notifMat.opacity = 0.5 + lastDrumPulse * 0.5;
        notifMat.size = 0.3 + lastDrumPulse * 0.3;

        // Move floor with ship
        floor.position.z = shipZ;

        // Lights follow ship
        group.position.z = shipZ;

        // Light intensity on drums
        blueLight.intensity = 2 + lastDrumPulse * 3 + bassEnergy * 2;
        cyanLight.intensity = 1.5 + midEnergy * 2;
        pinkAccent.intensity = 1 + lastDrumPulse * 2;
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
  function buildPhoneFaceDown(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Warm, intimate fog - golden hour feel
    scene.fog = new THREE.FogExp2(0x1a0f08, 0.012);

    // TALL LAMP POSTS / STREET LIGHTS (cozy evening atmosphere)
    const lamps = [];
    const lampGroup = new THREE.Group();
    const LAMP_SPACING = 10;
    const LAMPS_AHEAD = 20;
    const LAMPS_BEHIND = 6;
    let nextLampZ = -50;
    let lampSideToggle = 0;

    function spawnLamp(z) {
      const lampPiece = new THREE.Group();
      const height = 18 + Math.random() * 12;  // 18-30 units tall

      // Lamp post (thin pole)
      const poleGeom = new THREE.CylinderGeometry(0.15, 0.2, height, 8);
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0x2a2015,
        roughness: 0.7,
        metalness: 0.4,
        emissive: 0x1a0a00,
        emissiveIntensity: 0.1
      });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.y = height / 2;
      lampPiece.add(pole);

      // Lamp head (glowing orb at top)
      const lampGeom = new THREE.SphereGeometry(0.8 + Math.random() * 0.4, 12, 12);
      const hue = 0.08 + Math.random() * 0.04;  // Warm orange
      const lampMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.9, 0.65),
        transparent: true,
        opacity: 0.9
      });
      const lamp = new THREE.Mesh(lampGeom, lampMat);
      lamp.position.y = height + 0.5;
      lampPiece.add(lamp);

      // Glow effect around lamp
      const glowGeom = new THREE.SphereGeometry(2, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.7, 0.5),
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Mesh(glowGeom, glowMat);
      glow.position.y = height + 0.5;
      lampPiece.add(glow);

      // Point light from lamp
      const light = new THREE.PointLight(
        new THREE.Color().setHSL(hue, 0.8, 0.5),
        1.5,
        20
      );
      light.position.y = height + 0.5;
      lampPiece.add(light);

      // Position
      const side = lampSideToggle % 2 === 0 ? -1 : 1;
      lampSideToggle++;
      const xOffset = 10 + Math.random() * 8;
      lampPiece.position.set(side * xOffset, 0, z + Math.random() * 4);

      lampPiece.userData = {
        spawnZ: z,
        height: height,
        lampMat: lampMat,
        glowMat: glowMat,
        light: light,
        phase: Math.random() * Math.PI * 2
      };

      lampGroup.add(lampPiece);
      lamps.push(lampPiece);
    }

    for (let z = -50; z < 150; z += LAMP_SPACING) {
      spawnLamp(z);
      nextLampZ = z + LAMP_SPACING;
    }
    scene.add(lampGroup);

    // FALLING PHONES that flip face-down as they descend
    const phones = [];
    const phoneGroup = new THREE.Group();
    const PHONE_SPACING = 12;
    const PHONES_AHEAD = 15;
    const PHONES_BEHIND = 5;
    let nextPhoneZ = -30;

    function spawnPhone(z) {
      const phoneWidth = 1.2 + Math.random() * 0.6;
      const phoneHeight = phoneWidth * 2;

      const phoneObj = new THREE.Group();

      // Phone body (box)
      const bodyGeom = new THREE.BoxGeometry(phoneWidth, phoneHeight, 0.1);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.8
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      phoneObj.add(body);

      // Phone screen (front face)
      const screenGeom = new THREE.PlaneGeometry(phoneWidth * 0.9, phoneHeight * 0.9);
      const screenMat = new THREE.MeshBasicMaterial({
        color: 0x3388ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const screen = new THREE.Mesh(screenGeom, screenMat);
      screen.position.z = 0.06;
      phoneObj.add(screen);

      // Notification dots on screen
      for (let n = 0; n < 3; n++) {
        const notifGeom = new THREE.CircleGeometry(0.08, 8);
        const notifMat = new THREE.MeshBasicMaterial({
          color: n === 0 ? 0xff4444 : (n === 1 ? 0x44ff44 : 0xffaa00),
          transparent: true,
          opacity: 0.9
        });
        const notif = new THREE.Mesh(notifGeom, notifMat);
        notif.position.set(
          (Math.random() - 0.5) * phoneWidth * 0.6,
          (Math.random() - 0.5) * phoneHeight * 0.6,
          0.07
        );
        phoneObj.add(notif);
      }

      // Start high, facing up (screen visible)
      phoneObj.position.set(
        (Math.random() - 0.5) * 30,
        20 + Math.random() * 25,
        z + Math.random() * 8
      );
      phoneObj.rotation.x = 0;  // Screen facing up initially
      phoneObj.rotation.y = Math.random() * 0.3;

      phoneObj.userData = {
        spawnZ: z,
        fallSpeed: 0.015 + Math.random() * 0.02,
        flipProgress: 0,
        flipSpeed: 0.008 + Math.random() * 0.005,
        startY: phoneObj.position.y,
        screenMat: screenMat,
        sway: Math.random() * Math.PI * 2
      };

      phoneGroup.add(phoneObj);
      phones.push(phoneObj);
    }

    for (let z = -30; z < 120; z += PHONE_SPACING) {
      spawnPhone(z);
      if (Math.random() > 0.5) spawnPhone(z + PHONE_SPACING / 2);
      nextPhoneZ = z + PHONE_SPACING;
    }
    scene.add(phoneGroup);

    // WARM GLOWING ORBS (human presence - larger and more prominent)
    const orbs = [];
    const orbGroup = new THREE.Group();
    const ORB_SPACING = 14;
    const ORBS_AHEAD = 12;
    const ORBS_BEHIND = 4;
    let nextOrbZ = -20;

    function spawnOrb(z) {
      const orbSize = 2.5 + Math.random() * 2.5;
      const orbGeom = new THREE.SphereGeometry(orbSize, 20, 20);
      const hue = 0.06 + Math.random() * 0.06;
      const orbMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.85, 0.6),
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
      });
      const orb = new THREE.Mesh(orbGeom, orbMat);

      // Inner core (brighter)
      const coreGeom = new THREE.SphereGeometry(orbSize * 0.4, 12, 12);
      const coreMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.9, 0.75),
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const core = new THREE.Mesh(coreGeom, coreMat);
      orb.add(core);

      orb.position.set(
        (Math.random() - 0.5) * 20,
        3 + Math.random() * 10,
        z + Math.random() * 10
      );

      orb.userData = {
        spawnZ: z,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.3 + Math.random() * 0.3,
        baseY: orb.position.y,
        orbMat: orbMat,
        coreMat: coreMat,
        size: orbSize
      };

      // Point light for each orb
      const light = new THREE.PointLight(
        new THREE.Color().setHSL(hue, 0.7, 0.55),
        1.2,
        15
      );
      light.position.copy(orb.position);
      orb.userData.light = light;
      orbGroup.add(light);

      orbGroup.add(orb);
      orbs.push(orb);
    }

    for (let z = -20; z < 140; z += ORB_SPACING) {
      spawnOrb(z);
      nextOrbZ = z + ORB_SPACING;
    }
    scene.add(orbGroup);

    // FIREFLY PARTICLES (warm floating specks)
    const fireflyCount = 1200;
    const fireflyGeom = new THREE.BufferGeometry();
    const fireflyPos = new Float32Array(fireflyCount * 3);
    const fireflyData = [];

    for (let i = 0; i < fireflyCount; i++) {
      fireflyPos[i * 3] = (Math.random() - 0.5) * 60;
      fireflyPos[i * 3 + 1] = Math.random() * 20;
      fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      fireflyData.push({
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.5,
        blinkPhase: Math.random() * Math.PI * 2
      });
    }
    fireflyGeom.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));

    const fireflyMat = new THREE.PointsMaterial({
      color: 0xffcc66,
      size: 0.25,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const fireflies = new THREE.Points(fireflyGeom, fireflyMat);
    group.add(fireflies);

    // Warm ambient lighting
    const candleLight1 = new THREE.PointLight(0xffaa66, 3, 40);
    candleLight1.position.set(0, 5, 0);
    group.add(candleLight1);

    const candleLight2 = new THREE.PointLight(0xff8844, 2, 30);
    candleLight2.position.set(-10, 4, 5);
    group.add(candleLight2);

    const candleLight3 = new THREE.PointLight(0xffcc88, 2, 30);
    candleLight3.position.set(10, 4, -5);
    group.add(candleLight3);

    const ambient = new THREE.HemisphereLight(0xffaa66, 0x1a0800, 0.4);
    group.add(ambient);

    scene.add(group);

    let lastDrumPulse = 0;
    let initialized = false;

    return {
      group,
      update(time, freq, amplitude, shipPos, shipSpeed, audioExtra) {
        const shipZ = shipPos ? shipPos.z : 0;
        const bassEnergy = freq ? (freq[0] + freq[1] + freq[2]) / 3 / 255 : 0;
        const midEnergy = freq ? (freq[20] + freq[40]) / 2 / 255 : 0;
        const vocalEnergy = freq ? (freq[40] + freq[60] + freq[80]) / 3 / 255 : 0;

        const drumPulse = audioExtra?.drumPulse || 0;
        lastDrumPulse = lastDrumPulse * 0.85 + drumPulse * 0.15;

        // CONTINUOUS GENERATION: Lamps
        const lampSpawnZ = shipZ + LAMPS_AHEAD * LAMP_SPACING;
        const lampCleanZ = shipZ - LAMPS_BEHIND * LAMP_SPACING;

        while (nextLampZ < lampSpawnZ) {
          spawnLamp(nextLampZ);
          nextLampZ += LAMP_SPACING;
        }

        for (let i = lamps.length - 1; i >= 0; i--) {
          if (lamps[i].userData.spawnZ < lampCleanZ) {
            const l = lamps[i];
            lampGroup.remove(l);
            l.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            lamps.splice(i, 1);
          }
        }

        // Animate lamps - flicker and pulse with music
        lamps.forEach(lamp => {
          const data = lamp.userData;
          const flicker = 0.9 + Math.sin(time * 8 + data.phase) * 0.1;
          const vocalBoost = 1 + vocalEnergy * 0.5 + lastDrumPulse * 0.4;

          data.lampMat.opacity = 0.8 * flicker * vocalBoost;
          data.glowMat.opacity = 0.12 + vocalEnergy * 0.1 + lastDrumPulse * 0.15;
          data.light.intensity = 1.2 * flicker * vocalBoost + lastDrumPulse;
        });

        // CONTINUOUS GENERATION: Phones
        const phoneSpawnZ = shipZ + PHONES_AHEAD * PHONE_SPACING;
        const phoneCleanZ = shipZ - PHONES_BEHIND * PHONE_SPACING;

        while (nextPhoneZ < phoneSpawnZ) {
          spawnPhone(nextPhoneZ);
          if (Math.random() > 0.5) spawnPhone(nextPhoneZ + PHONE_SPACING / 2);
          nextPhoneZ += PHONE_SPACING;
        }

        for (let i = phones.length - 1; i >= 0; i--) {
          if (phones[i].userData.spawnZ < phoneCleanZ) {
            const p = phones[i];
            phoneGroup.remove(p);
            p.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            phones.splice(i, 1);
          }
        }

        // CONTINUOUS GENERATION: Orbs
        const orbSpawnZ = shipZ + ORBS_AHEAD * ORB_SPACING;
        const orbCleanZ = shipZ - ORBS_BEHIND * ORB_SPACING;

        while (nextOrbZ < orbSpawnZ) {
          spawnOrb(nextOrbZ);
          nextOrbZ += ORB_SPACING;
        }

        for (let i = orbs.length - 1; i >= 0; i--) {
          if (orbs[i].userData.spawnZ < orbCleanZ) {
            const o = orbs[i];
            if (o.userData.light) orbGroup.remove(o.userData.light);
            orbGroup.remove(o);
            o.traverse(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            });
            orbs.splice(i, 1);
          }
        }

        // Animate phones - fall and FLIP face down
        phones.forEach(phone => {
          const data = phone.userData;

          // Fall
          phone.position.y -= data.fallSpeed * (1 + lastDrumPulse * 0.5);

          // Gentle sway
          phone.position.x += Math.sin(time * 0.5 + data.sway) * 0.01;

          // FLIP face down as it falls (rotate around X axis from 0 to PI)
          if (data.flipProgress < Math.PI) {
            data.flipProgress += data.flipSpeed * (1 + lastDrumPulse);
            phone.rotation.x = data.flipProgress;
          }

          // Dim screen as it flips past 90 degrees
          const faceDownProgress = Math.max(0, (data.flipProgress - Math.PI / 2) / (Math.PI / 2));
          data.screenMat.opacity = 0.8 * (1 - faceDownProgress * 0.9);

          // Reset when fallen
          if (phone.position.y < -8) {
            phone.position.y = 25 + Math.random() * 20;
            phone.position.x = (Math.random() - 0.5) * 30;
            phone.position.z = shipZ + 30 + Math.random() * 50;
            phone.rotation.x = 0;
            data.flipProgress = 0;
            data.screenMat.opacity = 0.8;
            data.startY = phone.position.y;
          }
        });

        // Animate warm orbs (pulse dramatically with vocals - human connection)
        orbs.forEach(orb => {
          const data = orb.userData;
          const breathe = 1 + Math.sin(time * data.pulseSpeed + data.phase) * 0.25;
          const vocalPulse = 1 + vocalEnergy * 0.8 + lastDrumPulse * 0.5;

          orb.scale.setScalar(breathe * vocalPulse);
          data.orbMat.opacity = 0.15 + vocalEnergy * 0.25 + lastDrumPulse * 0.2;
          if (data.coreMat) {
            data.coreMat.opacity = 0.4 + vocalEnergy * 0.4 + lastDrumPulse * 0.3;
          }

          // Float gently
          orb.position.y = data.baseY + Math.sin(time * 0.4 + data.phase) * 1;

          // Update attached light - brighter on vocals
          if (data.light) {
            data.light.intensity = 0.8 + vocalEnergy * 2 + lastDrumPulse * 1.2;
            data.light.position.copy(orb.position);
          }
        });

        // Animate fireflies
        const fPos = fireflyGeom.attributes.position.array;
        if (!initialized && shipPos) {
          for (let i = 0; i < fireflyCount; i++) {
            fPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
          }
          initialized = true;
        }

        for (let i = 0; i < fireflyCount; i++) {
          const d = fireflyData[i];
          fPos[i * 3] += Math.sin(time * d.speed + d.phase) * 0.025;
          fPos[i * 3 + 1] += Math.cos(time * d.speed * 0.7 + d.phase) * 0.015;

          // Keep near ship
          if (fPos[i * 3 + 2] < shipZ - 45 || fPos[i * 3 + 2] > shipZ + 45) {
            fPos[i * 3 + 2] = shipZ - 40 + Math.random() * 80;
            fPos[i * 3] = (Math.random() - 0.5) * 60;
          }
        }
        fireflyGeom.attributes.position.needsUpdate = true;

        // Firefly intensity with audio
        fireflyMat.opacity = 0.6 + midEnergy * 0.3 + lastDrumPulse * 0.2;
        fireflyMat.size = 0.2 + lastDrumPulse * 0.2 + vocalEnergy * 0.1;

        // Candle lights flicker warmly
        const flicker = Math.sin(time * 10) * 0.15 + Math.sin(time * 17) * 0.08;
        candleLight1.intensity = 2.5 + flicker + vocalEnergy * 2 + lastDrumPulse * 1.5;
        candleLight2.intensity = 1.5 + flicker * 0.8 + midEnergy * 1.5;
        candleLight3.intensity = 1.5 + flicker * 0.6 + bassEnergy;

        // Group follows ship
        group.position.z = shipZ;
      },
      dispose() {
        scene.remove(lampGroup);
        lampGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(phoneGroup);
        phoneGroup.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        scene.remove(orbGroup);
        orbGroup.traverse(child => {
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
