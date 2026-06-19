# QVAC Health — Dorahacks Submission

## Track
Healthcare / MedPsy

## One-line summary
A local-first mental health companion and clinical documentation tool that runs
entirely on consumer hardware — zero cloud inference, zero API cost, complete
patient privacy.

---

## The problem we're solving

Mental health AI tools have a structural privacy problem. Every major product
routes inference through cloud APIs — patient journal entries, session transcripts,
and clinical notes all pass through third-party servers. This creates real risks:
HIPAA exposure, vendor lock-in, ongoing API cost, and — most critically — a trust
gap that prevents the most vulnerable users from engaging with the tool at all.

The people who need mental health support most are often the least willing to
share their thoughts with a platform they don't fully understand or trust.

---

## What we built

**QVAC Health** is a dual-persona web application:

**Patient side:**
- Private journaling with on-device AI reflections from MedPsy-1.7B
- Mood tracking (1–5 scale) with trend sparkline chart
- Semantic memory — related past entries surface as you write, powered by
  GTE-Large embeddings and local SQLite-vec
- Full text search across journal history

**Clinician side:**
- SOAP note generation from raw session notes using MedPsy-4B
- Four-panel structured output (Subjective / Objective / Assessment / Plan)
- Semantic search across all notes by clinical concept
- History grouped by patient reference (anonymous — no real names stored)

**Privacy architecture:**
- All inference: `@qvac/sdk` on-device — never leaves the machine
- All health content: IndexedDB on the user's device
- All embedding vectors: SQLite-vec managed by QVAC SDK — local only
- Supabase (cloud): user IDs, timestamps, SHA-256 content hashes — no health text

---

## How we used the QVAC SDK

The SDK is the core of the entire inference stack:

| Feature | SDK call |
|---|---|
| Load MedPsy-1.7B / 4B / GTE-Large | `sdk.loadModel({ modelSrc, modelType, onProgress })` |
| Stream companion responses | `sdk.completion({ modelId, history, stream: true })` + `run.events` iterator |
| Ingest journal entries to vector store | `sdk.ragIngest({ modelId, documents, workspace })` |
| Semantic search | `sdk.ragSearch({ modelId, query, topK, workspace })` |
| Graceful shutdown | `sdk.unloadModel({ modelId })` + `sdk.ragCloseWorkspace()` |

We use two named RAG workspaces (`"journal-entries"` and `"soap-notes"`) to keep
patient and clinical data in separate local vector databases.

For the MedPsy models, we fetch directly from HuggingFace GGUF URLs since they
may not yet be in the built-in SDK constant registry — the SDK handles caching,
checksums, and P2P distribution automatically.

---

## Technical stack

| Layer | Technology | Why |
|---|---|---|
| Edge AI | `@qvac/sdk` v0.11.x | The whole point |
| LLM (patient) | MedPsy-1.7B Q4_K_M | Medical/psych tuned, ~1GB, runs on phones |
| LLM (clinician) | MedPsy-4B Q4_K_M | Higher quality structured output, ~2.5GB |
| Embeddings | GTE-Large FP16 | High-quality semantic search, SDK built-in |
| Web | Next.js 15 App Router | SSR auth, server actions, streaming RSC |
| API | Fastify 5 + Node.js ≥22.17 | SDK requires Node 22+, Fastify for SSE |
| Local storage | IndexedDB + SQLite-vec | Content on-device, vectors on-device |
| Auth + metadata | Supabase | Identity only — no health content |
| Monorepo | pnpm workspaces + Turborepo | Shared types, shared UI, fast builds |

---

## Privacy proof

We prove zero cloud inference in three ways:

1. **Code audit:** `grep` the entire codebase for any external AI API URLs —
   zero results. See `docs/EVIDENCE.md` for the full audit command.

2. **Network tab:** During demo, DevTools Network tab shows only
   `POST localhost:3001/ai/companion` and `POST localhost:3001/ai/soap` —
   no calls to any cloud inference endpoint.

3. **Offline test:** WiFi disconnected — inference continues normally.
   Journal entries save, AI reflections stream, SOAP notes generate.
   The model runs on the hardware, not the network.

---

## Performance on consumer hardware

Tested on M2 MacBook Pro (16GB RAM), no GPU:

| Model | First token | Full response | Notes |
|---|---|---|---|
| MedPsy-1.7B (companion) | ~1.2s | ~8s (150 tokens) | Smooth on mobile too |
| MedPsy-4B (SOAP) | ~2.1s | ~35s (400 tokens) | Acceptable for clinical use |
| GTE-Large (search) | <50ms per query | — | Vector search is near-instant |

Model download is one-time. After the first load, inference is instant-start
from the local cache.

---

## What makes this genuinely novel

- **MedPsy models + QVAC SDK + clinical workflow** — first complete
  healthcare application built on this stack
- **Privacy as architecture, not policy** — the system cannot leak health content
  to the cloud because the code path doesn't exist, not because of a terms of service
- **Dual RAG workspaces** — patient and clinician data in separate local vector DBs
- **Streaming SSE from local model** — same UX as ChatGPT, zero cloud dependency
- **Offline-first** — works on a plane, in a hospital with restricted network,
  on any consumer device

---

## Reproducibility

```bash
git clone https://github.com/YOUR_HANDLE/qvac-health
cd qvac-health
pnpm install
cp .env.example .env   # add Supabase creds
supabase db push
pnpm dev
# → localhost:3000
```

Full instructions in README.md. Node.js ≥22.17 required for `@qvac/sdk`.

---

## Open source

MIT License. All code is in the repository. PRs welcome — privacy architecture
is non-negotiable; health content must never be added to any cloud sync path.

---

## Team

Solo build — 8 sessions over the hackathon window.
