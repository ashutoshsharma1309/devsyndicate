/** Shown while the leads list loads. Static placeholders: no looping animation. */
export default function LeadsLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading leads…</span>
      <div aria-hidden="true">
        <h1 className="text-2xl font-medium tracking-[-0.03em] sm:text-3xl">Leads</h1>
        <div className="mt-3 h-4 w-32 rounded-xs bg-ink/[0.06]" />
        <div className="mt-6 h-48 rounded-md border border-line bg-white" />
        <div className="mt-6 divide-y divide-line rounded-md border border-line bg-white">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <div className="h-4 w-2/5 rounded-xs bg-ink/[0.06]" />
              <div className="hidden h-4 w-1/5 rounded-xs bg-ink/[0.04] lg:block" />
              <div className="ml-auto h-4 w-20 rounded-xs bg-ink/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
