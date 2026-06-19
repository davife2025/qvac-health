"use client";

import type { MoodLevel } from "@qvac-health/types";

const MOODS: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
  { level: 1, emoji: "😔", label: "Struggling", color: "bg-red-100 border-red-300 text-red-700" },
  { level: 2, emoji: "😟", label: "Low",        color: "bg-orange-100 border-orange-300 text-orange-700" },
  { level: 3, emoji: "😐", label: "Neutral",    color: "bg-yellow-100 border-yellow-300 text-yellow-700" },
  { level: 4, emoji: "🙂", label: "Good",       color: "bg-lime-100 border-lime-300 text-lime-700" },
  { level: 5, emoji: "😊", label: "Great",      color: "bg-green-100 border-green-300 text-green-700" },
];

interface MoodPickerProps {
  value: MoodLevel;
  onChange: (mood: MoodLevel) => void;
  disabled?: boolean;
}

export function MoodPicker({ value, onChange, disabled }: MoodPickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        How are you feeling?
      </label>
      <div className="flex gap-2">
        {MOODS.map((mood) => (
          <button
            key={mood.level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mood.level)}
            title={mood.label}
            className={`
              flex flex-1 flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5
              text-center transition-all duration-150
              ${value === mood.level ? `${mood.color} border-2 scale-105 shadow-sm` : "border-gray-200 bg-white hover:border-gray-300"}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span className="text-xl leading-none">{mood.emoji}</span>
            <span className="text-[10px] font-medium leading-none text-gray-500">
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function MoodBadge({ mood }: { mood: MoodLevel }) {
  const m = MOODS.find((m) => m.level === mood)!;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${m.color}`}>
      {m.emoji} {m.label}
    </span>
  );
}
