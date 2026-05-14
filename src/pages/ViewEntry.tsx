import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import {
  AlertOctagon,
  Calendar,
  ChevronLeft,
  Clock,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  MapPin,
  Printer,
  Share2,
  Trash2,
  Unlock,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EncryptionService } from '../lib/encryption';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

type EntryRecord = Record<string, any> | null;

export default function ViewEntry() {
  const { entryId } = useParams();
  const { user, profile, vaultKey } = useAuth();
  const [entry, setEntry] = useState<EntryRecord>(null);
  const [decrypted, setDecrypted] = useState({ title: '', content: '' });
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEntry() {
      if (!entryId || !user) return;
      const docRef = doc(db, 'entries', entryId);
      try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.ownerId !== user.uid) {
            navigate('/forbidden');
            return;
          }
          setEntry({ id: docSnap.id, ...data });
          if (vaultKey) {
            const t = EncryptionService.decrypt(data.titleEncrypted, vaultKey);
            const c = EncryptionService.decrypt(data.contentEncrypted, vaultKey);
            setDecrypted({
              title: t || 'Decryption Error',
              content: c || 'Failed to decrypt content with the current Master Access Key. Secure integrity check mismatch.',
            });
          }
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `entries/${entryId}`);
      }
      setLoading(false);
    }
    void fetchEntry();
  }, [entryId, user, navigate]);

  const encryptedTitle = useMemo(() => String(entry?.titleEncrypted || ''), [entry]);
  const encryptedContent = useMemo(() => String(entry?.contentEncrypted || ''), [entry]);

  const handleDecrypt = () => {
    if (!entry) return;
    if (!vaultKey) {
      navigate('/dashboard');
      return;
    }

    const title = EncryptionService.decrypt(encryptedTitle, vaultKey);
    const content = EncryptionService.decrypt(encryptedContent, vaultKey);

    if (!title || !content) {
      setDecryptError('Failed to decrypt this entry with the current Master Access Key.');
      setIsDecrypted(false);
      return;
    }

    setDecrypted({ title, content });
    setDecryptError('');
    setIsDecrypted(true);
  };

  const handleDelete = async () => {
    if (!entryId || !window.confirm('CRITICAL: Permanent record purge requested. Proceed?')) return;

    try {
      await deleteDoc(doc(db, 'entries', entryId));
      await addDoc(collection(db, 'activityLogs'), {
        userId: user?.uid,
        action: 'Purged Record',
        resource: `/diary/private/${entryId}`,
        timestamp: serverTimestamp(),
        status: 'DELETED',
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'activityLogs');
      });

      navigate('/dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `entries/${entryId}`);
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4 text-primary-fixed-dim animate-pulse">
        <div className="w-12 h-12 border-4 border-primary-fixed-dim border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-sm tracking-[0.3em]">INITIALIZING DECRYPTION CHAIN...</p>
      </div>
    );
  }

  return (
    <div className="max-w-container-max-width mx-auto p-4 md:p-margin-lg">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-8 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest"
      >
        <ChevronLeft size={20} />
        Return to Command Center
      </button>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <aside className="w-full lg:w-72 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />

            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(0,218,243,0.2)]">
                <Lock className="text-primary" size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Protocol Status</p>
                <p className="text-lg font-black text-primary leading-none tracking-tighter uppercase">{isDecrypted ? 'Decrypted' : 'Encrypted'}</p>
              </div>
            </div>

            <div className="h-px bg-white/5 relative z-10" />

            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <Calendar size={20} className="text-secondary opacity-60 mt-1" />
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Created</p>
                  <p className="text-sm font-bold text-on-surface leading-none">{entry?.createdAt ? format(entry.createdAt.toDate(), 'PPP') : 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock size={20} className="text-secondary opacity-60 mt-1" />
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Last Modified</p>
                  <p className="text-sm font-bold text-on-surface leading-none">{entry?.updatedAt ? format(entry.updatedAt.toDate(), 'p') : 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Fingerprint size={20} className="text-secondary opacity-60 mt-1" />
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Access Hash</p>
                  <p className="text-xs font-mono text-on-surface truncate w-32 opacity-70">0x{entry?.id?.slice(0, 12).toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 relative z-10">
              <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-secondary text-[10px] font-black uppercase tracking-widest border border-secondary/20">Owner Only</span>
              <span className="px-3 py-1 rounded-full bg-primary-container/20 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">AES-256</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={isDecrypted ? () => setIsDecrypted(false) : handleDecrypt}
              className="w-full bg-surface-container-high/40 hover:bg-surface-container-highest border border-white/5 py-4 rounded-2xl flex items-center justify-center gap-3 text-on-surface font-bold text-sm uppercase tracking-widest transition-all shadow-xl"
            >
              {isDecrypted ? <EyeOff size={18} /> : <Unlock size={18} />}
              {isDecrypted ? 'Hide Decrypted View' : 'Decrypt Entry'}
            </button>
            <button
              onClick={handleDelete}
              className="w-full bg-error/10 hover:bg-error/20 border border-error/20 py-4 rounded-2xl flex items-center justify-center gap-3 text-error font-bold text-sm uppercase tracking-widest transition-all shadow-xl"
            >
              <Trash2 size={18} />
              Purge Record
            </button>
          </div>
        </aside>

        <article className="flex-1 w-full">
          <div className="glass-panel rounded-3xl overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/10 blur-[120px] -mr-48 -mt-48" />
            <div className="p-8 md:p-16 relative z-10">
              <header className="mb-12">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <h1 className="text-4xl md:text-5xl font-black text-on-surface leading-tight select-none break-all">
                    {isDecrypted ? decrypted.title : encryptedTitle || 'ENCRYPTED HEADER'}
                  </h1>
                  <button
                    type="button"
                    onClick={isDecrypted ? () => setIsDecrypted(false) : handleDecrypt}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-primary-fixed-dim transition-all hover:bg-primary-fixed-dim/20"
                  >
                    {isDecrypted ? <EyeOff size={16} /> : <Eye size={16} />}
                    {isDecrypted ? 'Encrypted View' : 'Decrypt'}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-on-surface-variant font-bold text-xs uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <MapPin size={16} />
                    Orbital Station V
                  </span>
                  <span className="w-1.5 h-1.5 bg-outline-variant rounded-full opacity-30" />
                  <span className="opacity-70">Entry ID: #{entry?.id?.slice(-8).toUpperCase()}</span>
                </div>
              </header>

              <div className="max-w-none">
                {decryptError ? (
                  <div className="mb-8 rounded-2xl border border-error/30 bg-error/10 p-5 text-sm font-medium text-error">
                    {decryptError}
                  </div>
                ) : null}

                {!vaultKey ? (
                  <div className="bg-error/10 border border-error/30 p-8 rounded-3xl flex flex-col items-center gap-4 text-center mt-12">
                    <AlertOctagon size={48} className="text-error" />
                    <h4 className="text-lg font-bold text-error">VAULT LOCKED</h4>
                    <p className="text-sm opacity-80 max-w-sm">
                      This content is currently in its cipher-state. Re-authenticate with your Master Access Key to initialize the local decryption layer.
                    </p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="mt-4 px-8 py-3 bg-error text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform uppercase tracking-widest text-xs"
                    >
                      Initialize Unlock
                    </button>
                  </div>
                ) : (
                  <div className={`rounded-[2rem] border p-6 md:p-8 ${isDecrypted ? 'border-primary-fixed-dim/20 bg-surface-container-lowest/30' : 'border-white/8 bg-surface-container-lowest/70'}`}>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                      {isDecrypted ? 'Readable Entry View' : 'Ciphertext View'}
                    </p>
                    <div className={`${isDecrypted ? 'font-[var(--font-body)] text-xl text-on-surface-variant leading-relaxed space-y-8' : 'font-[var(--font-mono)] text-sm text-primary-fixed-dim/90 leading-7 break-all whitespace-pre-wrap'}`}>
                      {(isDecrypted ? decrypted.content : encryptedContent || 'No encrypted payload found.').split('\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-20 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-10 gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center">
                    <User className="text-on-surface-variant" size={24} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-on-surface leading-none mb-1">{profile?.displayName || 'Unknown Agent'}</p>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] leading-none">Security Clearance: Level 5</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" className="p-3 rounded-2xl bg-surface-container-high/60 border border-white/5 hover:bg-primary/10 hover:text-primary transition-all shadow-xl group">
                    <Share2 size={24} className="group-active:scale-90 transition-transform" />
                  </button>
                  <button type="button" className="p-3 rounded-2xl bg-surface-container-high/60 border border-white/5 hover:bg-primary/10 hover:text-primary transition-all shadow-xl group">
                    <Printer size={24} className="group-active:scale-90 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
