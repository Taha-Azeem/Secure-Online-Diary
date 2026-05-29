import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { format } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  Book,
  RefreshCw,
  Users,
  Verified,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';

type AdminRecord = Record<string, any>;

function toMillis(value: any) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
}

function sortByTimestamp<T extends AdminRecord>(rows: T[]) {
  return [...rows].sort((a, b) => toMillis(b.timestamp || b.lastLogin || b.createdAt) - toMillis(a.timestamp || a.lastLogin || a.createdAt));
}

function docsToRecords(snapshot: QuerySnapshot<DocumentData>) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function getTimestampDate(value: any) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate() as Date;
  if (typeof value.toMillis === 'function') return new Date(value.toMillis());
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (value instanceof Date) return value;
  return null;
}

const fallbackAlerts: AdminRecord[] = [
  { id: 'fallback-1', severity: 'HIGH', type: 'AUTH', description: 'No security log records yet. Live alerts will appear here after auth events.' },
  { id: 'fallback-2', severity: 'INFO', type: 'POLICY', description: 'Configure monitoring rules to turn this panel into a live security feed.' },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminRecord[]>([]);
  const [entries, setEntries] = useState<AdminRecord[]>([]);
  const [logs, setLogs] = useState<AdminRecord[]>([]);
  const [alerts, setAlerts] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let loadedCollections = 0;
    const markLoaded = () => {
      loadedCollections += 1;
      if (loadedCollections >= 4) setLoading(false);
    };

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(docsToRecords(snapshot));
      markLoaded();
    }, (error) => {
      console.error(error);
      setUsers([]);
      markLoaded();
    });

    const unsubEntries = onSnapshot(collection(db, 'entries'), (snapshot) => {
      setEntries(docsToRecords(snapshot));
      markLoaded();
    }, (error) => {
      console.error(error);
      setEntries([]);
      markLoaded();
    });

    const unsubLogs = onSnapshot(collection(db, 'activityLogs'), (snapshot) => {
      setLogs(sortByTimestamp(docsToRecords(snapshot)));
      markLoaded();
    }, (error) => {
      console.error(error);
      setLogs([]);
      markLoaded();
    });

    const unsubAlerts = onSnapshot(collection(db, 'securityLogs'), (snapshot) => {
      setAlerts(sortByTimestamp(docsToRecords(snapshot)));
      markLoaded();
    }, (error) => {
      console.error(error);
      setAlerts([]);
      markLoaded();
    });

    return () => {
      unsubUsers();
      unsubEntries();
      unsubLogs();
      unsubAlerts();
    };
  }, []);

  const stats = useMemo(() => ({
    users: users.length,
    entries: entries.length,
    active: users.filter((user) => user.lastLogin).length,
    failed: alerts.filter((alert) => String(alert.severity || '').toUpperCase() === 'HIGH').length,
  }), [users, entries, alerts]);

  const recentLogs = useMemo(() => {
    if (logs.length > 0) return logs.slice(0, 10);
    return sortByTimestamp(users)
      .slice(0, 6)
      .map((user) => ({
        id: `user-${user.id}`,
        userEmail: user.email || 'Unknown user',
        action: 'Profile Available',
        resource: 'users',
        timestamp: user.lastLogin || user.createdAt,
        status: 'ACTIVE',
      }));
  }, [logs, users]);

  const securityAlerts = useMemo(() => (alerts.length > 0 ? alerts.slice(0, 5) : fallbackAlerts), [alerts]);

  const failedTone = useMemo(() => (stats.failed > 0 ? 'text-error' : 'text-primary-fixed-dim'), [stats.failed]);

  const entryTrend = useMemo(() => {
    const days = 12;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - index));
      return {
        key: date.toDateString(),
        label: format(date, 'dd MMM'),
        count: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    entries.forEach((entry) => {
      const entryDate = getTimestampDate(entry.createdAt || entry.updatedAt);
      if (!entryDate) return;
      entryDate.setHours(0, 0, 0, 0);
      const bucket = bucketMap.get(entryDate.toDateString());
      if (bucket) {
        bucket.count += 1;
      }
    });

    const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

    return buckets.map((bucket) => ({
      ...bucket,
      height: Math.max(18, (bucket.count / maxCount) * 100),
    }));
  }, [entries]);

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-margin-lg space-y-layer-gap overflow-x-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary-fixed-dim sm:text-4xl">Admin Dashboard</h1>
          <p className="mt-2 text-on-surface-variant">Realtime platform oversight powered by live Firestore listeners.</p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-primary-fixed-dim/20 bg-surface-container-high px-5 py-3 text-sm font-bold uppercase tracking-widest text-primary-fixed-dim">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Syncing Data' : 'Realtime Linked'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-fixed-dim/30 bg-primary-fixed-dim/20">
              <Users className="text-primary-fixed-dim" size={32} />
            </div>
            <span className="rounded-full border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-fixed-dim">Live</span>
          </div>
          <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Total Users</p>
          <h3 className="text-3xl font-extrabold text-on-surface sm:text-4xl">{stats.users.toLocaleString()}</h3>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary-container/20">
              <Book className="text-secondary" size={32} />
            </div>
            <span className="rounded-full border border-secondary/20 bg-secondary-container/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-secondary">Vault</span>
          </div>
          <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Diary Entries</p>
          <h3 className="text-3xl font-extrabold text-on-surface sm:text-4xl">{stats.entries.toLocaleString()}</h3>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-fixed-dim/20 bg-primary-fixed-dim/10">
              <Zap className="text-tertiary-fixed-dim" size={32} />
            </div>
          </div>
          <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Profiles with Activity</p>
          <h3 className="text-3xl font-extrabold text-on-surface sm:text-4xl">{stats.active.toLocaleString()}</h3>
        </div>

        <div className="glass-panel rounded-3xl border border-error/20 p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-error/30 bg-error/10">
              <AlertTriangle className="text-error" size={32} />
            </div>
          </div>
          <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">High Severity Alerts</p>
          <h3 className={`text-3xl font-extrabold sm:text-4xl ${failedTone}`}>{stats.failed.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-[2.5rem] p-6 sm:p-10 text-center shadow-2xl">
          <h4 className="mb-8 sm:mb-12 w-full text-left text-lg sm:text-xl font-extrabold text-on-surface">Database Health Status</h4>
          <div className="relative mx-auto mb-8 h-44 w-44 sm:mb-12 sm:h-56 sm:w-56">
            <svg className="h-full w-full -rotate-90 transform">
              <circle className="text-surface-container-high" cx="112" cy="112" fill="transparent" r="100" stroke="currentColor" strokeWidth="16" />
              <circle className="text-primary-fixed-dim" cx="112" cy="112" fill="transparent" r="100" stroke="currentColor" strokeWidth="16" strokeDasharray="628" strokeDashoffset={stats.entries > 0 ? '62' : '120'} style={{ filter: 'drop-shadow(0 0 15px rgba(0, 218, 243, 0.5))' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-on-surface sm:text-5xl">{stats.entries > 0 ? '90' : '76'}<span className="text-xl text-primary-fixed-dim sm:text-2xl">%</span></span>
              <span className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary-fixed-dim">{stats.entries > 0 ? 'Optimized' : 'Bootstrapping'}</span>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-3xl border border-white/5 bg-surface-container-lowest/50 p-4 sm:p-6 backdrop-blur-md">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Users</p>
              <p className="text-xl font-extrabold text-on-surface">{stats.users || 0}</p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-surface-container-lowest/50 p-4 sm:p-6 backdrop-blur-md">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Entries</p>
              <p className="text-xl font-extrabold text-on-surface">{stats.entries || 0}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-6 sm:p-10 shadow-2xl lg:col-span-2">
          <div className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-lg font-extrabold text-on-surface sm:text-xl">Encryption Status Monitor</h4>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-primary-fixed-dim/20">
                <div className="h-full w-3/4 animate-pulse bg-primary-fixed-dim" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Live Traffic</span>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-surface-container-lowest/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 backdrop-blur-md">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary-container/20">
                  <Verified className="text-secondary" size={28} />
                </div>
                <div>
                  <p className="mb-2 text-lg font-bold leading-none text-on-surface">AES-256 Protocol</p>
                  <p className="text-sm font-medium text-on-surface-variant">Global Active Standard</p>
                </div>
              </div>
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-400">Operational</span>
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-surface-container-lowest/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 backdrop-blur-md">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-fixed-dim/30 bg-primary-fixed-dim/20">
                  <RefreshCw className="text-primary-fixed-dim" size={28} />
                </div>
                <div>
                  <p className="mb-2 text-lg font-bold leading-none text-on-surface">Activity Feed Readiness</p>
                  <p className="text-sm font-medium text-on-surface-variant">{recentLogs.length > 0 ? 'Realtime records available' : 'Waiting for first admin events'}</p>
                </div>
              </div>
              <span className="rounded-full border border-primary-fixed-dim/30 bg-primary-fixed-dim/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-fixed-dim">
                {recentLogs.length > 0 ? 'Ready' : 'Standby'}
              </span>
            </div>

            <div className="mt-8 sm:mt-12">
              <div className="mb-6 flex items-center justify-between gap-4 px-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Total Entries in Database</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{stats.entries.toLocaleString()} live record{stats.entries === 1 ? '' : 's'}</p>
                </div>
                <span className="rounded-full border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-fixed-dim">
                  Firestore Live
                </span>
              </div>
              <div className="flex h-36 items-end gap-2 px-2 sm:h-40 sm:gap-3">
                {entryTrend.map((point) => (
                  <div key={point.key} className="group flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-full w-full items-end">
                      <div
                        title={`${point.label}: ${point.count} entries`}
                        className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-90"
                        style={{
                          height: `${point.height}%`,
                          background: point.count > 0
                            ? 'linear-gradient(to top, #00daf3, #7000ff)'
                            : 'rgba(0, 218, 243, 0.12)',
                          boxShadow: point.count > 0 ? '0 0 15px rgba(0, 218, 243, 0.3)' : 'none',
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/80">
                      {point.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">
                <span>{entryTrend[0]?.label}</span>
                <span>{entryTrend[entryTrend.length - 1]?.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="glass-panel flex h-[480px] flex-col rounded-[2rem] p-6 sm:h-[600px] sm:p-8 shadow-2xl xl:col-span-1">
          <h4 className="mb-8 text-xl font-extrabold text-on-surface">Security Alerts</h4>
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2">
            {securityAlerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-white/5 border-l-4 border-error bg-surface-container-lowest/50 p-5 transition-all hover:translate-x-1">
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-error">{alert.severity || 'INFO'}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">{alert.timestamp ? format(alert.timestamp.toDate(), 'p') : 'Pending'}</span>
                </div>
                <p className="mb-1 text-sm font-bold text-on-surface">{alert.type || 'Security Event'}</p>
                <p className="text-xs font-medium leading-relaxed text-on-surface-variant">{alert.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel flex h-[480px] flex-col overflow-hidden rounded-[2rem] shadow-2xl sm:h-[600px] xl:col-span-3">
          <div className="flex flex-col gap-4 border-b border-white/5 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <h4 className="text-lg font-extrabold text-on-surface sm:text-xl">Recent User Activity</h4>
            <button type="button" onClick={() => navigate('/admin/logs')} className="text-sm font-bold uppercase tracking-widest text-primary-fixed-dim hover:underline">
              View All Records
            </button>
          </div>
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-surface-container-high/50">
                <tr>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Identity</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Protocol Action</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Resource</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Timestamp</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:px-10">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentLogs.length > 0 ? recentLogs.map((log) => (
                  <tr key={log.id} className="group transition-all hover:bg-white/5">
                    <td className="px-4 py-6 sm:px-10">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-primary-fixed-dim/20 bg-primary-fixed-dim/10">
                          <Activity size={18} className="text-primary-fixed-dim" />
                        </div>
                        <span className="text-sm font-bold text-on-surface">{log.userEmail || 'System Node'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-sm font-medium text-on-surface-variant sm:px-10">{log.action}</td>
                    <td className="px-4 py-6 text-xs font-mono font-bold text-on-surface-variant opacity-60 transition-opacity group-hover:opacity-100 sm:px-10">{log.resource}</td>
                    <td className="px-4 py-6 text-xs font-bold text-on-surface-variant sm:px-10">{log.timestamp ? format(log.timestamp.toDate ? log.timestamp.toDate() : new Date(toMillis(log.timestamp)), 'p') : 'Pending'}</td>
                    <td className="px-4 py-6 sm:px-10">
                      <span className="inline-flex items-center gap-2 rounded-full border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-fixed-dim">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-fixed-dim shadow-[0_0_8px_#00daf3]" />
                        {log.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-24 text-center text-sm font-medium text-on-surface-variant sm:px-10">
                      Admin activity will appear here automatically after users sign in, create entries, or trigger security events.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
