"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode, type Ref } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChoiceGroup, describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { track } from "@/lib/analytics";
import { describeAttribution, safePath } from "@/lib/attribution";
import { CONTACT_ENDPOINT, submitContactForm } from "@/lib/contact/submit";
import {
  eventFormats,
  eventTypes,
  fieldErrors,
  labelFor,
  leadSchema,
  orgTypes,
  participantRanges,
  spamFields,
  timelines,
  type LeadField,
} from "@/lib/validation/lead";

type Values = Record<LeadField, string>;
type Errors = Partial<Record<LeadField, string>>;
type Status = "idle" | "submitting" | "success" | "error";
/** Outcome of a plain form post (no JavaScript yet), shown on /contact/invalid and /contact/error. */
type Notice = "invalid" | "error";

/**
 * What the published contact-form and contact content decide about the form.
 * Passed down from the server (components/contact/contact-view.tsx).
 */
export type LeadFormSettings = {
  /** Offered enquiry types, in order. The API accepts only these for new enquiries. */
  enquiryTypes: readonly { value: string; label: string }[];
  /** Plain text, may contain line breaks. */
  confirmationMessage: string;
  privacyHref: string;
  contact: { name: string; email: string; phone: { display: string; href: string } };
};

const empty: Values = {
  // First on the form, so first in focus order too.
  orgType: "",
  name: "",
  designation: "",
  institution: "",
  city: "",
  email: "",
  phone: "",
  eventType: "",
  participants: "",
  timeline: "",
  format: "",
  message: "",
  // Not on the form any more; still accepted by the API (see lib/validation/lead.ts).
  state: "",
  website: "",
  theme: "",
};

/** Order used to move focus to the first problem after a failed submit. */
const order = Object.keys(empty) as LeadField[];
const fieldId = (f: LeadField) => `f-${f}`;

const noSubscribe = () => () => {};

/** Focuses a field; for a radio group, its selected (or first) radio rather than the wrapper. */
function focusField(f: LeadField) {
  const el = document.getElementById(fieldId(f));
  if (!el || el.matches("input, select, textarea")) return el?.focus();
  (el.querySelector<HTMLInputElement>("input:checked") ?? el.querySelector<HTMLInputElement>("input"))?.focus();
}

const hints = {
  email: "An institutional address helps us verify the request.",
  message: "Dates you're considering, themes, sponsors already involved, venue details — anything that helps.",
};

const ENQUIRY_MISSING = "Choose what your enquiry is about.";

/** The shared schema, plus: the enquiry type must be one this form offers (as the API checks). */
function validate(values: Values, offered: LeadFormSettings["enquiryTypes"]): Errors {
  const r = leadSchema.safeParse(values);
  const errors: Errors = r.success ? {} : fieldErrors(r.error.issues);
  if (!errors.eventType && !offered.some((t) => t.value === values.eventType)) errors.eventType = ENQUIRY_MISSING;
  return errors;
}

/** The organisation-name field follows "You're contacting us from"; nothing chosen reads as the general case. */
const institutionCopy: Record<string, { label: string; short: string; placeholder: string; missing: string }> = {
  college: {
    label: "College or university",
    short: "College",
    placeholder: "e.g. National Institute of Technology",
    missing: "Enter your college or university name.",
  },
  company: { label: "Company name", short: "Company", placeholder: "e.g. Acme Technologies", missing: "Enter your company name." },
  other: { label: "Organisation name", short: "Organisation", placeholder: "", missing: "Enter your organisation's name." },
};
const copyFor = (orgType: string) => institutionCopy[orgType] ?? institutionCopy.other;

/** Formats shown on the site that map to the general enquiry type, with a starter note. */
const formatNotes: Record<string, string> = {
  innovation: "We're interested in an Innovation Challenge.",
  custom: "We're interested in a custom format.",
};

/**
 * Reads `?format=` (from "Discuss this format" links) or `?type=` to pre-select the enquiry type.
 * Only types the form offers are pre-selected.
 */
export function LeadFormWithPreset({ settings }: { settings: LeadFormSettings }) {
  const params = useSearchParams();
  const key = params.get("type") ?? params.get("format") ?? "";
  const offered = (v: string) => settings.enquiryTypes.some((t) => t.value === v);
  // Sponsors are companies, so that link can answer "who are you" too.
  if (key === "sponsorship" && offered(key)) {
    return <LeadForm settings={settings} preset={{ eventType: key, orgType: "company" }} />;
  }
  if (offered(key)) return <LeadForm settings={settings} preset={{ eventType: key }} />;
  if (formatNotes[key]) {
    return (
      <LeadForm
        settings={settings}
        preset={{ eventType: offered("general") ? "general" : "", message: formatNotes[key] }}
      />
    );
  }
  return <LeadForm settings={settings} />;
}

export function LeadForm({
  preset,
  notice: initialNotice,
  settings,
}: {
  preset?: Partial<Values>;
  notice?: Notice;
  settings: LeadFormSettings;
}) {
  const [values, setValues] = useState<Values>(() => ({ ...empty, ...preset }));
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<LeadField, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");
  const [summary, setSummary] = useState("");
  const [notice, setNotice] = useState(initialNotice);
  // Until hydration the browser's own validation applies (a plain post); after it, ours does.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const mountedAt = useRef(0);
  const started = useRef(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Monotonic clock: unaffected by a wrong system time (the server only sees the elapsed ms).
    mountedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (status === "success" || status === "error") resultRef.current?.focus();
  }, [status]);

  const set = (field: LeadField, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field has shown an error, re-check it as the visitor types.
    if (errors[field] || touched[field]) {
      setErrors((e) => ({ ...e, [field]: validate(next, settings.enquiryTypes)[field] }));
    }
  };

  const blur = (field: LeadField) => {
    setTouched((t) => ({ ...t, [field]: true }));
    // Don't nag about empty fields until the visitor tries to submit.
    if (values[field] !== "") setErrors((e) => ({ ...e, [field]: validate(values, settings.enquiryTypes)[field] }));
  };

  const control = (field: LeadField, hint?: string) => ({
    id: fieldId(field),
    name: field,
    value: values[field],
    onChange: (e: { target: { value: string } }) => set(field, e.target.value),
    onBlur: () => blur(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": describedBy(fieldId(field), errors[field], hint),
  });

  const onFirstInteraction = () => {
    if (started.current) return;
    started.current = true;
    track("contact_form_start");
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    setNotice(undefined);
    const errs = validate(values, settings.enquiryTypes);
    setErrors(errs);
    const first = order.find((f) => errs[f]);
    if (first) {
      const count = Object.keys(errs).length;
      setSummary(`${count} ${count === 1 ? "field needs" : "fields need"} attention before we can send this.`);
      focusField(first);
      return;
    }
    setSummary("");
    setStatus("submitting");
    setServerError("");

    const attribution = describeAttribution();
    const result = await submitContactForm(values, {
      fillMs: performance.now() - mountedAt.current,
      honeypot: honeypot.current?.value ?? "",
      source: [safePath(window.location), attribution].filter(Boolean).join(" | ").slice(0, 300),
    });

    if (result.ok) {
      // Only counted once the server has confirmed the request was stored or emailed.
      track("contact_form_submit_success", { enquiry_type: values.eventType });
      setStatus("success");
      return;
    }
    track("contact_form_submit_error", { reason: result.reason });
    if (result.reason === "invalid") {
      setErrors(result.fields);
      setStatus("idle");
      setSummary(result.message);
      const f = order.find((k) => result.fields[k]);
      if (f) focusField(f);
      return;
    }
    setServerError(result.message);
    setStatus("error");
  }

  const contact = settings.contact;
  const institution = copyFor(values.orgType);
  // The schema's "required" message names colleges; match it to the organisation chosen.
  const institutionError =
    errors.institution && values.institution.trim().length < 2 ? institution.missing : errors.institution;

  if (status === "success") {
    return (
      <Received
        ref={resultRef}
        settings={settings}
        details={[
          [institution.short, values.institution],
          ["Enquiry", labelFor(eventTypes, values.eventType)],
          ["We'll reply to", values.email],
        ]}
      />
    );
  }

  const submitting = status === "submitting";

  return (
    // method/action: if Send is pressed before hydration, the browser posts to the API (which
    // redirects to /contact/sent|invalid|error) instead of GETting /contact with the details in the URL.
    <form
      method="post"
      action={CONTACT_ENDPOINT}
      noValidate={hydrated}
      onSubmit={onSubmit}
      onFocus={onFirstInteraction}
      aria-describedby="form-note"
      aria-busy={submitting}
      className="space-y-12"
    >
      {notice && (
        <div role="alert" className="rounded-sm border border-danger/30 bg-danger/[0.05] p-5 text-sm">
          <p className="font-medium text-danger">
            {notice === "invalid" ? "Some details in your enquiry need another look." : "Your enquiry wasn't sent."}
          </p>
          <p className="mt-1.5 leading-relaxed text-ink/80">
            Please fill in the form again, or reach us directly: call {contact.name} on{" "}
            <a className="underline underline-offset-4" href={contact.phone.href}>
              {contact.phone.display}
            </a>{" "}
            or email{" "}
            <a className="underline underline-offset-4" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
            .
          </p>
        </div>
      )}

      {summary && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-sm border border-danger/30 bg-danger/[0.05] px-4 py-3.5 text-sm text-danger"
        >
          <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-danger" />
          {summary}
        </div>
      )}

      {/* Honeypot — invisible to people and assistive tech. A meaningless name so autofill never fills it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={spamFields.honeypot}>Do not fill this in</label>
        <input
          ref={honeypot}
          id={spamFields.honeypot}
          name={spamFields.honeypot}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Group n="01" title="About you">
        <div className="sm:col-span-2">
          <ChoiceGroup
            name="orgType"
            legend="You're contacting us from"
            required
            options={orgTypes}
            value={values.orgType}
            onChange={(v) => set("orgType", v)}
            error={errors.orgType}
            columns="grid-cols-1 sm:grid-cols-3"
          />
        </div>
        <Field id={fieldId("name")} label="Full name" required error={errors.name}>
          <Input {...control("name")} required autoComplete="name" maxLength={120} />
        </Field>
        <Field id={fieldId("designation")} label="Designation" error={errors.designation}>
          <Input
            {...control("designation")}
            autoComplete="organization-title"
            placeholder="e.g. Training & Placement Officer"
            maxLength={120}
          />
        </Field>
        <Field id={fieldId("institution")} label={institution.label} required error={institutionError}>
          <Input
            {...control("institution")}
            required
            autoComplete="organization"
            placeholder={institution.placeholder || undefined}
            maxLength={160}
          />
        </Field>
        <Field id={fieldId("city")} label="City" error={errors.city}>
          <Input {...control("city")} autoComplete="address-level2" maxLength={80} />
        </Field>
        <Field id={fieldId("email")} label="Work or institutional email" required error={errors.email} hint={hints.email}>
          <Input
            {...control("email", hints.email)}
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="name@college.edu.in"
            maxLength={200}
          />
        </Field>
        <Field id={fieldId("phone")} label="Phone number" required error={errors.phone}>
          <Input
            {...control("phone")}
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91"
            maxLength={24}
          />
        </Field>
      </Group>

      <Group n="02" title="Your enquiry">
        <div className="sm:col-span-2">
          <ChoiceGroup
            name="eventType"
            legend="What is your enquiry about?"
            required
            options={settings.enquiryTypes}
            value={values.eventType}
            onChange={(v) => set("eventType", v)}
            error={errors.eventType}
            columns="grid-cols-2 lg:grid-cols-3"
          />
        </div>
        <Field id={fieldId("participants")} label="Expected participants" error={errors.participants}>
          <Select {...control("participants")}>
            <option value="">Select a range</option>
            {participantRanges.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={fieldId("timeline")} label="Approximate timeline" error={errors.timeline}>
          <Select {...control("timeline")}>
            <option value="">When would you like to hold it?</option>
            {timelines.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <ChoiceGroup
            name="format"
            legend="Preferred format"
            optional
            options={eventFormats}
            value={values.format}
            onChange={(v) => set("format", v)}
            error={errors.format}
            columns="grid-cols-3"
          />
        </div>
        <Field
          id={fieldId("message")}
          label="Additional requirements"
          error={errors.message}
          hint={hints.message}
          className="sm:col-span-2"
        >
          <Textarea {...control("message", hints.message)} rows={5} maxLength={3000} />
        </Field>
      </Group>

      {status === "error" && (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="alert"
          className="rounded-sm border border-danger/30 bg-danger/[0.05] p-5 text-sm outline-none"
        >
          <p className="font-medium text-danger">Your enquiry wasn&apos;t sent.</p>
          <p className="mt-1.5 leading-relaxed text-ink/80">
            {serverError} Your details are still here, so you can try again. Or reach us directly: call {contact.name}{" "}
            on{" "}
            <a className="underline underline-offset-4" href={contact.phone.href}>
              {contact.phone.display}
            </a>{" "}
            or email{" "}
            <a className="underline underline-offset-4" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
            .
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p id="form-note" className="max-w-sm text-[0.8125rem] leading-relaxed text-mute">
          Fields marked <span className="text-signal">*</span> are required. We use these details only to respond to
          your enquiry and never share them for marketing — see our{" "}
          <Link href={settings.privacyHref} className="underline underline-offset-4 hover:text-ink">
            privacy policy
          </Link>
          .
        </p>
        <Button type="submit" size="lg" disabled={submitting} className="w-full shrink-0 sm:w-auto">
          {submitting ? (
            <>
              <svg aria-hidden="true" viewBox="0 0 16 16" className="spin size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 1.5a6.5 6.5 0 106.5 6.5" strokeLinecap="round" />
              </svg>
              Sending enquiry…
            </>
          ) : (
            <>
              Send Enquiry
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-4 transition-transform duration-300 group-hover/btn:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M3 8h9.5M8.5 4l4 4-4 4" strokeLinecap="square" />
              </svg>
            </>
          )}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {submitting ? "Sending your enquiry" : ""}
      </p>
    </form>
  );
}

function Group({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
      <legend className="mb-7 flex w-full items-center gap-4 border-b border-line pb-4 sm:col-span-2">
        <span className="font-mono text-sm text-signal">{n}</span>
        <span className="text-[1.25rem] font-medium tracking-[-0.025em]">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Confirmation once the server has accepted the enquiry. `details` echo what the visitor typed, so they're only
 * shown in the same page session — never after the plain-form redirect, which carries nothing but the outcome.
 */
export function Received({
  ref,
  details,
  settings,
}: {
  ref?: Ref<HTMLDivElement>;
  details?: [string, string][];
  settings: LeadFormSettings;
}) {
  const contact = settings.contact;
  return (
    <div ref={ref} tabIndex={-1} role="status" className="rounded-md border border-line bg-white p-7 outline-none md:p-12">
      <span className="grid size-12 place-items-center rounded-full bg-signal text-white">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3.5 8.5l3 3 6-7" strokeLinecap="square" />
        </svg>
      </span>
      <h2 className="mt-8 text-[clamp(1.75rem,1.4rem+1.2vw,2.5rem)] font-medium leading-tight tracking-[-0.035em]">
        Enquiry received.
      </h2>
      <p className="t-lead mt-4 max-w-xl whitespace-pre-line text-mute">{settings.confirmationMessage}</p>
      {details && (
        <dl className="mt-8 grid gap-px overflow-hidden rounded-sm border border-line bg-line text-sm sm:grid-cols-3">
          {details.map(([k, v]) => (
            <div key={k} className="bg-paper p-4">
              <dt className="t-label text-mute">{k}</dt>
              <dd className="mt-1.5 break-words">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-8 text-[0.9375rem] text-mute">
        Working to a tight timeline? Call {contact.name} on{" "}
        <a href={contact.phone.href} className="text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-signal">
          {contact.phone.display}
        </a>
        .
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <ButtonLink href="/how-it-works" variant="secondary" arrow>
          See what happens next
        </ButtonLink>
        <ButtonLink href="/" variant="ghost" className="sm:ml-4">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
