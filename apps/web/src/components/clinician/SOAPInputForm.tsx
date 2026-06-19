"use client";

import { useState, useRef } from "react";

interface SOAPInputFormProps {
  onGenerate: (rawNotes: string, patientRef: string) => Promise<void>;
  generating: boolean;
}

const EXAMPLES: { notes: string; ref: string }[] = [
  {
    ref: "P-042",
    notes: `Patient presents with increased anxiety over the past 3 weeks following job loss. Reports difficulty sleeping (averaging 4-5 hrs/night), racing thoughts, and avoidance of social situations. States "I just can't seem to calm down no matter what I try." Denies current suicidal or homicidal ideation. PHQ-9 score: 14 (moderate). GAD-7 score: 16 (severe). Mental status: alert, oriented x3, mood anxious, affect congruent, speech normal rate and rhythm, thought process linear, no perceptual disturbances noted. Currently not on any psychiatric medications.`,
  },
  {
    ref: "P-117",
    notes: `Session focused on processing grief following loss of parent 6 weeks ago. Patient reports tearfulness daily, decreased appetite (lost ~8 lbs), hypersomnia (10-12 hrs/night), and mild social withdrawal while maintaining work attendance. States "I know it's normal but it doesn't feel like it's getting better — if anything it's getting worse." Denies SI/HI. PHQ-9: 18 (moderately severe). Continues weekly therapy. No current medications. MSE: alert and oriented, mood depressed, affect tearful and congruent, thought content focused on grief without morbid ideation, insight and judgment intact.`,
  },
  {
    ref: "P-203",
    notes: `Follow-up session, patient has been on sertraline 50mg x 6 weeks. Reports improvement in mood approximately 40-50%, sleep slightly improved (6 hrs vs 4 hrs previously), still experiencing morning anxiety. No side effects reported. Continues CBT with homework compliance ~70%. States "I feel like I can see the light at the end of the tunnel now." PHQ-9 today: 10 (moderate), down from 18 at intake. Plan to uptitrate sertraline to 100mg. Next session in 2 weeks.`,
  },
];

export function SOAPInputForm({ onGenerate, generating }: SOAPInputFormProps) {
  const [rawNotes, setRawNotes] = useState("");
  const [patientRef, setPatientRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fix #13: increment AFTER reading current index so display is correct
  const exampleIndexRef = useRef(0);

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
    // Fix #13: read current index first, then increment
    const current = exampleIndexRef.current;
    const example = EXAMPLES[current % EXAMPLES.length];
    exampleIndexRef.current = current + 1;
    setRawNotes(example.notes);
    setPatientRef(example.ref);
    setError(null);
  };

  const charCount = rawNotes.length;
  const remaining = charLimit - charCount;
  const tooShort = rawNotes.trim().length < minChars && rawNotes.length > 0;

  // Fix #13: display 1-based index of loaded example
  const exampleLabel = exampleIndexRef.current > 0
    ? `(${((exampleIndexRef.current - 1) % EXAMPLES.length) + 1}/${EXAMPLES.length})`
    : "";

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
          Load example {exampleLabel}
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Patient reference
          <span className="ml-1 text-xs font-normal text-gray-400">
            (anonymous ID — never use real names or DOB)
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Session notes
          </label>
          <span className={`text-xs tabular-nums ${remaining < 500 ? "text-amber-500" : "text-gray-300"}`}>
            {charCount}/{charLimit}
          </span>
        </div>
        <textarea
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value.slice(0, charLimit))}
          disabled={generating}
          rows={10}
          placeholder={EXAMPLES[0].notes}
          className={`textarea w-full text-sm ${tooShort ? "ring-amber-200 focus:ring-amber-400" : ""}`}
        />
        {tooShort && (
          <p className="text-xs text-amber-500">
            Add at least {minChars - rawNotes.trim().length} more characters
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={handleGenerate}
          disabled={generating || rawNotes.trim().length < minChars || !patientRef.trim()}
          className="btn-primary"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <span className="inline-flex gap-0.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1 h-1 rounded-full bg-white/60 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
              Generating SOAP note…
            </span>
          ) : (
            "Generate SOAP note"
          )}
        </button>
        {rawNotes && !generating && (
          <button
            onClick={() => { setRawNotes(""); setPatientRef(""); setError(null); }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
        <p className="text-xs text-gray-300 sm:ml-auto">🔒 MedPsy-4B · local</p>
      </div>

      {generating && (
        <div className="rounded-xl bg-calm-50 px-4 py-3 text-sm text-calm-700 ring-1 ring-calm-100 space-y-1">
          <p className="font-medium">MedPsy-4B is structuring your notes…</p>
          <p className="text-xs text-calm-500">
            Generating Subjective · Objective · Assessment · Plan.
            Takes 15–90s depending on your hardware. Do not close this tab.
          </p>
        </div>
      )}
    </div>
  );
}
