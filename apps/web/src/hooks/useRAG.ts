"use client";

import { useCallback, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RAGSearchResult } from "@qvac-health/types";

export type { RAGSearchResult };

// ─── Journal RAG ─────────────────────────────────────────────────────────────

export function useJournalRAG() {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<RAGSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = useRef(createClient()).current;

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase]);

  const ingest = useCallback(async (params: {
    entryId: string;
    content: string;
    mood: number;
    tags: string[];
    createdAt: string;
  }) => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch("/api/rag/ingest/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Bug fix: 503 EMBEDDINGS_NOT_LOADED is expected when model isn't
        // loaded yet — log at debug level, not as an error
        if (body.code === "EMBEDDINGS_NOT_LOADED") {
          console.debug("[RAG] Skipping ingest — embeddings not loaded yet");
          return;
        }
        console.warn("[RAG] Journal ingest failed:", body.error);
      }
    } catch (err) {
      // Network errors during background ingest are non-blocking
      console.warn("[RAG] Journal ingest network error (non-blocking):", err);
    }
  }, [getToken]);

  const search = useCallback(async (query: string, topK = 4) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    const token = await getToken();
    if (!token) {
      setSearching(false);
      return;
    }

    try {
      const res = await fetch("/api/rag/search/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, topK }),
      });

      const json = await res.json();
      if (json.ok) {
        setResults(json.data);
      } else {
        setError(json.error);
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [getToken]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { ingest, search, clear, searching, results, error };
}

// ─── SOAP RAG ─────────────────────────────────────────────────────────────────

export function useSOAPRAG() {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<RAGSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = useRef(createClient()).current;

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase]);

  const ingest = useCallback(async (params: {
    noteId: string;
    patientRef: string;
    soap: { subjective: string; objective: string; assessment: string; plan: string };
    generatedAt: string;
  }) => {
    const token = await getToken();
    if (!token) return;

    const soapText = [
      `Subjective: ${params.soap.subjective}`,
      `Objective: ${params.soap.objective}`,
      `Assessment: ${params.soap.assessment}`,
      `Plan: ${params.soap.plan}`,
    ].join("\n\n");

    try {
      const res = await fetch("/api/rag/ingest/soap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          noteId: params.noteId,
          patientRef: params.patientRef,
          soapText,
          generatedAt: params.generatedAt,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.code === "EMBEDDINGS_NOT_LOADED") {
          console.debug("[RAG] Skipping SOAP ingest — embeddings not loaded yet");
          return;
        }
        console.warn("[RAG] SOAP ingest failed:", body.error);
      }
    } catch (err) {
      console.warn("[RAG] SOAP ingest network error (non-blocking):", err);
    }
  }, [getToken]);

  const search = useCallback(async (
    query: string,
    options: { patientRef?: string; topK?: number } = {}
  ) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    const token = await getToken();
    if (!token) {
      setSearching(false);
      return;
    }

    try {
      const res = await fetch("/api/rag/search/soap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          topK: options.topK ?? 5,
          patientRef: options.patientRef,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setResults(json.data);
      } else {
        setError(json.error);
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [getToken]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { ingest, search, clear, searching, results, error };
}
