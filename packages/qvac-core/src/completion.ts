/**
 * CompletionService — @qvac/sdk v0.11.x
 *
 * Fix: runCompletion now handles mid-stream errors and includes any
 * partial text accumulated before the error in the thrown message.
 * This helps with debugging OOM/model-crash scenarios.
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
 * Fix #4: wraps the event loop in try/catch; includes partial text in error.
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

  try {
    for await (const event of run.events) {
      if (event.type === "contentDelta") {
        text += event.text;
      }
    }
  } catch (err) {
    // Include partial text in error context for debugging
    const partial = text.trim();
    const msg = err instanceof Error ? err.message : "Unknown inference error";
    const detail = partial.length > 0
      ? `${msg} (partial output: ${partial.slice(0, 100)}…)`
      : msg;
    throw new Error(detail);
  }

  return {
    text: text.trim(),
    modelId,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Streaming: yield tokens as they arrive.
 * Caller is responsible for catching errors from this generator.
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
