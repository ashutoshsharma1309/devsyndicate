import "server-only";
import { unstable_rethrow } from "next/navigation";
import { listSections, type SectionSummary } from "@/lib/cms";
import { sessionConfigured } from "@/lib/auth/session";
import type { LeadStats } from "@/lib/leads/types";

/**
 * Conditions that need someone's attention, read from the real configuration
 * and data. Nothing here is a heartbeat or a guess: every entry is something
 * that is true right now. Never includes a secret's value, only whether it is set.
 */
export type SystemIssue = {
  id: string;
  /** "critical": something is broken for visitors or admins. "warning": needs action. "info": worth knowing. */
  severity: "critical" | "warning" | "info";
  title: string;
  body: string;
  /** Optional links, e.g. to the affected leads or sections. */
  links?: { href: string; label: string }[];
};

const isProduction = () => process.env.NODE_ENV === "production";

/** Environment checks only (no I/O). */
export function configIssues(opts: { hasStore: boolean }): SystemIssue[] {
  const issues: SystemIssue[] = [];
  const prod = isProduction();

  if (!process.env.SMTP_HOST) {
    issues.push(
      prod
        ? {
            id: "smtp",
            severity: "critical",
            title: "Email notifications are unavailable",
            body: `SMTP_HOST isn't set, so nobody is emailed about new enquiries${
              opts.hasStore ? ". They're still saved here, so check Leads until it's configured." : "."
            }`,
          }
        : {
            id: "smtp",
            severity: "info",
            title: "Emails are printed to the server log",
            body: "SMTP_HOST isn't set, so in development notification and acknowledgement emails go to the terminal instead of being sent.",
          },
    );
  }

  if (prod) {
    const missing = [
      !sessionConfigured() && "SESSION_SECRET",
      !process.env.ADMIN_USERNAME?.trim() && "ADMIN_USERNAME",
      !process.env.ADMIN_PASSWORD_HASH && "ADMIN_PASSWORD_HASH",
      !process.env.DATABASE_URL && "DATABASE_URL",
    ].filter((v): v is string => Boolean(v));
    if (missing.length > 0) {
      issues.push({
        id: "env",
        severity: "critical",
        title: `${missing.length === 1 ? "A required setting is" : "Required settings are"} missing`,
        body: `Not set on the server: ${missing.join(", ")}.${
          missing.includes("DATABASE_URL") ? " Without DATABASE_URL, enquiries are only emailed, not stored." : ""
        }${
          missing.includes("ADMIN_USERNAME") || missing.includes("ADMIN_PASSWORD_HASH")
            ? " The primary admin can't sign in until both ADMIN_USERNAME and ADMIN_PASSWORD_HASH are set."
            : ""
        }`,
      });
    }
    if (!process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD) {
      issues.push({
        id: "plain-password",
        severity: "warning",
        title: "The primary admin's password is stored in plain text",
        body: "ADMIN_PASSWORD is set instead of ADMIN_PASSWORD_HASH. Generate a hash with npm run admin:hash, set it, and remove ADMIN_PASSWORD.",
      });
    }
  } else if (!opts.hasStore) {
    issues.push({
      id: "store",
      severity: "critical",
      title: "Lead storage isn't configured",
      body: "Enquiries can't be stored. Set DATABASE_URL and run npm run db:setup.",
    });
  }

  return issues;
}

export function notificationIssue(stats: Pick<LeadStats, "notifyFailed">): SystemIssue | null {
  const n = stats.notifyFailed;
  if (n === 0) return null;
  return {
    id: "notify-failed",
    severity: "warning",
    title: n === 1 ? "1 notification email couldn't be sent" : `${n} notification emails couldn't be sent`,
    body: "Those enquiries are saved here, but nobody was emailed about them. Follow them up directly.",
    links: [{ href: "/admin/leads?notifyStatus=failed", label: n === 1 ? "View the lead" : `View ${n} leads` }],
  };
}

export function draftIssue(sections: SectionSummary[]): SystemIssue | null {
  const drafts = sections.filter((s) => s.hasUnpublishedChanges);
  if (drafts.length === 0) return null;
  return {
    id: "drafts",
    severity: "info",
    title:
      drafts.length === 1
        ? "1 website section has unpublished changes"
        : `${drafts.length} website sections have unpublished changes`,
    body: "Saved drafts aren't on the public website until they're published.",
    links: drafts.map((s) => ({ href: s.adminHref, label: s.label })),
  };
}

/** Content sections with their publish state; [] if the content store can't be read (listSections logs it). */
export async function contentSections(): Promise<SectionSummary[]> {
  try {
    return await listSections();
  } catch (err) {
    unstable_rethrow(err);
    // listSections() already tolerates a store error; this only catches the unexpected.
    console.error("[admin] Couldn't list content sections:", (err as { code?: string })?.code ?? "unknown error");
    return [];
  }
}

const order = { critical: 0, warning: 1, info: 2 } as const;
export const sortIssues = (issues: (SystemIssue | null)[]) =>
  issues.filter((i): i is SystemIssue => i !== null).sort((a, b) => order[a.severity] - order[b.severity]);
