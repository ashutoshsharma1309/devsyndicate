import { EditorPage } from "@/components/admin/cms/editor-page";
import { HomepageEditor } from "@/components/admin/cms/editors/homepage";
import { loadEditor } from "@/components/admin/cms/load";
import { requireAdmin } from "@/lib/auth/admin";
import { SECTIONS } from "@/lib/cms/sections";

export const metadata = { title: "Homepage content" };

export default async function Page() {
  await requireAdmin();
  const data = await loadEditor("homepage");
  return (
    <EditorPage info={SECTIONS.homepage} error={data.ok ? undefined : data.error}>
      {data.ok && <HomepageEditor initial={data.initial} revisions={data.revisions} revisionsError={data.revisionsError} />}
    </EditorPage>
  );
}
