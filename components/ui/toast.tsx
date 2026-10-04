"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Transient confirmation in the corner of the screen. Pass a new `stamp`
 * (e.g. Date.now() from an action result) to show it again.
 */
export function Toast({
  message,
  stamp,
  tone = "success",
}: {
  message?: string;
  stamp?: number;
  tone?: "success" | "error";
}) {
  const [shownStamp, setShownStamp] = useState<number | undefined>(undefined);
  const visible = Boolean(message && stamp && shownStamp !== stamp);

  useEffect(() => {
    if (!stamp) return;
    const t = setTimeout(() => setShownStamp(stamp), 3500);
    return () => clearTimeout(t);
  }, [stamp]);

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex justify-end sm:inset-x-6 sm:bottom-6">
      {visible && (
        <div
          key={stamp}
          className={cn(
            "fade-in pointer-events-auto flex items-center gap-3 rounded-sm border px-4 py-3 text-sm shadow-[0_16px_40px_-16px_rgb(10_11_13/0.4)]",
            tone === "success" ? "border-white/10 bg-ink text-white" : "border-danger/30 bg-white text-danger",
          )}
        >
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone === "success" ? "bg-signal-soft" : "bg-danger")} />
          {message}
          <button
            type="button"
            onClick={() => setShownStamp(stamp)}
            className="-mr-1 ml-2 rounded-xs px-1 text-current/60 hover:text-current"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
