import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 z-50 w-full bg-surface/30 backdrop-blur-xl border-b border-outline-variant/50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center w-full px-margin-lg max-w-container-max-width mx-auto py-4">
        <Link to="/" className="font-headline-xl text-headline-xl font-extrabold text-primary-fixed-dim drop-shadow-[0_0_10px_rgba(0,218,243,0.5)]">
          CipherDiary
        </Link>
        <div className="hidden md:flex gap-gutter-md">
          <Link className="font-title-md text-title-md text-on-surface-variant hover:text-primary transition-all duration-300" to="/security">Security</Link>
          <Link className="font-title-md text-title-md text-on-surface-variant hover:text-primary transition-all duration-300" to="/vault">Vault</Link>
          <Link className="font-title-md text-title-md text-on-surface-variant hover:text-primary transition-all duration-300" to="/pricing">Pricing</Link>
          <Link className="font-title-md text-title-md text-on-surface-variant hover:text-primary transition-all duration-300" to="/about">About</Link>
        </div>
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <button 
                onClick={() => navigate('/login')}
                className="font-label-md text-label-md text-primary-fixed-dim px-4 py-2 border border-primary-fixed-dim rounded-lg hover:bg-primary-fixed-dim/10 transition-all font-bold"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="font-label-md text-label-md bg-primary-container text-on-primary-container px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.4)] active:scale-95 transition-all font-bold"
              >
                Initialize Vault
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/dashboard')}
              className="font-label-md text-label-md bg-primary-container text-on-primary-container px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.4)] active:scale-95 transition-all font-bold"
            >
              Dashboard
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
