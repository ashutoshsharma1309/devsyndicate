import type { Metadata } from "next";
import { ContactView } from "@/components/contact/contact-view";
import { PageJsonLd } from "@/components/layout/json-ld";
import { cmsPageSeo, pageMetadata } from "@/lib/seo";

const seo = () => cmsPageSeo("/contact", { breadcrumb: "Contact" });

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await seo());
}

export default async function ContactPage() {
  const page = await seo();
  return (
    <ContactView>
      <PageJsonLd page={page} />
    </ContactView>
  );
}
