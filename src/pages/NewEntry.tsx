import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EncryptionService } from '../lib/encryption';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createDiaryNotification } from '../lib/notifications';
import { syncPendingEntries } from '../lib/entrySync';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { useToast } from '../context/ToastContext';
import RichTextEditor from '../components/RichTextEditor';
import { 
  Shield, 
  Lock, 
  FileText, 
  Bold, 
  Paperclip, 
  Code, 
  Rocket, 
  ChevronRight,
  Database,
  Users,
  AlertOctagon
} from 'lucide-react';

export default function NewEntry() {
  const { user, vaultKey, setVaultKey } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [contentTouched, setContentTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonText, setButtonText] = useState('Seal & Encrypt');
  const [debugStatus, setDebugStatus] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [modalTab, setModalTab] = useState<'unlock' | 'initialize'>('unlock');
  const [modalError, setModalError] = useState('');
  const navigate = useNavigate();

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setModalError('Passphrase cannot be empty.');
      return;
    }
    setVaultKey(passphrase.trim());
    setPassphrase('');
    setModalError('');
  };

  const handleInitializeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length < 8) {
      setModalError('Passphrase must be at least 8 characters long.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setModalError('Passphrases do not match.');
      return;
    }
    setVaultKey(passphrase);
    setPassphrase('');
    setConfirmPassphrase('');
    setModalError('');
  };

  const handleSeal = async () => {
    if (!user || !vaultKey || !title.trim() || !content.trim()) {
      setTitleTouched(true);
      setContentTouched(true);
      showToast('Please fill in all fields before sealing.', 'error');
      return;
    }

    setLoading(true);
    
    // Scramble Animation
    let count = 0;
    const chars = '01#X$%&*@?';
    const interval = setInterval(() => {
      let scrambled = '';
      for (let i = 0; i < 12; i++) {
        scrambled += chars[Math.floor(Math.random() * chars.length)];
      }
      setButtonText(scrambled);
      count++;
    }, 70);

    // Let the animation play for 900ms
    await new Promise((resolve) => setTimeout(resolve, 900));
    clearInterval(interval);
    setButtonText('ENCRYPTING...');
    setDebugStatus('Starting encryption process...');
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Watchdog: if encryption takes too long, abort and notify user
    let watchdog: number | null = window.setTimeout(() => {
      setDebugStatus('Encryption timed out — try again');
      setButtonText('Seal & Encrypt');
      setLoading(false);
      showToast('Encryption timed out. Try again or check your Vault key.', 'error');
    }, 10000);

    try {
      setDebugStatus('Generating salt and IV');
      const salt = EncryptionService.generateSalt();
      const iv = EncryptionService.generateIv();
      const saltHex = salt.toString(CryptoJS.enc.Hex);
      const ivHex = iv.toString(CryptoJS.enc.Hex);
      setDebugStatus('Deriving key and encrypting');
      const { titleEncrypted, contentEncrypted, categoryEncrypted, securityLevelEncrypted } = await new Promise<{ titleEncrypted: string; contentEncrypted: string; categoryEncrypted: string; securityLevelEncrypted: string }>((resolve) => {
        setTimeout(() => {
          const t = EncryptionService.encrypt(title, vaultKey, salt, iv);
          const c = EncryptionService.encrypt(content, vaultKey, salt, iv);
          const cat = EncryptionService.encrypt('Personal', vaultKey, salt, iv);
          const sec = EncryptionService.encrypt('Tier-3', vaultKey, salt, iv);
          resolve({ titleEncrypted: t, contentEncrypted: c, categoryEncrypted: cat, securityLevelEncrypted: sec });
        }, 0);
      });

      // Debug: log lengths to help diagnose empty ciphertext issues
      // eslint-disable-next-line no-console
      console.debug('Encryption outputs (async):', { titleEncryptedLength: titleEncrypted?.length, contentEncryptedLength: contentEncrypted?.length, saltHex, ivHex });
      setDebugStatus(`Encrypted lengths: title=${titleEncrypted?.length || 0}, content=${contentEncrypted?.length || 0}, category=${categoryEncrypted?.length || 0}, security=${securityLevelEncrypted?.length || 0}`);

      // Guard: encryption must produce non-empty ciphertext
      if (!titleEncrypted || !contentEncrypted || !categoryEncrypted || !securityLevelEncrypted) {
        throw new Error('Encryption produced empty output. Check your vault key and try again.');
      }

      // Show immediate success feedback for encryption so user sees progress
      setButtonText('Done');
      setDebugStatus('Encrypted — saving...');
      try { if (watchdog) clearTimeout(watchdog); } catch (e) {}

      // Try to write to Firestore; on permission errors fall back to localStorage so the UI isn't blocked.
      try {
        await addDoc(collection(db, 'entries'), {
          ownerId: user.uid,
          titleEncrypted,
          contentEncrypted,
          categoryEncrypted,
          securityLevelEncrypted,
          salt: saltHex,
          iv: ivHex,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        void createDiaryNotification(user.uid, 'created').catch((notificationErr) => {
          console.warn('Failed to create entry notification (non-critical):', notificationErr);
        });
      } catch (writeErr: any) {
        console.warn('Entry write failed:', writeErr);
        setDebugStatus('Write failed');
        const msg = (writeErr && writeErr.message) ? String(writeErr.message).toLowerCase() : '';
        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

        if (isOffline) {
          // Only fall back to local storage when the browser is offline.
          try {
            const local = JSON.parse(window.localStorage.getItem('localEntries') || '[]');
            local.push({
              ownerId: user.uid,
              titleEncrypted,
              contentEncrypted,
              categoryEncrypted,
              securityLevelEncrypted,
              salt: saltHex,
              iv: ivHex,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              _fallback: true
            });
            window.localStorage.setItem('localEntries', JSON.stringify(local));
            console.info('Saved entry to localStorage fallback (offline).');
            showToast('Saved entry locally because you are offline. Sync will retry when the app reconnects.', 'warning');
            setDebugStatus('Saved entry to localStorage fallback');
            void syncPendingEntries(user.uid);
          } catch (localErr) {
            console.error('Failed to save local fallback entry:', localErr);
            throw writeErr; // surface original write error if we couldn't persist locally
          }
        } else {
          showToast(`Firestore save failed: ${msg || 'Unknown error'}`, 'error');
          throw writeErr;
        }
      }

      // Log the action — failure here must NOT abort the seal operation.
      void addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        userEmail: user.email ?? '',
        action: 'Created Entry',
        resource: '/diary/private',
        timestamp: serverTimestamp(),
        status: 'ENCRYPTED'
      }).catch((logErr) => {
        console.warn('Activity log write failed (non-critical):', logErr);
      });

      // Mark UI as completed and give user feedback before navigating away
      setButtonText('Done');
      setDebugStatus('Completed — entry sealed');
      await new Promise((resolve) => setTimeout(resolve, 300));
      showToast('Diary entry encrypted and sealed in the vault successfully!', 'success');
      // allow toast to render briefly before navigation
      await new Promise((resolve) => setTimeout(resolve, 700));
      navigate('/dashboard');
    } catch (err) {
      console.error('Seal entry error:', err);
      const message = err instanceof Error ? err.message : 'Encryption engine reported an error.';
      showToast(`Failed to seal entry. ${message}`, 'error');
      setButtonText('Seal & Encrypt');
    } finally {
      setLoading(false);
      // clear watchdog if still active
      try { if (watchdog) clearTimeout(watchdog); } catch (e) {}
    }
  };

  return (
    <div className="max-w-container-max-width mx-auto p-4 md:p-margin-lg space-y-8 overflow-x-hidden">
      {!vaultKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-surface-container-low border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 shadow-[0_0_20px_rgba(0,218,243,0.3)]">
                <Lock size={32} className="text-primary-fixed-dim" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Vault Access Verification</h2>
              <p className="text-sm text-on-surface-variant">Enter or create your master local encryption key before creating entries.</p>
            </div>

            <div className="flex bg-surface-container-lowest/60 rounded-xl p-1 border border-white/5">
              <button
                type="button"
                onClick={() => { setModalTab('unlock'); setModalError(''); }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${modalTab === 'unlock' ? 'bg-primary-container text-on-primary-container shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Unlock Vault
              </button>
              <button
                type="button"
                onClick={() => { setModalTab('initialize'); setModalError(''); }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${modalTab === 'initialize' ? 'bg-primary-container text-on-primary-container shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Initialize Vault
              </button>
            </div>

            {modalError && (
              <div className="flex items-center gap-3 rounded-xl border border-error/50 bg-error/10 p-4 text-xs font-bold text-error animate-pulse">
                <AlertOctagon size={16} />
                {modalError}
              </div>
            )}

            {modalTab === 'unlock' ? (
              <form onSubmit={handleUnlockSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary">Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter your master access key"
                    className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-4 text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-primary-fixed-dim to-secondary-container py-4 text-sm font-black uppercase tracking-widest text-background shadow-[0_10px_24px_rgba(0,218,243,0.25)] transition-all hover:scale-[1.01]"
                >
                  Unlock Vault
                </button>
              </form>
            ) : (
              <form onSubmit={handleInitializeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary">New Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Create a strong passphrase"
                    className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-4 text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary">Confirm Passphrase</label>
                  <input
                    type="password"
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    placeholder="Confirm passphrase"
                    className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-4 text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>

                {passphrase && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      <span>Entropy Score</span>
                      <span>{getPasswordStrength(passphrase)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getPasswordStrength(passphrase) < 50 ? 'bg-error' : getPasswordStrength(passphrase) < 75 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${getPasswordStrength(passphrase)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-xs font-medium text-error leading-relaxed">
                  <strong>WARNING:</strong> If you forget your Master Key, your diary entries cannot be recovered. We store 0 copies of this key on our servers.
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-primary-fixed-dim to-secondary-container py-4 text-sm font-black uppercase tracking-widest text-background shadow-[0_10px_24px_rgba(0,218,243,0.25)] transition-all hover:scale-[1.01]"
                >
                  Initialize Vault Key
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 border border-primary-container/40 text-primary-fixed-dim whitespace-nowrap">
            <Shield size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol 7-Delta Active</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-on-surface leading-tight">
            Initialize New<br/>
            <span className="text-primary-fixed-dim drop-shadow-[0_0_15px_rgba(0,218,243,0.4)]">Secure Entry</span>
          </h1>
        </div>

        {/* Security Indicator Widget */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-5 sm:p-6 rounded-2xl flex items-center gap-4 sm:gap-6 shadow-2xl">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-surface-container-highest" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeWidth="6"></circle>
              <circle className="text-primary-fixed-dim" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeWidth="6" strokeDasharray="226" strokeDashoffset="40" style={{ filter: 'drop-shadow(0 0 8px #00daf3)' }}></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-primary sm:text-xl">82%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Security Level</p>
            <p className="text-base sm:text-lg font-bold text-on-surface leading-none">Tier-3 Encrypted</p>
            <div className="flex gap-1 mt-3 sm:mt-4">
              <div className="h-1 w-8 bg-primary rounded-full"></div>
              <div className="h-1 w-8 bg-primary rounded-full"></div>
              <div className="h-1 w-8 bg-primary rounded-full"></div>
              <div className="h-1 w-8 bg-white/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

        {debugStatus && (
          <div className="mx-auto max-w-container-max-width px-4">
            <div className="mb-4 rounded-lg px-4 py-2 bg-yellow-900/20 border border-yellow-500/20 text-yellow-200 text-sm font-medium">
              Debug: {debugStatus}
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Text Editor Section */}
        <section className="lg:col-span-8 relative">
          <div className="glass-panel rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="h-3 w-3 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]"></div>
                <div className="h-3 w-3 rounded-full bg-secondary shadow-[0_0_8px_#d1bcff]"></div>
                <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_#00daf3]"></div>
              </div>
              <div className="flex w-full flex-col items-start sm:w-auto sm:items-end">
                <div className="flex w-full items-center gap-4 rounded-xl border border-white/5 bg-surface-container-high px-4 py-2 sm:w-auto">
                  <FileText className="text-primary-fixed-dim" size={18} />
                  <input 
                    type="text"
                    placeholder="entry_title.cipher"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setTitleTouched(true);
                    }}
                    onBlur={() => setTitleTouched(true)}
                    className="w-full min-w-0 bg-transparent border-none outline-none text-sm font-bold text-on-surface uppercase tracking-[0.18em] placeholder:text-on-surface-variant/40 sm:w-48"
                  />
                </div>
                {titleTouched && !title.trim() && (
                  <span className="text-[10px] font-bold text-red-400 mt-1 select-none">Title cannot be empty</span>
                )}
              </div>
            </div>
            
            {/* Recessed Editor Surface */}
            <div className="relative">
              <RichTextEditor 
                value={content}
                onChange={(val) => {
                  setContent(val);
                  setContentTouched(true);
                }}
                placeholder="Start typing encrypted thought-stream..."
              />
            </div>
            {contentTouched && (!content || content.trim() === '' || content === '<p><br></p>') && (
              <span className="text-[10px] font-bold text-red-400 mt-2 block select-none">Content cannot be empty</span>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-10 gap-6">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00daf3]"></span>
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Biometric Syncing...</span>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 md:flex-initial px-6 py-3 rounded-xl border border-white/10 font-bold text-sm text-on-surface hover:bg-white/5 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={handleSeal}
                  disabled={loading}
                  className="flex-1 md:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-background font-black text-sm shadow-[0_10px_20px_rgba(0,229,255,0.2)] hover:shadow-[0_15px_30px_rgba(0,229,255,0.4)] hover:scale-[1.03] active:scale-95 transition-all transform uppercase tracking-widest disabled:opacity-50 sm:px-10"
                >
                  {buttonText}
                </button>
              </div>
              {debugStatus && (
                <div className="w-full md:w-auto mt-3 text-sm text-on-surface-variant font-medium">
                  Status: {debugStatus}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-gradient-to-br from-surface-container-high/60 to-surface-container-lowest/80 backdrop-blur-3xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h3 className="text-xl font-extrabold text-primary mb-6 flex items-center gap-3">
              <Lock size={20} />
              Encryption Parameters
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-surface-container/50 border border-white/5 shadow-lg">
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Algorithm</span>
                <span className="text-xs font-black text-primary-fixed-dim uppercase tracking-widest">AES-256 GCM</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-surface-container/50 border border-white/5 shadow-lg">
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Storage Node</span>
                <span className="text-xs font-black text-primary-fixed-dim uppercase tracking-widest">Svalbard-12</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-surface-container/50 border border-white/5 shadow-lg">
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Auto-Destruct</span>
                <span className="text-xs font-black text-error uppercase tracking-widest animate-pulse">Disabled</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low/40 backdrop-blur-3xl p-1 rounded-3xl overflow-hidden h-40 sm:h-48 relative shadow-2xl border border-white/10 group">
            <img 
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" 
              alt="Entropy" 
              className="w-full h-full object-cover rounded-[1.4rem] opacity-40 transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
              <p className="text-[10px] font-black text-primary-fixed-dim uppercase tracking-[0.2em] mb-1">Real-time Entropy</p>
              <p className="text-base sm:text-lg font-bold text-on-surface leading-tight">System Seed Verified</p>
            </div>
          </div>

          <div className="bg-surface-container-low/40 backdrop-blur-3xl p-6 sm:p-8 rounded-3xl border-l-4 border-secondary shadow-2xl border-y border-r border-white/10">
            <div className="flex items-center gap-4 sm:gap-5 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-secondary-container/20 flex items-center justify-center border border-secondary/30 sm:h-14 sm:w-14">
                <Users size={28} className="text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Shared Access</h3>
                <p className="text-xs font-medium text-on-surface-variant">0 trusted nodes linked</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/keys')}
              className="w-full py-4 rounded-2xl bg-surface-variant/40 border border-white/5 font-black text-xs uppercase tracking-widest text-on-surface hover:bg-surface-variant/60 transition-all flex items-center justify-center gap-3"
            >
              <Rocket size={18} />
              Authorize Access Key
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
