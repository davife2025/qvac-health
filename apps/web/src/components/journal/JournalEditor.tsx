"use client";

import { useState } from "react";
import { MoodPicker } from "./MoodPicker";
import { TagInput } from "./TagInput";
import { AIResponsePanel } from "./AIResponsePanel";
import { RelatedEntries } from "./RelatedEntries";
import { useCompanionStream } from "@/hooks/useCompanionStream";
import { useJournalRAG } from "@/hooks/useRAG";
import type { MoodLevel } from "@qvac-health/types";
import type { LocalEntry } from "@/hooks/useJournal";

interface JournalEditorProps {
  onSave: (content: string, mood: MoodLevel, tags: string[]) => Promise<LocalEntry>;
  onAIResponse: (id: string, response: string) => Promise<void>;
}

export function JournalEditor({ onSave, onAIResponse }: JournalEditorProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<MoodLevel>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedEntry, setSavedEntry] = useState<LocalEntry | null>(null);

  const { ingest } = useJournalRAG();

  const companion = useCompanionStream({
    onDone: async (fullText) => {
      if (savedEntry) {
        await onAIResponse(savedEntry.id, fullText);
      }
    },
  });

  const handleSave = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);

    try {
      const entry = await onSave(content.trim(), mood, tags);
      setSavedEntry(entry);

      // Ingest into local RAG vector store (fire-and-forget, non-blocking)
      ingest({
        entryId: entry.id,
        content: content.trim(),
        mood,
        tags,
        createdAt: entry.createdAt,
      });

      // Stream companion response
      await companion.stream(content.trim());

      setContent("");
      setMood(3);
      setTags([]);
      setSavedEntry(null);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || companion.streaming;
  const canSave = content.trim().length > 0 && !busy;
  const charLimit = 5000;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">New Entry</h2>
        <span className="text-xs text-gray-300 tabular-nums">
          {content.length}/{charLimit}
        </span>
      </div>

      <MoodPicker value={mood} onChange={setMood} disabled={busy} />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          What&apos;s on your mind?
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
          disabled={busy}
          rows={6}
          placeholder="Write freely. This stays on your device…"
          className="textarea w-full"
        />
      </div>

      {/* Related past entries — surfaces as user types */}
      <RelatedEntries currentText={content} />

      <TagInput tags={tags} onChange={setTags} disabled={busy} />

      <AIResponsePanel
        streaming={companion.streaming}
        text={companion.text}
        error={companion.error}
        onRetry={savedEntry ? () => companion.stream(savedEntry.content) : undefined}
      />

      <div className="flex items-center gap-3 pt-1">
        <button onClick={handleSave} disabled={!canSave} className="btn-primary">
          {saving
            ? "Saving…"
            : companion.streaming
            ? "Getting reflection…"
            : "Save & reflect"}
        </button>
        {content.length > 0 && !busy && (
          <button
            onClick={() => { setContent(""); setTags([]); setMood(3); }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
        <p className="ml-auto text-xs text-gray-300">🔒 Stays on your device</p>
      </div>
    </div>
  );
}
