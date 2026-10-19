import Image from "next/image";
import { connection } from "next/server";
import { LoginForm } from "@/components/admin/forms";
import { adminConfigured } from "@/lib/auth/admin";
import { safeAdminPath } from "@/lib/auth/session";

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  // Read env at request time, not build time.
  await connection();
  const configured = adminConfigured();
  // Set by proxy.ts when a signed-out visit to an admin page was redirected here.
  const { next } = await searchParams;
  const nextPath = safeAdminPath(Array.isArray(next) ? next[0] : next) ?? undefined;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-sm bg-ink">
            <Image src="/brand/crest.png" alt="" width={95} height={128} className="h-7 w-auto" />
          </span>
          <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em]">Dev Syndicate</span>
        </div>
        <h1 className="mt-10 text-3xl font-medium tracking-[-0.035em]">Lead dashboard</h1>
        <p className="mt-2 text-sm text-mute">Team access only.</p>
        {!configured && (
          <p role="alert" className="mt-6 rounded-sm border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            Admin access isn&apos;t configured. Set <code className="font-mono">SESSION_SECRET</code> and{" "}
            <code className="font-mono">ADMIN_PASSWORD_HASH</code> in the server environment.
          </p>
        )}
        <div className="mt-8 rounded-md border border-line bg-white p-6">
          <LoginForm disabled={!configured} next={nextPath} />
        </div>
      </div>
    </main>
  );
}
