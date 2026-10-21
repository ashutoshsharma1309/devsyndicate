/**
 * Dotted-path helpers for the content editors ("hero.headline.0",
 * "members.1.linkedin" — the same paths the server returns in fieldErrors).
 * Pure and client-safe.
 */

export type Path = string;

const parts = (path: Path) => (path === "" ? [] : path.split("."));

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** The value at `path`, or undefined. */
export function getAt(root: unknown, path: Path): unknown {
  let cur: unknown = root;
  for (const p of parts(path)) {
    if (!isObject(cur)) return undefined;
    cur = Array.isArray(cur) ? cur[Number(p)] : cur[p];
  }
  return cur;
}

/** A copy of `root` with `value` at `path`. Copies only the objects along the path. */
export function setAt<T>(root: T, path: Path, value: unknown): T {
  const keys = parts(path);
  if (keys.length === 0) return value as T;
  const write = (node: unknown, i: number): unknown => {
    const key = keys[i];
    const last = i === keys.length - 1;
    if (Array.isArray(node)) {
      const copy = node.slice();
      const idx = Number(key);
      copy[idx] = last ? value : write(copy[idx], i + 1);
      return copy;
    }
    const obj = isObject(node) ? node : {};
    return { ...obj, [key]: last ? value : write(obj[key], i + 1) };
  };
  return write(root, 0) as T;
}

/** Joins path segments, skipping empty ones: join("faq.items", 2, "q") → "faq.items.2.q". */
export const join = (...segments: (string | number)[]): Path =>
  segments
    .map(String)
    .filter((s) => s !== "")
    .join(".");

/** A DOM id for the control at `path` in section `section`. */
export const fieldId = (section: string, path: Path) => `cms-${section}-${path.replace(/[^A-Za-z0-9_-]+/g, "-")}`;

/**
 * Where `next` differs from `prev`, as paths. Arrays of equal length are
 * compared item by item; a list whose length changed is reported as the list
 * itself (an item was added or removed), as is a list that was only reordered.
 */
export function changedPaths(prev: unknown, next: unknown, base: Path = ""): Path[] {
  if (Object.is(prev, next)) return [];
  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return [base];
    const out: Path[] = [];
    for (let i = 0; i < next.length; i++) out.push(...changedPaths(prev[i], next[i], join(base, i)));
    // Every item changed but the same items are all still there: a reorder.
    if (out.length > 0 && isPermutation(prev, next)) return [base];
    return out;
  }
  if (isObject(prev) && isObject(next) && !Array.isArray(prev) && !Array.isArray(next)) {
    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    const out: Path[] = [];
    for (const k of keys) out.push(...changedPaths(prev[k], next[k], join(base, k)));
    return out;
  }
  return JSON.stringify(prev) === JSON.stringify(next) ? [] : [base];
}

function isPermutation(a: unknown[], b: unknown[]): boolean {
  const key = (v: unknown) => JSON.stringify(v);
  const counts = new Map<string, number>();
  for (const v of a) counts.set(key(v), (counts.get(key(v)) ?? 0) + 1);
  for (const v of b) {
    const n = counts.get(key(v));
    if (!n) return false;
    counts.set(key(v), n - 1);
  }
  return true;
}

/**
 * The best label for `path` among registered field labels: its own, else the
 * closest registered ancestor's (e.g. a list), else a readable form of the path.
 */
export function labelFor(path: Path, labels: ReadonlyMap<Path, string>): string {
  let p = path;
  while (true) {
    const hit = labels.get(p);
    if (hit) return hit;
    if (p === "") break;
    const i = p.lastIndexOf(".");
    p = i === -1 ? "" : p.slice(0, i);
  }
  return humanise(path);
}

/** "sections.whatWeDo.heading" → "Sections › What we do › Heading"; list indexes count from 1. */
export function humanise(path: Path): string {
  if (!path) return "Whole section";
  return parts(path)
    .map((p) => {
      if (/^\d+$/.test(p)) return `#${Number(p) + 1}`;
      const words = p.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
      return words.charAt(0).toUpperCase() + words.slice(1);
    })
    .join(" › ");
}
