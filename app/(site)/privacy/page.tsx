import { LegalPage } from "@/components/layout/legal";
import { PageJsonLd } from "@/components/layout/json-ld";
import { pageMetadata, type PageSeo } from "@/lib/seo";
import { site } from "@/lib/site";

const page: PageSeo = {
  title: "Privacy Policy",
  description: "How Dev Syndicate collects, uses and protects the information you share through this website.",
  path: "/privacy",
};

export const metadata = pageMetadata(page);

const mail = <a href={`mailto:${site.email}`}>{site.email}</a>;

export default function PrivacyPage() {
  return (
    <>
      <PageJsonLd page={page} />
      <LegalPage
      title="Privacy Policy"
      updated="20 October 2026"
      intro={`This policy explains what information ${site.name} collects through this website, why, and what you can ask us to do with it.`}
      sections={[
        {
          id: "what-we-collect",
          title: "What we collect",
          body: (
            <>
              <p>
                <strong>Information you give us.</strong> When you submit the enquiry form, we collect the details
                you enter: your name, work or institutional email address and phone number; your institution&apos;s
                name; the type of organisation you represent (college, company or other); the type of enquiry; and
                anything optional you choose to add (your designation, city, expected
                participants, preferred format, timeline and additional requirements).
              </p>
              <p>
                If you email or call us directly, we receive whatever information you choose to include.
              </p>
              <p>
                <strong>Where your enquiry came from.</strong> With the form, we also record the page you submitted it
                from and, if available, the page you first arrived on and the website that referred you. This helps us
                understand how colleges find us. We don&apos;t track your browsing in any other way.
              </p>
              <p>
                <strong>Technical information.</strong> To protect the form from spam and abuse, we record a one-way,
                salted hash of the IP address a request came from. We cannot recover your IP address from it. Our
                hosting provider may also keep standard server logs for security and reliability.
              </p>
            </>
          ),
        },
        {
          id: "how-we-use",
          title: "How we use it",
          body: (
            <>
              <p>We use the information you submit to:</p>
              <ul>
                <li>send you an automatic email confirming we&apos;ve received your enquiry;</li>
                <li>review your request and contact you about it;</li>
                <li>prepare a proposal and plan an event with your institution;</li>
                <li>keep a record of our conversations with your institution;</li>
                <li>prevent spam, fraud and abuse of this website.</li>
              </ul>
              <p>We don&apos;t use your information for advertising, and we don&apos;t sell or rent it to anyone.</p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and tracking",
          body: (
            <>
              <p>
                This website does not use analytics, advertising or tracking cookies, and it does not set cookies for
                visitors.
              </p>
              <p>
                The only cookie we use is a strictly necessary session cookie for members of our team who sign in to
                the private admin area.
              </p>
            </>
          ),
        },
        {
          id: "sharing",
          title: "Who we share it with",
          body: (
            <>
              <p>
                We share information only with service providers that help us run this website and respond to you —
                for example our hosting, database and email providers — and only as far as they need it to provide
                that service.
              </p>
              <p>
                We don&apos;t pass your contact details to sponsors, mentors, judges or other partners without your
                agreement. We may disclose information if the law requires it.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          body: (
            <p>
              We keep request details for as long as we need them to respond to you and to manage our relationship
              with your institution. You can ask us to delete them at any time.
            </p>
          ),
        },
        {
          id: "security",
          title: "Security",
          body: (
            <p>
              Information is sent over an encrypted connection and stored with access limited to our team. No method
              of transmission or storage is completely secure, but we take reasonable steps to protect what you share
              with us.
            </p>
          ),
        },
        {
          id: "your-rights",
          title: "Your choices and rights",
          body: (
            <>
              <p>
                You can ask us to tell you what information we hold about you, to correct it, or to delete it. You can
                also withdraw your consent to us contacting you. We handle requests in line with applicable Indian
                law, including the Digital Personal Data Protection Act, 2023 where it applies.
              </p>
              <p>To make a request, or to raise a concern about how we&apos;ve handled your information, email {mail}.</p>
              <p>
                If you&apos;re not satisfied with our response, you may also complain to the Data Protection Board of
                India under the Digital Personal Data Protection Act, 2023.
              </p>
            </>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: (
            <p>
              This website and its request form are intended for representatives of institutions and organisations.
              We don&apos;t knowingly collect information from children.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: (
            <p>
              If we change how we handle information, we&apos;ll update this page and the date at the top. Questions
              about this policy can be sent to {mail} or {site.phone.display}.
            </p>
          ),
        },
      ]}
    />
    </>
  );
}
