import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { requireAdmin, startPreviewSession } from "@/lib/auth/admin";
import { isPreviewPath } from "@/lib/cms/sections";

/**
 * GET /admin/content/preview?path=/services — turns on Draft Mode for this
 * browser and opens the page, which then renders saved drafts instead of the
 * live content (lib/cms getContent). Admins only; `path` must be one of the
 * public pages (no open redirect).
 */
export async function GET(req: NextRequest) {
  await requireAdmin();
  const path = req.nextUrl.searchParams.get("path") ?? "/";
  if (!isPreviewPath(path)) {
    return new Response("That page can't be previewed.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
    });
  }
  (await draftMode()).enable();
  await startPreviewSession();
  redirect(path);
}
