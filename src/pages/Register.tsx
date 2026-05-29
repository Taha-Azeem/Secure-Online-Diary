import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, Ghost, Key, Mail, Rocket, Shield, UserPlus } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { AppFooter } from '../components/Layout';
import CryptoJS from 'crypto-js';
import { EncryptionService } from '../lib/encryption';

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: 'Empty', color: 'bg-white/10' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 2) {
    return { score, label: 'Weak (Vulnerable)', color: 'bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]' };
  }
  if (score <= 4) {
    return { score, label: 'Medium Secure', color: 'bg-secondary shadow-[0_0_8px_#d1bcff]' };
  }
  return { score, label: 'Strong Vault Key', color: 'bg-success shadow-[0_0_8px_#10b981]' };
};

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [consentChecked, setConsentChecked] = useState(false);
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

    if (formData.password !== formData.confirmPassword) {
      setError('Key Mismatch: Master access keys do not match.');
      setLoading(false);
      return;
    }

    if (!consentChecked) {
      setError('Protocol Error: You must accept the Zero-Knowledge warning checkbox.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.username });

      try {
        const verifierSalt = EncryptionService.generateSalt();
        const verifierIv = EncryptionService.generateIv();
        const verifierPayload = EncryptionService.encrypt('vault_signature_verification', formData.password, verifierSalt, verifierIv);

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: formData.username,
          role: formData.email.includes('admin') ? 'admin' : 'user',
          createdAt: serverTimestamp(),
          biometricsEnabled: false,
          lastLogin: serverTimestamp(),
          verifierPayload,
          verifierSalt: verifierSalt.toString(CryptoJS.enc.Hex),
          verifierIv: verifierIv.toString(CryptoJS.enc.Hex)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }

      // Fire-and-forget: write activity log in background
      addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        userEmail: user.email,
        action: 'Account Initialization',
        resource: '/system/register',
        timestamp: serverTimestamp(),
        status: 'SUCCESS',
      }).catch(() => {});

      navigate(formData.email.includes('admin') ? '/admin' : '/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(`Initialization Failed: ${err.message || 'Error creating secure vault.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      void addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        userEmail: user.email,
        action: 'Login Success (Google)',
        resource: '/system/auth',
        timestamp: serverTimestamp(),
        status: 'SUCCESS',
      }).catch((logErr) => {
        console.warn('Activity log write failed (non-critical):', logErr);
      });

      navigate(user.email?.includes('admin') ? '/admin' : '/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(`Google Authentication Failed: ${err.message || 'Error occurred.'}`);
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
        <div className="mx-auto flex w-full max-w-container-max-width items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 md:px-margin-lg">
          <Link to="/" className="text-2xl font-extrabold text-primary-fixed-dim drop-shadow-[0_0_10px_rgba(0,218,243,0.5)] sm:text-4xl">
            CipherDiary
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="px-3 py-2 text-sm font-bold text-on-surface-variant transition-all duration-300 hover:text-primary sm:px-4">Login</Link>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="rounded-xl bg-primary-container px-4 py-2 text-sm font-bold text-on-primary-container shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all hover:scale-105 active:scale-95 sm:px-6"
            >
              Initialize Vault
            </button>
          </div>
        </div>
      </header>

      <main className="flex w-full flex-grow items-center justify-center px-4 pb-10 pt-24 sm:px-gutter-md sm:pb-margin-lg sm:pt-32">
        <div className="relative flex w-full max-w-[1200px] flex-col items-center gap-10 lg:flex-row lg:gap-16">
          <div className="relative z-10 w-full space-y-8 lg:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary-container/20 px-4 py-1.5">
              <Shield size={16} className="text-secondary" />
              <span className="text-xs font-black uppercase tracking-widest text-secondary">Protocol v4.0 Active</span>
            </div>
            <h1 className="text-4xl font-black leading-[1.1] text-primary sm:text-5xl lg:text-6xl">
              Establish Your <br /> <span className="text-primary-fixed-dim">Digital Sovereignty</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-on-surface-variant">
              Start your private writing journey. Your entries are fully encrypted on your device using zero-knowledge architecture before uploading, so only you can unlock them.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="glass-panel relative z-10 rounded-2xl p-6 shadow-2xl sm:p-8 lg:p-10">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-on-surface tracking-tight">Create Secure Vault</h2>
                  <p className="text-xs font-semibold text-on-surface-variant mt-1">Set up your local cryptographic key to start journaling.</p>
                </div>

                {error ? (
                  <div className="flex items-center gap-3 rounded-xl border border-error/50 bg-error/10 p-4 text-sm font-bold text-error animate-pulse">
                    <AlertTriangle size={20} />
                    {error}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-black uppercase tracking-widest text-on-surface-variant">Display Name / Username</label>
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
                  <label className="ml-1 text-xs font-black uppercase tracking-widest text-on-surface-variant">Secure Email Address</label>
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
                  <label className="ml-1 text-xs font-black uppercase tracking-widest text-on-surface-variant">Master Password</label>
                  <div className="relative">
                    <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim/70" />
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-4 pl-12 pr-4 text-on-surface shadow-inner outline-none transition-all focus:ring-2 focus:ring-primary-container"
                      placeholder="Create a strong master passphrase"
                    />
                  </div>
                  
                  {/* Dynamic Password Strength Indicator */}
                  {(() => {
                    const strength = getPasswordStrength(formData.password);
                    return (
                      <>
                        <div className="mt-2 flex gap-1.5">
                          <div className={`h-1 flex-1 rounded-full ${formData.password ? (strength.score >= 1 ? (strength.score <= 2 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : strength.score <= 4 ? 'bg-secondary' : 'bg-success') : 'bg-surface-container-highest') : 'bg-surface-container-highest'}`} />
                          <div className={`h-1 flex-1 rounded-full ${formData.password ? (strength.score >= 3 ? (strength.score <= 4 ? 'bg-secondary' : 'bg-success') : 'bg-surface-container-highest') : 'bg-surface-container-highest'}`} />
                          <div className={`h-1 flex-1 rounded-full ${formData.password ? (strength.score >= 4 ? (strength.score <= 4 ? 'bg-secondary' : 'bg-success') : 'bg-surface-container-highest') : 'bg-surface-container-highest'}`} />
                          <div className={`h-1 flex-1 rounded-full ${formData.password ? (strength.score >= 5 ? 'bg-success' : 'bg-surface-container-highest') : 'bg-surface-container-highest'}`} />
                        </div>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-tight text-on-surface-variant">
                          Key Strength: <span className={formData.password ? (strength.score <= 2 ? 'text-red-400' : strength.score <= 4 ? 'text-secondary' : 'text-success') : 'text-on-surface-variant'}>{strength.label}</span>
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-black uppercase tracking-widest text-on-surface-variant">Confirm Master Password</label>
                  <div className="relative">
                    <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim/70" />
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-4 pl-12 pr-4 text-on-surface shadow-inner outline-none transition-all focus:ring-2 focus:ring-primary-container"
                      placeholder="Verify your master passphrase"
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-tight text-red-400">Passwords do not match</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-tight text-success">Passwords match</p>
                  )}
                </div>

                {/* Zero-Knowledge Consent Checkbox */}
                <div className="flex flex-col gap-3 py-2 sm:flex-row">
                  <input
                    id="consentChecked"
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-outline-variant bg-surface-container text-secondary focus:ring-secondary cursor-pointer"
                  />
                  <label htmlFor="consentChecked" className="text-xs font-semibold leading-5 text-on-surface-variant cursor-pointer hover:text-on-surface select-none">
                    I acknowledge that CipherDiary is a zero-knowledge platform. If I forget my password, my entries cannot be recovered by anyone.
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary-container to-secondary-container py-4 text-base font-black text-background shadow-[0_15px_30px_rgba(0,229,255,0.25)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(112,0,255,0.4)] active:scale-[0.98] disabled:opacity-50 sm:py-5 sm:text-xl"
                  >
                    <span>{loading ? 'INITIALIZING...' : 'Initialize Vault'}</span>
                    <Rocket size={24} />
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
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/50 py-4 text-base font-bold text-on-surface transition-all hover:bg-surface-container-low active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:py-5 sm:text-xl"
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

                  <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    By initializing, you agree to our 256-bit <Link className="text-primary-fixed underline underline-offset-4" to="/terms">Security Protocols</Link>.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
