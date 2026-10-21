"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { useId } from "react";
import { logout } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { currentNavHref, navGroups } from "./nav";

const itemClass =
  "group/item relative flex min-h-9 w-full items-center gap-3 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors duration-150";
const idleClass = "text-mute-dark hover:bg-white/[0.06] hover:text-white";

/** Crest + wordmark, linking to the overview. */
export function AdminBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/admin" onClick={onNavigate} className="flex min-h-10 items-center gap-3 rounded-sm text-white">
      <Image src="/brand/crest.png" alt="" width={95} height={128} className="h-7 w-auto" />
      <span className="flex flex-col leading-none">
        <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em]">Dev Syndicate</span>
        <span className="t-label mt-1.5 text-mute-dark">Admin</span>
      </span>
    </Link>
  );
}

/**
 * The grouped navigation, View website and Sign out. Client-side only to mark
 * the current page (layouts can't read the path). `onNavigate` closes the drawer.
 */
export function AdminNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = currentNavHref(pathname);
  // Unique per instance: the sidebar and the drawer are both in the page.
  const uid = useId();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p id={`${uid}-${group.label}`} className="t-label px-2.5 text-mute-dark/80">
            {group.label}
          </p>
          <ul aria-labelledby={`${uid}-${group.label}`} className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === current;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    // "page" on the page itself; "true" when inside it (e.g. a lead under Leads).
                    aria-current={active ? (pathname === item.href ? "page" : "true") : undefined}
                    className={cn(itemClass, active ? "bg-white/[0.09] font-medium text-white" : idleClass)}
                  >
                    {/* The bar repeats the highlight in a second form, so it isn't colour alone. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-signal-soft transition-opacity duration-150",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            {group.label === "System" && (
              <>
                <li>
                  {/* A plain link in a new tab: the admin stays open where it was. */}
                  <a href="/" target="_blank" rel="noopener" onClick={onNavigate} className={cn(itemClass, idleClass)}>
                    <ExternalLink aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                    <span className="min-w-0 truncate">View Public Website</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
                <li>
                  <form action={logout}>
                    <button type="submit" className={cn(itemClass, idleClass)}>
                      <LogOut aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                      Sign Out
                    </button>
                  </form>
                </li>
              </>
            )}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Desktop sidebar (lg and up). Below lg the same navigation lives in the drawer. */
export function AdminSidebar() {
  return (
    <aside className="on-dark sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-ink px-3 pb-6 lg:flex">
      <div className="flex h-16 shrink-0 items-center px-2.5">
        <AdminBrand />
      </div>
      <div className="mt-4">
        <AdminNavList />
      </div>
    </aside>
  );
}
