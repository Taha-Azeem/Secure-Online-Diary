import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { Mail, Key, Rocket, ArrowRight, Shield, Ghost, UserPlus, AlertTriangle } from 'lucide-react';
import { doc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function Register() {
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

      await updateProfile(user, { displayName: formData.username });

      // Create user profile in Firestore
      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: formData.username,
          role: formData.email.includes('admin') ? 'admin' : 'user',
          createdAt: serverTimestamp(),
          biometricsEnabled: false,
          lastLogin: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      }

      // Log activity
      const logPath = 'activityLogs';
      try {
        await addDoc(collection(db, 'activityLogs'), {
          userId: user.uid,
          userEmail: user.email,
          action: 'Account Initialization',
          resource: '/system/register',
          timestamp: serverTimestamp(),
          status: 'SUCCESS'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, logPath);
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Initialization Failed: ' + (err.message || 'Error creating secure vault.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden flex flex-col items-center">
      {/* Background Visual Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#00daf3 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      <header className="bg-surface/30 backdrop-blur-xl border-b border-outline-variant/50 shadow-[0_4px_30px_rgba(0,0,0,0.1)] fixed top-0 w-full z-50">
        <div className="flex justify-between items-center w-full px-margin-lg max-w-container-max-width mx-auto py-4">
          <Link to="/" className="font-headline-xl text-4xl font-extrabold text-primary-fixed-dim drop-shadow-[0_0_10px_rgba(0,218,243,0.5)]">
            CipherDiary
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="font-bold text-on-surface-variant hover:text-primary transition-all duration-300 px-4 py-2">Login</Link>
            <button className="bg-primary-container text-on-primary-container px-6 py-2 rounded-xl font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:scale-105 active:scale-95 transition-all">
              Initialize Vault
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center w-full pt-32 pb-margin-lg px-gutter-md">
        <div className="relative w-full max-w-[1200px] flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Content */}
          <div className="w-full lg:w-1/2 space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-secondary-container/20 border border-secondary/30 px-4 py-1.5 rounded-full">
              <Shield size={16} className="text-secondary" />
              <span className="text-xs font-black text-secondary uppercase tracking-widest leading-none">Protocol v4.0 Active</span>
            </div>
            <h1 className="text-6xl font-black text-primary leading-[1.1]">
              Establish Your <br/> <span className="text-primary-fixed-dim">Digital Sovereignty</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
              Join the elite network of secure journals. Every character you type is fragmented and distributed across our decentralized encrypted mesh.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 p-4 rounded-xl flex items-center gap-3 shadow-lg">
                <div className="text-primary-fixed-dim"><Shield size={24} /></div>
                <div>
                  <p className="font-bold text-on-surface">AES-256</p>
                  <p className="text-xs text-on-surface-variant">Military Grade</p>
                </div>
              </div>
              <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 p-4 rounded-xl flex items-center gap-3 shadow-lg">
                <div className="text-secondary"><Ghost size={24} /></div>
                <div>
                  <p className="font-bold text-on-surface">Zero-Knowledge</p>
                  <p className="text-xs text-on-surface-variant">Your keys, your diary</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="w-full lg:w-1/2 relative">
            <div className="bg-surface-container-low/40 backdrop-blur-[40px] border border-white/10 rounded-2xl p-10 shadow-2xl relative z-10">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-3xl font-extrabold text-on-surface">Vault Initialization</h2>
                  <span className="text-xs font-black text-primary-fixed-dim">STEP 1/3</span>
                </div>
                
                {/* Progress Indicator */}
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-container to-secondary-container w-1/3 rounded-full"></div>
                </div>

                {error && (
                  <div className="bg-error/10 border border-error/50 p-4 rounded-xl flex items-center gap-3 text-error text-sm font-bold animate-pulse">
                    <AlertTriangle size={20} />
                    {error}
                  </div>
                )}

                {/* Input Group 1 */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant ml-1 uppercase tracking-widest">Universal Identifier (Username)</label>
                  <div className="relative">
                    <UserPlus size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim opacity-70" />
                    <input 
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-on-surface font-medium focus:ring-2 focus:ring-primary-container outline-none transition-all shadow-inner" 
                      placeholder="Username"
                    />
                  </div>
                </div>

                {/* Input Group 2 */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant ml-1 uppercase tracking-widest">Encryption Endpoint (Email)</label>
                  <div className="relative">
                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim opacity-70" />
                    <input 
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-on-surface font-medium focus:ring-2 focus:ring-primary-container outline-none transition-all shadow-inner" 
                      placeholder="Email Address"
                    />
                  </div>
                </div>

                {/* Input Group 3 */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant ml-1 uppercase tracking-widest">Master Access Key (Password)</label>
                  <div className="relative">
                    <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim opacity-70" />
                    <input 
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-on-surface font-medium focus:ring-2 focus:ring-primary-container outline-none transition-all shadow-inner" 
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <div className="h-1 flex-1 bg-secondary rounded-full"></div>
                    <div className="h-1 flex-1 bg-secondary rounded-full"></div>
                    <div className="h-1 flex-1 bg-surface-container-highest rounded-full"></div>
                    <div className="h-1 flex-1 bg-surface-container-highest rounded-full"></div>
                  </div>
                  <p className="text-[10px] font-bold text-on-surface-variant mt-1 uppercase tracking-tighter">Entropy Level: Medium Secure</p>
                </div>

                {/* CTA */}
                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary-container to-secondary-container text-background font-black text-xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(0,229,255,0.25)] hover:shadow-[0_20px_50px_rgba(112,0,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <span>{loading ? 'INITIALIZING...' : 'Initialize Vault'}</span>
                    <Rocket size={24} />
                  </button>
                  <p className="text-[10px] font-bold text-on-surface-variant text-center mt-6 uppercase tracking-widest">
                    By initializing, you agree to our 256-bit <Link className="text-primary-fixed underline underline-offset-4" to="/terms">Security Protocols</Link>.
                  </p>
                </div>
              </form>
            </div>
            
            {/* Decorative Floating Card */}
            <div className="absolute -right-12 -bottom-8 w-40 h-40 bg-surface-container-low/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center gap-2 z-20 hidden lg:flex shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-primary-fixed-dim/20 flex items-center justify-center text-primary-fixed-dim">
                <Shield size={24} />
              </div>
              <p className="text-[10px] font-black tracking-tighter text-center text-on-surface uppercase">Biometric Link<br/>Available</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-surface-container-highest w-full py-12 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-lg max-w-container-max-width mx-auto gap-4">
          <div className="text-xl font-extrabold text-on-surface">
            CipherDiary
          </div>
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            © 2026 CipherDiary Secure Systems. AES-256 Bit Encrypted.
          </div>
          <div className="flex gap-6 text-sm font-bold">
            <a className="text-on-surface-variant hover:text-secondary underline decoration-secondary" href="#">Privacy Protocol</a>
            <a className="text-on-surface-variant hover:text-secondary underline decoration-secondary" href="#">Terms of Service</a>
            <a className="text-on-surface-variant hover:text-secondary underline decoration-secondary" href="#">Security Audit</a>
            <a className="text-on-surface-variant hover:text-secondary underline decoration-secondary" href="#">Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
