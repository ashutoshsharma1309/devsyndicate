import Link from "next/link";
import { LegalPage } from "@/components/layout/legal";
import { PageJsonLd } from "@/components/layout/json-ld";
import { pageMetadata, type PageSeo } from "@/lib/seo";
import { site } from "@/lib/site";

const page: PageSeo = {
  title: "Terms and Conditions",
  description: "The terms that apply when you use the Dev Syndicate website.",
  path: "/terms",
};

export const metadata = pageMetadata(page);

export default function TermsPage() {
  return (
    <>
      <PageJsonLd page={page} />
      <LegalPage
      title="Terms and Conditions"
      updated="4 October 2026"
      intro={`These terms apply to your use of this website. By using it, you agree to them. If you don't agree, please don't use the site.`}
      sections={[
        {
          id: "about",
          title: "About these terms",
          body: (
            <p>
              This website is operated by {site.name}, based in {site.location.city}, {site.location.region},{" "}
              {site.location.country}. &ldquo;We&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to {site.name}.
            </p>
          ),
        },
        {
          id: "requests",
          title: "Requests and engagements",
          body: (
            <>
              <p>
                Submitting the request form, emailing or calling us is an enquiry. It doesn&apos;t create an agreement
                or an obligation on either side.
              </p>
              <p>
                Any hackathon or other service we deliver is governed by a separate written proposal or agreement with
                your institution or organisation. That document — not this website — sets out scope, responsibilities,
                timelines and fees. If it conflicts with anything here, it takes precedence.
              </p>
              <p>
                Descriptions of our services and recommended timelines on this site are general. What&apos;s possible
                for a particular event depends on its requirements and on the availability of mentors, judges and
                partners.
              </p>
            </>
          ),
        },
        {
          id: "use",
          title: "Using this website",
          body: (
            <>
              <p>You agree not to:</p>
              <ul>
                <li>submit information that is false, or that you aren&apos;t authorised to share;</li>
                <li>send spam or automated submissions through our forms;</li>
                <li>attempt to access areas of the site that aren&apos;t public, or to disrupt the site or its security;</li>
                <li>use the site for anything unlawful.</li>
              </ul>
            </>
          ),
        },
        {
          id: "ip",
          title: "Content and trademarks",
          body: (
            <p>
              The text, design, graphics and the {site.name} name and crest on this website belong to us. You may
              share links to the site and quote short extracts with attribution, but please don&apos;t copy or reuse
              its content or branding without our permission.
            </p>
          ),
        },
        {
          id: "links",
          title: "Links to other websites",
          body: (
            <p>
              Where we link to other websites, we do so for convenience. We aren&apos;t responsible for their content
              or practices.
            </p>
          ),
        },
        {
          id: "disclaimer",
          title: "Disclaimer and liability",
          body: (
            <>
              <p>
                We work to keep this website accurate and available, but it is provided &ldquo;as is&rdquo;, without
                warranties of any kind. We may change or remove content at any time.
              </p>
              <p>
                To the extent the law allows, we aren&apos;t liable for any loss arising from your use of this website
                or reliance on its content. Nothing in these terms limits liability that cannot be limited by law.
              </p>
            </>
          ),
        },
        {
          id: "privacy",
          title: "Privacy",
          body: (
            <p>
              Our <Link href="/privacy">Privacy Policy</Link> explains how we handle the information you share with us.
            </p>
          ),
        },
        {
          id: "law",
          title: "Governing law",
          body: (
            <p>
              These terms are governed by the laws of India. Any dispute relating to them is subject to the
              jurisdiction of the courts at {site.location.city}, {site.location.region}.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes and contact",
          body: (
            <p>
              We may update these terms from time to time; the date at the top shows the latest version. Questions?
              Email <a href={`mailto:${site.email}`}>{site.email}</a> or call {site.phone.display}.
            </p>
          ),
        },
      ]}
    />
    </>
  );
}
