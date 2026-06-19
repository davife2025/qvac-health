"use client";

import { useState, useEffect } from "react";
import { MoodBadge } from "./MoodPicker";
import type { LocalEntry } from "@/hooks/useJournal";

interface JournalEntryCardProps {
  entry: LocalEntry;
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const preview = entry.content.slice(0, 200);
  const hasMore = entry.content.length > 200;

  // Fix #19: auto-reset confirmation after 4s if user doesn't confirm
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className="card space-y-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs text-gray-400">{formatDate(entry.createdAt)}</p>
          <MoodBadge mood={entry.mood} />
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center">
          {confirmDelete ? (
            <>
              <button
                onClick={() => onDelete(entry.id)}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-gray-300 hover:text-red-400"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span key={tag}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {entry.content ? (
        <div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {expanded ? entry.content : preview}
            {!expanded && hasMore && (
              <button onClick={() => setExpanded(true)}
                className="ml-1 text-calm-500 hover:text-calm-700 text-xs">
                …read more
              </button>
            )}
          </p>
          {expanded && hasMore && (
            <button onClick={() => setExpanded(false)}
              className="mt-1 text-xs text-gray-400 hover:text-gray-600">
              Show less
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-300 italic">
          Content stored locally — not synced here
        </p>
      )}

      {entry.aiResponse && (
        <div className="rounded-xl bg-calm-50 px-4 py-3 space-y-1">
          <p className="text-[10px] font-semibold text-calm-600 uppercase tracking-wide">
            QVAC Reflection · on-device
          </p>
          <p className="text-sm text-calm-800 leading-relaxed">
            {entry.aiResponse}
          </p>
        </div>
      )}
    </div>
  );
}
