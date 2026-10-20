import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { dateRange, isLeadStatus, leadStatuses, type LeadFilters, type LeadStatus } from "@/lib/leads/types";
import { allEventTypes, orgTypes, type OrgType } from "@/lib/validation/lead";

/** The leads filters as they appear in the URL; "" means "any". */
export type LeadFilterValues = {
  q: string;
  status: LeadStatus | "";
  orgType: OrgType | "unknown" | "";
  type: string;
  from: string;
  to: string;
};

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

// dateRange() rejects malformed and impossible dates (2026-02-31), so junk never reaches the URL or the store.
const validDay = (v: string) => (dateRange({ from: v }).start ? v : "");

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
  const values: LeadFilterValues = {
    q: one("q").trim().slice(0, 100),
    status: isLeadStatus(status) ? status : "",
    orgType: orgType === "unknown" || orgTypes.some((o) => o.value === orgType) ? (orgType as OrgType | "unknown") : "",
    type: allEventTypes.some((t) => t.value === type) ? type : "",
    from: validDay(one("from")),
    to: validDay(one("to")),
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
    },
  };
}

export const hasLeadFilters = (v: LeadFilterValues) => Object.values(v).some(Boolean);

/** "?q=…&status=…" with only the filters that are set (plus `page` above 1), or "". */
export function leadFilterQuery(v: LeadFilterValues, page = 1) {
  const p = new URLSearchParams();
  for (const [k, val] of Object.entries(v)) if (val) p.set(k, val);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Plain GET form: works before (or without) JavaScript, and every filtered view is a shareable URL. */
export function LeadFilterBar({ values }: { values: LeadFilterValues }) {
  return (
    <form role="search" method="get" action="/admin/leads" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="sm:col-span-2 lg:col-span-3">
        <label htmlFor="q" className="sr-only">
          Search leads
        </label>
        <Input id="q" name="q" type="search" defaultValue={values.q} placeholder="Search institution, name, email, city…" />
      </div>
      <div>
        <label htmlFor="status" className="sr-only">
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
      <div>
        <label htmlFor="orgType" className="sr-only">
          Organisation type
        </label>
        <Select id="orgType" name="orgType" defaultValue={values.orgType}>
          <option value="">All organisations</option>
          {orgTypes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value="unknown">Not recorded</option>
        </Select>
      </div>
      <div>
        <label htmlFor="type" className="sr-only">
          Enquiry type
        </label>
        <Select id="type" name="type" defaultValue={values.type}>
          <option value="">All enquiry types</option>
          {allEventTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Dates are days in India time, inclusive at both ends. */}
      <fieldset className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-3">
        <legend className="sr-only">Received between (India time)</legend>
        <div className="relative">
          <label htmlFor="from" className="t-label pointer-events-none absolute left-3.5 top-1.5 text-mute">
            From
          </label>
          <Input id="from" name="from" type="date" defaultValue={values.from} max={values.to || undefined} className="pt-4" />
        </div>
        <div className="relative">
          <label htmlFor="to" className="t-label pointer-events-none absolute left-3.5 top-1.5 text-mute">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={values.to} min={values.from || undefined} className="pt-4" />
        </div>
      </fieldset>
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="submit" variant="secondary" className="h-12">
          Apply filters
        </Button>
        {hasLeadFilters(values) && (
          <Link href="/admin/leads" className="inline-flex h-12 items-center px-2 text-sm text-mute hover:text-ink">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
