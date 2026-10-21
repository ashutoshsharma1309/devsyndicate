import { redirect } from "next/navigation";
import { CONTACT_FORM_EDITOR_HREF } from "@/components/admin/cms/contact-tabs";
import { requireAdmin } from "@/lib/auth/admin";

/** SECTIONS.contactForm.adminHref points here; the editor sits under Contact information. */
export default async function Page() {
  await requireAdmin();
  redirect(CONTACT_FORM_EDITOR_HREF);
}
