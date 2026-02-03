/**
 * iOS Audio-Reactive Particle Visualization
 * A dramatic particle system that reacts strongly to audio frequency data
 */
(function() {
  'use strict';

  const CONFIG = {
    particleCount: 120,
    minSize: 4,
    maxSize: 16,
    minSpeed: 0.3,
    maxSpeed: 1.2,
    glowIntensity: 0.85,
    // Vivid color palettes for different frequency bands
    bassColors: [
      { r: 255, g: 30, b: 80 },    // Hot pink
      { r: 255, g: 60, b: 20 },    // Red-orange
      { r: 255, g: 0, b: 100 },    // Magenta
    ],
    midColors: [
      { r: 0, g: 200, b: 255 },    // Bright cyan
      { r: 120, g: 80, b: 255 },   // Purple
      { r: 0, g: 255, b: 200 },    // Aqua
    ],
    trebleColors: [
      { r: 255, g: 255, b: 100 },  // Bright yellow
      { r: 180, g: 255, b: 100 },  // Lime
      { r: 255, g: 200, b: 255 },  // Light pink
    ]
  };

  class Particle {
    constructor(canvas, band = 'mid') {
      this.canvas = canvas;
      this.band = band;
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * this.canvas.width;
      this.y = initial
        ? Math.random() * this.canvas.height
        : this.canvas.height + 50;
      this.baseSize = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
      this.size = this.baseSize;
      this.baseSpeedY = -(CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed));
      this.speedY = this.baseSpeedY;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.opacity = 0;
      this.targetOpacity = 0.6 + Math.random() * 0.4;

      const colors = this.band === 'bass' ? CONFIG.bassColors :
                     this.band === 'treble' ? CONFIG.trebleColors : CONFIG.midColors;
      this.color = colors[Math.floor(Math.random() * colors.length)];

      this.wobbleOffset = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.02 + Math.random() * 0.02;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.reactivity = 0.7 + Math.random() * 0.3;
    }

    update(isPlaying, time, audioLevel = 0) {
      if (isPlaying) {
        // Strong fade in with audio boost
        const targetWithAudio = this.targetOpacity * (0.4 + audioLevel * 0.8);
        this.opacity += (targetWithAudio - this.opacity) * 0.12;
      } else {
        this.opacity *= 0.94;
      }

      if (isPlaying) {
        // Dramatic size boost from audio
        const sizeBoost = 1 + audioLevel * this.reactivity * 4;
        this.size = this.baseSize * sizeBoost;

        // Speed reacts strongly to audio
        const speedBoost = 1 + audioLevel * this.reactivity * 3;
        this.speedY = this.baseSpeedY * speedBoost;

        this.y += this.speedY;
        const wobbleAmount = 0.5 + audioLevel * 1.5;
        this.x += this.speedX + Math.sin(time * this.wobbleSpeed + this.wobbleOffset) * wobbleAmount;

        this.pulsePhase += 0.04 + audioLevel * 0.1;
      }

      if (this.y < -50) {
        this.reset();
      }

      if (this.x < -50) this.x = this.canvas.width + 50;
      if (this.x > this.canvas.width + 50) this.x = -50;
    }

    draw(ctx, globalEnergy = 0) {
      if (this.opacity < 0.01) return;

      const pulse = 1 + Math.sin(this.pulsePhase) * (0.2 + globalEnergy * 0.3);
      const size = this.size * pulse;
      const { r, g, b } = this.color;

      // Big dramatic glow
      const glowSize = size * (3 + globalEnergy * 3);
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, glowSize
      );
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity})`);
      gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${this.opacity * CONFIG.glowIntensity * 0.4})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)}, ${this.opacity})`;
      ctx.fill();

      // White hot center for energy
      if (globalEnergy > 0.3) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * globalEnergy * 0.5})`;
        ctx.fill();
      }
    }
  }

  class iOSVisualization {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.isPlaying = false;
      this.animationId = null;
      this.time = 0;
      this.lastTime = 0;

      this.bass = 0;
      this.mid = 0;
      this.treble = 0;
      this.energy = 0;

      this.smoothBass = 0;
      this.smoothMid = 0;
      this.smoothTreble = 0;
      this.smoothEnergy = 0;

      // For beat detection
      this.lastBass = 0;
      this.beatPulse = 0;
      this.hasRealAudioData = false;

      this.resize();
      this.initParticles();

      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.displayWidth = rect.width;
      this.displayHeight = rect.height;
    }

    initParticles() {
      this.particles = [];
      const bands = ['bass', 'bass', 'mid', 'mid', 'mid', 'treble'];
      for (let i = 0; i < CONFIG.particleCount; i++) {
        const band = bands[i % bands.length];
        this.particles.push(new Particle({
          width: this.displayWidth || window.innerWidth,
          height: this.displayHeight || window.innerHeight
        }, band));
      }
    }

    setPlaying(playing) {
      this.isPlaying = playing;
      if (playing && !this.animationId) {
        this.start();
      }
    }

    setAudioData(bass, mid, treble, energy) {
      this.bass = bass;
      this.mid = mid;
      this.treble = treble;
      this.energy = energy;
      this.hasRealAudioData = energy > 0.01;
    }

    start() {
      if (this.animationId) return;
      this.lastTime = performance.now();
      this.loop();
      this.canvas.classList.add('is-on');
    }

    stop() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      this.canvas.classList.remove('is-on');
    }

    loop() {
      this.animationId = requestAnimationFrame(() => this.loop());

      const now = performance.now();
      const delta = now - this.lastTime;
      this.lastTime = now;
      this.time += delta;

      // If no real audio data, simulate it when playing
      let bass = this.bass;
      let mid = this.mid;
      let treble = this.treble;
      let energy = this.energy;

      if (this.isPlaying && !this.hasRealAudioData) {
        // Simulate audio reactivity with procedural noise
        const t = this.time * 0.001;
        bass = 0.4 + 0.4 * Math.sin(t * 2.1) * Math.sin(t * 0.7);
        mid = 0.5 + 0.3 * Math.sin(t * 3.3 + 1) * Math.sin(t * 1.1);
        treble = 0.3 + 0.4 * Math.sin(t * 5.7 + 2) * Math.sin(t * 1.7);
        energy = (bass + mid + treble) / 3;

        // Add random beats
        if (Math.random() < 0.02) {
          bass = 0.8 + Math.random() * 0.2;
        }
      }

      // Responsive smoothing - faster attack, slower decay
      const attackSmooth = 0.3;
      const decaySmooth = 0.08;

      this.smoothBass += (bass - this.smoothBass) * (bass > this.smoothBass ? attackSmooth : decaySmooth);
      this.smoothMid += (mid - this.smoothMid) * (mid > this.smoothMid ? attackSmooth : decaySmooth);
      this.smoothTreble += (treble - this.smoothTreble) * (treble > this.smoothTreble ? attackSmooth : decaySmooth);
      this.smoothEnergy += (energy - this.smoothEnergy) * (energy > this.smoothEnergy ? attackSmooth : decaySmooth);

      // Beat detection for bass hits
      if (this.smoothBass > this.lastBass + 0.15 && this.smoothBass > 0.4) {
        this.beatPulse = 1;
      }
      this.beatPulse *= 0.9;
      this.lastBass = this.smoothBass;

      this.draw();
    }

    draw() {
      const ctx = this.ctx;
      const w = this.displayWidth;
      const h = this.displayHeight;

      // Clear with variable fade - creates trails
      const fadeAmount = 0.08 + this.smoothEnergy * 0.12;
      ctx.fillStyle = `rgba(7, 10, 24, ${fadeAmount})`;
      ctx.fillRect(0, 0, w, h);

      // Bass hit flash
      if (this.beatPulse > 0.1) {
        const flashOpacity = this.beatPulse * 0.25;
        ctx.fillStyle = `rgba(255, 50, 100, ${flashOpacity})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Ambient glow based on energy
      if (this.smoothEnergy > 0.2) {
        const gradient = ctx.createRadialGradient(
          w / 2, h / 2, 0,
          w / 2, h / 2, Math.max(w, h) * 0.6
        );
        const glowOpacity = this.smoothEnergy * 0.15;
        gradient.addColorStop(0, `rgba(100, 150, 255, ${glowOpacity})`);
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      // Update and draw particles
      for (const particle of this.particles) {
        particle.canvas = { width: w, height: h };

        let audioLevel = this.smoothEnergy;
        if (particle.band === 'bass') audioLevel = this.smoothBass;
        else if (particle.band === 'mid') audioLevel = this.smoothMid;
        else if (particle.band === 'treble') audioLevel = this.smoothTreble;

        particle.update(this.isPlaying, this.time, audioLevel);
        particle.draw(ctx, this.smoothEnergy);
      }

      // Frequency bars at bottom - bigger and more visible
      this.drawFrequencyBars(ctx, w, h);
    }

    drawFrequencyBars(ctx, w, h) {
      const barHeight = 8;
      const gap = 4;
      const y = h - barHeight - 10;
      const barWidth = (w - gap * 4) / 3;

      // Bass bar (left) - red/pink
      const bassGradient = ctx.createLinearGradient(gap, 0, gap + barWidth * this.smoothBass, 0);
      bassGradient.addColorStop(0, `rgba(255, 50, 100, ${0.4 + this.smoothBass * 0.6})`);
      bassGradient.addColorStop(1, `rgba(255, 100, 150, ${0.4 + this.smoothBass * 0.6})`);
      ctx.fillStyle = bassGradient;
      ctx.fillRect(gap, y, barWidth * this.smoothBass, barHeight);

      // Mid bar (center) - cyan/blue
      const midX = gap * 2 + barWidth;
      const midGradient = ctx.createLinearGradient(midX, 0, midX + barWidth * this.smoothMid, 0);
      midGradient.addColorStop(0, `rgba(0, 200, 255, ${0.4 + this.smoothMid * 0.6})`);
      midGradient.addColorStop(1, `rgba(100, 150, 255, ${0.4 + this.smoothMid * 0.6})`);
      ctx.fillStyle = midGradient;
      ctx.fillRect(midX, y, barWidth * this.smoothMid, barHeight);

      // Treble bar (right) - yellow/green
      const trebleX = gap * 3 + barWidth * 2;
      const trebleGradient = ctx.createLinearGradient(trebleX, 0, trebleX + barWidth * this.smoothTreble, 0);
      trebleGradient.addColorStop(0, `rgba(255, 255, 100, ${0.4 + this.smoothTreble * 0.6})`);
      trebleGradient.addColorStop(1, `rgba(200, 255, 150, ${0.4 + this.smoothTreble * 0.6})`);
      ctx.fillStyle = trebleGradient;
      ctx.fillRect(trebleX, y, barWidth * this.smoothTreble, barHeight);

      // Glow behind bars
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(255, 100, 150, 0.5)';
      ctx.fillRect(gap, y, barWidth * this.smoothBass, barHeight);
      ctx.shadowColor = 'rgba(0, 200, 255, 0.5)';
      ctx.fillRect(midX, y, barWidth * this.smoothMid, barHeight);
      ctx.shadowColor = 'rgba(255, 255, 100, 0.5)';
      ctx.fillRect(trebleX, y, barWidth * this.smoothTreble, barHeight);
      ctx.shadowBlur = 0;
    }

    dispose() {
      this.stop();
      this.particles = [];
    }
  }

  window.iOSVisualization = iOSVisualization;
})();
