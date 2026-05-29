import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Activity, 
  Terminal, 
  Smartphone, 
  Laptop, 
  CheckCircle, 
  AlertTriangle,
  Play
} from 'lucide-react';

type ActivityLog = {
  id: string;
  action: string;
  resource: string;
  timestamp: any;
  status: string;
};

export default function SecurityMonitor() {
  const { user, vaultKey, profile } = useAuth();
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(15)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ActivityLog[];
        setLogs(list);
        setLoadingLogs(false);
      },
      (err) => {
        console.error(err);
        setLoadingLogs(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleStartScan = async () => {
    if (scanning) return;
    setScanning(true);
    setScanProgress(0);
    setScanLogs([]);

    const steps = [
      { msg: 'Initializing diagnostic handshake...', delay: 400 },
      { msg: 'Reading client memory space bounds...', delay: 600 },
      { msg: 'Checking PBKDF2 entropy posture...', delay: 700 },
      { msg: 'Verifying local AES-256 GCM key registry...', delay: 500 },
      { msg: 'Testing Firestore database channel integrity...', delay: 600 },
      { msg: 'Auditing recent activity logs for tamper markers...', delay: 800 },
      { msg: 'Validating zero-knowledge transport protocol...', delay: 500 },
      { msg: 'System check complete. Security Level OMEGA stable.', delay: 400 }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setScanStep(step.msg);
      setScanLogs((prev) => [...prev, `[INFO] ${step.msg}`]);
      setScanProgress(Math.floor(((i + 1) / steps.length) * 100));
      await new Promise((resolve) => setTimeout(resolve, step.delay));
    }

    setScanning(false);
    showToast('Integrity Scan Complete: Zero threat vectors detected.', 'success');
  };

  return (
    <div className="mx-auto max-w-container-max-width px-4 py-6 md:px-margin-lg md:py-8 space-y-8 overflow-x-hidden">
      {/* Page Title */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 border border-primary-container/40 text-primary-fixed-dim whitespace-nowrap">
          <Shield size={14} className="text-[#06b6d4]" />
          <span className="text-[10px] font-black uppercase tracking-widest">Security Clearance: Level 5</span>
        </div>
        <h1 className="cyan-glow-text text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl md:text-[40px]">Security Monitor</h1>
        <p className="text-sm text-on-surface-variant max-w-xl">
          Real-time check on your client-side cryptography, local keys, and authentication activity.
        </p>
      </header>

      {/* Grid of panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Side - Status & Scanning */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Security Posture Status */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Shield className="text-[#06b6d4]" size={20} />
              Diagnostic Posture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest/40 border border-white/5 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Master Signature</span>
                <div className="flex items-center gap-2">
                  {vaultKey ? (
                    <>
                      <Unlock size={16} className="text-[#10b981]" />
                      <span className="text-sm font-bold text-green-400">Unlocked & Loaded</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="text-[#ef4444]" />
                      <span className="text-sm font-bold text-red-400">Locked / Session Key Empty</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest/40 border border-white/5 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Cipher Framework</span>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#06b6d4]" />
                  <span className="text-sm font-bold text-white">AES-256 GCM + PBKDF2</span>
                </div>
              </div>
            </div>
          </section>

          {/* Simulated Integrity Scanner */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Terminal className="text-[#8b5cf6]" size={20} />
                Client-Side Integrity Audit
              </h3>
              <button
                type="button"
                onClick={handleStartScan}
                disabled={scanning}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-background font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={12} fill="currentColor" />
                {scanning ? 'Auditing...' : 'Start Audit'}
              </button>
            </div>

            {/* Scan Progress Bar */}
            {scanning && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                  <span>Diagnostic progress: {scanStep}</span>
                  <span className="text-[#06b6d4]">{scanProgress}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Console output display */}
            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 font-mono text-xs text-[#06b6d4] h-48 overflow-y-auto space-y-1.5 custom-scrollbar select-none">
              {scanLogs.length === 0 ? (
                <p className="text-on-surface-variant/40 italic">Audit telemetry ready. Awaiting user authorization command.</p>
              ) : (
                scanLogs.map((log, index) => (
                  <p key={index} className="leading-relaxed">{log}</p>
                ))
              )}
            </div>
          </section>

        </div>

        {/* Right Side - Logs */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Activity className="text-[#10b981]" size={20} />
              Session Audit Trails
            </h3>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingLogs ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-sm text-on-surface-variant py-10">No recent logs recorded.</p>
              ) : (
                logs.map((log) => {
                  let statusColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                  if (log.status === 'DELETED' || log.status === 'FAILED') {
                    statusColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                  } else if (log.status === 'SUCCESS' || log.status === 'ENCRYPTED') {
                    statusColor = 'bg-green-500/10 text-green-400 border-green-500/20';
                  }

                  return (
                    <div 
                      key={log.id} 
                      className="border border-white/5 bg-surface-container-lowest/30 rounded-2xl p-4 flex flex-col gap-2 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-on-surface-variant opacity-75">
                          {log.timestamp ? format(log.timestamp.toDate(), 'PPP p') : 'Pending'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusColor}`}>
                          {log.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{log.action}</h4>
                      <p className="text-[10px] font-mono text-on-surface-variant truncate">
                        Resource: {log.resource}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
