import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Database,
  FileBarChart2,
  FileKey,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  Lock,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type NavItem = {
  name: string;
  to: string;
  icon: React.ReactNode;
};

function NavSection({ title, links }: { title: string; links: NavItem[] }) {
  return (
    <div className="space-y-3">
      <p className="px-3 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/80">{title}</p>
      <div className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/admin'}
            className={({ isActive }) =>
              [
                'group grid min-h-14 grid-cols-[22px,1fr] items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-200',
                isActive
                  ? 'border-primary-fixed-dim/30 bg-primary-fixed-dim/10 text-on-surface shadow-[0_10px_30px_rgba(0,218,243,0.14)]'
                  : 'border-transparent text-on-surface-variant hover:border-white/10 hover:bg-white/5 hover:text-on-surface',
              ].join(' ')
            }
          >
            <span className="flex shrink-0 items-center justify-center text-primary-fixed-dim">{link.icon}</span>
            <span className="min-w-0 truncate text-sm font-semibold">{link.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = profile?.role === 'admin';

  const userLinks: NavItem[] = [
    { name: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'My Vault', to: '/vault', icon: <WalletCards size={18} /> },
    { name: 'New Entry', to: '/entry/new', icon: <FileText size={18} /> },
    { name: 'Security Monitor', to: '/security', icon: <ShieldCheck size={18} /> },
    { name: 'Notifications', to: '/notifications', icon: <Bell size={18} /> },
    { name: 'Settings', to: '/settings', icon: <Settings size={18} /> },
  ];

  const adminLinks: NavItem[] = [
    { name: 'Admin Dashboard', to: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'User Management', to: '/admin/users', icon: <Users size={18} /> },
    { name: 'Diary Monitoring', to: '/admin/diaries', icon: <BookOpen size={18} /> },
    { name: 'Security Center', to: '/admin/security', icon: <ShieldCheck size={18} /> },
    { name: 'Activity Logs', to: '/admin/logs', icon: <FileText size={18} /> },
    { name: 'Database Control', to: '/admin/database', icon: <Database size={18} /> },
    { name: 'Notifications', to: '/admin/notifications', icon: <Bell size={18} /> },
    { name: 'Reports', to: '/admin/reports', icon: <FileBarChart2 size={18} /> },
    { name: 'Admin Settings', to: '/admin/settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:z-40 md:h-screen md:w-72 md:flex-col md:border-r md:border-outline-variant/25 md:bg-surface-container-low/75 md:px-5 md:pb-5 md:pt-24 md:backdrop-blur-2xl">
      <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,rgba(0,218,243,0.12),rgba(34,42,59,0.92),rgba(112,0,255,0.18))] p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-fixed-dim/25 bg-surface-container-high">
            <Lock size={22} className="text-primary-fixed-dim" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-on-surface">{profile?.displayName || 'Agent'}</h3>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary-fixed-dim">
              {isAdmin ? 'Admin Clearance' : 'Private Vault'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1 no-scrollbar">
        <NavSection title="Workspace" links={userLinks} />
        {isAdmin ? <NavSection title="Administration" links={adminLinks} /> : null}
      </nav>

      <div className="mt-6 space-y-2 border-t border-outline-variant/25 pt-5">
        <NavLink
          to="/support"
          className="grid min-h-14 grid-cols-[22px,1fr] items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-on-surface-variant transition-all hover:border-white/10 hover:bg-white/5 hover:text-on-surface"
        >
          <span className="flex items-center justify-center text-primary-fixed-dim">
            <HelpCircle size={18} />
          </span>
          <span className="truncate text-sm font-semibold">Support</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="grid min-h-14 w-full grid-cols-[22px,1fr] items-center gap-3 rounded-2xl border border-error/15 bg-error/5 px-3 py-3 text-left text-error transition-all hover:bg-error/10"
        >
          <span className="flex items-center justify-center">
            <LogOut size={18} />
          </span>
          <span className="truncate text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
