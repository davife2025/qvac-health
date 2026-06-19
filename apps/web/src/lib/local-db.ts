/**
 * local-db.ts — single source of truth for all IndexedDB access.
 *
 * Fixes:
 *   - S4's local-journal-store opened DB at v1
 *   - S5's local-soap-store opened DB at v2
 *   - Two concurrent openDB() calls to the same DB name at different versions
 *     causes a versionchange deadlock in production browsers.
 *
 * Solution: one openDB() call, one version, both stores created here.
 * Both local-journal-store and local-soap-store import from this module.
 */

export const DB_NAME = "qvac-health";
export const DB_VERSION = 2;

export const STORE_JOURNAL = "journal_content";
export const STORE_SOAP = "soap_content";

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  // Singleton promise — only one open() call ever in flight
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const oldVersion = e.oldVersion;

      // v1 → journal store
      if (oldVersion < 1) {
        db.createObjectStore(STORE_JOURNAL, { keyPath: "id" });
      }

      // v2 → soap store
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE_SOAP)) {
          const soapStore = db.createObjectStore(STORE_SOAP, { keyPath: "id" });
          soapStore.createIndex("patientRef", "patientRef", { unique: false });
        }
      }
    };

    req.onsuccess = () => resolve(req.result);

    req.onerror = () => {
      dbPromise = null; // allow retry
      reject(req.error);
    };

    // Another tab has a connection open at an older version
    req.onblocked = () => {
      console.warn(
        "[local-db] DB upgrade blocked — close other tabs and reload."
      );
    };
  });

  return dbPromise;
}

export function getStore(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode
): IDBObjectStore {
  return db.transaction(storeName, mode).objectStore(storeName);
}

/**
 * SHA-256 hash of a string — used to generate content_hash for Supabase metadata.
 * Single definition, imported by both journal and SOAP stores.
 */
export async function hashContent(content: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
