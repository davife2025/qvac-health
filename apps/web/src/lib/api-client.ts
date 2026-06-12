/**
 * API client — updated for S2 with model loading stream support.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── SSE helpers ──────────────────────────────────────────────────────────────

/**
 * Parse SSE stream and yield parsed event objects.
 */
async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader();
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
      yield JSON.parse(line.slice(6));
    }
  }
}

/**
 * Stream companion AI response tokens.
 */
export async function* streamCompanion(
  text: string,
  userId: string
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/ai/companion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, userId }),
  });

  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  for await (const event of parseSSE(res.body)) {
    if (event.done) return;
    if (event.error) throw new Error(event.error as string);
    if (event.token) yield event.token as string;
  }
}

/**
 * Stream model load progress.
 */
export async function* streamModelLoad(
  key: string
): AsyncGenerator<{ type: string; percent?: number; error?: string }> {
  const res = await fetch(`${API_BASE}/models/load`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });

  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  for await (const event of parseSSE(res.body)) {
    yield event as { type: string; percent?: number; error?: string };
    if (event.type === "done" || event.type === "error") return;
  }
}
