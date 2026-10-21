import Link from "next/link";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemIssue } from "./system-status";

const meta = {
  critical: { label: "Action needed", icon: CircleAlert, className: "text-danger" },
  warning: { label: "Warning", icon: TriangleAlert, className: "text-amber-700" },
  info: { label: "Note", icon: Info, className: "text-signal-deep" },
} as const;

/**
 * Real conditions as a list. Each one carries an icon and a written severity, so
 * the colour is never the only signal. With none, says so plainly.
 */
export function SystemIssues({ issues, emptyText }: { issues: SystemIssue[]; emptyText: string }) {
  if (issues.length === 0) {
    return (
      <p className="flex items-start gap-2.5 px-5 py-4 text-sm">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={1.75} />
        <span>{emptyText}</span>
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {issues.map((issue) => {
        const m = meta[issue.severity];
        const Icon = m.icon;
        return (
          <li key={issue.id} className="flex items-start gap-3 px-5 py-4 text-sm">
            <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", m.className)} strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="font-medium">
                <span className={cn("t-label mr-2 align-[0.1em]", m.className)}>{m.label}</span>
                {issue.title}
              </p>
              <p className="mt-1 leading-relaxed text-mute">{issue.body}</p>
              {issue.links && issue.links.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {issue.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-flex min-h-6 items-center text-signal underline-offset-4 hover:underline"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
