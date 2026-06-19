"use client";

import { useState } from "react";
import type { SOAPFields } from "@/lib/local-soap-store";

interface SOAPNoteDisplayProps {
  soap: SOAPFields;
  patientRef: string;
  generatedAt: string;
  durationMs: number;
  modelLabel: string;
}

const SECTIONS: {
  key: keyof SOAPFields;
  label: string;
  icon: string;
  description: string;
  fallback: string;
}[] = [
  { key: "subjective",  label: "Subjective", icon: "💬", description: "Patient's own words, reported symptoms, history",        fallback: "No subjective information recorded." },
  { key: "objective",   label: "Objective",  icon: "🔍", description: "Clinician observations, mental status exam findings",     fallback: "No objective findings recorded." },
  { key: "assessment",  label: "Assessment", icon: "🧠", description: "Clinical impression, diagnostic considerations",           fallback: "No assessment recorded." },
  { key: "plan",        label: "Plan",       icon: "📋", description: "Treatment plan, next steps, referrals, follow-up",        fallback: "No plan recorded." },
];

function validateSOAP(soap: SOAPFields) {
  const missing = SECTIONS.filter(
    (s) => !soap[s.key] || soap[s.key].trim().length === 0
  ).map((s) => s.label);
  return { valid: missing.length === 0, missing };
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="shrink-0 rounded-lg px-2 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      title={`Copy ${label ?? ""}`}
    >
      {copied ? "✓" : "Copy"}
    </button>
  );
}

export function SOAPNoteDisplay({
  soap, patientRef, generatedAt, durationMs, modelLabel,
}: SOAPNoteDisplayProps) {
  const { valid, missing } = validateSOAP(soap);

  const fullText = SECTIONS.map(
    (s) => `${s.label.toUpperCase()}\n${soap[s.key] || s.fallback}`
  ).join("\n\n");

  const [copiedAll, setCopiedAll] = useState(false);

  const copyAll = async () => {
    const header = `SOAP Note — Patient: ${patientRef}\nGenerated: ${new Date(generatedAt).toLocaleString()}\n\n`;
    await navigator.clipboard.writeText(header + fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Incomplete note warning */}
      {!valid && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
          ⚠️ Missing: <span className="font-medium">{missing.join(", ")}</span>. Try regenerating.
        </div>
      )}

      {/* Header — stacks on mobile */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            Patient ref: <span className="font-mono">{patientRef}</span>
          </p>
          <p className="text-xs text-gray-400">
            {new Date(generatedAt).toLocaleString()} · {(durationMs / 1000).toFixed(1)}s ·{" "}
            <span className="text-calm-600">{modelLabel}</span>
          </p>
        </div>
        <button
          onClick={copyAll}
          className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto shrink-0"
        >
          {copiedAll ? "✓ Copied!" : "Copy all"}
        </button>
      </div>

      {/* SOAP panels — 1 col on mobile, 2 col on sm+ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const content = soap[section.key]?.trim();
          const isEmpty = !content;

          return (
            <div
              key={section.key}
              className={`rounded-2xl bg-white p-4 shadow-sm ring-1 space-y-2 ${
                isEmpty ? "ring-amber-100" : "ring-gray-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{section.icon}</span>
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {section.label}
                  </span>
                  {isEmpty && (
                    <span className="text-[10px] text-amber-500 shrink-0">missing</span>
                  )}
                </div>
                {!isEmpty && <CopyButton text={content} label={section.label} />}
              </div>
              <p className="text-xs text-gray-400 leading-snug">{section.description}</p>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words border-t border-gray-50 pt-2 ${
                isEmpty ? "text-gray-300 italic" : "text-gray-700"
              }`}>
                {content || section.fallback}
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-300">
        🔒 Generated locally · Never sent to cloud
      </p>
    </div>
  );
}
