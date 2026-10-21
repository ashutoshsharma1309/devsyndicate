import { AdminPanel } from "@/components/admin/shell/panel";
import { AddAdminForm, AdminRowActions } from "@/components/admin/team-forms";
import { ownerPasswordConfigured, requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Admin accounts" };

const pill = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs border px-2 py-0.5 text-xs font-medium";

export default async function AdminAccountsPage() {
  const session = await requireAdmin();
  const store = await getLeadStore();
  const admins = store ? await store.listAdmins() : [];
  const active = admins.filter((a) => !a.disabled).length;
  const primary = ownerPasswordConfigured();

  return (
    <div className="grid max-w-4xl gap-6">
      <p className="max-w-2xl text-sm leading-relaxed text-mute">
        Everyone listed here can see and change every lead and the website content, and manage these accounts. Each
        person&apos;s actions are recorded under their own name in the activity log.
      </p>

      <AdminPanel
        id="accounts"
        title="Who can sign in"
        flush
        action={
          <span className="tabular-nums text-mute">
            {active + (primary ? 1 : 0)} active{admins.length > active && ` · ${admins.length - active} disabled`}
          </span>
        }
      >
        <ul className="divide-y divide-line">
          {primary && (
            <li className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{session.isOwner ? session.name : "Primary admin"}</span>
                  {session.isOwner && <span className="t-label text-mute">You</span>}
                  <span className={cn(pill, "border-ink/15 text-ink")}>Primary admin</span>
                </p>
                <p className="mt-1 text-sm text-mute">
                  Signs in with ADMIN_USERNAME; the password is set on the server (ADMIN_PASSWORD_HASH). Always allowed,
                  and can&apos;t be disabled here.
                </p>
              </div>
            </li>
          )}
          {admins.map((a) => {
            const isSelf = a.id === session.id;
            return (
              <li key={a.id} className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-medium", a.disabled && "text-mute")}>{a.name}</span>
                    {isSelf && <span className="t-label text-mute">You</span>}
                    <span
                      className={cn(
                        pill,
                        a.disabled ? "border-ink/10 text-mute" : "border-success/30 bg-success/10 text-success",
                      )}
                    >
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-70" />
                      {a.disabled ? "Disabled" : "Active"}
                    </span>
                  </p>
                  <p className="mt-0.5 break-all text-sm text-mute">{a.email}</p>
                  <p className="mt-1.5 text-xs text-mute">
                    Last sign-in {a.lastLoginAt ? `${formatDate(a.lastLoginAt, true)} IST` : "never"} · added{" "}
                    {formatDate(a.createdAt)}
                  </p>
                </div>
                <AdminRowActions id={a.id} name={a.name} disabled={a.disabled} isSelf={isSelf} />
              </li>
            );
          })}
          {admins.length === 0 && (
            <li className="px-5 py-6 text-sm text-mute">
              No additional admin accounts yet.{" "}
              {primary ? "Only the primary admin can sign in." : "Add one below to give someone access."}
            </li>
          )}
        </ul>
        <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-mute">
          Disabling takes effect on that person&apos;s next page load. You can&apos;t disable your own account
          {primary ? "." : ", or the last active one."} Resetting a password signs that person out everywhere.
        </p>
      </AdminPanel>

      <AdminPanel
        id="add-admin"
        title="Add an admin"
        description="They get a temporary password, shown once. They sign in with their email in the Username field and change it under Settings."
      >
        <AddAdminForm disabled={!store} />
      </AdminPanel>
    </div>
  );
}
