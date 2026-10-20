import Link from "next/link";
import { ChangePasswordForm } from "@/components/admin/team-forms";
import { requireAdmin } from "@/lib/auth/admin";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { getLeadStore } from "@/lib/leads/store";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await requireAdmin();
  const store = await getLeadStore();
  const account = !session.isOwner && store ? await store.getAdmin(session.id) : null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-medium tracking-[-0.035em]">Account</h1>

      {session.isOwner ? (
        <section className="mt-8 rounded-md border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg font-medium tracking-[-0.02em]">Signed in with the shared password</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-mute">
            <p>
              This session isn&apos;t tied to a person, so there&apos;s no password to change here. The shared password
              is set on the server as <code className="font-mono text-ink">ADMIN_PASSWORD_HASH</code> (generate one with{" "}
              <code className="font-mono text-ink">npm run admin:hash</code>).
            </p>
            <p>
              Create a named account for yourself under{" "}
              <Link href="/admin/team" className="text-signal underline-offset-4 hover:underline">
                Team
              </Link>
              , then sign in with it. Once a named account exists, the shared password stops working unless{" "}
              <code className="font-mono text-ink">ADMIN_ALLOW_OWNER_LOGIN=true</code> is set.
            </p>
          </div>
        </section>
      ) : (
        <>
          <dl className="mt-8 divide-y divide-line rounded-md border border-line bg-white">
            {[
              ["Name", session.name],
              ["Email", session.email ?? "—"],
              ["Last sign-in", account?.lastLoginAt ? formatDate(account.lastLoginAt, true) : "—"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 px-5 py-3.5 text-sm sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="text-mute">{k}</dt>
                <dd className="break-words">{v}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-8 rounded-md border border-line bg-white p-5 sm:p-6">
            <h2 className="text-lg font-medium tracking-[-0.02em]">Change password</h2>
            <p className="mt-1.5 text-sm text-mute">
              Do this first if you were given a temporary password. Other signed-in sessions stay signed in until they
              expire (at most 8 hours).
            </p>
            <div className="mt-5">
              <ChangePasswordForm minLength={MIN_PASSWORD_LENGTH} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
