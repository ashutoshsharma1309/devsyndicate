import { ContactTabs } from "@/components/admin/cms/contact-tabs";
import { EditorPage } from "@/components/admin/cms/editor-page";
import { ContactEditor } from "@/components/admin/cms/editors/contact";
import { loadEditor } from "@/components/admin/cms/load";
import { requireAdmin } from "@/lib/auth/admin";
import { SECTIONS } from "@/lib/cms/sections";

export const metadata = { title: "Contact details" };

export default async function Page() {
  await requireAdmin();
  const data = await loadEditor("contact");
  return (
    <EditorPage
      info={SECTIONS.contact}
      title="Contact information"
      error={data.ok ? undefined : data.error}
      before={<ContactTabs current="/admin/content/contact" />}
    >
      {data.ok && <ContactEditor initial={data.initial} revisions={data.revisions} revisionsError={data.revisionsError} />}
    </EditorPage>
  );
}
