import "server-only";
import { actorLabel, type AdminSession } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import type { ActivityAction } from "@/lib/leads/types";

/**
 * Records an admin action in the activity log. Best-effort: a logging failure
 * never blocks or fails the action itself, and without a store it does nothing.
 * Callers pass no personal data in `detail` (field names, statuses, counts).
 */
export async function audit(
  session: AdminSession | null,
  action: ActivityAction,
  opts: { leadId?: string | null; leadLabel?: string | null; detail?: string | null } = {},
): Promise<void> {
  try {
    const store = await getLeadStore();
    if (!store) return;
    await store.logActivity({
      actor: session ? actorLabel(session) : "Unknown",
      action,
      leadId: opts.leadId ?? null,
      leadLabel: opts.leadLabel?.slice(0, 200) ?? null,
      detail: opts.detail?.slice(0, 500) ?? null,
    });
  } catch (err) {
    // The action and error code only: the error text could echo the values being written.
    console.error(`[audit] Couldn't record "${action}":`, (err as { code?: string })?.code ?? "unknown error");
  }
}
