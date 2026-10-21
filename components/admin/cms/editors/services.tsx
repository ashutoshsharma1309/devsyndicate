"use client";

import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PHASES, type FormatEntry, type LifecycleStage, type ServicesContent } from "@/lib/cms/schema";
import { useEditor } from "../context";
import { SectionEditor } from "../editor";
import { BoolField, EditorGroup, FieldRow, ListEditor, SelectField, StringListField, SubGroup, TextField } from "../fields";
import { JumpLinks } from "../jump-links";
import type { EditorData, PublishCheck } from "../types";
import { CtaFields, IntroFields } from "./shared";

const GROUPS = [
  { id: "sv-hero", label: "Page hero" },
  { id: "sv-stages", label: "Lifecycle stages" },
  { id: "sv-formats", label: "Formats" },
  { id: "sv-partners", label: "Partner options" },
];

const phaseOptions = PHASES.map((p) => ({ value: p, label: p }));

export function HiddenTag({ hidden }: { hidden: boolean }) {
  if (!hidden) return null;
  return (
    <span className="shrink-0 rounded-xs border border-ink/15 px-1.5 text-xs font-normal leading-5 text-mute">Hidden</span>
  );
}

/** Rewrites the stage numbers as 01, 02, … in their current order. */
function RenumberButton() {
  const ctx = useEditor();
  const stages = (ctx.get("stages") as LifecycleStage[] | undefined) ?? [];
  const inOrder = stages.every((s, i) => s.n === String(i + 1).padStart(2, "0"));
  return (
    <Button
      type="button"
      variant="secondary"
      className="h-9 px-3.5 text-sm"
      disabled={ctx.disabled || inOrder}
      onClick={() => ctx.set("stages", stages.map((s, i) => ({ ...s, n: String(i + 1).padStart(2, "0") })))}
    >
      <ListOrdered aria-hidden="true" className="size-4" />
      Renumber 01–{String(stages.length).padStart(2, "0")}
    </Button>
  );
}

function servicesChecks(value: ServicesContent): PublishCheck[] {
  const checks: PublishCheck[] = [];
  if (value.stages.every((s) => !s.visible)) checks.push({ kind: "warning", message: "Every lifecycle stage is hidden, so the lifecycle section will be empty." });
  if (value.formats.every((f) => !f.visible)) checks.push({ kind: "warning", message: "Every format is hidden, so no formats will be listed." });
  return checks;
}

export function ServicesEditor(props: EditorData<"services">) {
  return (
    <SectionEditor {...props} publishChecks={servicesChecks}>
      <JumpLinks items={GROUPS} />

      <EditorGroup id="sv-hero" title="Page hero" description="The top of /services.">
        <TextField path="hero.eyebrow" label="Eyebrow" max={80} />
        <TextField path="hero.title" label="Title" max={160} />
        <TextField path="hero.lead" label="Lead" max={400} long rows={3} />
        <FieldRow>
          <CtaFields path="hero.primaryCta" title="Primary button" />
          <CtaFields path="hero.secondaryCta" title="Secondary button" />
        </FieldRow>
      </EditorGroup>

      <EditorGroup
        id="sv-stages"
        title="Lifecycle stages"
        description="The stages from first idea to final report. Hidden stages stay here but aren't shown on the site."
      >
        <IntroFields path="stagesIntro" title="Section heading" />
        <SubGroup title="Phase introductions" hint="One line under each phase name.">
          {PHASES.map((p) => (
            <TextField key={p} path={`phaseIntros.${p}`} label={p} max={200} />
          ))}
        </SubGroup>
        <ListEditor<LifecycleStage>
          path="stages"
          label="Stages"
          itemLabel="Stage"
          min={1}
          max={12}
          newItem={() => ({ n: "", title: "", phase: "Plan", body: "", deliverables: [""], visible: true })}
          summary={(s) => [s.n, s.title].filter(Boolean).join(" · ")}
          badge={(s) => <HiddenTag hidden={!s.visible} />}
          toolbar={<RenumberButton />}
          hint="Numbers don't change when you reorder. Use Renumber to put them back in order."
          renderItem={(p) => (
            <>
              <div className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)_10rem]">
                <TextField path={`${p}.n`} label="Number" max={3} inputMode="numeric" validate={(v) => (/^\d{1,3}$/.test(v) ? undefined : "Use digits, e.g. 01")} />
                <TextField path={`${p}.title`} label="Title" max={60} />
                <SelectField path={`${p}.phase`} label="Phase" options={phaseOptions} />
              </div>
              <TextField path={`${p}.body`} label="Description" max={400} long rows={3} />
              <StringListField path={`${p}.deliverables`} label="Deliverables" itemLabel="Deliverable" max={60} maxItems={8} />
              <BoolField path={`${p}.visible`} label="Show this stage on the website" />
            </>
          )}
        />
      </EditorGroup>

      <EditorGroup
        id="sv-formats"
        title="Formats"
        description="The five event formats. They can be reordered, reworded or hidden, but not added or removed: links such as /contact?format=CAMPUS depend on their codes."
      >
        <ListEditor<FormatEntry>
          path="formats"
          label="Formats"
          itemLabel="Format"
          summary={(f) => `${f.title || "Untitled"} (${f.code})`}
          badge={(f) => <HiddenTag hidden={!f.visible} />}
          renderItem={(p) => (
            <>
              <TextField path={`${p}.title`} label="Title" max={60} />
              <TextField path={`${p}.summary`} label="Summary" max={200} long rows={2} />
              <TextField path={`${p}.scope`} label="Who takes part" max={200} />
              <TextField path={`${p}.goodFor`} label="Good for" max={300} long rows={2} />
              <BoolField path={`${p}.visible`} label="Show this format on the website" />
            </>
          )}
        />
      </EditorGroup>

      <EditorGroup id="sv-partners" title="Partner options" description="The section for companies on /services.">
        <TextField path="partners.label" label="Label" max={60} />
        <TextField path="partners.heading" label="Heading" max={160} />
        <TextField path="partners.description" label="Description" max={600} long rows={3} />
        <CtaFields path="partners.cta" title="Button" />
        <ListEditor<ServicesContent["partners"]["options"][number]>
          path="partners.options"
          label="Ways to take part"
          itemLabel="Option"
          min={1}
          max={8}
          newItem={() => ({ title: "", body: "" })}
          summary={(o) => o.title}
          renderItem={(p) => (
            <>
              <TextField path={`${p}.title`} label="Title" max={120} />
              <TextField path={`${p}.body`} label="Text" max={600} long rows={2} />
            </>
          )}
        />
      </EditorGroup>
    </SectionEditor>
  );
}
