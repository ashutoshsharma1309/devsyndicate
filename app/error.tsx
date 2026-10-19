"use client";

import { useEffect } from "react";
import { Footer } from "@/components/footer/footer";
import { Navbar } from "@/components/navigation/navbar";
import { Button, ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

/**
 * Root error boundary. It replaces the (site) layout, so it brings its own
 * navbar and footer, like app/not-found.tsx. Always offers a direct way to
 * reach us, since a visitor who hits this may have been mid-enquiry.
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <title>Something went wrong | Dev Syndicate</title>
      <Navbar />
      <main id="main" className="on-dark relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden="true"
          className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(80%_70%_at_50%_40%,black,transparent_75%)]"
        />
        <div className="container-x relative flex min-h-[80dvh] flex-col justify-center pb-20 pt-36">
          <p className="t-eyebrow text-signal-soft">Something went wrong</p>
          <h1 className="t-h1 mt-7 max-w-[16ch]">This page didn&apos;t load properly.</h1>
          <p className="t-lead mt-6 max-w-xl text-white/70">
            It&apos;s on our side, not yours. Try again, or reach us directly — call{" "}
            <a href={site.primaryContact.phone.href} className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-signal-soft">
              {site.primaryContact.phone.display}
            </a>{" "}
            or email{" "}
            <a href={`mailto:${site.email}`} className="break-all text-white underline decoration-white/30 underline-offset-4 hover:decoration-signal-soft">
              {site.email}
            </a>
            .
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button type="button" size="lg" onClick={() => retry()}>
              Try again
            </Button>
            <ButtonLink href="/" size="lg" variant="secondary-dark">
              Back to home
            </ButtonLink>
          </div>
          {error.digest && <p className="mt-10 font-mono text-[0.8125rem] text-mute-dark">Reference: {error.digest}</p>}
        </div>
      </main>
      <Footer />
    </>
  );
}
