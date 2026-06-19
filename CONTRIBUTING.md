# Contributing to QVAC Health

Thanks for your interest! Here's how to contribute.

## Ground rules

1. **Privacy architecture is non-negotiable.** No health content (journal text,
   session notes, SOAP JSON, embeddings) may be added to any cloud sync path.
   If your PR touches data flow, include a short privacy audit in the description.

2. **All inference must use `@qvac/sdk`.** Do not add other inference libraries
   (llama.cpp bindings, llm.js, etc.) — the SDK is the point.

3. **Keep it open source.** MIT or Apache-2.0 only for any new dependencies.

## Setup

```bash
git clone https://github.com/YOUR_HANDLE/qvac-health
cd qvac-health
pnpm install
cp .env.example .env   # fill in Supabase creds
supabase start && supabase db push
pnpm dev
```

## Branch conventions

```
feat/short-description   # new feature
fix/short-description    # bug fix
chore/short-description  # tooling, deps, docs
```

## PR checklist

- [ ] `pnpm typecheck` passes (no TS errors)
- [ ] `pnpm lint` passes
- [ ] New routes have auth + role guards
- [ ] Health content never leaves the device boundary
- [ ] CHANGES.md updated with what changed and why

## Questions

Open an issue or join the [QVAC Discord](https://discord.com/invite/tetherdev).
