"use client";

import { useId } from "react";
import type { MoodLevel } from "@qvac-health/types";

interface MoodSparklineProps {
  entries: Array<{ mood: MoodLevel; createdAt: string }>;
}

const MOOD_COLORS: Record<MoodLevel, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#84cc16",
  5: "#22c55e",
};

export function MoodSparkline({ entries }: MoodSparklineProps) {
  // Fix #9: useId ensures gradient ID is unique per instance — no SVG ID collision
  const gradientId = useId().replace(/:/g, "-");

  const recent = entries.slice(0, 30).reverse();
  if (recent.length < 2) return null;

  const W = 280;
  const H = 48;
  const PAD = 4;
  const usableW = W - PAD * 2;
  const usableH = H - PAD * 2;

  const points = recent.map((e, i) => ({
    x: PAD + (i / (recent.length - 1)) * usableW,
    y: PAD + ((5 - e.mood) / 4) * usableH,
    mood: e.mood,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const avg = recent.reduce((s, e) => s + e.mood, 0) / recent.length;
  const avgLabel =
    avg >= 4.5 ? "Great week" :
    avg >= 3.5 ? "Pretty good" :
    avg >= 2.5 ? "Mixed" :
    avg >= 1.5 ? "Tough stretch" :
    "Difficult period";

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">Mood trend</p>
        <span className="text-xs text-gray-400">
          {avgLabel} · last {recent.length} entries
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {[1, 2, 3, 4, 5].map((level) => {
          const y = PAD + ((5 - level) / 4) * usableH;
          return (
            <line key={level} x1={PAD} y1={y} x2={W - PAD} y2={y}
              stroke="#f3f4f6" strokeWidth="1" />
          );
        })}

        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d7fe8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0d7fe8" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={`${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`}
          fill={`url(#${gradientId})`}
        />

        <path d={pathD} fill="none" stroke="#0d7fe8"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {points.slice(-8).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3}
            fill={MOOD_COLORS[p.mood as MoodLevel]}
            stroke="white" strokeWidth="1.5" />
        ))}
      </svg>

      <div className="flex justify-between text-[10px] text-gray-300 px-1">
        <span>😔</span>
        <span>😐</span>
        <span>😊</span>
      </div>
    </div>
  );
}
