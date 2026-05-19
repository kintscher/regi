import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SITE_URL is optional; falls back to a placeholder so Metadata.metadataBase
// is always set (Next emits a warning otherwise). The real URL is supplied
// by the deployment environment (Vercel/Cloudflare/Neon-pinned).
const siteUrl = process.env.SITE_URL ?? "https://regi.ch";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "regi — Aggregator für Regensdorf ZH",
    template: "%s · regi",
  },
  description:
    "Digitales Gemeindeblatt für Regensdorf ZH. Wetter, Abfahrten, Abfall, amtliche Mitteilungen — automatisiert aus öffentlichen Schweizer Datenquellen.",
  applicationName: "regi",
  openGraph: {
    type: "website",
    siteName: "regi",
    locale: "de_CH",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Viewport is its own export in Next 14+; theme-color matches --paper so the
// browser chrome (Android URL bar, PWA splash) sits flush with the page.
export const viewport: Viewport = {
  themeColor: "#faf8f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de-CH" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
