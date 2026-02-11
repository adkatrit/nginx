# SEO & Visibility — Code from Dream (jrod.dev)

> Last updated: 2026-02-08
> Domain: **jrod.dev** | Artist: **DeytaDreams** | Project: **Code from Dream** | Hosting: Railway (Docker/nginx)

---

## Current SEO Infrastructure

### Meta Tags (`site/index.html`)
| Tag | Value |
|-----|-------|
| `<title>` | Code from Dream \| DeytaDreams — Stem-Reactive 3D Worlds |
| `meta description` | Original music split into living pieces. Drums carve terrain, bass floods oceans, vocals paint atmosphere. Nine tracks asking what stays human when everything becomes signal. |
| `meta keywords` | DeytaDreams, Code from Dream, audio visualization, music visualizer, 3D music, stem player, WebAudio, Three.js, immersive music, audio reactive, stem mixer, reggae electronic |
| `meta author` | DeytaDreams |
| `meta robots` | index, follow |
| `link canonical` | https://jrod.dev/ |

### Open Graph (Social Sharing)
| Property | Value |
|----------|-------|
| `og:type` | website |
| `og:title` | Code from Dream — DeytaDreams |
| `og:description` | Reggae-infused electronic music pulled apart into stems and fed to a 3D world that listens back. Each instrument reshapes the landscape. What stays human when everything becomes signal? |
| `og:image` | https://jrod.dev/og-image.png (1200×630) |
| `og:site_name` | Code from Dream |

### Twitter Card
- Card type: `summary_large_image`
- Title, description, and image all configured

### Structured Data (JSON-LD)
Two schemas embedded in `index.html`:

1. **WebApplication** — Describes the app itself (name, description, category, author, free pricing)
2. **MusicGroup** — Describes DeytaDreams with 5 MusicRecording entries:
   - Terms & Conditions
   - Data Tide
   - Signal Integrity
   - Trade You My Hands
   - Turn Your Phone Face Down

### Crawl Configuration
| File | Purpose |
|------|---------|
| `site/robots.txt` | Allows `/`, blocks `/_archive/`, `/models/`, audio stems (`*.mp3/*.mid/*.wav`), `stems-raw/` |
| `site/sitemap.xml` | 4 URLs: `/` (1.0), `/architecture.html` (0.6), `/docs/audio-reactivity.html` (0.6), `/sandbox.html` (0.4) |
| `site/site.webmanifest` | PWA manifest — "Code from Dream — DeytaDreams", standalone display, dark theme |

### Server Headers (`nginx.conf`)
| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | nosniff |
| `X-Frame-Options` | SAMEORIGIN |
| `Referrer-Policy` | strict-origin-when-cross-origin |
| `Permissions-Policy` | camera=(), microphone=(), geolocation=() |
| `X-Robots-Tag` | index, follow |

### Secondary Pages
Both `architecture.html` and `docs/audio-reactivity.html` have:
- Unique `<title>` tags
- Meta descriptions tailored to their content
- Canonical URLs
- `robots: index, follow`

### Analytics
- **Google Analytics**: GA4 property `G-NRQ96GQ70K` on `index.html`
- Not yet on secondary pages (architecture, audio-reactivity, sandbox)

---

## Assets

| Asset | Path | Dimensions | Purpose |
|-------|------|------------|---------|
| OG Image | `site/og-image.png` | 1200×630 | Social sharing preview |
| Favicon SVG | `site/favicon.svg` | 64×64 | Browser tab, bookmarks |
| Favicon ICO | `site/favicon.ico` | 48×48 | Legacy browser support |

---

## SEO Audit Checklist

### Implemented
- [x] Branded `<title>` tag with keywords
- [x] Meta description (under 160 chars)
- [x] Canonical URL
- [x] Open Graph tags (type, title, description, image, site_name, locale)
- [x] Twitter Card (summary_large_image)
- [x] JSON-LD structured data (WebApplication + MusicGroup)
- [x] robots.txt with sitemap reference
- [x] XML sitemap
- [x] PWA web manifest
- [x] Security headers
- [x] Gzip compression
- [x] Static asset caching (1 year, immutable)
- [x] Rich noscript fallback for crawlers
- [x] `lang="en"` on `<html>`
- [x] ARIA labels and roles throughout UI
- [x] Proper heading hierarchy in noscript content

- [x] GA4 on all pages (index, architecture, audio-reactivity, sandbox)
- [x] Per-track deep-linkable URLs (hash routing with `hashchange` listener)
- [x] Content Security Policy header

### Not Yet Implemented
- [ ] Google Search Console verification & sitemap submission
- [ ] Bing Webmaster Tools submission
- [ ] Per-track OG tags (requires server-side or prerendering)
- [ ] Apple Touch Icon as proper 180×180 PNG (currently SVG)
- [ ] Prerendering service for non-JS crawlers
- [ ] RSS feed for new track releases

---

## Target Keywords

### Primary (artist/brand)
- DeytaDreams
- Code from Dream
- jrod.dev

### Secondary (what it does)
- audio visualization
- 3D music visualizer
- stem player
- audio reactive
- immersive music experience
- stem mixer
- reggae electronic

### Long-tail (technical/portfolio)
- Three.js audio visualization
- WebAudio API stem separation
- MIDI-driven visual effects
- procedural 3D terrain music

### Track names (long-tail discovery)
- "Terms and Conditions" DeytaDreams
- "Data Tide" DeytaDreams
- "Signal Integrity" DeytaDreams
- "Trade You My Hands" DeytaDreams
- "Turn Your Phone Face Down" DeytaDreams

---

## Social Sharing Previews

When shared on Discord, Twitter, LinkedIn, Facebook, iMessage:

```
┌─────────────────────────────────────────┐
│ [og-image.png — 1200×630]              │
│  Equalizer bars + "Code from Dream"    │
│  "DEYTADREAMS" + stem pills            │
├─────────────────────────────────────────┤
│ Code from Dream — DeytaDreams           │
│ Reggae-infused electronic music pulled  │
│ apart into stems and fed to a 3D world  │
│ that listens back...                    │
│ jrod.dev                                │
└─────────────────────────────────────────┘
```

---

## Monitoring & Validation

| Tool | URL | What to check |
|------|-----|---------------|
| Google Rich Results | search.google.com/test/rich-results | JSON-LD parses correctly |
| Facebook Debugger | developers.facebook.com/tools/debug/ | OG image, title, description |
| Twitter Card Validator | Share a link | summary_large_image renders |
| Lighthouse | Chrome DevTools > Lighthouse | SEO audit score |
| Google Search Console | search.google.com/search-console | Index coverage, sitemap status |
| Bing Webmaster Tools | bing.com/webmasters | Crawl status, sitemap |

---

## Interactive Dashboard

An interactive SEO & Marketing orchestrator (local dev tool, not public):

```
python serve.py → http://localhost:8000/seo-dashboard.html
```

Blocked from crawlers via `noindex` meta tag and `robots.txt` Disallow rule.

Features:
- Live SEO audit with scoring
- Social preview simulator
- Structured data validator
- Crawl configuration viewer
- Analytics integration (GA4 property data)
- Track catalog with keyword mapping
- Marketing action items with priority ranking
