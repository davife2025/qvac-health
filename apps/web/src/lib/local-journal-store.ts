/**
 * localJournalStore — on-device content storage using IndexedDB.
 *
 * Privacy design:
 *   - ALL journal text lives here, never in Supabase
 *   - Supabase only gets the SHA-256 hash + mood + tags (via the API)
 *   - This store is keyed by the same UUIDs as the Supabase metadata rows
 *
 * We wrap IndexedDB with a simple promise API rather than pulling in a
 * library dep — keeps the bundle lean and the privacy story clean.
 */

const DB_NAME = "qvac-health";
const DB_VERSION = 1;
const STORE_JOURNAL = "journal_content";

interface JournalContent {
  id: string;          // matches Supabase journal_entries.id
  content: string;     // raw journal text
  aiResponse?: string; // companion LLM response
  savedAt: number;     // unix ms
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_JOURNAL)) {
        db.createObjectStore(STORE_JOURNAL, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(
  db: IDBDatabase,
  mode: IDBTransactionMode
): IDBObjectStore {
  return db.transaction(STORE_JOURNAL, mode).objectStore(STORE_JOURNAL);
}

export async function saveContent(entry: JournalContent): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readwrite").put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getContent(id: string): Promise<JournalContent | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readonly").get(id);
    req.onsuccess = () => resolve((req.result as JournalContent) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllContent(): Promise<JournalContent[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readonly").getAll();
    req.onsuccess = () => resolve(req.result as JournalContent[]);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteContent(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readwrite").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Compute SHA-256 hash of content string (for Supabase metadata) */
export async function hashContent(content: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
