# MySongs Player (static music player + visualizer)

This is a **100% static** website (HTML/CSS/JS) with a working audio player + playlist and multiple visualizer modes (including a Three.js background visualizer).

## Add your audio (hosted/static)

1. Put audio files into the `site/music/` folder (MP3 recommended).
2. Edit `site/tracks.js` and add entries like:

```js
window.TRACKS = [
  { title: "My Song", artist: "My Band", url: "./music/my-song.mp3", coverUrl: "./music/my-song.jpg" },
];
```

## Guide: add a new track (recommended workflow)

This site is served from `nginx/site/`. That means:
- Your audio lives in `nginx/site/music/`
- The playlist file is `nginx/site/tracks.js`

### 1) Add the audio file

Copy your audio file into `nginx/site/music/` (any subfolders are fine), for example:

- `nginx/site/music/My Artist/My Track.mp3`

Tip: if you name files like `Artist - Title.mp3`, the generator will split artist/title automatically.

### 2) Add cover art (optional, but recommended)

Put an image in the **same folder** as the audio file. Supported: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.

The generator prefers filenames that look like cover art:
- Best: `cover.*`, `front.*`, `album.*`, `art.*`
- Next: `image*`, `thumb*`, `large*`

Example:
- `nginx/site/music/My Artist/cover.jpg`

### 3) Re-generate `tracks.js`

From the repo root:

```powershell
cd .\nginx\site
..\generate-tracks.ps1 -MusicDir .\music -OutFile .\tracks.js
```

Or from WSL/Linux/macOS:

```bash
cd ./nginx/site
python3 ../generate-tracks.py --music-dir ./music --out-file ./tracks.js
```

Manual alternative (skip regeneration): edit `nginx/site/tracks.js` and add a new entry with `url` (and optional `coverUrl`) that points at your files.

### 4) Run locally and verify

From the repo root:

```powershell
python .\serve.py
```

Then open `http://localhost:8000` and confirm the new track + image show up.

## Suno.ai export → one-command import (Windows)

Suno doesn’t provide a “push to your repo” button, but you can make export/import fast:

1. In Suno, download/export your song (audio file, or a zip if you have one).
2. Run this from the repo root:

```powershell
# Import an audio file (and optional cover image in the same folder)
.\import-suno.ps1 "C:\Path\To\Downloads\My Song.mp3" -Artist "DeytaDreams"

# Import a zip (the script will extract, pick the newest audio, and an image if present)
.\import-suno.ps1 "C:\Path\To\Downloads\suno-export.zip" -Artist "DeytaDreams"
```

What it does:
- Copies the audio into `nginx/site/music/<Artist>/<Title>/`
- Copies the “best” image it finds into that same folder as `cover.*` (optional)
- Re-generates `nginx/site/tracks.js` so it shows up immediately

### Auto-generate `tracks.js` (optional)

If you have lots of audio files, you can generate `tracks.js` automatically:

```powershell
.\generate-tracks.ps1 -MusicDir .\site\music -OutFile .\site\tracks.js
```

Or from **WSL/Linux/macOS**:

```bash
python3 ./generate-tracks.py --music-dir ./site/music --out-file ./site/tracks.js
```

File naming tip: `Artist - Title.mp3` (or `.wav`, `.flac`, etc) will be split into artist/title automatically.

## Visualizer + theme

- Use the **Visualizer** dropdown to switch between multiple background visualizations (Orbit Bars, Wave Grid, Particle Nebula, Oscilloscope Ring, Tunnel, Off).
- Use the **Theme** dropdown to switch look-and-feel (default is **Midnight**).

## Run it locally

Modern browsers often block or behave weirdly with audio when opening `index.html` directly via `file://`.
Use a tiny local web server instead.

### Option A: Python (recommended)

From the repo root:

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
cd ./nginx/site
npx serve
```

## Runtime playlist

You can also:
- Click **ADD** to pick files from your computer
- Drag and drop audio files into the playlist window

Those “local” tracks aren’t uploaded anywhere (they’re loaded in-memory by your browser).
