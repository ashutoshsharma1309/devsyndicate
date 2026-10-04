"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChoiceGroup, describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { site } from "@/lib/site";
import {
  eventFormats,
  eventTypes,
  fieldErrors,
  indianStates,
  labelFor,
  leadSchema,
  participantRanges,
  spamFields,
  timelines,
  type LeadField,
} from "@/lib/validation/lead";

type Values = Record<LeadField, string>;
type Errors = Partial<Record<LeadField, string>>;
type Status = "idle" | "submitting" | "success" | "error";

const empty: Values = {
  institution: "",
  city: "",
  state: "",
  website: "",
  name: "",
  designation: "",
  email: "",
  phone: "",
  eventType: "",
  participants: "",
  format: "",
  timeline: "",
  theme: "",
  message: "",
};

/** Order used to move focus to the first problem after a failed submit. */
const order = Object.keys(empty) as LeadField[];
const fieldId = (f: LeadField) => `f-${f}`;

const hints = {
  email: "Your institutional address helps us verify the request.",
  message: "Dates you're considering, sponsors already involved, venue details — anything that helps.",
};

function validate(values: Values): Errors {
  const r = leadSchema.safeParse(values);
  return r.success ? {} : fieldErrors(r.error.issues);
}

/** Reads `?format=` (from "Discuss this format" links) to pre-select the event type. */
export function LeadFormWithPreset() {
  const format = useSearchParams().get("format");
  return <LeadForm preset={eventTypes.some((t) => t.value === format) ? format! : undefined} />;
}

export function LeadForm({ preset }: { preset?: string }) {
  const [values, setValues] = useState<Values>(() => ({ ...empty, eventType: preset ?? "" }));
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<LeadField, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");
  const [summary, setSummary] = useState("");
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status === "success" || status === "error") resultRef.current?.focus();
  }, [status]);

  const set = (field: LeadField, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field has shown an error, re-check it as the visitor types.
    if (errors[field] || touched[field]) {
      setErrors((e) => ({ ...e, [field]: validate(next)[field] }));
    }
  };

  const blur = (field: LeadField) => {
    setTouched((t) => ({ ...t, [field]: true }));
    // Don't nag about empty fields until the visitor tries to submit.
    if (values[field] !== "") setErrors((e) => ({ ...e, [field]: validate(values)[field] }));
  };

  const text = (field: LeadField) => ({
    id: fieldId(field),
    name: field,
    value: values[field],
    onChange: (e: { target: { value: string } }) => set(field, e.target.value),
    onBlur: () => blur(field),
    "aria-invalid": errors[field] ? true : undefined,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    const errs = validate(values);
    setErrors(errs);
    const first = order.find((f) => errs[f]);
    if (first) {
      const count = Object.keys(errs).length;
      setSummary(`${count} ${count === 1 ? "field needs" : "fields need"} attention before we can send this.`);
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    setSummary("");
    setStatus("submitting");
    setServerError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          [spamFields.honeypot]: honeypot.current?.value ?? "",
          [spamFields.startedAt]: startedAt.current,
          source: window.location.pathname + window.location.search,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Errors };
      if (res.ok && data.ok) {
        setStatus("success");
        return;
      }
      if (res.status === 422 && data.fields) {
        setErrors(data.fields);
        setStatus("idle");
        const f = order.find((k) => data.fields?.[k]);
        setSummary(data.error ?? "Some details need another look.");
        if (f) document.getElementById(fieldId(f))?.focus();
        return;
      }
      setServerError(data.error ?? "Something went wrong on our side.");
      setStatus("error");
    } catch {
      setServerError("We couldn't reach our server. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        className="rounded-md border border-line bg-white p-8 outline-none md:p-12"
      >
        <span className="grid size-12 place-items-center rounded-full bg-signal text-white">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="square" />
          </svg>
        </span>
        <h2 className="t-h3 mt-8 text-[clamp(1.75rem,1.4rem+1.2vw,2.5rem)] tracking-[-0.035em]">Request received.</h2>
        <p className="t-lead mt-4 max-w-xl text-mute">
          Thanks for reaching out. Your request has been received. The Dev Syndicate team will review the details and
          get in touch.
        </p>
        <dl className="mt-8 grid gap-px overflow-hidden rounded-sm border border-line bg-line text-sm sm:grid-cols-3">
          {[
            ["Institution", values.institution],
            ["Event", labelFor(eventTypes, values.eventType)],
            ["We'll reply to", values.email],
          ].map(([k, v]) => (
            <div key={k} className="bg-paper p-4">
              <dt className="t-label text-mute">{k}</dt>
              <dd className="mt-1.5 break-words">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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

  const submitting = status === "submitting";

  return (
    <form noValidate onSubmit={onSubmit} aria-describedby="form-note" className="space-y-14">
      {summary && (
        <div
          ref={summaryRef}
          role="alert"
          className="flex items-start gap-3 rounded-sm border border-danger/30 bg-danger/[0.05] px-4 py-3.5 text-sm text-danger"
        >
          <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-danger" />
          {summary}
        </div>
      )}

      {/* Honeypot — invisible to people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="company_url">Leave this field empty</label>
        <input ref={honeypot} id="company_url" name="company_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Group n="01" title="Your institution">
        <Field id={fieldId("institution")} label="College / Institution name" required error={errors.institution} className="sm:col-span-2">
          <Input
            {...text("institution")}
            autoComplete="organization"
            placeholder="e.g. National Institute of Technology"
            aria-describedby={describedBy(fieldId("institution"), errors.institution)}
            maxLength={160}
          />
        </Field>
        <Field id={fieldId("city")} label="City" required error={errors.city}>
          <Input
            {...text("city")}
            autoComplete="address-level2"
            aria-describedby={describedBy(fieldId("city"), errors.city)}
            maxLength={80}
          />
        </Field>
        <Field id={fieldId("state")} label="State" required error={errors.state}>
          <Select
            {...text("state")}
            required
            autoComplete="address-level1"
            aria-describedby={describedBy(fieldId("state"), errors.state)}
          >
            <option value="" disabled>
              Select state
            </option>
            {indianStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={fieldId("website")} label="Website" error={errors.website} className="sm:col-span-2">
          <Input
            {...text("website")}
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="www.yourcollege.edu.in"
            aria-describedby={describedBy(fieldId("website"), errors.website)}
            maxLength={200}
          />
        </Field>
      </Group>

      <Group n="02" title="Your details">
        <Field id={fieldId("name")} label="Full name" required error={errors.name}>
          <Input {...text("name")} autoComplete="name" aria-describedby={describedBy(fieldId("name"), errors.name)} maxLength={120} />
        </Field>
        <Field id={fieldId("designation")} label="Designation" required error={errors.designation}>
          <Input
            {...text("designation")}
            autoComplete="organization-title"
            placeholder="e.g. Training & Placement Officer"
            aria-describedby={describedBy(fieldId("designation"), errors.designation)}
            maxLength={120}
          />
        </Field>
        <Field
          id={fieldId("email")}
          label="Official email"
          required
          error={errors.email}
          hint={hints.email}
        >
          <Input
            {...text("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            aria-describedby={describedBy(fieldId("email"), errors.email, hints.email)}
            maxLength={200}
          />
        </Field>
        <Field id={fieldId("phone")} label="Phone number" required error={errors.phone}>
          <Input
            {...text("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91"
            aria-describedby={describedBy(fieldId("phone"), errors.phone)}
            maxLength={24}
          />
        </Field>
      </Group>

      <Group n="03" title="The event you have in mind">
        <div className="sm:col-span-2">
          <ChoiceGroup
            name="eventType"
            legend="Interested event type"
            required
            options={eventTypes}
            value={values.eventType}
            onChange={(v) => set("eventType", v)}
            error={errors.eventType}
          />
        </div>
        <Field id={fieldId("participants")} label="Expected participants" required error={errors.participants}>
          <Select
            {...text("participants")}
            required
            aria-describedby={describedBy(fieldId("participants"), errors.participants)}
          >
            <option value="" disabled>
              Select a range
            </option>
            {participantRanges.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={fieldId("timeline")} label="Preferred timeline" required error={errors.timeline}>
          <Select {...text("timeline")} required aria-describedby={describedBy(fieldId("timeline"), errors.timeline)}>
            <option value="" disabled>
              When would you like to hold it?
            </option>
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
            legend="Preferred event format"
            required
            options={eventFormats}
            value={values.format}
            onChange={(v) => set("format", v)}
            error={errors.format}
            columns="grid-cols-1 min-[420px]:grid-cols-3"
          />
        </div>
        <Field id={fieldId("theme")} label="Theme / technology area" error={errors.theme} className="sm:col-span-2">
          <Input
            {...text("theme")}
            placeholder="e.g. AI for agriculture, open innovation, fintech"
            aria-describedby={describedBy(fieldId("theme"), errors.theme)}
            maxLength={200}
          />
        </Field>
        <Field
          id={fieldId("message")}
          label="Additional requirements"
          error={errors.message}
          hint={hints.message}
          className="sm:col-span-2"
        >
          <Textarea
            {...text("message")}
            rows={5}
            aria-describedby={describedBy(fieldId("message"), errors.message, hints.message)}
            maxLength={3000}
          />
        </Field>
      </Group>

      {status === "error" && (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="alert"
          className="rounded-sm border border-danger/30 bg-danger/[0.05] p-5 text-sm outline-none"
        >
          <p className="font-medium text-danger">Your request wasn&apos;t sent.</p>
          <p className="mt-1.5 text-ink/80">
            {serverError} Your details are still here — try again, or reach us directly at{" "}
            <a className="underline underline-offset-4" href={`mailto:${site.email}`}>
              {site.email}
            </a>{" "}
            or{" "}
            <a className="underline underline-offset-4" href={site.phone.href}>
              {site.phone.display}
            </a>
            .
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p id="form-note" className="max-w-sm text-[0.8125rem] leading-relaxed text-mute">
          Fields marked <span className="text-signal">*</span> are required. We use these details only to respond to
          your request — see our{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
            privacy policy
          </Link>
          .
        </p>
        <Button type="submit" size="lg" disabled={submitting} aria-disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <svg aria-hidden="true" viewBox="0 0 16 16" className="spin size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 1.5a6.5 6.5 0 106.5 6.5" strokeLinecap="round" />
              </svg>
              Sending request…
            </>
          ) : (
            <>
              Request a Conversation
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
        {submitting ? "Sending your request" : ""}
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
