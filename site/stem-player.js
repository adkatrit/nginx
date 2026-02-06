/**
 * StemPlayer - Multi-track stem playback with per-stem audio analysis
 *
 * Uses AudioBufferSourceNode for sample-accurate synchronized playback.
 * All stems start at the exact same AudioContext time, eliminating drift.
 *
 * Provides:
 * - Synchronized playback of all stems (sample-accurate)
 * - Per-stem audio analysis (energy, bass, mid, treble)
 * - Per-stem volume/mute control
 * - MIDI event scheduling for note-accurate visualization
 */
class StemPlayer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.stems = new Map(); // stemId -> { buffer, sourceNode, gainNode, analyser, data }
    this.manifest = null;
    this.basePath = '';
    this.isPlaying = false;
    this.isLoaded = false;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);

    // Playback timing
    this.startTime = 0; // AudioContext time when playback started
    this.pauseOffset = 0; // Position in track when paused

    // Analysis settings
    this.fftSize = 256;
    this.smoothingTimeConstant = 0.8;

    // Event listeners
    this.listeners = {
      'stemAnalysis': [],
      'midiNote': [],
      'loaded': [],
      'error': [],
      'progress': []
    };

    // MIDI data
    this.midiData = new Map(); // stemId -> parsed MIDI events
    this.midiSchedule = []; // Upcoming MIDI events sorted by time
    this.lastMidiCheck = 0;

    // Track duration
    this.duration = 0;
  }

  /**
   * Load stems from a manifest file
   */
  async loadFromManifest(manifestUrl, progressCallback) {
    try {
      this.basePath = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);

      const response = await fetch(manifestUrl);
      if (!response.ok) throw new Error(`Failed to load manifest: ${response.status}`);

      this.manifest = await response.json();

      // Load all stems in parallel, tracking progress
      const stemEntries = Object.entries(this.manifest.stems);
      const totalStems = stemEntries.length;
      let loadedStems = 0;

      console.log(`[StemPlayer] Loading ${totalStems} stems as AudioBuffers...`);

      const loadPromises = stemEntries.map(async ([stemId, stemConfig]) => {
        try {
          await this.loadStem(stemId, stemConfig);
          loadedStems++;
          console.log(`[StemPlayer] ✓ Loaded: ${stemId} (${loadedStems}/${totalStems})`);

          // Emit progress
          if (progressCallback) {
            progressCallback(loadedStems, totalStems, stemId);
          }
          this.emit('progress', { loaded: loadedStems, total: totalStems, current: stemId });

          return { stemId, success: true };
        } catch (err) {
          loadedStems++;
          console.error(`[StemPlayer] ✗ Failed to load ${stemId}:`, err.message);

          if (progressCallback) {
            progressCallback(loadedStems, totalStems, `${stemId} (failed)`);
          }

          return { stemId, success: false, error: err.message };
        }
      });

      const results = await Promise.all(loadPromises);
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success);

      console.log(`[StemPlayer] Loaded ${succeeded}/${totalStems} stems`);
      if (failed.length > 0) {
        console.warn('[StemPlayer] Failed stems:', failed.map(f => f.stemId).join(', '));
      }

      // Calculate duration from loaded buffers
      for (const stem of this.stems.values()) {
        if (stem.buffer && stem.buffer.duration > this.duration) {
          this.duration = stem.buffer.duration;
        }
      }

      this.isLoaded = true;
      this.emit('loaded', { manifest: this.manifest });

      return this.manifest;
    } catch (error) {
      this.emit('error', { error });
      throw error;
    }
  }

  /**
   * Load a single stem as an AudioBuffer
   */
  async loadStem(stemId, config) {
    const audioUrl = this.basePath + config.audio + '?v=' + Date.now();

    // Fetch and decode audio data into an AudioBuffer
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${audioUrl}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Create gain node for this stem (persistent)
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    // Create analyser for this stem (persistent)
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = this.fftSize;
    analyser.smoothingTimeConstant = this.smoothingTimeConstant;
    analyser.connect(gainNode);

    // Store stem data
    this.stems.set(stemId, {
      buffer: audioBuffer,
      sourceNode: null, // Created fresh each time we play
      analyser,
      gainNode,
      config,
      volume: 1,
      muted: false,
      frequencyData: new Uint8Array(analyser.frequencyBinCount),
      analysis: {
        energy: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        peak: 0
      }
    });
  }

  /**
   * Create source nodes for all stems and start them at the exact same time
   */
  _createAndStartSources(offset = 0) {
    // Schedule all stems to start at exactly the same moment
    const startAt = this.audioContext.currentTime + 0.05; // 50ms ahead for scheduling

    for (const [stemId, stem] of this.stems) {
      // Create a new source node (they're single-use)
      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = stem.buffer;
      sourceNode.connect(stem.analyser);

      // Start at exactly the scheduled time, from the offset position
      sourceNode.start(startAt, offset);

      // Store reference so we can stop it later
      stem.sourceNode = sourceNode;

      // Handle natural end of playback
      sourceNode.onended = () => {
        if (this.isPlaying && stem.sourceNode === sourceNode) {
          // Check if all stems have ended
          let allEnded = true;
          for (const s of this.stems.values()) {
            if (s.sourceNode && s.sourceNode.playbackState !== 3) { // 3 = finished
              allEnded = false;
              break;
            }
          }
          if (allEnded) {
            this.isPlaying = false;
            this.pauseOffset = 0;
          }
        }
      };
    }

    this.startTime = startAt - offset;
    this.isPlaying = true;
  }

  /**
   * Stop all source nodes
   */
  _stopSources() {
    for (const [stemId, stem] of this.stems) {
      if (stem.sourceNode) {
        try {
          stem.sourceNode.stop();
        } catch (e) {
          // Already stopped
        }
        stem.sourceNode = null;
      }
    }
  }

  /**
   * Load MIDI data for a stem
   */
  async loadMidi(stemId) {
    const stem = this.stems.get(stemId);
    if (!stem || !stem.config.midi) return null;

    // Cache-bust MIDI URL
    const midiUrl = this.basePath + stem.config.midi + '?v=' + Date.now();

    try {
      const response = await fetch(midiUrl);
      const arrayBuffer = await response.arrayBuffer();
      const midiData = this.parseMidi(new Uint8Array(arrayBuffer));
      this.midiData.set(stemId, midiData);
      return midiData;
    } catch (error) {
      console.warn(`Failed to load MIDI for ${stemId}:`, error);
      return null;
    }
  }

  /**
   * Load all MIDI files
   */
  async loadAllMidi() {
    const promises = [];
    for (const stemId of this.stems.keys()) {
      promises.push(this.loadMidi(stemId));
    }
    await Promise.all(promises);
    this.buildMidiSchedule();
  }

  /**
   * Simple MIDI parser - extracts note on/off events
   */
  parseMidi(data) {
    const events = [];
    let pos = 0;

    // Check MIDI header
    if (String.fromCharCode(...data.slice(0, 4)) !== 'MThd') {
      console.warn('Invalid MIDI file');
      return events;
    }

    // Read header
    pos = 8;
    const format = (data[pos] << 8) | data[pos + 1];
    const numTracks = (data[pos + 2] << 8) | data[pos + 3];
    const division = (data[pos + 4] << 8) | data[pos + 5];
    pos += 6;

    // Parse tracks
    for (let track = 0; track < numTracks; track++) {
      if (String.fromCharCode(...data.slice(pos, pos + 4)) !== 'MTrk') {
        break;
      }

      const trackLength = (data[pos + 4] << 24) | (data[pos + 5] << 16) | (data[pos + 6] << 8) | data[pos + 7];
      pos += 8;

      let trackPos = pos;
      const trackEnd = pos + trackLength;
      let absoluteTicks = 0;
      let runningStatus = 0;

      while (trackPos < trackEnd) {
        // Read delta time (variable length)
        let deltaTime = 0;
        let byte;
        do {
          byte = data[trackPos++];
          deltaTime = (deltaTime << 7) | (byte & 0x7F);
        } while (byte & 0x80);

        absoluteTicks += deltaTime;

        // Read event
        let status = data[trackPos];
        if (status < 0x80) {
          // Running status
          status = runningStatus;
        } else {
          trackPos++;
          runningStatus = status;
        }

        const eventType = status & 0xF0;
        const channel = status & 0x0F;

        if (eventType === 0x90) {
          // Note on
          const note = data[trackPos++];
          const velocity = data[trackPos++];
          if (velocity > 0) {
            events.push({
              type: 'noteOn',
              ticks: absoluteTicks,
              time: 0, // Will be calculated
              note,
              velocity,
              channel
            });
          } else {
            // Velocity 0 = note off
            events.push({
              type: 'noteOff',
              ticks: absoluteTicks,
              time: 0,
              note,
              channel
            });
          }
        } else if (eventType === 0x80) {
          // Note off
          const note = data[trackPos++];
          trackPos++; // velocity
          events.push({
            type: 'noteOff',
            ticks: absoluteTicks,
            time: 0,
            note,
            channel
          });
        } else if (eventType === 0xA0 || eventType === 0xB0 || eventType === 0xE0) {
          trackPos += 2; // 2 data bytes
        } else if (eventType === 0xC0 || eventType === 0xD0) {
          trackPos += 1; // 1 data byte
        } else if (status === 0xFF) {
          // Meta event
          const metaType = data[trackPos++];
          let length = 0;
          do {
            byte = data[trackPos++];
            length = (length << 7) | (byte & 0x7F);
          } while (byte & 0x80);

          if (metaType === 0x51 && length === 3) {
            // Tempo change - could use this for accurate timing
          }
          trackPos += length;
        } else if (status === 0xF0 || status === 0xF7) {
          // SysEx
          let length = 0;
          do {
            byte = data[trackPos++];
            length = (length << 7) | (byte & 0x7F);
          } while (byte & 0x80);
          trackPos += length;
        }
      }

      pos = trackEnd;
    }

    // Convert ticks to time (assuming 120 BPM for now, will be configurable)
    const bpm = this.manifest?.bpm || 120;
    const ticksPerBeat = division;
    const secondsPerTick = 60 / (bpm * ticksPerBeat);

    for (const event of events) {
      event.time = event.ticks * secondsPerTick;
    }

    // Sort by time
    events.sort((a, b) => a.time - b.time);

    return events;
  }

  /**
   * Build a combined schedule of all MIDI events
   */
  buildMidiSchedule() {
    this.midiSchedule = [];

    for (const [stemId, events] of this.midiData) {
      for (const event of events) {
        this.midiSchedule.push({
          ...event,
          stemId
        });
      }
    }

    this.midiSchedule.sort((a, b) => a.time - b.time);
  }

  /**
   * Play all stems synchronized
   */
  play() {
    if (!this.isLoaded || this.isPlaying) return;

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Create new source nodes and start them at the exact same time
    this._createAndStartSources(this.pauseOffset);
  }

  /**
   * Pause all stems
   */
  pause() {
    if (!this.isPlaying) return;

    // Store current position before stopping
    this.pauseOffset = this.getCurrentTime();

    // Stop all sources
    this._stopSources();
    this.isPlaying = false;
  }

  /**
   * Stop and reset to beginning
   */
  stop() {
    this._stopSources();
    this.isPlaying = false;
    this.pauseOffset = 0;
    this.lastMidiCheck = 0;
  }

  /**
   * Seek to a position (in seconds)
   */
  seek(time) {
    const wasPlaying = this.isPlaying;

    // Stop current playback
    this._stopSources();
    this.isPlaying = false;

    // Set new position
    this.pauseOffset = Math.max(0, Math.min(time, this.duration));
    this.lastMidiCheck = this.pauseOffset;

    // Resume if was playing
    if (wasPlaying) {
      this._createAndStartSources(this.pauseOffset);
    }
  }

  /**
   * Get current playback time
   */
  getCurrentTime() {
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pauseOffset;
  }

  /**
   * Get duration
   */
  getDuration() {
    return this.duration;
  }

  /**
   * Set volume for a specific stem (0-1)
   */
  setStemVolume(stemId, volume) {
    const stem = this.stems.get(stemId);
    if (stem) {
      stem.volume = Math.max(0, Math.min(1, volume));
      if (!stem.muted) {
        stem.gainNode.gain.value = stem.volume;
      }
    }
  }

  /**
   * Mute/unmute a stem
   */
  muteStem(stemId, muted) {
    const stem = this.stems.get(stemId);
    if (stem) {
      stem.muted = muted;
      stem.gainNode.gain.value = muted ? 0 : stem.volume;
    }
  }

  /**
   * Solo a stem (mute all others)
   */
  soloStem(stemId) {
    for (const [id, stem] of this.stems) {
      stem.gainNode.gain.value = id === stemId ? stem.volume : 0;
    }
  }

  /**
   * Unsolo (restore all volumes)
   */
  unsoloAll() {
    for (const [id, stem] of this.stems) {
      stem.gainNode.gain.value = stem.muted ? 0 : stem.volume;
    }
  }

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Analyze all stems and emit data
   * Call this in your animation loop
   */
  analyze() {
    if (!this.isLoaded) return null;

    const analysisResults = {};

    for (const [stemId, stem] of this.stems) {
      // Only get frequency data if we're playing
      if (this.isPlaying && stem.sourceNode) {
        stem.analyser.getByteFrequencyData(stem.frequencyData);
      } else {
        // Clear data when not playing
        stem.frequencyData.fill(0);
      }

      const data = stem.frequencyData;
      const binCount = data.length;

      // Calculate frequency band energies
      // Bass: 20-250Hz (roughly first 10% of bins)
      // Mid: 250-2000Hz (roughly 10-40% of bins)
      // Treble: 2000-20000Hz (roughly 40-100% of bins)

      const bassEnd = Math.floor(binCount * 0.1);
      const midEnd = Math.floor(binCount * 0.4);

      let bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0;
      let peak = 0;

      for (let i = 0; i < binCount; i++) {
        const value = data[i] / 255;
        totalSum += value;

        if (value > peak) peak = value;

        if (i < bassEnd) {
          bassSum += value;
        } else if (i < midEnd) {
          midSum += value;
        } else {
          trebleSum += value;
        }
      }

      // Normalize
      const bass = bassEnd > 0 ? bassSum / bassEnd : 0;
      const mid = (midEnd - bassEnd) > 0 ? midSum / (midEnd - bassEnd) : 0;
      const treble = (binCount - midEnd) > 0 ? trebleSum / (binCount - midEnd) : 0;
      const energy = binCount > 0 ? totalSum / binCount : 0;

      stem.analysis = { energy, bass, mid, treble, peak };
      analysisResults[stemId] = stem.analysis;
    }

    // Check for MIDI events
    const currentTime = this.getCurrentTime();
    this.checkMidiEvents(currentTime);

    this.emit('stemAnalysis', analysisResults);

    return analysisResults;
  }

  /**
   * Check and emit MIDI events
   */
  checkMidiEvents(currentTime) {
    const lookAhead = 0.1; // 100ms look-ahead for scheduling

    for (const event of this.midiSchedule) {
      if (event.time > this.lastMidiCheck && event.time <= currentTime + lookAhead) {
        this.emit('midiNote', event);
      }
    }

    this.lastMidiCheck = currentTime;
  }

  /**
   * Get stem analysis data
   */
  getStemAnalysis(stemId) {
    const stem = this.stems.get(stemId);
    return stem ? stem.analysis : null;
  }

  /**
   * Get all stem IDs
   */
  getStemIds() {
    return Array.from(this.stems.keys());
  }

  /**
   * Get stem config
   */
  getStemConfig(stemId) {
    const stem = this.stems.get(stemId);
    return stem ? stem.config : null;
  }

  /**
   * Event emitter methods
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]) {
        callback(data);
      }
    }
  }

  /**
   * Clean up
   */
  dispose() {
    this.stop();

    for (const [stemId, stem] of this.stems) {
      if (stem.analyser) stem.analyser.disconnect();
      if (stem.gainNode) stem.gainNode.disconnect();
    }

    this.stems.clear();
    this.midiData.clear();
    this.midiSchedule = [];
    this.isLoaded = false;
    this.duration = 0;
  }
}

// Export for use
window.StemPlayer = StemPlayer;
