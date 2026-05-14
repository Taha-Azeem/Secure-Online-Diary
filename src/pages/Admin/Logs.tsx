import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Activity,
  History,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-margin-lg space-y-layer-gap">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-primary-fixed-dim tracking-tight">Activity Logs</h2>
          <p className="text-on-surface-variant font-medium mt-2">Real-time surveillance of system-wide operations and security events.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-high/40 backdrop-blur-md p-1 rounded-full border border-white/5 flex items-center shadow-lg">
            <span className="px-6 py-2 text-primary-fixed-dim font-black text-xs uppercase tracking-[0.2em]">Live Stream</span>
            <div className="w-14 h-7 bg-primary-container/20 rounded-full relative cursor-pointer border border-primary-fixed-dim/30">
              <div className="absolute right-1.5 top-1.5 w-4 h-4 bg-primary-fixed-dim rounded-full shadow-[0_0_10px_#00daf3]"></div>
            </div>
          </div>
          <button className="flex items-center gap-3 px-6 py-3 bg-surface-container-high border border-white/10 rounded-2xl hover:bg-surface-container-highest transition-all shadow-xl font-bold text-sm uppercase tracking-widest">
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Filters Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-8">
          <section className="bg-surface-container-low/40 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <History size={24} className="text-primary-fixed-dim" />
              <h3 className="text-xl font-bold text-on-surface leading-none">Advanced Filters</h3>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-on-surface-variant block mb-4 uppercase tracking-[0.2em]">Event Category</label>
                <div className="space-y-4">
                   {['All Events', 'Security Alerts', 'User Access', 'Database Queries'].map((cat, i) => (
                    <label key={cat} className="flex items-center gap-4 cursor-pointer group">
                      <div className={`w-6 h-6 border-2 border-white/10 rounded-lg flex items-center justify-center transition-all ${i === 0 ? 'border-primary-fixed-dim' : 'group-hover:border-white/30'}`}>
                        {i === 0 && <div className="w-3 h-3 bg-primary-fixed-dim rounded shadow-[0_0_8px_#00daf3]"></div>}
                      </div>
                      <span className={`text-sm font-bold ${i === 0 ? 'text-on-surface' : 'text-on-surface-variant'}`}>{cat}</span>
                    </label>
                   ))}
                </div>
              </div>
            </div>
            
            <button className="w-full mt-12 py-4 bg-surface-container-highest border border-primary-fixed-dim/20 text-primary-fixed-dim rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-fixed-dim/10 transition-all shadow-xl">
              Apply Analysis
            </button>
          </section>
        </div>

        {/* Main Log Panel */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-surface-container-low/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex gap-6 items-center">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim shadow-[0_0_10px_#00daf3] animate-pulse"></span>
                  <span className="text-sm font-bold text-primary-fixed-dim uppercase tracking-widest leading-none">Monitoring 1,248 Nodes</span>
                </div>
                <div className="h-4 w-[1px] bg-white/10"></div>
                <span className="text-xs font-medium text-on-surface-variant uppercase tracking-widest opacity-60">Last 100 entries</span>
              </div>
              <div className="flex gap-3">
                <button className="p-3 bg-surface-container rounded-xl border border-white/5 hover:bg-surface-container-highest transition-all shadow-lg active:scale-95">
                  <RefreshCw size={20} className="text-on-surface-variant" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/30">
                    <th className="px-10 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Timestamp</th>
                    <th className="px-10 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Protocol</th>
                    <th className="px-10 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Identity</th>
                    <th className="px-10 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Payload Action</th>
                    <th className="px-10 py-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-all group">
                      <td className="px-10 py-6 whitespace-nowrap text-xs font-mono font-bold text-on-surface-variant opacity-60 group-hover:opacity-100">
                        {log.timestamp ? format(log.timestamp.toDate(), 'HH:mm:ss.SSS') : 'Pending'}
                      </td>
                      <td className="px-10 py-6">
                        <span className="flex items-center gap-3 text-primary-fixed-dim font-bold text-sm">
                           <Activity size={16} />
                           {log.status || 'LOG'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-sm font-bold text-on-surface">{log.userEmail || 'System'}</td>
                      <td className="px-10 py-6 text-sm font-medium text-on-surface-variant leading-relaxed">
                        {log.action} on <span className="font-mono text-xs opacity-60">{log.resource}</span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="text-primary-fixed-dim hover:underline font-black text-[10px] uppercase tracking-widest">Investigate</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 border-t border-white/5 flex justify-between items-center bg-white/5">
               <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest opacity-60">Showing {logs.length} entries</span>
               <div className="flex gap-4">
                  <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/10 transition-all opacity-50"><ChevronLeft size={24} /></button>
                  <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/10 transition-all"><ChevronRight size={24} /></button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
