import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export function Layout() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary-fixed-dim">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-fixed-dim border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-sm animate-pulse">SYNCHRONIZING WITH VAULT...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Navbar />
      <Sidebar />
      <main className="md:ml-64 pt-24 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
      <footer className="md:ml-64 w-full py-layer-gap bg-surface-container-highest border-t border-outline-variant mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-lg max-w-container-max-width mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="font-title-md text-title-md text-on-surface">CipherDiary</div>
            <div className="font-label-sm text-label-sm text-on-surface-variant">© 2026 CipherDiary Secure Systems. AES-256 Bit Encrypted.</div>
          </div>
          <div className="flex gap-gutter-md">
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary underline decoration-secondary" href="#">Privacy Protocol</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary underline decoration-secondary" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function AdminLayout() {
  const { profile, loading } = useAuth();

  if (loading) return null;

  if (profile?.role !== 'admin') {
    return <Navigate to="/forbidden" replace />;
  }

  return <Layout />;
}
