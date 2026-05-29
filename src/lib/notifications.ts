import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type DiaryNotificationAction = 'created' | 'deleted' | 'synced' | 'purged';
export type NotificationPriority = 'low' | 'medium' | 'high';

type DiaryNotificationOptions = {
  title?: string;
  message?: string;
  priority?: NotificationPriority;
};

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

export async function createDiaryNotification(
  userId: string,
  action: DiaryNotificationAction,
  options: DiaryNotificationOptions = {},
) {
  const template = DEFAULT_NOTIFICATION_TEMPLATES[action];

  return addDoc(collection(db, 'notifications'), {
    userId,
    title: options.title ?? template.title,
    message: options.message ?? template.message,
    priority: options.priority ?? template.priority,
    status: 'unread',
    timestamp: serverTimestamp(),
  });
}
