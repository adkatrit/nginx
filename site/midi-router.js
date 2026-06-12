/**
 * MidiRouter - Frame-perfect MIDI note → visual event dispatch
 *
 * StemPlayer emits 'midiNote' events up to 100ms ahead of their actual
 * timestamp (scheduling look-ahead). Going straight from those events to
 * visuals makes every hit land early and jittery. This router sits between:
 *
 *   StemPlayer ('midiNote', early) → ingest() → queue → update(now) → dispatch
 *
 * Each event is held until the playback clock actually reaches its timestamp,
 * then dispatched on that exact frame — the difference between "bass FFT
 * energy is high" and "kick drum, beat 1, velocity 127" (TODO Priority 1).
 *
 * Events are enriched before dispatch:
 *   kind       — kick/snare/hihat/crash/ride/tom/perc (GM drum map),
 *                bass/vocal/synth/guitar/note (by stem)
 *   velocity01 — perceptually-scaled velocity in 0..1
 *   pitch01    — note position in 0..1 across C1..C7 (0 = low)
 *
 * Synth/keyboard noteOns within a 50ms window are also aggregated into a
 * 'chord' event carrying the root pitch class and a hue (0..1) so scenes can
 * tint atmosphere to the actual harmony.
 */
const MidiRouter = (function () {
  'use strict';

  // General MIDI percussion map → visual kinds
  const DRUM_KINDS = {
    35: 'kick', 36: 'kick',
    38: 'snare', 40: 'snare',
    37: 'perc', 39: 'perc', 54: 'perc', 56: 'perc', 58: 'perc',
    41: 'tom', 43: 'tom', 45: 'tom', 47: 'tom', 48: 'tom', 50: 'tom',
    42: 'hihat', 44: 'hihat', 46: 'hihat',
    49: 'crash', 52: 'crash', 55: 'crash', 57: 'crash',
    51: 'ride', 53: 'ride', 59: 'ride'
  };

  const CHORD_WINDOW = 0.05;   // seconds — simultaneous notes group into a chord
  const STALE_AGE = 0.3;       // drop events this far behind the clock (tab was hidden, etc.)
  const DISPATCH_SLOP = 0.009; // ~half a frame — fire on the frame nearest the timestamp

  function classifyStem(stemId) {
    const s = (stemId || '').toLowerCase();
    if (/drum|perc/.test(s)) return 'drums';
    if (/bass/.test(s)) return 'bass';
    if (/vocal/.test(s)) return 'vocal';
    if (/synth|key|piano|pad|organ/.test(s)) return 'synth';
    if (/guitar|string/.test(s)) return 'guitar';
    return 'note';
  }

  function enrich(event) {
    const stemKind = classifyStem(event.stemId);
    let kind = stemKind;
    if (stemKind === 'drums') {
      kind = DRUM_KINDS[event.note] || 'perc';
    }
    const v = (event.velocity != null ? event.velocity : 100) / 127;
    return {
      type: event.type,
      time: event.time,
      note: event.note,
      channel: event.channel,
      stemId: event.stemId,
      kind,
      stemKind,
      velocity01: Math.pow(Math.max(0, Math.min(1, v)), 0.8),
      pitch01: Math.max(0, Math.min(1, (event.note - 24) / 72))
    };
  }

  class Router {
    constructor() {
      this.queue = [];        // enriched events awaiting their timestamp (FIFO, time-ordered)
      this.lastNow = 0;
      this.pendingChords = new Map(); // stemId → { notes, velocity, windowEnd }
    }

    /** Feed a raw StemPlayer 'midiNote' event (may arrive up to 100ms early). */
    ingest(event) {
      if (!event || event.time == null) return;
      this.queue.push(enrich(event));
    }

    /**
     * Dispatch every queued event whose timestamp the playback clock has
     * reached. Call once per frame with StemPlayer.getCurrentTime().
     */
    update(now, dispatch) {
      // Seek backwards: queued future events belong to the old timeline
      if (now < this.lastNow - 0.2) {
        this.reset();
      }
      this.lastNow = now;

      const horizon = now + DISPATCH_SLOP;
      while (this.queue.length > 0 && this.queue[0].time <= horizon) {
        const ev = this.queue.shift();
        if (now - ev.time > STALE_AGE) continue; // too old to be musically useful
        this._aggregateChord(ev, now);
        if (dispatch) dispatch(ev);
      }

      // Flush chord windows that have closed
      for (const [stemId, pending] of this.pendingChords) {
        if (now > pending.windowEnd) {
          this.pendingChords.delete(stemId);
          if (dispatch && pending.notes.length > 0) {
            dispatch(this._chordEvent(stemId, pending));
          }
        }
      }
    }

    _aggregateChord(ev, now) {
      if (ev.type !== 'noteOn' || ev.stemKind !== 'synth') return;
      let pending = this.pendingChords.get(ev.stemId);
      if (!pending || ev.time > pending.windowEnd) {
        pending = { notes: [], velocity: 0, windowEnd: ev.time + CHORD_WINDOW };
        this.pendingChords.set(ev.stemId, pending);
      }
      pending.notes.push(ev.note);
      pending.velocity = Math.max(pending.velocity, ev.velocity01);
    }

    _chordEvent(stemId, pending) {
      const root = Math.min(...pending.notes);
      const pitchClass = ((root % 12) + 12) % 12;
      return {
        type: 'noteOn',
        kind: 'chord',
        stemKind: 'synth',
        stemId,
        notes: pending.notes.slice(),
        note: root,
        velocity01: pending.velocity,
        pitch01: Math.max(0, Math.min(1, (root - 24) / 72)),
        hue: pitchClass / 12,
        time: pending.windowEnd - CHORD_WINDOW
      };
    }

    /** Clear all queued state — call on seek and track change. */
    reset() {
      this.queue.length = 0;
      this.pendingChords.clear();
    }
  }

  return {
    create() { return new Router(); },
    classifyStem,
    enrich
  };
})();

window.MidiRouter = MidiRouter;
