"use client";

import { useState } from "react";
import { useSOAP } from "@/hooks/useSOAP";
import { useSOAPRAG } from "@/hooks/useRAG";
import { SOAPInputForm } from "./SOAPInputForm";
import { SOAPNoteDisplay } from "./SOAPNoteDisplay";
import { SOAPHistorySidebar } from "./SOAPHistorySidebar";
import { SOAPSemanticSearch } from "./SOAPSemanticSearch";
import { ModelLoader } from "@/components/ModelLoader";
import type { LocalSOAPNote } from "@/lib/local-soap-store";

interface ClinicianViewProps {
  clinicianId: string;
}

type Tab = "new" | "history" | "search";

export function ClinicianView({ clinicianId }: ClinicianViewProps) {
  const { notes, loading, generation, generate, deleteNote, resetGeneration } =
    useSOAP(clinicianId);
  const { ingest: ingestSOAP } = useSOAPRAG();

  const [modelReady, setModelReady] = useState(false);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const [selectedNote, setSelectedNote] = useState<LocalSOAPNote | null>(null);
  const [tab, setTab] = useState<Tab>("new");

  const generating = generation.status === "generating";

  const handleGenerate = async (rawNotes: string, patientRef: string) => {
    setSelectedNote(null);
    const note = await generate(rawNotes, patientRef);
    setSelectedNote(note);
    setTab("new");

    // Ingest into RAG (fire-and-forget)
    ingestSOAP({
      noteId: note.id,
      patientRef: note.patientRef,
      soap: note.soap,
      generatedAt: note.generatedAt,
    });
  };

  const handleSelectFromHistory = (note: LocalSOAPNote) => {
    setSelectedNote(note);
    resetGeneration();
    setTab("history");
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "new", label: "New note" },
    { id: "history", label: `History${notes.length > 0 ? ` (${notes.length})` : ""}` },
    { id: "search", label: "Search" },
  ];

  return (
    <main className="min-h-full p-4 max-w-5xl mx-auto space-y-6 pb-16">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">SOAP Note Generator</h1>
        <p className="text-gray-500 text-sm">
          Local MedPsy-4B · Semantic search via GTE-Large · All on-device
        </p>
      </header>

      {/* Model loaders */}
      {!modelReady && (
        <ModelLoader modelKey="SOAP_LLM" onLoaded={() => setModelReady(true)} />
      )}
      {modelReady && !embeddingsReady && (
        <ModelLoader
          modelKey="EMBEDDINGS"
          onLoaded={() => setEmbeddingsReady(true)}
        />
      )}

      {modelReady && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab switcher */}
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    if (t.id !== "history") setSelectedNote(null);
                    if (t.id === "new") resetGeneration();
                  }}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    tab === t.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* New note tab */}
            {tab === "new" && (
              <SOAPInputForm onGenerate={handleGenerate} generating={generating} />
            )}

            {/* Error state */}
            {generation.status === "error" && tab === "new" && (
              <div className="rounded-xl bg-red-50 px-4 py-4 text-sm text-red-700 ring-1 ring-red-200 space-y-2">
                <p className="font-medium">Generation failed</p>
                <p>{generation.message}</p>
                <button onClick={resetGeneration} className="text-xs underline">
                  Dismiss
                </button>
              </div>
            )}

            {/* SOAP result display */}
            {selectedNote && (tab === "new" || tab === "history") && (
              <SOAPNoteDisplay
                soap={selectedNote.soap}
                patientRef={selectedNote.patientRef}
                generatedAt={selectedNote.generatedAt}
                durationMs={selectedNote.durationMs}
                modelLabel={selectedNote.modelLabel}
              />
            )}

            {/* History tab — prompt to select */}
            {tab === "history" && !selectedNote && (
              <div className="card text-center py-12 text-gray-400 space-y-2">
                <p className="text-2xl">👈</p>
                <p className="text-sm">Select a note from the sidebar</p>
              </div>
            )}

            {/* Search tab */}
            {tab === "search" && (
              <div className="card">
                {embeddingsReady ? (
                  <SOAPSemanticSearch
                    patientRef={selectedNote?.patientRef}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-400 space-y-2">
                    <p className="text-2xl">⏳</p>
                    <p className="text-sm">Load the embeddings model above to enable search</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="space-y-4">
            {loading ? (
              <div className="card text-center py-8 text-gray-400 text-sm">
                Loading history…
              </div>
            ) : (
              <SOAPHistorySidebar
                notes={notes}
                selectedId={selectedNote?.id ?? null}
                onSelect={handleSelectFromHistory}
                onDelete={handleDeleteNote}
              />
            )}

            {notes.length > 0 && (
              <div className="card space-y-2">
                <p className="text-xs font-semibold text-gray-700">Stats</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-calm-50 px-3 py-2 text-center">
                    <p className="text-xl font-bold text-calm-700">{notes.length}</p>
                    <p className="text-[10px] text-calm-500">Notes</p>
                  </div>
                  <div className="rounded-lg bg-sage-50 px-3 py-2 text-center">
                    <p className="text-xl font-bold text-sage-700">
                      {new Set(notes.map((n) => n.patientRef)).size}
                    </p>
                    <p className="text-[10px] text-sage-500">Patients</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-300 text-center pt-1">
                  0 bytes to cloud · all local
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
