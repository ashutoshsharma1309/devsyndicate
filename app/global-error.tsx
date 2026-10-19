"use client";

import "./globals.css";
import { site } from "@/lib/site";

/**
 * Last-resort boundary for failures in the root layout itself. It replaces
 * the whole document, so it depends on nothing but globals.css and lib/site.
 * Inline colours keep it readable even if the stylesheet fails to load.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: "100dvh", background: "#0a0b0d", color: "#fff" }}>
        <title>Something went wrong | Dev Syndicate</title>
        <main className="container-x flex min-h-dvh flex-col justify-center py-20" style={{ fontFamily: "system-ui, sans-serif" }}>
          <p className="t-eyebrow text-signal-soft">{site.name}</p>
          <h1 className="t-h2 mt-6 max-w-[18ch]">Something went wrong.</h1>
          <p className="t-body mt-5 max-w-xl text-white/70">
            Please try again. If it keeps happening, call{" "}
            <a href={site.primaryContact.phone.href} style={{ color: "#fff" }}>
              {site.primaryContact.phone.display}
            </a>{" "}
            or email{" "}
            <a href={`mailto:${site.email}`} style={{ color: "#fff" }}>
              {site.email}
            </a>
            .
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => retry()}
              className="h-11 rounded-sm bg-signal px-5 text-[0.9375rem] font-medium text-white hover:bg-signal-deep"
            >
              Try again
            </button>
          </div>
          {error.digest && <p className="mt-8 font-mono text-[0.8125rem] text-mute-dark">Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
