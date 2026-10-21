import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Server-rendered admin charts: plain HTML/CSS, no chart library, no animation.
 * Each draws its visual inside role="img" (one spoken summary) and repeats the
 * numbers in a visually hidden table, since role="img" hides its children from
 * screen readers. Hover shows the exact value through the native title tooltip.
 */

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

/** A titled panel that holds one chart. */
export function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className={cn("min-w-0 rounded-md border border-line bg-white p-5", className)}>
      <figcaption>
        <h2 className="text-base font-medium tracking-[-0.015em]">{title}</h2>
        {description && <p className="mt-1 text-sm text-mute">{description}</p>}
      </figcaption>
      <div className="mt-5">{children}</div>
    </figure>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: [string, string]; rows: [string, string][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{head[0]}</th>
          <th scope="col">{head[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th scope="row">{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Months are calendar months already resolved to IST, so format them in UTC to avoid shifting.
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" });
const monthYearFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
const monthDate = (m: string) => new Date(`${m}-01T00:00:00Z`);

/** Vertical bars, one per month (YYYY-MM), oldest first. */
export function MonthlyBars({
  data,
  noun = "request",
  nounPlural = `${noun}s`,
}: {
  data: { month: string; count: number }[];
  noun?: string;
  nounPlural?: string;
}) {
  const max = Math.max(0, ...data.map((d) => d.count));
  const total = data.reduce((a, d) => a + d.count, 0);
  const plural = (n: number) => `${n} ${n === 1 ? noun : nounPlural}`;
  const first = data[0] ? monthYearFmt.format(monthDate(data[0].month)) : "";
  const last = data.at(-1) ? monthYearFmt.format(monthDate(data.at(-1)!.month)) : "";
  // Selective direct labels: the peak and the latest month, not every bar.
  const peakIndex = max > 0 ? data.findIndex((d) => d.count === max) : -1;
  const labelled = new Set([peakIndex, max > 0 ? data.length - 1 : -1]);

  const summary =
    total === 0
      ? `No ${nounPlural} from ${first} to ${last}.`
      : `${plural(total)} from ${first} to ${last}. Busiest month: ${monthYearFmt.format(
          monthDate(data[peakIndex].month),
        )} with ${max}.${peakIndex === data.length - 1 ? "" : ` ${last}: ${data.at(-1)!.count}.`}`;

  return (
    <>
      <div role="img" aria-label={summary}>
        {/* pt-5 leaves room for the value label above the tallest bar. */}
        <div className="grid h-44 grid-cols-12 gap-0.5 border-b border-ink/25 pt-5 sm:gap-1.5">
          {data.map((d, i) => {
            const height = max > 0 ? (d.count / max) * 100 : 0;
            return (
              <div
                key={d.month}
                title={`${monthYearFmt.format(monthDate(d.month))}: ${plural(d.count)}`}
                // The whole column is the hover target, not just the (possibly tiny) bar.
                className="group flex h-full items-end justify-center"
              >
                <span
                  className={cn(
                    "relative block w-full max-w-8 rounded-t-[4px] group-hover:bg-signal-deep",
                    i === data.length - 1 ? "bg-signal" : "bg-signal/70",
                  )}
                  // Keep a sliver visible for small non-zero months.
                  style={{ height: d.count > 0 ? `max(${height}%, 3px)` : 0 }}
                >
                  {labelled.has(i) && d.count > 0 && (
                    <span className="absolute inset-x-0 bottom-full mb-1 text-center text-[0.6875rem] font-medium tabular-nums text-ink">
                      {d.count}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-12 gap-0.5 sm:gap-1.5">
          {data.map((d) => {
            const date = monthDate(d.month);
            return (
              <span key={d.month} className="text-center text-[0.6875rem] leading-tight text-mute">
                {monthFmt.format(date)}
                {/* The year only where it changes, so the axis stays readable. */}
                {(date.getUTCMonth() === 0 || d === data[0]) && (
                  <span className="block tabular-nums">’{String(date.getUTCFullYear()).slice(2)}</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
      <DataTable
        caption={`${nounPlural[0].toUpperCase()}${nounPlural.slice(1)} per month`}
        head={["Month", "Count"]}
        rows={data.map((d) => [monthYearFmt.format(monthDate(d.month)), String(d.count)])}
      />
    </>
  );
}

export type Segment = { key: string; label: string; value: number; fill: string };

/** One horizontal bar split into parts of a whole, with a direct-labelled legend. */
export function SplitBar({ label, segments }: { label: string; segments: Segment[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const shown = segments.filter((s) => s.value > 0);
  const summary =
    total === 0
      ? `${label}: no data yet.`
      : `${label}: ${segments.map((s) => `${s.label} ${s.value} (${pct(s.value, total)}%)`).join(", ")}.`;

  return (
    <>
      <div role="img" aria-label={summary}>
        {/* gap-0.5 on white: a 2px surface gap between parts. */}
        <div className="flex h-5 gap-0.5 overflow-hidden rounded-[4px] bg-white">
          {total === 0 ? (
            <span className="block h-full w-full rounded-[4px] bg-paper-2" />
          ) : (
            shown.map((s) => (
              <span
                key={s.key}
                title={`${s.label}: ${s.value} (${pct(s.value, total)}%)`}
                className={cn("block h-full min-w-1 first:rounded-l-[4px] last:rounded-r-[4px]", s.fill)}
                style={{ flexGrow: s.value, flexBasis: 0 }}
              />
            ))
          )}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {segments.map((s) => (
            <li key={s.key} className="flex min-w-0 items-start gap-2">
              <span aria-hidden="true" className={cn("mt-1 size-2.5 shrink-0 rounded-xs", s.fill)} />
              <span className="min-w-0">
                <span className="block truncate text-sm">{s.label}</span>
                <span className="block text-sm tabular-nums text-mute">
                  <span className="font-medium text-ink">{s.value}</span>
                  {total > 0 && ` · ${pct(s.value, total)}%`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <DataTable
        caption={label}
        head={["Group", "Count"]}
        rows={segments.map((s) => [s.label, `${s.value} (${pct(s.value, total)}%)`])}
      />
    </>
  );
}

/** Ranked horizontal bars for a single series. Items are drawn in the order given. */
export function BarList({ label, items }: { label: string; items: { key: string; label: string; value: number }[] }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  const total = items.reduce((a, i) => a + i.value, 0);
  const summary =
    total === 0 ? `${label}: no data yet.` : `${label}: ${items.map((i) => `${i.label} ${i.value}`).join(", ")}.`;

  return (
    <>
      <ul role="img" aria-label={summary} className="space-y-3">
        {items.map((i) => (
          <li key={i.key} title={`${i.label}: ${i.value}`}>
            {/* Label above the bar, so long type names never squeeze it at phone width. */}
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{i.label}</span>
              <span className="font-medium tabular-nums">{i.value}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-[4px] bg-paper-2">
              {i.value > 0 && (
                <div
                  className="h-full min-w-1 rounded-[4px] bg-signal"
                  style={{ width: `${max > 0 ? (i.value / max) * 100 : 0}%` }}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
      <DataTable caption={label} head={["Type", "Count"]} rows={items.map((i) => [i.label, String(i.value)])} />
    </>
  );
}
