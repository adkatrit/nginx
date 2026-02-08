# Scene Director — System Specification

> The runtime Conductor that reads AI-composed scores and orchestrates
> the visual journey through a song, while coexisting with the existing
> real-time audio-reactive systems.

---

## 1. Core Architecture: Three Layers

```
 LAYER              WHEN IT RUNS           WHAT IT DOES
 ─────────────────  ─────────────────────  ──────────────────────────────────
 Composer           Once (build time)      Claude API writes the score
                    process-track.py       (theme-config.json)

 Conductor          Every frame (runtime)  Reads score, manages state,
                    scene-director.js      interpolates params, emits cues

 Musicians          Every frame (runtime)  Play their instruments:
                    environments.js        FFT→visuals, MIDI→events,
                    effects-manager.js     stem→routing (unchanged code)
                    backgrounds.js
```

### Key Principle: AC/DC Separation

The Conductor controls the **DC offset** (baseline parameters).
The Musicians provide the **AC signal** (real-time reactive oscillation).

```
final_value = conductor_baseline + reactive_delta

Example — fog near distance:
  conductor says:  fogNear_baseline = 30  (verse, foggy)
  then at chorus:  fogNear_baseline = 80  (chorus, clear)
  reactive layer:  fogNear_delta = -energy * 10  (always happening)
  actual render:   scene.fog.near = fogNear_baseline + fogNear_delta
```

The reactive code doesn't change. The Director just moves the
center point that the reactive code oscillates around.

---

## 2. The Score Format: theme-config.json

The Composer (Claude API) generates this file once per track.
The Conductor reads it at track load time.

```json
{
  "version": 1,
  "generated": "2025-02-07T12:00:00Z",

  "identity": {
    "model": "jellyfish",
    "background": "ocean",
    "colorTheme": "winamp41",
    "environmentType": "ocean"
  },

  "defaults": {
    "fog": { "near": 30, "far": 200, "color": "#000810" },
    "camera": { "distance": 12, "height": 4, "lookAhead": 20, "fov": 60 },
    "particles": { "type": "bubbles", "count": 500, "speed": 1.0, "opacity": 0.5 },
    "terrain": { "amplitude": 4.0 },
    "effects": {
      "lightning": { "enabled": false },
      "aurora":    { "enabled": false, "intensity": 0.5 },
      "grid":      { "enabled": false, "intensity": 0.4 },
      "godRays":   { "enabled": false },
      "speedLines": { "opacity": 1.0 }
    },
    "lighting": {
      "ambientIntensity": 0.3,
      "directionalIntensity": 1.0
    },
    "speed": {
      "baseMultiplier": 1.0
    },
    "backgroundShader": {
      "speed": 0.8,
      "intensity": 0.6,
      "audioReactivity": 1.0
    }
  },

  "sections": [
    {
      "id": "intro",
      "start": 0.0,
      "end": 16.0,
      "transition": { "duration": 0, "easing": "none" },
      "params": {
        "fog": { "near": 15, "far": 120 },
        "camera": { "distance": 25, "height": 8 },
        "particles": { "count": 200, "speed": 0.3, "opacity": 0.3 },
        "effects": {
          "aurora": { "enabled": true, "intensity": 0.3 }
        },
        "speed": { "baseMultiplier": 0.6 }
      }
    },
    {
      "id": "verse1",
      "start": 16.0,
      "end": 48.0,
      "transition": { "duration": 4.0, "easing": "easeInOut" },
      "params": {
        "fog": { "near": 25, "far": 180 },
        "camera": { "distance": 14, "height": 5 },
        "particles": { "count": 400, "speed": 0.6, "opacity": 0.4 },
        "speed": { "baseMultiplier": 0.8 }
      }
    },
    {
      "id": "chorus1",
      "start": 48.0,
      "end": 72.0,
      "transition": { "duration": 0.5, "easing": "easeOut" },
      "params": {
        "fog": { "near": 50, "far": 300 },
        "camera": { "distance": 10, "height": 4, "fov": 70 },
        "particles": { "count": 800, "speed": 1.5, "opacity": 0.7 },
        "effects": {
          "lightning": { "enabled": true },
          "grid": { "enabled": true, "intensity": 0.6 }
        },
        "speed": { "baseMultiplier": 1.2 },
        "terrain": { "amplitude": 6.0 }
      }
    }
  ],

  "cues": [
    {
      "time": 44.0,
      "action": "anticipate_chorus",
      "params": {
        "fog": { "near": "+10", "far": "+40" },
        "camera": { "distance": "-2" },
        "particles": { "speed": "+0.3" }
      },
      "duration": 4.0,
      "easing": "easeIn"
    },
    {
      "time": 48.0,
      "action": "vista_moment",
      "force": true
    },
    {
      "time": 48.0,
      "action": "screen_shake",
      "intensity": 0.8,
      "duration": 0.4
    },
    {
      "time": 96.0,
      "action": "environment_shift",
      "background": "nebula",
      "transition": 2.0
    }
  ]
}
```

### Score Format Design Decisions

**Sections are absolute, not relative.**
Each section declares the complete parameter state it wants.
The Conductor deep-merges section params over `defaults`.
Missing params inherit from defaults, not from the previous section.
This makes sections independently editable without cascading bugs.

**Transitions live on the RECEIVING section.**
The intro doesn't say how to leave — the verse says how to enter.
`"transition": { "duration": 4.0 }` means "take 4 seconds to
arrive at this section's params from whatever was active before."

**Cues are fire-and-forget events.**
Unlike sections (which set sustained state), cues are one-shot
triggers: vista moments, shakes, particle bursts.
Anticipation cues use **relative values** ("+10", "-2") so they
nudge whatever the current baseline is, rather than overriding it.

**Everything is optional and sparse.**
The Composer only specifies what should CHANGE. A section that
only changes fog doesn't need to re-specify camera, particles,
terrain, etc. Deep merge handles the rest.

---

## 3. The Conductor: scene-director.js

### 3.1 State Machine

```
States:
  IDLE          No score loaded, pass through to existing system
  PLAYING       Actively conducting — tracking playback position
  TRANSITIONING Sub-state of PLAYING — interpolating between sections

Transitions:
  loadScore(config)  →  IDLE → PLAYING
  seek(time)         →  jump to correct section, snap (no interpolation)
  pause()            →  freeze state (hold current params)
  resume()           →  continue from frozen state
  unload()           →  PLAYING → IDLE (revert to theme defaults)
```

### 3.2 Core Loop (called every frame from drawVizThree)

```
update(currentTime, dt):
  1. If IDLE → return null (no overrides, existing system runs unmodified)

  2. Find active section:
     section = sections.findLast(s => currentTime >= s.start)

  3. If section changed since last frame:
     - Store previous section's resolved params as transitionFrom
     - Compute target params: deepMerge(defaults, section.params)
     - Start transition timer (section.transition.duration)

  4. If transitioning:
     - progress = elapsed / transition.duration
     - easedProgress = applyEasing(progress, transition.easing)
     - currentParams = interpolateParams(transitionFrom, transitionTo, easedProgress)
     - If progress >= 1.0: transition complete, snap to target

  5. Process cues:
     - Find all cues where cue.time is between (lastTime, currentTime]
     - For each cue, fire the appropriate action
     - Track active cues with duration (for anticipation ramps)

  6. Process active anticipation cues:
     - For each active anticipation cue, compute its progress
     - Apply relative offsets to currentParams

  7. Return currentParams as the Conductor's baseline output
```

### 3.3 Parameter Interpolation

Not all parameters interpolate the same way:

```
NUMERIC (lerp):
  fog.near, fog.far, camera.distance, camera.height,
  camera.fov, particles.count, particles.speed,
  particles.opacity, terrain.amplitude, speed.baseMultiplier,
  lighting.ambientIntensity, lighting.directionalIntensity,
  effects.*.intensity, backgroundShader.speed,
  backgroundShader.intensity, backgroundShader.audioReactivity,
  effects.speedLines.opacity

COLOR (lerp in RGB or HSL):
  fog.color

BOOLEAN (snap at progress > 0.5):
  effects.lightning.enabled, effects.aurora.enabled,
  effects.grid.enabled, effects.godRays.enabled

STRING (snap at progress > 0.5):
  particles.type

DISCRETE (never interpolated, always snap):
  model, background, environmentType
```

```javascript
function interpolateParams(from, to, t) {
  const result = {};
  for (const key of allKeys(from, to)) {
    const a = from[key], b = to[key];
    if (typeof b === 'number') {
      result[key] = a + (b - a) * t;                    // lerp
    } else if (typeof b === 'boolean') {
      result[key] = t > 0.5 ? b : a;                    // snap
    } else if (typeof b === 'string' && b.startsWith('#')) {
      result[key] = lerpColor(a, b, t);                  // color lerp
    } else if (typeof b === 'object' && b !== null) {
      result[key] = interpolateParams(a || {}, b, t);    // recurse
    } else {
      result[key] = t > 0.5 ? b : a;                    // snap
    }
  }
  return result;
}
```

### 3.4 Easing Functions

```javascript
const EASINGS = {
  'none':       t => t,                                   // hard cut
  'linear':     t => t,
  'easeIn':     t => t * t,                               // slow start
  'easeOut':    t => 1 - (1 - t) * (1 - t),               // slow end
  'easeInOut':  t => t < 0.5 ? 2*t*t : 1 - (-2*t+2)**2/2, // smooth both
  'snap':       t => t > 0 ? 1 : 0                         // instant
};
```

### 3.5 Cue Actions

```javascript
const CUE_ACTIONS = {
  'vista_moment': (cue, env) => {
    env.triggerVista(cue.intensity || 1.0, true);
  },

  'screen_shake': (cue, env) => {
    env.triggerScreenShake();
  },

  'anticipate_chorus': (cue, state) => {
    // Relative params applied additively over cue.duration
    // Handled in the active-cue processing step
    state.activeCues.push({
      ...cue,
      startTime: cue.time,
      endTime: cue.time + cue.duration,
      relativeParams: cue.params
    });
  },

  'lightning_storm': (cue, effectsManager) => {
    // Rapid-fire lightning for cue.duration seconds
    effectsManager.triggerLightningStorm(cue.duration);
  },

  'particle_burst': (cue, effectsManager) => {
    effectsManager.triggerParticleBurst(cue.count || 200, cue.color);
  },

  'environment_shift': (cue, env) => {
    // This is the big one — mid-song background shader swap
    // Crossfade over cue.transition seconds
    env.crossfadeBackground(cue.background, cue.transition);
  },

  'fog_color_shift': (cue, env) => {
    // Temporary fog color tint (e.g., warm for bridge, cold for breakdown)
    env.setTemporaryFogColor(cue.color, cue.duration);
  }
};
```

---

## 4. Integration Points

### 4.1 Where the Conductor Hooks In

The Conductor slots into the existing animation loop in `app.js`
at `drawVizThree()`, between audio analysis and consumer updates:

```javascript
// EXISTING: audio analysis produces bass, mid, treble, energy, beatPulse, bassHit
// ... (lines 2259-2338 unchanged) ...

// NEW: Conductor updates baseline params based on song position
let directorOverrides = null;
if (SceneDirector && SceneDirector.isActive()) {
  const currentTime = audio.currentTime;  // or stemPlayer.currentTime
  directorOverrides = SceneDirector.update(currentTime, dt);
}

// EXISTING: EnvironmentMode.update(), EffectsManager.setAudioData(), etc.
// These calls are modified to ACCEPT overrides (see 4.2)
```

### 4.2 How Overrides Flow to Consumers

**Option A: Parameter injection (preferred)**

The Conductor returns a flat overrides object. The animation loop
applies overrides to CONFIG and theme values BEFORE the existing
update calls. Existing code doesn't change — it just reads from
values that the Conductor has already adjusted.

```javascript
if (directorOverrides) {
  // Temporarily adjust CONFIG values for this frame
  if (directorOverrides.camera?.distance !== undefined)
    CONFIG.cameraDistance = directorOverrides.camera.distance;
  if (directorOverrides.camera?.height !== undefined)
    CONFIG.cameraHeight = directorOverrides.camera.height;
  if (directorOverrides.speed?.baseMultiplier !== undefined)
    CONFIG.speedMultiplier = directorOverrides.speed.baseMultiplier;

  // Fog: set base values that reactive code modifies
  if (directorOverrides.fog) {
    EnvironmentMode.setBaseFog(directorOverrides.fog);
  }

  // Effects: enable/disable and set intensity
  if (directorOverrides.effects) {
    EffectsManager.applyOverrides(directorOverrides.effects);
  }

  // Background shader: adjust speed, intensity, reactivity
  if (directorOverrides.backgroundShader) {
    EnvironmentMode.setBackgroundOverrides(directorOverrides.backgroundShader);
  }
}
```

**Option B: Shadow state (alternative)**

The Conductor maintains its own state object. Consumers check
`SceneDirector.get('fog.near')` and fall back to their defaults.
More invasive but more explicit about what's being overridden.

**Recommendation: Option A.** Less code change, Conductor is a
thin layer that adjusts existing values, existing code is unaware
of the Director's existence. If no score is loaded, nothing changes.

### 4.3 Fog: The AC/DC Pattern in Practice

Current code (`environments.js` line 2695-2700):
```javascript
if (this.scene.fog) {
  const fogMult = this.visual?.fogDensity ?? 1.0;
  const vocalFogEffect = vocalFog * 30;
  this.scene.fog.near = this.theme.fogNear - energy * 10 * fogMult - vocalFogEffect;
  this.scene.fog.far = this.theme.fogFar - energy * 50 * fogMult - vocalFogEffect * 2;
}
```

With Director (minimal change):
```javascript
if (this.scene.fog) {
  const fogMult = this.visual?.fogDensity ?? 1.0;
  const vocalFogEffect = vocalFog * 30;
  // DC offset: use director baseline if set, else theme default
  const baseFogNear = this._directorFog?.near ?? this.theme.fogNear;
  const baseFogFar  = this._directorFog?.far  ?? this.theme.fogFar;
  // AC signal: reactive layer is unchanged
  this.scene.fog.near = baseFogNear - energy * 10 * fogMult - vocalFogEffect;
  this.scene.fog.far  = baseFogFar  - energy * 50 * fogMult - vocalFogEffect * 2;
}
```

Two lines changed. The Director sets `_directorFog`. The reactive
math is identical. This pattern applies everywhere.

### 4.4 Camera: Same Pattern

Current (`environments.js` line 3006-3015):
```javascript
updateCamera() {
  this.updateCameraShake(0.016);
  const camX = this.lateralPos + this.cameraShake.x;
  const camY = this.altitude + CONFIG.cameraHeight + Math.sin(this.time * 2) * 0.2 + this.cameraShake.y;
  const camZ = this.distance - CONFIG.cameraDistance;
  this.camera.position.set(camX, camY, camZ);
  this.camera.lookAt(this.lateralPos, this.altitude + 1.8, this.distance + CONFIG.cameraLookAhead);
}
```

CONFIG.cameraDistance and CONFIG.cameraHeight are already read
from CONFIG every frame. The Director just sets these values
before the update call. Zero code change in updateCamera().

### 4.5 Handling Seek

When the user scrubs the seekbar, the Conductor must jump to the
correct section state instantly (no transition):

```javascript
SceneDirector.seek(newTime):
  1. Find section active at newTime
  2. Resolve params = deepMerge(defaults, section.params)
  3. Apply immediately (no interpolation)
  4. Cancel any active transitions
  5. Cancel any active cues
  6. Re-scan cues for any that should fire at this position
```

---

## 5. Anticipation System

The most important feature. Fires cues BEFORE section boundaries.

### 5.1 How It Works

The Composer writes an `anticipate_chorus` cue at T-4 seconds:
```json
{
  "time": 44.0,
  "action": "anticipate_chorus",
  "params": { "fog": { "near": "+10" }, "camera": { "distance": "-2" } },
  "duration": 4.0,
  "easing": "easeIn"
}
```

At T=44.0 (4 bars before the chorus at T=48.0):
- Fog.near starts nudging +10 from wherever it currently is
- Camera.distance starts pulling in 2 units
- These changes apply ON TOP of the current section's params
- They ramp up over 4 seconds using easeIn (slow start, fast end)
- At T=48.0, the section transition to chorus fires and takes over

### 5.2 Relative vs Absolute Cue Params

Relative (prefixed with +/-): applied additively to current baseline
```json
{ "fog": { "near": "+10" } }    // add 10 to whatever near currently is
```

Absolute (plain number): override the baseline directly
```json
{ "fog": { "near": 50 } }       // set near to 50 regardless of current
```

### 5.3 Resolution Order Per Frame

```
1. Start with resolved section params (defaults merged with section)
2. Apply active transition interpolation (if between sections)
3. Apply active anticipation cue offsets (relative, ramped)
4. This produces the final conductor_baseline
5. Reactive code adds its own deltas on top
```

---

## 6. Methods Added to Existing Systems

Minimal additions — no refactoring.

### environments.js — ThemedEnvironment

```javascript
// Called by Conductor each frame
setDirectorOverrides(overrides) {
  this._directorFog = overrides.fog || null;
  this._directorCamera = overrides.camera || null;
  this._directorParticles = overrides.particles || null;
  this._directorLighting = overrides.lighting || null;
  this._directorSpeed = overrides.speed || null;
}

// For mid-song background shader swaps
crossfadeBackground(newType, duration) {
  // Create new AnimatedBackground with newType
  // Alpha-crossfade by rendering both and blending opacity
  // Dispose old one when fade completes
}

// Clear all overrides (when Director unloads)
clearDirectorOverrides() {
  this._directorFog = null;
  this._directorCamera = null;
  // etc.
}
```

### effects-manager.js — EffectsManager

```javascript
// Called by Conductor to enable/disable effects and set intensities
applyOverrides(overrides) {
  // Temporarily adjust config for effects that the Director controls
  // e.g., enable lightning for chorus, disable for verse
  if (overrides.lightning?.enabled !== undefined) {
    config.lightning.enabled = overrides.lightning.enabled;
  }
  if (overrides.lightning?.intensity !== undefined) {
    config.lightning.intensity = overrides.lightning.intensity;
  }
  // ... same for aurora, grid, godRays, particles, speedLines
}

triggerLightningStorm(duration) {
  // Override normal lightning cooldown, fire rapid bolts for duration
}

triggerParticleBurst(count, color) {
  // One-shot particle explosion at ship position
}
```

### app.js — drawVizThree()

```javascript
// After audio analysis, before consumer updates (~line 2430):
if (window.SceneDirector?.isActive()) {
  const t = usingStemPlayer && stemPlayer ? stemPlayer.currentTime : audio.currentTime;
  const overrides = window.SceneDirector.update(t, dt);
  if (overrides && EnvironmentMode) {
    EnvironmentMode.setDirectorOverrides(overrides);
  }
  if (overrides?.effects && typeof EffectsManager !== 'undefined') {
    EffectsManager.applyOverrides(overrides.effects);
  }
}
```

---

## 7. Score Loading & Lifecycle

### 7.1 Load Sequence

```
Track changes → app.js loadTrack()
  → fetch('tracks/<track>/theme-config.json')
  → if exists:
      SceneDirector.loadScore(config)
      SceneDirector.seek(0)  // snap to initial state
  → if 404:
      SceneDirector.unload()
      // Fall back to themes.js (existing behavior, unchanged)

Play pressed → SceneDirector.play()
Pause pressed → SceneDirector.pause()
Seek → SceneDirector.seek(newTime)
Track ends → SceneDirector.unload()
```

### 7.2 Graceful Degradation

- No theme-config.json? Existing themes.js system runs exactly as before.
- Partial theme-config.json (only sections, no cues)? Works fine, cues are optional.
- Bad values in theme-config.json? Conductor clamps all values to safe ranges.
- Score references effects not enabled in effectsConfig? Conductor enables them.

### 7.3 Manual Override Flow

```
1. process-track.py generates theme-config.json via Claude API
2. Developer reviews, tweaks numbers by hand if desired
3. Re-running process-track.py with --no-director skips regeneration
4. theme-config.json is committed to git alongside stems
```

---

## 8. What the Composer Prompt Needs

The Claude API prompt must include:

### Given to the Composer
```
1. analysis.json contents (sections, energy, drops, mood, key, BPM)
2. Lyrics text with section labels
3. Stem inventory (which instruments exist)
4. Complete parameter schema with ranges and descriptions
5. List of available assets (models, backgrounds, effects, particle types)
6. 2-3 example theme-config.json files for reference
```

### Key Constraints to Specify
```
- fog.near: 5-80 (lower = thicker fog)
- fog.far: 80-600
- camera.distance: 8-40 (8 = very close, 40 = far away)
- camera.height: 2-15
- camera.fov: 45-85 (wider = more dramatic)
- particles.count: 100-1500
- particles.speed: 0.1-3.0
- terrain.amplitude: 1.0-15.0
- speed.baseMultiplier: 0.4-1.8
- effects.*.intensity: 0-1
- backgroundShader.audioReactivity: 0-1

- Transition into verse: 3-6 seconds, easeInOut
- Transition into chorus: 0.3-1.0 seconds, easeOut (SNAP feel)
- Transition into bridge: 2-4 seconds, easeInOut
- Transition into outro: 4-8 seconds, easeIn (slow fade)

- ALWAYS place an anticipation cue 2-4 bars before a chorus/drop
- ALWAYS place a vista_moment cue at the first downbeat of each chorus
- NEVER enable more than 3 effects simultaneously (performance)
- Intro should feel spacious: far camera, thick fog, slow speed
- Chorus should feel intense: close camera, thin fog, fast speed
- Bridge should feel different from both verse and chorus
```

---

## 9. Implementation Order

```
Phase 1: Conductor skeleton
  - scene-director.js with state machine, section tracking, param interpolation
  - app.js integration (3 lines added to drawVizThree)
  - environments.js setDirectorOverrides + _directorFog/_directorCamera usage
  - Hand-write one theme-config.json for "Data Tide" to test

Phase 2: Cue system
  - Cue action handlers (vista, shake, lightning storm, particle burst)
  - Anticipation cues with relative params
  - Test with manual cues placed at known timestamps

Phase 3: Effects integration
  - effects-manager.js applyOverrides
  - Background shader crossfade (environment_shift cue)
  - Speed multiplier override

Phase 4: Composer prompt & pipeline
  - Write the Claude API prompt with full schema + examples
  - Add director step to process-track.py
  - Generate theme-config.json for all tracks with stems
  - Review and manually tweak results

Phase 5: Polish
  - Seek handling (snap to correct state)
  - Edge cases (track switch during transition, rapid seeks)
  - Debug panel showing active section, transition progress, active cues
  - Performance profiling (ensure Conductor overhead is < 0.1ms/frame)
```

---

## 10. File Structure

```
nginx/site/
  scene-director.js          # ~400 lines, the Conductor
  docs/
    scene-director-spec.md   # This document

nginx/site/tracks/<track>/
  theme-config.json          # The score (AI-generated, human-editable)
```

scene-director.js exposes a global `window.SceneDirector` with:
```
.loadScore(config)           Load a theme-config.json object
.unload()                    Clear score, revert to defaults
.isActive()                  Returns true if a score is loaded
.update(currentTime, dt)     Returns overrides object or null
.seek(time)                  Jump to position (snap, no transition)
.pause()                     Freeze conductor state
.resume()                    Resume from frozen state
.getState()                  Debug: current section, transition %, active cues
```
