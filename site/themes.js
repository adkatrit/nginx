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
  - trackColors: Complete color palette for racing track elements
    - floorPrimary/floorSecondary: Alternating floor segment colors
    - wallBase/wallAccent: Wall colors (accent used every 4th segment)
    - obstacle: Obstacle/barrier color
    - boostPad: Speed boost pad color
    - centerMarker: Center line marker color
    - fogColor: Scene fog/atmosphere color
    - fogNear/fogFar: Fog density parameters
    - ambientLight: Ambient lighting color
    - ambientIntensity: Ambient light strength
  - visualStyle: Per-track visual effects
    - wallStyle: "solid", "wireframe", "energy", "glass", "glow"
    - floorPattern: "solid", "grid", "stripes", "circuit", "waves", "hexagon"
    - glowIntensity: 0-1 (how strongly elements emit light)
    - particleType: "none", "bubbles", "sparks", "dust", "energy", "embers", "rain", "snow"
    - particleDensity: 0-1 (particle count)
    - pulseWithBeat: true/false (elements pulse with music beat)
    - skyGradient: [topColor, bottomColor] for background gradient
*/

window.TRACK_THEMES = {

  // ═══════════════════════════════════════════════════════════════
  // DATA TIDE - Deep oceanic digital flow
  // Model: Jellyfish - bioluminescent, floating, perfect for underwater
  // Colors: Deep ocean blues, bioluminescent cyans, aquatic atmosphere
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
    spotlightColor: 0x00bfff,
    trackColors: {
      floorPrimary: 0x001a2c,
      floorSecondary: 0x002840,
      wallBase: 0x003366,
      wallAccent: 0x00bfff,
      obstacle: 0x00ffff,
      boostPad: 0x00ffcc,
      centerMarker: 0x0088ff,
      fogColor: 0x000810,
      fogNear: 30,
      fogFar: 200,
      ambientLight: 0x001122,
      ambientIntensity: 0.3
    },
    visualStyle: {
      wallStyle: "glass",
      floorPattern: "waves",
      glowIntensity: 0.7,
      particleType: "bubbles",
      particleDensity: 0.6,
      pulseWithBeat: true,
      skyGradient: [0x000510, 0x001830]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SOFT SYSTEMS - Gentle, floating, ethereal
  // Model: Butterfly - delicate, graceful movement
  // Colors: Soft pastels, mint greens, gentle lavenders, dreamy atmosphere
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
    spotlightColor: 0x98fb98,
    trackColors: {
      floorPrimary: 0x1a1a2e,
      floorSecondary: 0x252540,
      wallBase: 0x2d4a3e,
      wallAccent: 0x98fb98,
      obstacle: 0xdda0dd,
      boostPad: 0xb0ffc8,
      centerMarker: 0x90ee90,
      fogColor: 0x0a1510,
      fogNear: 40,
      fogFar: 250,
      ambientLight: 0x1a2f1a,
      ambientIntensity: 0.4
    },
    visualStyle: {
      wallStyle: "glow",
      floorPattern: "hexagon",
      glowIntensity: 0.4,
      particleType: "dust",
      particleDensity: 0.3,
      pulseWithBeat: false,
      skyGradient: [0x0a1008, 0x1a2518]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // BEAST MODE - Aggressive, intense, powerful
  // Model: Godzilla - ultimate apex predator energy
  // Colors: Fiery reds, molten oranges, volcanic blacks, primal fury
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
    spotlightColor: 0xff2200,
    trackColors: {
      floorPrimary: 0x1a0808,
      floorSecondary: 0x2a0f0f,
      wallBase: 0x330000,
      wallAccent: 0xff2200,
      obstacle: 0xff4400,
      boostPad: 0xff6600,
      centerMarker: 0xff0000,
      fogColor: 0x0a0000,
      fogNear: 20,
      fogFar: 150,
      ambientLight: 0x220000,
      ambientIntensity: 0.25
    },
    visualStyle: {
      wallStyle: "energy",
      floorPattern: "stripes",
      glowIntensity: 1.0,
      particleType: "embers",
      particleDensity: 0.8,
      pulseWithBeat: true,
      skyGradient: [0x0a0000, 0x1a0505]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // DREAMS BLEED INTO DASHBOARDS - Surreal, glitchy, neon
  // Model: Biped Robot - tech meets dreams
  // Colors: Neon pinks, electric magentas, cyber purples, dreamscape
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
    spotlightColor: 0xff00ff,
    trackColors: {
      floorPrimary: 0x12001a,
      floorSecondary: 0x1e0028,
      wallBase: 0x2a0040,
      wallAccent: 0xff00ff,
      obstacle: 0xff44aa,
      boostPad: 0xcc00ff,
      centerMarker: 0xff66ff,
      fogColor: 0x08000f,
      fogNear: 25,
      fogFar: 180,
      ambientLight: 0x1a0022,
      ambientIntensity: 0.35
    },
    visualStyle: {
      wallStyle: "wireframe",
      floorPattern: "circuit",
      glowIntensity: 0.9,
      particleType: "energy",
      particleDensity: 0.7,
      pulseWithBeat: true,
      skyGradient: [0x05000a, 0x150020]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SIGNAL INTEGRITY - Clean, precise, technical
  // Model: White Eagle - clean lines, precision
  // Colors: Clean cyans, pure whites, digital precision, sterile tech
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
    spotlightColor: 0x00ffff,
    trackColors: {
      floorPrimary: 0x0a0a12,
      floorSecondary: 0x10101a,
      wallBase: 0x1a2a3a,
      wallAccent: 0x00ffff,
      obstacle: 0x00ddff,
      boostPad: 0x88ffff,
      centerMarker: 0x00aaff,
      fogColor: 0x040608,
      fogNear: 35,
      fogFar: 220,
      ambientLight: 0x0a1520,
      ambientIntensity: 0.35
    },
    visualStyle: {
      wallStyle: "solid",
      floorPattern: "grid",
      glowIntensity: 0.5,
      particleType: "sparks",
      particleDensity: 0.4,
      pulseWithBeat: true,
      skyGradient: [0x020408, 0x081018]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // GI MI DI REINS - Wild, free, untamed energy
  // Model: White Eagle - soaring freedom
  // Colors: Sunburst golds, wild yellows, amber warmth, open skies
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
    spotlightColor: 0xffd700,
    trackColors: {
      floorPrimary: 0x1a1408,
      floorSecondary: 0x281e0a,
      wallBase: 0x3d2e0a,
      wallAccent: 0xffd700,
      obstacle: 0xffaa00,
      boostPad: 0xffee44,
      centerMarker: 0xffcc00,
      fogColor: 0x0a0800,
      fogNear: 25,
      fogFar: 180,
      ambientLight: 0x221a08,
      ambientIntensity: 0.35
    },
    visualStyle: {
      wallStyle: "energy",
      floorPattern: "stripes",
      glowIntensity: 0.8,
      particleType: "sparks",
      particleDensity: 0.6,
      pulseWithBeat: true,
      skyGradient: [0x080600, 0x1a1408]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // TRADE YOU MY HANDS - Emotional, intimate, organic
  // Model: Butterfly - delicate, emotional
  // Colors: Warm rose, soft corals, intimate pinks, heartfelt warmth
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
    spotlightColor: 0xffb6c1,
    trackColors: {
      floorPrimary: 0x1a1015,
      floorSecondary: 0x28181f,
      wallBase: 0x3d2a32,
      wallAccent: 0xffb6c1,
      obstacle: 0xff7788,
      boostPad: 0xffccdd,
      centerMarker: 0xff9999,
      fogColor: 0x0a0508,
      fogNear: 40,
      fogFar: 250,
      ambientLight: 0x221518,
      ambientIntensity: 0.4
    },
    visualStyle: {
      wallStyle: "glow",
      floorPattern: "waves",
      glowIntensity: 0.5,
      particleType: "dust",
      particleDensity: 0.3,
      pulseWithBeat: false,
      skyGradient: [0x080508, 0x1a1018]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // PUSH HARDER - Driven, relentless, powerful
  // Model: Gorilla - raw strength and power
  // Colors: Industrial oranges, steel grays, forge fire, raw power
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
    spotlightColor: 0xff4500,
    trackColors: {
      floorPrimary: 0x121012,
      floorSecondary: 0x1c181a,
      wallBase: 0x2a2025,
      wallAccent: 0xff4500,
      obstacle: 0xff6633,
      boostPad: 0xff8844,
      centerMarker: 0xff5500,
      fogColor: 0x060404,
      fogNear: 20,
      fogFar: 140,
      ambientLight: 0x1a1012,
      ambientIntensity: 0.25
    },
    visualStyle: {
      wallStyle: "solid",
      floorPattern: "stripes",
      glowIntensity: 0.9,
      particleType: "embers",
      particleDensity: 0.7,
      pulseWithBeat: true,
      skyGradient: [0x040202, 0x100808]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // THE LAST DRAGON - Epic, mythical, ancient power
  // Model: Ice Dragon - legendary creature
  // Colors: Dragon fire oranges, ancient purples, mystical atmosphere
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
    spotlightColor: 0xff6600,
    trackColors: {
      floorPrimary: 0x0f0818,
      floorSecondary: 0x180c22,
      wallBase: 0x2a1040,
      wallAccent: 0xff6600,
      obstacle: 0xff8800,
      boostPad: 0xffaa33,
      centerMarker: 0xff5500,
      fogColor: 0x050310,
      fogNear: 30,
      fogFar: 200,
      ambientLight: 0x150820,
      ambientIntensity: 0.3
    },
    visualStyle: {
      wallStyle: "energy",
      floorPattern: "hexagon",
      glowIntensity: 0.8,
      particleType: "embers",
      particleDensity: 0.5,
      pulseWithBeat: true,
      skyGradient: [0x030208, 0x100818]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // WHO'S LEARNING WHO - Contemplative, questioning, AI-themed
  // Model: Biped Robot - AI and machine learning theme
  // Colors: Matrix greens, neural network blues, digital consciousness
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
    spotlightColor: 0x00ff00,
    trackColors: {
      floorPrimary: 0x080f08,
      floorSecondary: 0x0c180c,
      wallBase: 0x0a2a0a,
      wallAccent: 0x00ff00,
      obstacle: 0x44ff44,
      boostPad: 0x88ff88,
      centerMarker: 0x00dd00,
      fogColor: 0x020802,
      fogNear: 30,
      fogFar: 200,
      ambientLight: 0x082008,
      ambientIntensity: 0.35
    },
    visualStyle: {
      wallStyle: "wireframe",
      floorPattern: "circuit",
      glowIntensity: 0.7,
      particleType: "energy",
      particleDensity: 0.5,
      pulseWithBeat: true,
      skyGradient: [0x010401, 0x081008]
    }
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
  spotlightColor: 0xffffff,
  trackColors: {
    floorPrimary: 0x0a0a18,
    floorSecondary: 0x0f0f22,
    wallBase: 0x1a0033,
    wallAccent: 0xff00ff,
    obstacle: 0xff0044,
    boostPad: 0x00ffff,
    centerMarker: 0xff00ff,
    fogColor: 0x000008,
    fogNear: 30,
    fogFar: 200,
    ambientLight: 0x111122,
    ambientIntensity: 0.3
  },
  visualStyle: {
    wallStyle: "solid",
    floorPattern: "solid",
    glowIntensity: 0.5,
    particleType: "sparks",
    particleDensity: 0.4,
    pulseWithBeat: true,
    skyGradient: [0x000005, 0x000010]
  }
};
