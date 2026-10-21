import { CONTACT_FORM_EDITOR_HREF, ContactTabs } from "@/components/admin/cms/contact-tabs";
import { EditorPage } from "@/components/admin/cms/editor-page";
import { ContactFormEditor } from "@/components/admin/cms/editors/contact";
import { loadEditor } from "@/components/admin/cms/load";
import { requireAdmin } from "@/lib/auth/admin";
import { SECTIONS } from "@/lib/cms/sections";

export const metadata = { title: "Contact form" };

export default async function Page() {
  await requireAdmin();
  const data = await loadEditor("contactForm");
  return (
    <EditorPage
      info={SECTIONS.contactForm}
      title="Contact information"
      description="Whether the enquiry form is open, who is notified, enquiry types and the confirmation message."
      error={data.ok ? undefined : data.error}
      before={<ContactTabs current={CONTACT_FORM_EDITOR_HREF} />}
    >
      {data.ok && <ContactFormEditor initial={data.initial} revisions={data.revisions} revisionsError={data.revisionsError} />}
    </EditorPage>
  );
}
