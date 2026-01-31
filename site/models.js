/*
  3D MODELS CONFIGURATION
  -----------------------
  Add your downloaded GLTF/GLB models from Sketchfab here.

  How to add models:
  1. Download a model from https://sketchfab.com (choose GLTF format)
  2. Extract the zip to ./models/<model-name>/
  3. Add an entry below with the path to the .gltf or .glb file

  Properties:
  - id: Unique identifier for the model
  - name: Display name shown in the selector
  - url: Path to the .gltf or .glb file
  - scale: Optional scale multiplier (default: 1)
  - position: Optional [x, y, z] position offset (default: [0, 0, 0])
  - rotation: Optional [x, y, z] rotation in radians (default: [0, 0, 0])
  - animationSpeed: Optional base animation speed multiplier (default: 1)

  Attribution:
  Many Sketchfab models require attribution under Creative Commons.
  Keep the attribution info in a README in each model's folder.
*/

window.MODELS = [
  {
    id: "blue-whale",
    name: "Blue Whale",
    url: "./models/blue-whale/scene.gltf",
    scale: 0.01,
    position: [0, 0.30, 0],
    rotation: [0, 4.538, 0],
    animationSpeed: 1.00
  },
  {
    id: "butterfly",
    name: "Butterfly",
    url: "./models/butterfly/scene.gltf",
    scale: 7.00,
    position: [0, 0.00, 0],
    rotation: [0, 4.800, 0],
    animationSpeed: 1.10
  },
  {
    id: "loggerhead",
    name: "Loggerhead Turtle",
    url: "./models/loggerhead/scene.gltf",
    scale: 0.10,
    position: [0, -0.50, 0],
    rotation: [0, 1.571, 0],
    animationSpeed: 1.00
  },
  {
    id: "white-eagle",
    name: "White Eagle",
    url: "./models/white-eagle/scene.gltf",
    scale: 0.10,
    position: [0, 1.20, 0],
    rotation: [0, 3.140, 0],
    animationSpeed: 1.20
  },
];
