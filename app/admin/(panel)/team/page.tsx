import { AddAdminForm, AdminRowActions } from "@/components/admin/team-forms";
import { ownerLoginOverride, requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const session = await requireAdmin();
  const store = await getLeadStore();
  const admins = store ? await store.listAdmins() : [];
  const active = admins.filter((a) => !a.disabled).length;
  const override = ownerLoginOverride();

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-medium tracking-[-0.035em]">Team</h1>
      <p className="mt-2 text-sm text-mute">
        Everyone with an account here can see and change every lead, and manage the team.
      </p>

      {session.isOwner && (
        <div
          role="note"
          className="mt-6 rounded-md border border-amber-600/25 bg-amber-500/10 p-4 text-sm text-amber-900"
        >
          <p className="font-medium">You&apos;re signed in with the shared password.</p>
          {active === 0 ? (
            <p className="mt-1">
              Create your own account first. As soon as one named account exists, the shared password stops working
              {override ? " (except that ADMIN_ALLOW_OWNER_LOGIN=true is set on this server, which keeps it as a break-glass login)" : ""}
              , and everyone signs in with their email and password instead.
            </p>
          ) : (
            <p className="mt-1">
              Named accounts exist, so {override ? "the shared password only works because ADMIN_ALLOW_OWNER_LOGIN=true is set" : "the shared password can no longer sign in"}.
              Sign out and use your own account; your actions are then logged under your name.
            </p>
          )}
        </div>
      )}

      <section className="mt-10 rounded-md border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-medium tracking-[-0.02em]">Add an admin</h2>
        <p className="mt-1.5 text-sm text-mute">
          They get a temporary password, shown once below. They sign in with their email and change it under Account.
        </p>
        <div className="mt-5">
          <AddAdminForm disabled={!store} />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-lg font-medium tracking-[-0.02em]">Accounts</h2>
          <p className="text-sm tabular-nums text-mute">
            {active} active{admins.length > active && ` · ${admins.length - active} disabled`}
          </p>
        </div>
        {admins.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-line p-8 text-center text-sm text-mute">
            No named accounts yet. Until there is one, the shared password signs in.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-white">
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
                          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs border px-2 py-0.5 text-xs font-medium",
                          a.disabled ? "border-ink/10 text-mute" : "border-success/30 bg-success/10 text-success",
                        )}
                      >
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-70" />
                        {a.disabled ? "Disabled" : "Active"}
                      </span>
                    </p>
                    <p className="mt-0.5 break-all text-sm text-mute">{a.email}</p>
                    <p className="mt-1.5 text-xs text-mute">
                      Last sign-in {a.lastLoginAt ? formatDate(a.lastLoginAt, true) : "never"} · added{" "}
                      {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <AdminRowActions id={a.id} name={a.name} disabled={a.disabled} isSelf={isSelf} />
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-mute">
          Disabling takes effect on that person&apos;s next page load. You can&apos;t disable yourself or the last active
          account.
        </p>
      </section>
    </div>
  );
}
