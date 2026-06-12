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
    leadTime: 2.4,            // seconds ahead a gate spawns — short enough
                              // that spawn-time arc prediction stays accurate
                              // (rings NEVER move once placed)
    minSpawnGap: 0.45,        // min seconds between consecutive gates
    minLeadToSpawn: 1.0,      // never spawn a gate closer than this
    perfectWindow: 0.1,       // |hit - note| for PERFECT (flow x2)
    missTimeout: 0.9,         // seconds past note time before an uncrossed gate misses
    lateralJitter: 5,
    verticalJitterLo: -2,
    verticalJitterHi: 4,
    // Reachability budget: how fast a player can realistically translate
    // sideways/vertically while flying forward. Deliberately below the
    // bird's straight-line capability because reversing direction costs
    // ~1s of heading swing — proven fair by the inertia-limited bot test.
    lateralReachPerSec: 2.5,
    verticalReachPerSec: 3,
    // Turn-aware placement: gates spawn on the player's PREDICTED arc
    // (current turn rate, easing off with this half-life). Placement is
    // final at spawn — moving rings after the player has seen them reads
    // as the game cheating, so commitment is absolute.
    turnPredictHalfLife: 1.5,
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

  /**
   * Synthesized gate SFX — no asset files. Hit chimes climb in pitch with
   * the combo, PERFECT adds a high sparkle, misses give a dull descending
   * thud, and crossing 80% FLOW plays a small rising shimmer.
   */
  class Sfx {
    constructor(ctx) {
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(ctx.destination);
    }

    _tone(freq, at, dur, type, vol) {
      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(at);
      o.stop(at + dur + 0.02);
    }

    hit(combo, perfect) {
      try {
        const t = this.ctx.currentTime;
        // +2 semitones per combo level — the run audibly climbs
        const f = 660 * Math.pow(2, Math.min(12, (combo - 1) * 2) / 12);
        this._tone(f, t, 0.18, 'sine', 0.5);
        this._tone(f * 2, t, 0.12, 'triangle', 0.16);
        if (perfect) this._tone(f * 3, t + 0.03, 0.3, 'sine', 0.12);
      } catch (e) { /* audio context not ready — stay silent */ }
    }

    miss() {
      try {
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(65, t + 0.18);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g);
        g.connect(this.master);
        o.start(t);
        o.stop(t + 0.22);
      } catch (e) { /* ignore */ }
    }

    shimmer() {
      try {
        const t = this.ctx.currentTime;
        this._tone(523, t, 0.15, 'sine', 0.14);
        this._tone(659, t + 0.07, 0.15, 'sine', 0.14);
        this._tone(784, t + 0.14, 0.25, 'sine', 0.16);
      } catch (e) { /* ignore */ }
    }
  }

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
      this.perfectCount = 0;
      this.flow = CFG.flowStart;
      this.flowSum = 0;   // time-weighted, for end-of-run average
      this.flowTime = 0;
      this._shimmerArmed = true;

      this.sfx = null;
      if (opts.audioContext) {
        try { this.sfx = new Sfx(opts.audioContext); } catch (e) { this.sfx = null; }
      }

      this.planned = new Set(); // note-time keys already given a gate
      this.lastPlannedTime = -999;
      this.lastNow = 0;
      this.useGrid = null;      // lazily decided: MIDI drums vs BPM grid
      this.laneLat = 0;         // smoothly wandering lane (gate-to-gate coherent)
      this.laneY = null;
      // Measured flight speed (units per second of MUSIC time). The flight
      // model is per-frame, so assumed speed breaks on non-60Hz displays —
      // measuring keeps gate arrival locked to the note regardless of fps.
      this.measuredSpeed = 0;
      this._prevBirdPos = null;
      this.headingRate = 0;     // smoothed yaw rate (rad/s) for arc prediction
      this._prevHeading = null;

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

      // Lane thread: a faint line from the bird through the next few gates,
      // so players fly the path instead of reacting ring by ring. Vertex
      // brightness fades with order (reads as alpha under additive blending).
      this.threadMax = 5; // bird + up to 4 gates
      this.threadPos = new Float32Array(this.threadMax * 3);
      this.threadCol = new Float32Array(this.threadMax * 3);
      this.threadGeom = new THREE.BufferGeometry();
      this.threadGeom.setAttribute('position', new THREE.BufferAttribute(this.threadPos, 3));
      this.threadGeom.setAttribute('color', new THREE.BufferAttribute(this.threadCol, 3));
      this.threadMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      this.threadLine = new THREE.Line(this.threadGeom, this.threadMat);
      this.threadLine.visible = false;
      this.threadLine.frustumCulled = false;
      this.threadLine.renderOrder = 1;
      this.scene.add(this.threadLine);
      this._threadSort = [];
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
      this.laneLat = 0;
      this.laneY = null;
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

      // Track real speed + turn rate against the music clock (EMA, jump-guarded)
      const birdNow = this.sceneApi.getBirdState ? this.sceneApi.getBirdState() : null;
      if (birdNow && isPlaying && dt > 0.004) {
        if (this._prevBirdPos) {
          const inst = this._v1.subVectors(birdNow.position, this._prevBirdPos).length() / dt;
          if (inst > 0.5 && inst < 150) {
            this.measuredSpeed = this.measuredSpeed > 0
              ? this.measuredSpeed * 0.92 + inst * 0.08
              : inst;
          }
        } else {
          this._prevBirdPos = new this.THREE.Vector3();
        }
        this._prevBirdPos.copy(birdNow.position);

        this._fwd.set(0, 0, 1).applyQuaternion(birdNow.quaternion);
        const heading = Math.atan2(this._fwd.x, this._fwd.z);
        if (this._prevHeading !== null) {
          let dh = heading - this._prevHeading;
          if (dh > Math.PI) dh -= 2 * Math.PI;
          else if (dh < -Math.PI) dh += 2 * Math.PI;
          const wInst = Math.max(-1.5, Math.min(1.5, dh / dt));
          this.headingRate = this.headingRate * 0.85 + wInst * 0.15;
        }
        this._prevHeading = heading;
      }

      if (this.enabled && isPlaying) {
        this._plan(now);
        // Flow drifts toward baseline so the bar reflects recent play
        this.flow += (CFG.flowBaseline - this.flow) * Math.min(1, CFG.flowDriftPerSec * dt);
        this.flowSum += this.flow * dt;
        this.flowTime += dt;
        // Shimmer once each time flow climbs through 80%
        if (this.flow >= 0.8 && this._shimmerArmed) {
          this._shimmerArmed = false;
          if (this.sfx) this.sfx.shimmer();
        } else if (this.flow < 0.7) {
          this._shimmerArmed = true;
        }
      }
      this._updateGates(now, isPlaying);
      this._updateThread();
    }

    _updateThread() {
      const bird = this.sceneApi.getBirdState ? this.sceneApi.getBirdState() : null;
      const list = this._threadSort;
      list.length = 0;
      if (this.enabled && bird) {
        for (const g of this.pool) {
          if (g.inUse && g.state === 'approach') list.push(g);
        }
        list.sort((a, b) => a.time - b.time);
      }
      const n = Math.min(this.threadMax - 1, list.length);
      if (n === 0) { this.threadLine.visible = false; return; }

      this.threadPos[0] = bird.position.x;
      this.threadPos[1] = bird.position.y - 0.8; // just under the bird, out of the camera line
      this.threadPos[2] = bird.position.z;
      this.threadCol[0] = 0.22; this.threadCol[1] = 0.19; this.threadCol[2] = 0.12;
      for (let i = 0; i < n; i++) {
        const g = list[i];
        const o = (i + 1) * 3;
        this.threadPos[o] = g.pos.x;
        this.threadPos[o + 1] = g.pos.y;
        this.threadPos[o + 2] = g.pos.z;
        const b = 0.8 * (1 - i / 4); // nearest segment brightest
        this.threadCol[o] = b;
        this.threadCol[o + 1] = b * 0.85;
        this.threadCol[o + 2] = b * 0.55;
      }
      this.threadGeom.setDrawRange(0, n + 1);
      this.threadGeom.attributes.position.needsUpdate = true;
      this.threadGeom.attributes.color.needsUpdate = true;
      this.threadLine.visible = true;
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

        const gapPrev = Math.min(3, Math.max(0.1, time - this.lastPlannedTime));

        // Serpentine lane: a slow sine of note time has bounded slope AND
        // bounded curvature, so direction reversals are always gentle enough
        // for the bird's yaw inertia (a random walk is not — it can demand
        // instant velocity flips). Small jitter adds variety on top.
        const latTarget = Math.sin(time * 0.4) * CFG.lateralJitter
          + (Math.random() * 2 - 1) * 0.8;
        const maxLatDelta = CFG.lateralReachPerSec * gapPrev;
        this.laneLat = Math.max(this.laneLat - maxLatDelta,
          Math.min(this.laneLat + maxLatDelta, latTarget));
        const latReach = CFG.lateralReachPerSec * lead;
        gate.latOffset = Math.max(-latReach, Math.min(latReach, this.laneLat));

        const vTarget = bird.position.y + 0.5
          + Math.sin(time * 0.27 + 2) * 2.5
          + (Math.random() * 2 - 1) * 0.6;
        const maxVDelta = CFG.verticalReachPerSec * gapPrev;
        if (this.laneY === null) this.laneY = bird.position.y;
        this.laneY = Math.max(this.laneY - maxVDelta,
          Math.min(this.laneY + maxVDelta, vTarget));
        const vReach = CFG.verticalReachPerSec * lead;
        gate.yOff = Math.max(-vReach, Math.min(vReach, this.laneY - bird.position.y));

        const tier = pickTier(Math.random());
        gate.tier = tier;
        gate.radius = tier.radius;
        gate.time = time;
        gate.prevAlong = -1;
        gate.state = 'approach';
        gate.inUse = true;

        // Position on the PREDICTED arc (turn-aware), then dress the mesh
        gate.pos.copy(this._placeGate(gate, bird, lead));
        gate.normal.copy(this._fwd);
        this.laneY = gate.pos.y; // keep the lane anchored to where gates really are

        gate.mesh.position.copy(gate.pos);
        gate.mesh.scale.setScalar(tier.radius);
        this._v1.copy(gate.pos).add(gate.normal);
        gate.mesh.lookAt(this._v1);
        gate.mat.color.setHex(tier.color);
        gate.mat.opacity = 0;
        gate.mesh.visible = true;

        this.planned.add(key);
        this.lastPlannedTime = time;
      }
    }

    /**
     * Position a gate `lead` seconds out along the bird's PREDICTED arc —
     * heading integrated forward with the current turn rate, easing off with
     * a half-life (players rarely hold a turn for the full approach).
     * Leaves the arrival heading in this._fwd; returns a scratch vector.
     */
    _placeGate(gate, bird, lead) {
      this._fwd.set(0, 0, 1).applyQuaternion(bird.quaternion);
      let phi = Math.atan2(this._fwd.x, this._fwd.z);
      const spd = this.measuredSpeed > 1 ? this.measuredSpeed : bird.speedPerSec;
      let w = this.headingRate;
      const steps = 6;
      const stepT = lead / steps;
      const decay = Math.pow(0.5, stepT / CFG.turnPredictHalfLife);
      let px = bird.position.x, pz = bird.position.z;
      for (let s = 0; s < steps; s++) {
        phi += w * stepT;
        px += Math.sin(phi) * spd * stepT;
        pz += Math.cos(phi) * spd * stepT;
        w *= decay;
      }
      this._fwd.set(Math.sin(phi), 0, Math.cos(phi));
      this._side.crossVectors(this._up, this._fwd).normalize();
      this._v2.set(px, 0, pz).addScaledVector(this._side, gate.latOffset);
      let y = bird.position.y + gate.yOff;
      const ground = this.sceneApi.getGroundHeight
        ? this.sceneApi.getGroundHeight(this._v2.x, this._v2.z) : 0;
      this._v2.y = Math.max(ground + CFG.minClearance, Math.min(CFG.maxAltitude, y));
      return this._v2;
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
        if (perfect) this.perfectCount++;
        this.combo = Math.min(CFG.comboCap, 1 + Math.floor(this.streak / 4));
        this.score += g.tier.score * this.combo;
        this.flow = Math.min(1, this.flow + g.tier.flowBoost * (perfect ? 2 : 1));

        g.mat.color.copy(this._white);
        if (this.sfx) this.sfx.hit(this.combo, perfect);
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
        if (this.sfx) this.sfx.miss();
        if (this.onScore) this.onScore(this.score, this.combo);
      }
      if (this.onFlow) this.onFlow(this.flow, this.streak);
    }

    /** End-of-run summary, shaped for app.js's showRunSummary(). */
    getStats() {
      const total = this.gatesHit + this.gatesMissed;
      const gateAccuracy = total > 0 ? this.gatesHit / total : 0;
      const flowAvg = this.flowTime > 0 ? this.flowSum / this.flowTime : 0;
      let rank = 'C';
      if (gateAccuracy >= 0.95 && flowAvg >= 0.7) rank = 'S';
      else if (gateAccuracy >= 0.85 && flowAvg >= 0.55) rank = 'A';
      else if (gateAccuracy >= 0.65) rank = 'B';
      return {
        score: this.score,
        rank,
        flowAvg,
        gateAccuracy,
        gateStreakMax: this.maxStreak,
        gatesHit: this.gatesHit,
        gatesMissed: this.gatesMissed,
        perfectCount: this.perfectCount,
      };
    }

    /** Fresh run on the same track (replay after the end screen). */
    resetRun() {
      this.reset();
      this.score = 0;
      this.combo = 1;
      this.streak = 0;
      this.maxStreak = 0;
      this.gatesHit = 0;
      this.gatesMissed = 0;
      this.perfectCount = 0;
      this.flow = CFG.flowStart;
      this.flowSum = 0;
      this.flowTime = 0;
      this._shimmerArmed = true;
    }

    dispose() {
      for (const g of this.pool) {
        this.scene.remove(g.mesh);
        g.mat.dispose();
      }
      this.pool.length = 0;
      this.ringGeom.dispose();
      this.scene.remove(this.threadLine);
      this.threadGeom.dispose();
      this.threadMat.dispose();
    }
  }

  return {
    CFG,
    create(opts) { return new Gates(opts); }
  };
})();

window.RhythmGates = RhythmGates;
