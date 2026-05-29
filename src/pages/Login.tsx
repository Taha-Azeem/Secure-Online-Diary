import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { AlertTriangle, Fingerprint, Key, Verified } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { AppFooter } from '../components/Layout';

export default function Login() {
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
      // Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Fetch profile (blocks navigation until we have it)
      const profileSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
      const role = profileSnap.exists() ? profileSnap.data().role : 'user';

      // Fire-and-forget: write activity log in background (never blocks navigation)
      addDoc(collection(db, 'activityLogs'), {
        userId: userCredential.user.uid,
        userEmail: userCredential.user.email,
        action: 'Login Success',
        resource: '/system/auth',
        timestamp: serverTimestamp(),
        status: 'SUCCESS',
      }).catch(() => {});

      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      console.error(err);
      setError('Authentication Failed: Invalid credentials or vault signature.');

      // Security log is fire-and-forget on failure too
      if (email) {
        addDoc(collection(db, 'securityLogs'), {
          type: 'AUTH',
          description: `Failed login attempt for ${email}`,
          timestamp: serverTimestamp(),
          severity: 'HIGH',
          ip: 'Logged',
        }).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      // Fetch profile (blocks navigation)
      const profileSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
      const role = profileSnap.exists() ? profileSnap.data().role : 'user';

      // Fire-and-forget: write activity log in background
      addDoc(collection(db, 'activityLogs'), {
        userId: userCredential.user.uid,
        userEmail: userCredential.user.email,
        action: 'Login Success (Google)',
        resource: '/system/auth',
        timestamp: serverTimestamp(),
        status: 'SUCCESS',
      }).catch(() => {});

      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(`Google Authentication Failed: ${err.message || 'Error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary-container flex flex-col justify-between">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(112,0,255,0.08),transparent)]" />
        <div className="absolute top-[10%] left-[10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <main className="relative z-10 flex w-full flex-grow items-center justify-center px-4 py-12 sm:py-16">
        <div className="relative w-full max-w-[480px] rounded-xl p-6 shadow-2xl transition-all hover:scale-[1.01] sm:p-margin-lg glass-panel">
          <div className="absolute -top-12 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-surface-container-low p-3 shadow-2xl sm:-top-16 sm:h-32 sm:w-32 sm:p-4">
            <Fingerprint className="h-12 w-12 text-primary-fixed-dim drop-shadow-[0_0_30px_rgba(0,218,243,0.6)] sm:h-20 sm:w-20" />
          </div>

          <div className="mt-10 text-center sm:mt-12">
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-primary-fixed-dim sm:text-4xl">CipherDiary</h1>
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

              <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
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
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary-fixed-dim to-secondary-container py-4 text-base font-extrabold text-background shadow-[0_10px_20px_rgba(0,218,243,0.3)] transition-all hover:shadow-[0_15px_30px_rgba(0,218,243,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
            >
              <Verified size={24} />
              {loading ? 'INITIALIZING...' : 'Initialize Vault'}
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20"></div>
              </div>
              <span className="relative px-4 text-xs font-black uppercase tracking-widest text-on-surface-variant bg-surface-container-lowest/80 backdrop-blur-sm rounded-full">
                OR
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/50 py-4 text-base font-bold text-on-surface transition-all hover:bg-surface-container-low active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 15.02 1 12 1 7.24 1 3.23 3.73 1.28 7.7l3.85 2.99C6.07 7.4 8.78 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.91 3.42-8.6z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.13 10.69c-.24-.7-.38-1.46-.38-2.24s.14-1.54.38-2.24L1.28 7.22C.46 8.85 0 10.68 0 12.6c0 1.92.46 3.75 1.28 5.38l3.85-2.99c-.24-.7-.38-1.46-.38-2.24z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.9l-3.69-2.87c-1.16.78-2.64 1.27-4.27 1.27-3.22 0-5.93-2.36-6.9-5.65L1.28 15.84C3.23 19.8 7.24 23 12 23z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-bold text-on-surface-variant">
            New node cluster? <Link to="/register" className="text-primary-fixed-dim hover:underline">Register Identity</Link>
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-4">
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

      <AppFooter />
    </div>
  );
}
