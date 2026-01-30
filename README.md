# MySongs Player (static music player + visualizer)

This is a **100% static** website (HTML/CSS/JS) with a working audio player + playlist and multiple visualizer modes (including a Three.js background visualizer).

## Add your audio (hosted/static)

1. Put audio files into the `music/` folder (MP3 recommended).
2. Edit `tracks.js` and add entries like:

```js
window.TRACKS = [
  { title: "My Song", artist: "My Band", url: "./music/my-song.mp3", coverUrl: "./music/my-song.jpg" },
];
```

### Auto-generate `tracks.js` (optional)

If you have lots of audio files, you can generate `tracks.js` automatically:

```powershell
.\generate-tracks.ps1
```

Or from **WSL/Linux/macOS**:

```bash
python3 ./generate-tracks.py
```

File naming tip: `Artist - Title.mp3` (or `.wav`, `.flac`, etc) will be split into artist/title automatically.

## Visualizer + theme

- Use the **Visualizer** dropdown to switch between multiple background visualizations (Orbit Bars, Wave Grid, Particle Nebula, Oscilloscope Ring, Tunnel, Off).
- Use the **Theme** dropdown to switch look-and-feel (default is **Midnight**).

## Run it locally

Modern browsers often block or behave weirdly with audio when opening `index.html` directly via `file://`.
Use a tiny local web server instead.

### Option A: Python (recommended)

From this folder:

```bash
# Windows (PowerShell)
python ./serve.py

# WSL/Linux/macOS
python3 ./serve.py
```

Then open `http://localhost:8000`.

### Run it from WSL (your preference)

If this project lives on your Windows drive (like your current workspace), from WSL:

```bash
cd /mnt/c/Users/jarro/mysongs
python3 ./serve.py
```

Then open `http://localhost:8000` in Windows. (You can also run `explorer.exe http://localhost:8000` from WSL.)

#### Why `serve.py`?

- It suppresses harmless `ConnectionResetError` / `BrokenPipeError` tracebacks.
- It supports HTTP **Range requests**, which browsers need for reliable **seeking/scrubbing** in large audio files.

### Option B: Node

```bash
npx serve
```

## Runtime playlist

You can also:
- Click **ADD** to pick files from your computer
- Drag and drop audio files into the playlist window

Those “local” tracks aren’t uploaded anywhere (they’re loaded in-memory by your browser).
