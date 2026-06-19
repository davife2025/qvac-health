"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseCompanionStreamOptions {
  onToken?: (token: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export function useCompanionStream(options: UseCompanionStreamOptions = {}) {
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fix #2: store callbacks in refs so useCallback doesn't depend on options object.
  // This prevents stream() from being recreated every render when the parent
  // passes an inline object literal as options.
  const onTokenRef = useRef(options.onToken);
  const onDoneRef = useRef(options.onDone);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onTokenRef.current = options.onToken;
    onDoneRef.current = options.onDone;
    onErrorRef.current = options.onError;
  });

  // Memoised client — fix #1 pattern applied here too
  const supabase = useRef(createClient()).current;

  const stream = useCallback(async (journalText: string) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setStreaming(true);
    setText("");
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/ai/companion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text: journalText }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));

          if (event.token) {
            full += event.token;
            setText(full);
            onTokenRef.current?.(event.token);
          } else if (event.done) {
            onDoneRef.current?.(full);
            return;
          } else if (event.error) {
            throw new Error(event.error);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Stream failed";
      setError(msg);
      onErrorRef.current?.(msg);
    } finally {
      setStreaming(false);
    }
  }, []); // stable — no deps needed, all callbacks via refs

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
  }, []);

  return { stream, cancel, reset, streaming, text, error };
}
