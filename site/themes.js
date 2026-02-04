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
    - backgroundEffect: Animated shader background
      - type: "topo", "ocean", "nebula", "matrix", "aurora", "forge", "sakura", "circuit", "glacier", "savanna"
      - color1/color2/color3: Base gradient colors
      - accent: Highlight/glow color
      - speed: Animation speed (0.1-2.0)
      - intensity: Effect strength (0-1)
      - scale: Pattern scale (0.5-2.0)
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
      skyGradient: [0x000510, 0x001830],
      backgroundEffect: {
        type: "ocean",
        color1: 0x000815,
        color2: 0x001a2c,
        color3: 0x003355,
        accent: 0x00bfff,
        speed: 0.8,
        intensity: 0.6,
        scale: 1.2
      },
      terrain: {
        enabled: true,
        scale: 0.015,
        octaves: 5,
        persistence: 0.6,
        amplitude: 4.0,
        baseHeight: -3.0,
        ridged: false,
        colorByHeight: true,
        lowColor: 0x001a2c,
        midColor: 0x003355,
        highColor: 0x005588,
        peakColor: 0x00aacc
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SOFT SYSTEMS - Dreamy, cloud-like, dawn atmosphere
  // Model: Butterfly - floating through pastel clouds at sunrise
  // Colors: Soft lavenders, peachy pinks, cotton candy clouds, gentle warmth
  // ═══════════════════════════════════════════════════════════════
  "Soft Systems": {
    name: "Cloud Nine",
    model: "butterfly",
    colorTheme: "midnight",
    vizMode: "voyage",
    vizParams: {
      amplitude: 0.3,
      speed: 0.35,
      audioReactivity: 0.25,
      zoom: 0.55,
      smoothing: 0.9
    },
    spotlightColor: 0xffccee,
    trackColors: {
      floorPrimary: 0x1a1520,
      floorSecondary: 0x221a28,
      wallBase: 0x2a2035,
      wallAccent: 0xeebb99,
      obstacle: 0xddaacc,
      boostPad: 0xffddee,
      centerMarker: 0xccaadd,
      fogColor: 0x1a1520,
      fogNear: 15,
      fogFar: 150,
      ambientLight: 0x2a2030,
      ambientIntensity: 0.5
    },
    visualStyle: {
      wallStyle: "glow",
      floorPattern: "waves",
      glowIntensity: 0.3,
      particleType: "dust",
      particleDensity: 0.4,
      pulseWithBeat: false,
      skyGradient: [0x2a2040, 0x4a3050],
      backgroundEffect: {
        type: "nebula",
        color1: 0x1a1525,
        color2: 0x2a2040,
        color3: 0x4a3060,
        accent: 0xffccee,
        speed: 0.4,
        intensity: 0.4,
        scale: 0.8
      },
      terrain: {
        enabled: true,
        scale: 0.04,
        octaves: 2,
        persistence: 0.7,
        amplitude: 1.5,
        baseHeight: -0.5,
        ridged: false,
        colorByHeight: true,
        lowColor: 0x2a2035,
        midColor: 0x3a2845,
        highColor: 0x5a4060,
        peakColor: 0xccaacc
      }
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
      skyGradient: [0x0a0000, 0x1a0505],
      backgroundEffect: {
        type: "forge",
        color1: 0x0a0000,
        color2: 0x1a0505,
        color3: 0x4a1010,
        accent: 0xff4400,
        speed: 1.5,
        intensity: 0.9,
        scale: 1.0
      },
      terrain: {
        enabled: true,
        scale: 0.018,
        octaves: 5,
        persistence: 0.4,
        amplitude: 12.0,
        baseHeight: -3.0,
        ridged: true,
        terraced: 5,
        colorByHeight: true,
        lowColor: 0x1a0808,
        midColor: 0x4a1010,
        highColor: 0x882020,
        peakColor: 0xff4400
      }
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
      skyGradient: [0x05000a, 0x150020],
      backgroundEffect: {
        type: "circuit",
        color1: 0x05000a,
        color2: 0x150020,
        color3: 0x3a0060,
        accent: 0xff00ff,
        speed: 1.2,
        intensity: 0.8,
        scale: 1.5
      },
      terrain: {
        enabled: true,
        scale: 0.03,
        octaves: 3,
        persistence: 0.3,
        amplitude: 6.0,
        baseHeight: -2.0,
        ridged: false,
        colorByHeight: true,
        wireframe: true,
        lowColor: 0x1a0030,
        midColor: 0x3a0060,
        highColor: 0x6a0090,
        peakColor: 0xff00ff
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SIGNAL INTEGRITY - Sterile, clinical, laboratory precision
  // Model: White Eagle - pure, precise, perfect form
  // Colors: Clinical whites, sterile blues, pristine laboratory aesthetic
  // ═══════════════════════════════════════════════════════════════
  "Signal Integrity": {
    name: "White Room",
    model: "white-eagle",
    colorTheme: "neo",
    vizMode: "scope",
    vizParams: {
      amplitude: 0.5,
      speed: 1.0,
      audioReactivity: 0.85,
      zoom: 0.4,
      smoothing: 0.15
    },
    spotlightColor: 0xeeffff,
    trackColors: {
      floorPrimary: 0x18181a,
      floorSecondary: 0x202022,
      wallBase: 0x303035,
      wallAccent: 0xeeffff,
      obstacle: 0xccddee,
      boostPad: 0x66ddff,
      centerMarker: 0xaaccdd,
      fogColor: 0x101012,
      fogNear: 50,
      fogFar: 300,
      ambientLight: 0x252528,
      ambientIntensity: 0.6
    },
    visualStyle: {
      wallStyle: "glass",
      floorPattern: "grid",
      glowIntensity: 0.3,
      particleType: "dust",
      particleDensity: 0.2,
      pulseWithBeat: true,
      skyGradient: [0x101015, 0x1a1a20],
      backgroundEffect: {
        type: "topo",
        color1: 0x101015,
        color2: 0x1a1a22,
        color3: 0x303040,
        accent: 0xaaccdd,
        speed: 0.6,
        intensity: 0.5,
        scale: 1.0
      },
      terrain: {
        enabled: true,
        scale: 0.025,
        octaves: 2,
        persistence: 0.3,
        amplitude: 3.0,
        baseHeight: -1.0,
        ridged: false,
        terraced: 12,
        colorByHeight: true,
        lowColor: 0x202025,
        midColor: 0x353540,
        highColor: 0x505560,
        peakColor: 0xaabbcc
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // GI MI DI REINS - Sunset savanna, freedom at golden hour
  // Model: White Eagle - soaring over endless plains at dusk
  // Colors: Sunset oranges bleeding into purple, dusty earth, golden warmth
  // ═══════════════════════════════════════════════════════════════
  "Gi Mi Di Reins": {
    name: "Golden Hour",
    model: "white-eagle",
    colorTheme: "winamp41",
    vizMode: "nebula",
    vizParams: {
      amplitude: 1.4,
      speed: 1.2,
      audioReactivity: 0.85,
      zoom: 0.2,
      smoothing: 0.25
    },
    spotlightColor: 0xffaa55,
    trackColors: {
      floorPrimary: 0x1a120c,
      floorSecondary: 0x251a12,
      wallBase: 0x352518,
      wallAccent: 0xff8844,
      obstacle: 0xdd6633,
      boostPad: 0xffcc66,
      centerMarker: 0xee7744,
      fogColor: 0x15100a,
      fogNear: 20,
      fogFar: 200,
      ambientLight: 0x2a1a10,
      ambientIntensity: 0.45
    },
    visualStyle: {
      wallStyle: "glow",
      floorPattern: "stripes",
      glowIntensity: 0.7,
      particleType: "dust",
      particleDensity: 0.5,
      pulseWithBeat: true,
      skyGradient: [0x1a0820, 0x4a2510],
      backgroundEffect: {
        type: "savanna",
        color1: 0x1a0820,
        color2: 0x4a2510,
        color3: 0xff8844,
        accent: 0xffcc66,
        speed: 0.7,
        intensity: 0.7,
        scale: 1.0
      },
      terrain: {
        enabled: true,
        scale: 0.02,
        octaves: 3,
        persistence: 0.6,
        amplitude: 2.5,
        baseHeight: -0.8,
        ridged: false,
        colorByHeight: true,
        lowColor: 0x2a1a10,
        midColor: 0x4a3020,
        highColor: 0x6a4a30,
        peakColor: 0xbb8855
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // TRADE YOU MY HANDS - Cherry blossom twilight, intimate vulnerability
  // Model: Butterfly - delicate as falling petals
  // Colors: Deep twilight purples, sakura pinks, floating petal atmosphere
  // ═══════════════════════════════════════════════════════════════
  "Trade You My Hands": {
    name: "Petal Fall",
    model: "butterfly",
    colorTheme: "midnight",
    vizMode: "voyage",
    vizParams: {
      amplitude: 0.4,
      speed: 0.4,
      audioReactivity: 0.5,
      zoom: 0.5,
      smoothing: 0.85
    },
    spotlightColor: 0xffaacc,
    trackColors: {
      floorPrimary: 0x150a15,
      floorSecondary: 0x1f1020,
      wallBase: 0x301830,
      wallAccent: 0xff99bb,
      obstacle: 0xcc6699,
      boostPad: 0xffccee,
      centerMarker: 0xdd88aa,
      fogColor: 0x100810,
      fogNear: 15,
      fogFar: 180,
      ambientLight: 0x201020,
      ambientIntensity: 0.45
    },
    visualStyle: {
      wallStyle: "glow",
      floorPattern: "waves",
      glowIntensity: 0.4,
      particleType: "dust",
      particleDensity: 0.6,
      pulseWithBeat: false,
      skyGradient: [0x180820, 0x301838],
      backgroundEffect: {
        type: "sakura",
        color1: 0x150a18,
        color2: 0x251530,
        color3: 0x452848,
        accent: 0xff99bb,
        speed: 0.5,
        intensity: 0.5,
        scale: 1.2
      },
      terrain: {
        enabled: true,
        scale: 0.035,
        octaves: 2,
        persistence: 0.7,
        amplitude: 1.8,
        baseHeight: -0.3,
        ridged: false,
        colorByHeight: true,
        lowColor: 0x201020,
        midColor: 0x351830,
        highColor: 0x502848,
        peakColor: 0xbb7799
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // PUSH HARDER - Industrial, mechanical, relentless grind
  // Model: Gorilla - raw power in a steel foundry
  // Colors: Gunmetal grays, cold steel blues, welding spark accents
  // ═══════════════════════════════════════════════════════════════
  "Push Harder": {
    name: "Steel Forge",
    model: "gorilla",
    colorTheme: "winamp41",
    vizMode: "grid",
    vizParams: {
      amplitude: 1.8,
      speed: 1.4,
      audioReactivity: 0.95,
      zoom: 0.32,
      smoothing: 0.08
    },
    spotlightColor: 0x6688aa,
    trackColors: {
      floorPrimary: 0x101418,
      floorSecondary: 0x181c22,
      wallBase: 0x2a3038,
      wallAccent: 0x88aacc,
      obstacle: 0x4488bb,
      boostPad: 0xffaa44,
      centerMarker: 0x6699bb,
      fogColor: 0x080a0c,
      fogNear: 25,
      fogFar: 160,
      ambientLight: 0x151a20,
      ambientIntensity: 0.3
    },
    visualStyle: {
      wallStyle: "solid",
      floorPattern: "grid",
      glowIntensity: 0.6,
      particleType: "sparks",
      particleDensity: 0.8,
      pulseWithBeat: true,
      skyGradient: [0x050608, 0x101520],
      backgroundEffect: {
        type: "forge",
        color1: 0x050608,
        color2: 0x101520,
        color3: 0x2a3038,
        accent: 0xffaa44,
        speed: 1.0,
        intensity: 0.7,
        scale: 1.0
      },
      terrain: {
        enabled: true,
        scale: 0.015,
        octaves: 4,
        persistence: 0.35,
        amplitude: 8.0,
        baseHeight: -2.5,
        ridged: true,
        terraced: 8,
        colorByHeight: true,
        lowColor: 0x1a1e22,
        midColor: 0x2a3038,
        highColor: 0x4a5560,
        peakColor: 0x8899aa
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // THE LAST DRAGON - Epic, mythical, frozen realm
  // Model: Ice Dragon - ancient frost wyrm emerging from legend
  // Colors: Glacial blues, aurora teals, frozen mist, crystalline ice
  // ═══════════════════════════════════════════════════════════════
  "The Last Dragon": {
    name: "Frozen Throne",
    model: "icy-dragon",
    colorTheme: "midnight",
    vizMode: "nebula",
    vizParams: {
      amplitude: 1.2,
      speed: 0.6,
      audioReactivity: 0.7,
      zoom: 0.08,
      smoothing: 0.6
    },
    spotlightColor: 0x88ddff,
    trackColors: {
      floorPrimary: 0x0a1520,
      floorSecondary: 0x0f2030,
      wallBase: 0x1a3050,
      wallAccent: 0x44ddff,
      obstacle: 0x00ffff,
      boostPad: 0xaaeeff,
      centerMarker: 0x66ccff,
      fogColor: 0x081018,
      fogNear: 20,
      fogFar: 180,
      ambientLight: 0x102030,
      ambientIntensity: 0.4
    },
    visualStyle: {
      wallStyle: "glass",
      floorPattern: "hexagon",
      glowIntensity: 0.6,
      particleType: "snow",
      particleDensity: 0.7,
      pulseWithBeat: true,
      skyGradient: [0x000510, 0x102040],
      backgroundEffect: {
        type: "aurora",
        color1: 0x000510,
        color2: 0x081830,
        color3: 0x44ddff,
        accent: 0x88eeff,
        speed: 0.6,
        intensity: 0.7,
        scale: 1.0
      },
      terrain: {
        enabled: true,
        scale: 0.008,
        octaves: 6,
        persistence: 0.5,
        amplitude: 18.0,
        baseHeight: -5.0,
        ridged: true,
        terraced: 6,
        colorByHeight: true,
        lowColor: 0x1a2a3a,
        midColor: 0x3a5a7a,
        highColor: 0x6a9aba,
        peakColor: 0xddeeff
      }
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
      skyGradient: [0x010401, 0x081008],
      backgroundEffect: {
        type: "matrix",
        color1: 0x010401,
        color2: 0x041008,
        color3: 0x082010,
        accent: 0x00ff00,
        speed: 1.0,
        intensity: 0.8,
        scale: 1.2
      },
      terrain: {
        enabled: true,
        scale: 0.025,
        octaves: 4,
        persistence: 0.4,
        amplitude: 4.0,
        baseHeight: -1.5,
        ridged: false,
        wireframe: true,
        colorByHeight: true,
        lowColor: 0x081008,
        midColor: 0x0a200a,
        highColor: 0x103010,
        peakColor: 0x00ff00
      }
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
    skyGradient: [0x000005, 0x000010],
    backgroundEffect: {
      type: "topo",
      color1: 0x000005,
      color2: 0x000010,
      color3: 0x1a1a2e,
      accent: 0xff00ff,
      speed: 0.8,
      intensity: 0.5,
      scale: 1.0
    },
    terrain: {
      enabled: true,
      scale: 0.02,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      amplitude: 6.0,
      baseHeight: -2.0,
      ridged: false,
      terraced: 0,
      colorByHeight: true,
      lowColor: 0x1a1a2e,
      midColor: 0x2d2d4a,
      highColor: 0x4a4a6a,
      peakColor: 0x8888aa,
      collisionMargin: 1.5
    }
  }
};
