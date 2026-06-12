/**
 * CompletionService — updated for @qvac/sdk v0.11.x
 *
 * The new canonical API uses `run.events` (AsyncIterable<CompletionEvent>).
 * `tokenStream` is deprecated but still works — we use `events` for
 * correctness and future-proofing.
 *
 * Event types we care about:
 *   - "contentDelta"  → { text: string }  (a token or token chunk)
 *   - "toolCall"      → not used here
 *   - "done"          → stream finished
 */

import type { CompletionRequest, CompletionResponse } from "@qvac-health/types";

async function getSDK() {
  return await import("@qvac/sdk");
}

function buildHistory(request: CompletionRequest) {
  const history: Array<{ role: "system" | "user"; content: string }> = [];
  if (request.systemPrompt) {
    history.push({ role: "system", content: request.systemPrompt });
  }
  history.push({ role: "user", content: request.prompt });
  return history;
}

/**
 * Non-streaming: collect all tokens and return full text + timing.
 */
export async function runCompletion(
  modelId: string,
  request: CompletionRequest
): Promise<CompletionResponse> {
  const sdk = await getSDK();
  const startTime = Date.now();

  const run = sdk.completion({
    modelId,
    history: buildHistory(request),
    stream: true,
  });

  let text = "";

  for await (const event of run.events) {
    if (event.type === "contentDelta") {
      text += event.text;
    }
  }

  return {
    text: text.trim(),
    modelId,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Streaming: yield tokens as they arrive.
 * Used for SSE responses in the API — the caller writes each token to the response.
 */
export async function* streamCompletion(
  modelId: string,
  request: CompletionRequest
): AsyncGenerator<string> {
  const sdk = await getSDK();

  const run = sdk.completion({
    modelId,
    history: buildHistory(request),
    stream: true,
  });

  for await (const event of run.events) {
    if (event.type === "contentDelta" && event.text) {
      yield event.text;
    }
  }
}
