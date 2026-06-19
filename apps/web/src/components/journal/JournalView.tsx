"use client";

import { useState } from "react";
import { useJournal } from "@/hooks/useJournal";
import { JournalEditor } from "./JournalEditor";
import { JournalEntryCard } from "./JournalEntryCard";
import { MoodSparkline } from "./MoodSparkline";
import { ModelLoader } from "@/components/ModelLoader";

interface JournalViewProps {
  userId: string;
}

export function JournalView({ userId }: JournalViewProps) {
  const { entries, loading, error, saveEntry, attachAIResponse, deleteEntry } =
    useJournal(userId);

  const [companionReady, setCompanionReady] = useState(false);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const [search, setSearch] = useState("");

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

      {/* Step 1: load companion LLM */}
      {!companionReady && (
        <ModelLoader
          modelKey="COMPANION_LLM"
          onLoaded={() => setCompanionReady(true)}
        />
      )}

      {/* Step 2: load embeddings for RAG (non-blocking — user can write while this loads) */}
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

      {/* Editor shows as soon as companion is ready */}
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
          </div>
        )}

        {loading && (
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
          <div className="card text-center py-16 text-gray-400 space-y-2">
            <p className="text-4xl">🌱</p>
            <p className="font-medium text-gray-500">Your journal is empty</p>
            <p className="text-sm">
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
      </section>
    </main>
  );
}
