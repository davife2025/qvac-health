# QVAC Health 🧠🔒

> A local-first, privacy-preserving mental health companion and clinical documentation tool powered entirely by the QVAC SDK.

**Built for:** [QVAC Hackathon I – Unleash Edge AI](https://dorahacks.io/hackathon/qvac-unleach-edge-ai-i) · June 1–21, 2026
**Track:** Healthcare / MedPsy
**License:** MIT

---

## What is this?

QVAC Health puts AI-powered mental health tools directly on your device — **no cloud inference, no health data leaving your hardware.** Two personas in one app:

| Persona | Features |
|---|---|
| 📔 **Patient** | Private journaling · Mood tracking · On-device LLM reflections · Semantic memory (related past entries) · Mood trend chart |
| 🩺 **Clinician** | SOAP note generation from raw session notes · Semantic search across all notes · Patient history grouped by reference |

---

## Privacy architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Device                        │
│                                                             │
│  ┌──────────────┐   ┌─────────────────┐  ┌──────────────┐  │
│  │  Next.js Web │   │  Fastify API    │  │  @qvac/sdk   │  │
│  │  (port 3000) │──▶│  (port 3001)   │──▶│  (Node.js)  │  │
│  └──────────────┘   └─────────────────┘  └──────┬───────┘  │
│                                                  │          │
│  ┌───────────────────┐   ┌─────────────────────┐ │          │
│  │  IndexedDB        │   │  SQLite-vec (QVAC   │◀┘          │
│  │  (health content) │   │   RAG workspace)    │            │
│  └───────────────────┘   └─────────────────────┘            │
│                                                             │
│         ↑ Health content NEVER crosses this boundary ↑      │
└─────────────────────────────────────────────────────────────┘
                             │
                    Only metadata syncs
                    (IDs, hashes, timestamps)
                             │
                    ┌────────▼────────┐
                    │    Supabase     │
                    │  (metadata DB)  │
                    └─────────────────┘
```

**What goes to Supabase:** user ID, email, role, entry IDs, timestamps, SHA-256 content hashes, mood levels, tags, patient references.

**What stays on device:** all journal text, AI responses, raw session notes, generated SOAP JSON, embedding vectors.

---

## Models

| Model | Size | Purpose | Source |
|---|---|---|---|
| MedPsy-1.7B Q4_K_M | ~1 GB | Patient companion responses | HuggingFace `qvac/MedPsy-1.7B-GGUF` |
| MedPsy-4B Q4_K_M | ~2.5 GB | Clinical SOAP note generation | HuggingFace `qvac/MedPsy-4B-GGUF` |
| GTE-Large FP16 | ~700 MB | Semantic search / RAG | Built-in QVAC SDK constant |

All models are downloaded once, cached in `.qvac-models/`, and run entirely offline thereafter.

---

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web app | Next.js 15 (App Router) + Tailwind CSS |
| API | Fastify 5 + Node.js ≥ 22.17 |
| Edge AI | `@qvac/sdk` — LLM, embeddings, RAG |
| Local storage | IndexedDB (content) + SQLite-vec (vectors) |
| Auth + metadata | Supabase |
| Language | TypeScript everywhere |

---

## Requirements

- Node.js ≥ 22.17.0
- pnpm ≥ 9.0.0
- Supabase account (free tier is fine)
- Supabase CLI (for local dev)
- ~5 GB free disk space for model cache
- 4 GB RAM minimum (8 GB recommended for SOAP_LLM)

---

## Quickstart

```bash
# 1. Clone
git clone https://github.com/YOUR_HANDLE/qvac-health
cd qvac-health

# 2. Install
pnpm install

# 3. Environment
cp .env.example .env
# Edit .env — fill in your Supabase URL + keys

# 4. Database
supabase start          # start local Supabase (or use remote)
supabase db push        # apply migrations (001_initial + 002_auth_triggers)

# 5. Dev
pnpm dev
```

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:3001 |
| Health check | http://localhost:3001/health |
| Model status | http://localhost:3001/models/status |

### First run

1. Sign up at http://localhost:3000/auth/signup — choose **Patient** or **Clinician**
2. Go to http://localhost:3000/models and load the model for your role
3. Start journaling or generating SOAP notes

Models download on first load (~1–2.5 GB each). Subsequent loads are instant from cache.

---

## Project structure

```
qvac-health/
├── apps/
│   ├── web/                    # Next.js 15 — patient & clinician UI
│   │   └── src/
│   │       ├── app/            # App Router pages + error boundaries
│   │       ├── components/     # Journal, Clinician, shared UI
│   │       ├── hooks/          # useJournal, useSOAP, useRAG, useCompanionStream
│   │       └── lib/            # Supabase clients, local stores, auth actions
│   └── api/                    # Fastify — QVAC SDK bridge
│       └── src/
│           ├── routes/         # health, ai, models, journal, soap, rag
│           ├── middleware/      # JWT auth + role guards
│           └── lib/            # Supabase service client
├── packages/
│   ├── qvac-core/              # @qvac/sdk wrapper (ModelManager, completion, RAG)
│   ├── ui/                     # Shared React components
│   └── types/                  # Shared TypeScript types
└── supabase/
    └── migrations/             # 001_initial + 002_auth_triggers
```

---

## API reference

### AI endpoints (auth required)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/ai/companion` | patient | SSE stream — MedPsy companion response |
| POST | `/ai/soap` | clinician | SOAP note JSON from raw session notes |

### Model management

| Method | Path | Description |
|---|---|---|
| GET | `/models/status` | List registry + loaded status |
| POST | `/models/load` | Load model with SSE progress stream |
| POST | `/models/unload` | Free model from memory |

### Journal & SOAP metadata

| Method | Path | Role |
|---|---|---|
| GET/POST | `/journal/entries` | patient |
| PUT/DELETE | `/journal/entries/:id` | patient |
| GET/POST | `/soap/notes` | clinician |
| DELETE | `/soap/notes/:id` | clinician |

### RAG

| Method | Path | Role |
|---|---|---|
| POST | `/rag/ingest/journal` | patient |
| POST | `/rag/search/journal` | patient |
| POST | `/rag/ingest/soap` | clinician |
| POST | `/rag/search/soap` | clinician |

---

## Evidence bundle (for hackathon submission)

See [`docs/EVIDENCE.md`](./docs/EVIDENCE.md) for the full verification checklist including:
- Network tab screenshots showing zero inference requests leaving localhost
- Model load progress screenshots
- On-device inference demo recording instructions
- QVAC SDK version and model checksums

---

## Contributing

PRs welcome. Please keep the privacy architecture intact — no health content should ever be added to cloud sync.

## License

MIT — see [LICENSE](./LICENSE)

Built with ❤️ using [QVAC SDK](https://qvac.tether.io) by Tether.
