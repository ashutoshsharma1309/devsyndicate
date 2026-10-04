import { Footer } from "@/components/footer/footer";
import { RevealObserver } from "@/components/layout/reveal-observer";
import { Navbar } from "@/components/navigation/navbar";
import { jsonLd, organizationJsonLd } from "@/lib/seo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizationJsonLd())} />
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <RevealObserver />
    </>
  );
}
