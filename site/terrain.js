/**
 * Procedural Terrain System
 * Generates noise-based terrain meshes per chunk
 */
window.TerrainSystem = (function() {
  'use strict';

  const CHUNK_SEGMENTS = 32;  // Vertices per chunk side (32x32 = 1024 verts)
  const CHUNK_SIZE = 100;     // World units per chunk

  /**
   * TerrainChunk - A single terrain mesh segment
   */
  class TerrainChunk {
    constructor(THREE, chunkX, chunkZ, config) {
      this.THREE = THREE;
      this.chunkX = chunkX;
      this.chunkZ = chunkZ;
      this.config = config;
      this.mesh = null;
      this.heightmap = new Float32Array((CHUNK_SEGMENTS + 1) * (CHUNK_SEGMENTS + 1));
      this.cellSize = CHUNK_SIZE / CHUNK_SEGMENTS;

      this.generateHeightmap();
      this.buildMesh();
    }

    generateHeightmap() {
      const segments = CHUNK_SEGMENTS + 1;
      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
          const worldX = this.chunkX + i * this.cellSize;
          const worldZ = this.chunkZ + j * this.cellSize;
          this.heightmap[i * segments + j] = NoiseGenerator.sampleTerrain(worldX, worldZ, this.config);
        }
      }
    }

    buildMesh() {
      const THREE = this.THREE;
      const segments = CHUNK_SEGMENTS;
      const segmentsPlus1 = segments + 1;

      // Create plane geometry
      const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segments, segments);
      geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane

      // Apply heightmap to vertices
      // PlaneGeometry vertices are ordered: iy (rows/Z) outer, ix (cols/X) inner
      // Heightmap is ordered: i (X) outer, j (Z) inner
      // So we need to transpose the indices
      const positions = geometry.attributes.position.array;

      for (let iy = 0; iy < segmentsPlus1; iy++) {
        for (let ix = 0; ix < segmentsPlus1; ix++) {
          const vertexIndex = iy * segmentsPlus1 + ix;
          const heightIndex = ix * segmentsPlus1 + iy; // Transposed to match heightmap
          positions[vertexIndex * 3 + 1] = this.heightmap[heightIndex];
        }
      }

      geometry.computeVertexNormals();
      geometry.attributes.position.needsUpdate = true;

      // Create material with height-based coloring
      const material = this.createMaterial();

      // For wireframe terrain, create a group with solid base + wireframe on top
      if (this.config.wireframe) {
        this.mesh = new THREE.Group();

        // Solid base plane at baseHeight to block the background
        const baseGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 1, 1);
        baseGeometry.rotateX(-Math.PI / 2);
        const baseMaterial = new THREE.MeshBasicMaterial({
          color: this.config.lowColor || 0x000000,
          side: THREE.FrontSide
        });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.y = this.config.baseHeight || -2;
        this.mesh.add(baseMesh);

        // Wireframe terrain on top
        const wireframeMesh = new THREE.Mesh(geometry, material);
        wireframeMesh.receiveShadow = true;
        this.mesh.add(wireframeMesh);

        this.mesh.position.set(
          this.chunkX + CHUNK_SIZE / 2,
          0,
          this.chunkZ + CHUNK_SIZE / 2
        );
      } else {
        // Use a group with solid base plane to prevent background bleed-through
        this.mesh = new THREE.Group();

        // Solid base plane at baseHeight to block the background
        const baseGeometry = new THREE.PlaneGeometry(CHUNK_SIZE + 2, CHUNK_SIZE + 2, 1, 1); // Slightly larger to overlap seams
        baseGeometry.rotateX(-Math.PI / 2);
        const baseMaterial = new THREE.MeshBasicMaterial({
          color: this.config.lowColor || 0x000810,
          side: THREE.DoubleSide
        });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.y = this.config.baseHeight || -2;
        this.mesh.add(baseMesh);

        // Terrain mesh on top
        const terrainMesh = new THREE.Mesh(geometry, material);
        terrainMesh.receiveShadow = true;
        this.mesh.add(terrainMesh);

        this.mesh.position.set(
          this.chunkX + CHUNK_SIZE / 2,
          0,
          this.chunkZ + CHUNK_SIZE / 2
        );
      }
    }

    createMaterial() {
      const THREE = this.THREE;
      const config = this.config;

      if (config.wireframe) {
        return new THREE.MeshBasicMaterial({
          color: config.color || 0x00ff88,
          wireframe: true,
          transparent: true,
          opacity: 0.9
        });
      }

      if (config.colorByHeight) {
        const TSL = window._TSL;
        if (!TSL) {
          console.warn("Terrain: window._TSL not available, falling back to standard material");
          return new THREE.MeshStandardMaterial({
            color: config.color || 0x4a7023, roughness: 0.9, metalness: 0.1, flatShading: true
          });
        }
        const {
          Fn, float, vec2, vec3, vec4, uniform,
          positionLocal, positionWorld, normalWorld,
          mix: tslMix, smoothstep: tslSmoothstep, clamp: tslClamp,
          sin: tslSin, cos: tslCos, abs: tslAbs, exp: tslExp,
          max: tslMax, dot: tslDot, normalize: tslNormalize, length: tslLength,
          select, cameraPosition: tslCameraPosition,
        } = TSL;

        // TSL uniforms — shared across all chunks via the same material
        const uLowColor = uniform(new THREE.Color(config.lowColor || 0x2d5016));
        const uMidColor = uniform(new THREE.Color(config.midColor || 0x4a7023));
        const uHighColor = uniform(new THREE.Color(config.highColor || 0x8b9a6b));
        const uPeakColor = uniform(new THREE.Color(config.peakColor || 0xffffff));
        const uBaseHeight = uniform(config.baseHeight || -2);
        const uAmplitude = uniform(config.amplitude || 8);
        const uFogColor = uniform(new THREE.Color(config.fogColor || 0x000810));
        const uFogNear = uniform(config.fogNear || 50);
        const uFogFar = uniform(config.fogFar || 300);
        const uTime = uniform(0);
        const uBassDeform = uniform(0);
        const uDrumImpact = uniform(0);
        const uPlayerZ = uniform(0);

        const colorNode = Fn(() => {
          const worldPos = positionWorld;
          const localPos = positionLocal;
          const norm = normalWorld;

          // Height-based gradient (0-1 range)
          const h = tslClamp(localPos.y.sub(uBaseHeight).div(uAmplitude), 0, 1);

          // Four-way gradient using select (TSL conditional)
          const lowMid = tslMix(uLowColor, uMidColor, h.mul(3));
          const midHigh = tslMix(uMidColor, uHighColor, h.sub(0.33).mul(3));
          const highPeak = tslMix(uHighColor, uPeakColor, h.sub(0.66).mul(3));
          const gradientColor = select(h.lessThan(0.33), lowMid,
            select(h.lessThan(0.66), midHigh, highPeak));

          // Simple directional lighting
          const lightDir = tslNormalize(vec3(0.5, 1.0, 0.3));
          const diff = tslMax(tslDot(norm, lightDir), float(0));
          const litColor = gradientColor.mul(float(0.4).add(diff.mul(0.6)));

          // Audio-reactive color effects computed per-pixel from world position
          const bassWave = tslSin(worldPos.x.mul(0.08).add(uTime.mul(1.5)))
            .mul(tslCos(worldPos.z.mul(0.06).add(uTime)))
            .mul(uBassDeform);

          const distFromPlayer = tslLength(vec2(worldPos.x, worldPos.z.sub(uPlayerZ)));
          const drumPulse = tslExp(distFromPlayer.negate().mul(0.015)).mul(uDrumImpact);

          const bassGlow = bassWave.mul(0.5);
          const drumFlash = drumPulse;

          const bassColor = vec3(0.2, 0.4, 1.0).mul(tslAbs(bassGlow));
          const drumColor = vec3(1.0, 0.6, 0.2).mul(drumFlash);
          const c = litColor.mul(float(1).add(drumFlash.mul(0.5)))
            .add(bassColor.mul(0.3)).add(drumColor.mul(0.4)).toVar();

          // Fog based on distance from camera
          const viewDist = tslLength(worldPos.sub(tslCameraPosition));
          const fogFactor = tslSmoothstep(uFogNear, uFogFar, viewDist);
          c.assign(tslMix(c, uFogColor, fogFactor));

          return vec4(c, float(1));
        })();

        const mat = new TSL.MeshStandardNodeMaterial({
          side: THREE.FrontSide,
          colorNode: colorNode,
        });

        // Store uniform refs on the material for updates
        mat._tslUniforms = { uTime, uBassDeform, uDrumImpact, uPlayerZ };
        return mat;
      }

      // Default material
      return new THREE.MeshStandardMaterial({
        color: config.color || 0x4a7023,
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true
      });
    }

    /**
     * Get interpolated height at a world position
     */
    getHeightAt(worldX, worldZ) {
      // Convert to local coordinates
      const localX = worldX - this.chunkX;
      const localZ = worldZ - this.chunkZ;

      // Check bounds
      if (localX < 0 || localX > CHUNK_SIZE || localZ < 0 || localZ > CHUNK_SIZE) {
        return null;
      }

      // Convert to grid coordinates
      const gridX = localX / this.cellSize;
      const gridZ = localZ / this.cellSize;

      const x0 = Math.floor(gridX);
      const z0 = Math.floor(gridZ);
      const x1 = Math.min(x0 + 1, CHUNK_SEGMENTS);
      const z1 = Math.min(z0 + 1, CHUNK_SEGMENTS);

      const fx = gridX - x0;
      const fz = gridZ - z0;

      const segments = CHUNK_SEGMENTS + 1;

      // Bilinear interpolation
      const h00 = this.heightmap[x0 * segments + z0];
      const h10 = this.heightmap[x1 * segments + z0];
      const h01 = this.heightmap[x0 * segments + z1];
      const h11 = this.heightmap[x1 * segments + z1];

      const h0 = h00 * (1 - fx) + h10 * fx;
      const h1 = h01 * (1 - fx) + h11 * fx;

      return h0 * (1 - fz) + h1 * fz;
    }

    dispose() {
      if (this.mesh) {
        if (this.mesh.isGroup) {
          // Handle Group structure (wireframe terrain with base plane)
          this.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        } else {
          // Handle single Mesh
          if (this.mesh.geometry) this.mesh.geometry.dispose();
          if (this.mesh.material) this.mesh.material.dispose();
        }
        this.mesh = null;
      }
    }
  }

  /**
   * TerrainManager - Manages terrain chunk lifecycle
   */
  class TerrainManager {
    constructor(THREE, scene, config) {
      this.THREE = THREE;
      this.scene = scene;
      this.config = this.normalizeConfig(config);
      this.chunks = new Map();
      this.chunkPool = [];
      this.enabled = this.config.enabled !== false;

      // Set noise seed for reproducible terrain
      if (config?.seed !== undefined) {
        NoiseGenerator.setSeed(config.seed);
      }
      console.log('TerrainManager created, enabled:', this.enabled, 'config:', this.config);
    }

    normalizeConfig(config) {
      return {
        enabled: config?.enabled !== false,
        scale: config?.scale || 0.02,
        octaves: config?.octaves || 4,
        persistence: config?.persistence || 0.5,
        lacunarity: config?.lacunarity || 2.0,
        amplitude: config?.amplitude || 8.0,
        baseHeight: config?.baseHeight || -2.0,
        ridged: config?.ridged || false,
        terraced: config?.terraced || 0,
        colorByHeight: config?.colorByHeight !== false,
        wireframe: config?.wireframe || false,
        color: config?.color || 0x4a7023,
        lowColor: config?.lowColor || 0x2d5016,
        midColor: config?.midColor || 0x4a7023,
        highColor: config?.highColor || 0x8b9a6b,
        peakColor: config?.peakColor || 0xffffff,
        fogColor: config?.fogColor || 0x000810,
        fogNear: config?.fogNear || 50,
        fogFar: config?.fogFar || 300,
        collisionMargin: config?.collisionMargin || 1.5
      };
    }

    setConfig(config) {
      this.config = this.normalizeConfig(config);
      this.enabled = this.config.enabled !== false;

      // Set noise seed based on config for reproducible terrain
      if (config?.seed !== undefined) {
        NoiseGenerator.setSeed(config.seed);
      }

      // Clear existing chunks when config changes
      this.clearAllChunks();
    }

    updateChunks(playerX, playerZ, chunksAhead = 4, chunksBehind = 2, symmetricRange = 0) {
      if (!this.enabled) return;

      // Calculate which chunks should exist
      const playerChunkX = Math.floor(playerX / CHUNK_SIZE) * CHUNK_SIZE;
      const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE) * CHUNK_SIZE;

      const neededChunks = new Set();

      if (symmetricRange > 0) {
        // Symmetric grid: ±range in both X and Z (for omnidirectional flight)
        for (let dx = -symmetricRange; dx <= symmetricRange; dx++) {
          for (let dz = -symmetricRange; dz <= symmetricRange; dz++) {
            const chunkX = playerChunkX + dx * CHUNK_SIZE;
            const chunkZ = playerChunkZ + dz * CHUNK_SIZE;
            const key = `${chunkX},${chunkZ}`;
            neededChunks.add(key);
            if (!this.chunks.has(key)) {
              this.createChunk(chunkX, chunkZ, key);
            }
          }
        }
      } else {
        // Original asymmetric grid (forward-facing flight)
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -chunksBehind; dz <= chunksAhead; dz++) {
            const chunkX = playerChunkX + dx * CHUNK_SIZE;
            const chunkZ = playerChunkZ + dz * CHUNK_SIZE;
            const key = `${chunkX},${chunkZ}`;
            neededChunks.add(key);
            if (!this.chunks.has(key)) {
              this.createChunk(chunkX, chunkZ, key);
            }
          }
        }
      }

      // Remove chunks that are no longer needed
      for (const [key, chunk] of this.chunks) {
        if (!neededChunks.has(key)) {
          this.removeChunk(key, chunk);
        }
      }
    }

    createChunk(chunkX, chunkZ, key) {
      // Try to reuse from pool
      let chunk = this.chunkPool.pop();
      if (chunk) {
        // Reinitialize pooled chunk
        chunk.chunkX = chunkX;
        chunk.chunkZ = chunkZ;
        chunk.config = this.config;
        chunk.generateHeightmap();
        chunk.buildMesh();
      } else {
        chunk = new TerrainChunk(this.THREE, chunkX, chunkZ, this.config);
      }

      this.chunks.set(key, chunk);
      this.scene.add(chunk.mesh);
      console.log('Terrain chunk created at', chunkX, chunkZ, 'mesh Y range:',
        Math.min(...chunk.heightmap), 'to', Math.max(...chunk.heightmap));
    }

    removeChunk(key, chunk) {
      this.scene.remove(chunk.mesh);
      this.chunks.delete(key);

      // Add to pool for reuse (limit pool size)
      if (this.chunkPool.length < 20) {
        chunk.dispose();
        this.chunkPool.push(chunk);
      } else {
        chunk.dispose();
      }
    }

    clearAllChunks() {
      for (const [key, chunk] of this.chunks) {
        this.scene.remove(chunk.mesh);
        chunk.dispose();
      }
      this.chunks.clear();
    }

    /**
     * Get terrain height at world position
     * Returns null if no terrain chunk covers that position
     */
    getTerrainHeightAt(worldX, worldZ) {
      if (!this.enabled) return null;

      const chunkX = Math.floor(worldX / CHUNK_SIZE) * CHUNK_SIZE;
      const chunkZ = Math.floor(worldZ / CHUNK_SIZE) * CHUNK_SIZE;
      const key = `${chunkX},${chunkZ}`;

      const chunk = this.chunks.get(key);
      if (!chunk) {
        // Fallback: sample noise directly
        return NoiseGenerator.sampleTerrain(worldX, worldZ, this.config);
      }

      return chunk.getHeightAt(worldX, worldZ);
    }

    /**
     * Get collision clearance height (terrain + margin)
     */
    getCollisionHeight(worldX, worldZ) {
      const terrainHeight = this.getTerrainHeightAt(worldX, worldZ);
      if (terrainHeight === null) return null;
      return terrainHeight + this.config.collisionMargin;
    }

    update(audioData, time) {
      // Audio-reactive terrain animation
      if (!audioData) return;

      const bassDeform = audioData.bassDeform || 0;
      const drumImpact = audioData.drumImpact || 0;
      const playerZ = audioData.playerZ || 0;

      // Debug: log once
      if (!this._audioDebugLogged && (bassDeform > 0.01 || drumImpact > 0.01)) {
        console.log("[TerrainManager] Updating uniforms - bass:", bassDeform.toFixed(2), "drums:", drumImpact.toFixed(2));
        console.log("[TerrainManager] Chunks:", this.chunks.size);
        this._audioDebugLogged = true;
      }

      let uniformsUpdated = 0;
      // Update TSL uniforms in all chunk materials
      for (const chunk of this.chunks.values()) {
        if (chunk.mesh) {
          const meshes = chunk.mesh.isGroup ? chunk.mesh.children : [chunk.mesh];
          for (const mesh of meshes) {
            if (mesh.material?._tslUniforms) {
              const u = mesh.material._tslUniforms;
              u.uTime.value = time;
              u.uBassDeform.value = bassDeform;
              u.uDrumImpact.value = drumImpact;
              u.uPlayerZ.value = playerZ;
              uniformsUpdated++;
            }
          }
        }
      }

      // Debug: log uniform update count once
      if (!this._uniformDebugLogged && uniformsUpdated > 0) {
        console.log("[TerrainManager] Updated uniforms on", uniformsUpdated, "meshes");
        this._uniformDebugLogged = true;
      }
    }

    dispose() {
      this.clearAllChunks();
      this.chunkPool = [];
    }
  }

  return {
    TerrainChunk,
    TerrainManager,
    CHUNK_SIZE,
    CHUNK_SEGMENTS
  };
})();
