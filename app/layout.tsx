import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Site-wide defaults only. Each public page sets its own canonical URL,
// title and social tags through pageMetadata() (lib/seo.ts), so nothing here
// may point at a specific page — a default canonical would leak to every route.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
  // Search Console / Bing Webmaster Tools HTML-tag verification. Set the tokens in
  // the environment; nothing is rendered until they exist.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
};

const motionBootstrap =
  "var d=document.documentElement;d.classList.add('js');" +
  "try{if(localStorage.getItem('ds-motion')==='paused')d.dataset.motion='paused'}catch(e){}";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS as available so scroll-reveal styles only apply when they can be undone, and
            applies a saved "pause animations" choice (components/ui/motion-toggle.tsx) before first
            paint so the loops never flash on. */}
        <script dangerouslySetInnerHTML={{ __html: motionBootstrap }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
