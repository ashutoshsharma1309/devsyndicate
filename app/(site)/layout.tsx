import { ClickTracker } from "@/components/analytics/click-tracker";
import { Footer } from "@/components/footer/footer";
import { JsonLd } from "@/components/layout/json-ld";
import { RevealObserver } from "@/components/layout/reveal-observer";
import { Navbar } from "@/components/navigation/navbar";
import { siteJsonLd } from "@/lib/seo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={siteJsonLd()} />
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <RevealObserver />
      <ClickTracker />
    </>
  );
}
