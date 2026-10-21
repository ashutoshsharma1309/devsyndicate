import { AdminSidebar } from "@/components/admin/shell/sidebar";
import { AdminTopbar } from "@/components/admin/shell/topbar";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";

/**
 * The admin shell: sidebar (lg and up) or drawer, the top bar, and the page.
 * Every page inside still calls requireAdmin() itself: a layout doesn't re-run
 * on every navigation, so it can't be the only check.
 */
export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  const store = await getLeadStore();

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-[60] rounded-sm bg-ink px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar session={session} />
        {!store && (
          <div role="alert" className="border-b border-danger/20 bg-danger/5">
            <p className="px-4 py-3 text-sm text-danger md:px-8">
              Lead storage isn&apos;t configured. Set <code className="font-mono">DATABASE_URL</code> and run{" "}
              <code className="font-mono">npm run db:setup</code>. Until then, enquiries are only emailed.
            </p>
          </div>
        )}
        <main id="main" tabIndex={-1} className="w-full max-w-350 flex-1 px-4 py-6 focus:outline-none md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
