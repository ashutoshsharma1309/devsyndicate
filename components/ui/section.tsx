import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("container-x", className)} {...props} />;
}

type Tone = "light" | "dark";
type SectionTone = Tone | "muted";

/** A page section. `tone="muted"` is the warm alternate surface; `tone="dark"` the ink one. */
export function Section({
  tone = "light",
  className,
  children,
  ...props
}: ComponentProps<"section"> & { tone?: SectionTone }) {
  return (
    <section
      className={cn(
        "section-y relative",
        tone === "dark" ? "on-dark bg-ink text-white" : tone === "muted" ? "bg-paper-2/60 text-ink" : "bg-paper text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

/** Sparse uppercase eyebrow — "THE PARTNERSHIP". */
export function SectionLabel({ children, tone = "light", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <p
      className={cn(
        "t-eyebrow flex items-center gap-3",
        tone === "dark" ? "text-signal-soft" : "text-signal",
        className,
      )}
    >
      <span aria-hidden="true" className="inline-block h-px w-6 bg-current" />
      {children}
    </p>
  );
}

export function SectionHeading({
  as: Tag = "h2",
  className,
  children,
  id,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Tag id={id} className={cn("t-h2", className)}>
      {children}
    </Tag>
  );
}

export function Badge({ children, tone = "light", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "t-label inline-flex items-center gap-1.5 rounded-xs border px-2 py-1",
        tone === "dark" ? "border-white/12 text-mute-dark" : "border-ink/12 text-mute",
        className,
      )}
    >
      {children}
    </span>
  );
}
