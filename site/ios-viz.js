/**
 * iOS Simple Particle Visualization
 * A lightweight particle system that works without Web Audio API
 * Animates floating particles that respond to playback state
 */
(function() {
  'use strict';

  // Particle configuration
  const CONFIG = {
    particleCount: 60,
    minSize: 2,
    maxSize: 6,
    minSpeed: 0.2,
    maxSpeed: 0.8,
    fadeSpeed: 0.015,
    glowIntensity: 0.6,
    colors: [
      { r: 100, g: 200, b: 255 },  // Cyan
      { r: 150, g: 100, b: 255 },  // Purple
      { r: 255, g: 150, b: 200 },  // Pink
      { r: 100, g: 255, b: 200 },  // Teal
    ]
  };

  class Particle {
    constructor(canvas) {
      this.canvas = canvas;
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * this.canvas.width;
      this.y = initial
        ? Math.random() * this.canvas.height
        : this.canvas.height + 20;
      this.size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
      this.speedY = -(CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed));
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = 0;
      this.targetOpacity = 0.3 + Math.random() * 0.5;
      this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.wobbleOffset = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.02 + Math.random() * 0.02;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(isPlaying, time) {
      // Fade in/out based on playback
      if (isPlaying) {
        this.opacity += (this.targetOpacity - this.opacity) * 0.05;
      } else {
        this.opacity *= 0.98;
      }

      // Only move when playing
      if (isPlaying) {
        // Gentle upward float with wobble
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(time * this.wobbleSpeed + this.wobbleOffset) * 0.3;

        // Subtle pulse
        this.pulsePhase += 0.03;
      }

      // Reset when off screen
      if (this.y < -20) {
        this.reset();
      }

      // Wrap horizontally
      if (this.x < -20) this.x = this.canvas.width + 20;
      if (this.x > this.canvas.width + 20) this.x = -20;
    }

    draw(ctx) {
      if (this.opacity < 0.01) return;

      const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;
      const size = this.size * pulse;
      const { r, g, b } = this.color;

      // Glow effect
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, size * 3
      );
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity})`);
      gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${this.opacity * CONFIG.glowIntensity})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core particle
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
      ctx.fill();
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

      this.resize();
      this.initParticles();

      // Handle resize
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
      for (let i = 0; i < CONFIG.particleCount; i++) {
        this.particles.push(new Particle({
          width: this.displayWidth || window.innerWidth,
          height: this.displayHeight || window.innerHeight
        }));
      }
    }

    setPlaying(playing) {
      this.isPlaying = playing;
      if (playing && !this.animationId) {
        this.start();
      }
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

      this.draw();
    }

    draw() {
      const ctx = this.ctx;
      const w = this.displayWidth;
      const h = this.displayHeight;

      // Clear with slight fade for trails
      ctx.fillStyle = 'rgba(7, 10, 24, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Update and draw particles
      for (const particle of this.particles) {
        // Update particle's canvas reference for proper bounds
        particle.canvas = { width: w, height: h };
        particle.update(this.isPlaying, this.time);
        particle.draw(ctx);
      }
    }

    dispose() {
      this.stop();
      this.particles = [];
    }
  }

  // Export for use in app.js
  window.iOSVisualization = iOSVisualization;
})();
