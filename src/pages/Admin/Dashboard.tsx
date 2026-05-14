import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Users, 
  Book, 
  Zap, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  Database,
  RefreshCw,
  MoreVertical,
  Verified
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    entries: 0,
    active: 0,
    failed: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic counts
    const fetchStats = async () => {
      const userSnap = await getDocs(collection(db, 'users'));
      const entrySnap = await getDocs(collection(db, 'entries'));
      setStats({
        users: userSnap.size,
        entries: entrySnap.size,
        active: Math.floor(userSnap.size * 0.15) || 5, // Simulated
        failed: 3 // Simulated
      });
    };
    fetchStats();

    // Activity Logs
    const logQuery = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribeLogs = onSnapshot(logQuery, (snap) => {
      setRecentLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Security Alerts
    const alertQuery = query(collection(db, 'securityLogs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeAlerts = onSnapshot(alertQuery, (snap) => {
      setSecurityAlerts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeAlerts();
    };
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-margin-lg space-y-layer-gap">
      {/* Quick Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed-dim/20 flex items-center justify-center border border-primary-fixed-dim/30 shadow-[0_0_15px_rgba(0,218,243,0.1)]">
              <Users className="text-primary-fixed-dim" size={32} />
            </div>
            <span className="text-[10px] font-black text-primary-fixed-dim bg-primary-fixed-dim/10 px-3 py-1 rounded-full border border-primary-fixed-dim/20 uppercase tracking-widest">+12.5%</span>
          </div>
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Total Users</p>
          <h3 className="text-4xl font-extrabold text-on-surface leading-none">{stats.users.toLocaleString()}</h3>
        </div>

        {/* Total Diary Entries */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center border border-secondary-container/30 shadow-[0_0_15px_rgba(209,188,255,0.1)]">
              <Book className="text-secondary" size={32} />
            </div>
            <span className="text-[10px] font-black text-secondary bg-secondary-container/10 px-3 py-1 rounded-full border border-secondary/20 uppercase tracking-widest">+4.2k</span>
          </div>
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Vault Capacity</p>
          <h3 className="text-4xl font-extrabold text-on-surface leading-none">{stats.entries.toLocaleString()}</h3>
        </div>

        {/* Active Users */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl transition-all hover:scale-[1.02]">
          <div className="absolute top-0 right-0 p-6">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim shadow-[0_0_10px_#00daf3] animate-pulse"></div>
          </div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-tertiary-container/20 flex items-center justify-center border border-tertiary-container/30">
              <Zap className="text-tertiary-fixed-dim" size={32} />
            </div>
          </div>
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Active Nodes</p>
          <h3 className="text-4xl font-extrabold text-on-surface leading-none">{stats.active}</h3>
        </div>

        {/* Failed Attempts */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-error/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-error-container/20 flex items-center justify-center border border-error/30">
              <AlertTriangle className="text-error" size={32} />
            </div>
            <span className="text-[10px] font-black text-error bg-error/10 px-3 py-1 rounded-full border border-error/20 uppercase tracking-widest">Alert</span>
          </div>
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Failed Logins (24h)</p>
          <h3 className="text-4xl font-extrabold text-error leading-none">{stats.failed}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Database Health Status */}
        <div className="lg:col-span-1 bg-surface-container-low/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl">
          <h4 className="text-xl font-extrabold text-on-surface mb-12 w-full text-left">Database Health Status</h4>
          <div className="relative w-56 h-56 mb-12">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-surface-container-high" cx="112" cy="112" fill="transparent" r="100" stroke="currentColor" strokeWidth="16"></circle>
              <circle 
                className="text-primary-fixed-dim" 
                cx="112" 
                cy="112" 
                fill="transparent" 
                r="100" 
                stroke="currentColor" 
                strokeWidth="16" 
                strokeDasharray="628" 
                strokeDashoffset="62" 
                style={{ filter: 'drop-shadow(0 0 15px rgba(0, 218, 243, 0.5))' }}
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-on-surface">90<span className="text-2xl text-primary-fixed-dim">%</span></span>
              <span className="text-[10px] font-black text-primary-fixed-dim uppercase tracking-[0.3em] mt-2">Optimized</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="bg-surface-container-lowest/50 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Uptime</p>
              <p className="text-xl font-extrabold text-on-surface">99.9%</p>
            </div>
            <div className="bg-surface-container-lowest/50 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Latency</p>
              <p className="text-xl font-extrabold text-on-surface">12ms</p>
            </div>
          </div>
        </div>

        {/* Encryption Monitor */}
        <div className="lg:col-span-2 bg-surface-container-low/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-12">
            <h4 className="text-xl font-extrabold text-on-surface">Encryption Status Monitor</h4>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-16 bg-primary-fixed-dim/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary-fixed-dim w-3/4 animate-pulse"></div>
              </div>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Live Traffic</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="bg-surface-container-lowest/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl flex items-center justify-between group transform transition-all hover:scale-[1.01]">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center border border-secondary/30">
                    <Verified className="text-secondary" size={28} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-on-surface leading-none mb-2">AES-256 Protocol</p>
                    <p className="text-sm font-medium text-on-surface-variant">Global Active Standard</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">Operational</span>
              </div>

              <div className="bg-surface-container-lowest/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl flex items-center justify-between group transform transition-all hover:scale-[1.01]">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-fixed-dim/20 flex items-center justify-center border border-primary-fixed-dim/30">
                    <RefreshCw className="text-primary-fixed-dim" size={28} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-on-surface leading-none mb-2">Key Rotation Policy</p>
                    <p className="text-sm font-medium text-on-surface-variant">Last rotated: 14 mins ago</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-primary-fixed-dim/10 text-primary-fixed-dim text-[10px] font-black uppercase tracking-widest border border-primary-fixed-dim/30">Operational</span>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-6 px-2">Encryption Load History</p>
              <div className="h-32 flex items-end gap-3 px-2">
                {[40, 60, 55, 80, 45, 70, 90, 30, 65, 75, 85, 95].map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 rounded-t-lg transition-all duration-500 hover:opacity-80"
                    style={{ 
                      height: `${h}%`, 
                      background: i > 8 ? 'linear-gradient(to top, #00daf3, #7000ff)' : 'rgba(0, 218, 243, 0.2)',
                      boxShadow: i > 8 ? '0 0 15px rgba(0, 218, 243, 0.3)' : 'none'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 bg-surface-container-low/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 h-[600px] flex flex-col shadow-2xl">
          <h4 className="text-xl font-extrabold text-on-surface mb-8">Security Alerts</h4>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 no-scrollbar">
            {securityAlerts.map((alert) => (
              <div key={alert.id} className="p-5 rounded-2xl bg-surface-container-lowest/50 border border-white/5 border-l-4 border-error transform transition-all hover:translate-x-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-error uppercase tracking-widest">{alert.severity}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">{alert.timestamp ? format(alert.timestamp.toDate(), 'p') : ''}</span>
                </div>
                <p className="text-sm font-bold text-on-surface mb-1">{alert.type}</p>
                <p className="text-xs font-medium text-on-surface-variant leading-relaxed">{alert.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 bg-surface-container-low/40 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h4 className="text-xl font-extrabold text-on-surface">Recent User Activity</h4>
            <button className="text-primary-fixed-dim font-bold text-sm hover:underline uppercase tracking-widest">View All Records</button>
          </div>
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-high/50 sticky top-0 z-10">
                <tr>
                  <th className="px-10 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Identity</th>
                  <th className="px-10 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Protocol Action</th>
                  <th className="px-10 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Resource</th>
                  <th className="px-10 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Timestamp</th>
                  <th className="px-10 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-fixed-dim/10 border border-primary-fixed-dim/20 overflow-hidden flex items-center justify-center">
                           <Activity size={18} className="text-primary-fixed-dim" />
                        </div>
                        <span className="text-sm font-bold text-on-surface">{log.userEmail || 'System Node'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-sm font-medium text-on-surface-variant">{log.action}</td>
                    <td className="px-10 py-6 text-xs font-mono font-bold text-on-surface-variant opacity-60 group-hover:opacity-100 transition-opacity">{log.resource}</td>
                    <td className="px-10 py-6 text-xs font-bold text-on-surface-variant">{log.timestamp ? format(log.timestamp.toDate(), 'p') : ''}</td>
                    <td className="px-10 py-6">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed-dim/10 text-primary-fixed-dim text-[10px] font-black uppercase tracking-widest border border-primary-fixed-dim/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim shadow-[0_0_8px_#00daf3]"></span>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
