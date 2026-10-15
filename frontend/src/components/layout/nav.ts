import { Building2, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should keep this item highlighted. */
  match?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users, match: ["/employees"] },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
