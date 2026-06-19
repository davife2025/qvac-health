"use client";

import { useState, useEffect } from "react";
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

// Fix #7: SVG chevron instead of Unicode ▾ (inconsistent on Android fonts)
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function SOAPHistorySidebar({
  notes,
  selectedId,
  onSelect,
  onDelete,
}: SOAPHistorySidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(null), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const filtered = search.trim()
    ? notes.filter((n) =>
        n.patientRef.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  const grouped = filtered.reduce<Record<string, LocalSOAPNote[]>>((acc, note) => {
    if (!acc[note.patientRef]) acc[note.patientRef] = [];
    acc[note.patientRef].push(note);
    return acc;
  }, {});

  const NoteList = () => (
    <div className="space-y-4 max-h-[50vh] lg:max-h-[65vh] overflow-y-auto pr-0.5">
      {notes.length > 4 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by patient ref…"
          className="input w-full text-sm"
        />
      )}

      {Object.entries(grouped).map(([ref, refNotes]) => (
        <div key={ref} className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            {ref}
          </p>
          {refNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => {
                onSelect(note);
                setDrawerOpen(false);
              }}
              className={`
                group relative rounded-xl px-3 py-2.5 cursor-pointer
                transition-colors active:scale-[0.99]
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
                    {note.soap.assessment.slice(0, 55)}…
                  </p>
                </div>

                <div className="shrink-0 opacity-0 group-hover:opacity-100
                  focus-within:opacity-100 transition-opacity flex gap-1.5">
                  {confirmDelete === note.id ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(note.id);
                          setConfirmDelete(null);
                        }}
                        className="text-[10px] text-red-500 font-medium
                          px-1.5 py-0.5 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(null);
                        }}
                        className="text-[10px] text-gray-400 px-1.5 py-0.5
                          rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(note.id);
                      }}
                      className="text-[10px] text-gray-300 hover:text-red-400
                        px-1.5 py-0.5 rounded"
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

      {filtered.length === 0 && search && (
        <p className="text-xs text-gray-400 text-center py-4">
          No notes for &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
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
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:block space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Note history</h3>
        <NoteList />
      </div>

      {/* Mobile: collapsible drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setDrawerOpen((o) => !o)}
          className="w-full flex items-center justify-between rounded-xl bg-white
            px-4 py-3 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100
            active:scale-[0.99] transition-transform"
          aria-expanded={drawerOpen}
          aria-controls="soap-history-drawer"
        >
          <span>
            Note history
            <span className="ml-2 rounded-full bg-calm-100 px-2 py-0.5 text-xs text-calm-700">
              {notes.length}
            </span>
          </span>
          <ChevronIcon open={drawerOpen} />
        </button>

        {drawerOpen && (
          <div
            id="soap-history-drawer"
            className="mt-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 space-y-3"
          >
            <NoteList />
          </div>
        )}
      </div>
    </>
  );
}
