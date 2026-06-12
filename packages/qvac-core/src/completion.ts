/**
 * CompletionService — wraps @qvac/sdk completion with:
 *   - System prompt injection
 *   - Streaming token iterator
 *   - Non-streaming full text collection
 *   - Timing metadata
 */

import type { CompletionRequest, CompletionResponse } from "@qvac-health/types";

async function getSDK() {
  return await import("@qvac/sdk");
}

export async function runCompletion(
  modelId: string,
  request: CompletionRequest
): Promise<CompletionResponse> {
  const sdk = await getSDK();
  const startTime = Date.now();

  const history: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

  if (request.systemPrompt) {
    history.push({ role: "system", content: request.systemPrompt });
  }

  history.push({ role: "user", content: request.prompt });

  const result = sdk.completion({
    modelId,
    history,
    stream: true,
  });

  let text = "";
  for await (const token of result.tokenStream) {
    text += token;
  }

  return {
    text: text.trim(),
    modelId,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Streaming version — yields tokens as they arrive.
 * Use for SSE responses in the API.
 */
export async function* streamCompletion(
  modelId: string,
  request: CompletionRequest
): AsyncGenerator<string> {
  const sdk = await getSDK();

  const history: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

  if (request.systemPrompt) {
    history.push({ role: "system", content: request.systemPrompt });
  }

  history.push({ role: "user", content: request.prompt });

  const result = sdk.completion({
    modelId,
    history,
    stream: true,
  });

  for await (const token of result.tokenStream) {
    yield token;
  }
}
