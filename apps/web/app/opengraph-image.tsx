import { ImageResponse } from "next/og";

/**
 * Default Open Graph image (1200×630). Composed in the same gazette grammar
 * as the site: warm paper background, the wordmark in --ink (the largest
 * element on the surface, like the H1 on each page), a single Wappenrot
 * hairline accent (the system's only place a coloured horizontal rule
 * appears — used here as a brand-mark device, not page chrome), and a
 * terse Hochdeutsch tagline. regi.ch in the .tag voice at the foot.
 *
 * Per-route OG: each public route can override with its own
 * `app/(public)/<route>/opengraph-image.tsx`. v1 ships the default only.
 */

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "regi — alles Wichtige aus deiner Gemeinde Regensdorf";

// Tokens copied from app/globals.css :root (asset-generation exception —
// ImageResponse cannot read CSS variables at request time).
const PAPER = "#faf8f4";
const INK = "#1a1714";
const INK_MUTED = "#44403a";
const INK_META = "#736a5f";
const ACCENT = "#982f2c";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: PAPER,
        display: "flex",
        flexDirection: "column",
        padding: "96px 112px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 240,
          fontWeight: 600,
          color: INK,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        regi
      </div>
      <div
        style={{
          width: 112,
          height: 2,
          background: ACCENT,
          marginTop: 32,
          marginBottom: 32,
        }}
      />
      <div
        style={{
          fontSize: 38,
          color: INK_MUTED,
          lineHeight: 1.35,
          maxWidth: 880,
          letterSpacing: "-0.005em",
        }}
      >
        Alles Wichtige aus deiner Gemeinde Regensdorf — Wetter, Abfahrten, Abfall, Veranstaltungen
        und amtliche Mitteilungen, automatisiert aus öffentlichen Datenquellen.
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          fontSize: 26,
          color: INK_META,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        regi.ch
      </div>
    </div>,
    { ...size },
  );
}
