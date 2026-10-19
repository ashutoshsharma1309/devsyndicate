import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactView, outcomes, type Outcome } from "@/components/contact/contact-view";

/**
 * Where a plain form post (JavaScript disabled, or Send pressed before the page
 * hydrated) lands: /contact/sent, /contact/invalid or /contact/error. Prerendered,
 * so the outcome is visible without any client code. Not indexed.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return outcomes.map((outcome) => ({ outcome }));
}

const titles: Record<Outcome, string> = {
  sent: "Enquiry received",
  invalid: "Check your enquiry",
  error: "Enquiry not sent",
};

export async function generateMetadata({ params }: PageProps<"/contact/[outcome]">): Promise<Metadata> {
  const { outcome } = await params;
  return { title: titles[outcome as Outcome] ?? "Contact", robots: { index: false, follow: true } };
}

export default async function ContactOutcomePage({ params }: PageProps<"/contact/[outcome]">) {
  const { outcome } = await params;
  if (!(outcomes as readonly string[]).includes(outcome)) notFound();
  return <ContactView outcome={outcome as Outcome} />;
}
