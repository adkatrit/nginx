# MySongs — Roadmap & Architecture Plan

> Last updated: 2025-02-07
> Goal: Maximally immersive studio stem experience + automated AI pipeline from stems → interactive visual experience

---

## EXISTING ITEMS (carried over)

- [ ] Replace random geometric shapes on sides of flight area with something more compelling
- [ ] Make playhead/seek area show stem activity (color-coded proportional display per time segment)
- [ ] Integrate MIDI into scene generation / interactivity
- [ ] Improve memory usage

---

## PRIORITY 1 — MIDI-Driven Visual Events (highest impact, lowest effort)

### What we have
- `stem-player.js` already parses MIDI files per-stem
- MIDI data contains: note number, velocity (0-127), duration, channel, exact timing
- Currently only used for basic timing — not wired to individual visual events

### What to build
Wire specific MIDI note numbers to specific visual events in `environments.js` and `effects-manager.js`:

| MIDI Note | Instrument     | Visual Event                                    |
|-----------|----------------|-------------------------------------------------|
| 36        | Kick drum      | Terrain impact pulse (large, slow decay)        |
| 38        | Snare          | Lightning flash + screen shake                  |
| 42        | Closed hi-hat  | Particle spray (small, fast)                    |
| 46        | Open hi-hat    | Particle spray (large, sustained)               |
| 49        | Crash cymbal   | Full-screen glow pulse + god ray burst          |
| 51        | Ride cymbal    | Shimmer particles (treble-colored)              |
| Bass notes | Bass stem     | Terrain deformation scaled by *pitch* (low C bends more than high G) |
| Synth notes | Synth stem   | Background color shifts to match *actual chord* |
| Vocal melody | Vocals stem | 3D ribbon/trail following pitch contour in space |

### Why this matters
Going from "bass FFT energy is high" → "kick drum on beat 1, velocity 127" is the difference between a visualizer and a *performance*. Frame-perfect sync, no FFT latency, no smoothing artifacts.

### Implementation notes
- Add a `MidiEventRouter` class that maps note events → visual callbacks
- Register callbacks from `EnvironmentMode`, `EffectsManager`, `TrackScenes`
- Use velocity (0-127) to scale intensity of each visual event
- Use note duration for sustained effects (held synth chords = sustained color shift)

---

## PRIORITY 2 — process-track.py Pipeline Script

### Current pain
Each new track requires manual: WAV→MP3 conversion, manifest.json authoring, Whisper lyrics processing, theme config in themes.js. This should be one command.

### What to build
```
python process-track.py ./tracks/new-track/ [--separate-stems]
```

### Pipeline steps

```
INPUT: Directory containing WAV/MP3 stems (+ optional MIDI, lyrics.txt)
  │
  ├─ 1. DETECT what's in the directory
  │     - Scan for audio files, identify stems by filename patterns
  │     - Check for MIDI files, lyrics.txt
  │     - If only a single mix file + --separate-stems flag → run Demucs
  │
  ├─ 2. CONVERT audio
  │     - WAV/FLAC → MP3 (ffmpeg, 192kbps VBR)
  │     - Keep WAV originals in stems-raw/ subfolder
  │     - Generate waveform overview image (PNG, color-coded per stem)
  │
  ├─ 3. ANALYZE audio (librosa + madmom)
  │     ├─ BPM detection (confirm/override manifest value)
  │     ├─ Key signature detection
  │     ├─ Section boundary detection (verse/chorus/bridge/drop)
  │     ├─ Per-bar energy envelope (pre-computed)
  │     ├─ Onset detection with sub-type classification
  │     ├─ Dynamic range map (quiet→loud sections, drop locations)
  │     ├─ Chord progression timeline (from MIDI if available, else estimated)
  │     ├─ Mood/valence classification
  │     └─ → analysis.json
  │
  ├─ 4. PROCESS lyrics
  │     ├─ Whisper word-level timestamps (if lyrics.txt provided)
  │     ├─ LLM emotion classification per line (Claude API)
  │     ├─ Identify key emotional words for visual triggers
  │     └─ → lyrics.json
  │
  ├─ 5. PROCESS MIDI (if .mid files present)
  │     ├─ Extract note events per instrument/channel
  │     ├─ Classify drum hits by type (kick/snare/hat/cymbal/etc)
  │     ├─ Extract chord progressions
  │     ├─ Compute note density per bar
  │     └─ → midi-events.json
  │
  ├─ 6. GENERATE manifest.json
  │     ├─ Auto-detect stem names from filenames
  │     ├─ Set visualization routing based on stem type:
  │     │   drums → terrain:impact, bass → terrain:deformation, etc
  │     ├─ Include paths to all generated analysis files
  │     └─ → manifest.json
  │
  ├─ 7. AI SCENE DIRECTOR (Claude API) — see Priority 4
  │     ├─ Input: analysis.json + lyrics.json + midi-events.json
  │     ├─ Generate: scene choreography, camera plan, effect timeline
  │     ├─ Select: best 3D model, background type, color theme
  │     └─ → theme-config.json (replaces manual themes.js entry)
  │
  └─ OUTPUT: Complete track package ready for web playback
       tracks/new-track/
       ├── manifest.json
       ├── analysis.json
       ├── lyrics.json
       ├── midi-events.json
       ├── waveform.png
       ├── stem-drums.mp3
       ├── stem-bass.mp3
       ├── stem-vocals.mp3
       ├── ... (other stems)
       └── stems-raw/ (original WAVs, gitignored)
```

### Dependencies to add
```
pip install librosa madmom demucs ffmpeg-python anthropic openai-whisper
```

---

## PRIORITY 3 — Pre-Analysis: analysis.json Format

### Schema

```json
{
  "version": 1,
  "bpm": 120,
  "key": "Am",
  "mode": "minor",
  "duration_seconds": 234.5,
  "time_signature": "4/4",

  "sections": [
    { "label": "intro",   "start": 0.0,   "end": 8.0,   "energy": 0.2 },
    { "label": "verse1",  "start": 8.0,   "end": 32.0,  "energy": 0.4 },
    { "label": "chorus1", "start": 32.0,  "end": 48.0,  "energy": 0.8 },
    { "label": "verse2",  "start": 48.0,  "end": 72.0,  "energy": 0.45 },
    { "label": "chorus2", "start": 72.0,  "end": 88.0,  "energy": 0.85 },
    { "label": "bridge",  "start": 88.0,  "end": 104.0, "energy": 0.3 },
    { "label": "chorus3", "start": 104.0, "end": 120.0, "energy": 0.95 },
    { "label": "outro",   "start": 120.0, "end": 134.5, "energy": 0.15 }
  ],

  "energy_curve": {
    "resolution_bars": 1,
    "values": [0.1, 0.15, 0.2, 0.35, ...]
  },

  "chords": [
    { "time": 0.0, "chord": "Am" },
    { "time": 2.0, "chord": "F" },
    { "time": 4.0, "chord": "C" },
    { "time": 6.0, "chord": "G" }
  ],

  "drops": [
    { "time": 32.0, "intensity": 0.9, "type": "chorus_entry" },
    { "time": 104.0, "intensity": 1.0, "type": "final_chorus" }
  ],

  "mood": {
    "valence": 0.6,
    "arousal": 0.7,
    "tags": ["driving", "emotional", "building"]
  },

  "dynamic_range": {
    "min_db": -45,
    "max_db": -3,
    "loudness_lufs": -12.5
  }
}
```

### Runtime usage
- `environments.js` reads `sections` to know what's coming and pre-build tension
- Camera system uses `drops` to trigger vista moments at exactly the right time
- `energy_curve` drives fog density, particle count, ship speed with lookahead
- `chords` drive background color palette shifts
- `mood` selects base visual parameters (calm vs intense)

---

## PRIORITY 4 — AI Scene Director

> **Full specification: [`site/docs/scene-director-spec.md`](site/docs/scene-director-spec.md)**

### Three-Layer Architecture
1. **Composer** (Claude API, runs once at build time) — writes the score (`theme-config.json`)
2. **Conductor** (`scene-director.js`, runs every frame) — reads score, manages section transitions, fires cues
3. **Musicians** (existing reactive code, unchanged) — oscillate around the Conductor's baselines

### Core Insight: AC/DC Separation
The Conductor controls **DC offset** (baseline fog, camera distance, particle count per section).
The existing reactive code provides the **AC signal** (beat pulses, FFT-driven oscillation).
`final_value = conductor_baseline + reactive_delta`. Reactive code stays identical — only the center point shifts.

### Key Design Decisions (detailed in spec)
- **Sections are absolute** — each section declares complete state, deep-merged over defaults
- **Transitions live on the receiving section** — verse doesn't say how to leave, chorus says how to enter
- **Anticipation cues fire BEFORE section boundaries** — fog starts lifting 4 bars before the chorus, not at the chorus
- **Relative cue params** (`"+10"`, `"-2"`) nudge the current baseline instead of overriding it
- **Parameter interpolation** — numbers lerp, colors lerp, booleans snap at 50%, strings snap
- **Graceful degradation** — no theme-config.json means existing themes.js runs unchanged
- **Minimal code changes** — ~6 lines in app.js, ~10 lines in environments.js, ~10 lines in effects-manager.js

### Integration
- 3 new lines in `drawVizThree()` call `SceneDirector.update(currentTime, dt)` → returns overrides
- `environments.js` reads `_directorFog` / `_directorCamera` as DC offset, reactive math unchanged
- `effects-manager.js` gets `applyOverrides()` for enable/disable/intensity
- Seek snaps to correct section state (no interpolation)
- Track change fetches `tracks/<track>/theme-config.json`, falls back to themes.js if 404

### Implementation Phases
1. Conductor skeleton + section tracking + param interpolation + hand-written Data Tide score
2. Cue system (vista, shake, lightning storm, anticipation)
3. Effects integration + background crossfade
4. Composer prompt engineering + pipeline integration
5. Polish (seek, debug panel, performance)

---

## PRIORITY 5 — Waveform Overview in Seekbar

### What to show
- Color-coded waveform showing per-stem energy as stacked bands:
  - Bottom layer: bass (red)
  - Middle: mid instruments (green)
  - Top: treble (blue)
  - Overall envelope: energy (orange outline)
- Section markers as labeled dividers (VERSE 1, CHORUS, BRIDGE, etc)
- Drop markers as highlighted regions
- Beat grid as subtle tick marks

### Implementation
- Pre-generate during `process-track.py` as a high-res PNG (4000×100px)
- Or generate on first load from analysis.json + stem audio and cache as canvas ImageData
- Display as background of the seek slider with CSS
- Current playhead shows 2-3 seconds of "lookahead" highlight

---

## PRIORITY 6 — Stem Separation for Mix-Only Tracks

### Tracks that need it
Currently mix-only (no separated stems):
- beast-mode
- soft-systems
- dreams-bleed-into-dashboards
- the-last-dragon
- gi-mi-di-reins

### Integration
```python
# In process-track.py
if only_has_mix and args.separate_stems:
    run_demucs(mix_path, output_dir, model="htdemucs_6s")
    # Produces: drums.wav, bass.wav, vocals.wav, guitar.wav, piano.wav, other.wav
```

### Demucs model options
- `htdemucs` — 4 stems (drums, bass, vocals, other) — fastest
- `htdemucs_6s` — 6 stems (adds guitar, piano) — better for this use case
- `htdemucs_ft` — fine-tuned, highest quality, slowest

---

## PRIORITY 7 — Lyrics as Spatial Visual Layer

### Current state
- Word-level timestamps from Whisper exist in lyrics.json
- Displayed as flat karaoke text overlay

### Upgrades

1. **3D spatial lyrics**: Words appear in 3D space as ship flies toward/through them
   - Position words along the flight path ahead of the ship
   - Scale/opacity by distance (fog-fade)
   - Words rotate slightly toward camera

2. **Emotion-driven word styling** (requires LLM pre-classification):
   - "love", "heart" → warm colors, gentle particle burst
   - "fire", "burn" → ember particles, red glow
   - "break", "shatter" → word literally fractures into pieces
   - "rise", "fly" → word floats upward with velocity

3. **Delivery-energy scaling**:
   - Use Whisper confidence + vocal stem energy at word timestamp
   - Shouted words = larger, bolder, shake
   - Whispered words = small, translucent, float

### Data format addition to lyrics.json
```json
{
  "words": [
    {
      "word": "fire",
      "start": 12.45,
      "end": 12.82,
      "emotion": "intense",
      "visual_trigger": "ember_burst",
      "delivery_energy": 0.9
    }
  ]
}
```

---

## PRIORITY 8 — Future Interactivity Modes

### A. Conductor Mode
- User controls a "mix fader" for each stem group in real-time
- Visuals respond proportionally — pull up drums and terrain goes crazy, mute vocals and fog lifts
- Different from current mute/solo — this is a continuous blend control that's tied to the visual system
- Could use gamepad triggers: left trigger = more bass visual weight, right trigger = more treble

### B. VR / Spatial Audio (WebXR)
- Spatialized stems: drums behind, bass below, vocals center-front, synth overhead
- Head tracking changes the mix (turn toward drums = drums get louder)
- 360° visual environment wraps around the listener
- Hand controllers for conductor mode

### C. Collaborative Listening
- WebRTC sync: multiple people in the same song, same playback position
- Each person controls their own camera/angle
- See each other's ships/avatars in the environment
- Social presence during music — shared experience

### D. Remix/Loop Mode
- Drag sections on a timeline to rearrange (loop a chorus, skip a verse)
- Visuals seamlessly adapt to the new arrangement
- Save and share custom arrangements as URLs

---

## ARCHITECTURE NOTES

### File locations for new systems
```
nginx/site/
  ├── midi-router.js          # NEW — MIDI note → visual event mapping
  ├── scene-director.js       # NEW — Reads theme-config.json, manages section transitions
  ├── waveform-renderer.js    # NEW — Renders seekbar waveform from analysis data
  │
  tracks/<track>/
  ├── manifest.json            # Existing — add analysis file references
  ├── analysis.json            # NEW — pre-computed audio analysis
  ├── midi-events.json         # NEW — extracted MIDI note events
  ├── theme-config.json        # NEW — AI-generated scene choreography
  ├── waveform.png             # NEW — pre-rendered waveform overview
  └── lyrics.json              # Existing — add emotion/trigger fields

process-track.py               # NEW — one-command pipeline script
requirements.txt                # NEW — Python dependencies
```

### Key dependencies
```
# Python pipeline
librosa>=0.10       # Audio analysis (BPM, key, onset, sections)
madmom>=0.17        # Beat/downbeat tracking, chord recognition
demucs>=4.0         # Stem separation (for mix-only tracks)
openai-whisper      # Lyric timing
anthropic           # Claude API for scene director + lyric emotion
ffmpeg-python       # Audio format conversion
Pillow              # Waveform image generation
mido                # MIDI file parsing
```

### Data flow (complete pipeline)
```
RAW STEMS (WAV/MIDI/lyrics.txt)
    │
    ▼
process-track.py
    │
    ├─ ffmpeg ──────────────────→ MP3 stems
    ├─ librosa/madmom ──────────→ analysis.json
    ├─ whisper + claude API ────→ lyrics.json (with emotion)
    ├─ mido ────────────────────→ midi-events.json
    ├─ claude API (director) ───→ theme-config.json
    ├─ pillow ──────────────────→ waveform.png
    └─ auto-generate ──────────→ manifest.json
          │
          ▼
    BROWSER RUNTIME
          │
    ├─ stem-player.js ← MP3 stems + MIDI
    ├─ midi-router.js ← midi-events.json → visual callbacks
    ├─ scene-director.js ← theme-config.json + analysis.json → section transitions
    ├─ environments.js ← all of the above → ship, terrain, fog, particles
    ├─ effects-manager.js ← audio data + MIDI events → lightning, aurora, etc
    ├─ backgrounds.js ← uniforms from above → GPU shaders
    └─ waveform-renderer.js ← waveform.png + analysis.json → seekbar overlay
          │
          ▼
    THREE.JS → SCREEN
```
