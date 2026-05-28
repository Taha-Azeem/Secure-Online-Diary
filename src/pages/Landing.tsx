import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AppFooter } from '../components/Layout';
import { ArrowRight, Shield, Key, History, Lock } from 'lucide-react';

function EncryptionSimulation() {
  const [text, setText] = useState('My secret thoughts are fully private.');
  const [cipher, setCipher] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);

  useEffect(() => {
    const phrases = [
      'My secret thoughts are fully private.',
      'Cryptographic keys never touch the server.',
      'Sovereignty is defined by local encryption.',
      'CipherDiary secures your digital memory.'
    ];
    let phraseIndex = 0;
    
    const interval = setInterval(() => {
      setIsEncrypted(true);
      let iterations = 0;
      const originalText = phrases[phraseIndex];
      const length = originalText.length;
      
      const morphInterval = setInterval(() => {
        iterations++;
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
        let result = '';
        for (let i = 0; i < length; i++) {
          if (i < iterations * 2) {
            result += characters[Math.floor(Math.random() * characters.length)];
          } else {
            result += originalText[i];
          }
        }
        setCipher(result);
        
        if (iterations * 2 >= length) {
          clearInterval(morphInterval);
          setTimeout(() => {
            setIsEncrypted(false);
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setText(phrases[phraseIndex]);
            setCipher('');
          }, 2000);
        }
      }, 30);

    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-xs bg-surface-container-lowest/80 border border-white/10 rounded-xl p-5 shadow-2xl max-w-sm w-full backdrop-blur-md">
      <div className="flex justify-between items-center text-[10px] text-primary-fixed-dim uppercase tracking-[0.2em] mb-4 pb-2 border-b border-white/5 font-black">
        <span>Encryption Engine</span>
        <span className={isEncrypted ? 'text-primary animate-pulse' : 'text-on-surface-variant'}>
          {isEncrypted ? 'PROCESSING...' : 'SECURE'}
        </span>
      </div>
      <p className="text-on-surface font-semibold text-sm break-all leading-relaxed">
        {isEncrypted ? cipher : text}
      </p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-surface min-h-screen selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      <Navbar />
      
      <main className="relative pt-32 pb-20">
        {/* Background Visual Accents */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#00daf3 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>

        {/* Hero Section */}
        <section className="max-w-container-max-width mx-auto px-margin-lg mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10">
              <span className="inline-block font-label-sm px-3 py-1 bg-secondary-container/20 text-secondary border border-secondary/30 rounded-full mb-6 uppercase tracking-widest">
                PROTOCOL ACTIVE: AES-256
              </span>
              <h1 className="font-headline-xl text-6xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-500 leading-[1.1] mb-6 font-extrabold tracking-tight">
                Total Digital Sovereignty
              </h1>
              <p className="font-body-lg text-on-surface-variant max-w-lg mb-10 text-lg leading-relaxed">
                End-to-end encrypted journaling for the security-conscious. Your thoughts, locked behind military-grade infrastructure that only you control.
              </p>
              <div className="flex flex-wrap gap-6">
                <button 
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 font-title-md px-8 py-4 bg-cyan-500 text-white rounded-xl shadow-[0_10px_20px_rgba(6,182,212,0.2)] active:scale-95 transition-transform hover:shadow-[0_15px_30px_rgba(6,182,212,0.4)]"
                >
                  Start Writing Securely
                  <ArrowRight size={20} />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 font-title-md px-8 py-4 border border-outline-variant rounded-xl hover:bg-surface-variant/20 transition-all font-bold"
                >
                  View Demo
                </button>
              </div>
            </div>
            <div className="relative p-12 flex flex-col justify-center items-center gap-8">
              <div className="relative w-full aspect-square max-w-[320px] bg-surface-container-low/40 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-4 overflow-hidden shadow-2xl flex items-center justify-center">
                 <Shield size={180} className="text-primary-fixed-dim drop-shadow-[0_0_40px_rgba(0,218,243,0.4)] opacity-80" />
              </div>
              <EncryptionSimulation />
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="max-w-container-max-width mx-auto px-margin-lg mb-32">
          <h2 className="font-headline-lg text-center mb-16 text-primary text-[40px] font-bold">Infrastructural Fortification</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 glass-panel glass-panel-hover rounded-3xl border border-white/10 p-10 flex flex-col md:flex-row gap-10 items-center transform transition-all hover:scale-[1.02]">
              <div className="w-full md:w-1/2">
                <div className="w-16 h-16 bg-primary-container/20 text-primary flex items-center justify-center rounded-2xl mb-6 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                  <Shield size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-on-surface">Zero-Knowledge Architecture</h3>
                <p className="font-body-md text-on-surface-variant lg:text-base">We don't just secure your data; we make it impossible for even us to read it. Encryption keys never leave your device.</p>
              </div>
              <div className="w-full md:w-1/2 h-64 bg-surface-container-lowest/50 rounded-2xl overflow-hidden border border-outline-variant/30 flex items-center justify-center">
                <Lock size={120} className="text-primary-fixed-dim opacity-20" />
              </div>
            </div>
            <div className="glass-panel glass-panel-hover rounded-3xl border border-white/10 p-10 flex flex-col justify-between transform transition-all hover:scale-[1.02]">
              <div>
                <div className="w-16 h-16 bg-secondary-container/20 text-secondary flex items-center justify-center rounded-2xl mb-6 shadow-[0_0_15px_rgba(209,188,255,0.2)]">
                  <Key size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-on-surface">Hardware Key Support</h3>
                <p className="font-body-md text-on-surface-variant">Integrate YubiKey or Titan security keys for physical 2FA protection of your most private entries.</p>
              </div>
            </div>
            <div className="glass-panel glass-panel-hover rounded-3xl border border-white/10 p-10 flex flex-col justify-between transform transition-all hover:scale-[1.02]">
              <div>
                <div className="w-16 h-16 bg-tertiary-container/10 text-tertiary-fixed-dim flex items-center justify-center rounded-2xl mb-6">
                  <History size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-on-surface">Immutable Audit Logs</h3>
                <p className="font-body-md text-on-surface-variant">Track every access attempt with cryptographically signed activity logs that cannot be tampered with.</p>
              </div>
            </div>
            <div className="md:col-span-2 glass-panel glass-panel-hover rounded-3xl border border-white/10 p-10 flex flex-col-reverse md:flex-row gap-10 items-center transform transition-all hover:scale-[1.02]">
              <div className="w-full md:w-1/2 h-64 bg-surface-container-lowest/50 rounded-2xl overflow-hidden border border-outline-variant/30 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <Shield size={100} className="text-secondary opacity-30" />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="w-16 h-16 bg-primary-container/20 text-primary flex items-center justify-center rounded-2xl mb-6">
                  <Lock size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-on-surface">Multi-Vault Syncing</h3>
                <p className="font-body-md text-on-surface-variant">Seamlessly sync your journals across devices with our proprietary p2p protocol that never touches a central server in plaintext.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-container-max-width mx-auto px-margin-lg">
          <div className="glass-panel glass-panel-hover rounded-[3rem] border border-white/10 p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(112,0,255,0.15),transparent_70%)]"></div>
            <div className="relative z-10">
              <h2 className="text-[48px] font-extrabold mb-8 text-primary tracking-tight">Your Thoughts Are Yours Alone.</h2>
              <p className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-12 leading-relaxed">
                Join 150,000+ security professionals who trust CipherDiary for their daily records. Secure your digital legacy today.
              </p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => navigate('/register')}
                  className="font-bold px-10 py-5 bg-purple-500 text-white rounded-2xl shadow-xl hover:shadow-purple-500/40 transition-all active:scale-95 text-lg"
                >
                  Deploy Vault Now
                </button>
              </div>
              <div className="mt-12 flex justify-center items-center gap-8 grayscale opacity-40">
                <span className="font-label-sm tracking-widest uppercase text-xs font-black">Trusted By Teams At:</span>
                <div className="flex gap-10 items-center font-bold text-2xl">
                  <span>CYBERSEC</span>
                  <span>NETLINK</span>
                  <span>QUANTUM</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
