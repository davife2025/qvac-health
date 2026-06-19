"use client";

import { useEffect, useRef } from "react";
import { getAllContent } from "@/lib/local-journal-store";
import { createClient } from "@/lib/supabase/client";
import type { LocalEntry } from "./useJournal";

const BACKFILL_KEY = "qvac-rag-backfill-done-v1";

/**
 * useRAGBackfill — runs once per device per user to seed the vector store
 * with all existing journal entries.
 *
 * Without this, users who had entries before S6 (when RAG was added) would
 * see no results in RelatedEntries since the vector store was empty.
 *
 * Strategy:
 *   - Check localStorage for a backfill-done flag keyed by userId
 *   - If not set, fetch all local content + ingest in batches of 5
 *   - Set flag when complete — never runs again on this device
 *   - Runs in the background, does not block UI
 */
export function useRAGBackfill(
  entries: LocalEntry[],
  embeddingsReady: boolean,
  userId: string
) {
  const runningRef = useRef(false);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    if (!embeddingsReady) return;
    if (entries.length === 0) return;
    if (runningRef.current) return;

    const flagKey = `${BACKFILL_KEY}-${userId}`;
    if (localStorage.getItem(flagKey)) return;

    runningRef.current = true;

    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const token = session.access_token;

        // Get all local content (includes entries not yet ingested)
        const allContent = await getAllContent();
        if (allContent.length === 0) return;

        console.log(`[RAG backfill] Ingesting ${allContent.length} existing entries...`);

        // Batch in groups of 5 to avoid hammering the API route
        const BATCH = 5;
        for (let i = 0; i < allContent.length; i += BATCH) {
          const batch = allContent.slice(i, i + BATCH);

          await Promise.allSettled(
            batch.map(async (local) => {
              // Find the metadata for this entry (mood + tags)
              const meta = entries.find((e) => e.id === local.id);

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

          // Small delay between batches — don't block model inference
          if (i + BATCH < allContent.length) {
            await new Promise((r) => setTimeout(r, 300));
          }
        }

        localStorage.setItem(flagKey, "1");
        console.log(`[RAG backfill] Complete — ${allContent.length} entries indexed`);
      } catch (err) {
        console.warn("[RAG backfill] Failed (non-blocking):", err);
      } finally {
        runningRef.current = false;
      }
    };

    run();
  }, [embeddingsReady, entries, userId, supabase]);
}
