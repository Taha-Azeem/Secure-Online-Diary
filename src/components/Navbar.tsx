import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';
  const dashboardPath = isAdmin ? '/admin' : '/dashboard';

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-outline-variant/30 bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-container-max-width items-center justify-between gap-4 px-4 py-4 md:px-margin-lg">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-fixed-dim/25 bg-primary-fixed-dim/10 text-primary-fixed-dim shadow-[0_0_25px_rgba(0,218,243,0.15)]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-on-surface md:text-xl">CipherDiary</div>
            <div className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant sm:block">
              Secure Journaling Platform
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          <Link className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary-fixed-dim" to="/security">Security</Link>
          <Link className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary-fixed-dim" to="/vault">Vault</Link>
          <Link className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary-fixed-dim" to="/pricing">Pricing</Link>
          <Link className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary-fixed-dim" to="/about">About</Link>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && user ? (
            <span className="hidden rounded-full border border-secondary/25 bg-secondary-container/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-secondary md:inline-flex">
              Admin Mode
            </span>
          ) : null}

          {!user ? (
            <>
              <button
                onClick={() => navigate('/login')}
                className="rounded-xl border border-primary-fixed-dim/30 px-4 py-2 text-sm font-bold text-primary-fixed-dim transition-all hover:bg-primary-fixed-dim/10"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="rounded-xl bg-primary-container px-4 py-2 text-sm font-bold text-on-primary-container shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all hover:-translate-y-0.5"
              >
                Initialize Vault
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(dashboardPath)}
              className="rounded-xl bg-primary-container px-4 py-2 text-sm font-bold text-on-primary-container shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all hover:-translate-y-0.5"
            >
              {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
