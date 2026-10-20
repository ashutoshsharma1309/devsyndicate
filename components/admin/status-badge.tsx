import { leadStatuses, type LeadStatus } from "@/lib/leads/types";
import { cn } from "@/lib/utils";
import type { OrgType } from "@/lib/validation/lead";

const tones: Record<LeadStatus, string> = {
  new: "border-signal/30 bg-signal/8 text-signal-deep",
  contacted: "border-ink/15 bg-ink/[0.04] text-ink",
  meeting: "border-amber-600/25 bg-amber-500/10 text-amber-800",
  proposal: "border-violet-600/25 bg-violet-500/10 text-violet-800",
  negotiation: "border-orange-600/25 bg-orange-500/10 text-orange-800",
  won: "border-success/30 bg-success/10 text-success",
  lost: "border-ink/10 bg-transparent text-mute",
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs border px-2 py-0.5 text-xs font-medium",
        tones[status],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-70" />
      {leadStatuses.find((s) => s.value === status)?.label ?? status}
    </span>
  );
}

/** Shown when the team notification email for a lead couldn't be sent. */
export function NotifyFailedBadge({ className }: { className?: string }) {
  return (
    <span
      title="The notification email for this request couldn't be sent. Follow up from here."
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs border border-danger/30 bg-danger/5 px-2 py-0.5 text-xs font-medium text-danger",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-70" />
      Email failed
    </span>
  );
}

/**
 * Identity colours for organisation types, shared by the badge and the overview
 * chart so a type reads the same everywhere. Checked as a set for colour-vision
 * separation and 3:1 against white. "Not recorded" is a neutral hatch, not a hue.
 */
export const orgTypeFill: Record<OrgType | "unknown", string> = {
  college: "bg-signal",
  company: "bg-amber-600",
  other: "bg-teal-600",
  unknown: "bg-paper-2 bg-[repeating-linear-gradient(135deg,var(--color-mute)_0_1.5px,transparent_1.5px_5px)]",
};

/** Short labels for tight spaces; the form's own labels are longer. */
export const orgTypeShort: Record<OrgType | "unknown", string> = {
  college: "College",
  company: "Company",
  other: "Other org",
  unknown: "Not recorded",
};

/** Organisation type. Renders nothing for leads stored before the form asked, unless `showUnknown`. */
export function OrgTypeBadge({
  orgType,
  showUnknown = false,
  className,
}: {
  orgType: OrgType | "";
  showUnknown?: boolean;
  className?: string;
}) {
  const key = orgType || "unknown";
  if (key === "unknown" && !showUnknown) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs border border-line bg-white px-2 py-0.5 text-xs font-medium",
        key === "unknown" ? "text-mute" : "text-ink",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", orgTypeFill[key])} />
      {orgTypeShort[key]}
    </span>
  );
}
