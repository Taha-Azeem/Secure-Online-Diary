import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminNavLinks, publicNavLinks, supportNavLink, userNavLinks, type NavItem } from '../config/navigation';

function DesktopNavLink({ link }: { link: NavItem }) {
  return (
    <Link className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary-fixed-dim" to={link.to}>
      {link.name}
    </Link>
  );
}

function MobileNavLink({ link, onNavigate }: { link: NavItem; onNavigate: () => void }) {
  const LinkIcon = link.icon;

  return (
    <NavLink
      to={link.to}
      end={link.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'grid grid-cols-[20px,1fr] items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200',
          isActive
            ? 'border-primary-fixed-dim/30 bg-primary-fixed-dim/10 text-on-surface shadow-[0_10px_24px_rgba(0,218,243,0.12)]'
            : 'border-transparent text-on-surface-variant hover:border-white/10 hover:bg-white/5 hover:text-on-surface',
        ].join(' ')
      }
    >
      <span className="flex items-center justify-center text-primary-fixed-dim">
        <LinkIcon size={18} />
      </span>
      <span className="text-sm font-semibold">{link.name}</span>
    </NavLink>
  );
}

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const dashboardPath = isAdmin ? '/admin' : '/dashboard';
  const desktopLinks = publicNavLinks;
  const mobileLinks = useMemo(
    () => [...(user ? (isAdmin ? adminNavLinks : userNavLinks) : publicNavLinks), supportNavLink],
    [isAdmin, user],
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-outline-variant/30 bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-container-max-width items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 md:px-margin-lg">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary-fixed-dim/25 bg-primary-fixed-dim/10 text-primary-fixed-dim shadow-[0_0_25px_rgba(0,218,243,0.15)] sm:h-11 sm:w-11">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-black tracking-tight text-on-surface md:text-xl">CipherDiary</div>
            <div className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant sm:block">
              Secure Journaling Platform
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {desktopLinks.map((link) => (
            <DesktopNavLink key={link.to} link={link} />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isAdmin && user ? (
            <span className="hidden rounded-full border border-secondary/25 bg-secondary-container/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-secondary md:inline-flex">
              Admin Mode
            </span>
          ) : null}

          {!user ? (
            <>
              <button
                onClick={() => navigate('/login')}
                className="hidden shrink-0 rounded-xl border border-primary-fixed-dim/30 px-3 py-2 text-sm font-bold text-primary-fixed-dim transition-all hover:bg-primary-fixed-dim/10 sm:inline-flex sm:px-4"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="hidden shrink-0 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-on-primary-container shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all hover:-translate-y-0.5 sm:inline-flex"
              >
                Initialize Vault
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(dashboardPath)}
              className="hidden shrink-0 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-bold text-on-primary-container shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all hover:-translate-y-0.5 sm:inline-flex sm:px-4"
            >
              {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low/70 text-on-surface transition-all hover:border-primary-fixed-dim/30 hover:text-primary-fixed-dim lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMenu}
          />

          <div className="absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col border-l border-outline-variant/20 bg-surface-container-low/95 px-5 pb-6 pt-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary-fixed-dim/25 bg-primary-fixed-dim/10 text-primary-fixed-dim">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-base font-black tracking-tight text-on-surface">CipherDiary</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">Mobile Menu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-on-surface-variant transition-colors hover:border-primary-fixed-dim/30 hover:text-primary-fixed-dim"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
              {user ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">Signed in as</p>
                  <p className="mt-2 truncate text-lg font-bold text-on-surface">{profile?.displayName || 'Agent'}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-primary-fixed-dim">
                    {isAdmin ? 'Admin Clearance' : 'Private Vault'}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-violet-600/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Welcome</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Explore the platform, then sign in or register to unlock your secure vault.
                  </p>
                </div>
              )}

              <nav className="space-y-2">
                {mobileLinks.map((link) => (
                  <MobileNavLink key={link.to} link={link} onNavigate={closeMenu} />
                ))}
              </nav>

              <div className="space-y-3 border-t border-white/10 pt-4">
                {user ? (
                  <>
                    <Link
                      to={dashboardPath}
                      onClick={closeMenu}
                      className="block rounded-xl bg-gradient-to-r from-primary-fixed-dim to-secondary-container px-4 py-3 text-center text-sm font-black text-background transition-all hover:opacity-95"
                    >
                      Open {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-bold text-error transition-colors hover:bg-error/10"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        navigate('/login');
                      }}
                      className="w-full rounded-xl border border-primary-fixed-dim/30 px-4 py-3 text-sm font-bold text-primary-fixed-dim transition-colors hover:bg-primary-fixed-dim/10"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        navigate('/register');
                      }}
                      className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-on-primary-container transition-all hover:-translate-y-0.5"
                    >
                      Initialize Vault
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
