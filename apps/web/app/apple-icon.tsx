import { ImageResponse } from "next/og";

/**
 * Apple touch icon (180×180 PNG). iOS Safari doesn't honour SVG icons, so
 * the SVG master in `app/icon.svg` is mirrored here as a dynamically-
 * rendered PNG via next/og — same lowercase «r» in Wappenrot on warm paper,
 * no Regensdorf-Wappen (Markenrecht). Bundled with Next 16; no new dep
 * (Phase 6 hard-stop #4 cleared).
 */

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Tokens hard-copied from app/globals.css :root — ImageResponse cannot read
// CSS variables; this is the documented asset-generation exception.
const PAPER = "#faf8f4";
const ACCENT = "#982f2c";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: PAPER,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 132,
          fontWeight: 600,
          color: ACCENT,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginTop: -8,
        }}
      >
        r
      </div>
    </div>,
    { ...size },
  );
}
