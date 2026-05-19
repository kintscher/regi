import type { MetadataRoute } from "next";

/**
 * Web app manifest (PWA basis). Minimal: lets the site be installed to the
 * home screen on mobile as «regi» with the warm-paper theme colour. No
 * offline service-worker; this is just the install metadata. Background and
 * theme colour are both --paper (`#faf8f4`) so the install splash is the
 * same calm surface as the site itself.
 */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "regi — Aggregator für Regensdorf ZH",
    short_name: "regi",
    description:
      "Digitales Gemeindeblatt für Regensdorf ZH. Wetter, Abfahrten, Abfall, amtliche Mitteilungen — automatisiert aus öffentlichen Schweizer Datenquellen.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#faf8f4",
    lang: "de-CH",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
