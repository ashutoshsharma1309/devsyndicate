"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useMotionPaused } from "@/components/ui/motion-toggle";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { journey } from "@/lib/content";
import { cn } from "@/lib/utils";
import { experiencePanels } from "./experience-panels";

const STEP_MS = 3600;

/**
 * The participant journey as a product-style interface. Auto-advances while
 * visible. Hover/focus pauses it only for as long as it lasts; choosing a tab
 * or pressing the pause button stops it until the visitor presses play (on
 * touch, pointerleave fires right after a tap, so a hover pause alone would
 * resume it). Never runs with reduced motion or while animation is paused
 * site-wide (components/ui/motion-toggle.tsx).
 */
export function ExperienceSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const motionPaused = useMotionPaused();
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    if (rootRef.current) io.observe(rootRef.current);
    return () => {
      mq.removeEventListener("change", update);
      io.disconnect();
    };
  }, []);

  const canRun = !reduced && !motionPaused;
  const running = visible && !paused && !userPaused && canRun;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % journey.length), STEP_MS);
    return () => clearTimeout(t);
  }, [running, active]);

  const select = (i: number, focus = false) => {
    setActive(i);
    setUserPaused(true);
    if (focus) tabRefs.current[i]?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    const n = journey.length;
    const map: Record<string, number> = {
      ArrowRight: (active + 1) % n,
      ArrowDown: (active + 1) % n,
      ArrowLeft: (active - 1 + n) % n,
      ArrowUp: (active - 1 + n) % n,
      Home: 0,
      End: n - 1,
    };
    if (e.key in map) {
      e.preventDefault();
      select(map[e.key], true);
    }
  };

  const step = journey[active];

  return (
    <Section tone="dark" aria-labelledby="experience-title">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionLabel tone="dark">The experience</SectionLabel>
            <SectionHeading id="experience-title" className="mt-6">
              Built for the people doing the building.
            </SectionHeading>
            <p className="t-lead mt-6 max-w-md text-white/70">
              Students remember how an event felt to take part in. We design every step of the participant journey
              — from the first time they hear about it to the certificate in their inbox.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.08] text-sm">
              {[
                ["One event page", "Everything participants need, in one place."],
                ["Clear checkpoints", "Teams know what's due, and when."],
                ["Mentor access", "Help is bookable, not a queue."],
                ["Fair judging", "Published criteria and feedback."],
              ].map(([k, v]) => (
                <div key={k} className="bg-ink p-4 md:p-5">
                  <dt className="font-medium text-white">{k}</dt>
                  <dd className="mt-1 text-mute-dark">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            ref={rootRef}
            className="lg:col-span-7"
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              // Resume once focus has left the slideshow entirely (not when moving between its tabs).
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
            }}
          >
            <figure className="overflow-hidden rounded-md border border-white/[0.09] bg-carbon shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 md:px-5">
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="size-2 rounded-full bg-white/15" />
                  <span className="size-2 rounded-full bg-white/15" />
                  <span className="size-2 rounded-full bg-white/15" />
                </span>
                <figcaption className="t-label text-mute-dark">Participant view · illustrative</figcaption>
                <div className="flex items-center gap-3">
                  <span className="t-label hidden text-mute-dark sm:inline">
                    {String(active + 1).padStart(2, "0")} / {String(journey.length).padStart(2, "0")}
                  </span>
                  {/* Nothing to control when the slideshow can't run at all. */}
                  {canRun && (
                    <button
                      type="button"
                      aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                      onClick={() => {
                        // Play resumes straight away, even under the pointer or focus.
                        if (userPaused) setPaused(false);
                        setUserPaused(!userPaused);
                      }}
                      className="-m-1.5 inline-flex size-6 items-center justify-center rounded-xs text-mute-dark transition-colors duration-200 hover:text-white"
                    >
                      {userPaused ? (
                        <Play aria-hidden="true" className="size-3" strokeWidth={2} />
                      ) : (
                        <Pause aria-hidden="true" className="size-3" strokeWidth={2} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-[13rem_1fr]">
                <div
                  role="tablist"
                  aria-label="Participant journey"
                  aria-orientation="vertical"
                  onKeyDown={onKey}
                  className="flex gap-1 overflow-x-auto border-b border-white/[0.07] p-2 [scrollbar-width:none] md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-3"
                >
                  {journey.map((j, i) => (
                    <button
                      key={j.key}
                      ref={(el) => {
                        tabRefs.current[i] = el;
                      }}
                      role="tab"
                      id={`xp-tab-${j.key}`}
                      aria-selected={i === active}
                      aria-controls="xp-panel"
                      tabIndex={i === active ? 0 : -1}
                      onClick={() => select(i)}
                      className={cn(
                        "relative flex shrink-0 items-center gap-3 overflow-hidden rounded-sm px-3 py-2.5 text-left text-sm transition-colors duration-300",
                        i === active ? "bg-white/[0.06] text-white" : "text-mute-dark hover:text-white",
                      )}
                    >
                      <span className={cn("font-mono text-[0.6875rem]", i === active && "text-signal-soft")}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {j.label}
                      {i === active && running && (
                        <span
                          key={`${active}-progress`}
                          aria-hidden="true"
                          className="xp-progress absolute inset-x-0 bottom-0 h-px origin-left bg-signal-soft"
                          style={{ animationDuration: `${STEP_MS}ms` }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div
                  id="xp-panel"
                  role="tabpanel"
                  aria-labelledby={`xp-tab-${step.key}`}
                  className="min-h-[22rem] p-5 md:p-8"
                >
                  <div key={step.key} className="fade-in">
                    {experiencePanels[step.key]}
                  </div>
                </div>
              </div>
            </figure>
          </div>
        </div>
      </Container>
    </Section>
  );
}
