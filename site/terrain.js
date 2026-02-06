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
        // Shader material with height-based gradient and audio reactivity (color-based, not vertex)
        return new THREE.ShaderMaterial({
          uniforms: {
            lowColor: { value: new THREE.Color(config.lowColor || 0x2d5016) },
            midColor: { value: new THREE.Color(config.midColor || 0x4a7023) },
            highColor: { value: new THREE.Color(config.highColor || 0x8b9a6b) },
            peakColor: { value: new THREE.Color(config.peakColor || 0xffffff) },
            baseHeight: { value: config.baseHeight || -2 },
            amplitude: { value: config.amplitude || 8 },
            fogColor: { value: new THREE.Color(config.fogColor || 0x000810) },
            fogNear: { value: config.fogNear || 50 },
            fogFar: { value: config.fogFar || 300 },
            // Audio-reactive uniforms (color-based effects)
            uTime: { value: 0.0 },
            uBassDeform: { value: 0.0 },
            uDrumImpact: { value: 0.0 },
            uPlayerZ: { value: 0.0 }
          },
          vertexShader: `
            uniform float uTime;
            uniform float uBassDeform;
            uniform float uDrumImpact;
            uniform float uPlayerZ;

            varying float vHeight;
            varying vec3 vNormal;
            varying float vFogDepth;
            varying float vBassWave;
            varying float vDrumPulse;
            varying vec3 vWorldPos;

            void main() {
              vec3 pos = position;
              vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

              // Calculate audio effects for fragment shader (color-based, no vertex displacement)
              vBassWave = sin(vWorldPos.x * 0.08 + uTime * 1.5) * cos(vWorldPos.z * 0.06 + uTime) * uBassDeform;

              float distFromPlayer = length(vec2(vWorldPos.x, vWorldPos.z - uPlayerZ));
              vDrumPulse = exp(-distFromPlayer * 0.015) * uDrumImpact;

              vHeight = pos.y;
              vNormal = normalize(normalMatrix * normal);
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              vFogDepth = -mvPosition.z;
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform vec3 lowColor;
            uniform vec3 midColor;
            uniform vec3 highColor;
            uniform vec3 peakColor;
            uniform float baseHeight;
            uniform float amplitude;
            uniform vec3 fogColor;
            uniform float fogNear;
            uniform float fogFar;

            varying float vHeight;
            varying vec3 vNormal;
            varying float vFogDepth;
            varying float vBassWave;
            varying float vDrumPulse;
            varying vec3 vWorldPos;

            void main() {
              // Normalize height to 0-1 range
              float h = clamp((vHeight - baseHeight) / amplitude, 0.0, 1.0);

              // Four-way gradient
              vec3 color;
              if (h < 0.33) {
                color = mix(lowColor, midColor, h * 3.0);
              } else if (h < 0.66) {
                color = mix(midColor, highColor, (h - 0.33) * 3.0);
              } else {
                color = mix(highColor, peakColor, (h - 0.66) * 3.0);
              }

              // Simple directional lighting
              vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
              float diff = max(dot(vNormal, lightDir), 0.0);
              color = color * (0.4 + 0.6 * diff);

              // Audio-reactive color effects (bass = wave glow, drums = bright pulse)
              float bassGlow = vBassWave * 0.5;
              float drumFlash = vDrumPulse * 1.0;

              // Add visible color tint: bass adds blue, drums add warm flash
              vec3 bassColor = vec3(0.2, 0.4, 1.0) * abs(bassGlow);
              vec3 drumColor = vec3(1.0, 0.6, 0.2) * drumFlash;
              color = color * (1.0 + drumFlash * 0.5) + bassColor * 0.3 + drumColor * 0.4;

              // Apply fog
              float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
              color = mix(color, fogColor, fogFactor);

              gl_FragColor = vec4(color, 1.0);
            }
          `,
          side: THREE.FrontSide
        });
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

    updateChunks(playerX, playerZ, chunksAhead = 4, chunksBehind = 2) {
      if (!this.enabled) return;

      // Calculate which chunks should exist
      const playerChunkX = Math.floor(playerX / CHUNK_SIZE) * CHUNK_SIZE;
      const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE) * CHUNK_SIZE;

      const neededChunks = new Set();

      // Generate chunks in a grid around player
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -chunksBehind; dz <= chunksAhead; dz++) {
          const chunkX = playerChunkX + dx * CHUNK_SIZE;
          const chunkZ = playerChunkZ + dz * CHUNK_SIZE;
          const key = `${chunkX},${chunkZ}`;
          neededChunks.add(key);

          // Create chunk if it doesn't exist
          if (!this.chunks.has(key)) {
            this.createChunk(chunkX, chunkZ, key);
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
      // Update uniforms in all chunk materials
      for (const chunk of this.chunks.values()) {
        if (chunk.mesh) {
          // Handle both single mesh and group structures
          const meshes = chunk.mesh.isGroup ? chunk.mesh.children : [chunk.mesh];
          for (const mesh of meshes) {
            if (mesh.material && mesh.material.uniforms) {
              if (mesh.material.uniforms.uTime) {
                mesh.material.uniforms.uTime.value = time;
                mesh.material.uniforms.uBassDeform.value = bassDeform;
                mesh.material.uniforms.uDrumImpact.value = drumImpact;
                mesh.material.uniforms.uPlayerZ.value = playerZ;
                uniformsUpdated++;
              }
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
