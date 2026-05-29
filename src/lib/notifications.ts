import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type DiaryNotificationAction = 'created' | 'deleted' | 'synced' | 'purged';
export type NotificationPriority = 'low' | 'medium' | 'high';

export type StoredNotification = {
  id?: string;
  userId: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: 'unread' | 'read';
  timestamp: any;
  _fallback?: boolean;
};

type DiaryNotificationOptions = {
  title?: string;
  message?: string;
  priority?: NotificationPriority;
};

const LOCAL_NOTIFICATIONS_KEY = 'localNotifications';

const DEFAULT_NOTIFICATION_TEMPLATES: Record<DiaryNotificationAction, Required<DiaryNotificationOptions>> = {
  created: {
    title: 'Entry Saved',
    message: 'A new diary entry was encrypted and added to your vault.',
    priority: 'low',
  },
  deleted: {
    title: 'Entry Deleted',
    message: 'A diary entry was removed from your vault.',
    priority: 'medium',
  },
  synced: {
    title: 'Entry Synced',
    message: 'A pending diary entry was uploaded to Firestore.',
    priority: 'low',
  },
  purged: {
    title: 'Vault Cleared',
    message: 'All diary entries were deleted from your vault.',
    priority: 'high',
  },
};

function safeParseNotifications(raw: string | null): StoredNotification[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredNotification[]) : [];
  } catch {
    return [];
  }
}

function readLocalNotifications(): StoredNotification[] {
  if (typeof window === 'undefined') {
    return [];
  }

  return safeParseNotifications(window.localStorage.getItem(LOCAL_NOTIFICATIONS_KEY));
}

function writeLocalNotifications(notifications: StoredNotification[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export function getPendingNotificationsForUser(userId: string) {
  return readLocalNotifications().filter((notification) => notification.userId === userId && notification._fallback);
}

export function getLocalNotificationsForUser(userId: string) {
  return readLocalNotifications().filter((notification) => notification.userId === userId);
}

export function updateLocalNotificationStatus(userId: string, notificationId: string, status: 'unread' | 'read') {
  const notifications = readLocalNotifications();
  const updated = notifications.map((notification) => (
    notification.userId === userId && notification.id === notificationId
      ? { ...notification, status }
      : notification
  ));
  writeLocalNotifications(updated);
}

export function deleteLocalNotification(userId: string, notificationId: string) {
  const notifications = readLocalNotifications();
  const updated = notifications.filter((notification) => (
    notification.userId !== userId || notification.id !== notificationId
  ));
  writeLocalNotifications(updated);
}

export function clearLocalNotificationsForUser(userId: string) {
  const notifications = readLocalNotifications();
  const updated = notifications.filter((notification) => notification.userId !== userId);
  writeLocalNotifications(updated);
}

export async function syncPendingNotifications(userId: string) {
  if (typeof window === 'undefined') {
    return 0;
  }

  const localNotifications = readLocalNotifications();
  const pendingNotifications = localNotifications.filter((notification) => notification.userId === userId && notification._fallback);

  if (pendingNotifications.length === 0) {
    return 0;
  }

  let syncedCount = 0;
  const remainingNotifications: StoredNotification[] = [];

  for (const notification of localNotifications) {
    if (notification.userId !== userId || !notification._fallback) {
      remainingNotifications.push(notification);
      continue;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        status: notification.status,
        timestamp: serverTimestamp(),
      });
      syncedCount += 1;
    } catch (error) {
      console.warn('Failed to sync pending notification, keeping it locally:', error);
      remainingNotifications.push(notification);
    }
  }

  if (syncedCount > 0) {
    writeLocalNotifications(remainingNotifications);
  }

  return syncedCount;
}

export async function createDiaryNotification(
  userId: string,
  action: DiaryNotificationAction,
  options: DiaryNotificationOptions = {},
) {
  const template = DEFAULT_NOTIFICATION_TEMPLATES[action];

  const notificationPayload: StoredNotification = {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `local-notification-${Date.now()}`,
    userId,
    title: options.title ?? template.title,
    message: options.message ?? template.message,
    priority: options.priority ?? template.priority,
    status: 'unread',
    timestamp: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, 'notifications'), {
      userId: notificationPayload.userId,
      title: notificationPayload.title,
      message: notificationPayload.message,
      priority: notificationPayload.priority,
      status: notificationPayload.status,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Notification write failed, saving locally instead:', error);
    try {
      const local = readLocalNotifications();
      local.push({ ...notificationPayload, _fallback: true });
      writeLocalNotifications(local);
    } catch (localErr) {
      console.warn('Failed to save local fallback notification:', localErr);
    }
  }
}
