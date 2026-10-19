import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { contactFields, leadStatuses, type Lead, type LeadNote, type LeadStatus, type LeadStore } from "./types";

/**
 * Local JSON-file store for development without a database. Not used in
 * production (serverless file systems are ephemeral) — see lib/leads/store.ts.
 */

type Db = { leads: (Lead & { ipHash: string | null })[]; notes: LeadNote[] };

const file = path.join(process.cwd(), ".data", "leads.json");

async function load(): Promise<Db> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Db;
  } catch {
    return { leads: [], notes: [] };
  }
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

const strip = (row: Db["leads"][number]): Lead => {
  const lead: Partial<Db["leads"][number]> = { ...row };
  delete lead.ipHash;
  return lead as Lead;
};

export const fileStore: LeadStore = {
  kind: "file",

  create({ ipHash, ...data }) {
    const now = new Date().toISOString();
    const lead = { ...data, id: randomUUID(), status: "new" as const, createdAt: now, updatedAt: now, ipHash };
    return mutate((db) => {
      db.leads.unshift(lead);
      return strip(lead);
    });
  },

  async list(f = {}) {
    const q = f.q?.trim().toLowerCase();
    return (await load()).leads
      .filter((l) => (!f.status || l.status === f.status) && (!f.eventType || l.eventType === f.eventType))
      .filter(
        (l) =>
          !q ||
          [l.institution, l.name, l.email, l.city, l.state, l.phone].some((v) => v.toLowerCase().includes(q)),
      )
      .map(strip);
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
    const out = Object.fromEntries(leadStatuses.map((s) => [s.value, 0])) as Record<LeadStatus, number>;
    for (const l of (await load()).leads) out[l.status]++;
    return out;
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
};
