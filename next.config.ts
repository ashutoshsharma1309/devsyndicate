import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Everything is self-hosted (next/font inlines Google Fonts at build time), so
 * the policy is 'self' plus what Next.js itself needs:
 * - 'unsafe-inline' scripts: Next's inline bootstrap/RSC payload, the `js` class
 *   script in app/layout.tsx and JSON-LD. A nonce would make every page dynamic.
 * - 'unsafe-eval' and ws: only in development (React debugging and HMR).
 * When an analytics provider is enabled, add its script and collection domains
 * to script-src and connect-src (and img-src if it uses a pixel) here.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Only where the site is always served over HTTPS (Vercel sets VERCEL=1 at build time). A local or
  // LAN `next start` over plain HTTP would otherwise have every script and style upgraded to https.
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: csp },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** URLs from the previous devsyndicate.co.in site, so old links and search results don't 404. */
const legacyRedirects: [source: string, destination: string][] = [
  ["/faq", "/#faq"],
  ["/hackathons", "/services"],
  ["/coding-events", "/services"],
  ["/workshops", "/services"],
  ["/features", "/services"],
  ["/tech-stack", "/services"],
  ["/success-stories", "/about"],
  ["/blog", "/"],
  ["/resources", "/"],
  ["/profile", "/"],
  ["/event/:id", "/"],
  ["/cookies", "/privacy"],
  ["/cancellations", "/terms"],
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pin the workspace root (a stray lockfile in the home directory confuses inference).
  turbopack: { root: __dirname },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return legacyRedirects.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
