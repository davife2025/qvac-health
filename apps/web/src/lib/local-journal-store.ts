/**
 * local-journal-store.ts — on-device journal content via IndexedDB.
 *
 * Imports local-db without a file extension — see note in local-db.ts.
 */

import { openDB, getStore, STORE_JOURNAL } from "./local-db";

export { hashContent } from "./local-db";

export interface JournalContent {
  id: string;
  content: string;
  aiResponse?: string;
  savedAt: number;
}

export async function saveContent(entry: JournalContent): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_JOURNAL, "readwrite").put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getContent(id: string): Promise<JournalContent | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_JOURNAL, "readonly").get(id);
    req.onsuccess = () => resolve((req.result as JournalContent) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllContent(): Promise<JournalContent[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_JOURNAL, "readonly").getAll();
    req.onsuccess = () => resolve((req.result as JournalContent[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteContent(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_JOURNAL, "readwrite").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function countContent(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_JOURNAL, "readonly").count();
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}
