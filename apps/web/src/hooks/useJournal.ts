"use client";

import { useState, useEffect, useCallback } from "react";
import {
  saveContent,
  getContent,
  getAllContent,
  deleteContent,
  hashContent,
} from "@/lib/local-journal-store";
import { createClient } from "@/lib/supabase/client";
import type { MoodLevel } from "@qvac-health/types";

export interface LocalEntry {
  id: string;
  content: string;
  aiResponse?: string;
  mood: MoodLevel;
  tags: string[];
  contentHash: string;
  createdAt: string;
  updatedAt: string;
}

interface MetadataRow {
  id: string;
  mood: MoodLevel;
  tags: string[];
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export function useJournal(userId: string) {
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  /** Merge Supabase metadata rows with IndexedDB content */
  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch metadata from Supabase
      const { data: rows, error: sbErr } = await supabase
        .from("journal_entries")
        .select("id, mood, tags, content_hash, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (sbErr) throw sbErr;

      // Fetch all local content
      const allLocal = await getAllContent();
      const localMap = new Map(allLocal.map((l) => [l.id, l]));

      // Merge
      const merged: LocalEntry[] = (rows ?? []).map((row: MetadataRow) => {
        const local = localMap.get(row.id);
        return {
          id: row.id,
          content: local?.content ?? "",
          aiResponse: local?.aiResponse,
          mood: row.mood,
          tags: row.tags,
          contentHash: row.content_hash,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });

      setEntries(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  /**
   * Save a new journal entry:
   * 1. Hash content
   * 2. POST metadata to API → get UUID back
   * 3. Save content + UUID to IndexedDB
   * 4. Update local state
   */
  const saveEntry = useCallback(
    async (content: string, mood: MoodLevel, tags: string[]) => {
      const contentHash = await hashContent(content);

      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/journal/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contentHash, mood, tags }),
      });

      if (!res.ok) throw new Error("Failed to save metadata");
      const { data: row } = await res.json();

      // Save content locally
      await saveContent({
        id: row.id,
        content,
        savedAt: Date.now(),
      });

      const newEntry: LocalEntry = {
        id: row.id,
        content,
        mood,
        tags,
        contentHash,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    },
    [userId]
  );

  /**
   * Attach AI response to an existing entry (local only — stays on device)
   */
  const attachAIResponse = useCallback(
    async (id: string, aiResponse: string) => {
      const local = await getContent(id);
      if (!local) return;

      await saveContent({ ...local, aiResponse });
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, aiResponse } : e))
      );
    },
    []
  );

  /** Delete entry from both Supabase metadata and IndexedDB */
  const deleteEntry = useCallback(
    async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      await fetch(`/api/journal/entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      await deleteContent(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    []
  );

  return {
    entries,
    loading,
    error,
    saveEntry,
    attachAIResponse,
    deleteEntry,
    refresh: loadEntries,
  };
}
