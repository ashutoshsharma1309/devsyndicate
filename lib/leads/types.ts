import { eventTypes, orgTypes, type LeadData, type OrgType } from "@/lib/validation/lead";

export const leadStatuses = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "meeting", label: "Meeting Scheduled" },
  { value: "proposal", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export type LeadStatus = (typeof leadStatuses)[number]["value"];

export const isLeadStatus = (v: unknown): v is LeadStatus => leadStatuses.some((s) => s.value === v);

/** Outcome of the team notification email for a stored lead. */
export type NotifyStatus = "sent" | "failed";

export type Lead = Omit<LeadData, "orgType"> & {
  /** "" for leads stored before the form asked for it. */
  orgType: OrgType | "";
  id: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  /** Where the request came from (page path), for later attribution. */
  source: string | null;
  /**
   * Whether the notification email went out. null/undefined: not recorded yet
   * (still sending, no mailer, or a lead stored before this was tracked).
   */
  notifyStatus?: NotifyStatus | null;
  /** YYYY-MM-DD (a day in Asia/Kolkata), or null. */
  nextFollowUp: string | null;
  /** YYYY-MM-DD (a day in Asia/Kolkata), or null. */
  lastContacted: string | null;
  /** ISO 8601 instant, or null. */
  meetingAt: string | null;
  /** Free text, "" when empty. */
  proposalDetails: string;
  /** Free text, "" when empty. */
  lossReason: string;
};

/** Pipeline fields the admin can set. Only the keys present change. */
export type PipelinePatch = {
  status?: LeadStatus;
  nextFollowUp?: string | null;
  lastContacted?: string | null;
  meetingAt?: string | null;
  proposalDetails?: string;
  lossReason?: string;
};

/** Contact fields the admin can correct (privacy policy: right to correction). */
export const contactFields = ["name", "designation", "email", "phone", "institution", "city"] as const;
export type ContactFields = Partial<Pick<Lead, (typeof contactFields)[number]>>;

export type LeadNote = {
  id: string;
  leadId: string;
  body: string;
  createdAt: string;
};

export const leadSorts = ["newest", "oldest", "updated"] as const;
export type LeadSort = (typeof leadSorts)[number];

export type LeadFilters = {
  q?: string;
  status?: LeadStatus;
  eventType?: string;
  /** "unknown" matches leads stored before the field existed. */
  orgType?: OrgType | "unknown";
  /** YYYY-MM-DD, inclusive, as a day in Asia/Kolkata. */
  from?: string;
  /** YYYY-MM-DD, inclusive, as a day in Asia/Kolkata. */
  to?: string;
  /** "newest" (default: created, newest first), "oldest" (created, oldest first), "updated" (last change first). */
  sort?: LeadSort;
  /** Exact organisationKey() of the institution, e.g. from the organisations list. */
  org?: string;
  /** Only leads whose team notification email failed. */
  notifyStatus?: "failed";
  /**
   * Only open leads (not Won or Lost) whose next follow-up is today or earlier (Asia/Kolkata).
   * A closed lead's leftover date isn't a due follow-up. Matches LeadStats.followUpsDue.
   */
  followUpDue?: boolean;
  /** Only leads that aren't Won or Lost. */
  open?: boolean;
  /** 1-based; default 1. */
  page?: number;
  /** Default 50, max 200. */
  pageSize?: number;
};

export type LeadPage = { leads: Lead[]; total: number; page: number; pageSize: number };

export type LeadStats = {
  total: number;
  last30Days: number;
  byStatus: Record<LeadStatus, number>;
  byOrgType: Record<OrgType | "unknown", number>;
  byEventType: Record<string, number>;
  /** The last 12 calendar months in Asia/Kolkata, oldest first, zero-filled. */
  byMonth: { month: string; count: number }[];
  won: number;
  lost: number;
  notifyFailed: number;
  /** Not Won or Lost. */
  open: number;
  /** Status "meeting". */
  meetings: number;
  /** Status "proposal". */
  proposals: number;
  /** Status "new". */
  newLeads: number;
  /** Open leads with a next follow-up today or earlier (Asia/Kolkata); same as the followUpDue filter. */
  followUpsDue: number;
};

/** Leads grouped by institution, so repeat enquiries from one place read as one relationship. */
export type Organisation = {
  /** Normalised institution: lowercase, trimmed, whitespace collapsed, punctuation stripped. */
  key: string;
  /** The most recent spelling. */
  name: string;
  /** The most recent non-empty value. */
  orgType: OrgType | "";
  leadCount: number;
  firstAt: string;
  lastAt: string;
  latestStatus: LeadStatus;
  statuses: Partial<Record<LeadStatus, number>>;
  /** Distinct, non-empty, most recent first. */
  cities: string[];
};

export type ActivityAction =
  | "login"
  | "login_failed"
  | "logout"
  | "status_changed"
  | "note_added"
  | "contact_updated"
  | "lead_deleted"
  | "export"
  | "admin_created"
  | "admin_updated"
  | "password_changed"
  | "pipeline_updated"
  | "content_saved"
  | "content_published"
  | "content_reverted";

export const activityActions = [
  "login",
  "login_failed",
  "logout",
  "status_changed",
  "note_added",
  "contact_updated",
  "lead_deleted",
  "export",
  "admin_created",
  "admin_updated",
  "password_changed",
  "pipeline_updated",
  "content_saved",
  "content_published",
  "content_reverted",
] as const satisfies readonly ActivityAction[];

export const isActivityAction = (v: unknown): v is ActivityAction =>
  (activityActions as readonly unknown[]).includes(v);

export type NewActivity = {
  /** Display form, e.g. "Asha Rao <asha@x.in>" or "jdoe (primary admin)". */
  actor: string;
  action: ActivityAction;
  leadId?: string | null;
  /** Institution name, kept so the entry still reads after the lead is deleted. */
  leadLabel?: string | null;
  /** Never personal data: e.g. "new → contacted", "fields: phone, email", "23 rows". */
  detail?: string | null;
};

export type ActivityEntry = NewActivity & { id: string; at: string };

export type AdminAccount = {
  id: string;
  /** Always lowercase. */
  email: string;
  name: string;
  passwordHash: string;
  disabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type NewLead = LeadData & {
  source: string | null;
  /** Salted hash of the submitter's IP — used only for rate limiting, never displayed. */
  ipHash: string | null;
};

export interface LeadStore {
  readonly kind: "postgres" | "file";
  create(lead: NewLead): Promise<Lead>;
  list(filters?: LeadFilters): Promise<LeadPage>;
  /** Every match, newest first (hard cap 10,000) — for exports and summaries. */
  listAll(filters?: Omit<LeadFilters, "page" | "pageSize">): Promise<Lead[]>;
  get(id: string): Promise<{ lead: Lead; notes: LeadNote[] } | null>;
  updateStatus(id: string, status: LeadStatus): Promise<void>;
  /**
   * Sets pipeline fields; bumps updatedAt. Only the keys present change (null clears a date).
   * Throws Error("invalid_pipeline") if a value fails validatePipelinePatch().
   */
  updatePipeline(id: string, patch: PipelinePatch): Promise<void>;
  /** Which of these lead ids still exist (one query), e.g. to link activity entries. */
  existingLeadIds(ids: string[]): Promise<Set<string>>;
  addNote(leadId: string, body: string): Promise<void>;
  countByStatus(): Promise<Record<LeadStatus, number>>;
  stats(): Promise<LeadStats>;
  /** Sorted by lastAt, newest first. */
  organisations(filters?: { q?: string; orgType?: OrgType | "unknown" }): Promise<Organisation[]>;
  /** Submissions from the same IP hash since `since`. */
  countRecent(ipHash: string, since: Date): Promise<number>;
  /** Records whether the notification email for this lead was sent. Doesn't touch updatedAt. */
  markNotified(id: string, status: NotifyStatus): Promise<void>;
  /** Permanently removes the lead and its notes (privacy policy: right to deletion). */
  delete(id: string): Promise<void>;
  /** Corrects contact details; bumps updatedAt. Only the given fields change. */
  updateContact(id: string, fields: ContactFields): Promise<void>;
  /** Cheap connectivity check. Throws if the store can't be reached. */
  ping(): Promise<void>;

  logActivity(entry: NewActivity): Promise<void>;
  /** Newest first. leadId/action filter before the limit. limit: default 100, max 500. */
  activity(opts?: { leadId?: string; action?: ActivityAction; limit?: number }): Promise<ActivityEntry[]>;

  findAdminByEmail(email: string): Promise<AdminAccount | null>;
  getAdmin(id: string): Promise<AdminAccount | null>;
  listAdmins(): Promise<AdminAccount[]>;
  /** Throws Error("duplicate_email") if the address is taken. */
  createAdmin(input: { email: string; name: string; passwordHash: string }): Promise<AdminAccount>;
  updateAdmin(id: string, patch: { name?: string; passwordHash?: string; disabled?: boolean }): Promise<void>;
  touchAdminLogin(id: string): Promise<void>;
  countActiveAdmins(): Promise<number>;
  /**
   * Disables the account unless it's the last active one, as one atomic step (so two admins
   * disabling each other at once can't leave none). "disabled" also when it already was.
   */
  disableAdminIfNotLast(id: string): Promise<"disabled" | "last" | "missing">;

  /** Also prunes entries older than a day. */
  recordLoginFailure(key: string): Promise<void>;
  countLoginFailures(key: string, since: Date): Promise<number>;
  clearLoginFailures(key: string): Promise<void>;
}

// ── Shared by both stores, so file and Postgres behave identically ──────────

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;
export const MAX_LIST_ALL = 10_000;
export const DEFAULT_ACTIVITY_LIMIT = 100;
export const MAX_ACTIVITY_LIMIT = 500;

/** Highest page number accepted: far past any real data, and keeps the offset a small safe integer. */
export const MAX_PAGE = 100_000;

export function pageOf(f: Pick<LeadFilters, "page" | "pageSize">) {
  const int = (v: unknown, fallback: number) => (Number.isFinite(v) ? Math.floor(v as number) : fallback);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, int(f.pageSize, DEFAULT_PAGE_SIZE)));
  const page = Math.min(MAX_PAGE, Math.max(1, int(f.page, 1)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export const activityLimit = (limit?: number) =>
  Math.min(MAX_ACTIVITY_LIMIT, Math.max(1, Number.isFinite(limit) ? Math.floor(limit!) : DEFAULT_ACTIVITY_LIMIT));

// India has no daylight saving, so a fixed +05:30 offset is exact for every date.
const IST_OFFSET_MS = 330 * 60_000;

/** Years accepted in dates from filters and pipeline fields; anything else is treated as invalid. */
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

/** Start of a YYYY-MM-DD day in Asia/Kolkata as an instant, or null if the date isn't real (or out of range). */
function istDayStart(day: string | undefined | null) {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const year = Number(day.slice(0, 4));
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  const d = new Date(`${day}T00:00:00+05:30`);
  // Rejects 2026-02-31 and similar, which Date would roll over.
  return Number.isNaN(d.getTime()) || new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10) !== day
    ? null
    : d;
}

/** The from/to filters as a half-open [start, end) range of instants. Invalid dates are ignored. */
export function dateRange(f: Pick<LeadFilters, "from" | "to">) {
  const start = istDayStart(f.from);
  const toStart = istDayStart(f.to);
  return { start, end: toStart ? new Date(toStart.getTime() + 24 * 60 * 60_000) : null };
}

/** A real YYYY-MM-DD date between MIN_YEAR and MAX_YEAR. */
export const isIsoDay = (v: unknown): v is string => typeof v === "string" && istDayStart(v) !== null;

/** Today as YYYY-MM-DD in Asia/Kolkata. */
export const istToday = (now = new Date()) => new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

/** An ISO 8601 date-time with an explicit offset (or Z), between MIN_YEAR and MAX_YEAR. Returns it normalised to UTC, or null. */
export function normaliseInstant(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 40) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(v)) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  return year < MIN_YEAR || year > MAX_YEAR ? null : d.toISOString();
}

export const MAX_PROPOSAL_DETAILS = 4000;
export const MAX_LOSS_REASON = 1000;

/** Control characters except tab and newline. */
/** Control characters stripped from free text (keeps \t and \n). */
export const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

/** Free text as the browser counts it: CRLF → LF (a textarea counts a line break as one), no control characters. */
export const normaliseText = (v: string) => v.replace(/\r\n?/g, "\n").replace(CONTROL_CHARS, "").trim();

/**
 * Checks and normalises a pipeline patch (dates, instant, text lengths, status). Both stores run it,
 * and server actions should too, to show field errors. Unknown keys are dropped.
 */
export function validatePipelinePatch(
  input: PipelinePatch,
): { ok: true; patch: PipelinePatch } | { ok: false; fieldErrors: Partial<Record<keyof PipelinePatch, string>> } {
  const patch: PipelinePatch = {};
  const fieldErrors: Partial<Record<keyof PipelinePatch, string>> = {};
  if (input.status !== undefined) {
    if (isLeadStatus(input.status)) patch.status = input.status;
    else fieldErrors.status = "Unknown status.";
  }
  for (const k of ["nextFollowUp", "lastContacted"] as const) {
    const v = input[k];
    if (v === undefined) continue;
    if (v === null || v === "") patch[k] = null;
    else if (isIsoDay(v)) patch[k] = v;
    else fieldErrors[k] = `Enter a real date between ${MIN_YEAR} and ${MAX_YEAR}.`;
  }
  if (input.meetingAt !== undefined) {
    if (input.meetingAt === null || input.meetingAt === "") patch.meetingAt = null;
    else {
      const at = normaliseInstant(input.meetingAt);
      if (at) patch.meetingAt = at;
      else fieldErrors.meetingAt = "Enter a real date and time.";
    }
  }
  const texts = [
    ["proposalDetails", MAX_PROPOSAL_DETAILS],
    ["lossReason", MAX_LOSS_REASON],
  ] as const;
  for (const [k, max] of texts) {
    const v = input[k];
    if (v === undefined) continue;
    if (typeof v !== "string") {
      fieldErrors[k] = "Enter text.";
      continue;
    }
    const clean = normaliseText(v);
    if (clean.length > max) fieldErrors[k] = `Keep this under ${max.toLocaleString("en-IN")} characters.`;
    else patch[k] = clean;
  }
  return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: true, patch };
}

/** Status values that close a lead. */
export const closedStatuses = ["won", "lost"] as const satisfies readonly LeadStatus[];
export const isOpenStatus = (s: LeadStatus) => !(closedStatuses as readonly LeadStatus[]).includes(s);

/** "YYYY-MM" of an instant in Asia/Kolkata. */
export const istMonth = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 7);

/** The last 12 calendar months in Asia/Kolkata, oldest first. */
export function last12Months(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  return Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(y, m - 11 + i, 1)).toISOString().slice(0, 7));
}

/** Escapes LIKE wildcards so a search for "100%" matches literally. */
export const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/** Fields the lead search looks in. */
export const searchFields = ["institution", "name", "email", "city", "state", "phone"] as const;

/** Grouping key for an institution: "I.I.T.  Delhi " and "iit delhi" are the same place. */
export function organisationKey(institution: string) {
  const key = institution
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  // A name that is only punctuation would otherwise group with every other such name.
  return key || institution.trim().toLowerCase();
}

export const zeroByStatus = () => Object.fromEntries(leadStatuses.map((s) => [s.value, 0])) as Record<LeadStatus, number>;
export const zeroByOrgType = () =>
  Object.fromEntries([...orgTypes.map((o) => [o.value, 0]), ["unknown", 0]]) as Record<OrgType | "unknown", number>;
/** Current enquiry types start at zero; older types appear only when stored leads use them. */
export const zeroByEventType = (): Record<string, number> => Object.fromEntries(eventTypes.map((t) => [t.value, 0]));

/** Stats with every count at zero, e.g. for a page rendered without a store. */
export const emptyLeadStats = (): LeadStats => ({
  total: 0,
  last30Days: 0,
  byStatus: zeroByStatus(),
  byOrgType: zeroByOrgType(),
  byEventType: zeroByEventType(),
  byMonth: last12Months().map((month) => ({ month, count: 0 })),
  won: 0,
  lost: 0,
  notifyFailed: 0,
  open: 0,
  meetings: 0,
  proposals: 0,
  newLeads: 0,
  followUpsDue: 0,
});

type OrgRow = Pick<Lead, "institution" | "orgType" | "status" | "city" | "createdAt">;

/**
 * Groups leads (newest first) into organisations, then applies the filters to
 * the groups, so a search never splits one organisation's history.
 */
export function groupOrganisations(rows: OrgRow[], f: { q?: string; orgType?: OrgType | "unknown" } = {}): Organisation[] {
  const byKey = new Map<string, Organisation>();
  const seenCities = new Map<string, Set<string>>();
  for (const r of rows) {
    const key = organisationKey(r.institution);
    let org = byKey.get(key);
    if (!org) {
      org = {
        key,
        name: r.institution,
        orgType: "",
        leadCount: 0,
        firstAt: r.createdAt,
        lastAt: r.createdAt,
        latestStatus: r.status,
        statuses: {},
        cities: [],
      };
      byKey.set(key, org);
      seenCities.set(key, new Set());
    }
    org.leadCount++;
    if (!org.orgType && r.orgType) org.orgType = r.orgType;
    if (r.createdAt < org.firstAt) org.firstAt = r.createdAt;
    if (r.createdAt > org.lastAt) {
      // Only if the rows weren't newest-first after all.
      org.lastAt = r.createdAt;
      org.name = r.institution;
      org.latestStatus = r.status;
    }
    org.statuses[r.status] = (org.statuses[r.status] ?? 0) + 1;
    const city = r.city?.trim();
    const seen = seenCities.get(key)!;
    if (city && !seen.has(city.toLowerCase())) {
      seen.add(city.toLowerCase());
      org.cities.push(city);
    }
  }

  const q = f.q?.trim().toLowerCase();
  const qKey = q ? organisationKey(q) : "";
  return [...byKey.values()]
    .filter((o) => !f.orgType || (f.orgType === "unknown" ? o.orgType === "" : o.orgType === f.orgType))
    .filter(
      (o) =>
        !q ||
        o.name.toLowerCase().includes(q) ||
        (qKey && o.key.includes(qKey)) ||
        o.cities.some((c) => c.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}
