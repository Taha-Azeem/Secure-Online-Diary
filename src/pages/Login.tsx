import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { Fingerprint, Key, Verified, AlertTriangle } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Log successful activity
      await addDoc(collection(db, 'activityLogs'), {
        userId: userCredential.user.uid,
        userEmail: userCredential.user.email,
        action: 'Login Success',
        resource: '/system/auth',
        timestamp: serverTimestamp(),
        status: 'SUCCESS'
      });

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Authentication Failed: Invalid credentials or vault signature.');
      
      // Log failed attempt if we have an email
      if (email) {
        await addDoc(collection(db, 'securityLogs'), {
          type: 'AUTH',
          description: `Failed login attempt for ${email}`,
          timestamp: serverTimestamp(),
          severity: 'HIGH',
          ip: 'Logged'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary-container overflow-hidden flex items-center justify-center p-gutter-md">
      {/* Background Data Streams */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(112,0,255,0.08),transparent)]"></div>
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]"></div>
      </div>

      <main className="relative z-10 w-full flex items-center justify-center">
        {/* Central Glassmorphic Login Card */}
        <div className="w-full max-w-[480px] bg-surface-container-low/40 backdrop-blur-[40px] border border-white/10 rounded-xl p-margin-lg shadow-2xl relative transform transition-all hover:scale-[1.01]">
          {/* Visual Anchor */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 flex items-center justify-center bg-surface-container-low rounded-full border border-white/10 p-4 shadow-2xl">
            <Fingerprint size={80} className="text-primary-fixed-dim drop-shadow-[0_0_30px_rgba(0,218,243,0.6)]" />
          </div>

          <div className="mt-12 text-center">
            <h1 className="text-4xl font-extrabold text-primary-fixed-dim tracking-tight mb-2">
              CipherDiary
            </h1>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em] opacity-70">
              Protocol Status: Authentication Required
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-12 space-y-6">
            {error && (
              <div className="bg-error/10 border border-error/50 p-4 rounded-xl flex items-center gap-3 text-error text-sm font-bold animate-pulse">
                <AlertTriangle size={20} />
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary px-1 uppercase tracking-widest" htmlFor="email">
                Vault Identifier (Email)
              </label>
              <div className="relative group">
                <Fingerprint size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim/50 group-focus-within:text-primary-fixed-dim transition-colors" />
                <input 
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg py-4 pl-12 pr-4 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-fixed-dim transition-all shadow-inner"
                  placeholder="Enter encryption key ID"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary px-1 uppercase tracking-widest" htmlFor="password">
                Access Protocol (Password)
              </label>
              <div className="relative group">
                <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim/50 group-focus-within:text-primary-fixed-dim transition-colors" />
                <input 
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg py-4 pl-12 pr-4 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-fixed-dim transition-all shadow-inner"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-outline-variant bg-surface-container text-secondary focus:ring-offset-background focus:ring-secondary" />
                <span className="text-sm font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">Stay linked</span>
              </label>
              <Link to="/forgot-password" size={20} className="text-sm font-bold text-primary-fixed-dim hover:text-primary transition-colors underline-offset-4 hover:underline">
                Lost access protocol?
              </Link>
            </div>

            {/* Submit Action */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-extrabold text-lg text-background bg-gradient-to-r from-primary-fixed-dim to-secondary-container shadow-[0_10px_20px_rgba(0,218,243,0.3)] hover:shadow-[0_15px_30px_rgba(0,218,243,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Verified size={24} />
              {loading ? 'INITIALIZING...' : 'Initialize Vault'}
            </button>
          </form>

          <p className="text-center mt-8 text-on-surface-variant text-sm font-bold">
            New node cluster? <Link to="/register" className="text-primary-fixed-dim hover:underline">Register Identity</Link>
          </p>

          {/* Security Status Badges */}
          <div className="mt-12 flex justify-center gap-4">
            <div className="flex items-center gap-2 bg-surface-container-highest/50 px-3 py-1.5 rounded-full border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#00daf3]"></span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">AES-256 ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-highest/50 px-3 py-1.5 rounded-full border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]"></span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">ENCRYPTED LINK</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full py-6">
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 px-margin-lg font-bold text-xs text-on-surface-variant/60">
          <span>© 2026 CipherDiary Secure Systems. AES-256 Bit Encrypted.</span>
          <div className="flex gap-4">
            <a className="hover:text-primary transition-colors" href="#">Privacy Protocol</a>
            <a className="hover:text-primary transition-colors" href="#">Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
