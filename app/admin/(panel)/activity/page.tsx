import Link from "next/link";
import { ActivityList } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { MAX_ACTIVITY_LIMIT, type ActivityAction } from "@/lib/leads/types";

export const metadata = { title: "Activity" };

const SHOWN = 200;

const actions: { value: ActivityAction; label: string }[] = [
  { value: "login", label: "Sign-ins" },
  { value: "login_failed", label: "Failed sign-ins" },
  { value: "logout", label: "Sign-outs" },
  { value: "status_changed", label: "Status changes" },
  { value: "note_added", label: "Notes added" },
  { value: "contact_updated", label: "Contact corrections" },
  { value: "lead_deleted", label: "Leads deleted" },
  { value: "export", label: "Exports" },
  { value: "admin_created", label: "Accounts added" },
  { value: "admin_updated", label: "Accounts changed" },
  { value: "password_changed", label: "Password changes" },
];

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  await requireAdmin();
  const sp = await searchParams;
  const raw = Array.isArray(sp.action) ? sp.action[0] : sp.action;
  const action = actions.find((a) => a.value === raw)?.value;

  const store = await getLeadStore();
  // The store doesn't filter by action, so look further back when a filter is on.
  const entries = store
    ? (await store.activity({ limit: action ? MAX_ACTIVITY_LIMIT : SHOWN }))
        .filter((e) => !action || e.action === action)
        .slice(0, SHOWN)
    : [];

  // Only leads that still exist get a link; a deleted one keeps its name as plain text.
  const leadIds = [...new Set(entries.map((e) => e.leadId).filter((id): id is string => Boolean(id)))];
  const live = store
    ? (await Promise.all(leadIds.map(async (id) => ((await store.get(id).catch(() => null)) ? id : null)))).filter(
        (id): id is string => id !== null,
      )
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-3xl font-medium tracking-[-0.035em]">Activity</h1>
        <p className="text-sm tabular-nums text-mute" aria-live="polite">
          {entries.length === SHOWN ? `Latest ${SHOWN}` : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
        </p>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-mute">
        Who did what in the admin, newest first. Times are India Standard Time. Notes, messages and contact details are
        never copied into the log.
      </p>

      <form className="mt-6 grid gap-3 sm:grid-cols-[16rem_auto_auto] sm:justify-start">
        <label htmlFor="action" className="sr-only">
          Type of activity
        </label>
        <Select id="action" name="action" defaultValue={action ?? ""}>
          <option value="">All activity</option>
          {actions.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" className="h-12">
          Apply
        </Button>
        {action && (
          <Link href="/admin/activity" className="inline-flex h-12 items-center px-2 text-sm text-mute hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {entries.length === 0 ? (
        <p className="mt-8 rounded-md border border-dashed border-line p-10 text-center text-sm text-mute">
          {action ? "Nothing of this type yet." : "No activity yet."}
        </p>
      ) : (
        <div className="mt-8 rounded-md border border-line bg-white px-5">
          <div
            aria-hidden="true"
            className="t-label hidden gap-4 border-b border-line py-3 text-mute sm:grid sm:grid-cols-[10.5rem_minmax(0,16rem)_1fr]"
          >
            <span>Time (IST)</span>
            <span>Who</span>
            <span>What</span>
          </div>
          <ActivityList entries={entries} liveLeadIds={live} />
        </div>
      )}
    </div>
  );
}
