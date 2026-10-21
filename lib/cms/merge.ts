/**
 * How stored content becomes what the site renders. Pure: no imports, so the
 * admin editors and Node's test runner can use it directly.
 *
 * - Stored content is merged over the defaults: objects merge key by key,
 *   anything else (strings, booleans, lists) replaces the default outright.
 *   A list is edited as a whole, so items removed by an editor stay removed.
 * - Keys that aren't in the defaults are dropped.
 * - The result is validated. A part that fails falls back to its default,
 *   field by field, so one bad value never takes a page down.
 */

type SafeParser = {
  safeParse(input: unknown): { success: true; data: unknown } | { success: false; error: unknown };
};
type ObjectSchema = SafeParser & { shape: Record<string, SafeParser> };

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

const isObjectSchema = (s: SafeParser): s is ObjectSchema =>
  "shape" in s && isPlainObject((s as { shape?: unknown }).shape);

/** `over` merged onto `base`. Only `base`'s keys survive; non-objects in `over` replace `base` wholesale. */
export function deepMerge(base: unknown, over: unknown): unknown {
  if (over === undefined) return base;
  if (isPlainObject(base) && isPlainObject(over)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(base)) {
      out[key] = Object.hasOwn(over, key) ? deepMerge(base[key], over[key]) : base[key];
    }
    return out;
  }
  return over;
}

/**
 * `value` parsed by `schema`, with every part that fails replaced by the same
 * part of `fallback` (which must itself be valid). Never throws.
 */
export function parseWithFallback<T>(schema: SafeParser, value: unknown, fallback: T): T {
  const whole = schema.safeParse(value);
  if (whole.success) return whole.data as T;
  if (isObjectSchema(schema) && isPlainObject(value) && isPlainObject(fallback)) {
    const repaired: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(schema.shape)) {
      repaired[key] = parseWithFallback(child, value[key], fallback[key]);
    }
    const again = schema.safeParse(repaired);
    if (again.success) return again.data as T;
  }
  return fallback;
}

/** Stored content (or null for "nothing stored") → complete, valid section content. */
export function resolveContent<T>(schema: SafeParser, defaults: T, stored: unknown): T {
  if (stored === null || stored === undefined) return defaults;
  return parseWithFallback(schema, deepMerge(defaults, stored), defaults);
}

/** Order-sensitive structural equality for JSON values (schema output has a fixed key order). */
export function sameContent(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
