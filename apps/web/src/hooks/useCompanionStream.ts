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

  // Stable callback refs — no re-render when options object changes
  const onTokenRef = useRef(options.onToken);
  const onDoneRef = useRef(options.onDone);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onTokenRef.current = options.onToken;
    onDoneRef.current = options.onDone;
    onErrorRef.current = options.onError;
  });

  const supabase = useRef(createClient()).current;

  const stream = useCallback(async (journalText: string) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setStreaming(true);
    setText("");
    setError(null);

    let full = "";

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

      // Fix #5: wrap the read loop in its own try/catch so mid-stream
      // errors (model crash, OOM) are caught and surfaced to the user
      // rather than leaving the SSE connection hanging.
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              // Malformed SSE line — skip
              continue;
            }

            if (event.token) {
              full += event.token as string;
              setText(full);
              onTokenRef.current?.(event.token as string);
            } else if (event.done) {
              onDoneRef.current?.(full);
              return;
            } else if (event.error) {
              throw new Error(event.error as string);
            }
          }
        }
      } catch (streamErr) {
        // Re-throw to be caught below, unless it's an abort
        if (streamErr instanceof Error && streamErr.name === "AbortError") return;
        throw streamErr;
      } finally {
        reader.cancel().catch(() => {});
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Stream failed";
      setError(msg);
      onErrorRef.current?.(msg);
    } finally {
      setStreaming(false);
    }
  }, []); // stable — all callbacks via refs

  // Fix #15: cancel now also resets text/error so retrying starts clean
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setText("");
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
  }, []);

  return { stream, cancel, reset, streaming, text, error };
}
