/**
 * Lead pipeline helpers, filter parsing, the login limiter and the JSON file store.
 * The file store runs in a temporary working directory, so the real .data/ is never touched.
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { register } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

register("./helpers/alias-hook.mjs", import.meta.url);

const workDir = await mkdtemp(path.join(tmpdir(), "ds-leads-test-"));
const repoCwd = process.cwd();
// Before the store loads: it resolves .data/leads.json against the working directory.
process.chdir(workDir);

const types: typeof import("../lib/leads/types") = await import(new URL("../lib/leads/types.ts", import.meta.url).href);
const limiter: typeof import("../lib/rate-limit") = await import(new URL("../lib/rate-limit.ts", import.meta.url).href);
const session: typeof import("../lib/auth/session") = await import(new URL("../lib/auth/session.ts", import.meta.url).href);
const { fileStore } = (await import(new URL("../lib/leads/file-store.ts", import.meta.url).href)) as typeof import("../lib/leads/file-store");

after(async () => {
  process.chdir(repoCwd);
  await rm(workDir, { recursive: true, force: true });
});

describe("pageOf", () => {
  test("defaults, and clamps hostile page numbers so the offset stays a small safe integer", () => {
    assert.deepEqual(types.pageOf({}), { page: 1, pageSize: 50, offset: 0 });
    assert.equal(types.pageOf({ page: Number.NaN }).page, 1);
    assert.equal(types.pageOf({ page: -4 }).page, 1);
    const huge = types.pageOf({ page: 1e21, pageSize: 200 });
    assert.equal(huge.page, types.MAX_PAGE);
    assert.ok(Number.isSafeInteger(huge.offset) && huge.offset < 1e9);
    assert.equal(types.pageOf({ pageSize: 10_000 }).pageSize, 200);
  });
});

describe("dates", () => {
  test("dateRange ignores impossible days and years outside 2000–2100", () => {
    assert.equal(types.dateRange({ from: "0000-01-01" }).start, null);
    assert.equal(types.dateRange({ to: "9999-12-31" }).end, null);
    assert.equal(types.dateRange({ from: "2026-02-31" }).start, null);
    assert.equal(types.dateRange({ from: "2026-10-20" }).start?.toISOString(), "2026-10-19T18:30:00.000Z");
    assert.equal(types.dateRange({ to: "2026-10-20" }).end?.toISOString(), "2026-10-20T18:30:00.000Z");
  });

  test("isIsoDay and istToday", () => {
    assert.ok(types.isIsoDay("2100-12-31"));
    assert.ok(!types.isIsoDay("2101-01-01"));
    assert.ok(!types.isIsoDay("1999-12-31"));
    assert.ok(!types.isIsoDay("2026-1-5"));
    assert.ok(!types.isIsoDay(20261020));
    // 20:00 UTC is already the next day in India.
    assert.equal(types.istToday(new Date("2026-10-20T20:00:00Z")), "2026-10-21");
    assert.equal(types.istToday(new Date("2026-10-20T18:29:59Z")), "2026-10-20");
  });

  test("normaliseInstant needs an explicit offset and a plausible year", () => {
    assert.equal(types.normaliseInstant("2026-11-02T15:30+05:30"), "2026-11-02T10:00:00.000Z");
    assert.equal(types.normaliseInstant("2026-11-02T10:00:00.000Z"), "2026-11-02T10:00:00.000Z");
    assert.equal(types.normaliseInstant("2026-11-02T15:30"), null);
    assert.equal(types.normaliseInstant("0001-01-01T00:00Z"), null);
    assert.equal(types.normaliseInstant("not a date"), null);
    assert.equal(types.normaliseInstant(42), null);
  });
});

describe("validatePipelinePatch", () => {
  test("keeps only known keys, normalises values and clears with null or empty", () => {
    const r = types.validatePipelinePatch({
      status: "meeting",
      nextFollowUp: "2026-11-01",
      lastContacted: "",
      meetingAt: "2026-11-02T15:30+05:30",
      proposalDetails: "  Two-day campus hackathon\r\nfor 300 students \u0007 ",
      // @ts-expect-error -- unknown keys are dropped
      email: "x@example.com",
    });
    assert.ok(r.ok);
    assert.deepEqual(r.patch, {
      status: "meeting",
      nextFollowUp: "2026-11-01",
      lastContacted: null,
      meetingAt: "2026-11-02T10:00:00.000Z",
      proposalDetails: "Two-day campus hackathon\nfor 300 students",
    });
  });

  test("reports each bad field", () => {
    const r = types.validatePipelinePatch({
      // @ts-expect-error -- not a status
      status: "archived",
      nextFollowUp: "2026-02-31",
      meetingAt: "tomorrow",
      lossReason: "x".repeat(types.MAX_LOSS_REASON + 1),
    });
    assert.ok(!r.ok);
    assert.deepEqual(Object.keys(r.fieldErrors).sort(), ["lossReason", "meetingAt", "nextFollowUp", "status"]);
  });

  test("an empty patch is valid", () => {
    assert.deepEqual(types.validatePipelinePatch({}), { ok: true, patch: {} });
  });
});

describe("login limiter", () => {
  test("peek doesn't count; failures do; clear resets", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 20; i++) assert.ok(limiter.peekRateLimit(key, 3).ok, "peeking never uses up the limit");
    for (let i = 0; i < 3; i++) limiter.rateLimit(key, 3, 60_000);
    assert.equal(limiter.peekRateLimit(key, 3).ok, false);
    assert.ok(limiter.peekRateLimit(key, 3).retryAfter > 0);
    limiter.clearRateLimit(key);
    assert.ok(limiter.peekRateLimit(key, 3).ok);
  });
});

describe("safeAdminPath", () => {
  test("allows internal admin paths only", () => {
    assert.equal(session.safeAdminPath("/admin/leads?status=new"), "/admin/leads?status=new");
    assert.equal(session.safeAdminPath("/admin"), "/admin");
    assert.equal(session.safeAdminPath("//evil.example/admin"), null);
    assert.equal(session.safeAdminPath("https://evil.example/admin"), null);
    assert.equal(session.safeAdminPath("/admin/login"), null);
    assert.equal(session.safeAdminPath("/administrator"), null);
    assert.equal(session.safeAdminPath(undefined), null);
  });
});

describe("file store", () => {
  const base = {
    name: "Test Person",
    designation: "",
    email: "test.person@example.edu",
    phone: "+91 90000 00000",
    city: "",
    state: "",
    website: "",
    eventType: "campus",
    orgType: "college",
    participants: "",
    format: "",
    timeline: "",
    theme: "",
    message: "",
    source: "/contact",
    ipHash: null,
  } as const;
  let a: string, b: string, c: string;

  // Timestamps have millisecond resolution; space writes out so the order checks never tie.
  const tick = () => new Promise((r) => setTimeout(r, 5));

  before(async () => {
    a = (await fileStore.create({ ...base, institution: "I.I.T. Delhi" } as never)).id;
    await tick();
    b = (await fileStore.create({ ...base, institution: "IIT  Delhi" } as never)).id;
    await tick();
    c = (await fileStore.create({ ...base, institution: "IIT Delhi Extension Centre" } as never)).id;
  });

  test("new leads read back with empty pipeline fields", async () => {
    const lead = (await fileStore.get(a))!.lead;
    assert.equal(lead.nextFollowUp, null);
    assert.equal(lead.lastContacted, null);
    assert.equal(lead.meetingAt, null);
    assert.equal(lead.proposalDetails, "");
    assert.equal(lead.lossReason, "");
  });

  test("org matches the organisation key exactly, not as a substring", async () => {
    const page = await fileStore.list({ org: types.organisationKey("IIT Delhi") });
    assert.deepEqual(page.leads.map((l) => l.id).sort(), [a, b].sort());
    assert.equal(page.total, 2);
  });

  test("updatePipeline changes only the given keys and bumps updatedAt", async () => {
    const before = (await fileStore.get(a))!.lead;
    await tick();
    await fileStore.updatePipeline(a, { status: "meeting", nextFollowUp: "2026-01-05", meetingAt: "2026-01-06T10:00:00.000Z" });
    const after = (await fileStore.get(a))!.lead;
    assert.equal(after.status, "meeting");
    assert.equal(after.nextFollowUp, "2026-01-05");
    assert.equal(after.meetingAt, "2026-01-06T10:00:00.000Z");
    assert.equal(after.lastContacted, null);
    assert.equal(after.name, before.name);
    assert.ok(after.updatedAt > before.updatedAt);
    await fileStore.updatePipeline(a, { nextFollowUp: null });
    assert.equal((await fileStore.get(a))!.lead.nextFollowUp, null);
    assert.equal((await fileStore.get(a))!.lead.status, "meeting");
    await assert.rejects(fileStore.updatePipeline(a, { nextFollowUp: "0000-01-01" }), /invalid_pipeline/);
  });

  test("open, followUpDue, notifyStatus and sort filters; stats agree", async () => {
    await tick();
    await fileStore.updatePipeline(b, { nextFollowUp: "2026-01-01" });
    await tick();
    await fileStore.updatePipeline(c, { status: "won", nextFollowUp: "2026-01-01" });
    await fileStore.markNotified(b, "failed");

    assert.deepEqual((await fileStore.list({ followUpDue: true })).leads.map((l) => l.id), [b]);
    assert.deepEqual((await fileStore.list({ open: true })).leads.map((l) => l.id).sort(), [a, b].sort());
    assert.deepEqual((await fileStore.list({ notifyStatus: "failed" })).leads.map((l) => l.id), [b]);
    assert.deepEqual((await fileStore.list({ sort: "oldest" })).leads.map((l) => l.id), [a, b, c]);
    assert.deepEqual((await fileStore.list({ sort: "newest" })).leads.map((l) => l.id), [c, b, a]);
    assert.equal((await fileStore.list({ sort: "updated" })).leads[0].id, c);

    const stats = await fileStore.stats();
    assert.equal(stats.total, 3);
    assert.equal(stats.open, 2);
    assert.equal(stats.meetings, 1);
    assert.equal(stats.newLeads, 1);
    assert.equal(stats.proposals, 0);
    assert.equal(stats.followUpsDue, 1);
    assert.equal(stats.notifyFailed, 1);
  });

  test("a far-out page returns no rows instead of failing", async () => {
    const page = await fileStore.list({ page: 1e18 });
    assert.equal(page.leads.length, 0);
    assert.equal(page.total, 3);
  });

  test("existingLeadIds", async () => {
    const ids = await fileStore.existingLeadIds([a, "00000000-0000-0000-0000-000000000000", c]);
    assert.deepEqual([...ids].sort(), [a, c].sort());
  });

  test("activity filters by action before the limit", async () => {
    await fileStore.logActivity({ actor: "t", action: "admin_created", detail: "x" });
    for (let i = 0; i < 5; i++) await fileStore.logActivity({ actor: "t", action: "login" });
    const rare = await fileStore.activity({ action: "admin_created", limit: 2 });
    assert.equal(rare.length, 1);
    assert.equal(rare[0].action, "admin_created");
    assert.equal((await fileStore.activity({ limit: 2 })).length, 2);
  });

  test("disableAdminIfNotLast keeps one active account, even when two disables race", async () => {
    const x = await fileStore.createAdmin({ email: "x@example.com", name: "X", passwordHash: "scrypt:00:00" });
    const y = await fileStore.createAdmin({ email: "y@example.com", name: "Y", passwordHash: "scrypt:00:00" });
    const results = await Promise.all([fileStore.disableAdminIfNotLast(x.id), fileStore.disableAdminIfNotLast(y.id)]);
    assert.deepEqual(results.sort(), ["disabled", "last"]);
    assert.equal(await fileStore.countActiveAdmins(), 1);
    assert.equal(await fileStore.disableAdminIfNotLast("missing-id"), "missing");
  });
});
