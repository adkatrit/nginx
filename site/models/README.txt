3D MODELS FOLDER
================

How to add models from Sketchfab:

1. Go to https://sketchfab.com/3d-models?features=downloadable+animated&sort_by=-likeCount
2. Find a model you like (look for "Download" button, preferably animated ones)
3. Click Download and choose "glTF" format (Original or Autoconverted)
4. Extract the downloaded zip file into this folder as a subfolder
   Example: ./models/dancing-robot/

5. Edit ../models.js and add an entry like:
   {
     id: "dancing-robot",
     name: "Dancing Robot",
     url: "./models/dancing-robot/scene.gltf",
     scale: 0.5,
     position: [0, -1, 0]
   }

6. Refresh the music player and select your model from the Visualizer settings!

Model Properties:
- id: Unique identifier (no spaces)
- name: Display name shown in dropdown
- url: Path to .gltf or .glb file
- scale: Size multiplier (default: 1) - smaller models may need 2-5, larger need 0.1-0.5
- position: [x, y, z] offset (default: [0, 0, 0]) - use negative Y to lower the model
- rotation: [x, y, z] in radians (default: [0, 0, 0])
- animationSpeed: Base animation speed (default: 1)
- noAutoRotate: Set to true to disable auto-rotation
- noScalePulse: Set to true to disable bass-reactive scaling

Tips:
- Models with animations work best (the animation syncs to the beat!)
- Start with scale: 1 and adjust based on how the model appears
- Most Sketchfab models have scene.gltf as the main file
- Keep the original folder structure intact (textures need their relative paths)
- Check the license! Many require attribution (CC-BY)
