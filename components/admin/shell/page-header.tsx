import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

export type { Crumb } from "./breadcrumbs";

/**
 * The top of every admin page: breadcrumbs (optional), the page's one <h1>, a
 * short description and the page's primary action(s) on the right.
 *
 *   <AdminPageHeader
 *     title="Acme College"
 *     breadcrumbs={[{ label: "Leads", href: "/admin/leads" }, { label: "Acme College" }]}
 *     description="Received 3 Oct 2026"
 *     actions={<ButtonLink href="…">Export</ButtonLink>}
 *   />
 *
 * `meta` sits under the description, e.g. a count or a status badge.
 */
export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 border-b border-line pb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 max-w-3xl flex-1 basis-72">
          <h1 className="break-words text-2xl font-medium tracking-[-0.03em] md:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-2 text-sm leading-relaxed text-mute md:text-[0.9375rem]">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-mute">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
