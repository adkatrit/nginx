/*
  TERRAIN THEMES
  ==============
  Per-track terrain/scenery/atmosphere config for the universal flight engine
  (buildFlightScene in track-scenes.js). Each theme provides height functions,
  vertex coloring, water settings, scenery spawners, and atmosphere tuning.

  The flight engine (sky, bird, camera, chunk grid, stars, lighting, fog, tuner)
  lives in track-scenes.js and calls these theme functions at well-defined points.
*/

window.TERRAIN_THEMES = (function() {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  // "Terms & Conditions" — rolling hills, mountains, valleys & water
  // (extracted verbatim from the original buildTest terrain)
  // ═══════════════════════════════════════════════════════════════════════════
  const termsAndConditions = {
    name: "Terms & Conditions",

    chunkSize: 80,
    chunkSegs: 20,
    chunkRange: 5,

    terrainHeight(x, z, noise2D, fbm, time) {
      // Domain warping (Quilez 2002): warp input coordinates through a secondary
      // noise field before sampling terrain. Creates organic flowing shapes —
      // river-like channels, swirling ridges — that plain fBm can't produce.
      const warpScale = 0.003;
      const warpStrength = 45;
      const wx = (fbm(x * warpScale, z * warpScale, 3) - 0.5) * warpStrength;
      const wz = (fbm(x * warpScale + 5.2, z * warpScale + 1.3, 3) - 0.5) * warpStrength;
      const xw = x + wx;
      const zw = z + wz;

      // Rolling hills everywhere — multiple octaves (now using warped coords)
      const base = (fbm(xw * 0.005, zw * 0.005, 6) - 0.5) * 2;
      const mid  = (fbm(xw * 0.015 + 37, zw * 0.012 + 19, 4) - 0.5) * 2;
      const fine = (fbm(xw * 0.04 + 100, zw * 0.04 + 80, 3) - 0.5) * 2;
      const micro = (fbm(x * 0.12 + 200, z * 0.12 + 150, 2) - 0.5) * 2; // micro uses unwrapped for detail

      // Ridge features — abs of noise gives sharp creases
      const ridge = 1 - Math.abs(fbm(xw * 0.008 + 100, zw * 0.006 + 50, 4) - 0.5) * 2;

      // Noise-driven mountain field
      const mountainNoise = fbm(xw * 0.003 + 500, zw * 0.003 + 500, 3);
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const mountainScale = clamp((mountainNoise - 0.4) / 0.3, 0, 1);
      const valleyScale = 1 - mountainScale;

      let h = base * 10
            + mid * 6 * (0.4 + valleyScale * 0.6)
            + fine * 2.5
            + micro * 0.8
            + ridge * mountainScale * 50
            + mountainScale * base * 25;

      // Occasional deeper valleys that can hold water
      const valleyNoise = fbm(xw * 0.007 + 300, zw * 0.007 + 250, 3);
      if (valleyNoise < 0.35) {
        const depth = (0.35 - valleyNoise) / 0.35;
        h -= depth * depth * 12;
      }

      return h;
    },

    colorVertex(h, slope, nPatch, nGrain, waterY) {
      let r, g, b;
      if (h < waterY - 2) {
        r = 0.18 + nGrain * 0.06;
        g = 0.14 + nGrain * 0.05;
        b = 0.10 + nPatch * 0.04;
      } else if (h < waterY + 1) {
        r = 0.42 + nPatch * 0.12 + nGrain * 0.06;
        g = 0.32 + nPatch * 0.08 + nGrain * 0.04;
        b = 0.18 + nPatch * 0.05;
      } else if (h < 3) {
        const t = (h - waterY) / (3 - waterY);
        r = 0.12 + nPatch * 0.08 + t * 0.06;
        g = 0.42 + nPatch * 0.15 + nGrain * 0.08 + t * 0.08;
        b = 0.08 + nPatch * 0.04;
        if (nPatch > 0.4) { r += 0.18; g -= 0.12; b += 0.03; }
      } else if (h < 15) {
        const t = (h - 3) / 12;
        r = 0.22 + t * 0.30 + nPatch * 0.12 + nGrain * 0.06;
        g = 0.50 - t * 0.22 + nPatch * 0.10 + nGrain * 0.05;
        b = 0.10 + t * 0.06 + nGrain * 0.03;
        if (nPatch > 0.3) { r += 0.12 * t; g += 0.05 * t; b -= 0.02; }
      } else if (h < 35) {
        const t = Math.min(1, (h - 15) / 20 + slope * 0.12);
        r = 0.45 + t * 0.10 + nPatch * 0.10 + nGrain * 0.06;
        g = 0.40 + t * 0.08 + nPatch * 0.08 + nGrain * 0.05;
        b = 0.32 + t * 0.12 + nPatch * 0.06 + nGrain * 0.04;
        if (nPatch < -0.3) { g += 0.10; r -= 0.05; }
      } else {
        const t = Math.min(1, (h - 35) / 15);
        r = 0.75 + t * 0.15 + nGrain * 0.05;
        g = 0.78 + t * 0.12 + nGrain * 0.04;
        b = 0.82 + t * 0.10 + nPatch * 0.06;
      }

      // Steep slopes → exposed rock regardless of height
      if (slope > 1.5 && h > waterY + 1) {
        const rockBlend = Math.min(1, (slope - 1.5) / 3);
        const rr = 0.48 + nPatch * 0.08 + nGrain * 0.05;
        const rg = 0.42 + nPatch * 0.06 + nGrain * 0.04;
        const rb = 0.36 + nPatch * 0.05 + nGrain * 0.03;
        r = r * (1 - rockBlend) + rr * rockBlend;
        g = g * (1 - rockBlend) + rg * rockBlend;
        b = b * (1 - rockBlend) + rb * rockBlend;
      }

      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));

      return { r, g, b };
    },

    waterY: -6,
    waterColor: 0x1a5c6e,
    waterOpacity: 0.6,
    waterRoughness: 0.05,
    waterMetalness: 0.4,

    terrainMatProps: {
      flatShading: true,
      roughness: 0.85,
      metalness: 0.05,
      emissiveIntensity: 0.12,
    },

    sceneryDensity: 8,

    sceneryMaterials(THREE) {
      return {
        treeTrunk: new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 }),
        treeLeaf: new THREE.MeshStandardMaterial({ color: 0x2d6b2e, roughness: 0.8, emissive: 0x0a1a0a, emissiveIntensity: 0.15 }),
        treeLeafDark: new THREE.MeshStandardMaterial({ color: 0x1e4d20, roughness: 0.8, emissive: 0x0a150a, emissiveIntensity: 0.15 }),
        pineLeaf: new THREE.MeshStandardMaterial({ color: 0x1a4a2a, roughness: 0.7, emissive: 0x081408, emissiveIntensity: 0.15 }),
        boulder: new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.95, emissive: 0x111111, emissiveIntensity: 0.08 }),
        bush: new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 0.85, emissive: 0x0a1a0a, emissiveIntensity: 0.15 }),
      };
    },

    sceneryGeometries(THREE) {
      return {
        trunk: new THREE.CylinderGeometry(0.15, 0.25, 1, 6),
        canopy: new THREE.SphereGeometry(1, 6, 5),
        cone: new THREE.ConeGeometry(1, 1, 6),
        boulder: new THREE.DodecahedronGeometry(1, 1),
        bush: new THREE.SphereGeometry(1, 5, 4),
      };
    },

    spawnSceneryObject(x, z, h, waterY, rng, rng2, THREE, mats, geoms) {
      // Skip if underwater
      if (h < waterY + 0.5) return null;

      if (h > 20) {
        if (rng2 < 0.6) return _makeBoulder(x, z, h, rng2, THREE, mats, geoms);
        else return _makePine(x, z, h, rng2, THREE, mats, geoms);
      } else if (h > 5) {
        if (rng2 < 0.35) return _makePine(x, z, h, rng2, THREE, mats, geoms);
        else if (rng2 < 0.55) return _makeBoulder(x, z, h, rng2, THREE, mats, geoms);
        else return _makeBush(x, z, h, rng2, THREE, mats, geoms);
      } else {
        if (rng2 < 0.3) return _makeTree(x, z, h, rng2, THREE, mats, geoms);
        else if (rng2 < 0.55) return _makeBush(x, z, h, rng2, THREE, mats, geoms);
        else if (rng2 < 0.7) return _makePine(x, z, h, rng2, THREE, mats, geoms);
        else return _makeBoulder(x, z, h, rng2, THREE, mats, geoms);
      }
    },

    fogColor: 0x0a0a14,
    fogColorLight: 0x8c7a5e,
    fogDensity: 0.003,
    fogDensityDay: 0,

    baseSunElevation: -5,
    sunElevationRange: 10,
    sunAzimuth: 0,
    baseTurbidity: 4,
    baseRayleigh: 3.5,
    baseMieCoefficient: 0.005,
    baseMieDirectionalG: 0.87,
    baseExposure: 0.05,
    baseSunIntensity: 0.1,
    sunIntensityRange: 1.6,
    baseHemiIntensity: 0.04,
    hemiIntensityRange: 0.46,

    animated: false,
    animateChunks: null,

  };


  // ═══════════════════════════════════════════════════════════════════════════
  // "Data Tide" — pure ocean surface with animated waves
  // Bird flies over rolling ocean swells — water, sun and stars only
  // ═══════════════════════════════════════════════════════════════════════════
  const dataTide = {
    name: "Data Tide",

    chunkSize: 80,
    chunkSegs: 24,   // slightly higher for smoother waves
    chunkRange: 5,

    terrainHeight(x, z, noise2D, fbm, time) {
      const t = time * 0.4;

      // Primary swell — long, rolling waves
      const swell = Math.sin(x * 0.015 + t * 0.7) * Math.cos(z * 0.012 - t * 0.5) * 3.0;

      // Cross waves — shorter, diagonal
      const cross = Math.sin((x + z) * 0.025 + t * 1.1) * 1.2
                  + Math.sin((x - z * 0.7) * 0.03 - t * 0.8) * 0.8;

      // Noise chop — small-scale turbulence
      const chop = (noise2D(x * 0.08 + t * 0.3, z * 0.08 - t * 0.2) - 0.5) * 1.5;

      // Gentle broad undulation
      const broad = Math.sin(x * 0.004 + t * 0.15) * Math.sin(z * 0.005 - t * 0.1) * 2.0;

      return swell + cross + chop + broad - 2.0;  // base level around -2 so bird clearance works
    },

    colorVertex(h, slope, nPatch, nGrain, waterY) {
      // Ocean surface — depth-based blue-green
      const depth = Math.max(0, Math.min(1, (1.5 - h) / 6));
      // Shallow: bright teal-green → Deep: dark navy-blue
      let r = 0.04 + (1 - depth) * 0.08 + nGrain * 0.02;
      let g = 0.18 + (1 - depth) * 0.22 - depth * 0.06 + nGrain * 0.03;
      let b = 0.35 + (1 - depth) * 0.15 + depth * 0.10 + nPatch * 0.04;

      // Foam on wave crests (high slope = breaking wave)
      if (slope > 0.8) {
        const foam = Math.min(1, (slope - 0.8) / 1.5);
        r = r * (1 - foam) + 0.7 * foam;
        g = g * (1 - foam) + 0.75 * foam;
        b = b * (1 - foam) + 0.78 * foam;
      }

      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));

      return { r, g, b };
    },

    waterY: -999,  // disabled — terrain IS the ocean
    waterColor: 0x1a5c6e,
    waterOpacity: 0.6,
    waterRoughness: 0.05,
    waterMetalness: 0.4,

    terrainMatProps: {
      flatShading: false,   // smooth waves
      roughness: 0.15,
      metalness: 0.5,
      emissiveIntensity: 0.08,
    },

    sceneryDensity: 0,

    fogColor: 0x0d1520,
    fogDensity: 0.003,
    fogDensityDay: 0,

    baseSunElevation: -5,
    sunAzimuth: 0,
    baseTurbidity: 6,
    baseRayleigh: 3.0,
    baseMieCoefficient: 0.012,
    baseMieDirectionalG: 0.87,
    baseExposure: 0.15,

    animated: false,

    // Use Three.js WaterMesh (TSL/WebGPU reflective ocean) instead of chunked terrain
    useWaterMesh: true,
    waterMeshConfig: {
      size: 2800,            // sized to camera far (1200) — was 10000, which
                             // starved depth precision (shoreline z-fighting)
      textureSize: 1.0,      // normal map scale
      waterColor: 0x001e0f,
      sunColor: 0xffffff,
      distortionScale: 3.7,
      alpha: 0.98,
    },

  };


  // ═══════════════════════════════════════════════════════════════════════════
  // Shared scenery helpers (used by theme spawnSceneryObject functions)
  // ═══════════════════════════════════════════════════════════════════════════
  function _makeTree(x, z, h, rng, THREE, mats, geoms) {
    const treeGroup = new THREE.Group();
    const trunkH = 2 + rng * 2;
    const trunk = new THREE.Mesh(geoms.trunk, mats.treeTrunk);
    trunk.scale.set(1, trunkH, 1);
    trunk.position.set(0, trunkH / 2, 0);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const canopySize = 1.5 + rng * 1.5;
    const leafMat = rng > 0.5 ? mats.treeLeaf : mats.treeLeafDark;
    const canopy = new THREE.Mesh(geoms.canopy, leafMat);
    canopy.scale.setScalar(canopySize);
    canopy.position.set((rng - 0.5) * 0.5, trunkH + canopySize * 0.6, 0);
    canopy.castShadow = true;
    treeGroup.add(canopy);

    treeGroup.position.set(x, h, z);
    treeGroup.rotation.y = rng * Math.PI * 2;
    return treeGroup;
  }

  function _makePine(x, z, h, rng, THREE, mats, geoms) {
    const pineGroup = new THREE.Group();
    const trunkH = 3 + rng * 3;
    const trunk = new THREE.Mesh(geoms.trunk, mats.treeTrunk);
    trunk.scale.set(0.8, trunkH, 0.8);
    trunk.position.set(0, trunkH / 2, 0);
    trunk.castShadow = true;
    pineGroup.add(trunk);

    const layers = 2 + Math.floor(rng * 2);
    for (let l = 0; l < layers; l++) {
      const layerSize = (1.8 - l * 0.3) * (0.8 + rng * 0.4);
      const layerH = 2 * layerSize;
      const cone = new THREE.Mesh(geoms.cone, mats.pineLeaf);
      cone.scale.set(layerSize, layerH, layerSize);
      cone.position.set(0, trunkH * 0.5 + l * layerH * 0.5 + layerH / 2, 0);
      cone.castShadow = true;
      pineGroup.add(cone);
    }

    pineGroup.position.set(x, h, z);
    pineGroup.rotation.y = rng * Math.PI * 2;
    return pineGroup;
  }

  function _makeBoulder(x, z, h, rng, THREE, mats, geoms) {
    const size = 0.5 + rng * 2;
    const boulder = new THREE.Mesh(geoms.boulder, mats.boulder);
    boulder.scale.set(size * (0.8 + rng * 0.4), size * (0.6 + rng * 0.4), size * (0.8 + rng * 0.4));
    boulder.position.set(x, h + size * 0.2, z);
    boulder.rotation.set(rng * 0.5, rng * Math.PI, rng * 0.3);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    return boulder;
  }

  function _makeBush(x, z, h, rng, THREE, mats, geoms) {
    const size = 0.4 + rng * 0.8;
    const bush = new THREE.Mesh(geoms.bush, mats.bush);
    bush.scale.set(size * (0.8 + rng * 0.5), size * (0.6 + rng * 0.3), size * (0.8 + rng * 0.5));
    bush.position.set(x, h + size * 0.15, z);
    bush.castShadow = true;
    return bush;
  }

  function _makeMushroom(x, z, h, rng, THREE, mats, geoms) {
    const group = new THREE.Group();
    const stemH = 1.5 + rng * 2.5;
    const stem = new THREE.Mesh(geoms.mushroomStem, mats.mushroomStem);
    stem.scale.set(0.3 + rng * 0.2, stemH, 0.3 + rng * 0.2);
    stem.position.set(0, stemH / 2, 0);
    group.add(stem);

    const capSize = 0.8 + rng * 1.2;
    const cap = new THREE.Mesh(geoms.mushroomCap, mats.mushroomCap);
    cap.scale.set(capSize, capSize * 0.4, capSize);
    cap.position.set(0, stemH + capSize * 0.1, 0);
    cap.castShadow = true;
    group.add(cap);

    group.position.set(x, h, z);
    group.rotation.y = rng * Math.PI * 2;
    // Slight lean for organic feel
    group.rotation.z = (rng - 0.5) * 0.15;
    return group;
  }

  function _makeTropicalTree(x, z, h, rng, THREE, mats, geoms) {
    const group = new THREE.Group();
    const trunkH = 4 + rng * 4;
    const trunk = new THREE.Mesh(geoms.trunk, mats.treeTrunk);
    trunk.scale.set(0.6, trunkH, 0.6);
    trunk.position.set(0, trunkH / 2, 0);
    trunk.castShadow = true;
    group.add(trunk);

    // Large spreading canopy
    const canopySize = 2.5 + rng * 2;
    const leafMat = rng > 0.5 ? mats.treeLeaf : mats.treeLeafDark;
    const canopy = new THREE.Mesh(geoms.canopy, leafMat);
    canopy.scale.set(canopySize, canopySize * 0.6, canopySize);
    canopy.position.set((rng - 0.5) * 0.8, trunkH + canopySize * 0.3, 0);
    canopy.castShadow = true;
    group.add(canopy);

    // Second smaller canopy cluster for density
    if (rng > 0.3) {
      const c2 = new THREE.Mesh(geoms.canopy, leafMat);
      const s2 = canopySize * 0.7;
      c2.scale.set(s2, s2 * 0.5, s2);
      c2.position.set((0.5 - rng) * 1.2, trunkH - 0.5 + s2 * 0.3, (rng - 0.5) * 1.5);
      c2.castShadow = true;
      group.add(c2);
    }

    group.position.set(x, h, z);
    group.rotation.y = rng * Math.PI * 2;
    return group;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // "Signal Integrity" — arctic tundra, clinical precision
  // Flat snowy expanse with frozen lakes, sparse ice boulders, sterile sky
  // ═══════════════════════════════════════════════════════════════════════════
  const signalIntegrity = {
    name: "Signal Integrity",

    chunkSize: 80,
    chunkSegs: 16,    // low detail — smooth snow needs fewer verts
    chunkRange: 6,    // wider view distance — flat terrain = see further

    terrainHeight(x, z, noise2D, fbm, time) {
      // Gentle undulations — 2 octaves, very low amplitude
      const base = (fbm(x * 0.004, z * 0.004, 2) - 0.5) * 2;
      const mid = (fbm(x * 0.012 + 50, z * 0.012 + 30, 2) - 0.5) * 2;

      // Subtle wind-carved ridges
      const ridge = Math.abs(fbm(x * 0.008 + 200, z * 0.006 + 150, 2) - 0.5) * 2;

      let h = base * 3.5 + mid * 1.5 + ridge * 1.0;

      // Frozen lake basins — broad, flat depressions
      const basinNoise = fbm(x * 0.005 + 400, z * 0.005 + 350, 2);
      if (basinNoise < 0.38) {
        const depth = (0.38 - basinNoise) / 0.38;
        h -= depth * depth * 4;
      }

      return h;
    },

    colorVertex(h, slope, nPatch, nGrain, waterY) {
      let r, g, b;

      if (h < waterY + 0.3) {
        // Below/at ice level — frozen sediment
        r = 0.55 + nGrain * 0.04;
        g = 0.58 + nGrain * 0.04;
        b = 0.62 + nPatch * 0.03;
      } else if (h < 1) {
        // Low snow plain — bright white with blue-grey undertone
        r = 0.78 + nPatch * 0.06 + nGrain * 0.04;
        g = 0.80 + nPatch * 0.05 + nGrain * 0.03;
        b = 0.84 + nPatch * 0.04 + nGrain * 0.03;
      } else if (h < 3) {
        // Mid elevation — wind-scoured, slightly darker streaks
        const t = (h - 1) / 2;
        r = 0.72 + t * 0.04 + nPatch * 0.08 + nGrain * 0.04;
        g = 0.74 + t * 0.03 + nPatch * 0.06 + nGrain * 0.03;
        b = 0.80 + t * 0.02 + nPatch * 0.05 + nGrain * 0.03;
      } else {
        // Highest points — pure white snow
        r = 0.85 + nGrain * 0.05;
        g = 0.87 + nGrain * 0.04;
        b = 0.92 + nPatch * 0.04;
      }

      // Exposed dark slate on steep slopes
      if (slope > 0.8 && h > waterY + 0.5) {
        const rockBlend = Math.min(1, (slope - 0.8) / 2);
        const rr = 0.32 + nPatch * 0.06;
        const rg = 0.34 + nPatch * 0.05;
        const rb = 0.38 + nPatch * 0.05;
        r = r * (1 - rockBlend) + rr * rockBlend;
        g = g * (1 - rockBlend) + rg * rockBlend;
        b = b * (1 - rockBlend) + rb * rockBlend;
      }

      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));

      return { r, g, b };
    },

    waterY: -1,
    waterColor: 0x88ccdd,
    waterOpacity: 0.4,
    waterRoughness: 0.02,
    waterMetalness: 0.6,

    terrainMatProps: {
      flatShading: false,   // smooth snow surface
      roughness: 0.75,
      metalness: 0.02,
      emissiveIntensity: 0.15,
    },

    sceneryDensity: 2,

    sceneryMaterials(THREE) {
      return {
        boulder: new THREE.MeshStandardMaterial({
          color: 0x8899aa, roughness: 0.6, metalness: 0.1,
          emissive: 0x334455, emissiveIntensity: 0.05,
        }),
      };
    },

    sceneryGeometries(THREE) {
      return {
        boulder: new THREE.DodecahedronGeometry(1, 1),
      };
    },

    spawnSceneryObject(x, z, h, waterY, rng, rng2, THREE, mats, geoms) {
      if (h < waterY + 0.3) return null;  // don't place on ice
      if (rng2 < 0.7) return _makeBoulder(x, z, h, rng2, THREE, mats, geoms);
      return null;  // sparse — most slots empty
    },

    fogColor: 0x101520,
    fogColorLight: 0xc8d8e8,
    fogDensity: 0.003,
    fogDensityDay: 0,

    baseSunElevation: -3,
    sunElevationRange: 12,
    sunAzimuth: 20,
    baseTurbidity: 2,
    baseRayleigh: 4.0,
    baseMieCoefficient: 0.003,
    baseMieDirectionalG: 0.87,
    baseExposure: 0.08,
    baseSunIntensity: 0.15,
    sunIntensityRange: 1.8,
    baseHemiIntensity: 0.08,
    hemiIntensityRange: 0.5,

    animated: false,
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // "Trade You My Hands" — dense bioluminescent rainforest
  // Hilly jungle terrain, thick canopy, glowing fungi, murky streams
  // ═══════════════════════════════════════════════════════════════════════════
  const tradeYouMyHands = {
    name: "Trade You My Hands",

    chunkSize: 80,
    chunkSegs: 22,
    chunkRange: 4,    // shorter view — dense fog hides distant terrain

    terrainHeight(x, z, noise2D, fbm, time) {
      // Domain warping — organic ravines and ridgelines
      const warpScale = 0.004;
      const warpStrength = 35;
      const wx = (fbm(x * warpScale, z * warpScale, 3) - 0.5) * warpStrength;
      const wz = (fbm(x * warpScale + 7.1, z * warpScale + 3.7, 3) - 0.5) * warpStrength;
      const xw = x + wx;
      const zw = z + wz;

      // Hilly jungle terrain — moderate amplitude
      const base = (fbm(xw * 0.006, zw * 0.006, 5) - 0.5) * 2;
      const mid = (fbm(xw * 0.018 + 40, zw * 0.015 + 25, 4) - 0.5) * 2;
      const fine = (fbm(xw * 0.05 + 120, zw * 0.05 + 90, 3) - 0.5) * 2;

      // Ridge features — jungle ridgelines
      const ridge = 1 - Math.abs(fbm(xw * 0.009 + 80, zw * 0.007 + 60, 3) - 0.5) * 2;

      // Hill intensity field
      const hillNoise = fbm(xw * 0.003 + 600, zw * 0.003 + 600, 2);
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const hillScale = clamp((hillNoise - 0.35) / 0.3, 0, 1);

      let h = base * 8
            + mid * 4
            + fine * 1.5
            + ridge * hillScale * 20
            + hillScale * base * 12;

      // Stream valleys — carved deeper
      const valleyNoise = fbm(xw * 0.008 + 350, zw * 0.008 + 280, 3);
      if (valleyNoise < 0.35) {
        const depth = (0.35 - valleyNoise) / 0.35;
        h -= depth * depth * 8;
      }

      return h;
    },

    colorVertex(h, slope, nPatch, nGrain, waterY) {
      let r, g, b;

      if (h < waterY - 1) {
        // Deep underwater — dark mud
        r = 0.12 + nGrain * 0.04;
        g = 0.10 + nGrain * 0.03;
        b = 0.06 + nPatch * 0.02;
      } else if (h < waterY + 1) {
        // Stream bank — rich brown earth
        r = 0.25 + nPatch * 0.08 + nGrain * 0.05;
        g = 0.18 + nPatch * 0.06 + nGrain * 0.04;
        b = 0.08 + nPatch * 0.03;
      } else if (h < 4) {
        // Low jungle floor — dark green, dappled
        r = 0.06 + nPatch * 0.04 + nGrain * 0.03;
        g = 0.22 + nPatch * 0.12 + nGrain * 0.06;
        b = 0.08 + nPatch * 0.04 + nGrain * 0.02;
        // Occasional bioluminescent teal patches
        if (nPatch > 0.4) { r += 0.02; g += 0.10; b += 0.12; }
      } else if (h < 12) {
        // Mid canopy — brighter green
        const t = (h - 4) / 8;
        r = 0.08 + t * 0.06 + nPatch * 0.05 + nGrain * 0.03;
        g = 0.30 + t * 0.08 + nPatch * 0.10 + nGrain * 0.05;
        b = 0.10 + t * 0.04 + nPatch * 0.04 + nGrain * 0.02;
        if (nPatch > 0.3) { g += 0.08; b += 0.06; }
      } else if (h < 25) {
        // Upper canopy — lighter green with exposed red-brown soil on slopes
        const t = (h - 12) / 13;
        r = 0.14 + t * 0.15 + nPatch * 0.08 + nGrain * 0.04;
        g = 0.28 - t * 0.06 + nPatch * 0.08 + nGrain * 0.04;
        b = 0.10 + t * 0.04 + nGrain * 0.03;
      } else {
        // Emergent peaks — mossy rock
        r = 0.30 + nPatch * 0.08 + nGrain * 0.05;
        g = 0.35 + nPatch * 0.06 + nGrain * 0.04;
        b = 0.22 + nPatch * 0.05 + nGrain * 0.03;
      }

      // Steep slopes → exposed red-brown laterite soil
      if (slope > 1.2 && h > waterY + 1) {
        const rockBlend = Math.min(1, (slope - 1.2) / 2.5);
        const rr = 0.28 + nPatch * 0.06;
        const rg = 0.16 + nPatch * 0.04;
        const rb = 0.08 + nPatch * 0.03;
        r = r * (1 - rockBlend) + rr * rockBlend;
        g = g * (1 - rockBlend) + rg * rockBlend;
        b = b * (1 - rockBlend) + rb * rockBlend;
      }

      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));

      return { r, g, b };
    },

    waterY: -2,
    waterColor: 0x0a3a2a,
    waterOpacity: 0.5,
    waterRoughness: 0.3,
    waterMetalness: 0.2,

    terrainMatProps: {
      flatShading: true,
      roughness: 0.9,
      metalness: 0.03,
      emissiveIntensity: 0.1,
    },

    sceneryDensity: 14,

    sceneryMaterials(THREE) {
      return {
        treeTrunk: new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.95 }),
        treeLeaf: new THREE.MeshStandardMaterial({
          color: 0x1a5a2a, roughness: 0.75,
          emissive: 0x00ff88, emissiveIntensity: 0.06,
        }),
        treeLeafDark: new THREE.MeshStandardMaterial({
          color: 0x0e3a18, roughness: 0.8,
          emissive: 0x00aa44, emissiveIntensity: 0.04,
        }),
        bush: new THREE.MeshStandardMaterial({
          color: 0x2a6a2a, roughness: 0.85,
          emissive: 0x00ff66, emissiveIntensity: 0.08,
        }),
        boulder: new THREE.MeshStandardMaterial({
          color: 0x4a5a4a, roughness: 0.95,
          emissive: 0x224422, emissiveIntensity: 0.05,
        }),
        mushroomStem: new THREE.MeshStandardMaterial({
          color: 0xccbbaa, roughness: 0.7,
          emissive: 0x886644, emissiveIntensity: 0.05,
        }),
        mushroomCap: new THREE.MeshStandardMaterial({
          color: 0xff6688, roughness: 0.4, metalness: 0.1,
          emissive: 0xff4466, emissiveIntensity: 0.35,
        }),
      };
    },

    sceneryGeometries(THREE) {
      return {
        trunk: new THREE.CylinderGeometry(0.15, 0.25, 1, 6),
        canopy: new THREE.SphereGeometry(1, 6, 5),
        cone: new THREE.ConeGeometry(1, 1, 6),
        boulder: new THREE.DodecahedronGeometry(1, 1),
        bush: new THREE.SphereGeometry(1, 5, 4),
        mushroomStem: new THREE.CylinderGeometry(0.12, 0.18, 1, 6),
        mushroomCap: new THREE.SphereGeometry(1, 8, 6),
      };
    },

    spawnSceneryObject(x, z, h, waterY, rng, rng2, THREE, mats, geoms) {
      if (h < waterY + 0.3) return null;

      if (h < 5) {
        // Low jungle — dense: trees, bushes, mushrooms
        if (rng2 < 0.30) return _makeTropicalTree(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.50) return _makeBush(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.65) return _makeMushroom(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.80) return _makeTree(x, z, h, rng2, THREE, mats, geoms);
        return _makeBush(x, z, h, rng2, THREE, mats, geoms);
      } else if (h < 15) {
        // Mid — canopy trees dominate
        if (rng2 < 0.40) return _makeTropicalTree(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.60) return _makeTree(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.75) return _makeBush(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.85) return _makeMushroom(x, z, h, rng2, THREE, mats, geoms);
        return _makeBoulder(x, z, h, rng2, THREE, mats, geoms);
      } else {
        // High — mossy boulders, sparse trees
        if (rng2 < 0.45) return _makeBoulder(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.70) return _makePine(x, z, h, rng2, THREE, mats, geoms);
        return _makeBush(x, z, h, rng2, THREE, mats, geoms);
      }
    },

    fogColor: 0x040a06,
    fogColorLight: 0x2a4a2a,
    fogDensity: 0.003,
    fogDensityDay: 0,

    baseSunElevation: -4,
    sunElevationRange: 6,     // narrow range — perpetual dusk
    sunAzimuth: -30,
    baseTurbidity: 8,
    baseRayleigh: 2.0,
    baseMieCoefficient: 0.015,
    baseMieDirectionalG: 0.87,
    baseExposure: 0.06,
    baseSunIntensity: 0.05,
    sunIntensityRange: 0.8,
    baseHemiIntensity: 0.03,
    hemiIntensityRange: 0.25,

    animated: false,
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // "Turn Your Phone Face Down" — golden meadow at sunset
  // Gentle rolling hills, warm amber tones, autumn trees, golden hour light
  // ═══════════════════════════════════════════════════════════════════════════
  const turnYourPhone = {
    name: "Turn Your Phone Face Down",

    chunkSize: 80,
    chunkSegs: 18,
    chunkRange: 5,

    terrainHeight(x, z, noise2D, fbm, time) {
      // Light domain warping — gentler than T&C
      const warpScale = 0.003;
      const warpStrength = 25;
      const wx = (fbm(x * warpScale + 10, z * warpScale + 10, 2) - 0.5) * warpStrength;
      const wz = (fbm(x * warpScale + 15.2, z * warpScale + 11.3, 2) - 0.5) * warpStrength;
      const xw = x + wx;
      const zw = z + wz;

      // Broad rolling hills — open grassland feel
      const base = (fbm(xw * 0.004, zw * 0.004, 4) - 0.5) * 2;
      const mid = (fbm(xw * 0.012 + 55, zw * 0.010 + 35, 3) - 0.5) * 2;
      const fine = (fbm(xw * 0.035 + 130, zw * 0.035 + 100, 2) - 0.5) * 2;

      // Soft ridges — no sharp features
      const ridge = 1 - Math.abs(fbm(xw * 0.006 + 180, zw * 0.005 + 120, 3) - 0.5) * 2;

      // Gentle hill presence
      const hillNoise = fbm(xw * 0.003 + 700, zw * 0.003 + 700, 2);
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const hillScale = clamp((hillNoise - 0.4) / 0.3, 0, 1);

      let h = base * 7
            + mid * 3.5
            + fine * 1.2
            + ridge * hillScale * 12
            + hillScale * base * 8;

      // Gentle valleys for ponds
      const valleyNoise = fbm(xw * 0.006 + 450, zw * 0.006 + 400, 2);
      if (valleyNoise < 0.32) {
        const depth = (0.32 - valleyNoise) / 0.32;
        h -= depth * depth * 6;
      }

      return h;
    },

    colorVertex(h, slope, nPatch, nGrain, waterY) {
      let r, g, b;

      if (h < waterY - 1) {
        // Pond bed — dark sandy brown
        r = 0.22 + nGrain * 0.05;
        g = 0.16 + nGrain * 0.04;
        b = 0.08 + nPatch * 0.03;
      } else if (h < waterY + 1) {
        // Water's edge — wet sandy earth
        r = 0.38 + nPatch * 0.10 + nGrain * 0.05;
        g = 0.28 + nPatch * 0.08 + nGrain * 0.04;
        b = 0.14 + nPatch * 0.04;
      } else if (h < 3) {
        // Low meadow — golden-green grass
        const t = (h - waterY) / (3 - waterY);
        r = 0.28 + t * 0.12 + nPatch * 0.08 + nGrain * 0.04;
        g = 0.38 + t * 0.06 + nPatch * 0.10 + nGrain * 0.05;
        b = 0.10 + nPatch * 0.03;
        // Wildflower patches — warm pink/lavender tint
        if (nPatch > 0.45) { r += 0.15; g -= 0.05; b += 0.08; }
      } else if (h < 12) {
        // Mid slopes — amber/wheat tones
        const t = (h - 3) / 9;
        r = 0.42 + t * 0.12 + nPatch * 0.10 + nGrain * 0.05;
        g = 0.36 + t * 0.04 + nPatch * 0.08 + nGrain * 0.04;
        b = 0.12 + t * 0.06 + nPatch * 0.04 + nGrain * 0.03;
        if (nPatch > 0.3) { r += 0.08; g += 0.04; }
      } else if (h < 25) {
        // Upper — warm ochre
        const t = Math.min(1, (h - 12) / 13 + slope * 0.1);
        r = 0.52 + t * 0.08 + nPatch * 0.08 + nGrain * 0.04;
        g = 0.40 + t * 0.04 + nPatch * 0.06 + nGrain * 0.03;
        b = 0.20 + t * 0.08 + nPatch * 0.05 + nGrain * 0.03;
      } else {
        // Peaks — sun-bleached pale gold
        const t = Math.min(1, (h - 25) / 10);
        r = 0.68 + t * 0.12 + nGrain * 0.04;
        g = 0.60 + t * 0.10 + nGrain * 0.03;
        b = 0.38 + t * 0.12 + nPatch * 0.05;
      }

      // Steep slopes — exposed warm sandstone
      if (slope > 1.3 && h > waterY + 1) {
        const rockBlend = Math.min(1, (slope - 1.3) / 2.5);
        const rr = 0.50 + nPatch * 0.06 + nGrain * 0.04;
        const rg = 0.40 + nPatch * 0.05 + nGrain * 0.03;
        const rb = 0.28 + nPatch * 0.04 + nGrain * 0.03;
        r = r * (1 - rockBlend) + rr * rockBlend;
        g = g * (1 - rockBlend) + rg * rockBlend;
        b = b * (1 - rockBlend) + rb * rockBlend;
      }

      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));

      return { r, g, b };
    },

    waterY: -3,
    waterColor: 0x4a3520,
    waterOpacity: 0.5,
    waterRoughness: 0.1,
    waterMetalness: 0.35,

    terrainMatProps: {
      flatShading: true,
      roughness: 0.85,
      metalness: 0.04,
      emissiveIntensity: 0.12,
    },

    sceneryDensity: 5,

    sceneryMaterials(THREE) {
      return {
        treeTrunk: new THREE.MeshStandardMaterial({ color: 0x5c3a20, roughness: 0.9 }),
        treeLeaf: new THREE.MeshStandardMaterial({
          color: 0xbb7722, roughness: 0.75,
          emissive: 0x664411, emissiveIntensity: 0.12,
        }),
        treeLeafDark: new THREE.MeshStandardMaterial({
          color: 0x886622, roughness: 0.8,
          emissive: 0x553311, emissiveIntensity: 0.10,
        }),
        pineLeaf: new THREE.MeshStandardMaterial({
          color: 0x3a5a2a, roughness: 0.75,
          emissive: 0x1a2a10, emissiveIntensity: 0.08,
        }),
        boulder: new THREE.MeshStandardMaterial({
          color: 0x8a7a60, roughness: 0.9,
          emissive: 0x332a1a, emissiveIntensity: 0.06,
        }),
        bush: new THREE.MeshStandardMaterial({
          color: 0x6a7a3a, roughness: 0.85,
          emissive: 0x2a3a10, emissiveIntensity: 0.10,
        }),
      };
    },

    sceneryGeometries(THREE) {
      return {
        trunk: new THREE.CylinderGeometry(0.15, 0.25, 1, 6),
        canopy: new THREE.SphereGeometry(1, 6, 5),
        cone: new THREE.ConeGeometry(1, 1, 6),
        boulder: new THREE.DodecahedronGeometry(1, 1),
        bush: new THREE.SphereGeometry(1, 5, 4),
      };
    },

    spawnSceneryObject(x, z, h, waterY, rng, rng2, THREE, mats, geoms) {
      if (h < waterY + 0.5) return null;

      if (h < 5) {
        // Meadow — scattered trees and bushes
        if (rng2 < 0.25) return _makeTree(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.50) return _makeBush(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.65) return _makePine(x, z, h, rng2, THREE, mats, geoms);
        return null;  // open meadow — intentional gaps
      } else if (h < 15) {
        // Mid slopes — more trees
        if (rng2 < 0.30) return _makeTree(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.50) return _makePine(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.65) return _makeBoulder(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.80) return _makeBush(x, z, h, rng2, THREE, mats, geoms);
        return null;
      } else {
        // Higher — boulders and sparse pines
        if (rng2 < 0.40) return _makeBoulder(x, z, h, rng2, THREE, mats, geoms);
        if (rng2 < 0.60) return _makePine(x, z, h, rng2, THREE, mats, geoms);
        return null;
      }
    },

    fogColor: 0x1a0f05,
    fogColorLight: 0xcc8844,
    fogDensity: 0.003,
    fogDensityDay: 0,

    baseSunElevation: -3,
    sunElevationRange: 8,
    sunAzimuth: -15,
    baseTurbidity: 8,         // hazy golden atmosphere
    baseRayleigh: 1.5,
    baseMieCoefficient: 0.02, // strong Mie scattering — warm sun glow
    baseMieDirectionalG: 0.87,
    baseExposure: 0.12,
    baseSunIntensity: 0.4,
    sunIntensityRange: 1.2,
    baseHemiIntensity: 0.1,
    hemiIntensityRange: 0.4,

    animated: false,
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // Stub themes — shallow copies of T&C as placeholders for other tracks
  // ═══════════════════════════════════════════════════════════════════════════
  function makeStub(name) {
    return Object.assign({}, termsAndConditions, { name });
  }

  return {
    "Terms & Conditions": termsAndConditions,
    "Data Tide": dataTide,
    "Soft Systems": makeStub("Soft Systems"),
    "Beast Mode": makeStub("Beast Mode"),
    "Dreams Bleed Into Dashboards": makeStub("Dreams Bleed Into Dashboards"),
    "Signal Integrity": signalIntegrity,
    "Gi Mi Di Reins": makeStub("Gi Mi Di Reins"),
    "Trade You My Hands": tradeYouMyHands,
    "Push Harder": makeStub("Push Harder"),
    "The Last Dragon": makeStub("The Last Dragon"),
    "Who's Learning Who": makeStub("Who's Learning Who"),
    "Turn Your Phone Face Down": turnYourPhone,
    "Test": termsAndConditions,  // "Test" uses same terrain as T&C
  };
})();
