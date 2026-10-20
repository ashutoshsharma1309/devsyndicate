import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/forms";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const store = await getLeadStore();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        {/* Below lg the nav drops to its own row and scrolls sideways, so six sections fit at 390px. */}
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-6 px-4 lg:h-14 lg:flex-nowrap md:px-6">
          <Link href="/admin" className="flex h-14 shrink-0 items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-sm bg-ink">
              <Image src="/brand/crest.png" alt="" width={95} height={128} className="h-5 w-auto" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Admin</span>
          </Link>
          <AdminNav className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t border-line px-3 py-1.5 md:-mx-6 md:w-[calc(100%+3rem)] md:px-5 lg:order-none lg:mx-0 lg:mr-auto lg:w-auto lg:border-0 lg:p-0" />
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="hidden shrink-0 text-sm text-mute hover:text-ink xl:inline">
              View site ↗
            </Link>
            <Link
              href="/admin/account"
              className="max-w-[10rem] truncate text-sm text-mute hover:text-ink sm:max-w-[14rem]"
              title={session.email ?? "Signed in with the shared password"}
            >
              {session.isOwner ? "Owner" : session.name}
            </Link>
            <form action={logout} className="shrink-0">
              <button type="submit" className="rounded-sm border border-line px-3 py-1.5 text-sm hover:border-ink/30">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {!store && (
        <div role="alert" className="border-b border-danger/20 bg-danger/5">
          <p className="mx-auto max-w-[1400px] px-4 py-3 text-sm text-danger md:px-6">
            Lead storage isn&apos;t configured. Set <code className="font-mono">DATABASE_URL</code> and run{" "}
            <code className="font-mono">npm run db:setup</code>. Until then, requests are only emailed.
          </p>
        </div>
      )}
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-12">{children}</main>
    </>
  );
}
