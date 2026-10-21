"use client";

import { usePathname } from "next/navigation";

/**
 * Shown only while Draft Mode is on (an admin opened /admin/content/preview),
 * so normal visitors never see it: the (site) layout renders it only when
 * `draftMode().isEnabled`. The exit link is a plain <a>, never next/link:
 * a prefetch of the exit route would end the preview early.
 */
export function PreviewBar() {
  const pathname = usePathname() || "/";
  const exitHref = `/admin/content/preview/exit?path=${encodeURIComponent(pathname)}`;
  return (
    <aside
      aria-label="Preview"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-signal/40 bg-ink text-white print:hidden"
    >
      <div className="container-x flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm">
        <p className="flex items-center gap-2.5">
          <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-signal-soft" />
          <span>Previewing unpublished changes</span>
        </p>
        <a
          href={exitHref}
          className="t-label inline-flex min-h-8 items-center rounded-sm px-2 text-signal-soft underline decoration-signal-soft/40 underline-offset-4 transition-colors duration-200 hover:text-white hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-soft"
        >
          Exit preview
        </a>
      </div>
    </aside>
  );
}
