import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EncryptionService } from '../lib/encryption';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
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
  Users
} from 'lucide-react';

export default function NewEntry() {
  const { user, vaultKey } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();

  const injectSnippet = (prefix: string, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const selected = content.slice(start, end) || placeholder;
    const nextValue = `${content.slice(0, start)}${prefix}${selected}${suffix}${content.slice(end)}`;

    setContent(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleSeal = async () => {
    if (!user || !vaultKey || !title || !content) return;

    setLoading(true);
    try {
      const titleEncrypted = EncryptionService.encrypt(title, vaultKey);
      const contentEncrypted = EncryptionService.encrypt(content, vaultKey);

      await addDoc(collection(db, 'entries'), {
        ownerId: user.uid,
        titleEncrypted,
        contentEncrypted,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        category: 'Personal',
        securityLevel: 'Tier-3'
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, 'entries');
      });

      // Log success
      await addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        userEmail: user.email,
        action: 'Created Entry',
        resource: '/diary/private',
        timestamp: serverTimestamp(),
        status: 'ENCRYPTED'
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, 'activityLogs');
      });

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      // Main catch for the entire block if something throws elsewhere
      alert('Failed to seal entry. Encryption engine reported an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-container-max-width mx-auto p-4 md:p-margin-lg space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 border border-primary-container/40 text-primary-fixed-dim whitespace-nowrap">
            <Shield size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol 7-Delta Active</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-on-surface leading-tight">
            Initialize New<br/>
            <span className="text-primary-fixed-dim drop-shadow-[0_0_15px_rgba(0,218,243,0.4)]">Secure Entry</span>
          </h1>
        </div>

        {/* Security Indicator Widget */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-6 shadow-2xl">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-surface-container-highest" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeWidth="6"></circle>
              <circle className="text-primary-fixed-dim" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeWidth="6" strokeDasharray="226" strokeDashoffset="40" style={{ filter: 'drop-shadow(0 0 8px #00daf3)' }}></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-primary">82%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Security Level</p>
            <p className="text-lg font-bold text-on-surface leading-none">Tier-3 Encrypted</p>
            <div className="flex gap-1 mt-4">
              <div className="h-1 w-8 bg-primary rounded-full"></div>
              <div className="h-1 w-8 bg-primary rounded-full"></div>
              <div className="h-1 w-8 bg-primary rounded-full"></div>
              <div className="h-1 w-8 bg-white/10 rounded-full"></div>
            </div>
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
              <div className="flex items-center gap-4 bg-surface-container-high rounded-xl px-4 py-2 border border-white/5">
                <FileText className="text-primary-fixed-dim" size={18} />
                <input 
                  type="text"
                  placeholder="entry_title.cipher"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-48 bg-transparent border-none outline-none text-sm font-bold text-on-surface uppercase tracking-[0.18em] placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>
            
            {/* Recessed Editor Surface */}
            <div className="inset-input rounded-2xl p-6 md:p-10 min-h-[500px] relative border border-white/5">
              <textarea 
                ref={textareaRef}
                placeholder="Start typing encrypted thought-stream..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full min-h-[440px] bg-transparent border-none font-[var(--font-body)] text-lg leading-9 text-on-surface placeholder:text-on-surface-variant/35 focus:outline-none focus:ring-0 resize-none md:text-[20px]"
              />
              
              {/* Floating Editor Tools */}
              <div className="absolute bottom-8 right-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => injectSnippet('**', '**', 'bold text')}
                  className="bg-surface-bright/50 backdrop-blur-md p-4 rounded-2xl text-primary-fixed-dim hover:scale-110 transition-transform shadow-xl border border-white/10"
                  title="Insert bold text"
                >
                  <Bold size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => injectSnippet('\n[Attachment] ', '', 'linked evidence')}
                  className="bg-surface-bright/50 backdrop-blur-md p-4 rounded-2xl text-primary-fixed-dim hover:scale-110 transition-transform shadow-xl border border-white/10"
                  title="Insert attachment note"
                >
                  <Paperclip size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => injectSnippet('\n```txt\n', '\n```\n', 'secured snippet')}
                  className="bg-surface-bright/50 backdrop-blur-md p-4 rounded-2xl text-primary-fixed-dim hover:scale-110 transition-transform shadow-xl border border-white/10"
                  title="Insert code block"
                >
                  <Code size={24} />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mt-10 gap-6">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00daf3]"></span>
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Biometric Syncing...</span>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 md:flex-initial px-8 py-3 rounded-xl border border-white/10 font-bold text-sm text-on-surface hover:bg-white/5 transition-all uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={handleSeal}
                  disabled={loading || !title || !content}
                  className="flex-1 md:flex-initial px-10 py-3 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-background font-black text-sm shadow-[0_10px_20px_rgba(0,229,255,0.2)] hover:shadow-[0_15px_30px_rgba(0,229,255,0.3)] transition-all transform hover:-translate-y-1 uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? 'SEALING...' : 'Seal & Encrypt'}
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
              Encryption Parameters
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-surface-container/50 border border-white/5 shadow-lg">
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Algorithm</span>
                <span className="text-xs font-black text-primary-fixed-dim uppercase tracking-widest">AES-256 GCM</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-surface-container/50 border border-white/5 shadow-lg">
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Storage Node</span>
                <span className="text-xs font-black text-primary-fixed-dim uppercase tracking-widest">Svalbard-12</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-surface-container/50 border border-white/5 shadow-lg">
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Auto-Destruct</span>
                <span className="text-xs font-black text-error uppercase tracking-widest animate-pulse">Disabled</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low/40 backdrop-blur-3xl p-1 rounded-3xl overflow-hidden h-48 relative shadow-2xl border border-white/10 group">
            <img 
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" 
              alt="Entropy" 
              className="w-full h-full object-cover rounded-[1.4rem] opacity-40 transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6">
              <p className="text-[10px] font-black text-primary-fixed-dim uppercase tracking-[0.2em] mb-1">Real-time Entropy</p>
              <p className="text-lg font-bold text-on-surface leading-tight">System Seed Verified</p>
            </div>
          </div>

          <div className="bg-surface-container-low/40 backdrop-blur-3xl p-8 rounded-3xl border-l-4 border-secondary shadow-2xl border-y border-r border-white/10">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center border border-secondary/30">
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
