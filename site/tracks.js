/**
 * Track list - DeytaDreams catalog
 *
 * Each track uses stemsManifest to point to its manifest.json
 * which contains stem audio files, MIDI data, and lyrics.
 */

window.TRACKS = [
  {
    title: "Terms & Conditions",
    artist: "DeytaDreams",
    url: null,
    stemsManifest: "./tracks/terms-and-conditions/manifest.json"
  },
  {
    title: "Data Tide",
    artist: "DeytaDreams",
    url: null,
    stemsManifest: "./tracks/data-tide/manifest.json"
  },
  {
    title: "Signal Integrity",
    artist: "DeytaDreams",
    url: null,
    stemsManifest: "./tracks/signal-integrity/manifest.json"
  },
  {
    title: "Trade You My Hands",
    artist: "DeytaDreams",
    url: null,
    stemsManifest: "./tracks/trade-you-my-hands/manifest.json"
  },
  {
    title: "Turn Your Phone Face Down",
    artist: "DeytaDreams",
    url: null,
    stemsManifest: "./tracks/turn-your-phone-face-down/manifest.json"
  },
  {
    title: "Test",
    artist: "DeytaDreams",
    url: null,
    stemsManifest: "./tracks/test/manifest.json",
    hidden: true
  },
  // --- Tracks without stems (mix only) - disabled for now ---
  // { title: "Soft Systems", artist: "DeytaDreams", stemsManifest: "./tracks/soft-systems/manifest.json" },
  // { title: "The Last Dragon", artist: "DeytaDreams", stemsManifest: "./tracks/the-last-dragon/manifest.json" },
  // { title: "Dreams Bleed Into Dashboards", artist: "DeytaDreams", stemsManifest: "./tracks/dreams-bleed-into-dashboards/manifest.json" },
];
