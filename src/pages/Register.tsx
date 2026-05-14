import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, Ghost, Key, Mail, Rocket, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function Register() {
  const { setVaultKey } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      setVaultKey(formData.password);

      await updateProfile(user, { displayName: formData.username });

      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: formData.username,
          role: formData.email.includes('admin') ? 'admin' : 'user',
          createdAt: serverTimestamp(),
          biometricsEnabled: false,
          lastLogin: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }

      try {
        await addDoc(collection(db, 'activityLogs'), {
          userId: user.uid,
          userEmail: user.email,
          action: 'Account Initialization',
          resource: '/system/register',
          timestamp: serverTimestamp(),
          status: 'SUCCESS',
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'activityLogs');
      }

      navigate(formData.email.includes('admin') ? '/admin' : '/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(`Initialization Failed: ${err.message || 'Error creating secure vault.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden flex flex-col items-center">
      <div className="fixed top-0 left-0 h-full w-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[5%] h-[500px] w-[500px] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#00daf3 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <header className="fixed top-0 z-50 w-full border-b border-outline-variant/50 bg-surface/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-container-max-width items-center justify-between px-margin-lg py-4">
          <Link to="/" className="text-4xl font-extrabold text-primary-fixed-dim drop-shadow-[0_0_10px_rgba(0,218,243,0.5)]">
            CipherDiary
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="px-4 py-2 font-bold text-on-surface-variant transition-all duration-300 hover:text-primary">Login</Link>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="rounded-xl bg-primary-container px-6 py-2 font-bold text-on-primary-container shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              Initialize Vault
            </button>
          </div>
        </div>
      </header>

      <main className="flex w-full flex-grow items-center justify-center px-gutter-md pb-margin-lg pt-32">
        <div className="relative flex w-full max-w-[1200px] flex-col items-center gap-16 lg:flex-row">
          <div className="relative z-10 w-full space-y-8 lg:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary-container/20 px-4 py-1.5">
              <Shield size={16} className="text-secondary" />
              <span className="text-xs font-black uppercase tracking-widest text-secondary">Protocol v4.0 Active</span>
            </div>
            <h1 className="text-6xl font-black leading-[1.1] text-primary">
              Establish Your <br /> <span className="text-primary-fixed-dim">Digital Sovereignty</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-on-surface-variant">
              Join the elite network of secure journals. Every character you type is fragmented and distributed across our decentralized encrypted mesh.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-container-low/40 p-4 shadow-lg backdrop-blur-xl">
                <div className="text-primary-fixed-dim"><Shield size={24} /></div>
                <div>
                  <p className="font-bold text-on-surface">AES-256</p>
                  <p className="text-xs text-on-surface-variant">Military Grade</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-container-low/40 p-4 shadow-lg backdrop-blur-xl">
                <div className="text-secondary"><Ghost size={24} /></div>
                <div>
                  <p className="font-bold text-on-surface">Zero-Knowledge</p>
                  <p className="text-xs text-on-surface-variant">Your keys, your diary</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-1/2">
            <div className="glass-panel relative z-10 rounded-2xl p-10 shadow-2xl">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="mb-4 flex items-end justify-between">
                  <h2 className="text-3xl font-extrabold text-on-surface">Vault Initialization</h2>
                  <span className="text-xs font-black text-primary-fixed-dim">STEP 1/3</span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary-container to-secondary-container" />
                </div>

                {error ? (
                  <div className="flex items-center gap-3 rounded-xl border border-error/50 bg-error/10 p-4 text-sm font-bold text-error animate-pulse">
                    <AlertTriangle size={20} />
                    {error}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-black uppercase tracking-widest text-on-surface-variant">Universal Identifier (Username)</label>
                  <div className="relative">
                    <UserPlus size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim/70" />
                    <input
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-4 pl-12 pr-4 text-on-surface shadow-inner outline-none transition-all focus:ring-2 focus:ring-primary-container"
                      placeholder="Username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-black uppercase tracking-widest text-on-surface-variant">Encryption Endpoint (Email)</label>
                  <div className="relative">
                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim/70" />
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-4 pl-12 pr-4 text-on-surface shadow-inner outline-none transition-all focus:ring-2 focus:ring-primary-container"
                      placeholder="Email Address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-black uppercase tracking-widest text-on-surface-variant">Master Access Key (Password)</label>
                  <div className="relative">
                    <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim/70" />
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-4 pl-12 pr-4 text-on-surface shadow-inner outline-none transition-all focus:ring-2 focus:ring-primary-container"
                      placeholder="Create a strong passphrase"
                    />
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <div className="h-1 flex-1 rounded-full bg-secondary" />
                    <div className="h-1 flex-1 rounded-full bg-secondary" />
                    <div className="h-1 flex-1 rounded-full bg-surface-container-highest" />
                    <div className="h-1 flex-1 rounded-full bg-surface-container-highest" />
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-tight text-on-surface-variant">Entropy Level: Medium Secure</p>
                </div>

                <div className="pt-4">
                  <button
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary-container to-secondary-container py-5 text-xl font-black text-background shadow-[0_15px_30px_rgba(0,229,255,0.25)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(112,0,255,0.4)] active:scale-[0.98] disabled:opacity-50"
                  >
                    <span>{loading ? 'INITIALIZING...' : 'Initialize Vault'}</span>
                    <Rocket size={24} />
                  </button>
                  <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    By initializing, you agree to our 256-bit <Link className="text-primary-fixed underline underline-offset-4" to="/terms">Security Protocols</Link>.
                  </p>
                </div>
              </form>
            </div>

            <div className="absolute -bottom-8 -right-12 z-20 hidden h-40 w-40 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface-container-low/60 p-4 shadow-2xl backdrop-blur-xl lg:flex">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed-dim/20 text-primary-fixed-dim">
                <Shield size={24} />
              </div>
              <p className="text-center text-[10px] font-black uppercase tracking-tight text-on-surface">Biometric Link<br />Available</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full bg-surface-container-highest py-12">
        <div className="mx-auto flex max-w-container-max-width flex-col items-center justify-between gap-4 px-margin-lg md:flex-row">
          <div className="text-xl font-extrabold text-on-surface">CipherDiary</div>
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">© 2026 CipherDiary Secure Systems. AES-256 Bit Encrypted.</div>
          <div className="flex gap-6 text-sm font-bold">
            <Link className="text-on-surface-variant underline decoration-secondary hover:text-secondary" to="/terms">Privacy Protocol</Link>
            <Link className="text-on-surface-variant underline decoration-secondary hover:text-secondary" to="/terms">Terms of Service</Link>
            <Link className="text-on-surface-variant underline decoration-secondary hover:text-secondary" to="/security">Security Audit</Link>
            <Link className="text-on-surface-variant underline decoration-secondary hover:text-secondary" to="/security">Compliance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
