/**
 * The admin's navigation, shared by the desktop sidebar and the mobile drawer.
 * Client-safe: plain data, no server imports.
 */
import {
  Briefcase,
  Building,
  ContactRound,
  FileText,
  House,
  Inbox,
  LayoutDashboard,
  Logs,
  Route,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/leads", label: "Leads", icon: Inbox },
      { href: "/admin/organisations", label: "Organisations", icon: Building },
      { href: "/admin/content", label: "Content Management", icon: FileText },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/content/homepage", label: "Homepage", icon: House },
      { href: "/admin/content/services", label: "Services", icon: Briefcase },
      { href: "/admin/content/how-it-works", label: "How It Works", icon: Route },
      { href: "/admin/content/team", label: "Team", icon: Users },
      { href: "/admin/content/contact", label: "Contact Information", icon: ContactRound },
      { href: "/admin/content/seo", label: "SEO Settings", icon: Search },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/activity", label: "Activity log", icon: Logs },
    ],
  },
];

const allHrefs = navGroups.flatMap((g) => g.items.map((i) => i.href));

/**
 * The one nav item that owns `pathname`: the longest href that equals it or is a parent of it,
 * so /admin/content/homepage marks Homepage (not Content Management) and /admin/leads/123 marks Leads.
 * Older URLs that redirect into Settings (/admin/team, /admin/account) mark Settings.
 */
export function currentNavHref(pathname: string): string | null {
  if (pathname === "/admin/team" || pathname === "/admin/account") return "/admin/settings";
  let best: string | null = null;
  for (const href of allHrefs) {
    const match = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
    if (match && (!best || href.length > best.length)) best = href;
  }
  return best;
}
