"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  saveSOAPNote,
  getAllSOAPNotes,
  deleteSOAPNote,
} from "@/lib/local-soap-store";
import type { LocalSOAPNote, SOAPFields } from "@/lib/local-soap-store";
import { hashContent } from "@/lib/local-db";
import { createClient } from "@/lib/supabase/client";

// Re-export as types only — fixes potential webpack tree-shake issue where
// a type re-exported via `export type { X }` from a value-importing module
// can fail strict build-mode resolution if the original wasn't itself
// `import type`.
export type { LocalSOAPNote, SOAPFields };

export type GenerationState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "done"; note: LocalSOAPNote }
  | { status: "error"; message: string };

interface SOAPApiResponse {
  ok: boolean;
  data?: {
    soap: SOAPFields;
    durationMs: number;
    modelLabel: string;
    generatedAt: string;
  };
  error?: string;
}

interface MetaApiResponse {
  ok: boolean;
  data?: { id: string };
  error?: string;
}

export function useSOAP(_clinicianId: string) {
  const [notes, setNotes] = useState<LocalSOAPNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [generation, setGeneration] = useState<GenerationState>({ status: "idle" });

  const supabase = useMemo(() => createClient(), []);

  const loadNotes = useCallback(async (): Promise<void> => {
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

  const generate = useCallback(
    async (rawNotes: string, patientRef: string): Promise<LocalSOAPNote> => {
      setGeneration({ status: "generating" });

      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;

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
          const errBody: { error?: string } = await res
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(errBody.error ?? `HTTP ${res.status}`);
        }

        const json: SOAPApiResponse = await res.json();
        if (!json.data) {
          throw new Error("Empty response from server");
        }

        soap = json.data.soap;
        aiData = {
          durationMs: json.data.durationMs,
          modelLabel: json.data.modelLabel,
          generatedAt: json.data.generatedAt,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        setGeneration({ status: "error", message });
        throw err;
      }

      // Generate a temp ID without relying on crypto.randomUUID() —
      // avoids any lib-target ambiguity between dev and build environments.
      const tempId = generateTempId();
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

      let finalNote: LocalSOAPNote = tempNote;

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

        const metaJson: MetaApiResponse = await metaRes.json();
        if (!metaJson.data) throw new Error("Empty metadata response");

        finalNote = { ...tempNote, id: metaJson.data.id };

        await saveSOAPNote(finalNote);
        await deleteSOAPNote(tempId);
        setNotes((prev) =>
          prev.map((n) => (n.id === tempId ? finalNote : n))
        );
      } catch (syncErr) {
        console.warn("[useSOAP] Metadata sync failed, note saved locally:", syncErr);
      }

      setGeneration({ status: "done", note: finalNote });
      return finalNote;
    },
    [supabase]
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult.data.session?.access_token;
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

  const resetGeneration = useCallback((): void => {
    setGeneration({ status: "idle" });
  }, []);

  return { notes, loading, generation, generate, deleteNote, resetGeneration };
}

/**
 * Generates a temporary client-side ID without relying on crypto.randomUUID(),
 * which requires lib.dom.d.ts (TS 5.2+) or @types/node ≥ 18.16 to type-check
 * cleanly. This avoids any ambiguity between local dev and CI build environments
 * having different global type definitions available.
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
