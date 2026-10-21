import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  activityLimit,
  contactFields,
  dateRange,
  groupOrganisations,
  isOpenStatus,
  istMonth,
  istToday,
  last12Months,
  MAX_LIST_ALL,
  organisationKey,
  pageOf,
  searchFields,
  validatePipelinePatch,
  zeroByEventType,
  zeroByOrgType,
  zeroByStatus,
  type ActivityEntry,
  type AdminAccount,
  type Lead,
  type LeadFilters,
  type LeadNote,
  type LeadStore,
} from "./types";

/**
 * Local JSON-file store for development without a database. Not used in
 * production (serverless file systems are ephemeral) — see lib/leads/store.ts.
 */

type Db = {
  leads: (Lead & { ipHash: string | null })[];
  notes: LeadNote[];
  admins: AdminAccount[];
  activity: ActivityEntry[];
  loginFailures: { key: string; at: string }[];
};

const file = path.join(process.cwd(), ".data", "leads.json");

// Development only, so keep the file readable rather than keeping every entry forever.
const MAX_ACTIVITY_ENTRIES = 5000;
const DAY_MS = 24 * 60 * 60_000;

async function load(): Promise<Db> {
  let raw: Partial<Db> = {};
  try {
    raw = JSON.parse(await readFile(file, "utf8")) as Partial<Db>;
  } catch {
    // No file yet (or unreadable): start empty.
  }
  // Files written before admins/activity existed lack those keys.
  return {
    leads: raw.leads ?? [],
    notes: raw.notes ?? [],
    admins: raw.admins ?? [],
    activity: raw.activity ?? [],
    loginFailures: raw.loginFailures ?? [],
  };
}

// Serialise writes so concurrent requests can't clobber each other.
let queue: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = fn(db);
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await writeFile(tmp, JSON.stringify(db, null, 2));
    await rename(tmp, file);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

type Row = Db["leads"][number];

/** Leads written before a field existed read back with the same defaults as the Postgres columns. */
const withDefaults = (row: Row): Row => ({
  ...row,
  orgType: row.orgType ?? "",
  nextFollowUp: row.nextFollowUp ?? null,
  lastContacted: row.lastContacted ?? null,
  meetingAt: row.meetingAt ?? null,
  proposalDetails: row.proposalDetails ?? "",
  lossReason: row.lossReason ?? "",
});

const strip = (row: Row): Lead => {
  const lead: Partial<Row> = withDefaults(row);
  delete lead.ipHash;
  return lead as Lead;
};

const order: Record<NonNullable<LeadFilters["sort"]>, (a: Row, b: Row) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.createdAt.localeCompare(a.createdAt),
};

/** Same filters and order as the Postgres store (default: newest first). */
function matching(leads: Db["leads"], f: Omit<LeadFilters, "page" | "pageSize">) {
  const q = f.q?.trim().toLowerCase();
  const { start, end } = dateRange(f);
  const today = istToday();
  return leads
    .map(withDefaults)
    .filter((l) => (!f.status || l.status === f.status) && (!f.eventType || l.eventType === f.eventType))
    .filter((l) => !f.orgType || (f.orgType === "unknown" ? !l.orgType : l.orgType === f.orgType))
    .filter((l) => (!start || l.createdAt >= start.toISOString()) && (!end || l.createdAt < end.toISOString()))
    .filter((l) => !q || searchFields.some((k) => (l[k] ?? "").toLowerCase().includes(q)))
    .filter((l) => !f.org || organisationKey(l.institution) === f.org)
    .filter((l) => !f.notifyStatus || l.notifyStatus === f.notifyStatus)
    .filter((l) => !f.open || isOpenStatus(l.status))
    .filter((l) => !f.followUpDue || (isOpenStatus(l.status) && l.nextFollowUp !== null && l.nextFollowUp <= today))
    .sort(order[f.sort ?? "newest"] ?? order.newest);
}

export const fileStore: LeadStore = {
  kind: "file",

  create({ ipHash, ...data }) {
    const now = new Date().toISOString();
    const lead: Row = {
      ...data,
      id: randomUUID(),
      status: "new" as const,
      createdAt: now,
      updatedAt: now,
      ipHash,
      nextFollowUp: null,
      lastContacted: null,
      meetingAt: null,
      proposalDetails: "",
      lossReason: "",
    };
    return mutate((db) => {
      db.leads.unshift(lead);
      return strip(lead);
    });
  },

  async list(f = {}) {
    const { page, pageSize, offset } = pageOf(f);
    const all = matching((await load()).leads, f);
    return { leads: all.slice(offset, offset + pageSize).map(strip), total: all.length, page, pageSize };
  },

  async listAll(f = {}) {
    return matching((await load()).leads, f).slice(0, MAX_LIST_ALL).map(strip);
  },

  async get(id) {
    const db = await load();
    const lead = db.leads.find((l) => l.id === id);
    if (!lead) return null;
    return {
      lead: strip(lead),
      notes: db.notes.filter((n) => n.leadId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  },

  async updateStatus(id, status) {
    await mutate((db) => {
      const lead = db.leads.find((l) => l.id === id);
      if (lead) {
        lead.status = status;
        lead.updatedAt = new Date().toISOString();
      }
    });
  },

  async updatePipeline(id, input) {
    const checked = validatePipelinePatch(input);
    if (!checked.ok) throw new Error("invalid_pipeline");
    const { patch } = checked;
    await mutate((db) => {
      const lead = db.leads.find((l) => l.id === id);
      if (!lead) return;
      if (patch.status !== undefined) lead.status = patch.status;
      if (patch.nextFollowUp !== undefined) lead.nextFollowUp = patch.nextFollowUp;
      if (patch.lastContacted !== undefined) lead.lastContacted = patch.lastContacted;
      if (patch.meetingAt !== undefined) lead.meetingAt = patch.meetingAt;
      if (patch.proposalDetails !== undefined) lead.proposalDetails = patch.proposalDetails;
      if (patch.lossReason !== undefined) lead.lossReason = patch.lossReason;
      lead.updatedAt = new Date().toISOString();
    });
  },

  async existingLeadIds(ids) {
    const wanted = new Set(ids);
    if (wanted.size === 0) return new Set();
    return new Set((await load()).leads.filter((l) => wanted.has(l.id)).map((l) => l.id));
  },

  async addNote(leadId, body) {
    await mutate((db) => {
      const lead = db.leads.find((l) => l.id === leadId);
      if (!lead) return;
      const now = new Date().toISOString();
      db.notes.push({ id: randomUUID(), leadId, body, createdAt: now });
      lead.updatedAt = now;
    });
  },

  async countByStatus() {
    const out = zeroByStatus();
    for (const l of (await load()).leads) out[l.status]++;
    return out;
  },

  async stats() {
    const { leads } = await load();
    const byStatus = zeroByStatus();
    const byOrgType = zeroByOrgType();
    const byEventType = zeroByEventType();
    const months = last12Months();
    const byMonth = new Map(months.map((m) => [m, 0]));
    const since30 = new Date(Date.now() - 30 * DAY_MS).toISOString();
    let last30Days = 0;
    let notifyFailed = 0;
    let followUpsDue = 0;
    const today = istToday();
    for (const l of leads.map(withDefaults)) {
      byStatus[l.status]++;
      byOrgType[l.orgType || "unknown"]++;
      byEventType[l.eventType] = (byEventType[l.eventType] ?? 0) + 1;
      const m = istMonth(new Date(l.createdAt));
      if (byMonth.has(m)) byMonth.set(m, byMonth.get(m)! + 1);
      if (l.createdAt >= since30) last30Days++;
      if (l.notifyStatus === "failed") notifyFailed++;
      if (isOpenStatus(l.status) && l.nextFollowUp !== null && l.nextFollowUp <= today) followUpsDue++;
    }
    return {
      total: leads.length,
      last30Days,
      byStatus,
      byOrgType,
      byEventType,
      byMonth: months.map((month) => ({ month, count: byMonth.get(month)! })),
      won: byStatus.won,
      lost: byStatus.lost,
      notifyFailed,
      open: leads.length - byStatus.won - byStatus.lost,
      meetings: byStatus.meeting,
      proposals: byStatus.proposal,
      newLeads: byStatus.new,
      followUpsDue,
    };
  },

  async organisations(f = {}) {
    const rows = matching((await load()).leads, {}).slice(0, MAX_LIST_ALL).map(strip);
    return groupOrganisations(rows, f);
  },

  async countRecent(ipHash, since) {
    const t = since.toISOString();
    return (await load()).leads.filter((l) => l.ipHash === ipHash && l.createdAt >= t).length;
  },

  async markNotified(id, status) {
    await mutate((db) => {
      const lead = db.leads.find((l) => l.id === id);
      if (lead) lead.notifyStatus = status;
    });
  },

  async delete(id) {
    await mutate((db) => {
      db.leads = db.leads.filter((l) => l.id !== id);
      db.notes = db.notes.filter((n) => n.leadId !== id);
    });
  },

  async updateContact(id, fields) {
    await mutate((db) => {
      const lead = db.leads.find((l) => l.id === id);
      if (!lead) return;
      for (const k of contactFields) {
        const v = fields[k];
        if (v !== undefined) lead[k] = v;
      }
      lead.updatedAt = new Date().toISOString();
    });
  },

  async ping() {},

  async logActivity(entry) {
    await mutate((db) => {
      db.activity.unshift({
        id: randomUUID(),
        at: new Date().toISOString(),
        actor: entry.actor,
        action: entry.action,
        leadId: entry.leadId ?? null,
        leadLabel: entry.leadLabel ?? null,
        detail: entry.detail ?? null,
      });
      db.activity.length = Math.min(db.activity.length, MAX_ACTIVITY_ENTRIES);
    });
  },

  async activity(opts = {}) {
    return (await load()).activity
      .filter((a) => (!opts.leadId || a.leadId === opts.leadId) && (!opts.action || a.action === opts.action))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, activityLimit(opts.limit));
  },

  async findAdminByEmail(email) {
    const e = email.trim().toLowerCase();
    return (await load()).admins.find((a) => a.email === e) ?? null;
  },

  async getAdmin(id) {
    return (await load()).admins.find((a) => a.id === id) ?? null;
  },

  async listAdmins() {
    return (await load()).admins.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  createAdmin({ email, name, passwordHash }) {
    return mutate((db) => {
      const e = email.trim().toLowerCase();
      if (db.admins.some((a) => a.email === e)) throw new Error("duplicate_email");
      const admin: AdminAccount = {
        id: randomUUID(),
        email: e,
        name,
        passwordHash,
        disabled: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      db.admins.push(admin);
      return admin;
    });
  },

  async updateAdmin(id, patch) {
    await mutate((db) => {
      const admin = db.admins.find((a) => a.id === id);
      if (!admin) return;
      if (patch.name !== undefined) admin.name = patch.name;
      if (patch.passwordHash !== undefined) admin.passwordHash = patch.passwordHash;
      if (patch.disabled !== undefined) admin.disabled = patch.disabled;
    });
  },

  async touchAdminLogin(id) {
    await mutate((db) => {
      const admin = db.admins.find((a) => a.id === id);
      if (admin) admin.lastLoginAt = new Date().toISOString();
    });
  },

  async countActiveAdmins() {
    return (await load()).admins.filter((a) => !a.disabled).length;
  },

  disableAdminIfNotLast(id) {
    // Inside the write queue, so the count and the change can't interleave with another disable.
    return mutate((db): "disabled" | "last" | "missing" => {
      const admin = db.admins.find((a) => a.id === id);
      if (!admin) return "missing";
      if (admin.disabled) return "disabled";
      if (db.admins.filter((a) => !a.disabled).length <= 1) return "last";
      admin.disabled = true;
      return "disabled";
    });
  },

  async recordLoginFailure(key) {
    await mutate((db) => {
      const cutoff = new Date(Date.now() - DAY_MS).toISOString();
      db.loginFailures = db.loginFailures.filter((f) => f.at >= cutoff);
      db.loginFailures.push({ key, at: new Date().toISOString() });
    });
  },

  async countLoginFailures(key, since) {
    const t = since.toISOString();
    return (await load()).loginFailures.filter((f) => f.key === key && f.at >= t).length;
  },

  async clearLoginFailures(key) {
    // Skip the write when there's nothing to clear (the common case: every successful sign-in).
    if (!(await load()).loginFailures.some((f) => f.key === key)) return;
    await mutate((db) => {
      db.loginFailures = db.loginFailures.filter((f) => f.key !== key);
    });
  },
};
