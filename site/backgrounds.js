/*
  ANIMATED BACKGROUND SYSTEM
  --------------------------
  Shader-based animated backgrounds for each track theme.

  Background Types:
  - topo: Topographic/contour map lines (morphing elevation)
  - ocean: Flowing ocean waves
  - nebula: Cosmic cloud/gas effect
  - matrix: Digital rain / neural network
  - aurora: Northern lights ribbons
  - forge: Industrial heat/metal glow
  - sakura: Soft floating petal patterns
  - circuit: Pulsing circuit board traces
  - glacier: Ice crystal formations
  - savanna: Heat shimmer / dust waves
*/

class AnimatedBackground {
  constructor(THREE, scene, config = {}) {
    this.THREE = THREE;
    this.scene = scene;
    this.config = config;
    this.mesh = null;
    this.material = null;
    this.time = 0;
    this.audioEnergy = 0;
    this.audioBass = 0;

    this.create();
  }

  create() {
    const geometry = new this.THREE.PlaneGeometry(2, 2);

    this.material = new this.THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new this.THREE.Vector2(window.innerWidth, window.innerHeight) },
        uColor1: { value: new this.THREE.Color(this.config.color1 || 0x000510) },
        uColor2: { value: new this.THREE.Color(this.config.color2 || 0x001830) },
        uColor3: { value: new this.THREE.Color(this.config.color3 || 0x003366) },
        uAccent: { value: new this.THREE.Color(this.config.accent || 0x00ffff) },
        uSpeed: { value: this.config.speed || 1.0 },
        uIntensity: { value: this.config.intensity || 0.5 },
        uScale: { value: this.config.scale || 1.0 },
        uAudioEnergy: { value: 0 },
        uAudioBass: { value: 0 }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(this.config.type || 'topo'),
      depthWrite: false,
      depthTest: false
    });

    this.mesh = new this.THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;

    // Create a separate scene and camera for the background
    this.bgScene = new this.THREE.Scene();
    this.bgCamera = new this.THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.bgScene.add(this.mesh);
  }

  getVertexShader() {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;
  }

  getFragmentShader(type) {
    const common = `
      precision highp float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uAccent;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uScale;
      uniform float uAudioEnergy;
      uniform float uAudioBass;

      varying vec2 vUv;

      // Noise functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      float fbm(vec3 p, int octaves) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 6; i++) {
          if (i >= octaves) break;
          value += amplitude * snoise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value;
      }
    `;

    const shaders = {
      // Topographic contour map - morphing elevation lines
      topo: `
        ${common}
        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed * 0.15;

          // Create morphing elevation field
          vec3 p = vec3(uv * uScale * 3.0, t);
          float elevation = fbm(p, 5);
          elevation += 0.3 * snoise(vec3(uv * uScale * 6.0, t * 0.5));

          // Audio reactivity affects elevation
          elevation += uAudioBass * 0.2;

          // Create contour lines
          float contours = fract(elevation * (8.0 + uAudioEnergy * 4.0));
          float line = smoothstep(0.0, 0.08, contours) * smoothstep(0.15, 0.08, contours);
          line += smoothstep(0.0, 0.03, contours) * smoothstep(0.05, 0.03, contours) * 0.5;

          // Color based on elevation
          vec3 baseColor = mix(uColor1, uColor2, elevation * 0.5 + 0.5);
          baseColor = mix(baseColor, uColor3, smoothstep(0.3, 0.7, elevation));

          // Add contour line color
          vec3 lineColor = mix(uAccent, uColor3, 0.3);
          vec3 color = mix(baseColor, lineColor, line * uIntensity);

          // Subtle glow at peaks
          float peak = smoothstep(0.5, 0.8, elevation);
          color += uAccent * peak * 0.15 * (1.0 + uAudioEnergy);

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Ocean waves - flowing water surface
      ocean: `
        ${common}
        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed * 0.2;

          // Multiple wave layers
          float wave1 = snoise(vec3(uv * uScale * 2.0 + vec2(t, 0.0), t * 0.3));
          float wave2 = snoise(vec3(uv * uScale * 4.0 - vec2(t * 0.7, t * 0.3), t * 0.2)) * 0.5;
          float wave3 = snoise(vec3(uv * uScale * 8.0 + vec2(t * 0.5, -t * 0.4), t * 0.1)) * 0.25;

          float waves = wave1 + wave2 + wave3;
          waves += uAudioBass * 0.3;

          // Caustic-like patterns
          float caustic = snoise(vec3(uv * uScale * 12.0 + waves * 0.5, t * 0.5));
          caustic = pow(abs(caustic), 2.0) * 0.5;

          // Deep to surface color gradient
          vec3 color = mix(uColor1, uColor2, uv.y + waves * 0.2);
          color = mix(color, uColor3, smoothstep(-0.2, 0.5, waves));

          // Add caustics and highlights
          color += uAccent * caustic * uIntensity * (1.0 + uAudioEnergy);

          // Surface shimmer
          float shimmer = pow(max(0.0, waves), 3.0) * 0.3;
          color += vec3(shimmer) * (1.0 + uAudioEnergy * 0.5);

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Nebula - cosmic gas clouds
      nebula: `
        ${common}
        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed * 0.1;

          // Swirling nebula clouds
          vec2 center = vec2(0.5);
          vec2 toCenter = uv - center;
          float angle = atan(toCenter.y, toCenter.x);
          float dist = length(toCenter);

          // Spiral distortion
          float spiral = angle + dist * 3.0 - t;
          vec2 distortedUv = uv + vec2(cos(spiral), sin(spiral)) * 0.1 * uAudioBass;

          // Layered cloud noise
          float cloud1 = fbm(vec3(distortedUv * uScale * 2.0, t), 5);
          float cloud2 = fbm(vec3(distortedUv * uScale * 4.0 + 10.0, t * 0.7), 4);
          float cloud3 = fbm(vec3(distortedUv * uScale * 1.0, t * 0.3), 3);

          // Combine clouds
          float nebula = cloud1 * 0.5 + cloud2 * 0.3 + cloud3 * 0.2;
          nebula += uAudioEnergy * 0.2;

          // Color mapping
          vec3 color = uColor1;
          color = mix(color, uColor2, smoothstep(-0.3, 0.3, nebula));
          color = mix(color, uColor3, smoothstep(0.2, 0.6, nebula));
          color = mix(color, uAccent, smoothstep(0.5, 0.9, nebula) * uIntensity);

          // Star points
          float stars = pow(snoise(vec3(uv * 50.0, 0.0)), 20.0);
          color += vec3(stars) * 0.5;

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Matrix - digital rain / neural network
      matrix: `
        ${common}

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed;

          // Grid cells
          float cellSize = 0.03 / uScale;
          vec2 cell = floor(uv / cellSize);
          vec2 cellUv = fract(uv / cellSize);

          // Rain drops falling at different speeds
          float speed = random(vec2(cell.x, 0.0)) * 2.0 + 0.5;
          float offset = random(vec2(cell.x, 1.0));
          float drop = fract(t * speed * 0.3 + offset);

          // Trail effect
          float trail = smoothstep(0.0, 0.7, 1.0 - drop);
          trail *= smoothstep(1.0, 0.8, 1.0 - drop);

          // Character-like blocks
          float charNoise = random(cell + floor(t * speed));
          float char = step(0.3, charNoise) * step(charNoise, 0.9);

          // Vertical position affects brightness
          float brightness = (1.0 - uv.y) * trail * char;
          brightness += uAudioEnergy * 0.3 * char;

          // Connection lines (neural network)
          float connections = 0.0;
          for (int i = -1; i <= 1; i++) {
            vec2 neighborCell = cell + vec2(float(i), 0.0);
            float neighborActive = step(0.5, random(neighborCell + floor(t * 0.5)));
            float line = 1.0 - abs(cellUv.x - 0.5) * 2.0;
            connections += line * neighborActive * 0.1;
          }

          // Color
          vec3 color = uColor1;
          color = mix(color, uColor2, uv.y);
          color += uAccent * brightness * uIntensity;
          color += uColor3 * connections * uAudioBass;

          // Scanline effect
          float scanline = sin(uv.y * 200.0 + t * 10.0) * 0.02;
          color += vec3(scanline);

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Aurora - northern lights ribbons
      aurora: `
        ${common}
        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed * 0.15;

          // Multiple aurora ribbons
          float aurora = 0.0;
          for (int i = 0; i < 4; i++) {
            float fi = float(i);
            float offset = fi * 0.2;
            float freq = 2.0 + fi * 0.5;
            float amp = 0.15 - fi * 0.03;

            float wave = sin(uv.x * freq * uScale + t + offset) * amp;
            wave += snoise(vec3(uv.x * uScale * 3.0, t * 0.5, fi)) * 0.1;

            float ribbon = smoothstep(0.0, 0.1, uv.y - 0.3 - wave - offset * 0.3);
            ribbon *= smoothstep(0.3, 0.15, uv.y - 0.3 - wave - offset * 0.3);

            aurora += ribbon * (1.0 - fi * 0.2);
          }

          aurora *= 1.0 + uAudioEnergy * 0.5;
          aurora += uAudioBass * 0.1;

          // Shimmer
          float shimmer = snoise(vec3(uv * uScale * 10.0, t * 2.0)) * 0.3 + 0.7;
          aurora *= shimmer;

          // Color gradient through the aurora
          vec3 auroraColor = mix(uColor3, uAccent, snoise(vec3(uv.x * 5.0, t, 0.0)) * 0.5 + 0.5);
          auroraColor = mix(auroraColor, uColor2, uv.y);

          // Base sky gradient
          vec3 sky = mix(uColor1, uColor2 * 0.5, uv.y);

          // Stars
          float stars = pow(snoise(vec3(uv * 80.0, 0.0)), 25.0) * (1.0 - aurora);

          vec3 color = mix(sky, auroraColor, aurora * uIntensity);
          color += vec3(stars) * 0.3;

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Forge - industrial heat/molten metal
      forge: `
        ${common}

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed * 0.2;

          // Heat distortion
          vec2 distort = vec2(
            snoise(vec3(uv * uScale * 5.0, t)) * 0.02,
            snoise(vec3(uv * uScale * 5.0 + 100.0, t)) * 0.02
          );
          vec2 distortedUv = uv + distort * (1.0 + uAudioBass);

          // Molten cracks
          float cracks = 0.0;
          for (int i = 0; i < 3; i++) {
            float fi = float(i);
            float scale = 3.0 + fi * 2.0;
            float crack = abs(snoise(vec3(distortedUv * uScale * scale, t * 0.3 + fi)));
            crack = pow(1.0 - crack, 8.0 + fi * 4.0);
            cracks += crack * (1.0 - fi * 0.25);
          }

          cracks *= 1.0 + uAudioEnergy * 0.5;

          // Heat glow from bottom
          float heatGlow = pow(1.0 - uv.y, 2.0) * 0.5;
          heatGlow += snoise(vec3(uv.x * uScale * 10.0, t * 2.0, 0.0)) * 0.1 * (1.0 - uv.y);

          // Color: dark metal to glowing orange
          vec3 color = uColor1;
          color = mix(color, uColor2, heatGlow);
          color = mix(color, uColor3, cracks * 0.5);
          color = mix(color, uAccent, cracks * uIntensity);

          // Spark particles
          float sparks = pow(random(floor(uv * 50.0) + floor(t * 10.0)), 15.0);
          sparks *= step(0.7, uv.y) * uAudioEnergy;
          color += uAccent * sparks * 2.0;

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Sakura - soft floating petal patterns
      sakura: `
        ${common}
        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed * 0.1;

          // Soft flowing background
          float bg = fbm(vec3(uv * uScale * 1.5, t * 0.2), 3);

          // Petal-like shapes floating
          float petals = 0.0;
          for (int i = 0; i < 5; i++) {
            float fi = float(i);
            vec2 petalUv = uv;

            // Drift motion
            petalUv.x += sin(t * 0.3 + fi) * 0.1;
            petalUv.y -= t * 0.05 * (1.0 + fi * 0.2);
            petalUv = fract(petalUv + fi * 0.2);

            // Petal shape
            vec2 center = vec2(0.5);
            float d = length((petalUv - center) * vec2(1.0, 2.0));
            float petal = smoothstep(0.15, 0.1, d);
            petal *= smoothstep(0.0, 0.05, petalUv.y - 0.3);

            petals += petal * (0.8 - fi * 0.1);
          }

          petals *= 1.0 + uAudioEnergy * 0.3;

          // Gentle color gradient
          vec3 color = mix(uColor1, uColor2, uv.y + bg * 0.2);
          color = mix(color, uColor3, petals * 0.5);
          color = mix(color, uAccent, petals * uIntensity * 0.7);

          // Soft bloom
          float bloom = smoothstep(0.3, 0.7, bg) * 0.1;
          color += uAccent * bloom;

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Circuit - pulsing circuit board traces
      circuit: `
        ${common}

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed * 0.5;

          // Grid
          float gridSize = 0.05 / uScale;
          vec2 cell = floor(uv / gridSize);
          vec2 cellUv = fract(uv / gridSize);

          // Traces
          float trace = 0.0;

          // Horizontal traces
          float hRand = random(vec2(cell.y, 0.0));
          if (hRand > 0.5) {
            trace += smoothstep(0.0, 0.1, cellUv.y) * smoothstep(0.3, 0.2, cellUv.y);
          }

          // Vertical traces
          float vRand = random(vec2(cell.x, 1.0));
          if (vRand > 0.5) {
            trace += smoothstep(0.0, 0.1, cellUv.x) * smoothstep(0.3, 0.2, cellUv.x);
          }

          // Nodes at intersections
          float node = length(cellUv - 0.5);
          node = smoothstep(0.15, 0.1, node) * step(0.7, random(cell));

          // Pulse traveling along traces
          float pulse = sin(cell.x * 0.5 + cell.y * 0.3 - t * 2.0) * 0.5 + 0.5;
          pulse = pow(pulse, 4.0);

          // Audio reactive pulse
          pulse *= 1.0 + uAudioEnergy;
          float bassPulse = uAudioBass * step(0.8, random(cell + floor(t)));

          // Color
          vec3 color = uColor1;
          color = mix(color, uColor2, trace * 0.5);
          color += uColor3 * trace * pulse * 0.5;
          color += uAccent * (trace * pulse + node + bassPulse) * uIntensity;

          // Glow
          float glow = trace * pulse * 0.2;
          color += uAccent * glow;

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Glacier - ice crystal formations
      glacier: `
        ${common}
        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed * 0.08;

          // Ice crystal noise (sharp, angular)
          float ice1 = abs(snoise(vec3(uv * uScale * 3.0, t)));
          float ice2 = abs(snoise(vec3(uv * uScale * 6.0, t * 0.7)));
          float ice3 = abs(snoise(vec3(uv * uScale * 12.0, t * 0.5)));

          // Combine for crystal structure
          float crystals = pow(ice1, 0.5) * 0.5 + pow(ice2, 0.7) * 0.3 + pow(ice3, 0.9) * 0.2;
          crystals += uAudioBass * 0.15;

          // Frost patterns (finer detail)
          float frost = snoise(vec3(uv * uScale * 20.0, t * 0.3));
          frost = smoothstep(0.3, 0.5, abs(frost));

          // Cracks in ice
          float cracks = 1.0 - pow(snoise(vec3(uv * uScale * 8.0, t * 0.1)), 2.0);
          cracks = smoothstep(0.7, 0.9, cracks);

          // Deep blue to white gradient
          vec3 color = uColor1;
          color = mix(color, uColor2, crystals);
          color = mix(color, uColor3, frost * 0.3);
          color = mix(color, uAccent, cracks * uIntensity * 0.5);

          // Ice shimmer
          float shimmer = pow(snoise(vec3(uv * 30.0, t * 3.0)) * 0.5 + 0.5, 8.0);
          shimmer *= 1.0 + uAudioEnergy * 0.5;
          color += vec3(0.8, 0.9, 1.0) * shimmer * 0.2;

          // Subtle white peaks
          color += vec3(1.0) * smoothstep(0.7, 1.0, crystals) * 0.2;

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Savanna - heat shimmer and dust waves
      savanna: `
        ${common}
        void main() {
          vec2 uv = vUv;
          float t = uTime * uSpeed * 0.15;

          // Heat shimmer distortion
          vec2 shimmer = vec2(
            sin(uv.y * 20.0 + t * 2.0) * 0.003,
            cos(uv.x * 15.0 + t * 1.5) * 0.002
          );
          shimmer *= (1.0 - uv.y) * 2.0; // More shimmer near horizon
          vec2 distortedUv = uv + shimmer;

          // Dust layers
          float dust1 = snoise(vec3(distortedUv * uScale * 2.0 + vec2(t * 0.2, 0.0), t * 0.1));
          float dust2 = snoise(vec3(distortedUv * uScale * 4.0 + vec2(t * 0.3, 0.0), t * 0.15));
          float dust = dust1 * 0.6 + dust2 * 0.4;
          dust += uAudioBass * 0.2;

          // Sunset gradient (bottom to top: orange -> pink -> purple -> dark)
          float gradientPos = uv.y + dust * 0.1;
          vec3 color = uColor1; // Dark top
          color = mix(uColor2, color, smoothstep(0.0, 0.4, gradientPos)); // Mid purple
          color = mix(uColor3, color, smoothstep(0.0, 0.25, gradientPos)); // Orange horizon
          color = mix(uAccent, color, smoothstep(0.0, 0.15, gradientPos)); // Bright horizon line

          // Sun glow
          vec2 sunPos = vec2(0.5, 0.1);
          float sunDist = length(uv - sunPos);
          float sun = smoothstep(0.15, 0.0, sunDist);
          float sunGlow = smoothstep(0.4, 0.0, sunDist) * 0.3;
          color += uAccent * (sun + sunGlow) * (1.0 + uAudioEnergy * 0.3);

          // Dust particles
          float particles = pow(snoise(vec3(uv * 50.0, t)), 15.0) * (1.0 - uv.y);
          color += uColor3 * particles * 0.5;

          gl_FragColor = vec4(color, 1.0);
        }
      `
    };

    return shaders[type] || shaders.topo;
  }

  update(deltaTime, audioData = {}) {
    if (!this.material) return;

    this.time += deltaTime;
    this.material.uniforms.uTime.value = this.time;

    // Smooth audio values
    const targetEnergy = audioData.energy || 0;
    const targetBass = audioData.bass || 0;
    this.audioEnergy += (targetEnergy - this.audioEnergy) * 0.1;
    this.audioBass += (targetBass - this.audioBass) * 0.1;

    this.material.uniforms.uAudioEnergy.value = this.audioEnergy;
    this.material.uniforms.uAudioBass.value = this.audioBass;
  }

  render(renderer) {
    if (!this.bgScene || !this.bgCamera) {
      console.warn("AnimatedBackground.render: missing bgScene or bgCamera");
      return;
    }
    if (!renderer) {
      console.warn("AnimatedBackground.render: no renderer provided");
      return;
    }

    // Render background with clearing enabled (clears canvas and draws background)
    // Main scene should then render with autoClearColor = false to preserve this
    renderer.render(this.bgScene, this.bgCamera);
  }

  setColors(config) {
    if (!this.material) return;

    if (config.color1 !== undefined) {
      this.material.uniforms.uColor1.value.set(config.color1);
    }
    if (config.color2 !== undefined) {
      this.material.uniforms.uColor2.value.set(config.color2);
    }
    if (config.color3 !== undefined) {
      this.material.uniforms.uColor3.value.set(config.color3);
    }
    if (config.accent !== undefined) {
      this.material.uniforms.uAccent.value.set(config.accent);
    }
    if (config.speed !== undefined) {
      this.material.uniforms.uSpeed.value = config.speed;
    }
    if (config.intensity !== undefined) {
      this.material.uniforms.uIntensity.value = config.intensity;
    }
    if (config.scale !== undefined) {
      this.material.uniforms.uScale.value = config.scale;
    }
  }

  resize(width, height) {
    if (this.material) {
      this.material.uniforms.uResolution.value.set(width, height);
    }
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.bgScene.remove(this.mesh);
    }
  }
}

// Export for use
window.AnimatedBackground = AnimatedBackground;
