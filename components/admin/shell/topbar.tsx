import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { logout } from "@/app/admin/actions";
import type { AdminSession } from "@/lib/auth/admin";
import { MobileNav } from "./mobile-nav";

/**
 * The bar above every panel page: the menu button and crest below lg, then who is
 * signed in, View website and Sign out. Page titles and actions are in
 * <AdminPageHeader>, which each page renders itself.
 */
export function AdminTopbar({ session }: { session: AdminSession }) {
  const role = session.isOwner ? "Primary admin" : session.email;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="flex h-14 items-center gap-3 px-4 md:px-8">
        <MobileNav />
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5 rounded-sm lg:hidden">
          <span className="grid size-8 place-items-center rounded-sm bg-ink">
            <Image src="/brand/crest.png" alt="" width={95} height={128} className="h-5 w-auto" />
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] sm:inline">Admin</span>
          <span className="sr-only sm:hidden">Admin</span>
          <span className="sr-only"> overview</span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
          <Link
            href="/admin/settings"
            className="flex min-h-10 min-w-0 flex-col justify-center rounded-sm px-2 text-right leading-tight hover:bg-ink/5"
          >
            <span className="sr-only">Signed in as </span>
            <span className="max-w-36 truncate text-sm font-medium sm:max-w-[16rem]">{session.name}</span>
            {role && <span className="hidden max-w-[16rem] truncate text-xs text-mute sm:block">{role}</span>}
            <span className="sr-only">. Account settings</span>
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="hidden min-h-10 items-center gap-1.5 rounded-sm px-2.5 text-sm text-mute hover:bg-ink/5 hover:text-ink md:inline-flex"
          >
            View website
            <ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <form action={logout} className="shrink-0">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-line bg-white px-3 text-sm transition-colors duration-150 hover:border-ink/30"
            >
              <LogOut aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
