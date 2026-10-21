import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadFilterPanel } from "@/components/admin/lead-filter-panel";
import { Input, Select } from "@/components/ui/field";
import {
  dateRange,
  isLeadStatus,
  leadSorts,
  leadStatuses,
  type LeadFilters,
  type LeadSort,
  type LeadStatus,
} from "@/lib/leads/types";
import { cn } from "@/lib/utils";
import { allEventTypes, orgTypes, type OrgType } from "@/lib/validation/lead";

/** The leads filters as they appear in the URL; "" means "any" (or, for sort, newest first). */
export type LeadFilterValues = {
  q: string;
  status: LeadStatus | "";
  orgType: OrgType | "unknown" | "";
  type: string;
  from: string;
  to: string;
  /** Exact organisationKey(), set by the organisations list. */
  org: string;
  sort: LeadSort | "";
  open: "1" | "";
  followUpDue: "1" | "";
  notifyStatus: "failed" | "";
};

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

// dateRange() rejects malformed, impossible (2026-02-31) and out-of-range dates, so junk never reaches the URL or the store.
const validDay = (v: string) => (dateRange({ from: v }).start ? v : "");

// A checkbox sends "1"; accept the usual spellings of "on" from hand-written URLs too.
const flag = (v: string): "1" | "" => (["1", "true", "on", "yes"].includes(v.toLowerCase()) ? "1" : "");

/** Control characters never belong in a filter; the organisation key is lowercase text. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export const sortLabels: Record<LeadSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  updated: "Last updated",
};

/**
 * Reads the filters from GET params, dropping anything that isn't a known value,
 * so the page and the CSV export always agree on what a URL means.
 */
export function readLeadFilters(sp: Params): { values: LeadFilterValues; filters: Omit<LeadFilters, "page" | "pageSize"> } {
  const one = (k: string) => {
    const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const status = one("status");
  const orgType = one("orgType");
  const type = one("type");
  const sort = one("sort");
  const values: LeadFilterValues = {
    q: one("q").replace(CONTROL_CHARS, "").trim().slice(0, 100),
    status: isLeadStatus(status) ? status : "",
    orgType: orgType === "unknown" || orgTypes.some((o) => o.value === orgType) ? (orgType as OrgType | "unknown") : "",
    type: allEventTypes.some((t) => t.value === type) ? type : "",
    from: validDay(one("from")),
    to: validDay(one("to")),
    org: one("org").replace(CONTROL_CHARS, "").trim().slice(0, 200),
    // "newest" is the default, so it never needs to be in the URL.
    sort: (leadSorts as readonly string[]).includes(sort) && sort !== "newest" ? (sort as LeadSort) : "",
    open: flag(one("open")),
    followUpDue: flag(one("followUpDue")),
    notifyStatus: one("notifyStatus") === "failed" ? "failed" : "",
  };
  return {
    values,
    filters: {
      q: values.q || undefined,
      status: values.status || undefined,
      orgType: values.orgType || undefined,
      eventType: values.type || undefined,
      from: values.from || undefined,
      to: values.to || undefined,
      org: values.org || undefined,
      sort: values.sort || undefined,
      notifyStatus: values.notifyStatus || undefined,
      open: values.open === "1" || undefined,
      followUpDue: values.followUpDue === "1" || undefined,
    },
  };
}

/** Whether anything narrows the list. The sort order alone doesn't. */
export const hasLeadFilters = (v: LeadFilterValues) =>
  Object.entries(v).some(([k, val]) => k !== "sort" && Boolean(val));

/** "?q=…&status=…" with only the values that are set (plus `page` above 1), or "". */
export function leadFilterQuery(v: LeadFilterValues, page = 1, without: (keyof LeadFilterValues)[] = []) {
  const p = new URLSearchParams();
  for (const [k, val] of Object.entries(v)) if (val && !without.includes(k as keyof LeadFilterValues)) p.set(k, val);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

const fieldLabel = "t-label mb-1.5 block text-mute";

/**
 * Plain GET form: works before (or without) JavaScript, and every filtered view is a shareable URL.
 * `orgLabel` is the organisation's display name when the list is narrowed to one.
 */
export function LeadFilterBar({ values, orgLabel }: { values: LeadFilterValues; orgLabel?: string }) {
  const filtered = hasLeadFilters(values);
  // Filters folded away on phones; search and organisation stay visible, so they don't count.
  const activeCount = (["status", "orgType", "type", "from", "to", "sort", "open", "followUpDue", "notifyStatus"] as const).filter(
    (k) => values[k],
  ).length;
  return (
    <form role="search" aria-label="Filter leads" method="get" action="/admin/leads" className="rounded-md border border-line bg-white p-4 sm:p-5">
      {values.org && (
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line pb-4 text-sm">
          <input type="hidden" name="org" value={values.org} />
          <span className="text-mute">Organisation</span>
          <span className="inline-flex max-w-full items-center gap-1 rounded-xs border border-line bg-paper py-0.5 pl-2 pr-0.5">
            <span className="truncate font-medium">{orgLabel || values.org}</span>
            <Link
              href={`/admin/leads${leadFilterQuery(values, 1, ["org"])}`}
              className="grid size-6 shrink-0 place-items-center rounded-xs text-mute hover:bg-ink/5 hover:text-ink"
            >
              <X aria-hidden="true" className="size-3.5" />
              <span className="sr-only">Show all organisations</span>
            </Link>
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="sm:col-span-2 lg:col-span-6">
          <label htmlFor="q" className={fieldLabel}>
            Search
          </label>
          <Input
            id="q"
            name="q"
            type="search"
            maxLength={100}
            defaultValue={values.q}
            placeholder="Institution, contact person or email"
          />
        </div>
        <LeadFilterPanel active={activeCount}>
          <div className="grid gap-4 sm:grid-cols-2 lg:contents">
            <div className="lg:col-span-2">
              <label htmlFor="status" className={fieldLabel}>
                Status
              </label>
              <Select id="status" name="status" defaultValue={values.status}>
                <option value="">All statuses</option>
                {leadStatuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="type" className={fieldLabel}>
                Enquiry type
              </label>
              <Select id="type" name="type" defaultValue={values.type}>
                <option value="">All types</option>
                {allEventTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="orgType" className={fieldLabel}>
                Organisation type
              </label>
              <Select id="orgType" name="orgType" defaultValue={values.orgType}>
                <option value="">All types</option>
                {orgTypes.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                <option value="unknown">Not recorded</option>
              </Select>
            </div>

            {/* Dates are days in India time, inclusive at both ends. */}
            <fieldset className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-4">
              <legend className="sr-only">Received between (India time)</legend>
              <div>
                <label htmlFor="from" className={fieldLabel}>
                  Received from
                </label>
                <Input id="from" name="from" type="date" min="2000-01-01" max={values.to || "2100-12-31"} defaultValue={values.from} />
              </div>
              <div>
                <label htmlFor="to" className={fieldLabel}>
                  Received to
                </label>
                <Input id="to" name="to" type="date" min={values.from || "2000-01-01"} max="2100-12-31" defaultValue={values.to} />
              </div>
            </fieldset>
            <div className="lg:col-span-2">
              <label htmlFor="sort" className={fieldLabel}>
                Sort
              </label>
              <Select id="sort" name="sort" defaultValue={values.sort || "newest"}>
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <fieldset className="lg:col-span-6">
              <legend className={fieldLabel}>Show only</legend>
              <div className="flex min-h-12 flex-wrap items-center gap-x-5 gap-y-2">
                <Check name="open" label="Open leads" checked={values.open === "1"} hint="Not Won or Lost" />
                <Check name="followUpDue" label="Follow-up due" checked={values.followUpDue === "1"} hint="Today or earlier" />
                <Check name="notifyStatus" value="failed" label="Email failed" checked={values.notifyStatus === "failed"} />
              </div>
            </fieldset>
          </div>
        </LeadFilterPanel>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {(filtered || values.sort) && (
          <Link href="/admin/leads" className="inline-flex h-11 items-center px-2 text-sm text-mute hover:text-ink">
            Clear all
          </Link>
        )}
      </div>
    </form>
  );
}

function Check({
  name,
  label,
  checked,
  value = "1",
  hint,
}: {
  name: string;
  label: string;
  checked: boolean;
  value?: string;
  hint?: string;
}) {
  const id = `filter-${name}`;
  return (
    <label htmlFor={id} className={cn("inline-flex min-h-6 cursor-pointer items-center gap-2 text-sm")}>
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="size-4 shrink-0 rounded-xs border-ink/47 accent-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      />
      <span>
        {label}
        {hint && <span className="text-mute"> · {hint}</span>}
      </span>
    </label>
  );
}
