import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  RefreshCw,
} from 'lucide-react';
import { db } from '../../lib/firebase';

type LogRecord = Record<string, any>;

function toMillis(value: any) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
}

function sortByTimestamp<T extends LogRecord>(rows: T[]) {
  return [...rows].sort((a, b) => toMillis(b.timestamp || b.createdAt) - toMillis(a.timestamp || a.createdAt));
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All Events');

  const refreshLogs = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'activityLogs'));
      setLogs(sortByTimestamp(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));
    } catch (error) {
      console.error(error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (category === 'All Events') return logs;
    return logs.filter((log) => {
      const action = String(log.action || '').toLowerCase();
      if (category === 'Security Alerts') return action.includes('login') || action.includes('security');
      if (category === 'User Access') return action.includes('login') || action.includes('access');
      if (category === 'Database Queries') return action.includes('entry') || action.includes('database');
      return true;
    });
  }, [category, logs]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cipherdiary-admin-logs.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-margin-lg space-y-layer-gap overflow-x-hidden">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary-fixed-dim sm:text-4xl">Activity Logs</h2>
          <p className="mt-2 font-medium text-on-surface-variant">Real-time surveillance of system-wide operations and security events.</p>
        </div>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex items-center rounded-full border border-white/5 bg-surface-container-high/40 p-1 shadow-lg backdrop-blur-md">
            <span className="px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary-fixed-dim sm:px-6">Live Stream</span>
            <div className="relative h-7 w-14 rounded-full border border-primary-fixed-dim/30 bg-primary-container/20">
              <div className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-primary-fixed-dim shadow-[0_0_10px_#00daf3]" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-surface-container-high px-6 py-3 text-sm font-bold uppercase tracking-widest shadow-xl transition-all hover:bg-surface-container-highest sm:justify-start"
          >
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 sm:gap-8">
        <div className="col-span-12 space-y-8 lg:col-span-3">
          <section className="glass-panel rounded-[2rem] border border-white/10 p-6 sm:p-8 shadow-2xl">
            <div className="mb-8 flex items-center gap-3">
              <History size={24} className="text-primary-fixed-dim" />
              <h3 className="text-xl font-bold leading-none text-on-surface">Advanced Filters</h3>
            </div>

            <div className="space-y-8">
              <div>
                <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Event Category</label>
                <div className="space-y-4">
                  {['All Events', 'Security Alerts', 'User Access', 'Database Queries'].map((cat) => (
                    <label key={cat} className="group flex cursor-pointer items-center gap-4">
                      <input
                        type="radio"
                        name="category"
                        checked={category === cat}
                        onChange={() => setCategory(cat)}
                        className="sr-only"
                      />
                      <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all ${category === cat ? 'border-primary-fixed-dim' : 'border-white/10 group-hover:border-white/30'}`}>
                        {category === cat ? <div className="h-3 w-3 rounded bg-primary-fixed-dim shadow-[0_0_8px_#00daf3]" /> : null}
                      </div>
                      <span className={`text-sm font-bold ${category === cat ? 'text-on-surface' : 'text-on-surface-variant'}`}>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void refreshLogs()}
              className="mt-12 w-full rounded-2xl border border-primary-fixed-dim/20 bg-surface-container-highest py-4 text-xs font-black uppercase tracking-widest text-primary-fixed-dim shadow-xl transition-all hover:bg-primary-fixed-dim/10"
            >
              Apply Analysis
            </button>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-9">
          <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary-fixed-dim shadow-[0_0_10px_#00daf3]" />
                  <span className="text-sm font-bold uppercase tracking-widest text-primary-fixed-dim">Monitoring {filteredLogs.length || 0} Records</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant opacity-60">{category}</span>
              </div>
              <button
                type="button"
                onClick={() => void refreshLogs()}
                className="rounded-xl border border-white/5 bg-surface-container p-3 shadow-lg transition-all hover:bg-surface-container-highest active:scale-95"
              >
                <RefreshCw size={20} className={`text-on-surface-variant ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-high/30">
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Timestamp</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Protocol</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Identity</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Payload Action</th>
                    <th className="px-4 py-6 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="group transition-all hover:bg-white/5">
                        <td className="whitespace-nowrap px-4 py-6 text-xs font-mono font-bold text-on-surface-variant opacity-60 group-hover:opacity-100 sm:px-10">
                          {log.timestamp ? format(log.timestamp.toDate ? log.timestamp.toDate() : new Date(toMillis(log.timestamp)), 'HH:mm:ss.SSS') : 'Pending'}
                        </td>
                        <td className="px-4 py-6 sm:px-10">
                          <span className="flex items-center gap-3 text-sm font-bold text-primary-fixed-dim">
                            <Activity size={16} />
                            {log.status || 'LOG'}
                          </span>
                        </td>
                        <td className="px-4 py-6 text-sm font-bold text-on-surface sm:px-10">{log.userEmail || 'System'}</td>
                        <td className="px-4 py-6 text-sm font-medium leading-relaxed text-on-surface-variant sm:px-10">
                          {log.action} on <span className="font-mono text-xs opacity-60">{log.resource}</span>
                        </td>
                        <td className="px-4 py-6 text-right sm:px-10">
                          <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary-fixed-dim hover:underline">
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-24 text-center text-sm font-medium text-on-surface-variant sm:px-10">
                        {loading ? 'Loading activity records...' : 'No activity logs found yet. Sign-ins and entry changes will start filling this panel automatically.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/5 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-60">Showing {filteredLogs.length} entries</span>
              <div className="flex gap-4">
                <button type="button" className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-on-surface-variant opacity-50 transition-all hover:bg-white/10">
                  <ChevronLeft size={24} />
                </button>
                <button type="button" className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-on-surface-variant transition-all hover:bg-white/10">
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
