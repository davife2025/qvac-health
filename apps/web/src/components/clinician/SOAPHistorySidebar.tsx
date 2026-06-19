"use client";

import { useState } from "react";
import type { LocalSOAPNote } from "@/lib/local-soap-store";

interface SOAPHistorySidebarProps {
  notes: LocalSOAPNote[];
  selectedId: string | null;
  onSelect: (note: LocalSOAPNote) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SOAPHistorySidebar({
  notes,
  selectedId,
  onSelect,
  onDelete,
}: SOAPHistorySidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? notes.filter((n) =>
        n.patientRef.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  // Group by patient ref
  const grouped = filtered.reduce<Record<string, LocalSOAPNote[]>>(
    (acc, note) => {
      if (!acc[note.patientRef]) acc[note.patientRef] = [];
      acc[note.patientRef].push(note);
      return acc;
    },
    {}
  );

  if (notes.length === 0) {
    return (
      <div className="card text-center py-10 text-gray-400 space-y-2">
        <p className="text-2xl">📁</p>
        <p className="text-sm">No saved notes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Note history</h3>

      {notes.length > 4 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by patient ref…"
          className="input w-full text-sm"
        />
      )}

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {Object.entries(grouped).map(([ref, refNotes]) => (
          <div key={ref} className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              {ref}
            </p>
            {refNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelect(note)}
                className={`
                  group relative rounded-xl px-3 py-2.5 cursor-pointer transition-colors
                  ${selectedId === note.id
                    ? "bg-calm-50 ring-1 ring-calm-200"
                    : "bg-white hover:bg-gray-50 ring-1 ring-gray-100"}
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs text-gray-500 truncate">
                      {formatDate(note.generatedAt)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {note.soap.assessment.slice(0, 60)}…
                    </p>
                  </div>

                  {/* Delete */}
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {confirmDelete === note.id ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(note.id);
                            setConfirmDelete(null);
                          }}
                          className="text-[10px] text-red-500 font-medium"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(null);
                          }}
                          className="text-[10px] text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(note.id);
                        }}
                        className="text-[10px] text-gray-300 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
