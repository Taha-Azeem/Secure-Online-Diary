import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { db } from '../lib/firebase';
import { EncryptionService } from '../lib/encryption';
import CryptoJS from 'crypto-js';
import { useToast } from '../context/ToastContext';
import {
  Key,
  ShieldCheck,
  FileText,
  MoreVertical,
  Plus,
  TrendingUp,
  Brain,
  Lock,
  AlertOctagon,
  Activity,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';

type EntryPreview = {
  id: string;
  createdAt?: any;
  updatedAt?: any;
  titleEncrypted?: string;
  iv?: string;
  salt?: string;
};

type ActivityLog = {
  id: string;
  action: string;
  resource: string;
  timestamp: any;
  status: string;
};

export default function Dashboard() {
  const { user, profile, vaultKey, setVaultKey, updateProfile } = useAuth();
  const [entries, setEntries] = useState<EntryPreview[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [encryptedToday, setEncryptedToday] = useState(0);
  const [hasCriticalAlert, setHasCriticalAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Master Key modal state
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [modalTab, setModalTab] = useState<'unlock' | 'initialize'>('unlock');
  const [modalError, setModalError] = useState('');

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  useEffect(() => {
    if (!user) return;
    // Helper: load local fallback entries and merge with provided list
    const loadLocalEntries = (existing: EntryPreview[] = []) => {
      try {
        const raw = window.localStorage.getItem('localEntries');
        if (!raw) return existing;
        const local = JSON.parse(raw) as any[];
        const userLocal = local.filter(e => e.ownerId === user.uid);
        const mapped: EntryPreview[] = userLocal.map((e, idx) => ({
          id: `local-${idx}-${e.updatedAt}`,
          createdAt: { toDate: () => new Date(e.createdAt) },
          updatedAt: { toDate: () => new Date(e.updatedAt) },
          titleEncrypted: e.titleEncrypted,
          iv: e.iv,
          salt: e.salt
        }));

        // Merge: prefer remote entries (by id) and append any local ones that don't match
        const remoteIds = new Set(existing.map(ent => ent.id));
        const merged = [...existing];
        for (const loc of mapped) {
          if (!remoteIds.has(loc.id)) merged.unshift(loc);
        }
        return merged;
      } catch (e) {
        console.warn('Failed to load local fallback entries:', e);
        return existing;
      }
    };

    // Listen to recent entries
    const qEntries = query(
      collection(db, 'entries'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeEntries = onSnapshot(qEntries, (snapshot) => {
      const entryList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as EntryPreview[];

      const merged = loadLocalEntries(entryList);
      setEntries(merged);

      // Calculate entries encrypted today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const count = merged.filter(e => {
        const date = e.createdAt?.toDate ? e.createdAt.toDate() : new Date();
        return date >= startOfToday;
      }).length;
      setEncryptedToday(count);

      setLoading(false);
    }, (err) => {
      setLoading(false);
      handleFirestoreError(err, OperationType.GET, 'entries');
      // On error, show any local fallback entries
      const fallback = loadLocalEntries([]);
      if (fallback.length > 0) setEntries(fallback);
    });

    // Listen to recent activity logs
    const qLogs = query(
      collection(db, 'activityLogs'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      setActivityLogs(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[]);
    });

    // Listen to notifications unread count
    const qNotifs = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('status', '==', 'unread')
    );

    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    // Check critical alerts in past 24h
    const checkAlerts = async () => {
      const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      try {
        const qAlerts = query(
          collection(db, 'securityLogs'),
          where('severity', '==', 'CRITICAL'),
          where('timestamp', '>=', past24h)
        );
        const snap = await getDocs(qAlerts);
        setHasCriticalAlert(!snap.empty);
      } catch (e) {
        console.error(e);
      }
    };
    void checkAlerts();

    return () => {
      unsubscribeEntries();
      unsubscribeLogs();
      unsubscribeNotifs();
    };
  }, [user]);

  // Set modalTab to initialize if profile has no verifier payload
  useEffect(() => {
    if (profile && !profile.verifierPayload) {
      setModalTab('initialize');
    }
  }, [profile]);

  // Automatic sync of local fallback entries to Firestore
  useEffect(() => {
    if (!user || !vaultKey) return;

    const syncLocalEntries = async () => {
      try {
        const raw = window.localStorage.getItem('localEntries');
        if (!raw) return;
        const local = JSON.parse(raw) as any[];
        const userLocal = local.filter(e => e.ownerId === user.uid && e._fallback);
        if (userLocal.length === 0) return;

        console.info(`Found ${userLocal.length} offline/fallback entries to sync.`);
        
        let syncedCount = 0;
        const remaining: any[] = [];

        for (const entry of local) {
          if (entry.ownerId === user.uid && entry._fallback) {
            try {
              await addDoc(collection(db, 'entries'), {
                ownerId: entry.ownerId,
                titleEncrypted: entry.titleEncrypted,
                contentEncrypted: entry.contentEncrypted,
                categoryEncrypted: entry.categoryEncrypted,
                securityLevelEncrypted: entry.securityLevelEncrypted,
                salt: entry.salt,
                iv: entry.iv,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              syncedCount++;
            } catch (err) {
              console.warn('Failed to sync entry, keeping locally:', err);
              remaining.push(entry);
            }
          } else {
            remaining.push(entry);
          }
        }

        if (syncedCount > 0) {
          window.localStorage.setItem('localEntries', JSON.stringify(remaining));
          showToast(`Successfully synced ${syncedCount} offline entry/entries to your cloud vault!`, 'success');
        }
      } catch (err) {
        console.warn('Sync local entries error:', err);
      }
    };

    void syncLocalEntries();
  }, [user, vaultKey]);

  const writeLazyVerifier = async (keyPhrase: string) => {
    try {
      const verifierSalt = EncryptionService.generateSalt();
      const verifierIv = EncryptionService.generateIv();
      const verifierPayload = EncryptionService.encrypt(
        'vault_signature_verification',
        keyPhrase,
        verifierSalt,
        verifierIv
      );
      
      await updateProfile({
        verifierPayload,
        verifierSalt: verifierSalt.toString(CryptoJS.enc.Hex),
        verifierIv: verifierIv.toString(CryptoJS.enc.Hex)
      });
      console.info('Lazily wrote vault verifier signature to user profile.');
    } catch (e) {
      console.error('Failed to write lazy verifier:', e);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setModalError('Passphrase cannot be empty.');
      return;
    }

    if (profile?.verifierPayload && profile?.verifierSalt && profile?.verifierIv) {
      try {
        const decrypted = EncryptionService.decrypt(
          profile.verifierPayload,
          passphrase.trim(),
          profile.verifierSalt,
          profile.verifierIv
        );
        
        if (decrypted === 'vault_signature_verification') {
          setVaultKey(passphrase.trim());
          setPassphrase('');
          setModalError('');
          showToast('Vault unlocked successfully!', 'success');
        } else {
          setModalError('Passphrase signature verification failed. Please try again.');
        }
      } catch (err) {
        console.error('Unlock verification error:', err);
        setModalError('Verification failed. Encryption key derivation error.');
      }
    } else {
      // Legacy/Google user fallback if no verifier payload exists yet:
      try {
        if (entries.length > 0) {
          const testEntry = entries.find(ent => ent.titleEncrypted && ent.salt && ent.iv);
          if (testEntry) {
            const decrypted = EncryptionService.decrypt(
              testEntry.titleEncrypted,
              passphrase.trim(),
              testEntry.salt,
              testEntry.iv
            );
            if (decrypted) {
              setVaultKey(passphrase.trim());
              await writeLazyVerifier(passphrase.trim());
              setPassphrase('');
              setModalError('');
              showToast('Vault unlocked and signature initialized!', 'success');
              return;
            } else {
              setModalError('Passphrase is incorrect. Cannot decrypt existing entries.');
              return;
            }
          }
        }
        
        setVaultKey(passphrase.trim());
        await writeLazyVerifier(passphrase.trim());
        setPassphrase('');
        setModalError('');
        showToast('Vault unlocked and signature initialized!', 'success');
      } catch (err) {
        console.error('Lazy verifier write failed:', err);
        setModalError('Failed to initialize vault signature.');
      }
    }
  };

  const handleInitializeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length < 8) {
      setModalError('Passphrase must be at least 8 characters long.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setModalError('Passphrases do not match.');
      return;
    }
    
    try {
      setVaultKey(passphrase);
      await writeLazyVerifier(passphrase);
      setPassphrase('');
      setConfirmPassphrase('');
      setModalError('');
      showToast('Vault initialized and secured successfully!', 'success');
    } catch (err) {
      console.error('Failed to initialize vault:', err);
      setModalError('Failed to initialize vault. Please try again.');
    }
  };

  return (
    <div className="max-w-container-max-width mx-auto p-4 md:p-margin-lg space-y-layer-gap relative">
      {/* Master Key non-dismissible Modal */}
      {!vaultKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-surface-container-low border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 shadow-[0_0_20px_rgba(0,218,243,0.3)]">
                <Lock size={32} className="text-primary-fixed-dim" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Vault Access Verification</h2>
              <p className="text-sm text-on-surface-variant">Enter or create your master local encryption key.</p>
            </div>

            {/* Modal Tabs */}
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

                {/* Strength Meter */}
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

      {/* Main Dashboard UI */}
      <section className="flex flex-col md:flex-row items-center gap-8 py-8 px-8 bg-surface-container-low/40 backdrop-blur-2xl border border-white/10 rounded-3xl relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.01]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim/5 blur-[100px] rounded-full" />
        <div className="flex-1 space-y-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface leading-tight">
            Welcome back, <span className="text-primary-fixed-dim">{profile?.displayName || 'Chief Officer'}.</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Your neural vault is synchronized and encrypted with AES-256 military standards. Private content remains hidden until you choose to decrypt it.
          </p>
          <div className="flex gap-4">
            <span className="px-4 py-1.5 rounded-full bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 text-primary-fixed-dim text-xs font-black uppercase tracking-widest leading-none">Zero-Knowledge</span>
            <span className="px-4 py-1.5 rounded-full bg-secondary-container/20 border border-secondary/30 text-secondary text-xs font-black uppercase tracking-widest leading-none">
              {vaultKey ? 'Decrypt Ready' : 'Cipher Mode'}
            </span>
          </div>
        </div>
        <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center relative z-10">
          <Brain size={180} className="text-primary-fixed-dim drop-shadow-[0_0_25px_rgba(0,218,243,0.6)] opacity-80" />
        </div>
      </section>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stat 1: Total Entries */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-48 shadow-xl transform transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim/10 flex items-center justify-center border border-primary-fixed-dim/20">
              <FileText className="text-primary-fixed-dim" size={24} />
            </div>
            <span className="text-primary-fixed-dim font-bold text-xs uppercase tracking-widest">Active</span>
          </div>
          <div>
            <div className="text-on-surface-variant font-black text-xs uppercase tracking-widest">Total Entries</div>
            <div className="text-4xl font-extrabold text-on-surface">{entries.length}</div>
          </div>
        </div>

        {/* Stat 2: Encrypted Today */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-48 shadow-xl transform transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center border border-secondary/20">
              <Key className="text-secondary" size={24} />
            </div>
            <span className="text-secondary font-bold text-xs uppercase tracking-widest">Today</span>
          </div>
          <div>
            <div className="text-on-surface-variant font-black text-xs uppercase tracking-widest">Encrypted Today</div>
            <div className="text-4xl font-extrabold text-on-surface">{encryptedToday}</div>
          </div>
        </div>

        {/* Stat 3: Trust Score */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-48 shadow-xl transform transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <ShieldCheck className="text-green-500" size={24} />
            </div>
            <span className="text-green-500 font-bold text-xs uppercase tracking-widest">Secure</span>
          </div>
          <div>
            <div className="text-on-surface-variant font-black text-xs uppercase tracking-widest">Security Score</div>
            <div className="text-4xl font-extrabold text-on-surface">100%</div>
          </div>
        </div>

        {/* Stat 4: Unread Notifications */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-48 shadow-xl transform transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Bell className="text-amber-500" size={24} />
            </div>
            <span className={unreadCount > 0 ? "text-error font-bold text-xs uppercase tracking-widest animate-pulse" : "text-on-surface-variant font-bold text-xs uppercase tracking-widest"}>
              {unreadCount > 0 ? 'Action Required' : 'Clean'}
            </span>
          </div>
          <div>
            <div className="text-on-surface-variant font-black text-xs uppercase tracking-widest">Alerts & Notifs</div>
            <div className="text-4xl font-extrabold text-on-surface">{unreadCount}</div>
          </div>
        </div>
      </div>

      {/* Main Area: Recent Entries & Sidebar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-2xl font-bold">Recent Secure Entries</h2>
            <Link to="/vault" className="text-primary-fixed-dim hover:underline font-bold text-sm">View Vault</Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center p-20 text-on-surface-variant animate-pulse font-mono uppercase tracking-[0.2em] text-sm">
                STREAMING ENCRYPTED METADATA...
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-surface-container-low/20 border-2 border-dashed border-white/5 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
                <Lock size={48} className="text-on-surface-variant opacity-20" />
                <p className="text-on-surface-variant font-medium">Vault is currently empty. Record your first thought-stream.</p>
                <button
                  onClick={() => navigate('/entry/new')}
                  className="mt-2 px-6 py-2 bg-primary-fixed-dim/10 text-primary-fixed-dim border border-primary-fixed-dim/20 rounded-xl hover:bg-primary-fixed-dim/20 transition-all font-bold"
                >
                  Create New Entry
                </button>
              </div>
            ) : (
              entries.map((entry) => {
                const decryptedTitle = vaultKey && entry.titleEncrypted && entry.salt && entry.iv
                  ? EncryptionService.decrypt(entry.titleEncrypted, vaultKey, entry.salt, entry.iv)
                  : '';
                const titleText = decryptedTitle || 'Encrypted Entry payload';

                return (
                  <div
                    key={entry.id}
                    onClick={() => navigate(`/entry/${entry.id}`)}
                    className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex items-center gap-6 group hover:cursor-pointer hover:border-primary-fixed-dim/30 transform transition-all hover:scale-[1.02]"
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-container flex items-center justify-center p-1 border border-primary-fixed-dim/10">
                      <div className="w-full h-full rounded-xl bg-surface-container-highest flex items-center justify-center">
                        <FileText className="text-primary-fixed-dim" size={24} />
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-mono text-sm font-bold text-primary-fixed-dim/90 transition-colors group-hover:text-primary-fixed-dim truncate">
                        {titleText}
                      </h4>
                      <p className="mt-2 text-on-surface-variant text-sm font-medium">
                        Content Preview: <span className="font-mono text-xs opacity-60">••••••••</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20 leading-none">Encrypted</span>
                      <button type="button" className="p-2 hover:bg-surface-variant/40 rounded-full transition-colors">
                        <MoreVertical size={20} className="text-on-surface-variant" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar Info: Security Status, Quick Actions, Activity Feed */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold px-2">Integrity Command</h2>

          {/* Security Status Widget */}
          <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">System Guard</span>
              <span className="text-green-500 font-bold text-xs uppercase tracking-widest">Active</span>
            </div>
            
            {hasCriticalAlert ? (
              <div className="flex gap-3 rounded-2xl border border-error/50 bg-error/10 p-4 text-sm font-bold text-error">
                <AlertOctagon size={24} className="shrink-0" />
                <div>
                  <p className="leading-tight">CRITICAL ALERT ENGAGED</p>
                  <p className="text-xs font-normal opacity-80 mt-1">A critical security log was captured in the last 24h.</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm font-bold text-green-400">
                <CheckCircle size={24} className="shrink-0" />
                <div>
                  <p className="leading-tight">All Systems Secure ✓</p>
                  <p className="text-xs font-normal opacity-80 mt-1">Zero intrusion risks detected in the current node stream.</p>
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity size={18} className="text-primary-fixed-dim" />
              Activity Feed
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
              {activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <div key={log.id} className="border border-white/5 bg-surface-container-lowest/30 rounded-xl p-3 text-xs flex flex-col gap-1">
                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span className="font-mono text-[9px] opacity-60">
                        {log.timestamp ? format(log.timestamp.toDate(), 'HH:mm:ss') : 'Pending'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${log.status === 'DELETED' ? 'bg-error/15 text-error' : 'bg-primary-container/20 text-primary-fixed-dim'}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="font-semibold text-on-surface">{log.action}</p>
                    <p className="font-mono text-[9px] text-on-surface-variant truncate">Res: {log.resource}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant py-4 text-center">No recent activities logged.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/entry/new')}
        className="fixed right-8 bottom-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00daf3] to-[#7000ff] text-white shadow-[0_10px_30px_rgba(0,218,243,0.4)] flex items-center justify-center z-50 hover:scale-110 active:scale-90 transform transition-all group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
