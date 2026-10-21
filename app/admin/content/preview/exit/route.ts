import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { endPreviewSession } from "@/lib/auth/admin";
import { safeAdminPath } from "@/lib/auth/session";
import { isPreviewPath } from "@/lib/cms/sections";

/**
 * GET /admin/content/preview/exit — turns Draft Mode off and returns to `path`
 * (a public page, or an /admin page such as the editor), else the homepage.
 * Deliberately needs no sign-in (proxy.ts lets it through): switching a preview
 * OFF is harmless, and someone whose session has ended must still be able to leave
 * the preview. The redirect target stays limited to public pages and admin paths.
 * Link to it with a plain <a> (or prefetch={false}): a prefetch would end the
 * preview early.
 */
export async function GET(req: NextRequest) {
  (await draftMode()).disable();
  await endPreviewSession();
  const path = req.nextUrl.searchParams.get("path");
  redirect(isPreviewPath(path) ? path : (safeAdminPath(path) ?? "/"));
}
