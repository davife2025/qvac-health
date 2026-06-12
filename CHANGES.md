# Session 2 — Changes

## What changed

### packages/qvac-core/src/models.ts  (REPLACED)
- Added real MedPsy HuggingFace GGUF URLs (1.7B + 4B Q4_K_M)
- MODEL_REGISTRY now has structured entries with `src`, `type`, `label`, `minRamMb`
- Added RAG_WORKSPACES constants ("journal-entries", "soap-notes")
- ModelKey is now typed enum: "COMPANION_LLM" | "SOAP_LLM" | "EMBEDDINGS"

### packages/qvac-core/src/model-manager.ts  (REPLACED)
- load() now takes ModelKey instead of raw string
- Resolves HF URL vs SDK built-in constant at load time
- Progress callback updated for SDK v0.11.x shape ({ percentage: number })
- Added isLoading() and getLoadedKeys()

### packages/qvac-core/src/completion.ts  (REPLACED)
- Uses run.events (new canonical v0.11.x API) instead of deprecated tokenStream
- Filters for "contentDelta" events to extract tokens

### packages/qvac-core/src/rag.ts  (REPLACED)
- Uses ragIngest() (full pipeline) instead of ragSaveEmbeddings()
- ragSearch() now passes workspace param
- Added closeWorkspace() and listWorkspaces() for lifecycle management

### packages/qvac-core/src/index.ts  (REPLACED)
- Re-exports updated RAG functions and RAG_WORKSPACES

### packages/types/src/index.ts  (REPLACED)
- ModelKey type added
- SOAPNote split into SOAPFields + SOAPNote
- HealthCheckResponse kept clean

### apps/api/src/routes/models.ts  (NEW)
- GET  /models/status
- POST /models/load    (SSE progress stream)
- POST /models/unload

### apps/api/src/routes/ai.ts  (REPLACED)
- Uses updated ModelKey enum for modelManager.load()
- SOAP route validates all 4 fields present in response
- Better error messages

### apps/api/src/routes/health.ts  (REPLACED)
- Includes model registry info in response

### apps/api/src/server.ts  (REPLACED)
- Registers modelRoutes
- Shutdown closes RAG workspaces before unloading models

### apps/web/src/components/ModelLoader.tsx  (NEW)
- ModelLoader: load a specific model with SSE progress bar
- ModelStatusPanel: table of all models and their status

### apps/web/src/app/models/page.tsx  (NEW)
- /models debug page showing live model status

### apps/web/src/lib/api-client.ts  (REPLACED)
- Added apiGet()
- SSE parsed via shared parseSSE() generator
- streamCompanion() and streamModelLoad() helpers

## How to apply
Copy all files in this zip over your S1 codebase.
File paths are relative to the monorepo root.
