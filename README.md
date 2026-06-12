# QVAC Health 🧠🔒

> A local-first, privacy-preserving mental health companion powered by the QVAC SDK.

Built for the **QVAC Hackathon I – Unleash Edge AI** (June 1–21, 2026).

---

## What is this?

QVAC Health is a monorepo web application that puts AI-powered mental health tools directly on your device — **no cloud inference, no data leaving your hardware**.

**Two personas:**

| Feature | Description |
|---|---|
| 📔 **Patient Companion** | Private journaling with on-device LLM reflections + mood tracking |
| 🩺 **Clinician SOAP Notes** | Paste session notes → get structured SOAP documentation locally |
| 🔍 **Semantic Memory** | On-device RAG over your journal history using QVAC embeddings |

**Privacy architecture:**
- All inference runs via `@qvac/sdk` on your local machine
- Journal content and clinical notes live in local SQLite (QVAC RAG store)
- Supabase stores only metadata: IDs, timestamps, content hashes — **never actual health content**

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 15 (App Router) + Tailwind CSS |
| API | Fastify 5 + Node.js ≥ 22.17 |
| AI | `@qvac/sdk` — LLM, embeddings, RAG |
| Database | Supabase (metadata only) + local SQLite-vec (content) |
| Language | TypeScript everywhere |

---

## Requirements

- Node.js ≥ 22.17.0
- pnpm ≥ 9.0.0
- Supabase CLI (for local dev)

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/your-handle/qvac-health
cd qvac-health

# 2. Install dependencies
pnpm install

# 3. Environment
cp .env.example .env
# Fill in your Supabase credentials

# 4. Start Supabase locally
supabase start
supabase db push

# 5. Start all apps in parallel
pnpm dev
```

Web app → http://localhost:3000
API     → http://localhost:3001
Health  → http://localhost:3001/health

---

## Project Structure

```
qvac-health/
├── apps/
│   ├── web/          # Next.js 15 — patient & clinician UI
│   └── api/          # Fastify — QVAC SDK bridge
├── packages/
│   ├── qvac-core/    # @qvac/sdk wrapper (ModelManager, completion, RAG)
│   ├── ui/           # Shared React components
│   └── types/        # Shared TypeScript types
└── supabase/         # Migrations and config
```

---

## License

MIT — see [LICENSE](./LICENSE)

Built with ❤️ using [QVAC SDK](https://qvac.tether.io) by Tether.
