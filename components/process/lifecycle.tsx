"use client";

import { useEffect, useRef, useState } from "react";
import { lifecycle, type Phase } from "@/lib/content";
import { cn } from "@/lib/utils";

const phases: Phase[] = ["Plan", "Build-up", "Live", "After"];

/**
 * The eight-stage hackathon lifecycle. On large screens a sticky panel tracks
 * the stage closest to the middle of the viewport; on small screens it is a
 * plain vertical timeline.
 */
export function Lifecycle() {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = Number((entry.target as HTMLElement).dataset.index);
            setActive(i);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    itemRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const stage = lifecycle[active];

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      {/* Sticky stage panel — large screens only */}
      <div className="hidden lg:col-span-5 lg:block" aria-hidden="true">
        <div className="sticky top-[calc(50vh-13rem)] flex h-[26rem] gap-8">
          {/* progress trace */}
          <div className="relative w-px bg-white/10">
            <div
              className="absolute inset-x-0 top-0 bg-signal-soft transition-[height] duration-700 ease-[var(--ease-out-expo)]"
              style={{ height: `${((active + 1) / lifecycle.length) * 100}%` }}
            />
            {lifecycle.map((s, i) => (
              <span
                key={s.n}
                className={cn(
                  "absolute -left-[3px] size-[7px] rounded-full border transition-colors duration-500",
                  i <= active ? "border-signal-soft bg-signal-soft" : "border-white/25 bg-ink",
                )}
                style={{ top: `calc(${((i + 0.5) / lifecycle.length) * 100}% - 3.5px)` }}
              />
            ))}
          </div>

          <div className="flex flex-1 flex-col justify-between">
            <div>
              <p className="t-label text-mute-dark">
                Stage {stage.n} <span className="text-white/25">/</span> 08
              </p>
              <div key={active} className="fade-in">
                <p className="mt-6 font-mono text-[7.5rem] font-medium leading-none tracking-[-0.06em] text-signal-soft tabular-nums">
                  {stage.n}
                </p>
                <p className="mt-6 text-4xl font-medium tracking-[-0.035em]">{stage.title}</p>
              </div>
            </div>
            <ul className="flex gap-2">
              {phases.map((p) => (
                <li
                  key={p}
                  className={cn(
                    "t-label rounded-xs border px-2.5 py-1.5 transition-colors duration-500",
                    p === stage.phase ? "border-signal-soft/60 text-white" : "border-white/10 text-mute-dark",
                  )}
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Stage list */}
      <ol className="relative lg:col-span-7">
        <span aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-px bg-white/10 lg:hidden" />
        {lifecycle.map((s, i) => (
          <li
            key={s.n}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            data-index={i}
            data-active={i === active}
            className={cn(
              "relative pb-12 pl-10 last:pb-0 lg:flex lg:min-h-[44vh] lg:items-center lg:pb-0 lg:pl-0",
              "transition-opacity duration-500 lg:opacity-30 lg:data-[active=true]:opacity-100",
            )}
          >
            <span
              aria-hidden="true"
              className="absolute left-0 top-1.5 size-[15px] rounded-full border border-signal-soft/70 bg-ink lg:hidden"
            >
              <span className="absolute inset-[4px] rounded-full bg-signal-soft" />
            </span>
            <div className="max-w-xl">
              <p className="t-label flex items-center gap-3 text-mute-dark">
                <span className="text-signal-soft">{s.n}</span>
                <span aria-hidden="true" className="h-px w-5 bg-white/20" />
                {s.phase}
              </p>
              <h3 className="mt-4 text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] font-medium leading-[1.05] tracking-[-0.035em]">
                {s.title}
              </h3>
              <p className="t-body mt-4 text-white/70 md:text-lg md:leading-relaxed">{s.body}</p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label={`${s.title} deliverables`}>
                {s.deliverables.map((d) => (
                  <li key={d} className="t-label rounded-xs border border-white/10 px-2.5 py-1.5 text-white/70">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
