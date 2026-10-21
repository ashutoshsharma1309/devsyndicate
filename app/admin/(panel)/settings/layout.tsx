import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/shell/page-header";
import { AdminSubNav } from "@/components/admin/shell/sub-nav";
import { requireAdmin } from "@/lib/auth/admin";

const items = [
  { href: "/admin/settings", label: "Account" },
  { href: "/admin/settings/admins", label: "Admin accounts" },
  { href: "/admin/settings/system", label: "System" },
];

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Your account and session, the people who can sign in, and how this server is configured."
        className="border-b-0 pb-0"
      />
      <AdminSubNav label="Settings" items={items} />
      {children}
    </div>
  );
}
