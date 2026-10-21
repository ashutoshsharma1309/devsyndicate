import Link from "next/link";
import { cn } from "@/lib/utils";

export const CONTACT_FORM_EDITOR_HREF = "/admin/content/contact/form";

const tabs = [
  { href: "/admin/content/contact", label: "Contact details" },
  { href: CONTACT_FORM_EDITOR_HREF, label: "Contact form" },
] as const;

/** Switches between the two contact editors (each publishes separately). Server-safe. */
export function ContactTabs({ current }: { current: (typeof tabs)[number]["href"] }) {
  return (
    <nav aria-label="Contact settings" className="mb-6 border-b border-line">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const active = t.href === current;
          return (
            <li key={t.href} className="shrink-0">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center border-b-2 px-3 text-sm transition-colors duration-150",
                  active ? "border-signal font-medium text-ink" : "border-transparent text-mute hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
