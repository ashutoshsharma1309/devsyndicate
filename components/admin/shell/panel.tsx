import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A bordered white section with a heading row (title, optional description and
 * a right-hand action such as "View all"). `flush` drops the body padding, for
 * tables and lists that run edge to edge.
 */
export function AdminPanel({
  title,
  description,
  action,
  flush = false,
  headingLevel = 2,
  id,
  className,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  flush?: boolean;
  headingLevel?: 2 | 3;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("min-w-0 rounded-md border border-line bg-white", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <Heading id={headingId} className="text-[0.9375rem] font-medium tracking-[-0.015em]">
            {title}
          </Heading>
          {description && <p className="mt-0.5 text-sm text-mute">{description}</p>}
        </div>
        {action && <div className="shrink-0 text-sm">{action}</div>}
      </div>
      <div className={flush ? undefined : "p-5"}>{children}</div>
    </section>
  );
}
