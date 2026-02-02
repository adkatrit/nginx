/*
  TRACK THEMES CONFIGURATION
  --------------------------
  Each track has a fully customized visual experience.

  Properties:
  - model: 3D model ID
  - colorTheme: UI color scheme (neo, midnight, winamp41)
  - vizMode: Visualization type (grid, nebula, scope, voyage)
  - vizParams: Visualization parameters
  - spotlightColor: RGB hex for accent lighting
*/

window.TRACK_THEMES = {

  // ═══════════════════════════════════════════════════════════════
  // DATA TIDE - Deep oceanic digital flow
  // Model: Jellyfish - bioluminescent, floating, perfect for underwater
  // ═══════════════════════════════════════════════════════════════
  "Data Tide": {
    name: "Digital Ocean",
    model: "jellyfish",
    colorTheme: "winamp41",
    vizMode: "voyage",
    vizParams: {
      amplitude: 0.8,
      speed: 0.6,
      audioReactivity: 0.7,
      zoom: 0.4,
      smoothing: 0.7
    },
    spotlightColor: 0x00bfff
  },

  // ═══════════════════════════════════════════════════════════════
  // SOFT SYSTEMS - Gentle, floating, ethereal
  // Model: Butterfly - delicate, graceful movement
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
    spotlightColor: 0x98fb98
  },

  // ═══════════════════════════════════════════════════════════════
  // BEAST MODE - Aggressive, intense, powerful
  // Model: Godzilla - ultimate apex predator energy
  // ═══════════════════════════════════════════════════════════════
  "Beast Mode": {
    name: "Apex Predator",
    model: "godzilla",
    colorTheme: "winamp41",
    vizMode: "nebula",
    vizParams: {
      amplitude: 2.5,
      speed: 1.8,
      audioReactivity: 1.0,
      zoom: 0.3,
      smoothing: 0.1
    },
    spotlightColor: 0xff2200
  },

  // ═══════════════════════════════════════════════════════════════
  // DREAMS BLEED INTO DASHBOARDS - Surreal, glitchy, neon
  // Model: Biped Robot - tech meets dreams
  // ═══════════════════════════════════════════════════════════════
  "Dreams Bleed Into Dashboards": {
    name: "Neon Dream",
    model: "biped-robot",
    colorTheme: "neo",
    vizMode: "grid",
    vizParams: {
      amplitude: 1.2,
      speed: 1.0,
      audioReactivity: 0.8,
      zoom: 0.35,
      smoothing: 0.3
    },
    spotlightColor: 0xff00ff
  },

  // ═══════════════════════════════════════════════════════════════
  // SIGNAL INTEGRITY - Clean, precise, technical
  // Model: White Eagle - clean lines, precision
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
    spotlightColor: 0x00ffff
  },

  // ═══════════════════════════════════════════════════════════════
  // GI MI DI REINS - Wild, free, untamed energy
  // Model: White Eagle - soaring freedom
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
    spotlightColor: 0xffd700
  },

  // ═══════════════════════════════════════════════════════════════
  // TRADE YOU MY HANDS - Emotional, intimate, organic
  // Model: Butterfly - delicate, emotional
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
    spotlightColor: 0xffb6c1
  },

  // ═══════════════════════════════════════════════════════════════
  // PUSH HARDER - Driven, relentless, powerful
  // Model: Gorilla - raw strength and power
  // ═══════════════════════════════════════════════════════════════
  "Push Harder": {
    name: "Iron Will",
    model: "gorilla",
    colorTheme: "midnight",
    vizMode: "grid",
    vizParams: {
      amplitude: 2.0,
      speed: 1.6,
      audioReactivity: 1.0,
      zoom: 0.3,
      smoothing: 0.05
    },
    spotlightColor: 0xff4500
  },

  // ═══════════════════════════════════════════════════════════════
  // THE LAST DRAGON - Epic, mythical, ancient power
  // Model: Ice Dragon - legendary creature
  // ═══════════════════════════════════════════════════════════════
  "The Last Dragon": {
    name: "Ancient Legend",
    model: "icy-dragon",
    colorTheme: "midnight",
    vizMode: "nebula",
    vizParams: {
      amplitude: 1.5,
      speed: 0.8,
      audioReactivity: 0.7,
      zoom: 0.05,
      smoothing: 0.5
    },
    spotlightColor: 0xff6600
  },

  // ═══════════════════════════════════════════════════════════════
  // WHO'S LEARNING WHO - Contemplative, questioning, AI-themed
  // Model: Biped Robot - AI and machine learning theme
  // ═══════════════════════════════════════════════════════════════
  "Who's Learning Who": {
    name: "Neural Mirror",
    model: "biped-robot",
    colorTheme: "neo",
    vizMode: "scope",
    vizParams: {
      amplitude: 0.7,
      speed: 0.9,
      audioReactivity: 0.5,
      zoom: 0.5,
      smoothing: 0.6
    },
    spotlightColor: 0x00ff00
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
