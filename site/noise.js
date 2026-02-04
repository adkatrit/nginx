/**
 * Simplex Noise Generator
 * Self-contained implementation for procedural terrain generation
 * Based on Stefan Gustavson's implementation
 */
window.NoiseGenerator = (function() {
  'use strict';

  // Permutation table
  const perm = new Uint8Array(512);
  const gradP = new Array(512);

  // Gradient vectors for 2D
  const grad3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
  ];

  // Skewing factors for 2D
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  // Initialize with default seed
  let currentSeed = 0;

  function setSeed(seed) {
    currentSeed = seed;
    const p = new Uint8Array(256);

    // Generate permutation using seed
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Shuffle using seeded random
    let n = 256;
    let random = seededRandom(seed);
    while (n > 1) {
      const k = Math.floor(random() * n);
      n--;
      const temp = p[n];
      p[n] = p[k];
      p[k] = temp;
    }

    // Extend permutation table
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
      gradP[i] = grad3[perm[i] % 12];
    }
  }

  function seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  function dot2(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  /**
   * 2D Simplex noise
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Noise value in range [-1, 1]
   */
  function noise2D(x, y) {
    // Skew input space to determine simplex cell
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    // Determine which simplex we're in
    let i1, j1;
    if (x0 > y0) {
      i1 = 1; j1 = 0;
    } else {
      i1 = 0; j1 = 1;
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    // Hash coordinates of corners
    const ii = i & 255;
    const jj = j & 255;

    // Calculate contributions from corners
    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = gradP[ii + perm[jj]];
      t0 *= t0;
      n0 = t0 * t0 * dot2(gi0, x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = gradP[ii + i1 + perm[jj + j1]];
      t1 *= t1;
      n1 = t1 * t1 * dot2(gi1, x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = gradP[ii + 1 + perm[jj + 1]];
      t2 *= t2;
      n2 = t2 * t2 * dot2(gi2, x2, y2);
    }

    // Scale to [-1, 1]
    return 70 * (n0 + n1 + n2);
  }

  /**
   * Fractional Brownian Motion (layered noise)
   * Creates natural-looking terrain by combining multiple octaves
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} octaves - Number of noise layers (1-8)
   * @param {number} persistence - Amplitude decay per octave (0.3-0.7)
   * @param {number} lacunarity - Frequency increase per octave (1.5-3.0)
   * @returns {number} Noise value (roughly in range [-1, 1])
   */
  function fbm2D(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Ridged multifractal noise
   * Creates sharp ridges like mountain ranges
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} octaves - Number of noise layers
   * @param {number} persistence - Amplitude decay per octave
   * @param {number} lacunarity - Frequency increase per octave
   * @param {number} offset - Ridge sharpness offset (typically 1.0)
   * @returns {number} Noise value in range [0, 1]
   */
  function ridgedNoise2D(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0, offset = 1.0) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let weight = 1;

    for (let i = 0; i < octaves; i++) {
      let signal = noise2D(x * frequency, y * frequency);
      signal = offset - Math.abs(signal);
      signal *= signal;
      signal *= weight;
      weight = Math.min(1, Math.max(0, signal * 2));
      total += signal * amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total * 0.5; // Normalize roughly to [0, 1]
  }

  /**
   * Terraced noise - creates stepped plateaus
   * @param {number} value - Input noise value
   * @param {number} levels - Number of terrace levels (3-10)
   * @returns {number} Terraced value
   */
  function terrace(value, levels) {
    if (levels <= 1) return value;
    const k = Math.floor(value * levels);
    const f = value * levels - k;
    const smoothF = f * f * (3 - 2 * f); // Smoothstep
    return (k + smoothF) / levels;
  }

  /**
   * Sample terrain height at a world position
   * Combines multiple noise techniques based on config
   * @param {number} x - World X coordinate
   * @param {number} z - World Z coordinate
   * @param {Object} config - Terrain configuration
   * @returns {number} Height value
   */
  function sampleTerrain(x, z, config) {
    const scale = config.scale || 0.02;
    const octaves = config.octaves || 4;
    const persistence = config.persistence || 0.5;
    const lacunarity = config.lacunarity || 2.0;
    const amplitude = config.amplitude || 8.0;
    const baseHeight = config.baseHeight || -2.0;

    let height;

    if (config.ridged) {
      height = ridgedNoise2D(x * scale, z * scale, octaves, persistence, lacunarity);
    } else {
      height = (fbm2D(x * scale, z * scale, octaves, persistence, lacunarity) + 1) * 0.5;
    }

    // Apply terracing if specified
    if (config.terraced && config.terraced > 1) {
      height = terrace(height, config.terraced);
    }

    return height * amplitude + baseHeight;
  }

  // Initialize with default seed
  setSeed(12345);

  return {
    setSeed,
    noise2D,
    fbm2D,
    ridgedNoise2D,
    terrace,
    sampleTerrain
  };
})();
