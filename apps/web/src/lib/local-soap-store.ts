/**
 * local-soap-store.ts — on-device SOAP content via IndexedDB.
 *
 * Uses shared openDB() from local-db.ts. Types exported cleanly for
 * `import type` consumption in useSOAP.ts.
 */

import { openDB, getStore, STORE_SOAP } from "./local-db";

export { hashContent } from "./local-db";

export interface SOAPFields {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface LocalSOAPNote {
  id: string;
  patientRef: string;
  rawNotes: string;
  soap: SOAPFields;
  durationMs: number;
  modelLabel: string;
  generatedAt: string;
  savedAt: number;
}

export async function saveSOAPNote(note: LocalSOAPNote): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_SOAP, "readwrite").put(note);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSOAPNote(id: string): Promise<LocalSOAPNote | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_SOAP, "readonly").get(id);
    req.onsuccess = () => resolve((req.result as LocalSOAPNote) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllSOAPNotes(): Promise<LocalSOAPNote[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_SOAP, "readonly").getAll();
    req.onsuccess = () => resolve((req.result as LocalSOAPNote[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSOAPNote(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_SOAP, "readwrite").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function countSOAPNotes(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db, STORE_SOAP, "readonly").count();
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}
