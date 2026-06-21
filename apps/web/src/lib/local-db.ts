/**
 * local-db.ts — single source of truth for all IndexedDB access.
 *
 * One openDB() call, one version, both stores created here.
 * Both local-journal-store and local-soap-store import from this module.
 *
 * Note: no file extension on imports — Next.js's bundler resolution
 * (moduleResolution: "Bundler") resolves extensionless TS imports
 * correctly via webpack/SWC. Using explicit ".js" extensions here
 * (copied from the Node-ESM apps/api codebase, which DOES need them)
 * causes "Module not found" in Next.js's build step.
 */

export const DB_NAME = "qvac-health";
export const DB_VERSION = 2;

export const STORE_JOURNAL = "journal_content";
export const STORE_SOAP = "soap_content";

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const oldVersion = e.oldVersion;

      if (oldVersion < 1) {
        db.createObjectStore(STORE_JOURNAL, { keyPath: "id" });
      }

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE_SOAP)) {
          const soapStore = db.createObjectStore(STORE_SOAP, { keyPath: "id" });
          soapStore.createIndex("patientRef", "patientRef", { unique: false });
        }
      }
    };

    req.onsuccess = () => resolve(req.result);

    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };

    req.onblocked = () => {
      console.warn("[local-db] DB upgrade blocked — close other tabs and reload.");
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
 * Uses Web Crypto's subtle.digest, available in all modern browsers without
 * needing Node's crypto module or any lib-target gymnastics.
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
