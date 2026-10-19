// Smoke test for a running server: public pages, SEO files, 404s and the lead
// endpoint's guards. Dependency-free and read-only — it never submits a valid lead.
// Usage: npm run smoke                       (http://localhost:3000)
//        BASE_URL=https://staging.example npm run smoke

const base = new URL(process.env.BASE_URL || "http://localhost:3000");
const pages = ["/", "/about", "/how-it-works", "/services", "/contact", "/privacy", "/terms"];
// The first request to `next dev` compiles the route, which can take a while.
const TIMEOUT_MS = 60_000;

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });

async function request(path, init = {}) {
  return fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), ...init });
}

/** Runs one group of checks; a thrown error (network, timeout) fails the group instead of the run. */
async function group(name, fn) {
  try {
    await fn();
  } catch (error) {
    check(name, false, error instanceof Error ? error.message : String(error));
  }
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1];

function canonicalLinks(html) {
  return (html.match(/<link\b[^>]*>/gi) ?? [])
    .filter((tag) => (attr(tag, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical"))
    .map((tag) => attr(tag, "href") ?? "");
}

const canonicals = new Map();

for (const path of pages) {
  await group(`GET ${path}`, async () => {
    const res = await request(path);
    const html = await res.text();
    check(`GET ${path} returns 200`, res.status === 200, `got ${res.status}`);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
    check(`GET ${path} has a <title>`, title, "missing or empty");
    const links = canonicalLinks(html);
    check(`GET ${path} has exactly one canonical link`, links.length === 1, `found ${links.length}`);
    if (links.length === 1 && URL.canParse(links[0])) {
      const canonical = new URL(links[0]);
      canonicals.set(path, canonical);
      check(`GET ${path} canonical points at ${path}`, canonical.pathname.replace(/\/$/, "") === path.replace(/\/$/, ""), links[0]);
    } else if (links.length === 1) {
      check(`GET ${path} canonical is an absolute URL`, false, links[0]);
    }
  });
}

const origins = new Set([...canonicals.values()].map((u) => u.origin));
check("canonical links share one origin", origins.size === 1, [...origins].join(", ") || "no canonical links found");
const origin = [...origins][0];

await group("GET /sitemap.xml", async () => {
  const res = await request("/sitemap.xml");
  const xml = await res.text();
  check("GET /sitemap.xml returns 200", res.status === 200, `got ${res.status}`);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  check("sitemap lists URLs", locs.length > 0, "no <loc> entries");
  const foreign = locs.filter((loc) => !URL.canParse(loc) || new URL(loc).origin !== origin);
  check(`sitemap URLs use the canonical origin (${origin})`, origin && foreign.length === 0, foreign.join(", "));
  const listed = new Set(locs.map((loc) => (URL.canParse(loc) ? new URL(loc).href : loc)));
  const missing = [...canonicals.values()].filter((u) => !listed.has(u.href)).map((u) => u.href);
  check("sitemap lists every public page's canonical URL", missing.length === 0, `missing ${missing.join(", ")}`);
});

await group("GET /robots.txt", async () => {
  const res = await request("/robots.txt");
  const text = await res.text();
  check("GET /robots.txt returns 200", res.status === 200, `got ${res.status}`);
  const sitemaps = [...text.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  check("robots.txt declares a sitemap", sitemaps.length > 0, "no Sitemap: line");
  const foreign = sitemaps.filter((s) => !URL.canParse(s) || new URL(s).origin !== origin);
  check(`robots.txt sitemap uses the canonical origin (${origin})`, origin && foreign.length === 0, foreign.join(", "));
});

await group("GET unknown page", async () => {
  const path = `/smoke-test-missing-${Date.now()}`;
  const res = await request(path);
  await res.arrayBuffer();
  check("an unknown page returns 404", res.status === 404, `${path} got ${res.status}`);
});

const json = { "content-type": "application/json" };

await group("POST /api/leads (foreign origin)", async () => {
  const res = await request("/api/leads", {
    method: "POST",
    headers: { ...json, origin: "https://smoke-test.invalid" },
    body: "{}",
  });
  await res.arrayBuffer();
  check("POST /api/leads from another origin returns 403", res.status === 403, `got ${res.status}`);
});

await group("POST /api/leads (malformed body)", async () => {
  const res = await request("/api/leads", {
    method: "POST",
    headers: { ...json, origin: base.origin },
    body: "{not json",
  });
  await res.arrayBuffer();
  check("POST /api/leads with a malformed body returns 4xx", res.status >= 400 && res.status < 500, `got ${res.status}`);
});

const failed = results.filter((r) => !r.ok);
console.log(`Smoke test against ${base.origin}\n`);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok || !r.detail ? "" : `  (${r.detail})`}`);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
if (failed.length) process.exit(1);
