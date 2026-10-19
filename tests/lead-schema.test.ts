/**
 * Unit tests for the enquiry schema shared by the contact form and the API.
 * Runs on Node's built-in test runner with native type stripping, so no test
 * framework or transpiler is needed: `npm test`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// Node needs the real file extension; tsconfig doesn't enable allowImportingTsExtensions.
// @ts-expect-error -- TS5097: types still resolve, only the extension is flagged.
import { allEventTypes, fieldErrors, labelFor, leadSchema, participantRanges } from "../lib/validation/lead.ts";

const valid = {
  name: "Asha Rao",
  institution: "Example Institute of Technology",
  email: "Asha.Rao@Example.edu.in ",
  phone: "+91 98765 43210",
  eventType: "campus",
};

/** Field → first error message, or {} when the input is valid. */
function errorsFor(input: Record<string, unknown>) {
  const result = leadSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error.issues);
}

describe("leadSchema", () => {
  test("accepts a minimal enquiry and defaults optional fields to empty strings", () => {
    const result = leadSchema.safeParse(valid);
    assert.ok(result.success, JSON.stringify(result.error?.issues));
    assert.equal(result.data.email, "asha.rao@example.edu.in");
    for (const field of ["designation", "city", "state", "website", "participants", "format", "timeline", "theme", "message"] as const) {
      assert.equal(result.data[field], "", `${field} should default to ""`);
    }
  });

  for (const field of ["name", "institution", "email", "phone", "eventType"] as const) {
    test(`reports a missing ${field} on that field`, () => {
      const input: Record<string, unknown> = { ...valid };
      delete input[field];
      const errors = errorsFor(input);
      assert.ok(errors[field], `expected an error on ${field}, got ${JSON.stringify(errors)}`);
      assert.deepEqual(Object.keys(errors), [field]);
    });
  }

  test("rejects blank required text after trimming", () => {
    assert.ok(errorsFor({ ...valid, name: "   " }).name);
  });

  test("rejects an invalid email", () => {
    assert.ok(errorsFor({ ...valid, email: "asha@" }).email);
    assert.ok(errorsFor({ ...valid, email: "not an email" }).email);
  });

  test("rejects a phone number that is too short or contains letters", () => {
    assert.ok(errorsFor({ ...valid, phone: "98765" }).phone);
    assert.ok(errorsFor({ ...valid, phone: "98765abcde" }).phone);
    assert.ok(errorsFor({ ...valid, phone: "+91 98765 4321O" }).phone);
  });

  test("accepts common phone formats", () => {
    for (const phone of ["9876543210", "+91 98765 43210", "080 2345 6789", "080-2345-6789"]) {
      assert.deepEqual(errorsFor({ ...valid, phone }), {}, phone);
    }
  });

  test("rejects unknown optional choices", () => {
    assert.ok(errorsFor({ ...valid, format: "zoom" }).format);
    assert.ok(errorsFor({ ...valid, participants: "lots" }).participants);
    assert.ok(errorsFor({ ...valid, timeline: "someday" }).timeline);
    assert.ok(errorsFor({ ...valid, state: "Atlantis" }).state);
  });

  test("accepts empty optional choices", () => {
    const result = leadSchema.safeParse({ ...valid, format: "", participants: "", timeline: "", state: "" });
    assert.ok(result.success, JSON.stringify(result.error?.issues));
  });

  test("rejects an unknown enquiry type", () => {
    assert.ok(errorsFor({ ...valid, eventType: "party" }).eventType);
  });

  test("accepts enquiry types from earlier versions of the form", () => {
    for (const eventType of ["innovation", "custom", "unsure"]) {
      assert.deepEqual(errorsFor({ ...valid, eventType }), {}, eventType);
    }
  });

  test("adds https:// to a website without a scheme", () => {
    const result = leadSchema.safeParse({ ...valid, website: "www.example.edu.in" });
    assert.ok(result.success, JSON.stringify(result.error?.issues));
    assert.equal(result.data.website, "https://www.example.edu.in");
  });

  test("rejects a website without a domain", () => {
    assert.ok(errorsFor({ ...valid, website: "localhost" }).website);
  });

  test("strips control characters but keeps newlines and tabs", () => {
    const result = leadSchema.safeParse({ ...valid, name: "Asha\u0000 Rao\u0007", message: "Line one\nLine\ttwo\u001F" });
    assert.ok(result.success, JSON.stringify(result.error?.issues));
    assert.equal(result.data.name, "Asha Rao");
    assert.equal(result.data.message, "Line one\nLine\ttwo");
  });

  test("enforces maximum lengths", () => {
    assert.ok(errorsFor({ ...valid, message: "x".repeat(3001) }).message);
  });
});

describe("fieldErrors", () => {
  test("keeps the first message per field", () => {
    const errors = fieldErrors([
      { path: ["email"], message: "first" },
      { path: ["email"], message: "second" },
      { path: ["phone"], message: "phone" },
    ]);
    assert.deepEqual(errors, { email: "first", phone: "phone" });
  });
});

describe("labelFor", () => {
  test("returns the option label", () => {
    assert.equal(labelFor(participantRanges, "1500+"), "1,500+");
    assert.equal(labelFor(allEventTypes, "unsure"), "Not sure yet");
  });

  test("reads an empty value as an em dash", () => {
    assert.equal(labelFor(participantRanges, ""), "—");
  });

  test("falls back to the raw value when it is unknown", () => {
    assert.equal(labelFor(participantRanges, "legacy"), "legacy");
  });
});
