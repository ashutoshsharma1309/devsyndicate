/**
 * Unit tests for the site content schemas, defaults and merge rules (lib/cms).
 * Same runner as tests/lead-schema.test.ts: Node's built-in test runner with
 * native type stripping.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// Node needs the real file extension; tsconfig doesn't enable allowImportingTsExtensions.
// @ts-expect-error -- TS5097: types still resolve, only the extension is flagged.
import { DEFAULTS } from "../lib/cms/defaults.ts";
// @ts-expect-error -- TS5097
import { deepMerge, resolveContent } from "../lib/cms/merge.ts";
import {
  cleanText,
  contentFieldErrors,
  ENQUIRY_TYPES,
  isInternalPath,
  isLinkedInProfile,
  isSafeLink,
  schemas,
  SECTION_KEYS,
  type SectionContent,
  type SectionKey,
  // @ts-expect-error -- TS5097
} from "../lib/cms/schema.ts";
// @ts-expect-error -- TS5097
import * as content from "../lib/content.ts";
// @ts-expect-error -- TS5097
import { site, team } from "../lib/site.ts";
// @ts-expect-error -- TS5097
import { eventTypes } from "../lib/validation/lead.ts";

const clone = <T>(v: T): T => structuredClone(v);

type Parsed =
  | { success: true; data: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any -- test inspection
  | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };

function parse(key: SectionKey, value: unknown): Parsed {
  return schemas[key].safeParse(value) as Parsed;
}

/** The first error message at `path` ("" for the section itself), or undefined when valid. */
function errorAt(key: SectionKey, value: unknown, path: string) {
  const r = parse(key, value);
  return r.success ? undefined : contentFieldErrors(r.error.issues)[path];
}

describe("defaults", () => {
  for (const key of SECTION_KEYS) {
    test(`${key} validates against its own schema, unchanged`, () => {
      const r = parse(key, DEFAULTS[key]);
      assert.ok(r.success, JSON.stringify(!r.success && r.error.issues));
      assert.deepEqual(r.data, DEFAULTS[key]);
    });
  }

  test("copy lib/content.ts verbatim", () => {
    assert.deepEqual(DEFAULTS.homepage.trust.points, [...content.trustPoints]);
    assert.deepEqual(
      DEFAULTS.homepage.faq.items,
      content.faqs.map((f: { q: string; a: string }) => ({ q: f.q, a: f.a })),
    );
    assert.deepEqual(
      DEFAULTS.services.stages.map(({ visible, ...s }: { visible: boolean }) => (assert.equal(visible, true), s)),
      content.lifecycle,
    );
    assert.deepEqual(
      DEFAULTS.services.formats.map(({ visible, ...f }: { visible: boolean }) => (assert.equal(visible, true), f)),
      content.formats,
    );
    assert.deepEqual(DEFAULTS.services.phaseIntros, content.phaseIntros);
    assert.deepEqual(DEFAULTS.services.partners.options, content.partnerOptions);
    assert.deepEqual(
      DEFAULTS.howItWorks.steps,
      content.process.map(({ title, body, fromYou, fromUs }: Record<string, string>) => ({ title, body, fromYou, fromUs })),
    );
  });

  test("copy lib/site.ts verbatim", () => {
    const c = DEFAULTS.contact;
    assert.equal(c.email, site.email);
    assert.deepEqual(c.phone, { display: site.phone.display, e164: site.phone.e164 });
    assert.equal(`tel:${c.phone.e164}`, site.phone.href);
    assert.deepEqual(c.primaryContact, {
      name: site.primaryContact.name,
      role: site.primaryContact.role,
      phone: { display: site.primaryContact.phone.display, e164: site.primaryContact.phone.e164 },
      linkedin: site.primaryContact.linkedin,
    });
    assert.deepEqual(c.location, { city: site.location.city, region: site.location.region, country: site.location.country });
    assert.equal(DEFAULTS.homepage.footer.tagline, site.tagline);
    assert.deepEqual(
      DEFAULTS.team.members.map((m: { name: string; role: string; linkedin: string; primaryContact: boolean }) => [
        m.name,
        m.role,
        m.linkedin,
        m.primaryContact,
      ]),
      team.map((p: { name: string; role: string; linkedin: string; primaryContact?: boolean }) => [
        p.name,
        p.role,
        p.linkedin,
        Boolean(p.primaryContact),
      ]),
    );
    assert.ok(DEFAULTS.team.members.every((m: { bio: string; visible: boolean }) => m.bio === "" && m.visible));
    assert.equal(DEFAULTS.seo.pages["/"].title, site.title);
    assert.equal(DEFAULTS.seo.pages["/"].description, site.description);
    assert.equal(
      DEFAULTS.seo.pages["/contact"].description,
      `Planning a hackathon for your college? Send Dev Syndicate an enquiry, call ${site.primaryContact.name} on ${site.primaryContact.phone.display} or email the team to arrange a conversation.`,
    );
  });

  test("enquiry types match the contact form's", () => {
    assert.deepEqual([...ENQUIRY_TYPES], eventTypes.map((t: { value: string }) => t.value));
    assert.deepEqual(DEFAULTS.contactForm.enabledEnquiryTypes, [...ENQUIRY_TYPES]);
    assert.equal(DEFAULTS.contactForm.notificationRecipient, "");
  });
});

describe("plain text", () => {
  test("rejects markup anywhere", () => {
    const home = clone(DEFAULTS.homepage);
    home.hero.lead = 'Hello <script>alert("x")</script>';
    assert.match(errorAt("homepage", home, "hero.lead") ?? "", /plain text/);

    const faq = clone(DEFAULTS.homepage);
    faq.faq.items[0].a = "a > b";
    assert.ok(errorAt("homepage", faq, "faq.items.0.a"));

    const t = clone(DEFAULTS.team);
    t.members[0].bio = "<img src=x onerror=alert(1)>";
    assert.ok(errorAt("team", t, "members.0.bio"));
  });

  test("strips control and bidi characters, trims, folds line breaks in single-line text", () => {
    assert.equal(cleanText("  a\u0000b‮c\u0007 \n d\t "), "abc d");
    assert.equal(cleanText("line 1\r\n\r\n\r\n\r\nline 2", true), "line 1\n\nline 2");
    const home = clone(DEFAULTS.homepage);
    home.hero.eyebrow = "  Partner\u0000 for\ncolleges ";
    const r = parse("homepage", home);
    assert.ok(r.success);
    assert.equal(r.data.hero.eyebrow, "Partner for colleges");
  });

  test("required text can't be empty, and lengths are capped", () => {
    const home = clone(DEFAULTS.homepage);
    home.hero.headline[1] = "   ";
    assert.ok(errorAt("homepage", home, "hero.headline.1"));
    const long = clone(DEFAULTS.homepage);
    long.finalCta.title = "x".repeat(500);
    assert.match(errorAt("homepage", long, "finalCta.title") ?? "", /under 160/);
    const bio = clone(DEFAULTS.team);
    bio.members[0].bio = "x".repeat(401);
    assert.ok(errorAt("team", bio, "members.0.bio"));
  });
});

describe("links", () => {
  test("accepts internal paths, https, mailto and tel", () => {
    for (const ok of [
      "/contact",
      "/contact?type=sponsorship#enquiry",
      "/",
      "https://www.devsyndicate.co.in/services",
      "mailto:team@example.com",
      "tel:+919507364491",
    ]) {
      assert.ok(isSafeLink(ok), ok);
    }
  });

  test("rejects other schemes, protocol-relative and malformed links", () => {
    for (const bad of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<b>x</b>",
      "http://example.com",
      "//evil.example",
      "/\\evil.example",
      "/a//b",
      "https://user:pass@example.com",
      "https://localhost",
      "mailto:not-an-email",
      "tel:12345",
      "tel:+91 95073 64491",
      "contact",
      "/path with space",
      "",
    ]) {
      assert.equal(isSafeLink(bad), false, bad);
    }
    assert.equal(isInternalPath("https://example.com"), false);
  });

  test("a bad CTA link fails validation", () => {
    const home = clone(DEFAULTS.homepage);
    home.hero.primaryCta.href = "javascript:alert(1)";
    assert.ok(errorAt("homepage", home, "hero.primaryCta.href"));
    const form = clone(DEFAULTS.contactForm);
    form.privacyHref = "https://example.com/privacy";
    assert.ok(errorAt("contactForm", form, "privacyHref"));
  });

  test("LinkedIn links must be https://www.linkedin.com/in/… profiles", () => {
    assert.ok(isLinkedInProfile("https://www.linkedin.com/in/ashutoshsharma1309/"));
    assert.ok(isLinkedInProfile("https://linkedin.com/in/shiven-kumar-1549b327a"));
    for (const bad of [
      "http://www.linkedin.com/in/name/",
      "https://www.linkedin.com/company/dev-syndicate/",
      "https://www.linkedin.com.evil.example/in/name/",
      "https://evil.example/in/name/",
      "https://www.linkedin.com/in/",
      "https://www.linkedin.com/in/name/?redirect=https://evil.example",
      "javascript:alert(1)//linkedin.com/in/name",
    ]) {
      assert.equal(isLinkedInProfile(bad), false, bad);
    }
    const t = clone(DEFAULTS.team);
    t.members[1].linkedin = "https://www.linkedin.com/company/x/";
    assert.ok(errorAt("team", t, "members.1.linkedin"));
    const c = clone(DEFAULTS.contact);
    c.primaryContact.linkedin = "https://example.com/in/name/";
    assert.ok(errorAt("contact", c, "primaryContact.linkedin"));
  });
});

describe("section rules", () => {
  test("contact form needs at least one enquiry type, each listed once", () => {
    const empty = clone(DEFAULTS.contactForm);
    empty.enabledEnquiryTypes = [];
    assert.ok(errorAt("contactForm", empty, "enabledEnquiryTypes"));
    const dupes = clone(DEFAULTS.contactForm);
    dupes.enabledEnquiryTypes = ["campus", "campus"];
    assert.ok(errorAt("contactForm", dupes, "enabledEnquiryTypes"));
    const unknown = clone(DEFAULTS.contactForm) as { enabledEnquiryTypes: string[] };
    unknown.enabledEnquiryTypes = ["campus", "workshop"];
    assert.ok(errorAt("contactForm", unknown, "enabledEnquiryTypes.1"));
    const one = clone(DEFAULTS.contactForm);
    one.enabledEnquiryTypes = ["general"];
    assert.ok(parse("contactForm", one).success);
  });

  test("notification recipient is an email or empty", () => {
    const form = clone(DEFAULTS.contactForm);
    form.notificationRecipient = "Leads@Example.com ";
    const r = parse("contactForm", form);
    assert.ok(r.success);
    assert.equal(r.data.notificationRecipient, "leads@example.com");
    form.notificationRecipient = "not an email";
    assert.ok(errorAt("contactForm", form, "notificationRecipient"));
  });

  test("phone numbers: E.164, and the displayed number must match it", () => {
    const c = clone(DEFAULTS.contact);
    c.phone.e164 = "9507364491";
    assert.ok(errorAt("contact", c, "phone.e164"));
    const mismatch = clone(DEFAULTS.contact);
    mismatch.phone.display = "+91 95073 00000";
    assert.match(errorAt("contact", mismatch, "phone.display") ?? "", /must match/);
    const spaced = clone(DEFAULTS.contact);
    spaced.phone.e164 = "+91 95073 64491";
    const r = parse("contact", spaced);
    assert.ok(r.success);
    assert.equal(r.data.phone.e164, "+919507364491");
  });

  test("company email must be valid", () => {
    const c = clone(DEFAULTS.contact);
    c.email = "nope";
    assert.ok(errorAt("contact", c, "email"));
  });

  test("formats can be reordered and hidden but not added or removed", () => {
    const reordered = clone(DEFAULTS.services);
    reordered.formats.reverse();
    reordered.formats[0].visible = false;
    assert.ok(parse("services", reordered).success);

    const removed = clone(DEFAULTS.services);
    removed.formats.pop();
    assert.ok(errorAt("services", removed, "formats"));

    const duplicated = clone(DEFAULTS.services);
    duplicated.formats[1] = { ...duplicated.formats[0] };
    assert.ok(errorAt("services", duplicated, "formats"));

    const invented = clone(DEFAULTS.services) as { formats: { code: string }[] };
    invented.formats[0].code = "WORKSHOP";
    assert.ok(errorAt("services", invented, "formats.0.code"));
  });

  test("stages need a known phase and at least one deliverable", () => {
    const s = clone(DEFAULTS.services) as { stages: { phase: string; deliverables: string[] }[] };
    s.stages[0].phase = "Someday";
    s.stages[1].deliverables = [];
    assert.ok(errorAt("services", s, "stages.0.phase"));
    assert.ok(errorAt("services", s, "stages.1.deliverables"));
  });

  test("only one primary contact in the team", () => {
    const t = clone(DEFAULTS.team);
    t.members[0].primaryContact = true;
    assert.match(errorAt("team", t, "members") ?? "", /Only one/);
  });

  test("FAQ items can be added, removed and reordered within limits", () => {
    const h = clone(DEFAULTS.homepage);
    h.faq.items = [h.faq.items[2], { q: "A new question?", a: "A new answer." }];
    assert.ok(parse("homepage", h).success);
    h.faq.items = [];
    assert.ok(errorAt("homepage", h, "faq.items"));
  });

  test("unknown keys are dropped", () => {
    const h = { ...clone(DEFAULTS.homepage), injected: "<script>" } as Record<string, unknown>;
    const r = parse("homepage", h);
    assert.ok(r.success);
    assert.equal("injected" in r.data, false);
  });
});

describe("merge", () => {
  const resolve = <K extends SectionKey>(key: K, stored: unknown): SectionContent<K> =>
    resolveContent(schemas[key], DEFAULTS[key], stored);

  test("nothing stored → the defaults", () => {
    assert.deepEqual(resolve("homepage", null), DEFAULTS.homepage);
    assert.deepEqual(resolve("seo", undefined), DEFAULTS.seo);
  });

  test("stored values override defaults key by key; missing keys keep their defaults", () => {
    const out = resolve("homepage", { hero: { eyebrow: "New eyebrow" }, finalCta: { title: "New title" } });
    assert.equal(out.hero.eyebrow, "New eyebrow");
    assert.deepEqual(out.hero.headline, DEFAULTS.homepage.hero.headline);
    assert.equal(out.finalCta.title, "New title");
    assert.equal(out.finalCta.body, DEFAULTS.homepage.finalCta.body);
    assert.deepEqual(out.sections, DEFAULTS.homepage.sections);
  });

  test("lists replace the default list instead of merging item by item", () => {
    const out = resolve("homepage", { trust: { points: ["Only one"] } });
    assert.deepEqual(out.trust.points, ["Only one"]);
    assert.equal(out.trust.line, DEFAULTS.homepage.trust.line);
  });

  test("an invalid value falls back to its default; valid siblings survive", () => {
    const out = resolve("homepage", {
      hero: { eyebrow: "Kept", lead: "<b>bad</b>", primaryCta: { label: "Go", href: "javascript:alert(1)" } },
    });
    assert.equal(out.hero.eyebrow, "Kept");
    assert.equal(out.hero.lead, DEFAULTS.homepage.hero.lead);
    assert.equal(out.hero.primaryCta.label, "Go");
    assert.equal(out.hero.primaryCta.href, DEFAULTS.homepage.hero.primaryCta.href);
  });

  test("an invalid list falls back as a whole", () => {
    const out = resolve("contactForm", { enabledEnquiryTypes: [], enabled: false });
    assert.deepEqual(out.enabledEnquiryTypes, DEFAULTS.contactForm.enabledEnquiryTypes);
    assert.equal(out.enabled, false);
  });

  test("garbage stored content → the defaults, never a throw", () => {
    for (const junk of ["string", 42, true, [], [1, 2], { hero: "x" }, { pages: null }]) {
      assert.doesNotThrow(() => resolve("homepage", junk));
      assert.deepEqual(resolve("homepage", junk), DEFAULTS.homepage);
    }
    assert.deepEqual(resolve("seo", { pages: null }), DEFAULTS.seo);
  });

  test("deepMerge drops unknown keys and doesn't mutate its inputs", () => {
    const base = { a: { b: 1, c: [1, 2] }, d: "x" };
    const over = { a: { b: 2, extra: true }, unknown: 1 };
    const snapshot = JSON.stringify([base, over]);
    assert.deepEqual(deepMerge(base, over), { a: { b: 2, c: [1, 2] }, d: "x" });
    assert.equal(JSON.stringify([base, over]), snapshot);
  });

  test("merging defaults over themselves is a no-op", () => {
    for (const key of SECTION_KEYS) assert.deepEqual(resolve(key, clone(DEFAULTS[key])), DEFAULTS[key]);
  });
});
