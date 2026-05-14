import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { AlertTriangle, Fingerprint, Key, Verified } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../lib/firebase';

export default function Login() {
  const { setVaultKey } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setVaultKey(password);

      await addDoc(collection(db, 'activityLogs'), {
        userId: userCredential.user.uid,
        userEmail: userCredential.user.email,
        action: 'Login Success',
        resource: '/system/auth',
        timestamp: serverTimestamp(),
        status: 'SUCCESS',
      });

      const profileSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
      const role = profileSnap.exists() ? profileSnap.data().role : 'user';
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      console.error(err);
      setError('Authentication Failed: Invalid credentials or vault signature.');

      if (email) {
        await addDoc(collection(db, 'securityLogs'), {
          type: 'AUTH',
          description: `Failed login attempt for ${email}`,
          timestamp: serverTimestamp(),
          severity: 'HIGH',
          ip: 'Logged',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary-container overflow-hidden flex items-center justify-center p-gutter-md">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(112,0,255,0.08),transparent)]" />
        <div className="absolute top-[10%] left-[10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <main className="relative z-10 flex w-full items-center justify-center">
        <div className="w-full max-w-[480px] glass-panel rounded-xl p-margin-lg shadow-2xl relative transition-all hover:scale-[1.01]">
          <div className="absolute -top-16 left-1/2 flex h-32 w-32 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-surface-container-low p-4 shadow-2xl">
            <Fingerprint size={80} className="text-primary-fixed-dim drop-shadow-[0_0_30px_rgba(0,218,243,0.6)]" />
          </div>

          <div className="mt-12 text-center">
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-primary-fixed-dim">CipherDiary</h1>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Protocol Status: Authentication Required</p>
          </div>

          <form onSubmit={handleLogin} className="mt-12 space-y-6">
            {error ? (
              <div className="flex items-center gap-3 rounded-xl border border-error/50 bg-error/10 p-4 text-sm font-bold text-error animate-pulse">
                <AlertTriangle size={20} />
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="px-1 text-xs font-black uppercase tracking-widest text-secondary" htmlFor="email">
                Vault Identifier (Email)
              </label>
              <div className="relative group">
                <Fingerprint size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim/50 transition-colors group-focus-within:text-primary-fixed-dim" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest/50 py-4 pl-12 pr-4 text-on-surface shadow-inner transition-all focus:border-primary-fixed-dim focus:outline-none focus:ring-2 focus:ring-primary-container/50"
                  placeholder="Enter your secure email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="px-1 text-xs font-black uppercase tracking-widest text-secondary" htmlFor="password">
                Access Protocol (Password)
              </label>
              <div className="relative group">
                <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim/50 transition-colors group-focus-within:text-primary-fixed-dim" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest/50 py-4 pl-12 pr-4 text-on-surface shadow-inner transition-all focus:border-primary-fixed-dim focus:outline-none focus:ring-2 focus:ring-primary-container/50"
                  placeholder="Enter your secure passphrase"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="group flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-outline-variant bg-surface-container text-secondary focus:ring-secondary focus:ring-offset-background" />
                <span className="text-sm font-bold text-on-surface-variant transition-colors group-hover:text-on-surface">Stay linked</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-bold text-primary-fixed-dim underline-offset-4 transition-colors hover:text-primary hover:underline">
                Lost access protocol?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary-fixed-dim to-secondary-container py-4 text-lg font-extrabold text-background shadow-[0_10px_20px_rgba(0,218,243,0.3)] transition-all hover:shadow-[0_15px_30px_rgba(0,218,243,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Verified size={24} />
              {loading ? 'INITIALIZING...' : 'Initialize Vault'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-bold text-on-surface-variant">
            New node cluster? <Link to="/register" className="text-primary-fixed-dim hover:underline">Register Identity</Link>
          </p>

          <div className="mt-12 flex justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-highest/50 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_#00daf3]" />
              <span className="text-[10px] font-black uppercase tracking-tight text-on-surface-variant">AES-256 ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-highest/50 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]" />
              <span className="text-[10px] font-black uppercase tracking-tight text-on-surface-variant">ENCRYPTED LINK</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full py-6">
        <div className="flex flex-col items-center justify-center gap-6 px-margin-lg text-xs font-bold text-on-surface-variant/60 md:flex-row">
          <span>© 2026 CipherDiary Secure Systems. AES-256 Bit Encrypted.</span>
          <div className="flex gap-4">
            <Link className="transition-colors hover:text-primary" to="/terms">Privacy Protocol</Link>
            <Link className="transition-colors hover:text-primary" to="/security">Compliance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
