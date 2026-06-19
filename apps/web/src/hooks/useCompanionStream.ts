"use client";

import { useState, useCallback, useRef } from "react";
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

  const stream = useCallback(
    async (journalText: string) => {
      // Cancel any in-flight stream
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      setStreaming(true);
      setText("");
      setError(null);

      try {
        const supabase = createClient();
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

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

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
              options.onToken?.(event.token);
            } else if (event.done) {
              options.onDone?.(full);
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
        options.onError?.(msg);
      } finally {
        setStreaming(false);
      }
    },
    [options]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { stream, cancel, streaming, text, error };
}
