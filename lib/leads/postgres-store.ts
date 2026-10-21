import "server-only";
import postgres from "postgres";
import {
  activityLimit,
  contactFields,
  dateRange,
  groupOrganisations,
  istToday,
  last12Months,
  likePattern,
  MAX_LIST_ALL,
  organisationKey,
  pageOf,
  validatePipelinePatch,
  zeroByEventType,
  zeroByOrgType,
  zeroByStatus,
  type ActivityAction,
  type ActivityEntry,
  type AdminAccount,
  type Lead,
  type LeadFilters,
  type LeadNote,
  type LeadStatus,
  type LeadStore,
  type NewLead,
  type NotifyStatus,
} from "./types";

type Row = {
  id: string;
  created_at: Date;
  updated_at: Date;
  status: LeadStatus;
  institution: string;
  city: string;
  state: string;
  website: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  event_type: string;
  participants: string;
  format: string;
  timeline: string;
  theme: string;
  message: string;
  source: string | null;
  /** Absent until `npm run db:setup` has added the columns. */
  notify_status?: NotifyStatus | null;
  org_type?: string;
  next_follow_up?: Date | string | null;
  last_contacted?: Date | string | null;
  meeting_at?: Date | null;
  proposal_details?: string;
  loss_reason?: string;
};

type AdminRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  disabled: boolean;
  created_at: Date;
  last_login_at: Date | null;
};

type ActivityRow = {
  id: string;
  at: Date;
  actor: string;
  action: ActivityAction;
  lead_id: string | null;
  lead_label: string | null;
  detail: string | null;
};

/**
 * A `date` column as YYYY-MM-DD. postgres.js parses dates with `new Date("YYYY-MM-DD")`,
 * which is midnight UTC, so the UTC date is the stored day.
 */
const toDay = (v: Date | string | null | undefined) =>
  v == null ? null : v instanceof Date ? (Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10)) : String(v).slice(0, 10);

const toLead = (r: Row): Lead => ({
  id: r.id,
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
  status: r.status,
  institution: r.institution,
  city: r.city,
  state: r.state as Lead["state"],
  website: r.website,
  name: r.name,
  designation: r.designation,
  email: r.email,
  phone: r.phone,
  eventType: r.event_type as Lead["eventType"],
  orgType: (r.org_type ?? "") as Lead["orgType"],
  participants: r.participants as Lead["participants"],
  format: r.format as Lead["format"],
  timeline: r.timeline as Lead["timeline"],
  theme: r.theme,
  message: r.message,
  source: r.source,
  notifyStatus: r.notify_status ?? null,
  nextFollowUp: toDay(r.next_follow_up),
  lastContacted: toDay(r.last_contacted),
  meetingAt: r.meeting_at ? r.meeting_at.toISOString() : null,
  proposalDetails: r.proposal_details ?? "",
  lossReason: r.loss_reason ?? "",
});

const toAdmin = (r: AdminRow): AdminAccount => ({
  id: r.id,
  email: r.email,
  name: r.name,
  passwordHash: r.password_hash,
  disabled: r.disabled,
  createdAt: r.created_at.toISOString(),
  lastLoginAt: r.last_login_at?.toISOString() ?? null,
});

const toActivity = (r: ActivityRow): ActivityEntry => ({
  id: r.id,
  at: r.at.toISOString(),
  actor: r.actor,
  action: r.action,
  leadId: r.lead_id,
  leadLabel: r.lead_label,
  detail: r.detail,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A uuid[] for `= any(...)` as one text parameter (postgres.js doesn't serialise a plain JS array
 * of unknown type). Only validated UUIDs go in, so the comma split is exact; [] matches nothing.
 */
function uuidList(ids: string[]) {
  return db()`string_to_array(${ids.filter((id) => UUID.test(id)).join(",")}, ',')::uuid[]`;
}

/** Postgres error codes we handle: a missing table or column (db:setup not run yet) and a unique violation. */
const pgCode = (err: unknown) => (err as { code?: string } | null)?.code;

// One connection pool per server process (survives dev hot reloads).
const globalForDb = globalThis as unknown as { __dsSql?: postgres.Sql };

function db() {
  if (!globalForDb.__dsSql) {
    globalForDb.__dsSql = postgres(process.env.DATABASE_URL!, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      // Required by most managed Postgres providers; disable with DATABASE_SSL=disable for local databases.
      ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
      prepare: false,
    });
  }
  return globalForDb.__dsSql;
}

type ListFilters = Omit<LeadFilters, "page" | "pageSize">;

/**
 * The lead ids whose institution has this organisationKey(). Computed in JS, so the grouping is
 * exactly the organisations list's (Postgres regex classes depend on the database locale).
 * null when the filter isn't set.
 */
async function orgLeadIds(sql: postgres.Sql, f: ListFilters): Promise<string[] | null> {
  if (!f.org) return null;
  const rows = await sql<{ id: string; institution: string }[]>`
    select id, institution from leads order by created_at desc limit ${MAX_LIST_ALL}`;
  return rows.filter((r) => organisationKey(r.institution) === f.org).map((r) => r.id);
}

/** Filters as a parameterised WHERE clause. Dates are Asia/Kolkata days, resolved to instants in JS. */
function whereClause(sql: postgres.Sql, f: ListFilters, orgIds: string[] | null) {
  const q = f.q?.trim() ? likePattern(f.q.trim()) : null;
  const { start, end } = dateRange(f);
  return sql`
    where true
      ${f.status ? sql`and status = ${f.status}` : sql``}
      ${f.eventType ? sql`and event_type = ${f.eventType}` : sql``}
      ${f.orgType ? sql`and org_type = ${f.orgType === "unknown" ? "" : f.orgType}` : sql``}
      ${start ? sql`and created_at >= ${start}` : sql``}
      ${end ? sql`and created_at < ${end}` : sql``}
      ${
        q
          ? sql`and (institution ilike ${q} or name ilike ${q} or email ilike ${q} or city ilike ${q} or state ilike ${q} or phone ilike ${q})`
          : sql``
      }
      ${orgIds ? sql`and id = any(${uuidList(orgIds)})` : sql``}
      ${f.notifyStatus ? sql`and notify_status = ${f.notifyStatus}` : sql``}
      ${f.open || f.followUpDue ? sql`and status not in ('won', 'lost')` : sql``}
      ${f.followUpDue ? sql`and next_follow_up <= ${istToday()}::date` : sql``}`;
}

/** ORDER BY for a sort option; fixed fragments only. */
function orderBy(sql: postgres.Sql, sort: LeadFilters["sort"]) {
  if (sort === "oldest") return sql`order by created_at asc`;
  if (sort === "updated") return sql`order by updated_at desc, created_at desc`;
  return sql`order by created_at desc`;
}

export const postgresStore: LeadStore = {
  kind: "postgres",

  async create(l: NewLead) {
    const sql = db();
    try {
      const [row] = await sql<Row[]>`
        insert into leads (
          institution, city, state, website, name, designation, email, phone,
          event_type, org_type, participants, format, timeline, theme, message, source, ip_hash
        ) values (
          ${l.institution}, ${l.city}, ${l.state}, ${l.website}, ${l.name}, ${l.designation}, ${l.email}, ${l.phone},
          ${l.eventType}, ${l.orgType}, ${l.participants}, ${l.format}, ${l.timeline}, ${l.theme}, ${l.message}, ${l.source}, ${l.ipHash}
        )
        returning *`;
      return toLead(row);
    } catch (err) {
      // Deployed before `npm run db:setup` added org_type: still store the lead rather than lose it.
      if (pgCode(err) !== "42703") throw err;
      console.error("[leads] leads.org_type is missing; run npm run db:setup. Storing the lead without it.");
      const [row] = await sql<Row[]>`
        insert into leads (
          institution, city, state, website, name, designation, email, phone,
          event_type, participants, format, timeline, theme, message, source, ip_hash
        ) values (
          ${l.institution}, ${l.city}, ${l.state}, ${l.website}, ${l.name}, ${l.designation}, ${l.email}, ${l.phone},
          ${l.eventType}, ${l.participants}, ${l.format}, ${l.timeline}, ${l.theme}, ${l.message}, ${l.source}, ${l.ipHash}
        )
        returning *`;
      return toLead(row);
    }
  },

  async list(f: LeadFilters = {}) {
    const sql = db();
    const { page, pageSize, offset } = pageOf(f);
    const orgIds = await orgLeadIds(sql, f);
    // A fresh fragment per query: postgres.js fragments are single-use query objects.
    const [rows, [count]] = await Promise.all([
      sql<Row[]>`select * from leads ${whereClause(sql, f, orgIds)} ${orderBy(sql, f.sort)} limit ${pageSize} offset ${offset}`,
      sql<{ n: number }[]>`select count(*)::int as n from leads ${whereClause(sql, f, orgIds)}`,
    ]);
    return { leads: rows.map(toLead), total: count?.n ?? 0, page, pageSize };
  },

  async listAll(f = {}) {
    const sql = db();
    const orgIds = await orgLeadIds(sql, f);
    const rows = await sql<Row[]>`
      select * from leads ${whereClause(sql, f, orgIds)} ${orderBy(sql, f.sort)} limit ${MAX_LIST_ALL}`;
    return rows.map(toLead);
  },

  async get(id) {
    if (!UUID.test(id)) return null;
    const sql = db();
    const [row] = await sql<Row[]>`select * from leads where id = ${id}`;
    if (!row) return null;
    const notes = await sql<{ id: string; lead_id: string; body: string; created_at: Date }[]>`
      select * from lead_notes where lead_id = ${id} order by created_at desc`;
    return {
      lead: toLead(row),
      notes: notes.map(
        (n): LeadNote => ({ id: n.id, leadId: n.lead_id, body: n.body, createdAt: n.created_at.toISOString() }),
      ),
    };
  },

  async updateStatus(id, status) {
    if (!UUID.test(id)) return;
    await db()`update leads set status = ${status}, updated_at = now() where id = ${id}`;
  },

  async updatePipeline(id, input) {
    const checked = validatePipelinePatch(input);
    if (!checked.ok) throw new Error("invalid_pipeline");
    const p = checked.patch;
    if (!UUID.test(id)) return;
    const sql = db();
    // Fixed column names; each fragment is present only for a key in the patch.
    await sql`
      update leads set updated_at = now()
        ${p.status !== undefined ? sql`, status = ${p.status}` : sql``}
        ${p.nextFollowUp !== undefined ? sql`, next_follow_up = ${p.nextFollowUp}::date` : sql``}
        ${p.lastContacted !== undefined ? sql`, last_contacted = ${p.lastContacted}::date` : sql``}
        ${p.meetingAt !== undefined ? sql`, meeting_at = ${p.meetingAt}::timestamptz` : sql``}
        ${p.proposalDetails !== undefined ? sql`, proposal_details = ${p.proposalDetails}` : sql``}
        ${p.lossReason !== undefined ? sql`, loss_reason = ${p.lossReason}` : sql``}
      where id = ${id}`;
  },

  async existingLeadIds(ids) {
    const valid = [...new Set(ids)].filter((id) => UUID.test(id));
    if (valid.length === 0) return new Set();
    const rows = await db()<{ id: string }[]>`select id from leads where id = any(${uuidList(valid)})`;
    return new Set(rows.map((r) => r.id));
  },

  async addNote(leadId, body) {
    if (!UUID.test(leadId)) return;
    const sql = db();
    await sql.begin(async (tx) => {
      await tx`insert into lead_notes (lead_id, body) values (${leadId}, ${body})`;
      await tx`update leads set updated_at = now() where id = ${leadId}`;
    });
  },

  async countByStatus() {
    const rows = await db()<{ status: LeadStatus; n: number }[]>`
      select status, count(*)::int as n from leads group by status`;
    const out = zeroByStatus();
    for (const r of rows) out[r.status] = r.n;
    return out;
  },

  async stats() {
    const sql = db();
    const [[totals], statusRows, orgRows, eventRows, monthRows, followUpsDue] = await Promise.all([
      sql<{ total: number; last30: number; failed: number }[]>`
        select count(*)::int as total,
               (count(*) filter (where created_at >= now() - interval '30 days'))::int as last30,
               (count(*) filter (where notify_status = 'failed'))::int as failed
        from leads`,
      sql<{ k: LeadStatus; n: number }[]>`select status as k, count(*)::int as n from leads group by status`,
      sql<{ k: string; n: number }[]>`select org_type as k, count(*)::int as n from leads group by org_type`,
      sql<{ k: string; n: number }[]>`select event_type as k, count(*)::int as n from leads group by event_type`,
      // Calendar months in Asia/Kolkata: truncate local time, then convert the bounds back to instants.
      sql<{ month: string; n: number }[]>`
        with bounds as (
          select date_trunc('month', now() at time zone 'Asia/Kolkata') as this_month
        ), months as (
          select to_char(m, 'YYYY-MM') as month
          from bounds, generate_series(this_month - interval '11 months', this_month, interval '1 month') as m
        ), counts as (
          select to_char(date_trunc('month', created_at at time zone 'Asia/Kolkata'), 'YYYY-MM') as month, count(*)::int as n
          from leads, bounds
          where created_at >= (this_month - interval '11 months') at time zone 'Asia/Kolkata'
          group by 1
        )
        select months.month, coalesce(counts.n, 0)::int as n
        from months left join counts using (month)
        order by months.month`,
      // Same rule as the followUpDue filter. 0 until `npm run db:setup` adds the column.
      sql<{ n: number }[]>`
        select count(*)::int as n from leads
        where status not in ('won', 'lost') and next_follow_up <= ${istToday()}::date`.then(
        ([r]) => r?.n ?? 0,
        (err) => {
          if (pgCode(err) === "42703") return 0;
          throw err;
        },
      ),
    ]);

    const byStatus = zeroByStatus();
    for (const r of statusRows) byStatus[r.k] = r.n;
    const byOrgType = zeroByOrgType();
    for (const r of orgRows) {
      const k = (r.k || "unknown") as keyof typeof byOrgType;
      byOrgType[k] = (byOrgType[k] ?? 0) + r.n;
    }
    const byEventType = zeroByEventType();
    for (const r of eventRows) byEventType[r.k] = r.n;
    // The database's clock decides the months; fall back to ours if it ever returns a different count.
    const byMonth =
      monthRows.length === 12
        ? monthRows.map((r) => ({ month: r.month, count: r.n }))
        : last12Months().map((month) => ({ month, count: monthRows.find((r) => r.month === month)?.n ?? 0 }));

    const total = totals?.total ?? 0;
    return {
      total,
      last30Days: totals?.last30 ?? 0,
      byStatus,
      byOrgType,
      byEventType,
      byMonth,
      won: byStatus.won,
      lost: byStatus.lost,
      notifyFailed: totals?.failed ?? 0,
      open: total - byStatus.won - byStatus.lost,
      meetings: byStatus.meeting,
      proposals: byStatus.proposal,
      newLeads: byStatus.new,
      followUpsDue,
    };
  },

  async organisations(f = {}) {
    // Grouped in JS (shared with the file store) so both stores normalise names identically.
    const rows = await db()<Pick<Row, "institution" | "org_type" | "status" | "city" | "created_at">[]>`
      select institution, org_type, status, city, created_at
      from leads order by created_at desc limit ${MAX_LIST_ALL}`;
    return groupOrganisations(
      rows.map((r) => ({
        institution: r.institution,
        orgType: (r.org_type ?? "") as Lead["orgType"],
        status: r.status,
        city: r.city,
        createdAt: r.created_at.toISOString(),
      })),
      f,
    );
  },

  async countRecent(ipHash, since) {
    const [r] = await db()<{ n: number }[]>`
      select count(*)::int as n from leads where ip_hash = ${ipHash} and created_at >= ${since}`;
    return r?.n ?? 0;
  },

  async markNotified(id, status) {
    if (!UUID.test(id)) return;
    await db()`update leads set notify_status = ${status} where id = ${id}`;
  },

  async delete(id) {
    if (!UUID.test(id)) return;
    // lead_notes.lead_id is `on delete cascade`, so the notes go with it.
    await db()`delete from leads where id = ${id}`;
  },

  async updateContact(id, fields) {
    if (!UUID.test(id)) return;
    // Whitelist the columns: the keys are interpolated as identifiers.
    const keys = contactFields.filter((k) => fields[k] !== undefined);
    if (keys.length === 0) return;
    const sql = db();
    await sql`update leads set ${sql(fields, keys)}, updated_at = now() where id = ${id}`;
  },

  async ping() {
    await db()`select 1`;
  },

  async logActivity(e) {
    // A non-UUID lead id (e.g. from a tampered form) is dropped rather than failing the insert.
    const leadId = e.leadId && UUID.test(e.leadId) ? e.leadId : null;
    await db()`
      insert into admin_activity (actor, action, lead_id, lead_label, detail)
      values (${e.actor}, ${e.action}, ${leadId}, ${e.leadLabel ?? null}, ${e.detail ?? null})`;
  },

  async activity(opts = {}) {
    if (opts.leadId && !UUID.test(opts.leadId)) return [];
    const sql = db();
    const rows = await sql<ActivityRow[]>`
      select * from admin_activity
      where true
        ${opts.leadId ? sql`and lead_id = ${opts.leadId}` : sql``}
        ${opts.action ? sql`and action = ${opts.action}` : sql``}
      order by at desc
      limit ${activityLimit(opts.limit)}`;
    return rows.map(toActivity);
  },

  async findAdminByEmail(email) {
    const [row] = await db()<AdminRow[]>`select * from admins where email = ${email.trim().toLowerCase()}`;
    return row ? toAdmin(row) : null;
  },

  async getAdmin(id) {
    if (!UUID.test(id)) return null;
    const [row] = await db()<AdminRow[]>`select * from admins where id = ${id}`;
    return row ? toAdmin(row) : null;
  },

  async listAdmins() {
    const rows = await db()<AdminRow[]>`select * from admins order by created_at`;
    return rows.map(toAdmin);
  },

  async createAdmin({ email, name, passwordHash }) {
    try {
      const [row] = await db()<AdminRow[]>`
        insert into admins (email, name, password_hash)
        values (${email.trim().toLowerCase()}, ${name}, ${passwordHash})
        returning *`;
      return toAdmin(row);
    } catch (err) {
      if (pgCode(err) === "23505") throw new Error("duplicate_email");
      throw err;
    }
  },

  async updateAdmin(id, patch) {
    if (!UUID.test(id)) return;
    // Fixed column names; only the values come from the caller.
    const cols: Record<string, string | boolean> = {};
    if (patch.name !== undefined) cols.name = patch.name;
    if (patch.passwordHash !== undefined) cols.password_hash = patch.passwordHash;
    if (patch.disabled !== undefined) cols.disabled = patch.disabled;
    const keys = Object.keys(cols);
    if (keys.length === 0) return;
    const sql = db();
    await sql`update admins set ${sql(cols, keys)} where id = ${id}`;
  },

  async touchAdminLogin(id) {
    if (!UUID.test(id)) return;
    await db()`update admins set last_login_at = now() where id = ${id}`;
  },

  async countActiveAdmins() {
    try {
      const [r] = await db()<{ n: number }[]>`select count(*)::int as n from admins where not disabled`;
      return r?.n ?? 0;
    } catch (err) {
      // Before `npm run db:setup` adds the table there are no named admins: bootstrap sign-in still works.
      if (pgCode(err) === "42P01") return 0;
      throw err;
    }
  },

  async disableAdminIfNotLast(id) {
    if (!UUID.test(id)) return "missing";
    return db().begin(async (tx) => {
      // Serialises concurrent disables, so two can't both pass the "more than one active" check.
      await tx`select pg_advisory_xact_lock(hashtext('ds:admins:disable'))`;
      const [row] = await tx<{ disabled: boolean }[]>`select disabled from admins where id = ${id}`;
      if (!row) return "missing" as const;
      if (row.disabled) return "disabled" as const;
      const [active] = await tx<{ n: number }[]>`select count(*)::int as n from admins where not disabled`;
      if ((active?.n ?? 0) <= 1) return "last" as const;
      await tx`update admins set disabled = true where id = ${id}`;
      return "disabled" as const;
    });
  },

  async recordLoginFailure(key) {
    const sql = db();
    await sql.begin(async (tx) => {
      await tx`insert into login_failures (key) values (${key})`;
      await tx`delete from login_failures where at < now() - interval '1 day'`;
    });
  },

  async countLoginFailures(key, since) {
    const [r] = await db()<{ n: number }[]>`
      select count(*)::int as n from login_failures where key = ${key} and at >= ${since}`;
    return r?.n ?? 0;
  },

  async clearLoginFailures(key) {
    await db()`delete from login_failures where key = ${key}`;
  },
};
