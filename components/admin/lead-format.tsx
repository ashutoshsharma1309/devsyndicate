import { CalendarClock, CircleAlert } from "lucide-react";
import { isOpenStatus, type Lead } from "@/lib/leads/types";
import { cn, formatDate } from "@/lib/utils";

// India has no daylight saving, so a fixed +05:30 offset is exact.
const IST_OFFSET_MS = 330 * 60_000;

/** "20 Oct 2026" for a YYYY-MM-DD day (a day in Asia/Kolkata). */
export const formatDay = (day: string) => formatDate(`${day}T12:00:00+05:30`);

/** An ISO instant as "YYYY-MM-DDTHH:mm" in India time, for <input type="datetime-local">. */
export const toIstLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? "" : new Date(t + IST_OFFSET_MS).toISOString().slice(0, 16);
};

/** Today as YYYY-MM-DD in India time (client or server). */
export const istTodayLocal = (now = new Date()) => new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export type FollowUpState = "overdue" | "today" | "upcoming" | "closed" | "none";

/** Where a lead's next follow-up stands. A Won or Lost lead's leftover date is never "due". */
export function followUpState(lead: Pick<Lead, "status" | "nextFollowUp">, today: string): FollowUpState {
  if (!lead.nextFollowUp) return "none";
  if (!isOpenStatus(lead.status)) return "closed";
  if (lead.nextFollowUp < today) return "overdue";
  if (lead.nextFollowUp === today) return "today";
  return "upcoming";
}

/** The next follow-up as text plus an icon; the words carry the state, not the colour. */
export function FollowUp({
  lead,
  today,
  className,
  emptyLabel = "—",
}: {
  lead: Pick<Lead, "status" | "nextFollowUp">;
  today: string;
  className?: string;
  emptyLabel?: string;
}) {
  const state = followUpState(lead, today);
  if (state === "none") return <span className={cn("text-mute", className)}>{emptyLabel}</span>;
  const day = formatDay(lead.nextFollowUp!);
  if (state === "overdue" || state === "today") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 font-medium text-danger", className)}>
        <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
        <span>
          {state === "overdue" ? "Overdue" : "Due today"}
          <span className="font-normal"> · {day}</span>
        </span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5", state === "closed" ? "text-mute" : "text-ink", className)}>
      <CalendarClock aria-hidden="true" className="size-3.5 shrink-0 text-mute" />
      <span>
        {day}
        {state === "closed" && <span className="sr-only"> (lead closed)</span>}
      </span>
    </span>
  );
}
