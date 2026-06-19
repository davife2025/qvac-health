"use client";

import { useState, useEffect, useCallback } from "react";
import {
  saveSOAPNote,
  getAllSOAPNotes,
  deleteSOAPNote,
  hashContent,
  type LocalSOAPNote,
  type SOAPFields,
} from "@/lib/local-soap-store";
import { createClient } from "@/lib/supabase/client";

export type { LocalSOAPNote, SOAPFields };

export type GenerationState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "done"; note: LocalSOAPNote }
  | { status: "error"; message: string };

export function useSOAP(clinicianId: string) {
  const [notes, setNotes] = useState<LocalSOAPNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [generation, setGeneration] = useState<GenerationState>({ status: "idle" });

  const supabase = createClient();

  // Load from local IndexedDB + sync with Supabase metadata on mount
  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const local = await getAllSOAPNotes();
      // Sort newest first
      local.sort((a, b) => b.savedAt - a.savedAt);
      setNotes(local);
    } catch (err) {
      console.error("Failed to load SOAP notes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  /**
   * Generate a SOAP note:
   * 1. POST to /api/ai/soap (QVAC MedPsy LLM)
   * 2. Save full note locally (IndexedDB)
   * 3. POST metadata to /api/soap/notes (Supabase)
   */
  const generate = useCallback(
    async (rawNotes: string, patientRef: string) => {
      setGeneration({ status: "generating" });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const token = session.access_token;

        // Call QVAC MedPsy LLM via API
        const res = await fetch("/api/ai/soap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rawNotes, patientRef }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const { data } = await res.json();
        const soap = data.soap as SOAPFields;

        // Hash the SOAP content for metadata sync
        const contentHash = await hashContent(JSON.stringify(soap));

        // Save metadata to Supabase to get a UUID back
        const metaRes = await fetch("/api/soap/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ patientRef, contentHash }),
        });

        if (!metaRes.ok) throw new Error("Failed to save metadata");
        const { data: metaRow } = await metaRes.json();

        const newNote: LocalSOAPNote = {
          id: metaRow.id,
          patientRef,
          rawNotes,
          soap,
          durationMs: data.durationMs,
          modelLabel: data.modelLabel,
          generatedAt: data.generatedAt,
          savedAt: Date.now(),
        };

        // Persist locally
        await saveSOAPNote(newNote);
        setNotes((prev) => [newNote, ...prev]);
        setGeneration({ status: "done", note: newNote });

        return newNote;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        setGeneration({ status: "error", message });
        throw err;
      }
    },
    [clinicianId]
  );

  const deleteNote = useCallback(async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    await fetch(`/api/soap/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    await deleteSOAPNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const resetGeneration = useCallback(() => {
    setGeneration({ status: "idle" });
  }, []);

  return {
    notes,
    loading,
    generation,
    generate,
    deleteNote,
    resetGeneration,
  };
}
