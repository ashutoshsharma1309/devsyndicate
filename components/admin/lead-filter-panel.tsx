import { SlidersHorizontal } from "lucide-react";
import { useId, type ReactNode } from "react";

/**
 * Below `lg` the detailed lead filters fold away behind a toggle, so the list isn't pushed off the
 * first screen on a phone. They start open when any of them is in use. From `lg` up they always show
 * (the wrapper becomes `display: contents`, so its children sit in the filter bar's grid).
 *
 * CSS-only disclosure (a visually hidden checkbox + label + `peer-checked`), so it works before the
 * page hydrates and without JavaScript. The checkbox has no `name`, so it's never submitted with the
 * filter form.
 */
export function LeadFilterPanel({ active, children }: { active: number; children: ReactNode }) {
  const id = useId();
  const toggle = `${id}-toggle`;
  return (
    <>
      <input id={toggle} type="checkbox" defaultChecked={active > 0} aria-controls={id} className="peer sr-only lg:hidden" />
      <label
        htmlFor={toggle}
        className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-sm border border-ink/15 px-3.5 text-sm font-medium transition-colors duration-150 hover:border-ink/40 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal sm:col-span-2 lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        Filters
        {active > 0 && <span className="text-mute">· {active} in use</span>}
      </label>
      <div id={id} className="hidden peer-checked:block sm:col-span-2 lg:contents lg:peer-checked:contents">
        {children}
      </div>
    </>
  );
}
