import { EditorPage } from "@/components/admin/cms/editor-page";
import { SeoEditor } from "@/components/admin/cms/editors/seo";
import { loadEditor } from "@/components/admin/cms/load";
import { requireAdmin } from "@/lib/auth/admin";
import { SECTIONS } from "@/lib/cms/sections";

export const metadata = { title: "Search & sharing" };

export default async function Page() {
  await requireAdmin();
  const data = await loadEditor("seo");
  return (
    <EditorPage info={SECTIONS.seo} error={data.ok ? undefined : data.error}>
      {data.ok && <SeoEditor initial={data.initial} revisions={data.revisions} revisionsError={data.revisionsError} />}
    </EditorPage>
  );
}
