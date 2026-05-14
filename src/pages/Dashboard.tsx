import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { db } from '../lib/firebase';
import {
  Key,
  ShieldCheck,
  FileText,
  MoreVertical,
  Plus,
  TrendingUp,
  Brain,
  Lock,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';

type EntryPreview = {
  id: string;
  createdAt?: any;
  updatedAt?: any;
  titleEncrypted?: string;
};

export default function Dashboard() {
  const { user, profile, vaultKey, setVaultKey } = useAuth();
  const [entries, setEntries] = useState<EntryPreview[]>([]);
  const [stats, setStats] = useState({ total: 0, trustScore: 99.9 });
  const [loading, setLoading] = useState(true);
  const [tempKey, setUnlockKeyInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'entries'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entryList = snapshot.docs.map((entryDoc) => {
        const data = entryDoc.data();
        return {
          id: entryDoc.id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          titleEncrypted: String(data.titleEncrypted || ''),
        };
      });
      setEntries(entryList);
      setLoading(false);
    }, (err) => {
      setLoading(false);
      handleFirestoreError(err, OperationType.GET, 'entries');
    });

    getDocs(query(collection(db, 'entries'), where('ownerId', '==', user.uid)))
      .then((snap) => {
        setStats((prev) => ({ ...prev, total: snap.size }));
      })
      .catch((err) => {
        handleFirestoreError(err, OperationType.GET, 'entries');
      });

    return () => unsubscribe();
  }, [user]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempKey.trim()) return;
    setVaultKey(tempKey.trim());
    setUnlockKeyInput('');
  };

  return (
    <div className="max-w-container-max-width mx-auto p-4 md:p-margin-lg space-y-layer-gap">
      {!vaultKey ? (
        <section className="rounded-3xl border border-primary-fixed-dim/20 bg-surface-container-low/40 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 px-4 py-1.5">
                <Lock size={16} className="text-primary-fixed-dim" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-fixed-dim">Vault Locked</span>
              </div>
              <h2 className="text-2xl font-extrabold text-on-surface">Entries stay encrypted until you load your access key.</h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Your dashboard now stays visible in cipher mode. Only you can decrypt a record, and only after you load your master access key into this session.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setUnlockKeyInput(e.target.value)}
                placeholder="Enter your master access key"
                className="flex-1 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-4 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-container"
              />
              <button
                type="submit"
                className="rounded-2xl bg-gradient-to-r from-primary-fixed-dim to-secondary-container px-6 py-4 text-sm font-black uppercase tracking-widest text-background shadow-[0_10px_24px_rgba(0,218,243,0.25)] transition-all hover:-translate-y-0.5"
              >
                Load Decryption Key
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-secondary/20 bg-secondary-container/10 p-4 shadow-xl">
          <div className="flex items-center gap-3 text-sm font-bold text-secondary">
            <ShieldCheck size={18} />
            Local decryption key is loaded for this session. Open any entry and use the decrypt button when you want to reveal its contents.
          </div>
        </section>
      )}

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
            <span className="px-4 py-1.5 rounded-full bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 text-primary-fixed-dim text-xs font-black uppercase tracking-widest leading-none">Protocol V7.2</span>
            <span className="px-4 py-1.5 rounded-full bg-secondary-container/20 border border-secondary/30 text-secondary text-xs font-black uppercase tracking-widest leading-none">
              {vaultKey ? 'Decrypt Ready' : 'Cipher Mode'}
            </span>
          </div>
        </div>
        <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center relative z-10">
          <Brain size={180} className="text-primary-fixed-dim drop-shadow-[0_0_25px_rgba(0,218,243,0.6)] opacity-80" />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-surface-container-low/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-48 shadow-xl transform transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim/10 flex items-center justify-center border border-primary-fixed-dim/20">
              <Key className="text-primary-fixed-dim" size={24} />
            </div>
            <span className="text-primary-fixed-dim font-bold text-xs uppercase tracking-widest">+12%</span>
          </div>
          <div>
            <div className="text-on-surface-variant font-black text-xs uppercase tracking-widest">Vault Capacity</div>
            <div className="text-4xl font-extrabold text-on-surface">{stats.total} <span className="text-sm font-bold text-on-surface-variant">entries</span></div>
          </div>
        </div>

        <div className="md:col-span-1 bg-surface-container-low/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-48 shadow-xl transform transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center border border-secondary/20">
              <ShieldCheck className="text-secondary" size={24} />
            </div>
            <span className="text-secondary font-bold text-xs uppercase tracking-widest">Safe</span>
          </div>
          <div>
            <div className="text-on-surface-variant font-black text-xs uppercase tracking-widest">Trust Score</div>
            <div className="text-4xl font-extrabold text-on-surface">{stats.trustScore}<span className="text-xl">%</span></div>
          </div>
        </div>

        <div className="md:col-span-2 bg-surface-container-low/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden min-h-[12rem] shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Security Activity</h3>
            <select className="bg-surface-container-highest border-none text-xs font-bold rounded-lg focus:ring-primary-fixed-dim px-3 py-1 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-24 flex items-end gap-2 px-2 mt-8">
            <div className="flex-1 bg-primary-fixed-dim/20 h-[40%] rounded-t-sm border-t border-primary-fixed-dim/40 transition-all hover:bg-primary-fixed-dim/40" />
            <div className="flex-1 bg-primary-fixed-dim/40 h-[65%] rounded-t-sm border-t border-primary-fixed-dim/60 transition-all hover:bg-primary-fixed-dim/60" />
            <div className="flex-1 bg-primary-fixed-dim/20 h-[45%] rounded-t-sm border-t border-primary-fixed-dim/40 transition-all hover:bg-primary-fixed-dim/40" />
            <div className="flex-1 bg-primary-fixed-dim/80 h-[90%] rounded-t-sm border-t border-primary-fixed-dim shadow-[0_0_10px_rgba(0,218,243,0.3)] transform scale-110" />
            <div className="flex-1 bg-primary-fixed-dim/40 h-[60%] rounded-t-sm border-t border-primary-fixed-dim/60 transition-all hover:bg-primary-fixed-dim/60" />
            <div className="flex-1 bg-primary-fixed-dim/30 h-[50%] rounded-t-sm border-t border-primary-fixed-dim/50 transition-all hover:bg-primary-fixed-dim/50" />
            <div className="flex-1 bg-primary-fixed-dim/70 h-[85%] rounded-t-sm border-t border-primary-fixed-dim/90 transition-all hover:bg-primary-fixed-dim/100" />
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-2xl font-bold">Recent Secure Entries</h2>
            <Link to="/entries" className="text-primary-fixed-dim hover:underline font-bold text-sm">View Vault</Link>
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
                  onClick={() => navigate('/entries/new')}
                  className="mt-2 px-6 py-2 bg-primary-fixed-dim/10 text-primary-fixed-dim border border-primary-fixed-dim/20 rounded-xl hover:bg-primary-fixed-dim/20 transition-all font-bold"
                >
                  Create New Entry
                </button>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/entries/${entry.id}`)}
                  className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex items-center gap-6 group hover:cursor-pointer hover:border-primary-fixed-dim/30 transform transition-all hover:scale-[1.02]"
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-container flex items-center justify-center p-1 border border-primary-fixed-dim/10">
                    <div className="w-full h-full rounded-xl bg-surface-container-highest flex items-center justify-center">
                      <FileText className="text-primary-fixed-dim" size={24} />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-mono text-sm font-bold text-primary-fixed-dim/90 transition-colors group-hover:text-primary-fixed-dim break-all">
                      {(entry.titleEncrypted || 'Encrypted payload unavailable').slice(0, 72)}
                      {entry.titleEncrypted && entry.titleEncrypted.length > 72 ? '...' : ''}
                    </h4>
                    <p className="mt-2 text-on-surface-variant text-sm font-medium">
                      Encrypted preview only. Open the record to decrypt. Modified {format(entry.updatedAt?.toDate() || entry.createdAt?.toDate(), 'PPP p')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20 leading-none">Encrypted</span>
                    <button type="button" className="p-2 hover:bg-surface-variant/40 rounded-full transition-colors">
                      <MoreVertical size={20} className="text-on-surface-variant" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold px-2">System Integrity</h2>
          <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl space-y-6 shadow-2xl">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-1">
                <span className="text-on-surface-variant">Encryption Core</span>
                <span className="text-primary-fixed-dim">100% Active</span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container shadow-[0_0_15px_#00daf3]" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-1">
                <span className="text-on-surface-variant">Auth Handshake</span>
                <span className="text-secondary">{vaultKey ? 'Verified' : 'Awaiting Key'}</span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className={`h-full shadow-[0_0_15px_#d1bcff] ${vaultKey ? 'w-[85%] bg-secondary' : 'w-[28%] bg-secondary/40'}`} />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <h5 className="text-[10px] font-black uppercase text-on-surface-variant tracking-[0.2em] mb-4">Global Nodes</h5>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
                <span className="text-sm font-bold">Node 01: Singapore (Active)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
                <span className="text-sm font-bold">Node 02: Zurich (Active)</span>
              </div>
              <div className="flex items-center gap-3 opacity-40 grayscale">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-bold">Node 03: New York (Standby)</span>
              </div>
            </div>
            <button type="button" className="w-full bg-surface-variant/20 hover:bg-surface-variant/40 border border-white/5 py-3 rounded-xl transition-all font-black text-sm uppercase tracking-widest">
              Run System Audit
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#00daf3] to-[#7000ff] p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            <div className="relative z-10 text-white space-y-4">
              <TrendingUp className="opacity-80" size={32} />
              <h3 className="text-xl font-extrabold leading-tight">Upgrade to Quantum Guard</h3>
              <p className="text-sm font-medium opacity-90 leading-relaxed">Protect your data against quantum computer decryption with our new lattice-based encryption.</p>
              <button type="button" className="bg-white text-secondary-container font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                Explore Plans
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/entries/new')}
        className="fixed right-8 bottom-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00daf3] to-[#7000ff] text-white shadow-[0_10px_30px_rgba(0,218,243,0.4)] flex items-center justify-center z-50 hover:scale-110 active:scale-90 transform transition-all group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
