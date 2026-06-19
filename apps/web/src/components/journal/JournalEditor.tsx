"use client";

import { useState } from "react";
import { MoodPicker } from "./MoodPicker";
import { TagInput } from "./TagInput";
import { AIResponsePanel } from "./AIResponsePanel";
import { useCompanionStream } from "@/hooks/useCompanionStream";
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

      // Immediately kick off companion stream
      await companion.stream(content.trim());

      // Reset form for next entry
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

  const canSave = content.trim().length > 0 && !saving && !companion.streaming;
  const charCount = content.length;
  const charLimit = 5000;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">New Entry</h2>
        <span className="text-xs text-gray-300 tabular-nums">
          {charCount}/{charLimit}
        </span>
      </div>

      {/* Mood */}
      <MoodPicker value={mood} onChange={setMood} disabled={saving || companion.streaming} />

      {/* Text area */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          What&apos;s on your mind?
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
          disabled={saving || companion.streaming}
          rows={6}
          placeholder="Write freely. This stays on your device…"
          className="textarea w-full"
        />
      </div>

      {/* Tags */}
      <TagInput
        tags={tags}
        onChange={setTags}
        disabled={saving || companion.streaming}
      />

      {/* AI response streaming panel */}
      <AIResponsePanel
        streaming={companion.streaming}
        text={companion.text}
        error={companion.error}
        onRetry={savedEntry ? () => companion.stream(savedEntry.content) : undefined}
      />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="btn-primary"
        >
          {saving ? "Saving…" : companion.streaming ? "Getting reflection…" : "Save & reflect"}
        </button>
        {content.length > 0 && !saving && !companion.streaming && (
          <button
            onClick={() => { setContent(""); setTags([]); setMood(3); }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
        <p className="ml-auto text-xs text-gray-300">
          🔒 Stays on your device
        </p>
      </div>
    </div>
  );
}
