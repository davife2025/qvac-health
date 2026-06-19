"use client";

import { useState } from "react";
import { useJournal } from "@/hooks/useJournal";
import { useRAGBackfill } from "@/hooks/useRAGBackfill";
import { JournalEditor } from "./JournalEditor";
import { JournalEntryCard } from "./JournalEntryCard";
import { MoodSparkline } from "./MoodSparkline";
import { ModelLoader } from "@/components/ModelLoader";

interface JournalViewProps {
  userId: string;
}

export function JournalView({ userId }: JournalViewProps) {
  const {
    entries,
    loading,
    error,
    hasMore,
    loadMore,
    saveEntry,
    attachAIResponse,
    deleteEntry,
  } = useJournal(userId);

  const [companionReady, setCompanionReady] = useState(false);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const [search, setSearch] = useState("");

  // Fix #11: backfill existing entries into vector store on first load
  useRAGBackfill(entries, embeddingsReady, userId);

  const filtered = search.trim()
    ? entries.filter(
        (e) =>
          e.content.toLowerCase().includes(search.toLowerCase()) ||
          e.tags.some((t) => t.includes(search.toLowerCase()))
      )
    : entries;

  return (
    <main className="min-h-full p-4 max-w-2xl mx-auto space-y-6 pb-16">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Your Journal</h1>
        <p className="text-gray-500 text-sm">
          Private reflections · AI companion · Semantic memory · All on-device
        </p>
      </header>

      {entries.length >= 2 && <MoodSparkline entries={entries} />}

      {/* Step 1: companion LLM */}
      {!companionReady && (
        <ModelLoader
          modelKey="COMPANION_LLM"
          onLoaded={() => setCompanionReady(true)}
        />
      )}

      {/* Step 2: embeddings for RAG — non-blocking */}
      {companionReady && !embeddingsReady && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">
            Loading semantic memory model for related entry suggestions…
          </p>
          <ModelLoader
            modelKey="EMBEDDINGS"
            onLoaded={() => setEmbeddingsReady(true)}
          />
        </div>
      )}

      {companionReady && (
        <JournalEditor onSave={saveEntry} onAIResponse={attachAIResponse} />
      )}

      <section className="space-y-4">
        {entries.length > 3 && (
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries or tags…"
              className="input w-full pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
              🔍
            </span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {loading && entries.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Loading your journal…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 text-center py-16 space-y-2">
            <p className="text-4xl">🌱</p>
            <p className="font-semibold text-gray-500">Your journal is empty</p>
            <p className="text-sm text-gray-400">
              {companionReady
                ? "Write your first entry above."
                : "Load the AI model above to get started."}
            </p>
          </div>
        )}

        {!loading && filtered.length === 0 && entries.length > 0 && (
          <p className="text-center text-sm text-gray-400 py-6">
            No entries match &ldquo;{search}&rdquo;
          </p>
        )}

        {filtered.map((entry) => (
          <JournalEntryCard
            key={entry.id}
            entry={entry}
            onDelete={deleteEntry}
          />
        ))}

        {/* Fix #14: load more pagination */}
        {hasMore && !search && (
          <div className="text-center pt-2">
            <button
              onClick={loadMore}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              {loading ? "Loading…" : "Load older entries"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
