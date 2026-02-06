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
    this.audioMid = 0;
    this.audioTreble = 0;
    this.beatPulse = 0;
    this.audioReactivity = 1.0; // Global multiplier for all audio effects (0-1)

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
        uAudioBass: { value: 0 },
        uAudioMid: { value: 0 },
        uAudioTreble: { value: 0 },
        uBeatPulse: { value: 0 },
        uAudioReactivity: { value: 1.0 }
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
      uniform float uAudioMid;
      uniform float uAudioTreble;
      uniform float uBeatPulse;
      uniform float uAudioReactivity;

      varying vec2 vUv;

      // Standardized audio values - all backgrounds use the same reactivity
      float aEnergy() { return uAudioEnergy * uAudioReactivity; }
      float aBass() { return uAudioBass * uAudioReactivity; }
      float aMid() { return uAudioMid * uAudioReactivity; }
      float aTreble() { return uAudioTreble * uAudioReactivity; }
      float aBeat() { return uBeatPulse * uAudioReactivity; }

      // Audio-reactive scale - creates zoom/pulse effect with bass
      // Standardized: 20% zoom on bass, 15% on beat
      vec2 audioScale(vec2 uv) {
        vec2 centered = uv - 0.5;
        float pulse = 1.0 - aBass() * 0.20 - aBeat() * 0.15;
        return centered * pulse + 0.5;
      }

      // Audio-reactive brightness boost
      // Standardized: 50% boost on beat, 40% on energy
      float audioBrightness() {
        return 1.0 + aBeat() * 0.5 + aEnergy() * 0.4;
      }

      // Vignette that pulses with music
      // Standardized: vignette opens 50% with energy
      float audioVignette(vec2 uv) {
        vec2 centered = uv - 0.5;
        float dist = length(centered);
        float vignette = 1.0 - dist * (0.7 - aEnergy() * 0.5);
        return clamp(vignette, 0.0, 1.0);
      }

      // Glow overlay for beat hits
      // Standardized: 80% glow intensity on beats
      vec3 beatGlow(vec3 color, vec2 uv) {
        vec2 centered = uv - 0.5;
        float dist = length(centered);
        float glow = exp(-dist * 2.0) * aBeat() * 0.8;
        return color + uAccent * glow;
      }

      // Color saturation boost with energy
      vec3 audioSaturate(vec3 color) {
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        float satBoost = 1.0 + aEnergy() * 0.3 + aBeat() * 0.2;
        return mix(vec3(gray), color, satBoost);
      }

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
      // DEBUG: Simple test shader - bright magenta
      debug: `
        ${common}
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // Bright magenta
        }
      `,

      // Topographic contour map - morphing elevation lines
      topo: `
        ${common}
        void main() {
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed * 0.15;

          // Create morphing elevation field with bass-driven distortion
          vec3 p = vec3(uv * uScale * 3.0, t);
          float elevation = fbm(p, 5);
          elevation += 0.3 * snoise(vec3(uv * uScale * 6.0, t * 0.5));

          // Audio reactivity affects elevation - standardized
          elevation += aBass() * 0.4 + aBeat() * 0.3;

          // Create contour lines - more lines appear with energy
          float contourDensity = 8.0 + aEnergy() * 8.0 + aMid() * 4.0;
          float contours = fract(elevation * contourDensity);
          float line = smoothstep(0.0, 0.08, contours) * smoothstep(0.15, 0.08, contours);
          line += smoothstep(0.0, 0.03, contours) * smoothstep(0.05, 0.03, contours) * 0.5;

          // Line thickness pulses with beat
          line *= 1.0 + aBeat() * 0.5;

          // Color based on elevation
          vec3 baseColor = mix(uColor1, uColor2, elevation * 0.5 + 0.5);
          baseColor = mix(baseColor, uColor3, smoothstep(0.3, 0.7, elevation));

          // Add contour line color - brighter with energy
          vec3 lineColor = mix(uAccent, uColor3, 0.3 - aEnergy() * 0.2);
          vec3 color = mix(baseColor, lineColor, line * uIntensity);

          // Glow at peaks pulses with music
          float peak = smoothstep(0.5, 0.8, elevation);
          color += uAccent * peak * 0.3 * audioBrightness();

          // Add beat glow and vignette
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);
          color *= audioBrightness();

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Ocean waves - flowing water surface
      ocean: `
        ${common}
        void main() {
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed * 0.2;

          // Wave intensity driven by audio - standardized
          float waveAmp = 1.0 + aBass() * 0.8 + aBeat() * 0.5;

          // Multiple wave layers - amplitude increases with bass
          float wave1 = snoise(vec3(uv * uScale * 2.0 + vec2(t, 0.0), t * 0.3)) * waveAmp;
          float wave2 = snoise(vec3(uv * uScale * 4.0 - vec2(t * 0.7, t * 0.3), t * 0.2)) * 0.5 * waveAmp;
          float wave3 = snoise(vec3(uv * uScale * 8.0 + vec2(t * 0.5, -t * 0.4), t * 0.1)) * 0.25 * waveAmp;

          float waves = wave1 + wave2 + wave3;
          waves += aBass() * 0.5 + aBeat() * 0.4;

          // Caustic-like patterns - more intense with treble
          float causticIntensity = uScale * 12.0 + aTreble() * 4.0;
          float caustic = snoise(vec3(uv * causticIntensity + waves * 0.5, t * 0.5));
          caustic = pow(abs(caustic), 2.0) * (0.5 + aMid() * 0.5);

          // Deep to surface color gradient
          vec3 color = mix(uColor1, uColor2, uv.y + waves * 0.2);
          color = mix(color, uColor3, smoothstep(-0.2, 0.5, waves));

          // Add caustics and highlights - pulse with beat
          color += uAccent * caustic * uIntensity * audioBrightness();

          // Surface shimmer pulses dramatically
          float shimmer = pow(max(0.0, waves), 3.0) * 0.5;
          shimmer *= 1.0 + aBeat() * 1.5 + aEnergy();
          color += vec3(shimmer);

          // Beat glow and brightness
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);
          color *= audioBrightness();

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Nebula - cosmic gas clouds
      nebula: `
        ${common}
        void main() {
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed * 0.1;

          // Swirling nebula clouds
          vec2 center = vec2(0.5);
          vec2 toCenter = uv - center;
          float angle = atan(toCenter.y, toCenter.x);
          float dist = length(toCenter);

          // Spiral distortion - driven by bass and beat - standardized
          float spiralSpeed = 3.0 + aBass() * 2.0;
          float spiral = angle + dist * spiralSpeed - t * (1.0 + aEnergy() * 0.5);
          float distortAmount = 0.1 + aBass() * 0.2 + aBeat() * 0.15;
          vec2 distortedUv = uv + vec2(cos(spiral), sin(spiral)) * distortAmount;

          // Layered cloud noise - intensity varies with audio
          float cloudScale = uScale * (1.0 + aMid() * 0.3);
          float cloud1 = fbm(vec3(distortedUv * cloudScale * 2.0, t), 5);
          float cloud2 = fbm(vec3(distortedUv * cloudScale * 4.0 + 10.0, t * 0.7), 4);
          float cloud3 = fbm(vec3(distortedUv * cloudScale * 1.0, t * 0.3), 3);

          // Combine clouds - more dramatic with audio
          float nebula = cloud1 * 0.5 + cloud2 * 0.3 + cloud3 * 0.2;
          nebula += aEnergy() * 0.4 + aBeat() * 0.3;

          // Color mapping - shifts with audio
          vec3 color = uColor1;
          float colorShift = aMid() * 0.2;
          color = mix(color, uColor2, smoothstep(-0.3 - colorShift, 0.3 + colorShift, nebula));
          color = mix(color, uColor3, smoothstep(0.2 - colorShift, 0.6 + colorShift, nebula));
          color = mix(color, uAccent, smoothstep(0.4, 0.8, nebula) * uIntensity * (1.0 + aBeat()));

          // Star points - twinkle with treble
          float starScale = 50.0 + aTreble() * 20.0;
          float stars = pow(snoise(vec3(uv * starScale, t * 0.1)), 20.0);
          stars *= 1.0 + aBeat() * 2.0 + aTreble();
          color += vec3(stars) * 0.8;

          // Add pulsing core glow
          float coreGlow = exp(-dist * 3.0) * (aBeat() * 0.8 + aEnergy() * 0.4);
          color += uAccent * coreGlow;

          // Beat glow and brightness
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);
          color *= audioBrightness();

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
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed;

          // Grid cells - density changes with audio - standardized
          float cellSize = 0.03 / uScale / (1.0 + aMid() * 0.3);
          vec2 cell = floor(uv / cellSize);
          vec2 cellUv = fract(uv / cellSize);

          // Rain drops falling faster with energy
          float speed = random(vec2(cell.x, 0.0)) * 2.0 + 0.5;
          speed *= 1.0 + aEnergy() * 1.5 + aBeat() * 0.5;
          float offset = random(vec2(cell.x, 1.0));
          float drop = fract(t * speed * 0.3 + offset);

          // Trail effect - longer trails with bass
          float trailLength = 0.7 + aBass() * 0.2;
          float trail = smoothstep(0.0, trailLength, 1.0 - drop);
          trail *= smoothstep(1.0, 0.8, 1.0 - drop);

          // Character-like blocks - more active with audio
          float charThreshold = 0.3 - aEnergy() * 0.15;
          float charNoise = random(cell + floor(t * speed));
          float char = step(charThreshold, charNoise) * step(charNoise, 0.9);

          // Vertical position affects brightness - pulses with beat
          float brightness = (1.0 - uv.y) * trail * char;
          brightness *= 1.0 + aBeat() * 1.5 + aEnergy() * 0.8;

          // Connection lines (neural network) - more active with bass
          float connections = 0.0;
          for (int i = -1; i <= 1; i++) {
            vec2 neighborCell = cell + vec2(float(i), 0.0);
            float neighborActive = step(0.5 - aBass() * 0.3, random(neighborCell + floor(t * 0.5)));
            float line = 1.0 - abs(cellUv.x - 0.5) * 2.0;
            connections += line * neighborActive * (0.1 + aBass() * 0.2);
          }

          // Color
          vec3 color = uColor1;
          color = mix(color, uColor2, uv.y);
          color += uAccent * brightness * uIntensity * audioBrightness();
          color += uColor3 * connections * (1.0 + aBass() * 2.0);

          // Scanline effect - pulses with treble
          float scanlineSpeed = 10.0 + aTreble() * 20.0;
          float scanline = sin(uv.y * 200.0 + t * scanlineSpeed) * (0.02 + aBeat() * 0.05);
          color += vec3(scanline);

          // Flash on big beats
          color += uAccent * aBeat() * 0.3;

          // Beat glow and vignette
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Aurora - northern lights ribbons
      aurora: `
        ${common}
        void main() {
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed * 0.15;

          // Multiple aurora ribbons - wave amplitude driven by bass - standardized
          float aurora = 0.0;
          float bassAmp = aBass() * 0.2 + aBeat() * 0.15;

          for (int i = 0; i < 4; i++) {
            float fi = float(i);
            float offset = fi * 0.2;
            float freq = 2.0 + fi * 0.5 + aMid() * 1.0;
            float amp = 0.15 - fi * 0.03 + bassAmp;

            float wave = sin(uv.x * freq * uScale + t + offset) * amp;
            wave += snoise(vec3(uv.x * uScale * 3.0, t * 0.5, fi)) * (0.1 + aTreble() * 0.1);

            // Ribbon height pulses with beat
            float ribbonY = 0.3 + aBeat() * 0.1;
            float ribbon = smoothstep(0.0, 0.1, uv.y - ribbonY - wave - offset * 0.3);
            ribbon *= smoothstep(0.3 + aBass() * 0.1, 0.15, uv.y - ribbonY - wave - offset * 0.3);

            aurora += ribbon * (1.0 - fi * 0.2);
          }

          // Dramatically increase aurora brightness with audio
          aurora *= 1.0 + aEnergy() * 1.5 + aBeat() * 1.0;
          aurora += aBass() * 0.3;

          // Shimmer intensity varies with treble
          float shimmerSpeed = 2.0 + aTreble() * 3.0;
          float shimmer = snoise(vec3(uv * uScale * 10.0, t * shimmerSpeed)) * 0.3 + 0.7;
          shimmer += aBeat() * 0.2;
          aurora *= shimmer;

          // Color gradient through the aurora - shifts with audio
          float colorShift = aMid() * 0.3;
          vec3 auroraColor = mix(uColor3, uAccent, snoise(vec3(uv.x * 5.0 + colorShift, t, 0.0)) * 0.5 + 0.5);
          auroraColor = mix(auroraColor, uColor2, uv.y);
          auroraColor *= audioBrightness();

          // Base sky gradient
          vec3 sky = mix(uColor1, uColor2 * 0.5, uv.y);

          // Stars twinkle more with treble
          float starBrightness = pow(snoise(vec3(uv * 80.0, t * 0.05)), 25.0) * (1.0 - aurora);
          starBrightness *= 1.0 + aTreble() * 2.0 + aBeat();

          vec3 color = mix(sky, auroraColor, aurora * uIntensity);
          color += vec3(starBrightness) * 0.5;

          // Beat glow from bottom
          float bottomGlow = exp(-(uv.y) * 4.0) * aBeat() * 0.4;
          color += uAccent * bottomGlow;

          // Beat glow and vignette
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);

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
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed * 0.2;

          // Heat distortion - standardized
          float distortAmount = 0.02 + aBass() * 0.05 + aBeat() * 0.03;
          vec2 distort = vec2(
            snoise(vec3(uv * uScale * 5.0, t)) * distortAmount,
            snoise(vec3(uv * uScale * 5.0 + 100.0, t)) * distortAmount
          );
          vec2 distortedUv = uv + distort * (1.0 + aBass() * 2.0);

          // Molten cracks - glow more intensely with audio
          float cracks = 0.0;
          for (int i = 0; i < 3; i++) {
            float fi = float(i);
            float scale = 3.0 + fi * 2.0 + aMid();
            float crack = abs(snoise(vec3(distortedUv * uScale * scale, t * 0.3 + fi)));
            float crackPower = 8.0 + fi * 4.0 - aBass() * 2.0;
            crack = pow(1.0 - crack, max(4.0, crackPower));
            cracks += crack * (1.0 - fi * 0.25);
          }

          // Cracks pulse dramatically with beat
          cracks *= 1.0 + aEnergy() * 1.5 + aBeat() * 2.0;

          // Heat glow from bottom - pulses with bass
          float heatIntensity = 0.5 + aBass() * 0.5 + aBeat() * 0.4;
          float heatGlow = pow(1.0 - uv.y, 2.0) * heatIntensity;
          heatGlow += snoise(vec3(uv.x * uScale * 10.0, t * 2.0, 0.0)) * 0.15 * (1.0 - uv.y);
          heatGlow *= audioBrightness();

          // Color: dark metal to glowing orange - shifts with energy
          vec3 color = uColor1;
          color = mix(color, uColor2, heatGlow * (1.0 + aBeat() * 0.5));
          color = mix(color, uColor3, cracks * 0.5);
          color = mix(color, uAccent, cracks * uIntensity * audioBrightness());

          // Spark particles - standardized
          float sparkDensity = 50.0 + aEnergy() * 30.0;
          float sparkSpeed = 10.0 + aTreble() * 15.0;
          float sparks = pow(random(floor(uv * sparkDensity) + floor(t * sparkSpeed)), 12.0);
          sparks *= step(0.5 - aEnergy() * 0.3, uv.y);
          sparks *= (aEnergy() + aBeat() * 1.5);
          color += uAccent * sparks * 3.0;

          // Ember burst on beats
          float embers = random(floor(uv * 30.0 + t * 5.0));
          embers = pow(embers, 20.0) * aBeat() * 2.0;
          color += (uAccent + uColor3) * 0.5 * embers;

          // Beat glow and vignette
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Sakura - soft floating petal patterns
      sakura: `
        ${common}
        void main() {
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed * 0.1;

          // Soft flowing background - swirls with audio - standardized
          float bgScale = uScale * 1.5 * (1.0 + aMid() * 0.2);
          float bg = fbm(vec3(uv * bgScale, t * 0.2), 3);
          bg += aBeat() * 0.15;

          // Petal-like shapes floating - more and faster with audio
          float petals = 0.0;
          float petalSpeed = 0.05 * (1.0 + aEnergy() * 1.5);

          for (int i = 0; i < 5; i++) {
            float fi = float(i);
            vec2 petalUv = uv;

            // Drift motion - swirls with bass
            float drift = sin(t * 0.3 + fi) * (0.1 + aBass() * 0.15);
            petalUv.x += drift;
            petalUv.y -= t * petalSpeed * (1.0 + fi * 0.2);
            petalUv = fract(petalUv + fi * 0.2);

            // Petal shape - size pulses with beat
            vec2 center = vec2(0.5);
            float petalSize = 1.0 + aBeat() * 0.3;
            float d = length((petalUv - center) * vec2(1.0, 2.0) / petalSize);
            float petal = smoothstep(0.15, 0.1, d);
            petal *= smoothstep(0.0, 0.05, petalUv.y - 0.3);

            petals += petal * (0.8 - fi * 0.1);
          }

          // Petals glow more with audio
          petals *= 1.0 + aEnergy() * 0.8 + aBeat() * 0.6;

          // Gentle color gradient
          vec3 color = mix(uColor1, uColor2, uv.y + bg * 0.2);
          color = mix(color, uColor3, petals * 0.5 * audioBrightness());
          color = mix(color, uAccent, petals * uIntensity * 0.7 * audioBrightness());

          // Soft bloom - pulses with music
          float bloom = smoothstep(0.3, 0.7, bg) * (0.1 + aBeat() * 0.2);
          color += uAccent * bloom * audioBrightness();

          // Sparkle on petals with treble
          float sparkle = pow(snoise(vec3(uv * 40.0, t * 2.0)), 15.0);
          sparkle *= petals * aTreble() * 2.0;
          color += vec3(1.0, 0.9, 0.95) * sparkle;

          // Beat glow and vignette
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);

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
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed * 0.5;

          // Grid - density increases with mid frequencies - standardized
          float gridSize = 0.05 / uScale / (1.0 + aMid() * 0.3);
          vec2 cell = floor(uv / gridSize);
          vec2 cellUv = fract(uv / gridSize);

          // Traces - more appear with audio energy
          float trace = 0.0;
          float traceThreshold = 0.5 - aEnergy() * 0.2;

          // Horizontal traces
          float hRand = random(vec2(cell.y, 0.0));
          if (hRand > traceThreshold) {
            float traceWidth = 0.3 + aBass() * 0.1;
            trace += smoothstep(0.0, 0.1, cellUv.y) * smoothstep(traceWidth, 0.2, cellUv.y);
          }

          // Vertical traces
          float vRand = random(vec2(cell.x, 1.0));
          if (vRand > traceThreshold) {
            float traceWidth = 0.3 + aBass() * 0.1;
            trace += smoothstep(0.0, 0.1, cellUv.x) * smoothstep(traceWidth, 0.2, cellUv.x);
          }

          // Nodes at intersections - more with energy
          float node = length(cellUv - 0.5);
          float nodeThreshold = 0.7 - aEnergy() * 0.3;
          node = smoothstep(0.15, 0.1, node) * step(nodeThreshold, random(cell));
          node *= 1.0 + aBeat() * 1.5;

          // Pulse traveling along traces - faster and brighter with audio
          float pulseSpeed = 2.0 + aEnergy() * 3.0;
          float pulse = sin(cell.x * 0.5 + cell.y * 0.3 - t * pulseSpeed) * 0.5 + 0.5;
          pulse = pow(pulse, 4.0 - aBass() * 2.0);

          // Audio reactive pulse - dramatically more intense
          pulse *= 1.0 + aEnergy() * 2.0 + aBeat() * 1.5;
          float bassPulse = aBass() * step(0.6 - aEnergy() * 0.3, random(cell + floor(t)));
          bassPulse *= 1.0 + aBeat() * 2.0;

          // Data packets traveling on beats
          float packets = 0.0;
          float packetPos = fract(cell.x * 0.1 + cell.y * 0.1 + t * (1.0 + aEnergy()));
          packets = smoothstep(0.0, 0.1, packetPos) * smoothstep(0.2, 0.1, packetPos);
          packets *= trace * aBeat() * 2.0;

          // Color
          vec3 color = uColor1;
          color = mix(color, uColor2, trace * 0.5);
          color += uColor3 * trace * pulse * 0.5 * audioBrightness();
          color += uAccent * (trace * pulse + node + bassPulse + packets) * uIntensity * audioBrightness();

          // Glow - pulses strongly with beat
          float glow = trace * pulse * (0.2 + aBeat() * 0.4);
          color += uAccent * glow;

          // Flash whole circuit on big beats
          color += uAccent * trace * aBeat() * 0.3;

          // Beat glow and vignette
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Glacier - ice crystal formations
      glacier: `
        ${common}
        void main() {
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed * 0.08;

          // Ice crystal noise (sharp, angular) - pulses with bass - standardized
          float iceScale = uScale * (1.0 + aBass() * 0.3);
          float ice1 = abs(snoise(vec3(uv * iceScale * 3.0, t)));
          float ice2 = abs(snoise(vec3(uv * iceScale * 6.0, t * 0.7)));
          float ice3 = abs(snoise(vec3(uv * iceScale * 12.0, t * 0.5)));

          // Combine for crystal structure - sharpness varies with audio
          float sharpness1 = 0.5 - aBass() * 0.2;
          float sharpness2 = 0.7 - aMid() * 0.2;
          float crystals = pow(ice1, sharpness1) * 0.5 + pow(ice2, sharpness2) * 0.3 + pow(ice3, 0.9) * 0.2;
          crystals += aBass() * 0.3 + aBeat() * 0.2;

          // Frost patterns (finer detail) - more visible with treble
          float frostDetail = uScale * 20.0 + aTreble() * 10.0;
          float frost = snoise(vec3(uv * frostDetail, t * 0.3));
          frost = smoothstep(0.3 - aTreble() * 0.1, 0.5, abs(frost));
          frost *= 1.0 + aBeat() * 0.3;

          // Cracks in ice - spread with bass hits
          float crackScale = uScale * 8.0 + aBass() * 3.0;
          float cracks = 1.0 - pow(snoise(vec3(uv * crackScale, t * 0.1)), 2.0);
          cracks = smoothstep(0.7 - aBeat() * 0.2, 0.9, cracks);
          cracks *= 1.0 + aBeat() * 1.0;

          // Deep blue to white gradient - shifts with energy
          vec3 color = uColor1;
          color = mix(color, uColor2, crystals * audioBrightness());
          color = mix(color, uColor3, frost * 0.3 * audioBrightness());
          color = mix(color, uAccent, cracks * uIntensity * 0.5 * audioBrightness());

          // Ice shimmer - sparkles more with audio
          float shimmerSpeed = 3.0 + aTreble() * 5.0;
          float shimmer = pow(snoise(vec3(uv * 30.0, t * shimmerSpeed)) * 0.5 + 0.5, 8.0 - aEnergy() * 3.0);
          shimmer *= 1.0 + aEnergy() * 1.5 + aBeat() * 1.0;
          color += vec3(0.8, 0.9, 1.0) * shimmer * 0.4;

          // White peaks glow with beats
          float peaks = smoothstep(0.7, 1.0, crystals) * (0.2 + aBeat() * 0.4);
          color += vec3(1.0) * peaks;

          // Ice flash on beats
          color += vec3(0.7, 0.85, 1.0) * aBeat() * 0.2;

          // Beat glow and vignette
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);

          gl_FragColor = vec4(color, 1.0);
        }
      `,

      // Savanna - heat shimmer and dust waves
      savanna: `
        ${common}
        void main() {
          vec2 uv = audioScale(vUv);
          float t = uTime * uSpeed * 0.15;

          // Heat shimmer distortion - standardized
          float shimmerIntensity = 1.0 + aBass() * 2.0 + aBeat() * 1.5;
          vec2 shimmer = vec2(
            sin(uv.y * 20.0 + t * 2.0) * 0.003 * shimmerIntensity,
            cos(uv.x * 15.0 + t * 1.5) * 0.002 * shimmerIntensity
          );
          shimmer *= (1.0 - uv.y) * 2.0;
          vec2 distortedUv = uv + shimmer;

          // Dust layers - more intense and faster with audio
          float dustSpeed1 = 0.2 + aEnergy() * 0.3;
          float dustSpeed2 = 0.3 + aEnergy() * 0.4;
          float dust1 = snoise(vec3(distortedUv * uScale * 2.0 + vec2(t * dustSpeed1, 0.0), t * 0.1));
          float dust2 = snoise(vec3(distortedUv * uScale * 4.0 + vec2(t * dustSpeed2, 0.0), t * 0.15));
          float dust = dust1 * 0.6 + dust2 * 0.4;
          dust += aBass() * 0.4 + aBeat() * 0.3;

          // Sunset gradient - colors shift with audio
          float gradientPos = uv.y + dust * 0.1;
          float colorPulse = aBeat() * 0.1;
          vec3 color = uColor1;
          color = mix(uColor2, color, smoothstep(0.0 - colorPulse, 0.4 + colorPulse, gradientPos));
          color = mix(uColor3, color, smoothstep(0.0 - colorPulse, 0.25 + colorPulse, gradientPos));
          color = mix(uAccent, color, smoothstep(0.0 - colorPulse, 0.15 + colorPulse, gradientPos));

          // Sun glow - PULSES dramatically with music
          vec2 sunPos = vec2(0.5, 0.1);
          float sunDist = length(uv - sunPos);
          float sunSize = 0.15 + aBeat() * 0.05 + aBass() * 0.03;
          float sun = smoothstep(sunSize, 0.0, sunDist);
          float sunGlowSize = 0.4 + aEnergy() * 0.2 + aBeat() * 0.15;
          float sunGlow = smoothstep(sunGlowSize, 0.0, sunDist) * (0.3 + aBeat() * 0.4);
          color += uAccent * (sun + sunGlow) * audioBrightness();

          // Dust particles - more and brighter with audio
          float particleDensity = 50.0 + aTreble() * 30.0;
          float particles = pow(snoise(vec3(uv * particleDensity, t)), 15.0 - aEnergy() * 5.0);
          particles *= (1.0 - uv.y);
          particles *= 1.0 + aBeat() * 2.0 + aEnergy();
          color += uColor3 * particles;

          // Heat wave flash on beats
          float heatWave = (1.0 - uv.y) * aBeat() * 0.3;
          color += uAccent * heatWave;

          // Beat glow and vignette
          color = beatGlow(color, vUv);
          color = audioSaturate(color);
          color *= audioVignette(vUv);
          color *= audioBrightness();

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

    // Smooth audio values with different smoothing rates for responsiveness
    const targetEnergy = audioData.energy || 0;
    const targetBass = audioData.bass || 0;
    const targetMid = audioData.mid || 0;
    const targetTreble = audioData.treble || 0;
    const targetBeatPulse = audioData.beatPulse || 0;

    // Per-stem effects (if available) boost specific aspects
    const drumEnergy = audioData.drumEnergy || 0;
    const bassDeform = audioData.bassDeform || 0;
    const synthPulse = audioData.synthPulse || 0;

    // Bass and beat pulse need faster response for punchy effects
    this.audioEnergy += (targetEnergy - this.audioEnergy) * 0.15;
    this.audioBass += (targetBass - this.audioBass) * 0.2;
    this.audioMid += (targetMid - this.audioMid) * 0.15;
    this.audioTreble += (targetTreble - this.audioTreble) * 0.12;
    // Beat pulse boosted by drums and synth
    const effectiveBeatPulse = targetBeatPulse + drumEnergy * 0.3 + synthPulse * 0.2;
    this.beatPulse += (effectiveBeatPulse - this.beatPulse) * 0.25;

    // Apply stem-specific boosts to shader uniforms
    // Drums add punch to energy, bass adds to bass uniform, synth adds mid brightness
    this.material.uniforms.uAudioEnergy.value = this.audioEnergy + drumEnergy * 0.2;
    this.material.uniforms.uAudioBass.value = this.audioBass + bassDeform * 0.3;
    this.material.uniforms.uAudioMid.value = this.audioMid + synthPulse * 0.2;
    this.material.uniforms.uAudioTreble.value = this.audioTreble;
    this.material.uniforms.uBeatPulse.value = this.beatPulse;
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
    if (config.audioReactivity !== undefined) {
      this.setAudioReactivity(config.audioReactivity);
    }
  }

  // Set global audio reactivity level (0-1, default 1.0)
  // All backgrounds use the same standardized reactivity
  setAudioReactivity(level) {
    this.audioReactivity = Math.max(0, Math.min(1, level));
    if (this.material) {
      this.material.uniforms.uAudioReactivity.value = this.audioReactivity;
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
