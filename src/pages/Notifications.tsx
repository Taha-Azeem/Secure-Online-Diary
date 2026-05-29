import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  clearLocalNotificationsForUser,
  deleteLocalNotification,
  getLocalNotificationsForUser,
  syncPendingNotifications,
  updateLocalNotificationStatus,
} from '../lib/notifications';
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
  _fallback?: boolean;
};

export default function Notifications() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const sortByNewest = (items: NotificationItem[]) => {
    return [...items].sort((left, right) => {
      const getTime = (value: any) => {
        if (!value) return 0;
        if (typeof value.toDate === 'function') return value.toDate().getTime();
        if (typeof value.toMillis === 'function') return value.toMillis();
        if (value instanceof Date) return value.getTime();
        return 0;
      };

      return getTime(right.timestamp) - getTime(left.timestamp);
    });
  };

  const loadLocalNotifications = (existing: NotificationItem[] = []) => {
    const local = getLocalNotificationsForUser(user?.uid || '');
    if (!local.length) return existing;

    const mapped: NotificationItem[] = local.map((notification, idx) => ({
      id: notification.id || `local-notification-${idx}-${notification.timestamp}`,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      status: notification.status,
      timestamp: notification.timestamp ? new Date(notification.timestamp) : new Date(),
      _fallback: true,
    }));

    const remoteIds = new Set(existing.map((item) => item.id));
    const merged = [...existing];
    for (const notification of mapped) {
      if (!remoteIds.has(notification.id)) {
        merged.unshift(notification);
      }
    }
    return merged;
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as NotificationItem[];
        setNotifications(sortByNewest(loadLocalNotifications(list)));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setNotifications(sortByNewest(loadLocalNotifications([])));
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
      if (id.startsWith('local-notification-') || id.includes('local-notification-')) {
        updateLocalNotificationStatus(user?.uid || '', id, 'read');
        setNotifications((current) => current.map((notification) => (
          notification.id === id ? { ...notification, status: 'read' } : notification
        )));
        showToast('Notification marked as read.', 'success');
        return;
      }

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
      if (id.startsWith('local-notification-') || id.includes('local-notification-')) {
        deleteLocalNotification(user?.uid || '', id);
        setNotifications((current) => current.filter((notification) => notification.id !== id));
        showToast('Notification removed.', 'success');
        return;
      }

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
        if (n.id.startsWith('local-notification-')) {
          return;
        }
        const docRef = doc(db, 'notifications', n.id);
        batch.delete(docRef);
      });
      await batch.commit();
      clearLocalNotificationsForUser(user?.uid || '');
      setNotifications((current) => current.filter((notification) => !notification.id.startsWith('local-notification-')));
      showToast('Cleared all notifications.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to clear notifications.', 'error');
    }
  };

  useEffect(() => {
    if (!user) return;
    void syncPendingNotifications(user.uid).catch((err) => {
      console.warn('Notification sync failed:', err);
    });
  }, [user]);

  return (
    <div className="mx-auto max-w-container-max-width px-4 py-6 md:px-margin-lg md:py-8 space-y-8 overflow-x-hidden">
      {/* Title */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 border border-primary-container/40 text-primary-fixed-dim whitespace-nowrap">
            <Bell size={14} className="text-[#06b6d4]" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {notifications.filter((n) => n.status === 'unread').length} Pending Alerts
            </span>
          </div>
          <h1 className="cyan-glow-text text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl md:text-[40px]">Notifications</h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Keep track of security warnings, login triggers, and network status notifications.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <button
            onClick={handleMarkAllRead}
            disabled={notifications.filter((n) => n.status === 'unread').length === 0}
            className="w-full px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 active:scale-95 transition-all text-xs font-bold uppercase tracking-widest text-on-surface-variant disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
          >
            Mark All Read
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
            className="w-full px-5 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 active:scale-95 transition-all text-xs font-bold uppercase tracking-widest text-red-400 disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
          >
            Clear All
          </button>
        </div>
      </header>

      {/* Tabs / Filter Controls */}
      <div className="flex gap-4 overflow-x-auto border-b border-outline-variant/30 pr-1 sm:gap-6">
        <button
          onClick={() => setFilter('all')}
          className={`relative whitespace-nowrap pb-4 text-sm font-bold transition-all ${
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
          className={`relative whitespace-nowrap pb-4 text-sm font-bold transition-all ${
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
              className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 min-h-24 animate-pulse flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2 w-full sm:w-2/3">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-full" />
              </div>
              <div className="h-10 w-full bg-white/10 rounded-xl sm:w-24" />
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 sm:p-16 text-center flex flex-col items-center gap-6 shadow-2xl">
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
                className={`flex flex-col gap-4 p-5 border border-white/10 rounded-2xl backdrop-blur-xl ${borderAccent} ${bgGlow} transition-all duration-300 hover:border-white/20 sm:flex-row sm:items-start sm:justify-between`}
              >
                <div className="flex gap-4 min-w-0">
                  <div className="mt-1">{icon}</div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="min-w-0 truncate font-bold text-base text-white leading-tight select-none">
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

                <div className="flex items-center gap-2 self-end shrink-0 sm:self-auto">
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
