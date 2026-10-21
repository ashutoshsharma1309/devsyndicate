import Link from "next/link";
import type { ReactNode } from "react";
import { leadStatuses, type ActivityEntry } from "@/lib/leads/types";
import { cn, formatDate } from "@/lib/utils";

/**
 * The activity log as sentences, for the overview's recent activity and the
 * activity log page. No server imports, so a client component can use
 * describeActivity() too.
 *
 * Context for a sentence:
 * - liveLeadIds: leads that still exist get a link; a deleted lead keeps its stored name as text.
 * - sectionHrefs: content section label → its editor, e.g. { Homepage: "/admin/content/homepage" }.
 */
export type ActivityContext = { liveLeadIds?: ReadonlySet<string>; sectionHrefs?: Readonly<Record<string, string>> };

const statusLabel = (v: string) => leadStatuses.find((s) => s.value === v)?.label ?? v;

const pipelineFieldLabels: Record<string, string> = {
  nextFollowUp: "next follow-up",
  lastContacted: "last contacted",
  meetingAt: "meeting time",
  proposalDetails: "proposal details",
  lossReason: "loss reason",
};

const fieldList = (detail: string, labels: Record<string, string> = {}) =>
  detail
    .replace(/^fields: /, "")
    .split(", ")
    .filter(Boolean)
    .map((f) => labels[f] ?? f)
    .join(", ");

/** "Asha Rao <asha@x.in>: disabled" → ["Asha Rao <asha@x.in>", "disabled"]. */
function splitDetail(detail: string): [string, string] {
  const i = detail.indexOf(": ");
  return i === -1 ? [detail, ""] : [detail.slice(0, i), detail.slice(i + 2)];
}

const linkClass = "font-medium text-signal underline-offset-4 hover:underline";
const muted = (s: string) => <span className="text-mute"> ({s})</span>;

function leadSubject(e: ActivityEntry, ctx: ActivityContext): ReactNode {
  const label = e.leadLabel || "a lead";
  if (e.leadId && ctx.liveLeadIds?.has(e.leadId)) {
    return (
      <Link href={`/admin/leads/${e.leadId}`} className={linkClass}>
        {label}
      </Link>
    );
  }
  return <span className="font-medium">{label}</span>;
}

/** "Homepage" → a link to its editor when known. */
function sectionName(label: string, ctx: ActivityContext): ReactNode {
  const href = ctx.sectionHrefs?.[label];
  return href ? (
    <Link href={href} className={linkClass}>
      {label}
    </Link>
  ) : (
    <span className="font-medium">{label}</span>
  );
}

/** One log entry as a sentence. Details hold no personal data (field names, statuses, counts). */
export function describeActivity(e: ActivityEntry, ctx: ActivityContext = {}): ReactNode {
  const detail = e.detail ?? "";
  switch (e.action) {
    case "login":
      return "Signed in";
    case "login_failed":
      return detail ? <>Failed sign-in attempt as {detail}</> : "Failed sign-in attempt";
    case "logout":
      return "Signed out";
    case "status_changed": {
      const [from, to] = detail.split(" → ");
      return to ? (
        <>
          Moved {leadSubject(e, ctx)} from {statusLabel(from)} to {statusLabel(to)}
        </>
      ) : (
        <>Changed the status of {leadSubject(e, ctx)}</>
      );
    }
    case "pipeline_updated":
      return (
        <>
          Updated the pipeline details of {leadSubject(e, ctx)}
          {detail && muted(fieldList(detail, pipelineFieldLabels))}
        </>
      );
    case "note_added":
      return <>Added a note to {leadSubject(e, ctx)}</>;
    case "contact_updated":
      return (
        <>
          Corrected the contact details of {leadSubject(e, ctx)}
          {detail && muted(fieldList(detail))}
        </>
      );
    case "lead_deleted":
      return <>Deleted the lead {leadSubject(e, ctx)}</>;
    case "export":
      return <>Exported leads{detail && muted(detail)}</>;
    case "content_published": {
      // "Contact form" or "Contact form (notification recipient changed)".
      const m = /^(.*?)(?: \((.+)\))?$/.exec(detail);
      const label = m?.[1] ?? "";
      return label ? (
        <>
          Published changes to {sectionName(label, ctx)}
          {m?.[2] && muted(m[2])}
        </>
      ) : (
        "Published website content"
      );
    }
    case "content_saved": {
      const [label, change] = splitDetail(detail);
      if (change === "draft saved") return <>Saved a draft of {sectionName(label, ctx)}</>;
      if (change === "draft discarded") return <>Discarded the draft of {sectionName(label, ctx)}</>;
      return <>Edited website content{detail && muted(detail)}</>;
    }
    case "content_reverted": {
      const [label, change] = splitDetail(detail);
      if (change === "draft reset to the original copy") {
        return <>Reset {sectionName(label, ctx)} to the original copy, as a draft</>;
      }
      if (change.startsWith("draft from the version published ")) {
        return (
          <>
            Restored an earlier version of {sectionName(label, ctx)} as a draft
            {muted(change.replace(/^draft from the version /, ""))}
          </>
        );
      }
      return <>Restored website content{detail && muted(detail)}</>;
    }
    case "admin_created":
      return <>Added the admin account {detail}</>;
    case "admin_updated": {
      const i = detail.lastIndexOf(": ");
      const [account, change] = i === -1 ? [detail, ""] : [detail.slice(0, i), detail.slice(i + 2)];
      if (change === "disabled") return <>Disabled the admin account {account}</>;
      if (change === "enabled") return <>Re-enabled the admin account {account}</>;
      if (change === "password reset") return <>Reset the password for {account}</>;
      return <>Updated the admin account {detail}</>;
    }
    case "password_changed":
      return "Changed their own password";
    default:
      return e.action;
  }
}

/** Failed sign-ins read as a warning: red text plus the word "Failed", never colour alone. */
const tone = (e: ActivityEntry) => (e.action === "login_failed" ? "text-danger" : undefined);

/** Compact feed: the sentence, then who and when. For the overview. */
export function ActivityFeed({ entries, ...ctx }: { entries: ActivityEntry[] } & ActivityContext) {
  return (
    <ol className="divide-y divide-line">
      {entries.map((e) => (
        <li key={e.id} className="px-5 py-3 text-sm">
          <p className={cn("break-words", tone(e))}>{describeActivity(e, ctx)}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-mute">
            <span className="break-all">{e.actor}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={e.at} className="tabular-nums">
              {formatDate(e.at, true)}
            </time>
          </p>
        </li>
      ))}
    </ol>
  );
}

/**
 * The full log as a table: Time (IST), Who, What. Below sm the time and actor
 * fold into the What cell, so the table never scrolls sideways at phone width.
 */
export function ActivityTable({
  entries,
  caption,
  ...ctx
}: { entries: ActivityEntry[]; caption: string } & ActivityContext) {
  return (
    <table className="w-full table-fixed border-collapse text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="hidden sm:table-header-group">
        <tr className="border-b border-line">
          <th scope="col" className="t-label w-52 px-5 py-3 font-normal text-mute">
            Time (IST)
          </th>
          <th scope="col" className="t-label w-[30%] px-5 py-3 font-normal text-mute">
            Who
          </th>
          <th scope="col" className="t-label px-5 py-3 font-normal text-mute">
            What
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {entries.map((e) => (
          <tr key={e.id} className="align-top">
            <td className="hidden px-5 py-3.5 tabular-nums text-mute sm:table-cell">
              <time dateTime={e.at}>{formatDate(e.at, true)}</time>
            </td>
            <td className="hidden break-words px-5 py-3.5 sm:table-cell">{e.actor}</td>
            <td className="px-4 py-3.5 sm:px-5">
              <span className={cn("block break-words", tone(e))}>{describeActivity(e, ctx)}</span>
              <span className="mt-1 flex flex-wrap gap-x-2 text-xs text-mute sm:hidden">
                <span className="break-all">{e.actor}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={e.at} className="tabular-nums">
                  {formatDate(e.at, true)}
                </time>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
