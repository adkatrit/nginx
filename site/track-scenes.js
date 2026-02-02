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
  // DATA TIDE - Underwater bioluminescent data ocean
  // ═══════════════════════════════════════════════════════════════════════════
  function buildDataTide(THREE, scene, audioData) {
    const group = new THREE.Group();
    const particles = [];
    const currents = [];
    const lights = [];

    // Deep ocean fog - darker, more mysterious
    scene.fog = new THREE.FogExp2(0x000810, 0.018);

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
      update(time, freq, amplitude, shipPos, shipSpeed) {
        const bassEnergy = freq ? (freq[0] + freq[1] + freq[2]) / 3 / 255 : 0;
        const midEnergy = freq ? (freq[10] + freq[20] + freq[30]) / 3 / 255 : 0;
        const highEnergy = freq ? (freq[60] + freq[80] + freq[100]) / 3 / 255 : 0;

        // Follow the ship's Z position so scene stays with racer
        const shipZ = shipPos ? shipPos.z : 0;

        // Animate bioluminescent point lights
        bioLights.forEach((bl, i) => {
          bl.light.position.x = bl.basePos.x + Math.sin(time * bl.speed + bl.phase) * 3;
          bl.light.position.y = bl.basePos.y + Math.cos(time * bl.speed * 0.7 + bl.phase) * 2;
          bl.light.position.z = bl.basePos.z + Math.sin(time * bl.speed * 0.5 + bl.phase * 2) * 3;
          bl.light.intensity = 0.5 + midEnergy * 2 + Math.sin(time * 2 + bl.phase) * 0.3;
        });

        // Pulse spotlights with bass
        lights.forEach((l, i) => {
          l.light.intensity = 1 + bassEnergy * 4;
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

          if (bassEnergy > 0.5) {
            pos[idx] += (Math.random() - 0.5) * bassEnergy * 0.08;
            pos[idx + 1] += (Math.random() - 0.5) * bassEnergy * 0.08;
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
          ray.material.opacity = 0.01 + highEnergy * 0.04;
          ray.scale.x = 1 + Math.sin(time * ray.userData.speed + ray.userData.phase) * 0.4;
          ray.scale.z = ray.scale.x;
          ray.position.x += Math.sin(time * 0.2 + ray.userData.phase) * 0.02;
        });

        particleMat.opacity = 0.6 + bassEnergy * 0.4;
        particleMat.size = 0.15 + midEnergy * 0.15;

        // Follow ship Z position with smooth oscillation overlay
        const zoomOscillation = Math.sin(time * 0.15) * 4 + Math.sin(time * 0.08) * 2;
        const audioZoom = bassEnergy * 1.5;
        group.position.z = shipZ + zoomOscillation - audioZoom;

        // Gentle vertical drift
        group.position.y = Math.sin(time * 0.1) * 0.5;
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
  // TRADE YOU MY HANDS - Intimate, warm, soft focus
  // ═══════════════════════════════════════════════════════════════════════════
  function buildTradeHands(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Warm intimate fog
    scene.fog = new THREE.FogExp2(0x1a1010, 0.03);

    // Floating warm particles (like fireflies or dust in light)
    const particleCount = 800;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;

      // Warm colors: pink, peach, soft orange
      const hue = 0.95 + Math.random() * 0.1; // wrap around red/pink
      const color = new THREE.Color().setHSL(hue % 1, 0.5, 0.6 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    group.add(particles);

    // Soft glowing orbs (bokeh-like)
    const orbs = [];
    for (let i = 0; i < 15; i++) {
      const radius = 0.5 + Math.random() * 1;
      const geom = new THREE.SphereGeometry(radius, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.95 + Math.random() * 0.1, 0.6, 0.6),
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
      });
      const orb = new THREE.Mesh(geom, mat);
      orb.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 15
      );
      orb.userData = { phase: Math.random() * Math.PI * 2 };
      group.add(orb);
      orbs.push(orb);
    }

    // Warm lights
    const warmLight = new THREE.PointLight(0xffaa88, 1.5, 25);
    warmLight.position.set(0, 3, 5);
    group.add(warmLight);

    const pinkLight = new THREE.PointLight(0xffbbcc, 1, 20);
    pinkLight.position.set(-5, 0, 0);
    group.add(pinkLight);

    scene.add(group);

    return {
      group,
      update(time, freq, amplitude, shipPos, shipSpeed) {
        const midEnergy = freq ? (freq[20] + freq[40] + freq[60]) / 3 / 255 : 0;
        const shipZ = shipPos ? shipPos.z : 0;

        // Follow ship position
        group.position.z = shipZ;

        // Gentle particle drift
        const pos = particleGeom.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          pos[i * 3] += Math.sin(time * 0.2 + i) * 0.002;
          pos[i * 3 + 1] += Math.cos(time * 0.15 + i * 0.5) * 0.002;
        }
        particleGeom.attributes.position.needsUpdate = true;

        // Breathe orbs
        orbs.forEach(orb => {
          const breathe = 1 + Math.sin(time * 0.5 + orb.userData.phase) * 0.2;
          orb.scale.setScalar(breathe * (1 + midEnergy * 0.3));
          orb.material.opacity = 0.08 + midEnergy * 0.1;
        });

        // Pulse lights gently
        warmLight.intensity = 1.2 + midEnergy * 0.8;
        pinkLight.intensity = 0.8 + Math.sin(time * 0.3) * 0.3;

        particleMat.opacity = 0.4 + midEnergy * 0.3;
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
  // THE LAST DRAGON - Epic fire realm with embers and smoke
  // ═══════════════════════════════════════════════════════════════════════════
  function buildLastDragon(THREE, scene, audioData) {
    const group = new THREE.Group();

    // Fiery atmosphere
    scene.fog = new THREE.FogExp2(0x1a0800, 0.02);

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
      update(time, freq, amplitude, shipPos, shipSpeed) {
        const shipZ = shipPos ? shipPos.z : 0;
        const bassEnergy = freq ? (freq[0] + freq[1] + freq[2]) / 3 / 255 : 0;
        const midEnergy = freq ? (freq[20] + freq[40]) / 2 / 255 : 0;
        const energy = freq ? freq.reduce((a, b) => a + b, 0) / freq.length / 255 : 0;

        // Rise embers with more intensity
        const ePos = emberGeom.attributes.position.array;
        for (let i = 0; i < emberCount; i++) {
          const v = emberVel[i];
          ePos[i * 3] += v.x + (Math.random() - 0.5) * 0.025;
          ePos[i * 3 + 1] += v.y * (1 + bassEnergy * 3);
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
          smoke.scale.setScalar(1 + Math.sin(time + smoke.userData.phase) * 0.3 + bassEnergy * 0.5);
          smoke.material.opacity = 0.1 + energy * 0.1;

          if (smoke.position.y > 18) {
            smoke.position.y = -5;
            smoke.position.x = (Math.random() - 0.5) * 30;
          }
        });

        // Dramatic flickering fire lights
        const flicker1 = Math.random() * 0.8;
        const flicker2 = Math.random() * 0.6;
        fireLight1.intensity = 3 + bassEnergy * 6 + flicker1;
        fireLight2.intensity = 2 + midEnergy * 5 + flicker2;
        fireLight3.intensity = 2 + midEnergy * 5 + flicker2;

        // Color shift based on intensity
        const hue = 0.05 + bassEnergy * 0.03;
        fireLight1.color.setHSL(hue, 1, 0.5);
        fireLight2.color.setHSL(hue + 0.02, 1, 0.5);

        // Rim light pulses with music
        rimLight.intensity = 1 + energy * 2;

        // Ember lights flicker
        emberLights.forEach((el, i) => {
          el.light.intensity = 0.3 + Math.sin(time * 8 + el.phase) * 0.3 + bassEnergy * 1.5;
        });

        emberMat.opacity = 0.7 + bassEnergy * 0.3;
        emberMat.size = 0.1 + bassEnergy * 0.08;

        // Epic zoom oscillation - dramatic sweeping movement
        const zoomOscillation = Math.sin(time * 0.12) * 5 + Math.sin(time * 0.07) * 2.5;
        const bassZoom = bassEnergy * 2; // Push in on heavy hits
        group.position.z = shipZ + zoomOscillation - bassZoom;

        // Slight tilt for epic feel
        group.rotation.x = Math.sin(time * 0.08) * 0.03;
        group.rotation.y = Math.sin(time * 0.06) * 0.02;
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
  // WHO'S LEARNING WHO - Neural network, data nodes, scanning
  // ═══════════════════════════════════════════════════════════════════════════
  function buildWhosLearning(THREE, scene, audioData) {
    const group = new THREE.Group();

    scene.fog = new THREE.Fog(0x001000, 5, 50);

    // Neural network nodes
    const nodes = [];
    const nodeCount = 60;
    const nodePositions = [];

    for (let i = 0; i < nodeCount; i++) {
      const geom = new THREE.SphereGeometry(0.15, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.8
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
      opacity: 0.2
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
      blending: THREE.AdditiveBlending
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
      blending: THREE.AdditiveBlending
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
      "Who's Learning Who": buildWhosLearning
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
