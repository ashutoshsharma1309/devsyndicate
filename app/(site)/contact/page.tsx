import { ContactView } from "@/components/contact/contact-view";
import { PageJsonLd } from "@/components/layout/json-ld";
import { pageMetadata, type PageSeo } from "@/lib/seo";
import { site } from "@/lib/site";

const page: PageSeo = {
  title: "Contact Us to Plan a College Hackathon",
  breadcrumb: "Contact",
  description: `Planning a hackathon for your college? Send Dev Syndicate an enquiry, call ${site.primaryContact.name} on ${site.primaryContact.phone.display} or email the team to arrange a conversation.`,
  path: "/contact",
};

export const metadata = pageMetadata(page);

export default function ContactPage() {
  return (
    <ContactView>
      <PageJsonLd page={page} />
    </ContactView>
  );
}
