"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  saveContent,
  getContent,
  getAllContent,
  deleteContent,
} from "@/lib/local-journal-store";
import { hashContent } from "@/lib/local-db";
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

const PAGE_SIZE = 50;

export function useJournal(userId: string) {
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const pageRef = useRef(0);
  const supabase = useMemo(() => createClient(), []);
  const savingRef = useRef(false);

  const loadEntries = useCallback(async (pageIndex = 0): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: rows, error: sbErr } = await supabase
        .from("journal_entries")
        .select("id, mood, tags, content_hash, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (sbErr) throw sbErr;

      const allLocal = await getAllContent();
      const localMap = new Map(allLocal.map((l) => [l.id, l]));

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

      setEntries((prev) => (pageIndex === 0 ? merged : [...prev, ...merged]));
      setHasMore((rows ?? []).length === PAGE_SIZE);
      pageRef.current = pageIndex;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    loadEntries(0);
  }, [loadEntries]);

  const loadMore = useCallback((): void => {
    if (!loading && hasMore) {
      loadEntries(pageRef.current + 1);
    }
  }, [loading, hasMore, loadEntries]);

  const saveEntry = useCallback(
    async (content: string, mood: MoodLevel, tags: string[]): Promise<LocalEntry> => {
      if (savingRef.current) throw new Error("Save already in progress");
      savingRef.current = true;
      try {
        const contentHash = await hashContent(content);
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

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to save metadata");
        }
        const { data: row } = await res.json();

        await saveContent({ id: row.id, content, savedAt: Date.now() });

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
      } finally {
        savingRef.current = false;
      }
    },
    [supabase]
  );

  const attachAIResponse = useCallback(
    async (id: string, aiResponse: string): Promise<void> => {
      const local = await getContent(id);
      if (!local) return;
      await saveContent({ ...local, aiResponse });
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, aiResponse } : e))
      );
    },
    []
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const prevEntries = entries;
      setEntries((prev) => prev.filter((e) => e.id !== id));

      try {
        const res = await fetch(`/api/journal/entries/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok && res.status !== 404) {
          throw new Error("Failed to delete entry");
        }

        await deleteContent(id);
      } catch (err) {
        setEntries(prevEntries);
        throw err;
      }
    },
    [supabase, entries]
  );

  return {
    entries,
    loading,
    error,
    hasMore,
    loadMore,
    saveEntry,
    attachAIResponse,
    deleteEntry,
    refresh: () => loadEntries(0),
  };
}
