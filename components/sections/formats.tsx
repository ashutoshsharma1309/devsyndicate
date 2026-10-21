import Link from "next/link";
import { FormatGlyph } from "@/components/services/format-glyph";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { getHomepage, getServices } from "@/lib/cms";
import { cn } from "@/lib/utils";

/**
 * Large-screen column spans (of 6) by how many formats are shown. Five is the
 * original 3 + 2 layout; other counts keep the rows full.
 */
const spansFor = (n: number): string[] => {
  if (n === 5) return ["lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3"];
  const span = n === 1 ? "lg:col-span-6" : n === 3 ? "lg:col-span-2" : "lg:col-span-3";
  return Array.from({ length: n }, () => span);
};

export async function FormatsSection({ tone }: { tone?: "light" | "muted" }) {
  const [home, services] = await Promise.all([getHomepage(), getServices()]);
  const intro = home.sections.formats;
  const formats = services.formats;
  // Every format hidden: leave the section out rather than show a heading with nothing under it.
  if (formats.length === 0) return null;
  const spans = spansFor(formats.length);
  return (
    <Section tone={tone} aria-labelledby="formats-title">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel>{intro.label}</SectionLabel>
            <SectionHeading id="formats-title" className="mt-6">
              {intro.heading}
            </SectionHeading>
          </div>
          <p className="t-lead text-mute lg:col-span-5">{intro.description}</p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 md:mt-20 lg:grid-cols-6">
          {formats.map((f, i) => (
            <li
              key={f.code}
              data-reveal
              style={{ ["--reveal-i" as string]: i }}
              className={cn(
                "group relative flex flex-col rounded-md border border-line bg-paper transition-[border-color,box-shadow,translate] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-ink/30 hover:shadow-[0_24px_48px_-28px_rgb(10_11_13/0.35)]",
                spans[i],
                // An odd last card spans both columns at the two-column width.
                i === formats.length - 1 && formats.length % 2 === 1 && "sm:col-span-2",
              )}
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-3.5">
                <span className="t-label text-mute">FMT / {f.code}</span>
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-ink/20 transition-colors duration-500 group-hover:bg-signal"
                />
              </div>
              <div className="flex flex-1 flex-col p-6 md:p-7">
                <FormatGlyph code={f.code} />
                <h3 className="t-h3 mt-6">{f.title}</h3>
                <p className="t-body mt-2 text-mute">{f.summary}</p>
                <dl className="mt-6 space-y-4 border-t border-line pt-5 text-[0.9375rem]">
                  <div>
                    <dt className="t-label text-mute">Who takes part</dt>
                    <dd className="mt-1.5">{f.scope}</dd>
                  </div>
                  <div>
                    <dt className="t-label text-mute">Good for</dt>
                    <dd className="mt-1.5 text-ink/80">{f.goodFor}</dd>
                  </div>
                </dl>
                <Link
                  href={`/contact?format=${f.code.toLowerCase()}`}
                  className="mt-auto inline-flex items-center gap-2 pt-7 text-[0.9375rem] font-medium text-ink transition-colors after:absolute after:inset-0 after:content-[''] hover:text-signal"
                >
                  Discuss this format
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
