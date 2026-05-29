import { Bell, BookOpen, Database, FileBarChart2, FileText, HelpCircle, LayoutDashboard, Settings, ShieldCheck, Users, WalletCards, type LucideIcon } from 'lucide-react';

export type NavItem = {
  name: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
};

export const publicNavLinks: NavItem[] = [
  { name: 'Security', to: '/security', icon: ShieldCheck },
  { name: 'Vault', to: '/vault', icon: WalletCards },
  { name: 'Pricing', to: '/pricing', icon: FileBarChart2 },
  { name: 'About', to: '/about', icon: HelpCircle },
];

export const userNavLinks: NavItem[] = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { name: 'My Vault', to: '/vault', icon: WalletCards },
  { name: 'New Entry', to: '/entry/new', icon: FileText },
  { name: 'Security Monitor', to: '/security', icon: ShieldCheck },
  { name: 'Notifications', to: '/notifications', icon: Bell },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const adminNavLinks: NavItem[] = [
  { name: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { name: 'User Management', to: '/admin/users', icon: Users },
  { name: 'Diary Monitoring', to: '/admin/diaries', icon: BookOpen },
  { name: 'Security Center', to: '/admin/security', icon: ShieldCheck },
  { name: 'Activity Logs', to: '/admin/logs', icon: FileText },
  { name: 'Database Control', to: '/admin/database', icon: Database },
  { name: 'Notifications', to: '/admin/notifications', icon: Bell },
  { name: 'Reports', to: '/admin/reports', icon: FileBarChart2 },
  { name: 'Admin Settings', to: '/admin/settings', icon: Settings },
];

export const supportNavLink: NavItem = {
  name: 'Support',
  to: '/support',
  icon: HelpCircle,
};
