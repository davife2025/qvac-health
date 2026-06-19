# Session 6 — Changes

## What's new / changed

### apps/api/src/routes/rag.ts  (NEW)
- POST /rag/ingest/journal   — embed journal entry into QVAC local vector store
- POST /rag/search/journal   — semantic search across journal entries
- POST /rag/ingest/soap      — embed SOAP note (structured fields, not raw notes)
- POST /rag/search/soap      — semantic search across SOAP notes, optional patient filter
- All routes auth + role gated (patient/clinician respectively)
- Documents prefixed with metadata (id, date, mood/tags) for richer retrieval context

### apps/api/src/server.ts  (REPLACED)
- Registers ragRoutes

### apps/web/src/hooks/useRAG.ts  (NEW)
- useJournalRAG() — ingest() + search() for patient journal workspace
- useSOAPRAG()    — ingest() + search() for clinician SOAP workspace
- ingest() is fire-and-forget (non-blocking, errors warned to console only)
- search() manages loading/results/error state for UI

### apps/web/src/components/journal/RelatedEntries.tsx  (NEW)
- Debounced semantic search as user types (800ms, min 80 chars)
- Uses last 200 chars of current entry as query for relevance
- Shows top 3 related past entries with similarity % scores
- Strips metadata prefix from displayed content
- Disappears when text is too short

### apps/web/src/components/journal/JournalEditor.tsx  (REPLACED)
- Calls useJournalRAG().ingest() after saveEntry() (fire-and-forget)
- Renders <RelatedEntries currentText={content} /> below textarea

### apps/web/src/components/journal/JournalView.tsx  (REPLACED)
- Two-stage model loading: COMPANION_LLM first, then EMBEDDINGS
- User can start writing while embeddings model loads
- Inline message explaining what the embeddings model does

### apps/web/src/components/clinician/SOAPSemanticSearch.tsx  (NEW)
- Free-text clinical concept search across all SOAP notes
- Optional patient ref scoping (passed from selected note context)
- 6 example query chips for quick exploration
- Score bar visualization per result
- Extracts and separates metadata header from body in result display

### apps/web/src/components/clinician/ClinicianView.tsx  (REPLACED)
- Calls useSOAPRAG().ingest() after SOAP generation (fire-and-forget)
- Third "Search" tab added alongside New / History
- Two-stage model loading: SOAP_LLM first, then EMBEDDINGS
- Search tab renders SOAPSemanticSearch (gated on embeddingsReady)
- Search tab pre-scopes to selected patient ref when one is active

## Architecture note
The RAG pipeline is now fully wired end-to-end:
  Write entry/generate SOAP
    → ingest to local SQLite-vec (QVAC ragIngest)
    → searchable via semantic query (QVAC ragSearch)
    → results displayed inline while writing (RelatedEntries)
    → or via explicit search tab (SOAPSemanticSearch)

Zero vectors or embeddings leave the device at any point.

## Apply
Copy all files over S1–S5 codebase.
No new npm packages or migrations required.
pnpm dev and both RAG features are live.
