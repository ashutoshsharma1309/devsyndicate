"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Admin pages read the lead store on every request. If it's unreachable
 * (database down, wrong DATABASE_URL), show this instead of Next's bare error
 * screen. The panel header and Sign out stay usable (the layout is outside it).
 */
export default function AdminPanelError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-xl rounded-md border border-line bg-white p-8">
      <p className="t-label text-danger">Something went wrong</p>
      <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em]">The lead database couldn&apos;t be reached</h1>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        Usually this is temporary. Try again in a moment. If it keeps happening, check that the database is running
        and that <code className="font-mono">DATABASE_URL</code> is correct. While storage is down, new requests are
        still emailed to the team if a mail server is configured.
      </p>
      {error.digest && <p className="mt-3 font-mono text-xs text-mute">Reference: {error.digest}</p>}
      {/* retry() re-fetches the server component; reset() would only re-render the failed result. */}
      <Button type="button" className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
