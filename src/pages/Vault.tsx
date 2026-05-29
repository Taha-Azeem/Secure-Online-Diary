import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EncryptionService } from '../lib/encryption';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  FileText, 
  Trash2, 
  Edit3, 
  Lock, 
  Unlock, 
  Calendar, 
  Tag, 
  ShieldAlert, 
  ArrowRight,
  Plus
} from 'lucide-react';

type VaultEntry = {
  id: string;
  titleEncrypted: string;
  contentEncrypted: string;
  categoryEncrypted?: string;
  securityLevelEncrypted?: string;
  salt: string;
  iv: string;
  category?: string;
  securityLevel?: string;
  createdAt?: any;
  updatedAt?: any;
  _fallback?: boolean;
};

export default function Vault() {
  const { user, vaultKey } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (!user) return;

    // Helper: load local fallback entries and merge with provided list
    const loadLocalEntries = (existing: VaultEntry[] = []) => {
      try {
        const raw = window.localStorage.getItem('localEntries');
        if (!raw) return existing;
        const local = JSON.parse(raw) as any[];
        const userLocal = local.filter(e => e.ownerId === user.uid);
        const mapped: VaultEntry[] = userLocal.map((e, idx) => ({
          id: `local-${idx}-${e.updatedAt}`,
          titleEncrypted: e.titleEncrypted,
          contentEncrypted: e.contentEncrypted,
          categoryEncrypted: e.categoryEncrypted,
          securityLevelEncrypted: e.securityLevelEncrypted,
          salt: e.salt,
          iv: e.iv,
          createdAt: { toDate: () => new Date(e.createdAt) },
          updatedAt: { toDate: () => new Date(e.updatedAt) },
          _fallback: true
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

    const q = query(
      collection(db, 'entries'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as VaultEntry[];
        setEntries(loadLocalEntries(list));
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.GET, 'entries');
        setEntries(loadLocalEntries([]));
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Decrypt and process entries
  const processedEntries = useMemo(() => {
    if (!vaultKey) return [];
    
    return entries.map((entry) => {
      let decryptedTitle = 'Encrypted Payload';
      let decryptedContent = '';
      let decryptedCategory = 'Personal';
      let decryptedSecurityLevel = 'Tier-3';
      let isDecryptionSuccess = false;

      if (entry.titleEncrypted && entry.salt && entry.iv) {
        const decrypted = EncryptionService.decrypt(
          entry.titleEncrypted,
          vaultKey,
          entry.salt,
          entry.iv
        );
        if (decrypted) {
          decryptedTitle = decrypted;
          isDecryptionSuccess = true;
        }
      }

      if (entry.contentEncrypted && entry.salt && entry.iv) {
        const decrypted = EncryptionService.decrypt(
          entry.contentEncrypted,
          vaultKey,
          entry.salt,
          entry.iv
        );
        if (decrypted) {
          decryptedContent = decrypted;
        }
      }

      if (entry.categoryEncrypted && entry.salt && entry.iv) {
        const decrypted = EncryptionService.decrypt(
          entry.categoryEncrypted,
          vaultKey,
          entry.salt,
          entry.iv
        );
        if (decrypted) {
          decryptedCategory = decrypted;
        }
      }

      if (entry.securityLevelEncrypted && entry.salt && entry.iv) {
        const decrypted = EncryptionService.decrypt(
          entry.securityLevelEncrypted,
          vaultKey,
          entry.salt,
          entry.iv
        );
        if (decrypted) {
          decryptedSecurityLevel = decrypted;
        }
      }

      return {
        ...entry,
        decryptedTitle,
        decryptedContent,
        decryptedCategory,
        decryptedSecurityLevel,
        isDecryptionSuccess,
      };
    });
  }, [entries, vaultKey]);


  // Filter entries by search query and category
  const filteredEntries = useMemo(() => {
    return processedEntries.filter((entry) => {
      const matchesSearch = entry.decryptedTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
        entry.decryptedContent.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || entry.decryptedCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [processedEntries, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const list = new Set<string>();
    processedEntries.forEach((e) => {
      if (e.decryptedCategory) list.add(e.decryptedCategory);
    });
    return ['All', ...Array.from(list)];
  }, [processedEntries]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this diary entry?')) return;

    try {
      await deleteDoc(doc(db, 'entries', id));
      await addDoc(collection(db, 'activityLogs'), {
        userId: user?.uid,
        userEmail: user?.email,
        action: 'Purged Record',
        resource: `/diary/private/${id}`,
        timestamp: serverTimestamp(),
        status: 'DELETED',
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'activityLogs');
      });

      showToast('Entry deleted and purged successfully.', 'success');
    } catch (err) {
      showToast('Failed to delete entry.', 'error');
    }
  };

  if (!vaultKey) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="glass-panel border-red-500/20 bg-red-500/5 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Lock size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Vault Interface Locked</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your encryption credentials are not loaded in this session. Return to the dashboard to unlock your secure thought-streams.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-background font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_rgba(6,182,212,0.2)]"
          >
            Unlock Vault
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="mx-auto max-w-container-max-width px-4 py-6 md:px-margin-lg md:py-8 space-y-8 overflow-x-hidden">
      {/* Header section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 border border-primary-container/40 text-primary-fixed-dim whitespace-nowrap">
            <Unlock size={14} className="text-[#06b6d4]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Vault Decrypted & Ready</span>
          </div>
          <h1 className="cyan-glow-text text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl md:text-[40px]">My Secure Vault</h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Browse, search, and manage your private zero-knowledge encrypted thoughts.
          </p>
        </div>
        <button
          onClick={() => navigate('/entry/new')}
          className="flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-background font-black text-sm uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-[0_10px_20px_rgba(6,182,212,0.25)] sm:w-auto"
        >
          <Plus size={18} />
          New Entry
        </button>
      </header>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input
            type="text"
            placeholder="Search within decrypted diaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface outline-none focus:ring-2 focus:ring-primary-container/60 transition-all font-medium placeholder:text-on-surface-variant/40"
          />
        </div>
        
        {/* Category filter */}
        <div className="md:col-span-4 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={18} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-12 pr-8 py-3 sm:py-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface outline-none focus:ring-2 focus:ring-primary-container/60 transition-all font-medium appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-surface-container-lowest text-on-surface">
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-on-surface-variant pointer-events-none" />
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 min-h-48 space-y-4 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-white/10 rounded-full w-2/3" />
                <div className="h-3 bg-white/10 rounded-full w-full" />
                <div className="h-3 bg-white/10 rounded-full w-5/6" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-5 bg-white/10 rounded-full w-1/4" />
                <div className="h-8 w-8 bg-white/10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 sm:p-16 text-center flex flex-col items-center gap-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-white/5 flex items-center justify-center text-on-surface-variant opacity-40">
            <FileText size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">No Records Found</h3>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
              {entries.length === 0 
                ? 'Your secure diary database is empty. Click New Entry above to record your first stream.' 
                : 'No entries match your query or category selection.'}
            </p>
          </div>
          {entries.length === 0 && (
            <button
              onClick={() => navigate('/entry/new')}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all"
            >
              Create First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => navigate(`/entry/${entry.id}`)}
            className="group relative flex min-h-48 flex-col justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-[#06b6d4]/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.18)] cursor-pointer"
          >
              {/* Card top */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 flex-1 truncate font-bold text-base text-white transition-colors leading-tight group-hover:text-[#06b6d4] sm:text-lg">
                    {entry.decryptedTitle}
                  </h3>
                  <span className="shrink-0 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                    {entry.decryptedSecurityLevel || 'Tier-3'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium line-clamp-3 leading-relaxed">
                  {entry.decryptedContent || 'Empty secure payload or decryption pending...'}
                </p>
              </div>

              {/* Card bottom */}
              <div className="flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-[#8b5cf6]" />
                    {entry.createdAt ? format(entry.createdAt.toDate(), 'MMM d') : 'N/A'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Tag size={12} className="text-[#8b5cf6]" />
                    {entry.decryptedCategory || 'Personal'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/entry/${entry.id}/edit`);
                    }}
                    className="p-2 text-on-surface-variant hover:text-[#06b6d4] hover:bg-white/5 rounded-lg active:scale-90 transition-all"
                    title="Edit entry"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, entry.id)}
                    className="p-2 text-on-surface-variant hover:text-red-400 hover:bg-white/5 rounded-lg active:scale-90 transition-all"
                    title="Delete entry"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
