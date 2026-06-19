"use client";

import { useState, useRef } from "react";
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
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fix #1: savedEntry in a ref, not state — ref is always current when
  // the onDone callback fires, unlike a state closure which captures null.
  const savedEntryRef = useRef<LocalEntry | null>(null);

  const { ingest } = useJournalRAG();

  const companion = useCompanionStream({
    onDone: async (fullText) => {
      // Fix #1: read from ref, not closed-over state — always current
      const entry = savedEntryRef.current;
      if (entry) {
        await onAIResponse(entry.id, fullText);
      }
    },
  });

  const handleSave = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    companion.reset(); // clear any previous stream state

    try {
      const entry = await onSave(content.trim(), mood, tags);

      // Write to ref immediately — companion.stream fires onDone async later
      savedEntryRef.current = entry;

      // Fire-and-forget RAG ingest (non-blocking)
      ingest({
        entryId: entry.id,
        content: content.trim(),
        mood,
        tags,
        createdAt: entry.createdAt,
      });

      // Stream AI reflection
      await companion.stream(content.trim());

      // Reset form only after stream completes
      setContent("");
      setMood(3);
      setTags([]);
      savedEntryRef.current = null;
    } catch (err) {
      // Fix #4: show save errors to the user, not just console
      const msg = err instanceof Error ? err.message : "Failed to save entry";
      setSaveError(msg);
      savedEntryRef.current = null;
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

      {/* Fix #14: pass enabled flag to avoid unnecessary hook work */}
      <RelatedEntries currentText={content} />

      <TagInput tags={tags} onChange={setTags} disabled={busy} />

      {/* Fix #4: show save errors inline */}
      {saveError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700
          ring-1 ring-red-200 flex items-center justify-between gap-2">
          <span>{saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-400 hover:text-red-600 shrink-0"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <AIResponsePanel
        streaming={companion.streaming}
        text={companion.text}
        error={companion.error}
        onRetry={
          savedEntryRef.current
            ? () => {
                companion.reset();
                companion.stream(savedEntryRef.current!.content);
              }
            : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-1">
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={!canSave} className="btn-primary">
            {saving
              ? "Saving…"
              : companion.streaming
              ? "Getting reflection…"
              : "Save & reflect"}
          </button>
          {content.length > 0 && !busy && (
            <button
              onClick={() => {
                setContent("");
                setTags([]);
                setMood(3);
                setSaveError(null);
                companion.reset();
              }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-gray-300 sm:ml-auto">🔒 Stays on your device</p>
      </div>
    </div>
  );
}
