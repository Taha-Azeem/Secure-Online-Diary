import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type PendingEntry = {
  ownerId: string;
  titleEncrypted: string;
  contentEncrypted: string;
  categoryEncrypted: string;
  securityLevelEncrypted: string;
  salt: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
  _fallback?: boolean;
};

const LOCAL_ENTRIES_KEY = 'localEntries';

function safeParseEntries(raw: string | null): PendingEntry[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingEntry[]) : [];
  } catch {
    return [];
  }
}

function readLocalEntries(): PendingEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  return safeParseEntries(window.localStorage.getItem(LOCAL_ENTRIES_KEY));
}

function writeLocalEntries(entries: PendingEntry[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries));
}

export function getPendingEntriesForUser(userId: string) {
  return readLocalEntries().filter((entry) => entry.ownerId === userId && entry._fallback);
}

export async function syncPendingEntries(userId: string) {
  if (typeof window === 'undefined') {
    return 0;
  }

  const localEntries = readLocalEntries();
  const pendingEntries = localEntries.filter((entry) => entry.ownerId === userId && entry._fallback);

  if (pendingEntries.length === 0) {
    return 0;
  }

  let syncedCount = 0;
  const remainingEntries: PendingEntry[] = [];

  for (const entry of localEntries) {
    if (entry.ownerId !== userId || !entry._fallback) {
      remainingEntries.push(entry);
      continue;
    }

    try {
      await addDoc(collection(db, 'entries'), {
        ownerId: entry.ownerId,
        titleEncrypted: entry.titleEncrypted,
        contentEncrypted: entry.contentEncrypted,
        categoryEncrypted: entry.categoryEncrypted,
        securityLevelEncrypted: entry.securityLevelEncrypted,
        salt: entry.salt,
        iv: entry.iv,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      syncedCount += 1;
    } catch (error) {
      console.warn('Failed to sync pending entry, keeping it locally:', error);
      remainingEntries.push(entry);
    }
  }

  if (syncedCount > 0) {
    writeLocalEntries(remainingEntries);
  }

  return syncedCount;
}
