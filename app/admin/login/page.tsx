import Image from "next/image";
import { connection } from "next/server";
import { LoginForm } from "@/components/admin/login-form";
import { loginMode } from "@/lib/auth/admin";
import { safeAdminPath, SESSION_ENDED_PARAM } from "@/lib/auth/session";

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  // Read env at request time, not build time.
  await connection();
  const mode = await loginMode();
  const configured = mode !== "unconfigured";
  // `next`: set by proxy.ts when a signed-out visit to an admin page was redirected here.
  // `ended`: set by requireAdmin() when a session stopped being valid (proxy.ts clears its cookie).
  const sp = await searchParams;
  const next = sp.next;
  const nextPath = safeAdminPath(Array.isArray(next) ? next[0] : next) ?? undefined;
  const ended = sp[SESSION_ENDED_PARAM] !== undefined;

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-sm bg-ink">
            <Image src="/brand/crest.png" alt="" width={95} height={128} className="h-7 w-auto" />
          </span>
          <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em]">Dev Syndicate</span>
        </div>
        <h1 className="mt-10 text-3xl font-medium tracking-[-0.035em]">Admin sign in</h1>
        <p className="mt-2 text-sm text-mute">Authorised Dev Syndicate administrators only.</p>
        {ended && configured && (
          <p role="status" className="mt-6 rounded-sm border border-line bg-white px-4 py-3 text-sm">
            Your session has ended. Sign in again to continue.
          </p>
        )}
        {!configured && (
          <p role="alert" className="mt-6 rounded-sm border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            Admin access isn&apos;t configured. Set <code className="font-mono">SESSION_SECRET</code>,{" "}
            <code className="font-mono">ADMIN_USERNAME</code> and <code className="font-mono">ADMIN_PASSWORD_HASH</code>{" "}
            in the server environment.
          </p>
        )}
        <div className="mt-8 rounded-md border border-line bg-white p-6">
          <LoginForm disabled={!configured} next={nextPath} />
        </div>
      </div>
    </main>
  );
}
