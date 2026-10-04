/**
 * Mock participant-interface panels for the event experience section.
 * Illustrative only — no real events, teams or people.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Row({ k, v, accent }: { k: string; v: ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] py-3 text-sm last:border-b-0">
      <span className="text-mute-dark">{k}</span>
      <span className={cn("text-right", accent ? "text-signal-soft" : "text-white/90")}>{v}</span>
    </div>
  );
}

function Check({ done = true, children }: { done?: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 border-b border-white/[0.07] py-3 text-sm last:border-b-0">
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border",
          done ? "border-signal-soft bg-signal-soft/15 text-signal-soft" : "border-white/20 text-transparent",
        )}
      >
        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3.5 8.5l3 3 6-7" strokeLinecap="square" />
        </svg>
      </span>
      <span className={done ? "text-white/90" : "text-mute-dark"}>{children}</span>
    </li>
  );
}

function Title({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="t-label text-mute-dark">{eyebrow}</p>
      <p className="mt-2 text-xl font-medium tracking-[-0.025em] text-white">{children}</p>
    </div>
  );
}

const Btn = ({ children }: { children: ReactNode }) => (
  <span className="mt-6 inline-flex h-9 items-center rounded-sm bg-signal px-4 text-sm font-medium text-white">
    {children}
  </span>
);

const Initials = ({ s, dim }: { s: string; dim?: boolean }) => (
  <span
    className={cn(
      "grid size-8 place-items-center rounded-full border text-[0.6875rem] font-medium",
      dim ? "border-dashed border-white/20 text-mute-dark" : "border-white/15 bg-carbon-2 text-white/85",
    )}
  >
    {s}
  </span>
);

export const experiencePanels: Record<string, ReactNode> = {
  discover: (
    <div>
      <Title eyebrow="Event page">Your College Hackathon</Title>
      <Row k="Format" v="36 hours · Hybrid" />
      <Row k="Tracks" v="AI · Sustainability · Open" />
      <Row k="Team size" v="2 – 4 builders" />
      <Row k="Registration" v="Open" accent />
      <Btn>Register your team</Btn>
    </div>
  ),
  register: (
    <div>
      <Title eyebrow="Team">Team Null Pointer</Title>
      <div className="flex items-center gap-2">
        <Initials s="AK" />
        <Initials s="RS" />
        <Initials s="MV" />
        <Initials s="+" dim />
        <span className="ml-2 text-sm text-mute-dark">3 of 4 members</span>
      </div>
      <ul className="mt-5">
        <Check>Team created</Check>
        <Check>Track selected — AI</Check>
        <Check done={false}>Invite one more teammate (optional)</Check>
      </ul>
    </div>
  ),
  build: (
    <div>
      <Title eyebrow="Build window">Hour 14 of 36</Title>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[39%] rounded-full bg-signal-soft" />
      </div>
      <ul className="mt-5">
        <Check>Repository connected</Check>
        <Check>Checkpoint 1 — problem &amp; approach</Check>
        <Check done={false}>Checkpoint 2 — working prototype</Check>
      </ul>
    </div>
  ),
  mentor: (
    <div>
      <Title eyebrow="Mentor desk">Book a 15-minute session</Title>
      <div className="grid gap-2">
        {[
          ["Backend & APIs", "14:30", false],
          ["Machine learning", "15:00", true],
          ["Product & pitch", "15:30", false],
        ].map(([area, time, sel]) => (
          <div
            key={area as string}
            className={cn(
              "flex items-center justify-between rounded-sm border px-3.5 py-3 text-sm",
              sel ? "border-signal-soft/60 bg-signal/10" : "border-white/10",
            )}
          >
            <span className="text-white/90">{area}</span>
            <span className={cn("font-mono text-xs", sel ? "text-signal-soft" : "text-mute-dark")}>
              {sel ? `${time} · booked` : time}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
  submit: (
    <div>
      <Title eyebrow="Submission">Final submission</Title>
      <ul>
        <Check>Source repository</Check>
        <Check>Two-minute demo video</Check>
        <Check>Project description</Check>
        <Check>Presentation deck</Check>
      </ul>
      <Btn>Submit project</Btn>
    </div>
  ),
  present: (
    <div>
      <Title eyebrow="Judging">Evaluation rubric</Title>
      <div className="space-y-4">
        {[
          ["Problem fit", "w-[80%]"],
          ["Technical depth", "w-[68%]"],
          ["Execution", "w-[74%]"],
          ["Presentation", "w-[60%]"],
        ].map(([k, w]) => (
          <div key={k}>
            <div className="flex justify-between text-sm">
              <span className="text-white/90">{k}</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full bg-signal-soft/80", w)} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-mute-dark">Same criteria, every team, every judge.</p>
    </div>
  ),
  win: (
    <div>
      <Title eyebrow="Results">Results published</Title>
      <ul>
        <Check>Winners announced on the event page</Check>
        <Check>Certificates issued to every participant</Check>
        <Check>Projects added to the event showcase</Check>
        <Check>Feedback from judges shared with teams</Check>
      </ul>
    </div>
  ),
};
