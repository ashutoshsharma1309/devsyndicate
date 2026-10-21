/** Shown while a lead loads. Static placeholders: no looping animation. */
export default function LeadLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading lead…</span>
      <div aria-hidden="true">
        <div className="h-4 w-20 rounded-xs bg-ink/[0.06]" />
        <div className="mt-4 h-8 w-2/3 max-w-md rounded-xs bg-ink/[0.06]" />
        <div className="mt-3 h-4 w-48 rounded-xs bg-ink/[0.04]" />
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="h-96 rounded-md border border-line bg-white lg:col-span-7" />
          <div className="h-96 rounded-md border border-line bg-white lg:col-span-5" />
        </div>
      </div>
    </div>
  );
}
