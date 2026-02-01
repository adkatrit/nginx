/*
  TRACK THEMES CONFIGURATION
  --------------------------
  Each track has a fully customized visual experience.

  Properties:
  - model: 3D model ID
  - colorTheme: UI color scheme (neo, midnight, winamp41)
  - vizMode: Visualization type (grid, nebula, scope, voyage)
  - vizParams: Visualization parameters
    - amplitude: 0.2-3.0 (how much audio affects visuals)
    - speed: 0.25-2.0 (animation speed)
    - audioReactivity: 0-1.0 (how much audio affects speed)
    - zoom: 0.25-2.0 (camera distance)
    - smoothing: 0-0.95 (audio smoothing)
  - spotlightColor: RGB hex for accent lighting
*/

window.TRACK_THEMES = {

  // ═══════════════════════════════════════════════════════════════
  // DATA TIDE - Deep oceanic digital flow
  // ═══════════════════════════════════════════════════════════════
  "Data Tide": {
    name: "Digital Ocean",
    model: "blue-whale",
    colorTheme: "winamp41",
    vizMode: "voyage",
    vizParams: {
      amplitude: 0.8,
      speed: 0.6,
      audioReactivity: 0.7,
      zoom: 0.4,
      smoothing: 0.7
    },
    spotlightColor: 0x00bfff  // Deep sky blue
  },

  // ═══════════════════════════════════════════════════════════════
  // SOFT SYSTEMS - Gentle, floating, ethereal
  // ═══════════════════════════════════════════════════════════════
  "Soft Systems": {
    name: "Gentle Machine",
    model: "butterfly",
    colorTheme: "neo",
    vizMode: "voyage",
    vizParams: {
      amplitude: 0.4,
      speed: 0.4,
      audioReactivity: 0.3,
      zoom: 0.5,
      smoothing: 0.85
    },
    spotlightColor: 0x98fb98  // Pale green
  },

  // ═══════════════════════════════════════════════════════════════
  // BEAST MODE - Aggressive, intense, powerful
  // ═══════════════════════════════════════════════════════════════
  "Beast Mode": {
    name: "Apex Predator",
    model: "white-eagle",
    colorTheme: "winamp41",
    vizMode: "nebula",
    vizParams: {
      amplitude: 2.5,
      speed: 1.8,
      audioReactivity: 1.0,
      zoom: 0.3,
      smoothing: 0.1
    },
    spotlightColor: 0xff2200  // Aggressive red-orange
  },

  // ═══════════════════════════════════════════════════════════════
  // DREAMS BLEED INTO DASHBOARDS - Surreal, glitchy, neon
  // ═══════════════════════════════════════════════════════════════
  "Dreams Bleed Into Dashboards": {
    name: "Neon Dream",
    model: "butterfly",
    colorTheme: "neo",
    vizMode: "grid",
    vizParams: {
      amplitude: 1.2,
      speed: 1.0,
      audioReactivity: 0.8,
      zoom: 0.35,
      smoothing: 0.3
    },
    spotlightColor: 0xff00ff  // Magenta
  },

  // ═══════════════════════════════════════════════════════════════
  // SIGNAL INTEGRITY - Clean, precise, technical
  // ═══════════════════════════════════════════════════════════════
  "Signal Integrity": {
    name: "Clean Signal",
    model: "white-eagle",
    colorTheme: "winamp41",
    vizMode: "scope",
    vizParams: {
      amplitude: 0.6,
      speed: 1.2,
      audioReactivity: 0.9,
      zoom: 0.45,
      smoothing: 0.2
    },
    spotlightColor: 0x00ffff  // Cyan
  },

  // ═══════════════════════════════════════════════════════════════
  // GI MI DI REINS - Wild, free, untamed energy
  // ═══════════════════════════════════════════════════════════════
  "Gi Mi Di Reins": {
    name: "Wild Freedom",
    model: "white-eagle",
    colorTheme: "neo",
    vizMode: "nebula",
    vizParams: {
      amplitude: 1.8,
      speed: 1.5,
      audioReactivity: 0.9,
      zoom: 0.25,
      smoothing: 0.15
    },
    spotlightColor: 0xffd700  // Gold
  },

  // ═══════════════════════════════════════════════════════════════
  // TRADE YOU MY HANDS - Emotional, intimate, organic
  // ═══════════════════════════════════════════════════════════════
  "Trade You My Hands": {
    name: "Tender Exchange",
    model: "butterfly",
    colorTheme: "midnight",
    vizMode: "nebula",
    vizParams: {
      amplitude: 0.5,
      speed: 0.5,
      audioReactivity: 0.6,
      zoom: 0.6,
      smoothing: 0.8
    },
    spotlightColor: 0xffb6c1  // Light pink
  },

  // ═══════════════════════════════════════════════════════════════
  // PUSH HARDER - Driven, relentless, powerful
  // ═══════════════════════════════════════════════════════════════
  "Push Harder": {
    name: "Iron Will",
    model: "white-eagle",
    colorTheme: "midnight",
    vizMode: "grid",
    vizParams: {
      amplitude: 2.0,
      speed: 1.6,
      audioReactivity: 1.0,
      zoom: 0.3,
      smoothing: 0.05
    },
    spotlightColor: 0xff4500  // Orange red
  },

  // ═══════════════════════════════════════════════════════════════
  // THE LAST DRAGON - Epic, mythical, ancient power
  // ═══════════════════════════════════════════════════════════════
  "The Last Dragon": {
    name: "Ancient Legend",
    model: "loggerhead",
    colorTheme: "midnight",
    vizMode: "nebula",
    vizParams: {
      amplitude: 1.5,
      speed: 0.8,
      audioReactivity: 0.7,
      zoom: 0.35,
      smoothing: 0.5
    },
    spotlightColor: 0xff6600  // Fire orange
  },

  // ═══════════════════════════════════════════════════════════════
  // WHO'S LEARNING WHO - Contemplative, questioning, AI-themed
  // ═══════════════════════════════════════════════════════════════
  "Who's Learning Who": {
    name: "Neural Mirror",
    model: "loggerhead",
    colorTheme: "neo",
    vizMode: "scope",
    vizParams: {
      amplitude: 0.7,
      speed: 0.9,
      audioReactivity: 0.5,
      zoom: 0.5,
      smoothing: 0.6
    },
    spotlightColor: 0x00ff00  // Matrix green
  }
};

window.DEFAULT_THEME = {
  name: "Default",
  model: null,
  colorTheme: "midnight",
  vizMode: "grid",
  vizParams: {
    amplitude: 0.3,
    speed: 1.0,
    audioReactivity: 0.5,
    zoom: 0.25,
    smoothing: 0.15
  },
  spotlightColor: 0xffffff
};
