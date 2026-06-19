"use client";

import { useEffect, useRef } from "react";
import { getAllContent } from "@/lib/local-journal-store";
import { createClient } from "@/lib/supabase/client";
import type { LocalEntry } from "./useJournal";

const BACKFILL_KEY = "qvac-rag-backfill-done-v1";

/**
 * useRAGBackfill — one-time backfill of existing journal entries into local vector store.
 *
 * Bug fix: `entries` was in the useEffect dep array — the effect was re-running
 * every time entries updated (on every pagination load, every new save).
 *
 * Fix: entries are captured via a ref snapshot. The effect only depends on
 * [embeddingsReady, userId] — both stable once set.
 */
export function useRAGBackfill(
  entries: LocalEntry[],
  embeddingsReady: boolean,
  userId: string
) {
  // Snapshot entries in a ref — never in effect deps
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  });

  const runningRef = useRef(false);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    // Only run once embeddingsReady is true and userId is set
    if (!embeddingsReady || !userId) return;
    if (runningRef.current) return;

    const flagKey = `${BACKFILL_KEY}-${userId}`;
    if (localStorage.getItem(flagKey)) return;

    runningRef.current = true;

    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const token = session.access_token;
        const allContent = await getAllContent();
        if (allContent.length === 0) {
          localStorage.setItem(flagKey, "1");
          return;
        }

        console.log(`[RAG backfill] Ingesting ${allContent.length} existing entries...`);

        // Use the ref snapshot — stable, won't change mid-loop
        const entriesSnapshot = entriesRef.current;
        const metaMap = new Map(entriesSnapshot.map((e) => [e.id, e]));

        const BATCH = 5;
        for (let i = 0; i < allContent.length; i += BATCH) {
          const batch = allContent.slice(i, i + BATCH);

          await Promise.allSettled(
            batch.map(async (local) => {
              const meta = metaMap.get(local.id);
              // Skip entries with no content (cloud-only metadata rows)
              if (!local.content?.trim()) return;

              await fetch("/api/rag/ingest/journal", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  entryId: local.id,
                  content: local.content,
                  mood: meta?.mood ?? 3,
                  tags: meta?.tags ?? [],
                  createdAt: meta?.createdAt ?? new Date(local.savedAt).toISOString(),
                }),
              });
            })
          );

          if (i + BATCH < allContent.length) {
            await new Promise((r) => setTimeout(r, 300));
          }
        }

        localStorage.setItem(flagKey, "1");
        console.log(`[RAG backfill] Complete — ${allContent.length} entries indexed`);
      } catch (err) {
        console.warn("[RAG backfill] Failed (non-blocking):", err);
        // Don't set the flag — allow retry on next mount
      } finally {
        runningRef.current = false;
      }
    };

    run();
  }, [embeddingsReady, userId, supabase]); // entries intentionally excluded
}
