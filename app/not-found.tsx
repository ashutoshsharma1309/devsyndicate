import { Footer } from "@/components/footer/footer";
import { Navbar } from "@/components/navigation/navbar";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="on-dark relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden="true"
          className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(80%_70%_at_50%_40%,black,transparent_75%)]"
        />
        <div className="container-x relative flex min-h-[80dvh] flex-col justify-center pb-20 pt-36">
          <p className="t-eyebrow text-signal-soft">Error 404</p>
          <h1 className="t-h1 mt-7 max-w-[16ch]">This page isn&apos;t part of the event.</h1>
          <p className="t-lead mt-6 max-w-xl text-white/70">
            The link may be old, or the page may have moved. Here&apos;s where most people are headed:
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/" size="lg" variant="secondary-dark">
              Back to home
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" arrow>
              Conduct a Hackathon
            </ButtonLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
