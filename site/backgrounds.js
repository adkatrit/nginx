/*
  ANIMATED BACKGROUND SYSTEM (TSL / NodeMaterial)
  ------------------------------------------------
  TSL-based animated backgrounds for each track theme.
  Uses MeshBasicNodeMaterial with colorNode instead of GLSL ShaderMaterial.

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
    this.audioReactivity = 1.0;

    this.create();
  }

  create() {
    const TSL = window._TSL;
    if (!TSL) {
      console.warn("AnimatedBackground: window._TSL not available yet");
      return;
    }
    const {
      Fn, float, vec2, vec3, vec4, uniform, uv: tslUV,
      mix: tslMix, sin: tslSin, cos: tslCos, abs: tslAbs, pow: tslPow,
      step: tslStep, smoothstep: tslSmoothstep, clamp: tslClamp,
      fract: tslFract, floor: tslFloor, mod: tslMod,
      length: tslLength, dot: tslDot, normalize: tslNormalize,
      atan2: tslAtan2, exp: tslExp, max: tslMax, min: tslMin,
      mx_noise_float, mx_fractal_noise_float,
    } = TSL;

    const geometry = new this.THREE.PlaneGeometry(2, 2);

    // TSL uniforms
    this.uTime = uniform(0);
    this.uColor1 = uniform(new this.THREE.Color(this.config.color1 || 0x000510));
    this.uColor2 = uniform(new this.THREE.Color(this.config.color2 || 0x001830));
    this.uColor3 = uniform(new this.THREE.Color(this.config.color3 || 0x003366));
    this.uAccent = uniform(new this.THREE.Color(this.config.accent || 0x00ffff));
    this.uSpeed = uniform(this.config.speed || 1.0);
    this.uIntensity = uniform(this.config.intensity || 0.5);
    this.uScale = uniform(this.config.scale || 1.0);
    this.uAudioEnergy = uniform(0);
    this.uAudioBass = uniform(0);
    this.uAudioMid = uniform(0);
    this.uAudioTreble = uniform(0);
    this.uBeatPulse = uniform(0);

    // Sun uniforms (configurable per track)
    this.uSunX = uniform(this.config.sunX ?? 0.5);
    this.uSunY = uniform(this.config.sunY ?? 0.82);
    this.uSunSize = uniform(this.config.sunSize ?? 0.12);
    this.uSunColor = uniform(new this.THREE.Color(this.config.sunColor || this.config.accent || 0xffdd44));
    this.uSunIntensity = uniform(this.config.sunIntensity ?? 1.0);
    this.uAudioReactivity = uniform(1.0);

    // Shorthand audio accessors (TSL nodes)
    const aEnergy = () => this.uAudioEnergy.mul(this.uAudioReactivity);
    const aBass = () => this.uAudioBass.mul(this.uAudioReactivity);
    const aMid = () => this.uAudioMid.mul(this.uAudioReactivity);
    const aTreble = () => this.uAudioTreble.mul(this.uAudioReactivity);
    const aBeat = () => this.uBeatPulse.mul(this.uAudioReactivity);

    // Audio helpers
    const audioScale = (uvVal) => {
      const centered = uvVal.sub(0.5);
      const pulse = float(1).sub(aBass().mul(0.20)).sub(aBeat().mul(0.15));
      return centered.mul(pulse).add(0.5);
    };

    const audioBrightness = () => {
      return float(1).add(aBeat().mul(0.5)).add(aEnergy().mul(0.4));
    };

    const beatGlow = (colorVal, uvVal) => {
      const centered = uvVal.sub(0.5);
      const dist = tslLength(centered);
      const glow = tslExp(dist.negate().mul(2)).mul(aBeat()).mul(0.8);
      return colorVal.add(vec3(this.uAccent).mul(glow));
    };

    const audioSaturate = (colorVal) => {
      const gray = tslDot(colorVal, vec3(0.299, 0.587, 0.114));
      const satBoost = float(1).add(aEnergy().mul(0.3)).add(aBeat().mul(0.2));
      return tslMix(vec3(gray, gray, gray), colorVal, satBoost);
    };

    // Noise helpers using mx_noise_float: returns [0,1], remap to [-1,1] for snoise equivalent
    const snoise = (p) => mx_noise_float(p).mul(2).sub(1);
    const fbm = (p, octaves) => mx_fractal_noise_float(p, octaves, float(2.0), float(0.5));

    // Hash function for procedural patterns
    const hash = (p) => tslFract(tslSin(tslDot(p, vec2(12.9898, 78.233))).mul(43758.5453));

    // Build shader for the selected type
    const shaderType = this.config.type || 'topo';

    const colorNode = Fn(() => {
      const rawUV = tslUV();
      const uvScaled = audioScale(rawUV);

      // ── Shared sun effect (horizon sun for all background types) ──
      const sunPos = vec2(this.uSunX, this.uSunY);
      const sunDist = tslLength(uvScaled.sub(sunPos));
      const sunSize = this.uSunSize.add(aBeat().mul(0.05)).add(aBass().mul(0.03));
      const sunCore = tslSmoothstep(sunSize, float(0), sunDist);
      const sunGlowSize = this.uSunSize.mul(2.5).add(aEnergy().mul(0.2)).add(aBeat().mul(0.15));
      const sunGlow = tslSmoothstep(sunGlowSize, float(0), sunDist).mul(float(0.3).add(aBeat().mul(0.4)));
      const sunEffect = vec3(this.uSunColor).mul(sunCore.add(sunGlow)).mul(audioBrightness()).mul(this.uSunIntensity);

      if (shaderType === 'topo') {
        const t = this.uTime.mul(this.uSpeed).mul(0.15);
        const p = vec3(uvScaled.mul(this.uScale).mul(3), t);
        const elevation = fbm(p, 5).add(snoise(vec3(uvScaled.mul(this.uScale).mul(6), t.mul(0.5))).mul(0.3))
          .add(aBass().mul(0.4)).add(aBeat().mul(0.3)).toVar();
        const contourDensity = float(8).add(aEnergy().mul(8)).add(aMid().mul(4));
        const contours = tslFract(elevation.mul(contourDensity));
        const line1 = tslSmoothstep(float(0), float(0.08), contours).mul(tslSmoothstep(float(0.15), float(0.08), contours));
        const line2 = tslSmoothstep(float(0), float(0.03), contours).mul(tslSmoothstep(float(0.05), float(0.03), contours)).mul(0.5);
        const line = line1.add(line2).mul(float(1).add(aBeat().mul(0.5)));
        const baseColor = tslMix(tslMix(this.uColor1, this.uColor2, elevation.mul(0.5).add(0.5)),
          this.uColor3, tslSmoothstep(float(0.3), float(0.7), elevation));
        const lineColor = tslMix(this.uAccent, this.uColor3, float(0.3).sub(aEnergy().mul(0.2)));
        const c = tslMix(baseColor, lineColor, line.mul(this.uIntensity)).toVar();
        const peak = tslSmoothstep(float(0.5), float(0.8), elevation);
        c.addAssign(vec3(this.uAccent).mul(peak).mul(0.3).mul(audioBrightness()));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        c.mulAssign(audioBrightness());
        return vec4(c, 1);

      } else if (shaderType === 'ocean') {
        const t = this.uTime.mul(this.uSpeed).mul(0.2);
        const waveAmp = float(1).add(aBass().mul(0.8)).add(aBeat().mul(0.5));
        const wave1 = snoise(vec3(uvScaled.mul(this.uScale).mul(2).add(vec2(t, 0)), t.mul(0.3))).mul(waveAmp);
        const wave2 = snoise(vec3(uvScaled.mul(this.uScale).mul(4).sub(vec2(t.mul(0.7), t.mul(0.3))), t.mul(0.2))).mul(0.5).mul(waveAmp);
        const wave3 = snoise(vec3(uvScaled.mul(this.uScale).mul(8).add(vec2(t.mul(0.5), t.negate().mul(0.4))), t.mul(0.1))).mul(0.25).mul(waveAmp);
        const waves = wave1.add(wave2).add(wave3).add(aBass().mul(0.5)).add(aBeat().mul(0.4)).toVar();
        const causticIntensity = this.uScale.mul(12).add(aTreble().mul(4));
        const causticN = snoise(vec3(uvScaled.mul(causticIntensity).add(vec2(waves.mul(0.5), 0)), t.mul(0.5)));
        const caustic = tslPow(tslAbs(causticN), float(2)).mul(float(0.5).add(aMid().mul(0.5)));
        const c = tslMix(tslMix(this.uColor1, this.uColor2, uvScaled.y.add(waves.mul(0.2))),
          this.uColor3, tslSmoothstep(float(-0.2), float(0.5), waves)).toVar();
        c.addAssign(vec3(this.uAccent).mul(caustic).mul(this.uIntensity).mul(audioBrightness()));
        const shimmer = tslPow(tslMax(float(0), waves), float(3)).mul(0.5).mul(float(1).add(aBeat().mul(1.5)).add(aEnergy()));
        c.addAssign(vec3(shimmer, shimmer, shimmer));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        c.mulAssign(audioBrightness());
        return vec4(c, 1);

      } else if (shaderType === 'nebula') {
        const t = this.uTime.mul(this.uSpeed).mul(0.1);
        const center = vec2(0.5);
        const toCenter = uvScaled.sub(center);
        const angle = tslAtan2(toCenter.y, toCenter.x);
        const dist = tslLength(toCenter);
        const spiralSpeed = float(3).add(aBass().mul(2));
        const spiral = angle.add(dist.mul(spiralSpeed)).sub(t.mul(float(1).add(aEnergy().mul(0.5))));
        const distortAmount = float(0.1).add(aBass().mul(0.2)).add(aBeat().mul(0.15));
        const distortedUv = uvScaled.add(vec2(tslCos(spiral), tslSin(spiral)).mul(distortAmount));
        const cloudScale = this.uScale.mul(float(1).add(aMid().mul(0.3)));
        const cloud1 = fbm(vec3(distortedUv.mul(cloudScale).mul(2), t), 5);
        const cloud2 = fbm(vec3(distortedUv.mul(cloudScale).mul(4).add(10), t.mul(0.7)), 4);
        const cloud3 = fbm(vec3(distortedUv.mul(cloudScale), t.mul(0.3)), 3);
        const nebula = cloud1.mul(0.5).add(cloud2.mul(0.3)).add(cloud3.mul(0.2))
          .add(aEnergy().mul(0.4)).add(aBeat().mul(0.3)).toVar();
        const colorShift = aMid().mul(0.2);
        const c = tslMix(this.uColor1, this.uColor2,
          tslSmoothstep(float(-0.3).sub(colorShift), float(0.3).add(colorShift), nebula)).toVar();
        c.assign(tslMix(c, this.uColor3, tslSmoothstep(float(0.2).sub(colorShift), float(0.6).add(colorShift), nebula)));
        c.assign(tslMix(c, this.uAccent, tslSmoothstep(float(0.4), float(0.8), nebula).mul(this.uIntensity).mul(float(1).add(aBeat()))));
        const starScale = float(50).add(aTreble().mul(20));
        const stars = tslPow(snoise(vec3(uvScaled.mul(starScale), t.mul(0.1))), float(20))
          .mul(float(1).add(aBeat().mul(2)).add(aTreble()));
        c.addAssign(vec3(stars, stars, stars).mul(0.8));
        const coreGlow = tslExp(dist.negate().mul(3)).mul(aBeat().mul(0.8).add(aEnergy().mul(0.4)));
        c.addAssign(vec3(this.uAccent).mul(coreGlow));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        c.mulAssign(audioBrightness());
        return vec4(c, 1);

      } else if (shaderType === 'matrix') {
        const t = this.uTime.mul(this.uSpeed);
        const cellSize = float(0.03).div(this.uScale).div(float(1).add(aMid().mul(0.3)));
        const cell = tslFloor(uvScaled.div(cellSize));
        const cellUv = tslFract(uvScaled.div(cellSize));
        const speed = hash(vec2(cell.x, 0)).mul(2).add(0.5)
          .mul(float(1).add(aEnergy().mul(1.5)).add(aBeat().mul(0.5)));
        const offset = hash(vec2(cell.x, 1));
        const drop = tslFract(t.mul(speed).mul(0.3).add(offset));
        const trailLength = float(0.7).add(aBass().mul(0.2));
        const trail = tslSmoothstep(float(0), trailLength, float(1).sub(drop))
          .mul(tslSmoothstep(float(1), float(0.8), float(1).sub(drop)));
        const charThreshold = float(0.3).sub(aEnergy().mul(0.15));
        const charNoise = hash(cell.add(tslFloor(t.mul(speed))));
        const char = tslStep(charThreshold, charNoise).mul(tslStep(charNoise, float(0.9)));
        const brightness = float(1).sub(uvScaled.y).mul(trail).mul(char)
          .mul(float(1).add(aBeat().mul(1.5)).add(aEnergy().mul(0.8)));
        // Unrolled connection loop (3 iterations: i=-1,0,1)
        const connections = (() => {
          let conn = float(0).toVar();
          for (let i = -1; i <= 1; i++) {
            const neighborCell = cell.add(vec2(i, 0));
            const neighborActive = tslStep(float(0.5).sub(aBass().mul(0.3)), hash(neighborCell.add(tslFloor(t.mul(0.5)))));
            const lineVal = float(1).sub(tslAbs(cellUv.x.sub(0.5)).mul(2));
            conn.addAssign(lineVal.mul(neighborActive).mul(float(0.1).add(aBass().mul(0.2))));
          }
          return conn;
        })();
        const c = tslMix(this.uColor1, this.uColor2, uvScaled.y).toVar();
        c.addAssign(vec3(this.uAccent).mul(brightness).mul(this.uIntensity).mul(audioBrightness()));
        c.addAssign(vec3(this.uColor3).mul(connections).mul(float(1).add(aBass().mul(2))));
        const scanlineSpeed = float(10).add(aTreble().mul(20));
        const scanline = tslSin(uvScaled.y.mul(200).add(t.mul(scanlineSpeed))).mul(float(0.02).add(aBeat().mul(0.05)));
        c.addAssign(vec3(scanline, scanline, scanline));
        c.addAssign(vec3(this.uAccent).mul(aBeat()).mul(0.3));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        return vec4(c, 1);

      } else if (shaderType === 'aurora') {
        const t = this.uTime.mul(this.uSpeed).mul(0.15);
        const bassAmp = aBass().mul(0.2).add(aBeat().mul(0.15));
        // Unrolled 4 aurora ribbon layers
        const aurora = (() => {
          let aur = float(0).toVar();
          for (let i = 0; i < 4; i++) {
            const fi = float(i);
            const ribbonOffset = fi.mul(0.2);
            const freq = float(2).add(fi.mul(0.5)).add(aMid());
            const amp = float(0.15).sub(fi.mul(0.03)).add(bassAmp);
            const wave = tslSin(uvScaled.x.mul(freq).mul(this.uScale).add(t).add(ribbonOffset)).mul(amp)
              .add(snoise(vec3(uvScaled.x.mul(this.uScale).mul(3), t.mul(0.5), fi)).mul(float(0.1).add(aTreble().mul(0.1))));
            const ribbonY = float(0.3).add(aBeat().mul(0.1));
            const ribbonBase = uvScaled.y.sub(ribbonY).sub(wave).sub(ribbonOffset.mul(0.3));
            const ribbon = tslSmoothstep(float(0), float(0.1), ribbonBase)
              .mul(tslSmoothstep(float(0.3).add(aBass().mul(0.1)), float(0.15), ribbonBase));
            aur.addAssign(ribbon.mul(float(1).sub(fi.mul(0.2))));
          }
          return aur;
        })();
        const auroraScaled = aurora.mul(float(1).add(aEnergy().mul(1.5)).add(aBeat()))
          .add(aBass().mul(0.3)).toVar();
        const shimmerSpeed = float(2).add(aTreble().mul(3));
        const shimmer = snoise(vec3(uvScaled.mul(this.uScale).mul(10), t.mul(shimmerSpeed))).mul(0.3).add(0.7)
          .add(aBeat().mul(0.2));
        auroraScaled.mulAssign(shimmer);
        const colorShift = aMid().mul(0.3);
        const auroraColor = tslMix(
          tslMix(this.uColor3, this.uAccent, snoise(vec3(uvScaled.x.mul(5).add(colorShift), t, 0)).mul(0.5).add(0.5)),
          this.uColor2, uvScaled.y
        ).mul(audioBrightness());
        const sky = tslMix(this.uColor1, vec3(this.uColor2).mul(0.5), uvScaled.y);
        const starBrightness = tslPow(snoise(vec3(uvScaled.mul(80), t.mul(0.05))), float(25))
          .mul(float(1).sub(auroraScaled))
          .mul(float(1).add(aTreble().mul(2)).add(aBeat()));
        const c = tslMix(sky, auroraColor, auroraScaled.mul(this.uIntensity)).toVar();
        c.addAssign(vec3(starBrightness, starBrightness, starBrightness).mul(0.5));
        const bottomGlow = tslExp(uvScaled.y.negate().mul(4)).mul(aBeat()).mul(0.4);
        c.addAssign(vec3(this.uAccent).mul(bottomGlow));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        return vec4(c, 1);

      } else if (shaderType === 'forge') {
        const t = this.uTime.mul(this.uSpeed).mul(0.2);
        const distortAmount = float(0.02).add(aBass().mul(0.05)).add(aBeat().mul(0.03));
        const distort = vec2(
          snoise(vec3(uvScaled.mul(this.uScale).mul(5), t)).mul(distortAmount),
          snoise(vec3(uvScaled.mul(this.uScale).mul(5).add(100), t)).mul(distortAmount)
        );
        const distortedUv = uvScaled.add(distort.mul(float(1).add(aBass().mul(2))));
        // Unrolled 3 crack layers
        const cracks = (() => {
          let cr = float(0).toVar();
          for (let i = 0; i < 3; i++) {
            const fi = float(i);
            const scale = float(3).add(fi.mul(2)).add(aMid());
            const crack = tslAbs(snoise(vec3(distortedUv.mul(this.uScale).mul(scale), t.mul(0.3).add(fi))));
            const crackPower = tslMax(float(4), float(8).add(fi.mul(4)).sub(aBass().mul(2)));
            cr.addAssign(tslPow(float(1).sub(crack), crackPower).mul(float(1).sub(fi.mul(0.25))));
          }
          return cr;
        })();
        const cracksScaled = cracks.mul(float(1).add(aEnergy().mul(1.5)).add(aBeat().mul(2))).toVar();
        const heatIntensity = float(0.5).add(aBass().mul(0.5)).add(aBeat().mul(0.4));
        const heatGlow = tslPow(float(1).sub(uvScaled.y), float(2)).mul(heatIntensity)
          .add(snoise(vec3(uvScaled.x.mul(this.uScale).mul(10), t.mul(2), 0)).mul(0.15).mul(float(1).sub(uvScaled.y)))
          .mul(audioBrightness());
        const c = tslMix(
          tslMix(tslMix(this.uColor1, this.uColor2, heatGlow.mul(float(1).add(aBeat().mul(0.5)))),
            this.uColor3, cracksScaled.mul(0.5)),
          this.uAccent, cracksScaled.mul(this.uIntensity).mul(audioBrightness())
        ).toVar();
        // Sparks
        const sparkDensity = float(50).add(aEnergy().mul(30));
        const sparkSpeed = float(10).add(aTreble().mul(15));
        const sparks = tslPow(hash(tslFloor(uvScaled.mul(sparkDensity)).add(tslFloor(t.mul(sparkSpeed)))), float(12))
          .mul(tslStep(float(0.5).sub(aEnergy().mul(0.3)), uvScaled.y))
          .mul(aEnergy().add(aBeat().mul(1.5)));
        c.addAssign(vec3(this.uAccent).mul(sparks).mul(3));
        // Embers on beats
        const embers = tslPow(hash(tslFloor(uvScaled.mul(30).add(t.mul(5)))), float(20)).mul(aBeat()).mul(2);
        c.addAssign(vec3(this.uAccent).add(vec3(this.uColor3)).mul(0.5).mul(embers));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        return vec4(c, 1);

      } else if (shaderType === 'sakura') {
        const t = this.uTime.mul(this.uSpeed).mul(0.1);
        const bgScale = this.uScale.mul(1.5).mul(float(1).add(aMid().mul(0.2)));
        const bg = fbm(vec3(uvScaled.mul(bgScale), t.mul(0.2)), 3).add(aBeat().mul(0.15));
        const petalSpeed = float(0.05).mul(float(1).add(aEnergy().mul(1.5)));
        // Unrolled 5 petal layers
        const petals = (() => {
          let pet = float(0).toVar();
          for (let i = 0; i < 5; i++) {
            const fi = float(i);
            const drift = tslSin(t.mul(0.3).add(fi)).mul(float(0.1).add(aBass().mul(0.15)));
            const px = tslFract(uvScaled.x.add(drift).add(fi.mul(0.2)));
            const py = tslFract(uvScaled.y.sub(t.mul(petalSpeed).mul(float(1).add(fi.mul(0.2)))).add(fi.mul(0.2)));
            const petalSize = float(1).add(aBeat().mul(0.3));
            const dx = px.sub(0.5).div(petalSize);
            const dy = py.sub(0.5).mul(2).div(petalSize);
            const d = tslLength(vec2(dx, dy));
            const petal = tslSmoothstep(float(0.15), float(0.1), d)
              .mul(tslSmoothstep(float(0), float(0.05), py.sub(0.3)));
            pet.addAssign(petal.mul(float(0.8).sub(fi.mul(0.1))));
          }
          return pet;
        })();
        const petalsScaled = petals.mul(float(1).add(aEnergy().mul(0.8)).add(aBeat().mul(0.6)));
        const c = tslMix(this.uColor1, this.uColor2, uvScaled.y.add(bg.mul(0.2))).toVar();
        c.assign(tslMix(c, this.uColor3, petalsScaled.mul(0.5).mul(audioBrightness())));
        c.assign(tslMix(c, this.uAccent, petalsScaled.mul(this.uIntensity).mul(0.7).mul(audioBrightness())));
        const bloom = tslSmoothstep(float(0.3), float(0.7), bg).mul(float(0.1).add(aBeat().mul(0.2)));
        c.addAssign(vec3(this.uAccent).mul(bloom).mul(audioBrightness()));
        const sparkle = tslPow(snoise(vec3(uvScaled.mul(40), t.mul(2))), float(15))
          .mul(petalsScaled).mul(aTreble()).mul(2);
        c.addAssign(vec3(1, 0.9, 0.95).mul(sparkle));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        return vec4(c, 1);

      } else if (shaderType === 'circuit') {
        const t = this.uTime.mul(this.uSpeed).mul(0.5);
        const gridSize = float(0.05).div(this.uScale).div(float(1).add(aMid().mul(0.3)));
        const cell = tslFloor(uvScaled.div(gridSize));
        const cellUv = tslFract(uvScaled.div(gridSize));
        const traceThreshold = float(0.5).sub(aEnergy().mul(0.2));
        // Horizontal traces
        const hRand = hash(vec2(cell.y, 0));
        const traceWidth = float(0.3).add(aBass().mul(0.1));
        const hTrace = tslStep(traceThreshold, hRand)
          .mul(tslSmoothstep(float(0), float(0.1), cellUv.y))
          .mul(tslSmoothstep(traceWidth, float(0.2), cellUv.y));
        // Vertical traces
        const vRand = hash(vec2(cell.x, 1));
        const vTrace = tslStep(traceThreshold, vRand)
          .mul(tslSmoothstep(float(0), float(0.1), cellUv.x))
          .mul(tslSmoothstep(traceWidth, float(0.2), cellUv.x));
        const trace = hTrace.add(vTrace);
        // Nodes
        const nodeThreshold = float(0.7).sub(aEnergy().mul(0.3));
        const nodeDist = tslLength(cellUv.sub(0.5));
        const node = tslSmoothstep(float(0.15), float(0.1), nodeDist)
          .mul(tslStep(nodeThreshold, hash(cell)))
          .mul(float(1).add(aBeat().mul(1.5)));
        // Pulse
        const pulseSpeed = float(2).add(aEnergy().mul(3));
        const pulse = tslPow(
          tslSin(cell.x.mul(0.5).add(cell.y.mul(0.3)).sub(t.mul(pulseSpeed))).mul(0.5).add(0.5),
          tslMax(float(1), float(4).sub(aBass().mul(2)))
        ).mul(float(1).add(aEnergy().mul(2)).add(aBeat().mul(1.5)));
        const bassPulse = aBass().mul(tslStep(float(0.6).sub(aEnergy().mul(0.3)), hash(cell.add(tslFloor(t)))))
          .mul(float(1).add(aBeat().mul(2)));
        // Data packets
        const packetPos = tslFract(cell.x.mul(0.1).add(cell.y.mul(0.1)).add(t.mul(float(1).add(aEnergy()))));
        const packets = tslSmoothstep(float(0), float(0.1), packetPos)
          .mul(tslSmoothstep(float(0.2), float(0.1), packetPos))
          .mul(trace).mul(aBeat()).mul(2);
        // Color
        const c = tslMix(this.uColor1, this.uColor2, trace.mul(0.5)).toVar();
        c.addAssign(vec3(this.uColor3).mul(trace).mul(pulse).mul(0.5).mul(audioBrightness()));
        c.addAssign(vec3(this.uAccent).mul(
          trace.mul(pulse).add(node).add(bassPulse).add(packets)
        ).mul(this.uIntensity).mul(audioBrightness()));
        const glow = trace.mul(pulse).mul(float(0.2).add(aBeat().mul(0.4)));
        c.addAssign(vec3(this.uAccent).mul(glow));
        c.addAssign(vec3(this.uAccent).mul(trace).mul(aBeat()).mul(0.3));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        return vec4(c, 1);

      } else if (shaderType === 'glacier') {
        const t = this.uTime.mul(this.uSpeed).mul(0.08);
        const iceScale = this.uScale.mul(float(1).add(aBass().mul(0.3)));
        const ice1 = tslAbs(snoise(vec3(uvScaled.mul(iceScale).mul(3), t)));
        const ice2 = tslAbs(snoise(vec3(uvScaled.mul(iceScale).mul(6), t.mul(0.7))));
        const ice3 = tslAbs(snoise(vec3(uvScaled.mul(iceScale).mul(12), t.mul(0.5))));
        const sharpness1 = tslMax(float(0.1), float(0.5).sub(aBass().mul(0.2)));
        const sharpness2 = tslMax(float(0.1), float(0.7).sub(aMid().mul(0.2)));
        const crystals = tslPow(ice1, sharpness1).mul(0.5).add(tslPow(ice2, sharpness2).mul(0.3)).add(tslPow(ice3, float(0.9)).mul(0.2))
          .add(aBass().mul(0.3)).add(aBeat().mul(0.2)).toVar();
        const frostDetail = this.uScale.mul(20).add(aTreble().mul(10));
        const frost = tslSmoothstep(float(0.3).sub(aTreble().mul(0.1)), float(0.5),
          tslAbs(snoise(vec3(uvScaled.mul(frostDetail), t.mul(0.3)))))
          .mul(float(1).add(aBeat().mul(0.3)));
        const crackScale = this.uScale.mul(8).add(aBass().mul(3));
        const crackNoise = tslPow(snoise(vec3(uvScaled.mul(crackScale), t.mul(0.1))), float(2));
        const crackLine = tslSmoothstep(float(0.7).sub(aBeat().mul(0.2)), float(0.9), float(1).sub(crackNoise))
          .mul(float(1).add(aBeat()));
        const c = tslMix(
          tslMix(tslMix(this.uColor1, this.uColor2, crystals.mul(audioBrightness())),
            this.uColor3, frost.mul(0.3).mul(audioBrightness())),
          this.uAccent, crackLine.mul(this.uIntensity).mul(0.5).mul(audioBrightness())
        ).toVar();
        const shimmerSpeed = float(3).add(aTreble().mul(5));
        const shimmerVal = tslPow(snoise(vec3(uvScaled.mul(30), t.mul(shimmerSpeed))).mul(0.5).add(0.5),
          tslMax(float(2), float(8).sub(aEnergy().mul(3))))
          .mul(float(1).add(aEnergy().mul(1.5)).add(aBeat()));
        c.addAssign(vec3(0.8, 0.9, 1.0).mul(shimmerVal).mul(0.4));
        const peaks = tslSmoothstep(float(0.7), float(1), crystals).mul(float(0.2).add(aBeat().mul(0.4)));
        c.addAssign(vec3(1, 1, 1).mul(peaks));
        c.addAssign(vec3(0.7, 0.85, 1.0).mul(aBeat()).mul(0.2));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        return vec4(c, 1);

      } else if (shaderType === 'savanna') {
        const t = this.uTime.mul(this.uSpeed).mul(0.15);
        const shimmerIntensity = float(1).add(aBass().mul(2)).add(aBeat().mul(1.5));
        const shimmerX = tslSin(uvScaled.y.mul(20).add(t.mul(2))).mul(0.003).mul(shimmerIntensity);
        const shimmerY = tslCos(uvScaled.x.mul(15).add(t.mul(1.5))).mul(0.002).mul(shimmerIntensity);
        const shimmerVec = vec2(shimmerX, shimmerY).mul(float(1).sub(uvScaled.y).mul(2));
        const distortedUv = uvScaled.add(shimmerVec);
        const dustSpeed1 = float(0.2).add(aEnergy().mul(0.3));
        const dustSpeed2 = float(0.3).add(aEnergy().mul(0.4));
        const dust1 = snoise(vec3(distortedUv.mul(this.uScale).mul(2).add(vec2(t.mul(dustSpeed1), 0)), t.mul(0.1)));
        const dust2 = snoise(vec3(distortedUv.mul(this.uScale).mul(4).add(vec2(t.mul(dustSpeed2), 0)), t.mul(0.15)));
        const dust = dust1.mul(0.6).add(dust2.mul(0.4)).add(aBass().mul(0.4)).add(aBeat().mul(0.3));
        const gradientPos = uvScaled.y.add(dust.mul(0.1));
        const colorPulse = aBeat().mul(0.1);
        const c = tslMix(this.uAccent, tslMix(this.uColor3,
          tslMix(this.uColor2, this.uColor1,
            tslSmoothstep(float(0).sub(colorPulse), float(0.4).add(colorPulse), gradientPos)),
          tslSmoothstep(float(0).sub(colorPulse), float(0.25).add(colorPulse), gradientPos)),
          tslSmoothstep(float(0).sub(colorPulse), float(0.15).add(colorPulse), gradientPos)).toVar();
        // Dust particles
        const particleDensity = float(50).add(aTreble().mul(30));
        const particles = tslPow(snoise(vec3(uvScaled.mul(particleDensity), t)),
          tslMax(float(5), float(15).sub(aEnergy().mul(5))))
          .mul(float(1).sub(uvScaled.y))
          .mul(float(1).add(aBeat().mul(2)).add(aEnergy()));
        c.addAssign(vec3(this.uColor3).mul(particles));
        const heatWave = float(1).sub(uvScaled.y).mul(aBeat()).mul(0.3);
        c.addAssign(vec3(this.uAccent).mul(heatWave));
        c.addAssign(sunEffect);
        c.assign(beatGlow(c, rawUV));
        c.assign(audioSaturate(c));
        c.mulAssign(audioBrightness());
        return vec4(c, 1);
      }

      // Fallback: dark color
      return vec4(this.uColor1, 1);
    })();

    this.material = new TSL.MeshBasicNodeMaterial({
      depthWrite: false,
      depthTest: false,
      colorNode: colorNode,
    });

    this.mesh = new this.THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;

    // Create a separate scene and camera for the background
    this.bgScene = new this.THREE.Scene();
    this.bgCamera = new this.THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.bgScene.add(this.mesh);
  }

  update(deltaTime, audioData = {}) {
    if (!this.material) return;

    this.time += deltaTime;
    this.uTime.value = this.time;

    // Smooth audio values with different smoothing rates for responsiveness
    const targetEnergy = audioData.energy || 0;
    const targetBass = audioData.bass || 0;
    const targetMid = audioData.mid || 0;
    const targetTreble = audioData.treble || 0;

    // Vocals stem drives background pulse EXCLUSIVELY
    const vocalEnergy = audioData.vocalEnergy || 0;

    // Smooth frequency-based values (for legacy compatibility)
    this.audioEnergy += (targetEnergy - this.audioEnergy) * 0.15;
    this.audioBass += (targetBass - this.audioBass) * 0.2;
    this.audioMid += (targetMid - this.audioMid) * 0.15;
    this.audioTreble += (targetTreble - this.audioTreble) * 0.12;

    // Background pulse driven ONLY by VOCALS stem
    this.beatPulse += (vocalEnergy - this.beatPulse) * 0.2;

    // Apply to TSL uniforms
    this.uAudioEnergy.value = this.audioEnergy;
    this.uAudioBass.value = this.audioBass;
    this.uAudioMid.value = this.audioMid;
    this.uAudioTreble.value = this.audioTreble;
    this.uBeatPulse.value = this.beatPulse;
  }

  render(renderer) {
    // No-op: PostProcessing pipeline handles rendering both background and scene passes.
    // bgScene and bgCamera are exposed as public properties for the pipeline to use.
  }

  setColors(config) {
    if (!this.material) return;

    if (config.color1 !== undefined) this.uColor1.value.set(config.color1);
    if (config.color2 !== undefined) this.uColor2.value.set(config.color2);
    if (config.color3 !== undefined) this.uColor3.value.set(config.color3);
    if (config.accent !== undefined) this.uAccent.value.set(config.accent);
    if (config.speed !== undefined) this.uSpeed.value = config.speed;
    if (config.intensity !== undefined) this.uIntensity.value = config.intensity;
    if (config.scale !== undefined) this.uScale.value = config.scale;
    if (config.audioReactivity !== undefined) this.setAudioReactivity(config.audioReactivity);
    // Sun settings
    if (config.sunX !== undefined) this.uSunX.value = config.sunX;
    if (config.sunY !== undefined) this.uSunY.value = config.sunY;
    if (config.sunSize !== undefined) this.uSunSize.value = config.sunSize;
    if (config.sunColor !== undefined) this.uSunColor.value.set(config.sunColor);
    if (config.sunIntensity !== undefined) this.uSunIntensity.value = config.sunIntensity;
  }

  setAudioReactivity(level) {
    this.audioReactivity = Math.max(0, Math.min(1, level));
    if (this.material) {
      this.uAudioReactivity.value = this.audioReactivity;
    }
  }

  resize(width, height) {
    // No longer needed — TSL uses screenUV / uv() which are resolution-independent
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
