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
import { useToast } from '../context/ToastContext';

type EntryRecord = Record<string, any> | null;

export default function ViewEntry() {
  const { id } = useParams();
  const { user, profile, vaultKey, setVaultKey } = useAuth();
  const { showToast } = useToast();
  const [entry, setEntry] = useState<EntryRecord>(null);
  const [decrypted, setDecrypted] = useState({ title: '', content: '', category: '', securityLevel: '' });
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [loading, setLoading] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [modalError, setModalError] = useState('');
  const navigate = useNavigate();

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

  useEffect(() => {
    async function fetchEntry() {
      if (!id || !user) return;
      const docRef = doc(db, 'entries', id);
      try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.ownerId !== user.uid) {
            navigate('/forbidden');
            return;
          }
          setEntry({ id: docSnap.id, ...data });
          if (vaultKey && data.salt && data.iv) {
            const t = EncryptionService.decrypt(data.titleEncrypted, vaultKey, data.salt, data.iv);
            const c = EncryptionService.decrypt(data.contentEncrypted, vaultKey, data.salt, data.iv);
            const cat = EncryptionService.decrypt(data.categoryEncrypted, vaultKey, data.salt, data.iv);
            const sec = EncryptionService.decrypt(data.securityLevelEncrypted, vaultKey, data.salt, data.iv);
            setDecrypted({
              title: t || 'Decryption Error',
              content: c || 'Failed to decrypt content with the current Master Access Key. Secure integrity check mismatch.',
              category: cat || 'Unknown',
              securityLevel: sec || 'Unknown'
            });
            if (t && c) {
              setIsDecrypted(true);
            }
          }
        } else {
          showToast('Entry not found in this vault.', 'error');
          navigate('/dashboard');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `entries/${id}`);
      }
      setLoading(false);
    }
    void fetchEntry();
  }, [id, user, navigate, vaultKey]);

  const encryptedTitle = useMemo(() => String(entry?.titleEncrypted || ''), [entry]);
  const encryptedContent = useMemo(() => String(entry?.contentEncrypted || ''), [entry]);
  const encryptedCategory = useMemo(() => String(entry?.categoryEncrypted || ''), [entry]);
  const encryptedSecurityLevel = useMemo(() => String(entry?.securityLevelEncrypted || ''), [entry]);

  const handleDecrypt = () => {
    if (!entry) return;
    if (!vaultKey) {
      navigate('/dashboard');
      return;
    }

    if (!entry.salt || !entry.iv) {
      setDecryptError('Decryption parameters (salt/IV) missing for this entry.');
      showToast('Decryption parameters missing.', 'error');
      setIsDecrypted(false);
      return;
    }

    const title = EncryptionService.decrypt(encryptedTitle, vaultKey, entry.salt, entry.iv);
    const content = EncryptionService.decrypt(encryptedContent, vaultKey, entry.salt, entry.iv);
    const category = EncryptionService.decrypt(encryptedCategory, vaultKey, entry.salt, entry.iv);
    const securityLevel = EncryptionService.decrypt(encryptedSecurityLevel, vaultKey, entry.salt, entry.iv);

    if (!title || !content) {
      setDecryptError('Failed to decrypt this entry with the current Master Access Key.');
      showToast('Failed to decrypt entry. Please check your Master Key.', 'error');
      setIsDecrypted(false);
      return;
    }

    setDecrypted({ title, content, category: category || 'Unknown', securityLevel: securityLevel || 'Unknown' });
    setDecryptError('');
    setIsDecrypted(true);
    showToast('Entry decrypted successfully.', 'success');
  };

  const handleDelete = async () => {
    if (!vaultKey) {
      showToast('Unlock your vault key first to delete entries.', 'error');
      return;
    }
    if (!id || !window.confirm('CRITICAL: Permanent record purge requested. Proceed?')) return;

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

      showToast('Entry deleted and purged from the vault.', 'success');
      navigate('/dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `entries/${id}`);
      showToast('Failed to delete entry.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 sm:p-20 flex flex-col items-center justify-center gap-4 text-primary-fixed-dim animate-pulse">
        <div className="w-12 h-12 border-4 border-primary-fixed-dim border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-sm tracking-[0.3em]">INITIALIZING DECRYPTION CHAIN...</p>
      </div>
    );
  }

  return (
    <div className="max-w-container-max-width mx-auto p-4 md:p-margin-lg overflow-x-hidden">
      {/* Vault Key Modal - non-dismissible if not set */}
      {!vaultKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-surface-container-low border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 shadow-[0_0_20px_rgba(0,218,243,0.3)]">
                <Lock size={32} className="text-primary-fixed-dim" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Vault Access Verification</h2>
              <p className="text-sm text-on-surface-variant">Unlock your vault key to view encrypted entries.</p>
            </div>

            {modalError && (
              <div className="flex items-center gap-3 rounded-xl border border-error/50 bg-error/10 p-4 text-xs font-bold text-error animate-pulse">
                <AlertOctagon size={16} />
                {modalError}
              </div>
            )}

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
          </div>
        </div>
      )}
      {vaultKey && (
        <>
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-8 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest"
      >
        <ChevronLeft size={20} />
        Return to Command Center
      </button>

      <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 items-start">
        <aside className="w-full lg:w-72 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 hidden h-32 w-32 bg-primary/5 blur-3xl -mr-16 -mt-16 lg:block" />

            <div className="relative z-10 flex items-center gap-4 sm:gap-5">
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
            <div className="absolute top-0 right-0 hidden h-96 w-96 bg-primary-container/10 blur-[120px] -mr-48 -mt-48 lg:block" />
            <div className="relative z-10 p-5 sm:p-8 md:p-16">
              <header className="mb-12">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <h1 className="break-words text-3xl font-black leading-tight text-on-surface select-none sm:text-4xl md:text-5xl">
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
                  <div className="bg-error/10 border border-error/30 p-6 sm:p-8 rounded-3xl flex flex-col items-center gap-4 text-center mt-12">
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
                  <div className={`rounded-[2rem] border p-5 sm:p-6 md:p-8 ${isDecrypted ? 'border-primary-fixed-dim/20 bg-surface-container-lowest/30' : 'border-white/8 bg-surface-container-lowest/70'}`}>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                      {isDecrypted ? 'Readable Entry View' : 'Ciphertext View'}
                    </p>
                    <div className={`${isDecrypted ? 'font-[var(--font-body)] text-xl text-on-surface-variant leading-relaxed rich-content-view' : 'font-[var(--font-mono)] text-sm text-primary-fixed-dim/90 leading-7 break-all whitespace-pre-wrap'}`}>
                      {isDecrypted ? (
                        <div dangerouslySetInnerHTML={{ __html: decrypted.content }} />
                      ) : (
                        <p>{encryptedContent || 'No encrypted payload found.'}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-16 flex flex-col md:flex-row items-start md:items-center justify-between border-t border-white/5 pt-10 gap-6 sm:gap-8">
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
        </>
      )}
    </div>
  );
}
