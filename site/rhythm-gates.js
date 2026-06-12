/**
 * RhythmGates - MIDI-locked flyable targets for the flight scene
 *
 * The rhythm-flight core loop: gates spawn ~3s ahead of the bird, positioned
 * so the bird arrives exactly when the underlying drum note lands (the MIDI
 * schedule gives us perfect lookahead via getUpcomingMidiEvents). Fly through
 * on the beat → score, combo, FLOW. Miss → streak resets, flow drains.
 *
 * Flow feeds back into the world: app.js scales bloom with it and the flight
 * scene lifts speed/terrain glow — the world's intensity is earned.
 *
 * Tracks without MIDI fall back to a BPM grid (manifest.bpm), so every track
 * is playable. Toggle with the G key (cruise mode) — handled in app.js.
 *
 * Scoring matches the existing HUD convention: points = tierScore × combo,
 * where combo = 1 + floor(streak / 4), capped. Timing skill (PERFECT window)
 * is rewarded through flow gain rather than score, so the displayed math
 * always adds up.
 */
const RhythmGates = (function () {
  'use strict';

  const CFG = {
    leadTime: 3.0,            // seconds ahead a gate spawns
    minSpawnGap: 0.45,        // min seconds between consecutive gates
    minLeadToSpawn: 1.0,      // never spawn a gate closer than this
    perfectWindow: 0.1,       // |hit - note| for PERFECT (flow x2)
    missTimeout: 0.9,         // seconds past note time before an uncrossed gate misses
    lateralJitter: 6,
    verticalJitterLo: -2,
    verticalJitterHi: 4,
    minClearance: 5,          // gate center height above ground/water
    maxAltitude: 85,
    poolSize: 14,
    comboCap: 8,
    flowStart: 0.5,
    flowBaseline: 0.4,        // flow drifts here without input
    flowDriftPerSec: 0.08,    // fraction of the gap closed per second
    flowMissPenalty: 0.12,
    hitAnimTime: 0.45,
    missAnimTime: 0.6,
    tiers: [
      { name: 'large',  radius: 9.0, score: 25,  flowBoost: 0.05, chance: 0.4, color: 0x66ccff },
      { name: 'medium', radius: 6.5, score: 50,  flowBoost: 0.08, chance: 0.4, color: 0xffcc66 },
      { name: 'small',  radius: 4.5, score: 100, flowBoost: 0.12, chance: 0.2, color: 0xffd700 },
    ],
    gridBeatsPerGate: 2,      // BPM-grid fallback: one gate every N beats
  };

  // Gate-worthy MIDI kinds (kick carries the pulse; snare/tom add variety)
  const GATE_KINDS = { kick: 1, snare: 0.6, tom: 0.3 };

  function pickTier(rng) {
    let r = rng, acc = 0;
    for (const tier of CFG.tiers) {
      acc += tier.chance;
      if (r <= acc) return tier;
    }
    return CFG.tiers[0];
  }

  class Gates {
    constructor(opts) {
      this.THREE = opts.THREE;
      this.scene = opts.scene;
      this.sceneApi = opts.sceneApi;       // flight scene: getBirdState/getGroundHeight/onGateHit
      this.getUpcoming = opts.getUpcoming; // (time, ahead) → midi events
      this.getMidiCount = opts.getMidiCount;
      this.getBpm = opts.getBpm;
      this.onScore = opts.onScore;         // (score, combo)
      this.onGateHit = opts.onGateHit;     // (combo, streak, comboIncreased, sizeTier)
      this.onFlow = opts.onFlow;           // (flow01, gateStreak)
      this.enabled = opts.enabled !== false;

      this.score = 0;
      this.combo = 1;
      this.streak = 0;
      this.maxStreak = 0;
      this.gatesHit = 0;
      this.gatesMissed = 0;
      this.flow = CFG.flowStart;

      this.planned = new Set(); // note-time keys already given a gate
      this.lastPlannedTime = -999;
      this.lastNow = 0;
      this.useGrid = null;      // lazily decided: MIDI drums vs BPM grid

      const THREE = this.THREE;
      this._v1 = new THREE.Vector3();
      this._v2 = new THREE.Vector3();
      this._fwd = new THREE.Vector3();
      this._side = new THREE.Vector3();
      this._up = new THREE.Vector3(0, 1, 0);
      this._white = new THREE.Color(0xffffff);
      this._missRed = new THREE.Color(0x883333);

      // Pooled gate meshes — one shared torus, per-gate material for tint/fade
      this.ringGeom = new THREE.TorusGeometry(1, 0.07, 10, 48);
      this.pool = [];
      for (let i = 0; i < CFG.poolSize; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(this.ringGeom, mat);
        mesh.visible = false;
        mesh.frustumCulled = false;
        mesh.renderOrder = 2; // above water/terrain transparency
        this.scene.add(mesh);
        this.pool.push({
          inUse: false, mesh, mat,
          time: 0, tier: null, radius: 1,
          pos: new THREE.Vector3(), normal: new THREE.Vector3(),
          prevAlong: -1, state: 'approach', stateStart: 0,
        });
      }
    }

    getFlow() { return this.flow; }

    setEnabled(on) {
      this.enabled = !!on;
      if (!on) this._releaseAll();
    }

    /** Clear live gates (seek, pause-jump). Score persists across the run. */
    reset() {
      this._releaseAll();
      this.planned.clear();
      this.lastPlannedTime = -999;
    }

    _releaseAll() {
      for (const g of this.pool) {
        if (g.inUse) { g.inUse = false; g.mesh.visible = false; g.mat.opacity = 0; }
      }
    }

    update(now, isPlaying) {
      // Seek backwards — planned keys ahead of us belong to the old timeline
      const dt = Math.max(0, Math.min(0.1, now - this.lastNow));
      if (now < this.lastNow - 0.25) this.reset();
      this.lastNow = now;

      if (this.enabled && isPlaying) {
        this._plan(now);
        // Flow drifts toward baseline so the bar reflects recent play
        this.flow += (CFG.flowBaseline - this.flow) * Math.min(1, CFG.flowDriftPerSec * dt);
      }
      this._updateGates(now, isPlaying);
    }

    /** Decide gate beats: drum MIDI when available, BPM grid otherwise. */
    _candidateTimes(now) {
      if (this.useGrid === null && this.getMidiCount() > 0) {
        // Decide once: does the schedule contain any drum-stem notes?
        const probe = this.getUpcoming(0, 6000);
        this.useGrid = !probe.some(e => /drum|perc/.test(e.stemId || ''));
      }
      if (this.useGrid === false) {
        const events = this.getUpcoming(now, CFG.leadTime);
        const out = [];
        for (const e of events) {
          if (e.type !== 'noteOn') continue;
          const enriched = window.MidiRouter ? window.MidiRouter.enrich(e) : e;
          const weight = GATE_KINDS[enriched.kind];
          if (!weight) continue;
          // Lighter kinds only gate on harder hits
          if ((enriched.velocity01 != null ? enriched.velocity01 : 0.8) * weight < 0.25) continue;
          out.push(e.time);
        }
        return out;
      }
      // BPM grid fallback (mix-only tracks, or MIDI not loaded yet)
      const bpm = this.getBpm() || 120;
      const interval = (60 / bpm) * CFG.gridBeatsPerGate;
      const out = [];
      let t = Math.ceil(now / interval) * interval;
      for (; t <= now + CFG.leadTime; t += interval) out.push(t);
      return out;
    }

    _plan(now) {
      const bird = this.sceneApi.getBirdState ? this.sceneApi.getBirdState() : null;
      if (!bird) return;

      for (const time of this._candidateTimes(now)) {
        const lead = time - now;
        if (lead < CFG.minLeadToSpawn) continue;
        const key = Math.round(time * 1000);
        if (this.planned.has(key)) continue;
        if (time - this.lastPlannedTime < CFG.minSpawnGap) continue;

        const gate = this.pool.find(g => !g.inUse);
        if (!gate) return; // pool exhausted — skip until one frees up

        // Place on the bird's current heading, arriving exactly on the note
        this._fwd.set(0, 0, 1).applyQuaternion(bird.quaternion);
        const dist = bird.speedPerSec * lead;
        gate.pos.copy(bird.position).addScaledVector(this._fwd, dist);
        this._side.crossVectors(this._up, this._fwd).normalize();
        gate.pos.addScaledVector(this._side, (Math.random() * 2 - 1) * CFG.lateralJitter);
        gate.pos.y = bird.position.y + CFG.verticalJitterLo
          + Math.random() * (CFG.verticalJitterHi - CFG.verticalJitterLo);

        const ground = this.sceneApi.getGroundHeight
          ? this.sceneApi.getGroundHeight(gate.pos.x, gate.pos.z) : 0;
        gate.pos.y = Math.max(ground + CFG.minClearance, Math.min(CFG.maxAltitude, gate.pos.y));

        const tier = pickTier(Math.random());
        gate.tier = tier;
        gate.radius = tier.radius;
        gate.normal.copy(this._fwd);
        gate.time = time;
        gate.prevAlong = -1;
        gate.state = 'approach';
        gate.inUse = true;

        gate.mesh.position.copy(gate.pos);
        gate.mesh.scale.setScalar(tier.radius);
        this._v1.copy(gate.pos).add(this._fwd);
        gate.mesh.lookAt(this._v1);
        gate.mat.color.setHex(tier.color);
        gate.mat.opacity = 0;
        gate.mesh.visible = true;

        this.planned.add(key);
        this.lastPlannedTime = time;
      }
    }

    _updateGates(now, isPlaying) {
      const bird = this.sceneApi.getBirdState ? this.sceneApi.getBirdState() : null;

      for (const g of this.pool) {
        if (!g.inUse) continue;

        if (g.state === 'hit' || g.state === 'miss') {
          const t = (now - g.stateStart) / (g.state === 'hit' ? CFG.hitAnimTime : CFG.missAnimTime);
          if (t >= 1 || t < 0) { g.inUse = false; g.mesh.visible = false; continue; }
          if (g.state === 'hit') {
            g.mesh.scale.setScalar(g.radius * (1 + t * 0.8));
            g.mat.opacity = (1 - t) * 0.95;
          } else {
            g.mat.color.copy(this._missRed);
            g.mat.opacity = (1 - t) * 0.4;
            g.mesh.position.y = g.pos.y - t * 2; // sags as it dies
          }
          continue;
        }

        // Approach: brighten as the note nears, beat-flash in the last 400ms
        const lead = g.time - now;
        const approach = 1 - Math.max(0, Math.min(1, lead / CFG.leadTime));
        const beatFlash = Math.exp(-(lead / 0.15) * (lead / 0.15)) * 0.35;
        g.mat.opacity = 0.12 + approach * 0.55 + beatFlash;

        if (!isPlaying || !bird) continue;

        // Plane crossing → hit if inside the ring, miss if we clipped past it
        this._v1.subVectors(bird.position, g.pos);
        const along = this._v1.dot(g.normal);
        if (g.prevAlong < 0 && along >= 0) {
          const radial = this._v2.copy(this._v1).addScaledVector(g.normal, -along).length();
          this._resolve(g, now, radial <= g.radius);
          continue;
        }
        g.prevAlong = along;

        // Never crossed it — flew around/under
        if (now > g.time + CFG.missTimeout) this._resolve(g, now, false);
      }
    }

    _resolve(g, now, hit) {
      g.state = hit ? 'hit' : 'miss';
      g.stateStart = now;
      if (hit) {
        const perfect = Math.abs(now - g.time) <= CFG.perfectWindow;
        const prevCombo = this.combo;
        this.streak++;
        this.maxStreak = Math.max(this.maxStreak, this.streak);
        this.gatesHit++;
        this.combo = Math.min(CFG.comboCap, 1 + Math.floor(this.streak / 4));
        this.score += g.tier.score * this.combo;
        this.flow = Math.min(1, this.flow + g.tier.flowBoost * (perfect ? 2 : 1));

        g.mat.color.copy(this._white);
        if (this.sceneApi.onGateHit) {
          this.sceneApi.onGateHit(g.tier.name === 'small' ? 1 : 0.7, perfect);
        }
        if (this.onScore) this.onScore(this.score, this.combo);
        if (this.onGateHit) this.onGateHit(this.combo, this.streak, this.combo > prevCombo, g.tier.name);
      } else {
        this.streak = 0;
        this.combo = 1;
        this.gatesMissed++;
        this.flow = Math.max(0, this.flow - CFG.flowMissPenalty);
        if (this.onScore) this.onScore(this.score, this.combo);
      }
      if (this.onFlow) this.onFlow(this.flow, this.streak);
    }

    dispose() {
      for (const g of this.pool) {
        this.scene.remove(g.mesh);
        g.mat.dispose();
      }
      this.pool.length = 0;
      this.ringGeom.dispose();
    }
  }

  return {
    CFG,
    create(opts) { return new Gates(opts); }
  };
})();

window.RhythmGates = RhythmGates;
