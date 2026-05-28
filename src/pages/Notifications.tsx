import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { 
  Bell, 
  Check, 
  Trash2, 
  MailOpen, 
  AlertCircle, 
  Info,
  CheckCircle,
  Inbox
} from 'lucide-react';

type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'unread' | 'read';
  timestamp: any;
};

export default function Notifications() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as NotificationItem[];
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (filter === 'unread') return notif.status === 'unread';
      return true;
    });
  }, [notifications, filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { status: 'read' });
      showToast('Notification marked as read.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update notification.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => n.status === 'unread');
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        const docRef = doc(db, 'notifications', n.id);
        batch.update(docRef, { status: 'read' });
      });
      await batch.commit();
      showToast('All notifications marked as read.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to mark all as read.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      showToast('Notification removed.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete notification.', 'error');
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm('Clear all notifications permanently?')) return;

    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        const docRef = doc(db, 'notifications', n.id);
        batch.delete(docRef);
      });
      await batch.commit();
      showToast('Cleared all notifications.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to clear notifications.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-container-max-width px-4 py-6 md:px-margin-lg md:py-8 space-y-8">
      {/* Title */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 border border-primary-container/40 text-primary-fixed-dim whitespace-nowrap">
            <Bell size={14} className="text-[#06b6d4]" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {notifications.filter((n) => n.status === 'unread').length} Pending Alerts
            </span>
          </div>
          <h1 className="cyan-glow-text text-4xl font-extrabold tracking-tight text-on-surface md:text-[40px]">Notifications</h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Keep track of security warnings, login triggers, and network status notifications.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex gap-4">
          <button
            onClick={handleMarkAllRead}
            disabled={notifications.filter((n) => n.status === 'unread').length === 0}
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 active:scale-95 transition-all text-xs font-bold uppercase tracking-widest text-on-surface-variant disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark All Read
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
            className="px-5 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 active:scale-95 transition-all text-xs font-bold uppercase tracking-widest text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </header>

      {/* Tabs / Filter Controls */}
      <div className="flex border-b border-outline-variant/30 gap-6">
        <button
          onClick={() => setFilter('all')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            filter === 'all' ? 'text-[#06b6d4]' : 'text-on-surface-variant hover:text-white'
          }`}
        >
          All Notifications
          {filter === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#06b6d4]" />
          )}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            filter === 'unread' ? 'text-[#06b6d4]' : 'text-on-surface-variant hover:text-white'
          }`}
        >
          Unread
          {filter === 'unread' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#06b6d4]" />
          )}
        </button>
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="bg-white/5 border border-white/10 rounded-2xl p-6 h-24 animate-pulse flex justify-between items-center"
            >
              <div className="space-y-2 w-2/3">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-full" />
              </div>
              <div className="h-10 w-24 bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center flex flex-col items-center gap-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-white/5 flex items-center justify-center text-on-surface-variant opacity-40">
            <Inbox size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Inbox is Clear</h3>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
              {filter === 'unread' 
                ? "You've read all notifications in this channel." 
                : "No notifications found in your private archive."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notif) => {
            // Colors matching request: cyan, purple, green, red
            let borderAccent = 'border-l-4 border-l-cyan-500';
            let bgGlow = 'bg-white/5';
            let icon = <Info size={20} className="text-[#06b6d4] shrink-0" />;

            if (notif.priority === 'high') {
              borderAccent = 'border-l-4 border-l-red-500';
              icon = <AlertCircle size={20} className="text-[#ef4444] shrink-0" />;
            } else if (notif.priority === 'medium') {
              borderAccent = 'border-l-4 border-l-purple-500';
              icon = <AlertCircle size={20} className="text-[#8b5cf6] shrink-0" />;
            } else if (notif.priority === 'low') {
              borderAccent = 'border-l-4 border-l-green-500';
              icon = <CheckCircle size={20} className="text-[#10b981] shrink-0" />;
            }

            if (notif.status === 'read') {
              bgGlow = 'bg-white/[0.02] opacity-60';
            }

            return (
              <div
                key={notif.id}
                className={`flex items-start justify-between gap-6 p-5 border border-white/10 rounded-2xl backdrop-blur-xl ${borderAccent} ${bgGlow} transition-all duration-300 hover:border-white/20`}
              >
                <div className="flex gap-4 min-w-0">
                  <div className="mt-1">{icon}</div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-base text-white truncate leading-tight select-none">
                        {notif.title}
                      </h4>
                      {notif.status === 'unread' && (
                        <span className="h-2 w-2 rounded-full bg-[#06b6d4] animate-pulse shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed select-text">
                      {notif.message}
                    </p>
                    <p className="text-[10px] font-mono text-on-surface-variant/60 pt-1 select-none">
                      {notif.timestamp ? format(notif.timestamp.toDate(), 'PPP p') : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {notif.status === 'unread' && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2.5 bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-[#06b6d4] rounded-xl active:scale-90 transition-all border border-white/5"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-red-400 rounded-xl active:scale-90 transition-all border border-white/5"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
