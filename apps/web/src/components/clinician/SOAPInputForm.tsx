"use client";

import { useState } from "react";

interface SOAPInputFormProps {
  onGenerate: (rawNotes: string, patientRef: string) => Promise<void>;
  generating: boolean;
}

const PLACEHOLDERS = [
  `Patient presents with increased anxiety over the past 3 weeks following job loss. Reports difficulty sleeping, racing thoughts, and avoidance of social situations. States "I just can't seem to calm down." No current suicidal ideation. PHQ-9 score: 14. Mental status: alert, oriented x3, mood anxious, affect congruent...`,
  `Session focused on processing grief following loss of parent 2 months ago. Patient reports tearfulness daily, decreased appetite, some social withdrawal but maintaining work attendance. States "I know it's normal but it doesn't feel like it's getting better." No SI/HI. Continues weekly therapy and PRN medication...`,
];

const EXAMPLE_REFS = ["P-001", "P-042", "P-117", "P-203"];

export function SOAPInputForm({ onGenerate, generating }: SOAPInputFormProps) {
  const [rawNotes, setRawNotes] = useState("");
  const [patientRef, setPatientRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  const charLimit = 10000;
  const minChars = 50;

  const handleGenerate = async () => {
    setError(null);
    if (rawNotes.trim().length < minChars) {
      setError(`Please add at least ${minChars} characters of session notes.`);
      return;
    }
    if (!patientRef.trim()) {
      setError("Patient reference is required.");
      return;
    }

    try {
      await onGenerate(rawNotes.trim(), patientRef.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  };

  const loadExample = () => {
    setRawNotes(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
    setPatientRef(EXAMPLE_REFS[Math.floor(Math.random() * EXAMPLE_REFS.length)]);
  };

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Session Notes</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Paste raw session notes or transcript below
          </p>
        </div>
        <button
          type="button"
          onClick={loadExample}
          disabled={generating}
          className="text-xs text-calm-500 hover:text-calm-700 underline disabled:opacity-40"
        >
          Load example
        </button>
      </div>

      {/* Patient ref */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Patient reference
          <span className="ml-1 text-xs font-normal text-gray-400">
            (anonymous ID — never use real names)
          </span>
        </label>
        <input
          type="text"
          value={patientRef}
          onChange={(e) => setPatientRef(e.target.value)}
          disabled={generating}
          placeholder="e.g. P-042"
          className="input w-full max-w-xs"
          maxLength={100}
        />
      </div>

      {/* Raw notes textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Session notes
          </label>
          <span className="text-xs text-gray-300 tabular-nums">
            {rawNotes.length}/{charLimit}
          </span>
        </div>
        <textarea
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value.slice(0, charLimit))}
          disabled={generating}
          rows={10}
          placeholder={PLACEHOLDERS[0]}
          className="textarea w-full text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* Generate */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={generating || rawNotes.trim().length < minChars}
          className="btn-primary"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
              </span>
              Generating SOAP note…
            </span>
          ) : (
            "Generate SOAP note"
          )}
        </button>
        <p className="text-xs text-gray-300">🔒 Runs locally · MedPsy-4B</p>
      </div>

      {generating && (
        <div className="rounded-xl bg-calm-50 px-4 py-3 text-sm text-calm-700 ring-1 ring-calm-100 space-y-1">
          <p className="font-medium">MedPsy-4B is working…</p>
          <p className="text-xs text-calm-500">
            Structuring your notes into Subjective · Objective · Assessment · Plan.
            This takes 15–60s depending on your hardware.
          </p>
        </div>
      )}
    </div>
  );
}
