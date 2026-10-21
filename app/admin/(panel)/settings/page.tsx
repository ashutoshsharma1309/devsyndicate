import Link from "next/link";
import { AdminPanel } from "@/components/admin/shell/panel";
import { ChangePasswordForm } from "@/components/admin/team-forms";
import { requireAdmin } from "@/lib/auth/admin";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { SESSION_TTL_SECONDS } from "@/lib/auth/session";
import { getLeadStore } from "@/lib/leads/store";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Account settings" };

const code = "rounded-xs bg-paper-2 px-1 py-px font-mono text-[0.8125rem] text-ink";

export default async function AccountSettingsPage() {
  const session = await requireAdmin();
  const store = await getLeadStore();
  const account = !session.isOwner && store ? await store.getAdmin(session.id) : null;
  const hours = SESSION_TTL_SECONDS / 3600;

  const rows: [string, string][] = session.isOwner
    ? [
        ["Username", session.name],
        ["Role", "Primary admin"],
        ["Signs in with", "ADMIN_USERNAME and the password behind ADMIN_PASSWORD_HASH"],
      ]
    : [
        ["Name", session.name],
        ["Email", session.email ?? "—"],
        ["Role", "Admin"],
        ["Last sign-in", account?.lastLoginAt ? `${formatDate(account.lastLoginAt, true)} IST` : "—"],
        ["Account added", account ? formatDate(account.createdAt) : "—"],
      ];

  return (
    <div className="grid max-w-4xl gap-6">
      <AdminPanel id="account" title="Your account" flush>
        <dl className="divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-mute">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </AdminPanel>

      {session.isOwner ? (
        <AdminPanel id="password" title="Password">
          <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-mute">
            <p>
              You&apos;re the primary admin: you sign in with <code className={code}>ADMIN_USERNAME</code>, and your
              password is set on the server, not here.
            </p>
            <p>To change it:</p>
            <ol className="list-decimal space-y-1.5 pl-5 marker:text-mute">
              <li>
                Run <code className={code}>npm run admin:hash -- &quot;a long new password&quot;</code> on your own
                computer.
              </li>
              <li>
                Set the output as <code className={code}>ADMIN_PASSWORD_HASH</code> in the host&apos;s environment and
                redeploy.
              </li>
              <li>Sign in again. Every session started with the old password, including this one, is signed out.</li>
            </ol>
            <p>
              Changing <code className={code}>ADMIN_USERNAME</code> signs you out the same way.
            </p>
          </div>
        </AdminPanel>
      ) : (
        <AdminPanel
          id="password"
          title="Change password"
          description="Do this first if you were given a temporary password. Your other signed-in sessions are signed out; this one stays signed in."
        >
          <div className="max-w-xl">
            <ChangePasswordForm minLength={MIN_PASSWORD_LENGTH} />
          </div>
        </AdminPanel>
      )}

      <AdminPanel id="session" title="Session">
        <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-mute marker:text-mute">
          <li>A session lasts {hours} hours from sign-in, then you sign in again.</li>
          <li>
            {session.isOwner
              ? "It ends early if ADMIN_USERNAME or ADMIN_PASSWORD_HASH changes on the server."
              : "It ends early if your password is changed or reset, or your account is disabled."}
          </li>
          <li>Sign out on shared computers.</li>
          <li>
            Sign-ins and sign-outs are recorded in the{" "}
            <Link href="/admin/activity?action=login" className="text-signal underline-offset-4 hover:underline">
              activity log
            </Link>
            .
          </li>
        </ul>
      </AdminPanel>
    </div>
  );
}
