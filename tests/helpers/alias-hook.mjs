// Module resolve hook for tests: maps the "@/…" path alias to the repo root, adds the .ts/.tsx
// extension Node needs to extensionless relative imports inside the app's TypeScript, and
// replaces "server-only" with an empty module, so server code can be imported by Node's test
// runner. Register it with module.register() before importing.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: "data:text/javascript,export {};", shortCircuit: true };
  }
  let base = null;
  if (specifier.startsWith("@/")) base = root + specifier.slice(2);
  else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith("file:") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    base = fileURLToPath(new URL(specifier, context.parentURL));
  }
  if (base) {
    for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, base]) {
      if (existsSync(candidate) && !candidate.endsWith("/")) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}
