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
    leadTime: 1.9,          // seconds a word spawns before its arrival — short
                            // enough that only ~1-2 words share the screen
    height: 2.2,            // meters above the bird's eyeline — on the flight
                            // line so you fly THROUGH words, not under them
    lateralSpread: 9,       // left/right placement so consecutive words land at
                            // clearly different screen positions (no pile-up)
    vertSpread: 3.4,        // up/down offset, alternated, for extra separation
    passBehind: 12,         // despawn this far behind the camera
    fadeInDist: 64,         // start visible at this range
    resolveDist: 44,        // signal→meaning fully resolved by here (early, so
                            // words are clean long before you reach them)
    wordWorldHeight: 3.4,   // sprite height in world units
    maxWords: 14,
    minWordGap: 0.34,       // floor on spacing so words don't bunch in time
    minConcurrent: 0,       // (reserved)
    maxConcurrent: 3,       // hard cap on words alive at once — readability over density
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
    // Space words out in time. The floor (minWordGap) keeps fast lines from
    // bunching so only a couple are ever resolving at once.
    const gap = Math.max(CFG.minWordGap, dur / n);
    return tokens.map((word, i) => ({
      word,
      arrival: lineTime + (i + 0.5) * gap,
      idx: i,                       // sequence index drives lateral/vertical lane
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

      // Spawn words entering their lead window. Cap how many are alive at once
      // so the screen stays readable on dense lines — count only those still
      // ahead of the camera (past ones are dissolving and don't crowd reading).
      if (this.enabled && isPlaying) {
        let aheadCount = 0;
        for (const s of this.live) if (!s.flew) aheadCount++;
        // Earliest-arrival first, so we drop the right ones when over budget.
        this.pending.sort((a, b) => a.arrival - b.arrival);
        for (let i = 0; i < this.pending.length; i++) {
          const w = this.pending[i];
          const lead = w.arrival - now;
          if (lead > CFG.leadTime) break;     // sorted: nothing earlier remains
          this.pending.splice(i, 1); i--;
          if (lead < -0.3) continue;          // missed its moment (hitch/seek)
          if (aheadCount >= CFG.maxConcurrent) continue; // over budget: skip it
          this._spawn(w, bird, spd, lead);
          aheadCount++;
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
          // Approaching: fade in, and "resolve" out of signal flicker. Both
          // complete by resolveDist so the word is fully solid and legible
          // well before you reach it (no shimmering at close range).
          const t = (CFG.fadeInDist - dist) / (CFG.fadeInDist - CFG.resolveDist);
          const resolve = Math.max(0, Math.min(1, t));
          // Gentle flicker only during the initial "signal" phase; gone by ~70%.
          const sig = Math.max(0, 1 - resolve / 0.7);
          const flicker = sig * 0.4 * (0.5 + 0.5 * Math.sin(now * 32 + s.seed));
          opacity = resolve * (1 - flicker);
        } else {
          // Past the camera: dissolve into the slipstream
          opacity = Math.max(0, 1 + ahead / CFG.passBehind);
        }
        // Keep words near-opaque so they read clearly and don't smear together.
        s.mat.opacity = Math.min(1, opacity);

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
      const h = CFG.wordWorldHeight * (w.emphasis ? 1.3 : 1);
      sprite.scale.set(h * tex._aspect, h, 1);
      sprite.renderOrder = 4;

      // Place ahead on the current heading. Consecutive words are staggered
      // across distinct lateral lanes AND alternating vertical offsets so they
      // project to clearly separate screen positions instead of piling up at
      // center. The lane pattern (−1, +1, 0, −1, +1, …) reads left→right→mid.
      this._fwd.set(0, 0, 1).applyQuaternion(bird.quaternion);
      this._side.crossVectors(this._up, this._fwd).normalize();
      const seq = (w.idx != null) ? w.idx : (this._weave++ | 0);
      const lanePattern = [-1, 1, -0.45, 0.45];
      const lane = lanePattern[seq % lanePattern.length];
      const lateral = lane * CFG.lateralSpread;
      const vert = ((seq % 2 === 0) ? 1 : -1) * CFG.vertSpread * 0.5;

      // Depth: keep words at least a sprite-width apart in distance so that
      // even same-lane words separate cleanly along the flight line.
      const depth = Math.max(8, spd * lead);
      const pos = new THREE.Vector3()
        .copy(bird.position)
        .addScaledVector(this._fwd, depth)
        .addScaledVector(this._side, lateral);
      pos.y = bird.position.y + CFG.height + vert;

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
        const fontPx = 104;
        const padX = 56;
        const padY = 40;
        const font = `800 ${fontPx}px "Inter", system-ui, sans-serif`;
        ctx.font = font;
        const metrics = ctx.measureText(word);
        const w = Math.ceil(metrics.width) + padX * 2;
        const h = fontPx + padY * 2;
        canvas.width = w; canvas.height = h;

        const c2 = canvas.getContext('2d');
        c2.clearRect(0, 0, w, h);

        // Dark rounded backing plate so the word reads against bright water
        // AND dark sky without smearing into either. Kept subtle and inset.
        const bx = 10, by = 10, bw = w - 20, bh = h - 20, br = h * 0.34;
        c2.fillStyle = 'rgba(6, 10, 16, 0.62)';
        this._roundRect(c2, bx, by, bw, bh, br);
        c2.fill();

        c2.font = font;
        c2.textAlign = 'center';
        c2.textBaseline = 'middle';
        const cx = w / 2, cy = h / 2;

        // Soft outer glow (one bloom pass; the core layers stay crisp).
        c2.shadowColor = this.baseColor;
        c2.shadowBlur = 22;
        c2.fillStyle = this.baseColor;
        c2.fillText(word, cx, cy);
        c2.shadowBlur = 0;

        // Heavy dark stroke = high-contrast edge in any environment.
        c2.lineJoin = 'round';
        c2.miterLimit = 2;
        c2.strokeStyle = 'rgba(2, 6, 12, 0.95)';
        c2.lineWidth = 12;
        c2.strokeText(word, cx, cy);

        // Warm coloured rim just inside the dark stroke for depth.
        c2.strokeStyle = this.baseColor;
        c2.lineWidth = 5;
        c2.strokeText(word, cx, cy);

        // Bright near-white core for legibility at the center of the glyph.
        c2.fillStyle = '#fffdf5';
        c2.fillText(word, cx, cy);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace || tex.colorSpace;
        tex.anisotropy = 8;
        if (THREE.LinearMipmapLinearFilter) tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.generateMipmaps = true;
        tex._aspect = w / h;
        return tex;
      } catch (e) {
        console.warn('[LyricField] texture failed:', e);
        return null;
      }
    }

    _roundRect(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
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
