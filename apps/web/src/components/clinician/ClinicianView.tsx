"use client";

import { useState } from "react";
import { useSOAP } from "@/hooks/useSOAP";
import { SOAPInputForm } from "./SOAPInputForm";
import { SOAPNoteDisplay } from "./SOAPNoteDisplay";
import { SOAPHistorySidebar } from "./SOAPHistorySidebar";
import { ModelLoader } from "@/components/ModelLoader";
import type { LocalSOAPNote } from "@/lib/local-soap-store";

interface ClinicianViewProps {
  clinicianId: string;
}

export function ClinicianView({ clinicianId }: ClinicianViewProps) {
  const { notes, loading, generation, generate, deleteNote, resetGeneration } =
    useSOAP(clinicianId);

  const [modelReady, setModelReady] = useState(false);
  const [selectedNote, setSelectedNote] = useState<LocalSOAPNote | null>(null);
  const [view, setView] = useState<"new" | "history">("new");

  const generating = generation.status === "generating";

  const handleGenerate = async (rawNotes: string, patientRef: string) => {
    setSelectedNote(null);
    const note = await generate(rawNotes, patientRef);
    setSelectedNote(note);
    setView("new");
  };

  const handleSelectFromHistory = (note: LocalSOAPNote) => {
    setSelectedNote(note);
    resetGeneration();
    setView("history");
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  return (
    <main className="min-h-full p-4 max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">SOAP Note Generator</h1>
        <p className="text-gray-500 text-sm">
          Local MedPsy-4B · Clinical content stays on this device
        </p>
      </header>

      {/* Model loader */}
      {!modelReady && (
        <ModelLoader modelKey="SOAP_LLM" onLoaded={() => setModelReady(true)} />
      )}

      {modelReady && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: input or selected note */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab switcher */}
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
              <button
                onClick={() => { setView("new"); setSelectedNote(null); resetGeneration(); }}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  view === "new"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                New note
              </button>
              <button
                onClick={() => setView("history")}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  view === "history"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                History
                {notes.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-calm-100 px-1.5 py-0.5 text-xs text-calm-700">
                    {notes.length}
                  </span>
                )}
              </button>
            </div>

            {/* Input form — visible on "new" tab */}
            {view === "new" && (
              <SOAPInputForm
                onGenerate={handleGenerate}
                generating={generating}
              />
            )}

            {/* Result panel */}
            {generation.status === "error" && view === "new" && (
              <div className="rounded-xl bg-red-50 px-4 py-4 text-sm text-red-700 ring-1 ring-red-200 space-y-2">
                <p className="font-medium">Generation failed</p>
                <p>{generation.message}</p>
                <button
                  onClick={resetGeneration}
                  className="text-xs underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {selectedNote && (
              <SOAPNoteDisplay
                soap={selectedNote.soap}
                patientRef={selectedNote.patientRef}
                generatedAt={selectedNote.generatedAt}
                durationMs={selectedNote.durationMs}
                modelLabel={selectedNote.modelLabel}
              />
            )}

            {/* History tab content */}
            {view === "history" && !selectedNote && (
              <div className="card text-center py-12 text-gray-400 space-y-2">
                <p className="text-2xl">👈</p>
                <p className="text-sm">Select a note from the sidebar</p>
              </div>
            )}
          </div>

          {/* Right: history sidebar */}
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

            {/* Stats card */}
            {notes.length > 0 && (
              <div className="card space-y-2">
                <p className="text-xs font-semibold text-gray-700">Session stats</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-calm-50 px-3 py-2 text-center">
                    <p className="text-xl font-bold text-calm-700">{notes.length}</p>
                    <p className="text-[10px] text-calm-500">Notes generated</p>
                  </div>
                  <div className="rounded-lg bg-sage-50 px-3 py-2 text-center">
                    <p className="text-xl font-bold text-sage-700">
                      {new Set(notes.map((n) => n.patientRef)).size}
                    </p>
                    <p className="text-[10px] text-sage-500">Patients</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-300 text-center pt-1">
                  All data stored locally · 0 bytes to cloud
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
