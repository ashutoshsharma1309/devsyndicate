"use client";

import { ImageOff } from "lucide-react";
import type { TeamContent, TeamMember } from "@/lib/cms/schema";
import { useEditor, useFieldLabel } from "../context";
import { SectionEditor } from "../editor";
import { BoolField, EditorGroup, FieldRow, ListEditor, TextField } from "../fields";
import { fieldId } from "../paths";
import type { EditorData, PublishCheck } from "../types";
import { checkLinkedIn } from "./shared";
import { HiddenTag } from "./services";

/** At most one primary contact: ticking one person unticks the others. */
function PrimaryContactField({ index }: { index: number }) {
  const ctx = useEditor();
  useFieldLabel(`members.${index}.primaryContact`, "Primary contact");
  const members = (ctx.get("members") as TeamMember[] | undefined) ?? [];
  const checked = members[index]?.primaryContact === true;
  const id = fieldId(ctx.section, `members.${index}.primaryContact`);
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border border-line bg-white px-3.5 py-3 transition-colors duration-150 hover:border-ink/30"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={ctx.disabled}
        aria-describedby={`${id}-hint`}
        onChange={(e) =>
          ctx.set(
            "members",
            members.map((m, i) => ({ ...m, primaryContact: i === index ? e.target.checked : e.target.checked ? false : m.primaryContact })),
          )
        }
        className="mt-0.5 size-4 shrink-0 accent-signal"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">Primary contact for enquiries</span>
        <span id={`${id}-hint`} className="mt-0.5 block text-[0.8125rem] leading-snug text-mute">
          Their card says so and shows the primary contact phone number from Contact details. Only one person can be the
          primary contact.
        </span>
      </span>
    </label>
  );
}

function teamChecks(value: TeamContent): PublishCheck[] {
  const checks: PublishCheck[] = [];
  if (value.members.every((m) => !m.visible)) checks.push({ kind: "warning", message: "Everyone is hidden, so the team section will list nobody." });
  const contact = value.members.find((m) => m.primaryContact);
  if (contact && !contact.visible) checks.push({ kind: "warning", message: `${contact.name} is the primary contact but hidden.` });
  return checks;
}

export function TeamEditor(props: EditorData<"team">) {
  return (
    <SectionEditor {...props} publishChecks={teamChecks}>
      <EditorGroup id="tm-heading" title="Section heading" description="Shown above the team on the homepage and /about.">
        <TextField path="label" label="Label" max={60} />
        <TextField path="heading" label="Heading" max={160} />
        <TextField path="lead" label="Lead" max={600} long rows={3} />
      </EditorGroup>

      <EditorGroup
        id="tm-members"
        title="People"
        description="Shown in this order. Hidden people stay here but aren't on the website."
      >
        <p className="flex items-start gap-2 rounded-sm border border-line bg-paper/60 px-3.5 py-3 text-[0.8125rem] leading-snug text-mute">
          <ImageOff aria-hidden="true" className="mt-px size-4 shrink-0" />
          Profile photos need file storage — not configured. Cards show each person&apos;s initials.
        </p>
        <ListEditor<TeamMember>
          path="members"
          label="Team members"
          itemLabel="Person"
          min={1}
          max={12}
          newItem={() => ({ name: "", role: "", bio: "", linkedin: "", visible: true, primaryContact: false })}
          summary={(m) => [m.name, m.role].filter(Boolean).join(" · ")}
          badge={(m) => (
            <>
              {m.primaryContact && (
                <span className="shrink-0 rounded-xs border border-signal/30 px-1.5 text-xs font-normal leading-5 text-signal-deep">
                  Primary contact
                </span>
              )}
              <HiddenTag hidden={!m.visible} />
            </>
          )}
          renderItem={(p, i) => (
            <>
              <FieldRow>
                <TextField path={`${p}.name`} label="Name" max={80} />
                <TextField path={`${p}.role`} label="Role" max={60} />
              </FieldRow>
              <TextField
                path={`${p}.linkedin`}
                label="LinkedIn profile"
                max={200}
                mono
                inputMode="url"
                placeholder="https://www.linkedin.com/in/…"
                hint="A profile link: https://www.linkedin.com/in/…"
                validate={checkLinkedIn}
              />
              <TextField
                path={`${p}.bio`}
                label="Bio"
                max={400}
                multiline
                optional
                rows={4}
                hint="Plain text, shown as written (line breaks kept). Leave empty unless the person has written or approved it."
              />
              <BoolField path={`${p}.visible`} label="Show on the website" />
              <PrimaryContactField index={i} />
            </>
          )}
        />
      </EditorGroup>
    </SectionEditor>
  );
}
