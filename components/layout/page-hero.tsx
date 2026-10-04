import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Dark header for inner pages. Leaves room for the fixed navbar. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  aside,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby="page-title" className={cn("on-dark relative overflow-hidden bg-ink text-white", className)}>
      <div
        aria-hidden="true"
        className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(100%_90%_at_80%_0%,black,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 right-[-15%] h-[440px] w-[640px] rounded-full bg-signal/15 blur-[130px]"
      />
      <div className="container-x relative pb-16 pt-32 md:pb-24 md:pt-44">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className={aside ? "lg:col-span-8" : "lg:col-span-10"}>
            <p className="t-eyebrow fade-in flex items-center gap-3 text-signal-soft">
              <span aria-hidden="true" className="inline-block h-px w-6 bg-current" />
              {eyebrow}
            </p>
            <h1 id="page-title" className="t-h1 fade-in mt-7" style={{ ["--delay" as string]: "80ms" }}>
              {title}
            </h1>
            {lead && (
              <p className="t-lead fade-in mt-7 max-w-2xl text-white/70" style={{ ["--delay" as string]: "200ms" }}>
                {lead}
              </p>
            )}
            {children && (
              <div className="fade-in mt-10" style={{ ["--delay" as string]: "300ms" }}>
                {children}
              </div>
            )}
          </div>
          {aside && (
            <div className="fade-in lg:col-span-4" style={{ ["--delay" as string]: "360ms" }}>
              {aside}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
