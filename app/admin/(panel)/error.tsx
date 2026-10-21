"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Admin pages read the lead and content stores on every request. If one is
 * unreachable (database down, wrong DATABASE_URL, tables missing), show this
 * instead of Next's bare error screen. The sidebar, top bar and Sign out stay
 * usable because the layout is outside this boundary.
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
    <div role="alert" className="max-w-xl rounded-md border border-line bg-white p-6 sm:p-8">
      <p className="t-label flex items-center gap-2 text-danger">
        <CircleAlert aria-hidden="true" className="size-4" strokeWidth={1.75} />
        Something went wrong
      </p>
      <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em]">This page couldn&apos;t load its data</h1>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        Usually this is temporary. Try again in a moment. If it keeps happening, check that the database is running,
        that <code className="font-mono text-ink">DATABASE_URL</code> is correct, and that{" "}
        <code className="font-mono text-ink">npm run db:setup</code> has been run for this version. While storage is
        down, new enquiries are still emailed to the team if a mail server is configured.
      </p>
      {error.digest && <p className="mt-3 font-mono text-xs text-mute">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {/* retry() re-fetches the server component; reset() would only re-render the failed result. */}
        <Button type="button" onClick={() => retry()}>
          Try again
        </Button>
        <Link href="/admin" className="text-sm text-signal underline-offset-4 hover:underline">
          Go to the overview
        </Link>
      </div>
    </div>
  );
}
