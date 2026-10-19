import "server-only";
import postgres from "postgres";
import {
  contactFields,
  leadStatuses,
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
  /** Absent until `npm run db:setup` has added the column. */
  notify_status?: NotifyStatus | null;
};

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
  participants: r.participants as Lead["participants"],
  format: r.format as Lead["format"],
  timeline: r.timeline as Lead["timeline"],
  theme: r.theme,
  message: r.message,
  source: r.source,
  notifyStatus: r.notify_status ?? null,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export const postgresStore: LeadStore = {
  kind: "postgres",

  async create(l: NewLead) {
    const sql = db();
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
  },

  async list(f: LeadFilters = {}) {
    const sql = db();
    const q = f.q?.trim() ? `%${f.q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const rows = await sql<Row[]>`
      select * from leads
      where true
        ${f.status ? sql`and status = ${f.status}` : sql``}
        ${f.eventType ? sql`and event_type = ${f.eventType}` : sql``}
        ${
          q
            ? sql`and (institution ilike ${q} or name ilike ${q} or email ilike ${q} or city ilike ${q} or state ilike ${q} or phone ilike ${q})`
            : sql``
        }
      order by created_at desc
      limit 500`;
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
    const out = Object.fromEntries(leadStatuses.map((s) => [s.value, 0])) as Record<LeadStatus, number>;
    for (const r of rows) out[r.status] = r.n;
    return out;
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
};
