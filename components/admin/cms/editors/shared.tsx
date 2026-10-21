"use client";

import { isE164, isEmail, isHttpsUrl, isInternalPath, isLinkedInProfile, isSafeLink } from "@/lib/cms/schema";
import { SubGroup, TextField } from "../fields";

/** Client-side mirrors of the schema's link rules (the server re-checks). */
export const checkLink = (v: string) =>
  isSafeLink(v) ? undefined : "Use a path on this site (/contact), an https:// link, mailto:address or tel:+91…";
export const checkInternalPath = (v: string) => (isInternalPath(v) ? undefined : "Use a path on this site, e.g. /privacy");
export const checkHttps = (v: string) => (isHttpsUrl(v) ? undefined : "Use a full https:// link.");
export const checkLinkedIn = (v: string) =>
  isLinkedInProfile(v) ? undefined : "Use a LinkedIn profile URL, e.g. https://www.linkedin.com/in/name/";
export const checkEmail = (v: string) => (isEmail(v.toLowerCase()) ? undefined : "Enter a valid email address, e.g. team@example.com");
export const checkE164 = (v: string) =>
  isE164(v.replace(/[\s()-]/g, "")) ? undefined : "Use international format with no spaces, e.g. +919507364491";

const LINK_HINT = "A page on this site (/contact), an https:// link, mailto: or tel:.";

/** A button: label + link. */
export function CtaFields({ path, title }: { path: string; title: string }) {
  return (
    <SubGroup title={title}>
      <TextField path={`${path}.label`} label="Label" max={40} />
      <TextField path={`${path}.href`} label="Link" max={300} hint={LINK_HINT} validate={checkLink} mono inputMode="url" />
    </SubGroup>
  );
}

/** A section's label, heading and introduction. */
export function IntroFields({
  path,
  title,
  hint,
  descriptionOptional = false,
}: {
  path: string;
  title: string;
  hint?: string;
  descriptionOptional?: boolean;
}) {
  return (
    <SubGroup title={title} hint={hint}>
      <TextField path={`${path}.label`} label="Label" max={60} hint="The small label above the heading." />
      <TextField path={`${path}.heading`} label="Heading" max={160} />
      <TextField path={`${path}.description`} label="Description" max={600} long rows={3} optional={descriptionOptional} />
    </SubGroup>
  );
}
