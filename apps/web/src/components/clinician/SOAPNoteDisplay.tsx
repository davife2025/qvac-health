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

const SECTIONS: { key: keyof SOAPFields; label: string; icon: string; description: string }[] = [
  {
    key: "subjective",
    label: "Subjective",
    icon: "💬",
    description: "Patient's own words, reported symptoms, history",
  },
  {
    key: "objective",
    label: "Objective",
    icon: "🔍",
    description: "Clinician observations, mental status exam findings",
  },
  {
    key: "assessment",
    label: "Assessment",
    icon: "🧠",
    description: "Clinical impression, diagnostic considerations",
  },
  {
    key: "plan",
    label: "Plan",
    icon: "📋",
    description: "Treatment plan, next steps, referrals, follow-up",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export function SOAPNoteDisplay({
  soap,
  patientRef,
  generatedAt,
  durationMs,
  modelLabel,
}: SOAPNoteDisplayProps) {
  const fullText = SECTIONS.map(
    (s) => `${s.label.toUpperCase()}\n${soap[s.key]}`
  ).join("\n\n");

  const [copiedAll, setCopiedAll] = useState(false);

  const copyAll = async () => {
    await navigator.clipboard.writeText(
      `SOAP Note — Patient: ${patientRef}\nGenerated: ${new Date(generatedAt).toLocaleString()}\n\n${fullText}`
    );
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-gray-900">
            Patient ref: <span className="font-mono">{patientRef}</span>
          </p>
          <p className="text-xs text-gray-400">
            {new Date(generatedAt).toLocaleString()} · {(durationMs / 1000).toFixed(1)}s ·{" "}
            <span className="text-calm-600">{modelLabel}</span> · on-device
          </p>
        </div>
        <button
          onClick={copyAll}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {copiedAll ? "✓ Copied!" : "Copy all"}
        </button>
      </div>

      {/* Four SOAP panels */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <div
            key={section.key}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{section.icon}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {section.label}
                </span>
              </div>
              <CopyButton text={soap[section.key]} />
            </div>
            <p className="text-xs text-gray-400 leading-snug">{section.description}</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t border-gray-50 pt-2">
              {soap[section.key]}
            </p>
          </div>
        ))}
      </div>

      {/* Privacy footer */}
      <p className="text-center text-xs text-gray-300">
        🔒 Generated locally · Clinical content stays on this device · Never sent to cloud
      </p>
    </div>
  );
}
