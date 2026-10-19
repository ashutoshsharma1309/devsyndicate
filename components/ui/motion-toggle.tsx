"use client";

import { Pause, Play } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/** localStorage key; app/layout.tsx reads it before first paint. */
const STORAGE_KEY = "ds-motion";
/** Fired on window whenever the site-wide preference changes. */
export const MOTION_EVENT = "ds:motion";

// The source of truth is html[data-motion="paused"], so CSS, every toggle on the
// page and any component reading useMotionPaused() always agree.
const subscribe = (onChange: () => void) => {
  window.addEventListener(MOTION_EVENT, onChange);
  return () => window.removeEventListener(MOTION_EVENT, onChange);
};
const getSnapshot = () => document.documentElement.dataset.motion === "paused";
const getServerSnapshot = () => false;

/** Whether the visitor has paused decorative animation site-wide. */
export function useMotionPaused() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function setMotionPaused(paused: boolean) {
  const root = document.documentElement;
  if (paused) root.dataset.motion = "paused";
  else delete root.dataset.motion;
  try {
    if (paused) localStorage.setItem(STORAGE_KEY, "paused");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode, site data off): the choice lasts for this page only.
  }
  window.dispatchEvent(new CustomEvent(MOTION_EVENT, { detail: { paused } }));
}

/**
 * Pauses or resumes the decorative loops (hero traces, ecosystem path, blinking
 * lights, slideshow auto-advance) across the site — WCAG 2.2.2. One-off entrance
 * and scroll reveals are unaffected. On narrow screens only the icon shows; the
 * label stays available to assistive technology.
 */
export function MotionToggle({ className }: { className?: string }) {
  const paused = useMotionPaused();
  const Icon = paused ? Play : Pause;

  return (
    <button
      type="button"
      onClick={() => setMotionPaused(!paused)}
      className={cn(
        // Negative margins give a 24px+ hit area without growing the bar it sits in.
        "t-label -m-1.5 inline-flex min-h-6 min-w-6 shrink-0 items-center justify-center gap-2 rounded-xs p-1.5 text-mute-dark transition-colors duration-200 hover:text-white",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3" strokeWidth={2} />
      <span className="max-sm:sr-only">{paused ? "Play animations" : "Pause animations"}</span>
    </button>
  );
}
