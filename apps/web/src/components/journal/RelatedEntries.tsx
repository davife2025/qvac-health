"use client";

import { useEffect, useRef } from "react";
import { useJournalRAG } from "@/hooks/useRAG";

interface RelatedEntriesProps {
  currentText: string;
  /** minimum chars before triggering a search */
  minChars?: number;
  /** debounce ms */
  debounceMs?: number;
}

function scoreToPercent(score: number) {
  return Math.round(score * 100);
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function RelatedEntries({
  currentText,
  minChars = 80,
  debounceMs = 800,
}: RelatedEntriesProps) {
  const { search, clear, searching, results } = useJournalRAG();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>("");

  useEffect(() => {
    // Strip metadata prefix lines the API adds to stored docs
    const stripped = currentText.replace(/\[Journal entry.*?\]\n.*?\n/g, "").trim();

    if (stripped.length < minChars) {
      clear();
      lastQueryRef.current = "";
      return;
    }

    // Use the last 200 chars as the semantic query — most relevant context
    const query = stripped.slice(-200);
    if (query === lastQueryRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastQueryRef.current = query;
      search(query, 3);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentText, minChars, debounceMs, search, clear]);

  if (!searching && results.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-gray-500">
          Related past entries
        </p>
        {searching && (
          <span className="text-[10px] text-gray-300 animate-pulse">
            searching memory…
          </span>
        )}
        <span className="ml-auto text-[10px] text-gray-300">
          🔍 on-device · semantic
        </span>
      </div>

      <div className="space-y-2">
        {results.map((r, i) => {
          // Extract the entry content below the metadata header
          const contentStart = r.content.indexOf("\n\n");
          const display =
            contentStart > -1
              ? r.content.slice(contentStart + 2)
              : r.content;

          return (
            <div
              key={i}
              className="rounded-xl bg-gray-50 px-3 py-2.5 ring-1 ring-gray-100 space-y-1"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                  Past entry
                </p>
                <span className="text-[10px] text-calm-400 font-mono">
                  {scoreToPercent(r.score)}% match
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {truncate(display, 180)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
