"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  saveSOAPNote,
  getAllSOAPNotes,
  deleteSOAPNote,
  type LocalSOAPNote,
  type SOAPFields,
} from "@/lib/local-soap-store";
import { hashContent } from "@/lib/local-db";
import { createClient } from "@/lib/supabase/client";

export type { LocalSOAPNote, SOAPFields };

export type GenerationState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "done"; note: LocalSOAPNote }
  | { status: "error"; message: string };

export function useSOAP(_clinicianId: string) {
  const [notes, setNotes] = useState<LocalSOAPNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [generation, setGeneration] = useState<GenerationState>({ status: "idle" });

  const supabase = useMemo(() => createClient(), []);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const local = await getAllSOAPNotes();
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

  // Bug fix: removed `clinicianId` from deps — it was never used inside
  // the callback, causing unnecessary recreation on every render.
  const generate = useCallback(
    async (rawNotes: string, patientRef: string) => {
      setGeneration({ status: "generating" });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const msg = "Not authenticated";
        setGeneration({ status: "error", message: msg });
        throw new Error(msg);
      }

      const token = session.access_token;
      let soap: SOAPFields;
      let aiData: { durationMs: number; modelLabel: string; generatedAt: string };

      try {
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
        soap = data.soap as SOAPFields;
        aiData = {
          durationMs: data.durationMs,
          modelLabel: data.modelLabel,
          generatedAt: data.generatedAt,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        setGeneration({ status: "error", message });
        throw err;
      }

      // Save locally with temp ID — replaced once Supabase sync succeeds
      const tempId = crypto.randomUUID();
      const contentHash = await hashContent(JSON.stringify(soap));

      const tempNote: LocalSOAPNote = {
        id: tempId,
        patientRef,
        rawNotes,
        soap,
        durationMs: aiData.durationMs,
        modelLabel: aiData.modelLabel,
        generatedAt: aiData.generatedAt,
        savedAt: Date.now(),
      };

      await saveSOAPNote(tempNote);
      setNotes((prev) => [tempNote, ...prev]);

      let finalNote = tempNote;

      try {
        const metaRes = await fetch("/api/soap/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ patientRef, contentHash }),
        });

        if (!metaRes.ok) throw new Error("Metadata sync failed");

        const { data: metaRow } = await metaRes.json();
        finalNote = { ...tempNote, id: metaRow.id };

        await saveSOAPNote(finalNote);
        await deleteSOAPNote(tempId);
        setNotes((prev) => prev.map((n) => (n.id === tempId ? finalNote : n)));
      } catch (syncErr) {
        // Note persists locally with temp ID — user still has it
        console.warn("[useSOAP] Metadata sync failed, note saved locally:", syncErr);
      }

      setGeneration({ status: "done", note: finalNote });
      return finalNote;
    },
    [supabase] // clinicianId intentionally removed — not used inside
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      await fetch(`/api/soap/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      await deleteSOAPNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [supabase]
  );

  const resetGeneration = useCallback(() => {
    setGeneration({ status: "idle" });
  }, []);

  return { notes, loading, generation, generate, deleteNote, resetGeneration };
}
