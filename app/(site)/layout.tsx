import { ClickTracker } from "@/components/analytics/click-tracker";
import { Footer } from "@/components/footer/footer";
import { JsonLd } from "@/components/layout/json-ld";
import { PreviewBar } from "@/components/layout/preview-bar";
import { RevealObserver } from "@/components/layout/reveal-observer";
import { Navbar } from "@/components/navigation/navbar";
import { getContactInfo, previewEnabled } from "@/lib/cms";
import { siteJsonLd } from "@/lib/seo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Draft Mode is off while pages are prerendered, so they stay static; the bar only appears for
  // an admin who opened a preview (/admin/content/preview) and whose session is still valid.
  const [jsonLd, contact, previewing] = await Promise.all([siteJsonLd(), getContactInfo(), previewEnabled()]);
  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar
        contact={{
          email: contact.email,
          name: contact.primaryContact.name,
          phone: { display: contact.primaryContact.phone.display, href: contact.primaryContact.phone.href },
        }}
      />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <RevealObserver />
      <ClickTracker />
      {previewing && <PreviewBar />}
    </>
  );
}
