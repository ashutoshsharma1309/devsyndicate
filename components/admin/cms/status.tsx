import { CircleCheck, CircleDashed, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_TEXT, type PublishStatus } from "./format";

const styles: Record<PublishStatus, string> = {
  published: "border-success/30 bg-success/10 text-success",
  changes: "border-signal/30 bg-signal/[0.07] text-signal-deep",
  never: "border-ink/15 bg-paper-2/60 text-mute",
};

const icons = { published: CircleCheck, changes: CircleDot, never: CircleDashed } as const;

/** Publish state as icon + text (never colour alone). */
export function ContentStatusBadge({ status, className }: { status: PublishStatus; className?: string }) {
  const Icon = icons[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 text-xs font-medium leading-5",
        styles[status],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2} />
      {STATUS_TEXT[status]}
    </span>
  );
}
