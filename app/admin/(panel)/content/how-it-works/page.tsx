import { EditorPage } from "@/components/admin/cms/editor-page";
import { HowItWorksEditor } from "@/components/admin/cms/editors/how-it-works";
import { loadEditor } from "@/components/admin/cms/load";
import { requireAdmin } from "@/lib/auth/admin";
import { SECTIONS } from "@/lib/cms/sections";

export const metadata = { title: "How it works content" };

export default async function Page() {
  await requireAdmin();
  const data = await loadEditor("howItWorks");
  return (
    <EditorPage info={SECTIONS.howItWorks} error={data.ok ? undefined : data.error}>
      {data.ok && <HowItWorksEditor initial={data.initial} revisions={data.revisions} revisionsError={data.revisionsError} />}
    </EditorPage>
  );
}
