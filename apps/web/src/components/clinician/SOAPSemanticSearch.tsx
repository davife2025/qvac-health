"use client";

import { useState, useCallback, useRef } from "react";
import { useSOAPRAG } from "@/hooks/useRAG";

interface SOAPSemanticSearchProps {
  patientRef?: string;
  onResultClick?: (content: string) => void;
}

const EXAMPLE_QUERIES = [
  "anxiety and sleep disturbance",
  "suicidal ideation risk assessment",
  "medication adjustment plan",
  "cognitive behavioral therapy progress",
  "grief and bereavement processing",
  "trauma history disclosure",
];

function scoreBar(score: number) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="h-1 w-12 sm:w-16 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-calm-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-gray-400">{pct}%</span>
    </div>
  );
}

export function SOAPSemanticSearch({ patientRef, onResultClick }: SOAPSemanticSearchProps) {
  const [query, setQuery] = useState("");
  const { search, clear, searching, results, error } = useSOAPRAG();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    await search(query.trim(), { patientRef, topK: 6 });
  }, [query, patientRef, search]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const loadExample = (q: string) => {
    setQuery(q);
    search(q, { patientRef, topK: 6 });
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-700">
          Semantic note search
          {patientRef && (
            <span className="ml-2 font-normal text-gray-400 text-xs">
              — scoped to {patientRef}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400">
          Search across {patientRef ? "this patient's" : "all"} SOAP notes by clinical concept.
          Runs on-device.
        </p>
      </div>

      {/* Input — full width on mobile, row on sm+ */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (!e.target.value.trim()) clear(); }}
          onKeyDown={handleKey}
          placeholder="e.g. anxiety and sleep disturbance"
          className="input flex-1 text-sm"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="btn-primary sm:w-auto disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
      </div>

      {/* Example query chips — horizontal scroll on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => loadExample(q)}
            className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 hover:bg-calm-100 hover:text-calm-700 transition-colors whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((r, i) => {
            const lines = r.content.split("\n");
            const headerEnd = lines.findIndex((l) => l === "");
            const header = lines.slice(0, headerEnd).join(" · ");
            const body = lines.slice(headerEnd + 1).join("\n");

            return (
              <div
                key={i}
                onClick={() => onResultClick?.(r.content)}
                className={`rounded-xl bg-white px-4 py-3 ring-1 ring-gray-100 space-y-2
                  ${onResultClick ? "cursor-pointer hover:ring-calm-200 hover:bg-calm-50 transition-colors active:scale-[0.99]" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-gray-400 truncate min-w-0">{header}</p>
                  {scoreBar(r.score)}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-4 whitespace-pre-wrap break-words">
                  {body}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No matching notes found.
        </p>
      )}
    </div>
  );
}
