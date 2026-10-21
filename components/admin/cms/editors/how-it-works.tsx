"use client";

import type { HowItWorksContent } from "@/lib/cms/schema";
import { SectionEditor } from "../editor";
import { EditorGroup, FieldRow, ListEditor, TextField } from "../fields";
import { JumpLinks } from "../jump-links";
import type { EditorData } from "../types";
import { CtaFields, IntroFields } from "./shared";

const GROUPS = [
  { id: "hw-hero", label: "Page hero" },
  { id: "hw-steps", label: "Process steps" },
  { id: "hw-after", label: "After contact" },
  { id: "hw-timing", label: "Timing" },
];

type Step = HowItWorksContent["steps"][number];
type Fact = HowItWorksContent["hero"]["facts"][number];
type AfterStep = HowItWorksContent["afterContact"]["steps"][number];
type Window = HowItWorksContent["timing"]["windows"][number];

export function HowItWorksEditor(props: EditorData<"howItWorks">) {
  return (
    <SectionEditor {...props}>
      <JumpLinks items={GROUPS} />

      <EditorGroup id="hw-hero" title="Page hero" description="The top of /how-it-works.">
        <TextField path="hero.eyebrow" label="Eyebrow" max={80} />
        <TextField path="hero.title" label="Title" max={160} />
        <TextField path="hero.lead" label="Lead" max={400} long rows={3} />
        <ListEditor<Fact>
          path="hero.facts"
          label="Key facts"
          itemLabel="Fact"
          min={0}
          max={6}
          newItem={() => ({ label: "", value: "" })}
          summary={(f) => [f.label, f.value].filter(Boolean).join(": ")}
          hint="Short label and value pairs shown in the page hero."
          renderItem={(p) => (
            <FieldRow>
              <TextField path={`${p}.label`} label="Label" max={40} />
              <TextField path={`${p}.value`} label="Value" max={60} />
            </FieldRow>
          )}
        />
      </EditorGroup>

      <EditorGroup
        id="hw-steps"
        title="Process steps"
        description="Numbered in the order shown here (the number isn't stored, so reordering renumbers them)."
      >
        <IntroFields path="stepsIntro" title="Section heading" />
        <ListEditor<Step>
          path="steps"
          label="Steps"
          itemLabel="Step"
          min={1}
          max={10}
          newItem={() => ({ title: "", body: "", fromYou: "", fromUs: "" })}
          summary={(s) => s.title}
          renderItem={(p) => (
            <>
              <TextField path={`${p}.title`} label="Title" max={120} />
              <TextField path={`${p}.body`} label="Description" max={400} long rows={2} />
              <FieldRow>
                <TextField path={`${p}.fromYou`} label="From your college" max={300} long rows={3} />
                <TextField path={`${p}.fromUs`} label="From Dev Syndicate" max={300} long rows={3} />
              </FieldRow>
            </>
          )}
        />
      </EditorGroup>

      <EditorGroup id="hw-after" title="After contact" description="What happens after someone gets in touch.">
        <TextField path="afterContact.label" label="Label" max={60} />
        <TextField path="afterContact.heading" label="Heading" max={160} />
        <TextField path="afterContact.description" label="Description" max={600} long rows={2} />
        <CtaFields path="afterContact.cta" title="Button" />
        <ListEditor<AfterStep>
          path="afterContact.steps"
          label="Steps"
          itemLabel="Step"
          min={1}
          max={8}
          newItem={() => ({ title: "", body: "" })}
          summary={(s) => s.title}
          renderItem={(p) => (
            <>
              <TextField path={`${p}.title`} label="Title" max={120} />
              <TextField path={`${p}.body`} label="Text" max={600} long rows={2} />
            </>
          )}
        />
      </EditorGroup>

      <EditorGroup id="hw-timing" title="Timing" description="Recommended planning windows.">
        <TextField path="timing.label" label="Label" max={60} />
        <TextField path="timing.heading" label="Heading" max={160} />
        <TextField path="timing.description" label="Description" max={600} long rows={2} />
        <ListEditor<Window>
          path="timing.windows"
          label="Planning windows"
          itemLabel="Window"
          min={1}
          max={4}
          newItem={() => ({ label: "", weeks: "", body: "" })}
          summary={(w) => [w.label, w.weeks && `${w.weeks} weeks`].filter(Boolean).join(" · ")}
          renderItem={(p) => (
            <>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <TextField path={`${p}.label`} label="Label" max={60} />
                <TextField path={`${p}.weeks`} label="Weeks" max={12} hint="e.g. 6–8" />
              </div>
              <TextField path={`${p}.body`} label="Description" max={300} long rows={2} />
            </>
          )}
        />
      </EditorGroup>
    </SectionEditor>
  );
}
