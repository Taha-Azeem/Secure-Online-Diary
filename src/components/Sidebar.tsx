import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Lock, 
  Key, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut,
  Users,
  ShieldCheck,
  Database,
  Bell,
  FileText
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = profile?.role === 'admin';

  const userLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Encrypted Journals', to: '/entries', icon: <Lock size={20} /> },
    { name: 'Security Keys', to: '/keys', icon: <Key size={20} /> },
    { name: 'Access Logs', to: '/logs', icon: <History size={20} /> },
    { name: 'Settings', to: '/settings', icon: <Settings size={20} /> },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', to: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'User Management', to: '/admin/users', icon: <Users size={20} /> },
    { name: 'Diary Monitoring', to: '/admin/diaries', icon: <Lock size={20} /> },
    { name: 'Security Center', to: '/admin/security', icon: <ShieldCheck size={20} /> },
    { name: 'Activity Logs', to: '/admin/logs', icon: <FileText size={20} /> },
    { name: 'Database Management', to: '/admin/database', icon: <Database size={20} /> },
    { name: 'Notifications', to: '/admin/notifications', icon: <Bell size={20} /> },
    { name: 'Reports', to: '/admin/reports', icon: <FileText size={20} /> },
    { name: 'Admin Settings', to: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low/80 backdrop-blur-2xl border-r border-outline-variant/30 shadow-[20px_0_40px_rgba(112,0,255,0.15)] pt-24 pb-gutter-md px-4 z-40">
      <div className="mb-layer-gap">
        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-fixed-dim to-secondary-container p-[2px]">
            <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
              <img 
                src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <h3 className="font-label-md text-label-md text-primary-fixed-dim truncate w-32">{profile?.displayName || 'Agent'}</h3>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
              {isAdmin ? 'System Admin' : 'Protocol Active'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/admin'}
            className={({ isActive }) => cn(
              "flex items-center gap-3 p-3 rounded-lg font-label-md text-label-md transition-all transition-all duration-200",
              isActive 
                ? "bg-secondary-container/20 text-secondary border-l-4 border-secondary shadow-lg shadow-secondary/10" 
                : "text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface"
            )}
          >
            {link.icon}
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-outline-variant/30">
        <NavLink 
          to="/support"
          className="flex items-center gap-3 text-on-surface-variant p-3 hover:bg-surface-variant/20 rounded-lg font-label-md text-label-md transition-all"
        >
          <HelpCircle size={20} />
          Support
        </NavLink>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-error p-3 hover:bg-error/10 rounded-lg font-label-md text-label-md transition-all w-full text-left"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
