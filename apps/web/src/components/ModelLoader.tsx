"use client";

import { useState, useCallback } from "react";

type ModelKey = "COMPANION_LLM" | "SOAP_LLM" | "EMBEDDINGS";

interface ModelInfo {
  key: ModelKey;
  label: string;
  type: string;
  minRamMb: number;
  loaded: boolean;
  loading: boolean;
}

interface ModelLoaderProps {
  modelKey: ModelKey;
  onLoaded: () => void;
}

export function ModelLoader({ modelKey, onLoaded }: ModelLoaderProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadModel = useCallback(async () => {
    setStatus("loading");
    setProgress(0);
    setError(null);

    try {
      const res = await fetch("/api/models/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: modelKey }),
      });

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));

          if (event.type === "progress") {
            setProgress(event.percent);
          } else if (event.type === "done" || event.status === "already_loaded") {
            setStatus("loaded");
            setProgress(100);
            onLoaded();
            return;
          } else if (event.type === "error") {
            setStatus("error");
            setError(event.error);
            return;
          }
        }
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to load model");
    }
  }, [modelKey, onLoaded]);

  if (status === "loaded") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700 ring-1 ring-sage-200">
        <span className="text-base">✅</span>
        <span className="font-medium">AI model ready</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 space-y-2">
        <div className="flex items-center gap-2">
          <span>❌</span>
          <span className="font-medium">Model load failed</span>
        </div>
        <p className="text-xs text-red-600">{error}</p>
        <button
          onClick={() => { setStatus("idle"); setError(null); }}
          className="text-xs underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-xl bg-calm-50 px-4 py-3 ring-1 ring-calm-200 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-calm-700 font-medium">Downloading AI model…</span>
          <span className="text-calm-600 tabular-nums">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-calm-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-calm-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">
          Model downloads once and runs locally. No cloud. No cost.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-50 px-4 py-4 ring-1 ring-gray-200 space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-800">AI model not loaded</p>
        <p className="text-xs text-gray-500">
          The model runs locally on your device. First load downloads ~1–2.5GB.
        </p>
      </div>
      <button onClick={loadModel} className="btn-primary text-xs py-2 px-4">
        Load AI Model
      </button>
    </div>
  );
}

/**
 * ModelStatusPanel — shows all models and their states.
 * Used in the /models debug page.
 */
export function ModelStatusPanel({ models }: { models: ModelInfo[] }) {
  return (
    <div className="space-y-3">
      {models.map((m) => (
        <div
          key={m.key}
          className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">{m.label}</p>
            <p className="text-xs text-gray-400">
              {m.type} · min {m.minRamMb}MB RAM
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              m.loaded
                ? "bg-sage-100 text-sage-700"
                : m.loading
                ? "bg-calm-100 text-calm-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {m.loaded ? "Loaded" : m.loading ? "Loading…" : "Not loaded"}
          </span>
        </div>
      ))}
    </div>
  );
}
