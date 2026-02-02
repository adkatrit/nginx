/*
  3D MODELS CONFIGURATION
  -----------------------
  Add your downloaded GLTF/GLB models from Sketchfab here.

  Properties:
  - id: Unique identifier for the model
  - name: Display name shown in the selector
  - url: Path to the .gltf or .glb file
  - scale: Scale multiplier
  - position: [x, y, z] position offset
  - rotation: [x, y, z] rotation in radians
  - animationSpeed: Base animation speed multiplier
*/

window.MODELS = [
  // === OCEAN CREATURES ===
  {
    id: "blue-whale",
    name: "Blue Whale",
    url: "./models/blue-whale/scene.gltf",
    scale: 0.01,
    position: [0, 0.3, 0],
    rotation: [0, 4.538, 0],
    animationSpeed: 1.0
  },
  {
    id: "jellyfish",
    name: "Jellyfish",
    url: "./models/jellyfish/scene.gltf",
    scale: 2.0,
    position: [0, 0.5, 0],
    rotation: [0, 0, 0],
    animationSpeed: 0.6
  },
  {
    id: "loggerhead",
    name: "Loggerhead Turtle",
    url: "./models/loggerhead/scene.gltf",
    scale: 0.1,
    position: [0, -0.5, 0],
    rotation: [0, 1.571, 0],
    animationSpeed: 1.0
  },

  // === FLYING CREATURES ===
  {
    id: "butterfly",
    name: "Butterfly",
    url: "./models/butterfly/scene.gltf",
    scale: 7.0,
    position: [0, 0, 0],
    rotation: [0, 4.8, 0],
    animationSpeed: 1.1
  },
  {
    id: "white-eagle",
    name: "White Eagle",
    url: "./models/white-eagle/scene.gltf",
    scale: 0.1,
    position: [0, 1.2, 0],
    rotation: [0, 3.14, 0],
    animationSpeed: 1.2
  },
  {
    id: "icy-dragon",
    name: "Ice Dragon",
    url: "./models/icy_dragon/scene.gltf",
    scale: 0.08,
    position: [0, 0, 0],
    rotation: [0, 3.14, 0],
    animationSpeed: 0.8
  },

  // === POWERFUL BEASTS ===
  {
    id: "godzilla",
    name: "Godzilla",
    url: "./models/godzilla/scene.gltf",
    scale: 0.05,
    position: [0, -1.5, 0],
    rotation: [0, 3.14, 0],
    animationSpeed: 0.9
  },
  {
    id: "gorilla",
    name: "Gorilla",
    url: "./models/gorilla/scene.gltf",
    scale: 1.5,
    position: [0, -1.2, 0],
    rotation: [0, 3.14, 0],
    animationSpeed: 1.0
  },

  // === TECH / ROBOTS ===
  {
    id: "biped-robot",
    name: "Biped Robot",
    url: "./models/biped_robot/scene.gltf",
    scale: 0.12,
    position: [0, -1.5, 0],
    rotation: [0, 3.14, 0],
    animationSpeed: 1.0
  },
];
