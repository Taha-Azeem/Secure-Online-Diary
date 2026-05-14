import React from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

function AppFooter({ withSidebarOffset = false }: { withSidebarOffset?: boolean }) {
  return (
    <footer className={`border-t border-outline-variant/30 bg-surface-container-high/80 ${withSidebarOffset ? 'md:ml-72' : ''}`}>
      <div className="mx-auto flex max-w-container-max-width flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-margin-lg">
        <div className="space-y-1">
          <div className="text-lg font-bold text-on-surface">CipherDiary</div>
          <div className="text-sm text-on-surface-variant">© 2026 CipherDiary Secure Systems. AES-256 encrypted journaling.</div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm font-semibold text-on-surface-variant">
          <Link className="transition-colors hover:text-primary-fixed-dim" to="/security">Security</Link>
          <Link className="transition-colors hover:text-primary-fixed-dim" to="/pricing">Pricing</Link>
          <Link className="transition-colors hover:text-primary-fixed-dim" to="/about">About</Link>
        </div>
      </div>
    </footer>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <BackgroundGlow />
      <Navbar />
      <Sidebar />
      <main className="min-h-screen overflow-x-hidden pb-10 pt-24 md:ml-72">
        <Outlet />
      </main>
      <AppFooter withSidebarOffset />
    </div>
  );
}

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <BackgroundGlow />
      <Navbar />
      <main className="min-h-screen overflow-x-hidden pb-10 pt-24">
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
