/**
 * RAGService — on-device semantic search using QVAC embeddings.
 *
 * All vectors stay on device. We use the QVAC SDK's built-in
 * ragSaveEmbeddings / ragSearch which defaults to a local SQLite-vec store.
 */

import type { RAGSearchRequest, RAGSearchResult } from "@qvac-health/types";

async function getSDK() {
  return await import("@qvac/sdk");
}

export async function saveEmbeddings(
  modelId: string,
  documents: string[],
  ids?: string[]
): Promise<void> {
  const sdk = await getSDK();

  await sdk.ragSaveEmbeddings({
    modelId,
    documents,
    chunk: false, // we pre-chunk journal entries ourselves
  });

  console.log(`[RAG] Saved ${documents.length} embeddings`);
}

export async function searchSimilar(
  modelId: string,
  request: RAGSearchRequest
): Promise<RAGSearchResult[]> {
  const sdk = await getSDK();

  const results = await sdk.ragSearch({
    modelId,
    query: request.query,
    topK: request.topK ?? 5,
  });

  return results.map((r: { content: string; score: number }) => ({
    content: r.content,
    score: r.score,
  }));
}
