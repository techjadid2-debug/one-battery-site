import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: "ONE CORE — Two robots. One core.",
    description: "A cinematic web puzzle-platformer about two robots sharing one energy core inside a collapsing orbital nuclear facility.",
    icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
    openGraph: {
      title: "ONE CORE",
      description: "Two robots. One core. No one gets left behind.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Piko and Atlas share the ONE CORE" }],
    },
    twitter: { card: "summary_large_image", title: "ONE CORE", description: "Two robots. One core. No one gets left behind.", images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Runs before first paint: (1) add `js` so scroll-reveal is opt-in and the page is
  // fully visible without JS; (2) set <html lang> from the stored preference so screen
  // readers and the first paint match the visitor's language (reduces the uz→en flash).
  const bootScript = `document.documentElement.classList.add('js');try{var l=localStorage.getItem('one-core-site-locale-v1');if(l==='en'||l==='uz'){document.documentElement.lang=l;}}catch(e){}`;
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <link rel="preload" href="/fonts/ibm-plex-mono-700-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/ibm-plex-mono-400-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/inter-400-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
