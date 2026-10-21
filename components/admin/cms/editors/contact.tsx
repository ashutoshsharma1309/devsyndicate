"use client";

import { contactSchema, type ContactContent, type ContactFormContent } from "@/lib/cms/schema";
import { eventTypes } from "@/lib/validation/lead";
import { SectionEditor } from "../editor";
import { BoolField, CheckboxListField, EditorGroup, FieldRow, SubGroup, TextField } from "../fields";
import type { EditorData, PublishCheck } from "../types";
import { checkE164, checkEmail, checkInternalPath, checkLinkedIn } from "./shared";

const digits = (v: string) => v.replace(/\D/g, "");

function PhoneFields({ path, title, hint }: { path: string; title: string; hint?: string }) {
  return (
    <SubGroup title={title} hint={hint}>
      <FieldRow>
        <TextField
          path={`${path}.display`}
          label="As shown"
          max={24}
          type="tel"
          inputMode="tel"
          hint="e.g. +91 95073 64491"
          validate={(v) => (/^\+?[\d\s()-]+$/.test(v) ? undefined : "Use digits, spaces, +, - and brackets only.")}
        />
        <TextField
          path={`${path}.e164`}
          label="For dialling (E.164)"
          max={20}
          type="tel"
          inputMode="tel"
          mono
          hint="Same number, no spaces: +919507364491"
          validate={checkE164}
        />
      </FieldRow>
    </SubGroup>
  );
}

const samePhone = (a: { display: string; e164: string }, b: { display: string; e164: string }) =>
  digits(a.e164) === digits(b.e164) && a.display.trim() === b.display.trim();

function contactChecks(value: ContactContent, live: ContactContent): PublishCheck[] {
  const checks: PublishCheck[] = [];
  const pc = contactSchema.shape.primaryContact.safeParse(value.primaryContact);
  if (!pc.success) {
    checks.push({
      kind: "error",
      message: "The primary contact's name, role, phone number or LinkedIn link is empty or invalid. Visitors are asked to call this person, so fix these first.",
    });
  }
  const p = value.primaryContact;
  const lp = live.primaryContact;
  if (p.name.trim() !== lp.name || p.role.trim() !== lp.role) {
    checks.push({ kind: "warning", message: `The primary contact becomes ${p.name.trim()} (${p.role.trim()}), replacing ${lp.name} (${lp.role}).` });
  }
  if (!samePhone(p.phone, lp.phone)) {
    checks.push({
      kind: "warning",
      message: `Calls to the primary contact go to ${p.phone.display.trim()} (${p.phone.e164.trim()}) instead of ${lp.phone.display}. Dial it once to check it's right.`,
    });
  }
  if (p.linkedin.trim() !== lp.linkedin) checks.push({ kind: "warning", message: "The primary contact's LinkedIn link changes." });
  if (value.email.trim().toLowerCase() !== live.email) {
    checks.push({ kind: "warning", message: `The company email shown on the website changes from ${live.email} to ${value.email.trim().toLowerCase()}.` });
    checks.push({
      kind: "password",
      message: "The company email can also receive enquiry notifications, so changing it needs your password.",
    });
  }
  if (!samePhone(value.phone, live.phone)) {
    checks.push({ kind: "warning", message: `The company phone number changes from ${live.phone.display} to ${value.phone.display.trim()}.` });
  }
  if (!value.visibility.showCompanyPhone && live.visibility.showCompanyPhone) {
    checks.push({ kind: "warning", message: "The company phone number will no longer be shown in the footer or on /about." });
  }
  if (!value.visibility.showPrimaryContactLinkedin && live.visibility.showPrimaryContactLinkedin) {
    checks.push({ kind: "warning", message: "The primary contact's LinkedIn link will no longer be shown." });
  }
  return checks;
}

export function ContactEditor(props: EditorData<"contact">) {
  return (
    <SectionEditor {...props} publishChecks={contactChecks}>
      <EditorGroup id="ct-company" title="Company" description="Shown in the footer, on /contact and /about, and in structured data.">
        <TextField path="email" label="Company email" max={200} type="email" inputMode="email" validate={checkEmail} />
        <PhoneFields path="phone" title="Company phone" />
      </EditorGroup>

      <EditorGroup
        id="ct-primary"
        title="Primary contact"
        description="The person visitors are asked to call about an enquiry. Publishing asks you to confirm any change here."
      >
        <FieldRow>
          <TextField path="primaryContact.name" label="Name" max={80} />
          <TextField path="primaryContact.role" label="Role" max={60} />
        </FieldRow>
        <PhoneFields path="primaryContact.phone" title="Phone" />
        <TextField
          path="primaryContact.linkedin"
          label="LinkedIn profile"
          max={200}
          mono
          inputMode="url"
          hint="A profile link: https://www.linkedin.com/in/…"
          validate={checkLinkedIn}
        />
      </EditorGroup>

      <EditorGroup id="ct-location" title="Location">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField path="location.city" label="City" max={60} />
          <TextField path="location.region" label="Region" max={60} />
          <TextField path="location.country" label="Country" max={60} />
        </div>
      </EditorGroup>

      <EditorGroup id="ct-visibility" title="What's shown publicly">
        <BoolField
          path="visibility.showCompanyPhone"
          label="Show the company phone number"
          hint="In the footer and on /about."
        />
        <BoolField
          path="visibility.showPrimaryContactLinkedin"
          label="Show the primary contact's LinkedIn link"
          hint="In the contact options and the closing call to action."
        />
      </EditorGroup>
    </SectionEditor>
  );
}

const LIVE_DEFAULT_RECIPIENT = "the server's CONTACT_EMAIL setting (or the company email if that isn't set)";

function contactFormChecks(value: ContactFormContent, live: ContactFormContent): PublishCheck[] {
  const checks: PublishCheck[] = [];
  if (!value.enabled && live.enabled) {
    checks.push({ kind: "warning", message: "The contact form will stop accepting enquiries." });
  }
  const next = value.notificationRecipient.trim().toLowerCase();
  if (next !== live.notificationRecipient) {
    checks.push({
      kind: "warning",
      message: `New enquiries will be emailed to ${next || LIVE_DEFAULT_RECIPIENT} instead of ${live.notificationRecipient || LIVE_DEFAULT_RECIPIENT}.`,
    });
    checks.push({ kind: "password", message: "Changing who is notified about enquiries needs your password." });
  }
  return checks;
}

export function ContactFormEditor(props: EditorData<"contactForm">) {
  return (
    <SectionEditor {...props} publishChecks={contactFormChecks}>
      <EditorGroup id="cf-form" title="Form" description="The enquiry form on /contact.">
        <BoolField
          path="enabled"
          label="Accept enquiries through the form"
          hint="When it's off, /contact shows contact details in place of the form, and new submissions are refused."
        />
        <CheckboxListField
          path="enabledEnquiryTypes"
          label="Enquiry types offered"
          options={eventTypes}
          hint="Keep at least one. Leads already received keep their type."
        />
        <TextField
          path="confirmationMessage"
          label="Confirmation message"
          max={600}
          multiline
          rows={3}
          hint="Shown after an enquiry is received. Plain text; line breaks are kept."
        />
        <TextField
          path="privacyHref"
          label="Privacy policy link"
          max={300}
          mono
          hint="A page on this site, e.g. /privacy"
          validate={checkInternalPath}
        />
      </EditorGroup>

      <EditorGroup
        id="cf-notify"
        title="Notifications"
        description="Who is emailed about each new enquiry. Publishing a change asks for your current password."
      >
        <TextField
          path="notificationRecipient"
          label="Notification recipient"
          max={200}
          type="email"
          inputMode="email"
          optional
          hint="Leave empty to use the server's CONTACT_EMAIL setting, or the company email if that isn't set."
          validate={checkEmail}
        />
      </EditorGroup>
    </SectionEditor>
  );
}
