"use client";

import type { HomepageContent } from "@/lib/cms/schema";
import { SectionEditor } from "../editor";
import { EditorGroup, FieldRow, ListEditor, StringListField, SubGroup, TextField } from "../fields";
import { JumpLinks } from "../jump-links";
import type { EditorData } from "../types";
import { CtaFields, IntroFields } from "./shared";

type Intro = keyof HomepageContent["sections"];

/** Section headings, in the order they appear on the homepage. */
const INTROS: { key: Exclude<Intro, "faq">; title: string; hint?: string }[] = [
  { key: "problem", title: "The problem" },
  { key: "whatWeDo", title: "The partnership" },
  { key: "why", title: "Why Dev Syndicate" },
  { key: "formats", title: "Formats", hint: "Also the heading of the formats section on /services." },
  { key: "ecosystem", title: "The ecosystem" },
  { key: "howItWorks", title: "How it works" },
  { key: "responsibilities", title: "Who does what", hint: "Also used on /how-it-works." },
  { key: "experience", title: "The experience" },
  { key: "outcomes", title: "Outcomes" },
  { key: "expectations", title: "Working with us", hint: "The description is optional: this section has no paragraph today." },
];

const GROUPS = [
  { id: "hp-hero", label: "Hero" },
  { id: "hp-trust", label: "Trust strip" },
  { id: "hp-sections", label: "Section headings" },
  { id: "hp-faq", label: "FAQ" },
  { id: "hp-closing", label: "Closing and footer" },
];

export function HomepageEditor(props: EditorData<"homepage">) {
  return (
    <SectionEditor {...props}>
      <JumpLinks items={GROUPS} />

      <EditorGroup id="hp-hero" title="Hero" description="The first screen of the homepage.">
        <TextField path="hero.eyebrow" label="Eyebrow" max={80} hint="The small label above the headline." />
        <SubGroup title="Headline" hint="Three lines, shown one under the other in large type. Keep each line short.">
          <TextField path="hero.headline.0" label="Line 1" max={40} />
          <TextField path="hero.headline.1" label="Line 2" max={40} />
          <TextField path="hero.headline.2" label="Line 3" max={40} />
        </SubGroup>
        <TextField path="hero.lead" label="Lead" max={400} long rows={3} />
        <FieldRow>
          <CtaFields path="hero.primaryCta" title="Primary button" />
          <CtaFields path="hero.secondaryCta" title="Secondary button" />
        </FieldRow>
      </EditorGroup>

      <EditorGroup id="hp-trust" title="Trust strip" description="The line and short points under the hero.">
        <TextField path="trust.line" label="Trust line" max={160} />
        <StringListField path="trust.points" label="Trust points" itemLabel="Point" max={40} maxItems={8} />
      </EditorGroup>

      <EditorGroup
        id="hp-sections"
        title="Section headings"
        description="The label, heading and introduction of each homepage section, in page order."
      >
        {INTROS.map((s) => (
          <IntroFields
            key={s.key}
            path={`sections.${s.key}`}
            title={s.title}
            hint={s.hint}
            descriptionOptional={s.key === "expectations"}
          />
        ))}
        <SubGroup title="FAQ">
          <TextField path="sections.faq.label" label="Label" max={60} />
          <TextField path="sections.faq.heading" label="Heading" max={160} />
        </SubGroup>
      </EditorGroup>

      <EditorGroup
        id="hp-faq"
        title="FAQ"
        description="Questions and answers on the homepage. They're also published as FAQ structured data for search engines."
      >
        <ListEditor<HomepageContent["faq"]["items"][number]>
          path="faq.items"
          label="Questions"
          itemLabel="Question"
          min={1}
          max={30}
          newItem={() => ({ q: "", a: "" })}
          summary={(item) => item.q}
          renderItem={(p) => (
            <>
              <TextField path={`${p}.q`} label="Question" max={200} />
              <TextField path={`${p}.a`} label="Answer" max={1200} long rows={5} />
            </>
          )}
        />
      </EditorGroup>

      <EditorGroup
        id="hp-closing"
        title="Closing and footer"
        description="The call to action at the end of each marketing page, and the footer tagline on every page."
      >
        <TextField path="finalCta.title" label="Closing title" max={160} />
        <TextField path="finalCta.body" label="Closing text" max={400} long rows={3} />
        <TextField path="footer.tagline" label="Footer tagline" max={160} />
      </EditorGroup>
    </SectionEditor>
  );
}
