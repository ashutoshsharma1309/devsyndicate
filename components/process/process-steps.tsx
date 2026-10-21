import { getHowItWorks } from "@/lib/cms";
import { cn } from "@/lib/utils";

/** Large-screen columns for the compact stepper. Tailwind needs whole class names, so the common counts are listed. */
const stepperCols: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

/**
 * The partnership process (five steps by default, from the published
 * how-it-works content, numbered in order). `compact` is a horizontal stepper
 * on large screens (homepage); `detailed` adds what each side contributes.
 */
export async function ProcessSteps({ variant = "compact" }: { variant?: "compact" | "detailed" }) {
  const process = (await getHowItWorks()).steps.map((s, i) => ({ ...s, n: String(i + 1).padStart(2, "0") }));
  if (variant === "detailed") {
    return (
      <ol className="border-t border-line">
        {process.map((s, i) => (
          <li
            key={s.n}
            data-reveal
            style={{ ["--reveal-i" as string]: i % 2 }}
            className="grid gap-6 border-b border-line py-10 md:grid-cols-12 md:gap-10 md:py-14"
          >
            <div className="md:col-span-5">
              <p className="font-mono text-sm text-signal">{s.n}</p>
              <h3 className="mt-3 text-[clamp(1.5rem,1.2rem+1vw,2.125rem)] font-medium leading-[1.1] tracking-[-0.035em]">
                {s.title}
              </h3>
              <p className="t-body mt-4 max-w-md text-mute">{s.body}</p>
            </div>
            <dl className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 md:col-span-7 md:self-start">
              <div className="bg-paper p-5 md:p-6">
                <dt className="t-label text-mute">From your college</dt>
                <dd className="mt-3 text-[0.9375rem] leading-relaxed">{s.fromYou}</dd>
              </div>
              <div className="bg-ink p-5 text-white md:p-6">
                <dt className="t-label text-signal-soft">From Dev Syndicate</dt>
                <dd className="mt-3 text-[0.9375rem] leading-relaxed text-white/85">{s.fromUs}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={cn("relative grid", stepperCols[process.length] ?? "lg:grid-cols-5")}>
      <span aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-line lg:hidden" />
      <span aria-hidden="true" className="absolute inset-x-0 top-[5px] hidden h-px bg-line lg:block" />
      {process.map((s, i) => (
        <li
          key={s.n}
          data-reveal
          style={{ ["--reveal-i" as string]: i }}
          className="group relative pb-10 pl-9 last:pb-0 lg:pb-0 lg:pl-0 lg:pr-8 lg:pt-10"
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 top-1 size-[11px] rounded-full border-2 border-paper lg:top-0",
              i === process.length - 1 ? "bg-signal" : "bg-ink",
            )}
          />
          <p className="font-mono text-sm text-signal">{s.n}</p>
          <h3 className="mt-3 text-[1.25rem] font-medium leading-[1.2] tracking-[-0.025em]">{s.title}</h3>
          <p className="t-body mt-3 text-[0.9375rem] text-mute">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
