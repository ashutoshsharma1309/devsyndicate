import { EditorPage } from "@/components/admin/cms/editor-page";
import { TeamEditor } from "@/components/admin/cms/editors/team";
import { loadEditor } from "@/components/admin/cms/load";
import { requireAdmin } from "@/lib/auth/admin";
import { SECTIONS } from "@/lib/cms/sections";

export const metadata = { title: "Team content" };

export default async function Page() {
  await requireAdmin();
  const data = await loadEditor("team");
  return (
    <EditorPage info={SECTIONS.team} error={data.ok ? undefined : data.error}>
      {data.ok && <TeamEditor initial={data.initial} revisions={data.revisions} revisionsError={data.revisionsError} />}
    </EditorPage>
  );
}
