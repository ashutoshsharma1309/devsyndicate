import { EditorPage } from "@/components/admin/cms/editor-page";
import { ServicesEditor } from "@/components/admin/cms/editors/services";
import { loadEditor } from "@/components/admin/cms/load";
import { requireAdmin } from "@/lib/auth/admin";
import { SECTIONS } from "@/lib/cms/sections";

export const metadata = { title: "Services content" };

export default async function Page() {
  await requireAdmin();
  const data = await loadEditor("services");
  return (
    <EditorPage info={SECTIONS.services} error={data.ok ? undefined : data.error}>
      {data.ok && <ServicesEditor initial={data.initial} revisions={data.revisions} revisionsError={data.revisionsError} />}
    </EditorPage>
  );
}
