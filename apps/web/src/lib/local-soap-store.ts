/**
 * localSOAPStore — on-device SOAP note content storage via IndexedDB.
 *
 * Privacy design:
 *   - Raw session notes AND generated SOAP JSON live here only
 *   - Supabase only gets: id, patient_ref, content_hash
 *   - Clinical data never leaves the device
 */

const DB_NAME = "qvac-health";
const DB_VERSION = 2; // bumped from S4's version 1 to add soap_content store
const STORE_JOURNAL = "journal_content";
const STORE_SOAP = "soap_content";

export interface SOAPFields {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface LocalSOAPNote {
  id: string;           // matches Supabase soap_notes.id
  patientRef: string;
  rawNotes: string;     // original clinician input
  soap: SOAPFields;     // generated structured output
  durationMs: number;
  modelLabel: string;
  generatedAt: string;
  savedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      // Ensure journal store still exists (from v1)
      if (!db.objectStoreNames.contains(STORE_JOURNAL)) {
        db.createObjectStore(STORE_JOURNAL, { keyPath: "id" });
      }
      // New in v2
      if (!db.objectStoreNames.contains(STORE_SOAP)) {
        const store = db.createObjectStore(STORE_SOAP, { keyPath: "id" });
        store.createIndex("patientRef", "patientRef", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store);
}

export async function saveSOAPNote(note: LocalSOAPNote): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, STORE_SOAP, "readwrite").put(note);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSOAPNote(id: string): Promise<LocalSOAPNote | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, STORE_SOAP, "readonly").get(id);
    req.onsuccess = () => resolve((req.result as LocalSOAPNote) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllSOAPNotes(): Promise<LocalSOAPNote[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, STORE_SOAP, "readonly").getAll();
    req.onsuccess = () => resolve((req.result as LocalSOAPNote[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSOAPNote(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, STORE_SOAP, "readwrite").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function hashContent(content: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
