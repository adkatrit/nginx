/**
 * LyricField - Spatial lyrics you fly through ("The Word Field")
 *
 * The album's signature moment and its literal theme — "cyaan tell di code
 * from di dream." Each line's words materialize ahead of the flight path as
 * glowing 3D sprites, timed to when they're sung. They arrive flickering like
 * raw signal and RESOLVE into clear text as they near the camera — meaning
 * condensing out of noise — then the bird flies through them and they dissolve
 * into the slipstream behind.
 *
 * Lyrics are line-level (every track has them, with [Section] markers), so a
 * line's words are spread across its time window in reading order. Words are
 * placed on the bird's current heading a short lead before arrival (same
 * approach as the rhythm gates) so they stay ahead even through turns, then
 * sit world-static and are flown past — never repositioned once seen.
 *
 * Ambient by design: words don't block gates and aren't required, but flying
 * through one rewards a sip of FLOW (synesthesia, not obligation).
 *
 * Logic (tokenize/schedule/place) is GPU-free and unit-tested; sprite and
 * canvas-texture creation is guarded so any failure leaves the scene intact.
 */
const LyricField = (function () {
  'use strict';

  const CFG = {
    leadTime: 2.6,          // seconds a word spawns before its arrival
    height: 4.5,            // meters above the bird's eyeline (fly under-ish)
    lateralSpread: 5,       // gentle left/right weave so lines don't stack
    passBehind: 14,         // despawn this far behind the camera
    fadeInDist: 70,         // start visible at this range
    resolveDist: 38,        // signal→meaning fully resolved by here
    wordWorldHeight: 3.2,   // sprite height in world units
    maxWords: 18,
    minWordGap: 0.16,       // floor on spacing so fast lines stay readable
    flowPerWord: 0.015,     // FLOW sip for flying through a word
    skipTokens: new Set(['a', 'the', 'of', 'to', 'in', 'on']), // keep dense lines from crowding
  };

  /** Split a lyric line into renderable word tokens (keeps punctuation). */
  function tokenize(text) {
    return (text || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  /**
   * Schedule a line's words to arrival times across its window, in reading
   * order. Pure — returns [{ word, arrival }]. Long lines drop filler words
   * (and, the, of…) before truncating, so the kept words still read.
   */
  function scheduleLine(text, lineTime, duration, opts) {
    opts = opts || {};
    let tokens = tokenize(text);
    if (tokens.length === 0) return [];
    if (tokens.length > CFG.maxWords) {
      const kept = tokens.filter(t => !CFG.skipTokens.has(t.toLowerCase()));
      tokens = (kept.length >= 2 ? kept : tokens).slice(0, CFG.maxWords);
    }
    const n = tokens.length;
    const dur = Math.max(0.4, Math.min(duration || 3, n * 0.9));
    const gap = Math.max(CFG.minWordGap, dur / n);
    return tokens.map((word, i) => ({
      word,
      arrival: lineTime + (i + 0.5) * gap,
      emphasis: !!opts.emphasis,
    }));
  }

  class Field {
    constructor(opts) {
      this.THREE = opts.THREE;
      this.scene = opts.scene;
      this.sceneApi = opts.sceneApi;     // getBirdState/getGroundHeight
      this.onFlowSip = opts.onFlowSip || null;
      this.baseColor = opts.color || '#ffe6b0';
      this.enabled = opts.enabled !== false;
      this.ok = true;

      this.pending = [];      // scheduled words not yet spawned
      this.live = [];         // active sprites
      this.lastNow = 0;
      this.measuredSpeed = 0;
      this._prevPos = null;

      const THREE = this.THREE;
      this._fwd = new THREE.Vector3();
      this._side = new THREE.Vector3();
      this._up = new THREE.Vector3(0, 1, 0);
      this._tmp = new THREE.Vector3();
      this._weave = 0;
      this._textCache = new Map(); // word → texture (reused across lines)
    }

    setEnabled(on) {
      this.enabled = !!on;
      if (!on) this._releaseAll();
    }

    /** Queue a sung line. Replaces any not-yet-spawned words from a prior line. */
    setLine(text, lineTime, duration, opts) {
      if (!this.enabled || !this.ok) return;
      const scheduled = scheduleLine(text, lineTime, duration, opts);
      // Keep only future arrivals (a late seek shouldn't dump a whole verse)
      const now = this.lastNow;
      this.pending = scheduled.filter(w => w.arrival > now - 0.2);
    }

    reset() {
      this.pending.length = 0;
      this._releaseAll();
    }

    _releaseAll() {
      for (const s of this.live) this._dispose(s);
      this.live.length = 0;
    }

    update(now, isPlaying) {
      if (!this.ok) return;
      const THREE = this.THREE;
      const dt = Math.max(0, Math.min(0.1, now - this.lastNow));
      if (now < this.lastNow - 0.25) this.reset(); // seek-back
      this.lastNow = now;

      const bird = this.sceneApi.getBirdState ? this.sceneApi.getBirdState() : null;
      if (!bird) return;

      // Measure real speed against the music clock (display-rate independent)
      if (isPlaying && dt > 0.004) {
        if (this._prevPos) {
          const inst = this._tmp.subVectors(bird.position, this._prevPos).length() / dt;
          if (inst > 0.5 && inst < 150) {
            this.measuredSpeed = this.measuredSpeed > 0
              ? this.measuredSpeed * 0.9 + inst * 0.1 : inst;
          }
        } else {
          this._prevPos = new THREE.Vector3();
        }
        this._prevPos.copy(bird.position);
      }
      const spd = this.measuredSpeed > 1 ? this.measuredSpeed : (bird.speedPerSec || 15);

      // Spawn words entering their lead window
      if (this.enabled && isPlaying) {
        for (let i = this.pending.length - 1; i >= 0; i--) {
          const w = this.pending[i];
          const lead = w.arrival - now;
          if (lead > CFG.leadTime) continue;
          this.pending.splice(i, 1);
          if (lead < -0.3) continue; // missed its moment (hitch/seek)
          this._spawn(w, bird, spd, lead);
        }
      }

      // Animate live words: signal→meaning resolve, then fly past and dissolve
      this._fwd.set(0, 0, 1).applyQuaternion(bird.quaternion);
      for (let i = this.live.length - 1; i >= 0; i--) {
        const s = this.live[i];
        this._tmp.subVectors(s.pos, bird.position);
        const ahead = this._tmp.dot(this._fwd);     // + ahead, − behind
        const dist = this._tmp.length();

        if (!s.flew && ahead < 0) {
          s.flew = true;
          if (this.onFlowSip && dist < s.radius + 4) this.onFlowSip(CFG.flowPerWord);
        }

        let opacity;
        if (ahead >= 0) {
          // Approaching: fade in, and "resolve" out of signal flicker
          const fadeIn = Math.min(1, (CFG.fadeInDist - dist) / (CFG.fadeInDist - CFG.resolveDist));
          const resolve = Math.max(0, Math.min(1, (CFG.fadeInDist - dist) / (CFG.fadeInDist - CFG.resolveDist)));
          const flicker = (1 - resolve) * 0.5 * (0.5 + 0.5 * Math.sin(now * 47 + s.seed));
          opacity = Math.max(0, Math.min(1, fadeIn)) * (1 - flicker);
        } else {
          // Past the camera: dissolve into the slipstream
          opacity = Math.max(0, 1 + ahead / CFG.passBehind);
        }
        s.mat.opacity = opacity * (s.emphasis ? 1 : 0.92);

        if (ahead < -CFG.passBehind || (s.flew && opacity <= 0.01)) {
          this._dispose(s);
          this.live.splice(i, 1);
        }
      }
    }

    _spawn(w, bird, spd, lead) {
      const THREE = this.THREE;
      let tex = this._textCache.get(w.word);
      if (!tex) {
        tex = this._makeTexture(w.word);
        if (!tex) { this.ok = false; return; }
        this._textCache.set(w.word, tex);
      }
      const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0, depthWrite: false,
        depthTest: true, toneMapped: false,
      });
      const sprite = new THREE.Sprite(mat);
      const h = CFG.wordWorldHeight * (w.emphasis ? 1.35 : 1);
      sprite.scale.set(h * tex._aspect, h, 1);
      sprite.renderOrder = 4;

      // Place ahead on the current heading, gently weaving so lines don't stack
      this._fwd.set(0, 0, 1).applyQuaternion(bird.quaternion);
      this._side.crossVectors(this._up, this._fwd).normalize();
      this._weave += 1.1;
      const lateral = Math.sin(this._weave) * CFG.lateralSpread;
      const pos = new THREE.Vector3()
        .copy(bird.position)
        .addScaledVector(this._fwd, Math.max(6, spd * lead))
        .addScaledVector(this._side, lateral);
      pos.y = bird.position.y + CFG.height;

      const ground = this.sceneApi.getGroundHeight
        ? this.sceneApi.getGroundHeight(pos.x, pos.z) : 0;
      pos.y = Math.max(ground + 3, pos.y);

      sprite.position.copy(pos);
      this.scene.add(sprite);
      this.live.push({
        sprite, mat, pos, radius: h, emphasis: w.emphasis,
        flew: false, seed: Math.random() * 100,
      });
    }

    /** Render a word to a glowing canvas texture (cached, reused). */
    _makeTexture(word) {
      try {
        const THREE = this.THREE;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const fontPx = 96;
        const pad = 48;
        ctx.font = `700 ${fontPx}px "Inter", system-ui, sans-serif`;
        const metrics = ctx.measureText(word);
        const w = Math.ceil(metrics.width) + pad * 2;
        const h = fontPx + pad * 2;
        canvas.width = w; canvas.height = h;

        const c2 = canvas.getContext('2d');
        c2.clearRect(0, 0, w, h);
        c2.font = `700 ${fontPx}px "Inter", system-ui, sans-serif`;
        c2.textAlign = 'center';
        c2.textBaseline = 'middle';
        // Warm bloom-friendly glow + crisp core
        c2.shadowColor = this.baseColor;
        c2.shadowBlur = 28;
        c2.fillStyle = this.baseColor;
        c2.fillText(word, w / 2, h / 2);
        c2.shadowBlur = 0;
        c2.fillStyle = '#fffdf5';
        c2.fillText(word, w / 2, h / 2);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace || tex.colorSpace;
        tex.anisotropy = 4;
        tex._aspect = w / h;
        return tex;
      } catch (e) {
        console.warn('[LyricField] texture failed:', e);
        return null;
      }
    }

    _dispose(s) {
      this.scene.remove(s.sprite);
      s.mat.dispose();
    }

    dispose() {
      this._releaseAll();
      this.pending.length = 0;
      for (const tex of this._textCache.values()) tex.dispose();
      this._textCache.clear();
    }
  }

  return {
    CFG,
    tokenize,
    scheduleLine,
    create(opts) { return new Field(opts); },
  };
})();

window.LyricField = LyricField;
