# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Code from Dream** (jrod.dev) — A stem-reactive 3D music visualizer for DeytaDreams, an artist creating reggae-infused electronic music. The site splits tracks into individual stems (drums, bass, vocals, synth, etc.) and feeds each stem's audio analysis into a Three.js 3D world where instruments reshape terrain, atmosphere, and particles in real time.

## Running Locally

```bash
# From repo root (WSL or Windows):
python3 ./serve.py          # Serves nginx/site/ at http://localhost:8000
```

`serve.py` handles HTTP Range requests (needed for audio seeking) and suppresses browser disconnect errors. Do NOT use `python -m http.server` — it lacks Range support.

## Generating Track Lists

```bash
# From nginx/site/:
python3 ../generate-tracks.py --music-dir ./music --out-file ./tracks.js
```

## Processing Lyrics (Whisper)

```bash
python3 process-lyrics.py <track-folder> [model] [--force]
# Example: python3 process-lyrics.py nginx/site/tracks/data-tide medium
```

Models: tiny, base, small, medium (recommended), large. Aligns word-level timestamps to existing lyrics.json if present.

## Deployment

Dockerized nginx on Railway. The Dockerfile is at `nginx/Dockerfile`, config at `nginx/nginx.conf`. The site is 100% static — no server-side rendering or API.

## Architecture

All frontend code lives under `nginx/site/`. There is no build step or bundler — plain JS files loaded via `<script>` tags in `index.html`.

### Core Runtime Files

| File | Role |
|------|------|
| `app.js` (~215K) | Main orchestrator. Audio playback, UI controls, Three.js render loop (`drawVizThree()`), waveform visualizer, playlist management, URL hash routing for deep links. Audio-reactive speed modulation is disabled when flight scene is active |
| `stem-player.js` | Multi-stem synchronized playback via AudioBufferSourceNode. Per-stem FFT analysis, volume/mute control, MIDI event scheduling, IndexedDB caching |
| `environments.js` | Per-track 3D worlds. Reads themes from `themes.js`, builds terrain, fog, scenery objects. Each track maps to an environment type (ocean, volcanic, cyber, etc.) |
| `track-scenes.js` (~213K) | Per-track scene builders registered on `window.TrackScenes`. All tracks use `buildFlightScene()` (legacy bespoke builders like `buildDataTide()` are dead code) |
| `effects-manager.js` | Visual effects: lightning, aurora, god rays, particles, screen shake. Driven by audio data and per-stem visualization routing from manifest |
| `backgrounds.js` | Shader-based animated backgrounds (topo, ocean, nebula, matrix, aurora, forge, sakura, circuit, glacier, savanna). Each track theme selects one |
| `themes.js` | `TRACK_THEMES` config — per-track color palettes, 3D model, viz mode, wall/floor styles, particle types, fog, background shader selection |
| `racer.js` | Audio-reactive racing game mode (HexGL-inspired physics with procedural track generation) |
| `terrain.js` | Procedural terrain generation for the flight visualization |
| `noise.js` | Perlin/simplex noise utilities |
| `models.js` | 3D model definitions for the flying ship |
| `tracks.js` | Track catalog — each entry points to a `stemsManifest` (manifest.json) |

### Per-Track Data (in `tracks/<track-slug>/`)

Each track folder contains:
- `manifest.json` — stem list with audio paths, MIDI paths, and visualization routing (target: terrain/atmosphere/particles/background, effect: impact/deformation/fog/pulse/burst)
- `*.mp3` — individual stem audio files
- `*.mid` — MIDI data per stem (used for note-accurate visual events)
- `lyrics.json` — word-level timestamps for karaoke display

### Key Design Pattern: Stem → Visual Routing

Each stem in `manifest.json` declares a visualization target and effect:
```json
{ "target": "terrain", "effect": "impact", "color": "#ff4444" }
```
`effects-manager.js` and `environments.js` read this routing to map per-stem FFT energy to specific visual systems.

### Planned: Scene Director (AC/DC Architecture)

Documented in `site/docs/scene-director-spec.md`. A three-layer system:
1. **Composer** (Claude API, build-time) — writes a score (`theme-config.json`)
2. **Conductor** (`scene-director.js`, runtime) — reads score, manages section transitions, interpolates baselines
3. **Musicians** (existing reactive code, unchanged) — oscillate around the Conductor's baselines

`final_value = conductor_baseline + reactive_delta` — reactive code stays identical, only the center point shifts per section.

## Workflow Preferences

When sessions involve multi-step creative/technical work, checkpoint progress to `PROGRESS.md` in the project root with: what's completed, what's in progress, what's pending, and next steps to resume.

When creating HTML visualizations or demos, always include instructions for running a local server since `file:///` protocol has limitations.
