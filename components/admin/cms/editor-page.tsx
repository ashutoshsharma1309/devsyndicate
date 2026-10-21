import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/shell/page-header";
import type { SectionInfo } from "@/lib/cms/sections";

/** The frame of a content editor page: header with breadcrumbs, then the editor or a load error. Server-safe. */
export function EditorPage({
  info,
  title,
  description,
  error,
  before,
  children,
}: {
  info: SectionInfo;
  title?: string;
  description?: ReactNode;
  /** Set when the section couldn't be loaded; replaces the editor. */
  error?: string;
  /** Rendered between the header and the editor, e.g. tabs. */
  before?: ReactNode;
  children?: ReactNode;
}) {
  const heading = title ?? info.label;
  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title={heading}
        description={description ?? info.summary}
        breadcrumbs={[{ label: "Content", href: "/admin/content" }, { label: heading }]}
      />
      {before}
      {error ? (
        <div role="alert" className="rounded-md border border-danger/25 bg-danger/5 px-5 py-4 text-sm text-danger">
          <p className="font-medium">This editor couldn&apos;t load.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
