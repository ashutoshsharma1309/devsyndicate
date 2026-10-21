import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";

/** Moved to Settings → Admin accounts. Kept so old links and bookmarks still work. */
export default async function TeamPage() {
  await requireAdmin();
  redirect("/admin/settings/admins");
}
