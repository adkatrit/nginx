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
    fogDensity: 0.0036,
    fogDensityDay: 0,

    baseSunElevation: -5,
    sunElevationRange: 10,
    sunAzimuth: 0,
    baseTurbidity: 4,
    baseRayleigh: 3.5,
    baseMieCoefficient: 0.005,
    baseMieDirectionalG: 0.8,
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
    fogDensity: 0.006,
    fogDensityDay: 0.0002,

    baseSunElevation: -5,
    sunAzimuth: 0,
    baseTurbidity: 6,
    baseRayleigh: 3.0,
    baseMieCoefficient: 0.012,
    baseMieDirectionalG: 0.85,
    baseExposure: 0.15,

    animated: false,

    // Use Three.js WaterMesh (TSL/WebGPU reflective ocean) instead of chunked terrain
    useWaterMesh: true,
    waterMeshConfig: {
      size: 10000,           // single large plane
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
    "Signal Integrity": makeStub("Signal Integrity"),
    "Gi Mi Di Reins": makeStub("Gi Mi Di Reins"),
    "Trade You My Hands": makeStub("Trade You My Hands"),
    "Push Harder": makeStub("Push Harder"),
    "The Last Dragon": makeStub("The Last Dragon"),
    "Who's Learning Who": makeStub("Who's Learning Who"),
    "Turn Your Phone Face Down": makeStub("Turn Your Phone Face Down"),
    "Test": termsAndConditions,  // "Test" uses same terrain as T&C
  };
})();
