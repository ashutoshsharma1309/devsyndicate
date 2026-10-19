"use client";

/**
 * The (site) pages are statically rendered, so a server-side year would be
 * frozen at build time. The client re-renders it with the visitor's clock;
 * the build-time value is only the pre-hydration fallback.
 */
export function CurrentYear() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}
