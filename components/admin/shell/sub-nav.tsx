"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Section navigation under a page header (e.g. Settings: Account · Admin accounts · System).
 * Links, not ARIA tabs: each one is its own page. The longest matching href is current.
 */
export function AdminSubNav({ label, items }: { label: string; items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const current = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label={label} className="-mt-4 mb-8 overflow-x-auto border-b border-line">
      <ul className="flex gap-1">
        {items.map((item) => {
          const active = item.href === current;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex min-h-10 items-center border-b-2 px-3 text-sm transition-colors duration-150",
                  active ? "border-ink font-medium text-ink" : "border-transparent text-mute hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
