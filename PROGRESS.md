# Code from Dream — Progress Log

---

## Creative Direction: "The Living Album" + Spatial Lyrics — IN PROGRESS

### The vision (researched: Mizuguchi/Rez/Tetris Effect synesthesia, Thumper arc)
Not "AudioSurf with your MP3s" (commodity: bring-any-song novelty). This is a
specific artist's album with written lyrics, [Section] structure, and a stated
theme — "what stays human when everything becomes signal." That's the moat.
Three pillars, all from assets that already exist:

1. **Spatial Lyrics ("The Word Field")** — DONE (phase 1). The signature.
2. **The Album as One Journey** — section markers ([Verse]/[Chorus]/[Bridge])
   exist in every lyrics.json → song structure for free, no audio analysis.
   Choruses bloom, verses breathe; sun already rises across the 9-track run.
3. **Humanity vs. Signal scoring** — FLOW (grace/feel) keeps the world warm
   and saturated; robotic point-chasing cools it toward cold digital. The
   synesthesia principle wedded to the album's actual meaning. (Planned.)

Key data finding: lyrics are LINE-level (not word-level as TODO claimed), but
present on every track with [Section] markers — better for structure.

### New: `site/lyric-field.js` (Spatial Lyrics)
- Each sung line's words materialize ahead of the flight path as glowing 3D
  sprites, spread across the line's time window in reading order, placed on the
  bird's current heading a short lead before arrival (turn-safe, like gates),
  then flown through and dissolved into the slipstream.
- Words arrive flickering like raw signal and RESOLVE into clear text as they
  near the camera — "cyaan tell di code from di dream" made literal.
- Flying through a word feeds a FLOW sip → ties the signature feature to the
  scoring/world-warmth loop (synesthesia reward, not obligation).
- Canvas-texture sprites (cached/reused per word), bounded pool, seek-safe,
  guarded so any GPU failure leaves the scene intact. L key toggles it.
- Long lines drop filler words (a/the/of) before truncating so kept words read.
- Verified by Node sim against real Data Tide lyrics: 48 words spawned, peak 12
  in flight, flythrough flow-sips fire, pool bounded, seek-back clears.

### Integration
- `app.js`: feedLyricField() tracks its own line index (independent of the 2D
  karaoke overlay, seek-safe), drives the field in the render loop next to
  rhythm gates, disposes/recreates on track change via scene identity.
- `rhythm-gates.js`: added addFlow() so the lyric flythrough can sip FLOW.

### Next
- Pillar 2 (section-aware intensity from the [Section] markers — the Director,
  now trivial with structure already annotated)
- Pillar 3 (humanity-vs-signal world grade tied to FLOW)
- Chorus lines as bigger spatial moments; emotional word styling

---

## Rhythm Flight Game, Phase 1: MIDI-Locked Gates — COMPLETE

### Direction decision
The product is a **rhythm flight game** scored by the album (chosen over the
cinematic-only path). Phase 1 lands the core loop; the dormant score HUD
(SCORE/COMBO/FLOW/GATES, previously fed by EnvironmentMode's "Chill Ride"
which stopped running when the flight scene took over) is live again.

### New: `site/rhythm-gates.js`
- Gates spawn ~3s ahead on the bird's heading, placed so the bird arrives
  **exactly when the underlying drum note lands** (MIDI lookahead via
  `getUpcomingMidiEvents`); kick/snare/tom notes gate, weighted by velocity
- Mix-only tracks fall back to a BPM grid from manifest.bpm — every track
  is playable
- Hit = crossing the ring's plane inside its radius; miss = clipping the
  edge or flying around it (timeout). Three tiers (large 25 / medium 50 /
  small gold 100) matching the HUD's `points = tier × combo` convention;
  combo = 1 + streak/4, capped at 8
- PERFECT timing window (±100ms) doubles FLOW gain; flow drifts toward a
  baseline so the bar reflects recent play, misses drain it
- **Flow is earned spectacle**: scene speed lift (+18%), terrain glow, and
  bloom all scale with it; perfect hits fire a gold shockwave ring
- Approach telegraphing: rings brighten as their note nears with a beat
  flash in the last 400ms; hits flash white and expand, misses sag dim red
- Pooled meshes (14), zero per-frame allocation, seek-safe (gates re-plan
  for the new position, score survives), pool/dispose lifecycle per track
- **G key toggles CRUISE MODE** (gates off, just fly) — persisted in
  localStorage
- Verified by Node simulation with real three.js math: centerline run
  21/21 hits all PERFECT, veering run produces misses + streak reset, BPM
  fallback spawns hittable gates, seek-back re-plans correctly

### Integration
- `track-scenes.js` flight scene API: `getBirdState()`, `getGroundHeight()`,
  `onGateHit(strength, perfect)`, `setFlow(f)`
- `app.js`: per-frame update wired to the existing HUD functions
  (`updateScoreHUD`, `showGateHitFeedback`, `updateFlowHUD`), flow feeds
  post-processing bloom, gates reset on seek, dispose/recreate on track
  change via scene identity check

### Next (rhythm game roadmap, agreed)
1. Scene Director Phase 1 — section-aware choreography (verse/chorus/drop)
2. The Approach — diegetic intro: perched start, 3D title, control unlock
   on the first downbeat; end-of-track stats card + "next world"
3. Vocal-melody ribbon to ride during verses (TODO Priority 7)
4. Wind/whoosh sound layer (synthesized), gamepad + haptics
5. Settings: motion intensity slider, photosensitivity mode, quality tiers

---

## MIDI-Driven Visual Events + Living Flight Scene — COMPLETE

### Summary
Implemented TODO Priority 1 (MIDI-driven visual events) and made the flight
scene — used by every track — actually listen to the music. Previously the
flight scene used zero audio data: no stem FFT, no MIDI, static
post-processing. Now kick drums punch light and ground shockwaves, snares
flash the sky and shake the camera, crashes launch shooting-star volleys,
bass pitch swells the ocean and fog, vocals lift the atmosphere, and synth
chords tint the sky toward the actual harmony — all frame-perfect.

### New: `site/midi-router.js`
- `MidiRouter` — sits between StemPlayer's 100ms look-ahead `midiNote`
  events and the visuals. Queues early events, dispatches each on the exact
  frame its timestamp lands (no FFT latency, no early hits)
- Enriches events: GM drum classification (kick/snare/hihat/crash/ride/tom/
  perc), stem classification (bass/vocal/synth/guitar), perceptual
  `velocity01`, `pitch01`
- Aggregates simultaneous synth notes (50ms window) into `chord` events with
  root pitch class → hue, so scenes can tint to the actual harmony
- Seek-back flush + stale-event guard (tab hidden, etc.)
- Verified with Node simulation tests (once-only dispatch, ordering, chord
  grouping, seek/stale behavior)

### Fixed: `site/stem-player.js` duplicate MIDI fire
`checkMidiEvents()` rescanned the whole schedule each frame against a
trailing window, so every note fired ~6 times at 60fps. Replaced with a
sorted-pointer walk (binary-search relocation on seek): each event now fires
exactly once. `seek()`/`stop()`/`dispose()` keep the pointer consistent.

### Flight scene reactivity (`site/track-scenes.js`)
Two layers, following the scene-director spec's AC/DC philosophy — all
music values are transient offsets applied AFTER the day-cycle math, so the
base look is never corrupted:
- **MIDI pulses** (`onMidi`): kick → sun-light punch + terrain emissive +
  expanding ground shockwave rings (pooled ×6); snare → hemisphere flash +
  sky exposure bump + camera shake; crash → shooting-star volley (pool 3→6)
  + long shimmer; tom → cool-colored ring; bass → pitch-weighted water
  distortion + fog swell (low notes bend the world more); vocals →
  atmosphere lift + moon glow; chords → sky/fog tint toward chord hue
- **FFT baselines** (continuous, from `stemData`): keeps mix-only tracks
  (beast-mode, the-last-dragon, …) alive via a low-end onset detector that
  synthesizes kick pulses, plus smoothed energy driving flight speed
- **Cinematic camera**: beat-locked FOV punch (kick +5%, fast attack/exp
  decay) and deterministic layered-sine shake with exponential envelope —
  no per-frame random jitter
- Night sky reacts: hi-hats twinkle the star dome, vocals breathe the moon
- Baselines stay in sync with Scene Tuner edits and theme hot-swaps;
  `dispose()` removes rings and restores camera FOV

### app.js integration
- MidiRouter created per stem load; dispatch loop in `drawVizThree` fires
  enriched events into `currentTrackScene.onMidi` at exact timestamps
- Flight scene post-processing unlocked from static values: bloom/vignette/
  chromatic aberration now driven by the scene's pulse state (kick punches
  bloom + a chromatic flick, bass breathes the vignette) — restrained ranges
- Fixed `globalBeatPulse` never decaying while the flight scene is active
- Router reset on seek and track change

### Files Modified
- `site/midi-router.js` — NEW
- `site/stem-player.js` — once-only MIDI pointer + seek relocation
- `site/track-scenes.js` — flight scene music reactivity + cinematic camera
- `site/app.js` — router wiring, musical post-processing, beat-pulse decay fix
- `site/index.html` — midi-router script tag, cache-version bumps (incl.
  preload hints)

### Next Steps (future work)
- Scene Director Phase 1 (Conductor skeleton + hand-written Data Tide score)
- 3D spatial lyrics along the flight path (TODO Priority 7)
- Per-section camera choreography once analysis.json exists

---

## Stem-Colored Seek Bar Waveform — COMPLETE

### Summary
Replaced the single-color frequency waveform in the footer seek bar with a **time-mapped, stem-composition visualization**. Each of the 60 bars now shows a stacked color breakdown representing which stems (drums, bass, vocals, synth, guitar) are active at that point in the track — using the same color coding as the stem mixer buttons.

### What it conveys (new information not otherwise visible)
- **Mix composition over time** — see at a glance where drums dominate vs. where vocals take over
- **Track structure** — intros, drops, bridges, and solos become visually distinct by their stem balance
- **Muted stem awareness** — muted stems render as ghost segments so you can see what you're missing

### How it works
- **History buffer** (`WaveformVisualizer.history[60]`) — as the track plays, `recordStemSnapshot()` samples per-stem energy from `stemAnalysisData` and stores it in the time slot corresponding to the current playback position
- **Per-bar rendering** — each bar reads from its own history slot, so bar 0 shows the stem mix from the start, bar 30 from the middle, etc.
- **Live slot** — the bar at the current playhead uses live stem data for responsiveness; all other played bars use recorded snapshots
- **Seek/replay** — history persists on seek-back; resets on track change via `resetHistory()`
- **Fallback** — tracks without stem data fall back to the original single-color frequency visualization

### Files Modified
- **`site/app.js`** — Rewrote `WaveformVisualizer` class: added `history[]` buffer, `recordStemSnapshot()`, `resetHistory()`, updated `draw()` to render per-time-slot stacked stem bars; updated `updateWaveform()` to record snapshots each frame; added `resetHistory()` call on track change
- **`site/styles.css`** — Changed `.waveform-playhead` from accent-colored to white with bright glow so it stands out against multi-colored bars

### Stem Color Map
| Stem    | Color  | Hex       |
|---------|--------|-----------|
| Drums   | Coral  | `#ff4466` |
| Bass    | Orange | `#ff8800` |
| Vocals  | Cyan   | `#00ddff` |
| Synth   | Purple | `#aa44ff` |
| Guitar  | Green  | `#44ff88` |

### Pending / Known Behavior
- Bars ahead of the playhead show a subtle idle animation until the track reaches them and records their data
- On first listen, the waveform progressively fills in; subsequent replays show full history immediately (until track change)

---

# Code from Dream — SEO & Visibility Makeover

## Status: COMPLETE

All planned changes have been implemented, documented, and verified.

---

## Phase 4: GA4 + CSP + Deep Links — COMPLETE

### GA4 Tracking (all pages)
Added `G-NRQ96GQ70K` gtag snippet to:
- `site/architecture.html`
- `site/docs/audio-reactivity.html`
- `site/sandbox.html`

### Content Security Policy
Added CSP header to `nginx.conf` with:
- `script-src`: self, unsafe-inline, ga.jspm.io (Three.js), googletagmanager.com
- `style-src`: self, unsafe-inline, fonts.googleapis.com
- `font-src`: self, fonts.gstatic.com
- `connect-src`: self, google-analytics.com, googletagmanager.com, analytics.google.com, ga.jspm.io
- `img-src`: self, data:
- `media-src`: self, blob:
- `frame-src`: none, `object-src`: none

### Per-Track Deep Links
Already implemented in `app.js` — hash routing with `updateUrlHash()`, `getTrackSlugFromUrl()`, `findTrackBySlug()`, and `hashchange` event listener. Sharing `jrod.dev/#data-tide` loads that track directly with autoplay.

### Dashboard Updated
- Removed GA4/CSP/deep-link action items (completed)
- Added CSP, GA4, Deep Links to SEO checklist items
- Gauge now calculates score dynamically (92/100, 16 of 18 passing)
- Sublabel updates dynamically when items toggled

---

## Phase 3: Rebrand to "Code from Dream" — COMPLETE

Site title changed from "Audio Environments" to **Code from Dream** — derived from the lyric in *Terms & Conditions*: "cyaan tell di code from di dream". New literary-analysis-style descriptions written after reading all 9 tracks' lyrics.

### Files Updated
- **`site/index.html`** — Title, meta description, OG title/description, Twitter Card, JSON-LD, noscript content
- **`site/site.webmanifest`** — name, short_name, description
- **`site/seo-dashboard.html`** — All "Audio Environments" references, social preview mockup text
- **`site/og-image.png`** — Regenerated with "Code from Dream" title
- **`SEO.md`** — Full documentation rewrite

### New Copy
- **Title**: Code from Dream | DeytaDreams — Stem-Reactive 3D Worlds
- **Meta description**: Original music split into living pieces. Drums carve terrain, bass floods oceans, vocals paint atmosphere. Nine tracks asking what stays human when everything becomes signal.
- **OG description**: Reggae-infused electronic music pulled apart into stems and fed to a 3D world that listens back. Each instrument reshapes the landscape. What stays human when everything becomes signal?

---

## Phase 1: SEO Infrastructure — COMPLETE

### New Files Created
- **`site/robots.txt`** — Blocks crawlers from binary audio/model/archive files, points to sitemap
- **`site/sitemap.xml`** — 4 URLs (index, architecture, audio-reactivity docs, sandbox)
- **`site/site.webmanifest`** — PWA manifest for "Add to Home Screen" support
- **`site/og-image.png`** — 1200×630 social sharing image with brand design

### Files Modified
- **`site/index.html`** — Added: SEO title, meta description, canonical URL, Open Graph tags, Twitter Card tags, JSON-LD structured data (WebApplication + MusicGroup schemas), author/keywords/robots meta, manifest link, apple-touch-icon, and rich noscript content with track listings
- **`nginx.conf`** — Added: security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy), SEO header (X-Robots-Tag), MIME type blocks for webmanifest and sitemap, updated gzip_types
- **`site/architecture.html`** — Added: meta description, canonical URL, robots tag
- **`site/docs/audio-reactivity.html`** — Added: meta description, canonical URL, robots tag

### SEO Score: 90/100
13 of 15 checks passing. Missing: Google Search Console verification, Bing Webmaster Tools submission.

---

## Phase 2: Documentation & Dashboard — COMPLETE

### New Files Created
- **`SEO.md`** — Comprehensive SEO documentation covering all implemented infrastructure, audit checklist, target keywords, social preview mockups, monitoring tools, and the interactive dashboard reference
- **`site/seo-dashboard.html`** — Interactive SEO & Marketing orchestrator dashboard (local dev tool only — `noindex` meta tag + blocked in robots.txt)

### Dashboard Sections (all verified in browser)
1. **SEO Health Score** — Animated gauge showing 90/100 with interactive checklist (toggle items, recalculates score)
2. **Social Preview Simulator** — OG card mockup with platform tabs (Discord, Twitter, LinkedIn, Facebook, iMessage)
3. **Track Catalog & Keywords** — 5 track cards with environment descriptions, keyword tags, and density indicators
4. **Crawl & Index Map** — Sitemap indexed pages with priorities + robots.txt blocked paths
5. **Structured Data Viewer** — Collapsible, syntax-highlighted JSON-LD blocks (WebApplication + MusicGroup schemas)
6. **Analytics & Development Intelligence** — GA4 property ID, Claude Code usage stats (819 messages, 142 sessions, 9 days, 746 files, +92.9K lines), language distribution bars, 13-session development timeline
7. **Marketing Action Items** — 10 prioritized items (HIGH/MEDIUM/LOW) with checkboxes, persisted to localStorage
8. **Server Configuration** — Syntax-highlighted nginx.conf with annotations

### Dashboard Features
- Sidebar navigation with scroll spy (IntersectionObserver)
- Dark theme matching site aesthetic (--bg-void: #040810, --green: #3cff6b)
- All interactive state persisted to localStorage
- Responsive layout, optimized for desktop
- Local dev only: `python serve.py` → `http://localhost:8000/seo-dashboard.html`

---

## Post-Deploy Checklist
- [ ] Deploy to Railway
- [ ] Verify `https://jrod.dev/robots.txt` renders as plain text
- [ ] Verify `https://jrod.dev/sitemap.xml` renders as XML
- [ ] Verify `https://jrod.dev/site.webmanifest` returns JSON
- [ ] Test OG image with Facebook Sharing Debugger (developers.facebook.com/tools/debug/)
- [ ] Validate JSON-LD at Google Rich Results Test (search.google.com/test/rich-results)
- [ ] Run Lighthouse SEO audit in Chrome DevTools
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools

---

## Next Steps (Future Work)
- ~~Add GA4 tracking to architecture.html, audio-reactivity.html, sandbox.html~~ ✅ Done (Phase 4)
- ~~Create per-track deep links (hash routing)~~ ✅ Done (Phase 4)
- ~~Add Content Security Policy header~~ ✅ Done (Phase 4)
- Generate proper 180×180 Apple Touch Icon PNG (currently using favicon.svg)
- Set up social media profiles linking back to jrod.dev
- Consider prerendering for non-JS crawlers
