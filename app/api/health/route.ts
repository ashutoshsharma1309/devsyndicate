import { connection, NextResponse } from "next/server";
import { getMailer } from "@/lib/email";
import { getLeadStore } from "@/lib/leads/store";

const PING_TIMEOUT_MS = 5_000;

type Health = {
  status: "ok" | "degraded";
  store: "postgres" | "file" | "none";
  mailer: "smtp" | "console" | "none";
  database: "ok" | "error" | "n/a";
};

/**
 * Uptime check: can the contact form accept leads right now? That needs a
 * lead store or a mailer, and a reachable database if a store is configured.
 * Reports only which backends are in use — never env values or error details.
 */
export async function GET() {
  await connection(); // always evaluate at request time, never at build

  const [store, mailer] = await Promise.all([getLeadStore(), getMailer()]);

  let database: Health["database"] = "n/a";
  if (store) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        store.ping(),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("ping timed out")), PING_TIMEOUT_MS);
        }),
      ]);
      database = "ok";
    } catch (err) {
      console.error("[health] lead store ping failed:", err);
      database = "error";
    } finally {
      clearTimeout(timer);
    }
  }

  const canAcceptLeads = Boolean(store || mailer) && database !== "error";
  const body: Health = {
    status: canAcceptLeads ? "ok" : "degraded",
    store: store?.kind ?? "none",
    mailer: mailer?.kind ?? "none",
    database,
  };
  return NextResponse.json(body, { status: canAcceptLeads ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
