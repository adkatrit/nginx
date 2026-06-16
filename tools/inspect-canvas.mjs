#!/usr/bin/env node
/**
 * inspect-canvas.mjs — headless screenshot of the running visualizer.
 *
 * Lets an agent (or you) SEE the WebGL/WebGPU scene without a manual
 * screenshot. Launches headless Chromium via Playwright, autoplays a track,
 * waits, optionally seeks/hides the UI, and writes a PNG.
 *
 * WebGPU does not composite into headless screenshots, so by default we force
 * the app's WebGL fallback (same TSL shaders → visually representative).
 *
 * Prereqs (already present in the Claude web env; install locally if needed):
 *   npm i -g playwright && npx playwright install chromium
 *   python3 serve.py        # serve site/ at http://127.0.0.1:8000
 *
 * Usage:
 *   node tools/inspect-canvas.mjs --track data-tide --seek 90 --hide-ui --out /tmp/ocean.png
 *
 * Flags:
 *   --url <url>      full URL (overrides --track)
 *   --track <slug>   track hash to load + autoplay (default: data-tide)
 *   --out <path>     PNG output (default: /tmp/canvas.png)
 *   --seek <sec>     jump playback to this time before capturing
 *   --wait <ms>      settle time after load (default: 14000)
 *   --hide-ui        hide HUD/lyrics/controls for a clean scene view
 *   --webgpu         allow WebGPU (usually captures black headless; default forces WebGL)
 *   --size <WxH>     viewport (default: 900x506)
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
function loadChromium() {
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
    try { return require(p).chromium; } catch {}
  }
  throw new Error('playwright not found — npm i -g playwright && npx playwright install chromium');
}
const chromium = loadChromium();

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const track = arg('track', 'data-tide');
const url = arg('url', `http://127.0.0.1:8000/#${track}`);
const out = arg('out', '/tmp/canvas.png');
const seek = Number(arg('seek', 0));
const wait = Number(arg('wait', 14000));
const hideUi = !!arg('hide-ui', false);
const allowWebgpu = !!arg('webgpu', false);
const [vw, vh] = String(arg('size', '900x506')).split('x').map(Number);

const browser = await chromium.launch({
  args: [
    '--autoplay-policy=no-user-gesture-required',
    '--enable-unsafe-webgpu', '--enable-features=Vulkan',
    '--use-angle=swiftshader', '--use-gl=angle',
    '--ignore-certificate-errors', '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push('[c] ' + m.text().slice(0, 200)));
page.on('pageerror', (e) => logs.push('[E] ' + e.message.slice(0, 200)));

// Force WebGL unless --webgpu (WebGPU renders but won't composite into a screenshot)
if (!allowWebgpu) {
  await page.addInitScript(() => {
    try { Object.defineProperty(navigator, 'gpu', { get: () => undefined }); } catch {}
  });
}

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
// Start playback with a real click (counts as the audio user-gesture).
try { await page.click('#playPauseBtn', { timeout: 4000 }); } catch {}
try { await page.mouse.click(vw / 2, vh / 2); } catch {}
// If still not playing after a beat, click play again
await page.waitForTimeout(2500);
try {
  const playing = await page.evaluate(() => !!(window.currentStemPlayer && window.currentStemPlayer.isPlaying));
  if (!playing) await page.click('#playPauseBtn', { timeout: 3000 }).catch(() => {});
} catch {}
await page.waitForTimeout(wait);

if (seek > 0) {
  await page.evaluate((t) => {
    const sp = window.currentStemPlayer;
    if (sp && sp.seek) sp.seek(t);
    const a = document.getElementById('playerAudio');
    if (a && a.duration) a.currentTime = t;
  }, seek);
  await page.waitForTimeout(2500);
}

if (hideUi) {
  await page.evaluate(() => {
    for (const sel of ['#scoreHud', '#lyricsOverlay', '.player', '#hitFeedback',
      '.controls-hint', '#stemDebugPanel', '.transport', 'footer']) {
      document.querySelectorAll(sel).forEach((el) => (el.style.display = 'none'));
    }
  });
  await page.waitForTimeout(300);
}

const diag = await page.evaluate(() => {
  const c = document.querySelector('canvas#bgViz') || document.querySelector('canvas');
  return { gpu: !!navigator.gpu, canvas: c ? { w: c.width, h: c.height } : null };
});
console.log('DIAG ' + JSON.stringify(diag));
console.log(logs.slice(-12).join('\n'));

try {
  await page.locator('canvas#bgViz').screenshot({ path: out, timeout: 90000 });
  console.log('SHOT ' + out);
} catch (e) {
  await page.screenshot({ path: out, timeout: 90000, animations: 'disabled' });
  console.log('SHOT(page) ' + out);
}
await browser.close();
