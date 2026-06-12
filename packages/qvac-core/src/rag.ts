/**
 * RAGService — updated for @qvac/sdk v0.11.x
 *
 * Key API changes from initial scaffold:
 *   - ragIngest() is now the recommended full pipeline (chunk → embed → save)
 *     replaces the manual ragSaveEmbeddings() flow
 *   - ragSearch() requires `workspace` param
 *   - ragCloseWorkspace() for cleanup
 *
 * We use named workspaces (from RAG_WORKSPACES) so journal entries and
 * SOAP notes are stored in separate local vector databases.
 */

import type { RAGSearchRequest, RAGSearchResult } from "@qvac-health/types";
import { RAG_WORKSPACES, type ModelKey } from "./models.js";

async function getSDK() {
  return await import("@qvac/sdk");
}

export type RAGWorkspace = (typeof RAG_WORKSPACES)[keyof typeof RAG_WORKSPACES];

/**
 * Ingest documents into a named RAG workspace.
 * Uses ragIngest() — the full pipeline: chunk → embed → save.
 *
 * @param modelId   - The loaded embeddings model ID
 * @param documents - Array of text strings to embed
 * @param workspace - Which local vector store to write to
 * @param onProgress - Optional progress callback
 */
export async function ingestDocuments(
  modelId: string,
  documents: string[],
  workspace: RAGWorkspace,
  onProgress?: (stage: string, current: number, total: number) => void
): Promise<void> {
  const sdk = await getSDK();

  await sdk.ragIngest({
    modelId,
    documents,
    workspace,
    onProgress,
  });

  console.log(`[RAG] Ingested ${documents.length} docs into workspace: ${workspace}`);
}

/**
 * Search a workspace for semantically similar content.
 *
 * @param modelId   - The loaded embeddings model ID
 * @param request   - Query + topK
 * @param workspace - Which workspace to search
 */
export async function searchSimilar(
  modelId: string,
  request: RAGSearchRequest,
  workspace: RAGWorkspace
): Promise<RAGSearchResult[]> {
  const sdk = await getSDK();

  const results = await sdk.ragSearch({
    modelId,
    query: request.query,
    topK: request.topK ?? 5,
    workspace,
  });

  return results.map((r: { content: string; score: number; metadata?: unknown }) => ({
    content: r.content,
    score: r.score,
    metadata: r.metadata as Record<string, unknown> | undefined,
  }));
}

/**
 * Close a workspace to release memory/file locks.
 * Call when the app is shutting down or when done with a workspace.
 */
export async function closeWorkspace(workspace: RAGWorkspace): Promise<void> {
  const sdk = await getSDK();
  await sdk.ragCloseWorkspace({ workspace });
  console.log(`[RAG] Closed workspace: ${workspace}`);
}

/**
 * List all open RAG workspaces for diagnostics.
 */
export async function listWorkspaces() {
  const sdk = await getSDK();
  return sdk.ragListWorkspaces();
}
