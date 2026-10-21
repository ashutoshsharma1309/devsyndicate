import Link from "next/link";
import { ExternalLink, PencilLine } from "lucide-react";
import { CONTACT_FORM_EDITOR_HREF } from "@/components/admin/cms/contact-tabs";
import { formatStamp, publishStatus } from "@/components/admin/cms/format";
import { ContentStatusBadge } from "@/components/admin/cms/status";
import { AdminPageHeader } from "@/components/admin/shell/page-header";
import { requireAdmin } from "@/lib/auth/admin";
import { listSections, PAGE_LABELS, type SectionKey } from "@/lib/cms";
import { getContentStore } from "@/lib/cms/store";

export const metadata = { title: "Content" };

/** The contact form editor lives under Contact information (SECTIONS.contactForm.adminHref redirects there). */
const editorHref = (key: SectionKey, adminHref: string) => (key === "contactForm" ? CONTACT_FORM_EDITOR_HREF : adminHref);

const pageLabel = (path: string) => (PAGE_LABELS as Record<string, string>)[path] ?? path;

const action =
  "inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-line bg-white px-2.5 text-sm transition-colors duration-150 hover:border-ink/30";

export default async function ContentPage() {
  await requireAdmin();
  const [sections, store] = await Promise.all([listSections(), getContentStore()]);
  const pending = sections.filter((s) => s.hasUnpublishedChanges).length;

  return (
    <div>
      <AdminPageHeader
        title="Content"
        description="Edit the website's copy section by section. Changes are saved as drafts, can be previewed, and only reach the website when you publish."
        meta={
          <span className="tabular-nums">
            {sections.length} sections
            {pending > 0 && ` · ${pending} with unpublished changes`}
          </span>
        }
      />

      {!store && (
        <p role="alert" className="mb-6 rounded-md border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          Content storage isn&apos;t configured on this server, so the website shows its original copy and nothing can be
          published. Set <code className="font-mono">DATABASE_URL</code> and run{" "}
          <code className="font-mono">npm run db:setup</code>.
        </p>
      )}

      <div className="relative overflow-x-auto rounded-md border border-line bg-white">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <caption className="sr-only">Website content sections and their publishing status</caption>
          <thead className="border-b border-line bg-paper/60">
            <tr className="t-label text-mute">
              <th scope="col" className="px-5 py-3 font-normal">
                Section
              </th>
              <th scope="col" className="px-5 py-3 font-normal">
                Status
              </th>
              <th scope="col" className="px-5 py-3 font-normal">
                Last published
              </th>
              <th scope="col" className="px-5 py-3 text-right font-normal">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sections.map((s) => {
              const href = editorHref(s.key, s.adminHref);
              const previewPath = s.publicPaths[0] ?? "/";
              return (
                <tr key={s.key} className="align-top">
                  <th scope="row" className="px-5 py-4 font-normal">
                    <Link href={href} className="font-medium hover:text-signal hover:underline underline-offset-4">
                      {s.label}
                    </Link>
                    <p className="mt-0.5 max-w-md text-mute">{s.summary}</p>
                    <p className="mt-1 text-xs text-mute">
                      <span className="sr-only">Shows on: </span>
                      {s.publicPaths.length > 4 ? "Every page" : s.publicPaths.map(pageLabel).join(" · ")}
                    </p>
                  </th>
                  <td className="px-5 py-4">
                    <ContentStatusBadge status={publishStatus(s)} />
                    {s.hasUnpublishedChanges && s.draftSavedAt && (
                      <p className="mt-1 text-xs text-mute">Draft saved {formatStamp(s.draftSavedAt)}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-mute">
                    {s.publishedAt ? (
                      <>
                        <time dateTime={s.publishedAt} className="tabular-nums text-ink">
                          {formatStamp(s.publishedAt)}
                        </time>
                        {s.publishedBy && <p className="mt-0.5 break-words text-xs">by {s.publishedBy}</p>}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link href={href} className={action}>
                        <PencilLine aria-hidden="true" className="size-3.5" />
                        Edit<span className="sr-only"> {s.label}</span>
                      </Link>
                      {/* A plain link: the preview route sets a cookie, which a prefetch would do too early. */}
                      <a
                        href={`/admin/content/preview?path=${encodeURIComponent(previewPath)}`}
                        target="_blank"
                        rel="noopener"
                        className={action}
                      >
                        <ExternalLink aria-hidden="true" className="size-3.5" />
                        Preview
                        <span className="sr-only">
                          {" "}
                          {s.label} on {pageLabel(previewPath)} (opens in a new tab)
                        </span>
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-mute">
        Preview opens the website in a new tab showing saved drafts (only for you). Use “Exit preview” on that page to go
        back to the live version.
      </p>
    </div>
  );
}
