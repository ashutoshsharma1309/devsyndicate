import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/**
 * Where the page sits, e.g. Leads › Acme College. The last crumb is the current
 * page (no link). Server-safe.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-mute">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${c.label}`} className="flex min-w-0 items-center gap-1">
              {c.href && !last ? (
                <Link href={c.href} className="inline-flex min-h-6 items-center rounded-xs hover:text-ink hover:underline underline-offset-4">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="min-w-0 truncate text-ink/80">
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-mute/70" strokeWidth={1.75} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
