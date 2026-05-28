import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EncryptionService } from '../lib/encryption';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useToast } from '../context/ToastContext';
import RichTextEditor from '../components/RichTextEditor';
import CryptoJS from 'crypto-js';
import { 
  Shield, 
  Lock, 
  FileText, 
  Bold, 
  Paperclip, 
  Code, 
  Rocket, 
  ChevronLeft,
  Database
} from 'lucide-react';

export default function EditEntry() {
  const { id } = useParams();
  const { user, vaultKey } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Personal');
  const [securityLevel, setSecurityLevel] = useState('Tier-3');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buttonText, setButtonText] = useState('Encrypt & Save');

  const [titleTouched, setTitleTouched] = useState(false);
  const [contentTouched, setContentTouched] = useState(false);

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
          
          if (vaultKey && data.salt && data.iv) {
            const t = EncryptionService.decrypt(data.titleEncrypted, vaultKey, data.salt, data.iv);
            const c = EncryptionService.decrypt(data.contentEncrypted, vaultKey, data.salt, data.iv);
            const cat = EncryptionService.decrypt(data.categoryEncrypted, vaultKey, data.salt, data.iv);
            const sec = EncryptionService.decrypt(data.securityLevelEncrypted, vaultKey, data.salt, data.iv);
            setTitle(t || '');
            setContent(c || '');
            setCategory(cat || 'Personal');
            setSecurityLevel(sec || 'Tier-3');
            
            if (!t || !c) {
              showToast('Integrity check failed. Check your Master key.', 'error');
            }
          }
        } else {
          showToast('Entry not found.', 'error');
          navigate('/dashboard');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `entries/${id}`);
      } finally {
        setLoading(false);
      }
    }
    void fetchEntry();
  }, [id, user, navigate, vaultKey]);

  const handleSave = async () => {
    if (!user || !vaultKey || !id) return;
    if (!title.trim() || !content.trim()) {
      setTitleTouched(true);
      setContentTouched(true);
      showToast('Fields cannot be empty.', 'error');
      return;
    }

    setSaving(true);
    
    // Scramble Animation
    let count = 0;
    const chars = '01#X$%&*@?';
    const interval = setInterval(() => {
      let scrambled = '';
      for (let i = 0; i < 14; i++) {
        scrambled += chars[Math.floor(Math.random() * chars.length)];
      }
      setButtonText(scrambled);
      count++;
    }, 70);

    // Let animation play for 900ms
    await new Promise((resolve) => setTimeout(resolve, 900));
    clearInterval(interval);
    setButtonText('ENCRYPTING...');
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const salt = EncryptionService.generateSalt();
      const iv = EncryptionService.generateIv();
      const titleEncrypted = EncryptionService.encrypt(title, vaultKey, salt, iv);
      const contentEncrypted = EncryptionService.encrypt(content, vaultKey, salt, iv);
      const categoryEncrypted = EncryptionService.encrypt(category, vaultKey, salt, iv);
      const securityLevelEncrypted = EncryptionService.encrypt(securityLevel, vaultKey, salt, iv);
      
      const saltHex = salt.toString(CryptoJS.enc.Hex);
      const ivHex = iv.toString(CryptoJS.enc.Hex);

      const docRef = doc(db, 'entries', id);
      await updateDoc(docRef, {
        titleEncrypted,
        contentEncrypted,
        categoryEncrypted,
        securityLevelEncrypted,
        salt: saltHex,
        iv: ivHex,
        updatedAt: serverTimestamp(),
      });

      // Log success
      await addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        userEmail: user.email,
        action: 'Updated Entry',
        resource: `/diary/private/${id}`,
        timestamp: serverTimestamp(),
        status: 'ENCRYPTED'
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, 'activityLogs');
      });

      showToast('Changes encrypted and vault updated.', 'success');
      navigate(`/entry/${id}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to update entry. Encryption engine reported an error.', 'error');
      setButtonText('Encrypt & Save');
    } finally {
      setSaving(false);
    }
  };

  if (!vaultKey) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="glass-panel border-red-500/20 bg-red-500/5 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Lock size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Vault Access Key Required</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your encryption signature is not present. Re-unlock the vault on the dashboard first.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-background font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_rgba(6,182,212,0.2)]"
          >
            Go to Unlock
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4 text-primary-fixed-dim animate-pulse">
        <div className="w-12 h-12 border-4 border-primary-fixed-dim border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-sm tracking-[0.3em]">RETRIVING VAULT DATA...</p>
      </div>
    );
  }

  return (
    <div className="max-w-container-max-width mx-auto p-4 md:p-margin-lg space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-4">
          <button
            onClick={() => navigate(`/entry/${id}`)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest"
          >
            <ChevronLeft size={16} />
            Cancel and Return
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-on-surface leading-tight">
            Modify Secure<br/>
            <span className="text-primary-fixed-dim drop-shadow-[0_0_15px_rgba(0,218,243,0.4)]">Journal Entry</span>
          </h1>
        </div>

        {/* Security Indicator Widget */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-6 shadow-2xl">
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Key Status</p>
            <p className="text-lg font-bold text-on-surface leading-none">AES-256 Verified</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Text Editor Section */}
        <section className="lg:col-span-8 relative">
          <div className="glass-panel rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-3">
                <div className="h-3 w-3 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]"></div>
                <div className="h-3 w-3 rounded-full bg-secondary shadow-[0_0_8px_#d1bcff]"></div>
                <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_#00daf3]"></div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-4 bg-surface-container-high rounded-xl px-4 py-2 border border-white/5">
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
                    className="w-48 bg-transparent border-none outline-none text-sm font-bold text-on-surface uppercase tracking-[0.18em] placeholder:text-on-surface-variant/40"
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

            <div className="flex flex-col md:flex-row justify-between items-center mt-10 gap-6">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00daf3]"></span>
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Quantum Security Seal active</span>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  type="button"
                  onClick={() => navigate(`/entry/${id}`)}
                  className="flex-1 md:flex-initial px-8 py-3 rounded-xl border border-white/10 font-bold text-sm text-on-surface hover:bg-white/5 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 md:flex-initial px-10 py-3 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-background font-black text-sm shadow-[0_10px_20px_rgba(0,229,255,0.2)] hover:shadow-[0_15px_30px_rgba(0,229,255,0.4)] hover:scale-[1.03] active:scale-95 transition-all transform uppercase tracking-widest disabled:opacity-50"
                >
                  {buttonText}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-gradient-to-br from-surface-container-high/60 to-surface-container-lowest/80 backdrop-blur-3xl p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h3 className="text-xl font-extrabold text-primary mb-6 flex items-center gap-3">
              <Lock size={20} />
              Metadata Settings
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/10 bg-surface-container/40 text-on-surface outline-none cursor-pointer"
                >
                  <option value="Personal" className="bg-surface-container text-on-surface">Personal</option>
                  <option value="Work" className="bg-surface-container text-on-surface">Work</option>
                  <option value="Ideas" className="bg-surface-container text-on-surface">Ideas</option>
                  <option value="Finance" className="bg-surface-container text-on-surface">Finance</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Security Level</label>
                <select
                  value={securityLevel}
                  onChange={(e) => setSecurityLevel(e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/10 bg-surface-container/40 text-on-surface outline-none cursor-pointer"
                >
                  <option value="Tier-1" className="bg-surface-container text-on-surface">Tier-1 (Base)</option>
                  <option value="Tier-2" className="bg-surface-container text-on-surface">Tier-2 (Hardened)</option>
                  <option value="Tier-3" className="bg-surface-container text-on-surface">Tier-3 (Military-Grade)</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
