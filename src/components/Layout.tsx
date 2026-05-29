import React from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { Github, Mail, Twitter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { syncPendingEntries } from '../lib/entrySync';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-primary-fixed-dim">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-fixed-dim border-t-transparent" />
        <p className="font-mono text-sm animate-pulse">{label}</p>
      </div>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[-8rem] top-24 h-80 w-80 rounded-full bg-primary-fixed-dim/10 blur-[120px]" />
      <div className="absolute bottom-[-5rem] right-[-3rem] h-96 w-96 rounded-full bg-secondary-container/20 blur-[140px]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(rgba(219,226,249,0.8) 1px, transparent 0)', backgroundSize: '34px 34px' }}
      />
    </div>
  );
}

export function AppFooter({ withSidebarOffset = false }: { withSidebarOffset?: boolean }) {
  return (
    <footer
      className={`relative overflow-hidden border-t border-white/5 bg-[#030712] ${
        withSidebarOffset ? 'md:ml-72' : ''
      }`}
    >
      {/* Glow blobs - subtle and low-profile */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-16 h-64 w-64 rounded-full bg-cyan-500/5 blur-[100px]" />
        <div className="absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-violet-600/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-6 md:px-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Left section: Brand & Copyright */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="gradient-heading text-xl font-black tracking-tight">CipherDiary</h2>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-400">
                AES-256
              </span>
            </div>
            <p className="text-xs text-on-surface-variant/70">
              © 2026 CipherDiary Secure Systems. All rights reserved.
            </p>
          </div>

          {/* Right section: Links organized in a clean inline flex-wrap list */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-on-surface-variant/80">
            <Link to="/pricing" className="transition-colors hover:text-white">Pricing</Link>
            <Link to="/security" className="transition-colors hover:text-white">Security</Link>
            <Link to="/about" className="transition-colors hover:text-white">About</Link>
            <Link to="/terms" className="transition-colors hover:text-white">Terms</Link>
            <Link to="/support" className="transition-colors hover:text-white">Support</Link>
            <Link to="/login" className="transition-colors hover:text-white">Sign In</Link>
            <Link to="/register" className="transition-colors hover:text-white">Register</Link>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-white/5" />

        {/* Bottom row: Badges + Social Icons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[11px] text-on-surface-variant/60">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-bold text-on-surface-variant/40 uppercase tracking-wider text-[9px]">Vault Protocol:</span>
            {['Zero-Knowledge', 'TLS 1.3', 'PBKDF2 Keys', 'Open Audit'].map((badge) => (
              <span key={badge} className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-cyan-500" />
                {badge}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {[
              { icon: Github, href: 'https://github.com', label: 'GitHub' },
              { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
              { icon: Mail, href: 'mailto:contact@cipherdiary.com', label: 'Email' },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                aria-label={label}
                className="text-on-surface-variant/60 transition-colors hover:text-cyan-400"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function AppShell() {
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const runSync = async () => {
      if (cancelled) return;
      await syncPendingEntries(user.uid);
    };

    void runSync();

    const handleResume = () => {
      void runSync();
    };

    window.addEventListener('online', handleResume);
    window.addEventListener('focus', handleResume);

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [user]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface">
      <BackgroundGlow />
      <Navbar />
      <Sidebar />
      <main className="min-h-screen overflow-x-hidden pb-10 pt-20 sm:pt-24 md:ml-72">
        <Outlet />
      </main>
      <AppFooter withSidebarOffset />
    </div>
  );
}

export function PublicLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface">
      <BackgroundGlow />
      <Navbar />
      <main className="min-h-screen overflow-x-hidden pb-10 pt-20 sm:pt-24">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}

export function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="SYNCHRONIZING WITH VAULT..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export function AdminLayout() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="VERIFYING ADMIN CLEARANCE..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/forbidden" replace />;
  }

  return <AppShell />;
}
