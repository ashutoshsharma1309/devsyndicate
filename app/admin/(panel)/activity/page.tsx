import Link from "next/link";
import { ActivityTable } from "@/components/admin/shell/activity";
import { AdminPageHeader } from "@/components/admin/shell/page-header";
import { contentSections } from "@/components/admin/shell/system-status";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import type { ActivityAction, ActivityEntry } from "@/lib/leads/types";

export const metadata = { title: "Activity log" };

const SHOWN = 200;

const actions: { value: ActivityAction; label: string }[] = [
  { value: "login", label: "Sign-ins" },
  { value: "login_failed", label: "Failed sign-ins" },
  { value: "logout", label: "Sign-outs" },
  { value: "status_changed", label: "Status changes" },
  { value: "pipeline_updated", label: "Pipeline updates" },
  { value: "note_added", label: "Notes added" },
  { value: "contact_updated", label: "Contact corrections" },
  { value: "lead_deleted", label: "Leads deleted" },
  { value: "export", label: "Exports" },
  { value: "content_saved", label: "Content drafts" },
  { value: "content_published", label: "Content published" },
  { value: "content_reverted", label: "Content restored" },
  { value: "admin_created", label: "Accounts added" },
  { value: "admin_updated", label: "Accounts changed" },
  { value: "password_changed", label: "Password changes" },
];

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  await requireAdmin();
  const sp = await searchParams;
  const raw = Array.isArray(sp.action) ? sp.action[0] : sp.action;
  // Only a known action reaches the store; anything else shows everything.
  const filter = actions.find((a) => a.value === raw);
  const action = filter?.value;

  const store = await getLeadStore();
  const [entries, sections] = await Promise.all([
    // The store filters by action before applying the limit.
    store ? store.activity({ action, limit: SHOWN }) : ([] as ActivityEntry[]),
    contentSections(),
  ]);

  // Only leads that still exist get a link; a deleted one keeps its name as plain text.
  const leadIds = [...new Set(entries.map((e) => e.leadId).filter((id): id is string => Boolean(id)))];
  const liveLeadIds = store && leadIds.length > 0 ? await store.existingLeadIds(leadIds) : new Set<string>();
  const sectionHrefs = Object.fromEntries(sections.map((s) => [s.label, s.adminHref]));

  const count =
    entries.length === SHOWN ? `Latest ${SHOWN}` : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;

  return (
    <div>
      <AdminPageHeader
        title="Activity log"
        description="Who did what in the admin, newest first. Times are India Standard Time. Notes, messages and contact details are never copied into the log."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Keyed so "Clear" (a same-route navigation) remounts the select with the current value. */}
        <form key={action ?? "all"} className="flex flex-wrap items-end gap-2">
          <div className="w-64 max-w-full">
            <label htmlFor="action" className="mb-2 block text-sm font-medium">
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
          </div>
          <Button type="submit" variant="secondary" className="h-12">
            Apply
          </Button>
          {action && (
            <Link href="/admin/activity" className="inline-flex h-12 items-center px-2 text-sm text-mute hover:text-ink">
              Clear
            </Link>
          )}
        </form>
        <p className="text-sm tabular-nums text-mute" role="status">
          {count}
          {filter && ` · ${filter.label}`}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-line p-10 text-center text-sm text-mute">
          {action ? "Nothing of this type yet." : "No activity yet."}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-md border border-line bg-white">
          <ActivityTable
            entries={entries}
            caption={filter ? `Activity log: ${filter.label}` : "Activity log"}
            liveLeadIds={liveLeadIds}
            sectionHrefs={sectionHrefs}
          />
        </div>
      )}
    </div>
  );
}
