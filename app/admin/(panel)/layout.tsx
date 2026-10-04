import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const store = await getLeadStore();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-sm bg-ink">
                <Image src="/brand/crest.png" alt="" width={95} height={128} className="h-5 w-auto" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Admin</span>
            </Link>
            <nav aria-label="Admin" className="flex items-center gap-1 text-sm">
              <Link href="/admin" className="rounded-sm px-2.5 py-1.5 text-mute hover:bg-ink/5 hover:text-ink">
                Overview
              </Link>
              <Link href="/admin/leads" className="rounded-sm px-2.5 py-1.5 text-mute hover:bg-ink/5 hover:text-ink">
                Leads
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden text-sm text-mute hover:text-ink sm:inline">
              View site ↗
            </Link>
            <form action={logout}>
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
