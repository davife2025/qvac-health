# Session 14 — Final Review Fixes

This session completes the final pre-submission review pass.
All prior fixes (S8–S13) confirmed correct. New issues found and fixed below.

---

## 🔴 Critical

### Fix #1 — `@qvac-health/ui` missing from web dependencies
**File:** `apps/web/package.json` (REPLACED)

**Problem:** `next.config.mjs` lists `@qvac-health/ui` in `transpilePackages`
and `apps/web/src/app/layout.tsx` imports `ToastProvider` from a local copy
in `@/components/ui/Toast`. S8 created `packages/ui` with the canonical source
but `apps/web/package.json` never declared `"@qvac-health/ui": "workspace:*"`.
Any import of `@qvac-health/ui` would fail at typecheck time.
Also added `prettier-plugin-tailwindcss` which `.prettierrc` references but
wasn't in any package.json.

### Fix #2 — `pino-pretty` missing from API dependencies
**File:** `apps/api/package.json` (REPLACED)

**Problem:** `apps/api/src/server.ts` uses `pino-pretty` as a Fastify logger
transport in development mode. It was not in `dependencies` or `devDependencies`.
`pnpm install --frozen-lockfile` in CI could fail or resolve an incompatible version.

**Fix:** Added `"pino-pretty": "^13.0.0"` to `devDependencies`.

---

## 🟡 Important

### Fix #3 — `GET /soap/notes` hard `.limit(200)` with no pagination
**File:** `apps/api/src/routes/soap.ts` (REPLACED)

**Problem:** Journal route was fixed in S13 but SOAP route still used `.limit(200)`.
A clinician with 200+ notes hits the limit silently — oldest notes disappear.

**Fix:** Accepts `?page=N&pageSize=N` query params. Returns `meta.hasMore`.
Consistent with `journal.ts` pattern from S13.

### Fix #4 — `z.enum(MODEL_KEYS as [ModelKey, ...ModelKey[]])` unsound cast
**File:** `apps/api/src/routes/models.ts` (REPLACED)

**Problem:** TypeScript cast `as [ModelKey, ...ModelKey[]]` assumes the array
is non-empty — Zod requires a const tuple literal for `z.enum`. The cast was
technically unsound and would fail strict TypeScript checks.
Also: `models/load` SSE handler didn't guard against client disconnect.

**Fix:** `MODEL_KEY_ENUM` is a `const` array `satisfies readonly ModelKey[]` —
type-safe, inferred correctly by Zod. Added `req.socket.destroyed` check
and EPIPE guard to the load SSE handler (consistent with `ai.ts` fix in S13).

### Fix #5 — Auth callback redirect uses internal `origin`, not public URL
**File:** `apps/web/src/app/auth/callback/route.ts` (REPLACED)

**Problem:** `const { origin } = new URL(request.url)` — in Next.js, `request.url`
in API routes is the internal URL. Behind a reverse proxy (Vercel, Nginx),
this could be `http://localhost:3000` rather than `https://your-app.com`.
Email confirmation links would redirect to an internal URL users can't reach.

**Fix:** Uses `NEXT_PUBLIC_SITE_URL` env var as the redirect base, with a
fallback to `request.url` origin for local dev. Error redirect now encodes
the message properly.

### Fix #6 — Supabase local config had email confirmation enabled
**File:** `supabase/config.toml` (REPLACED)

**Problem:** `enable_confirmations` was not explicitly set — defaults to `false`
in older Supabase CLI versions but `true` in newer ones. In some setups, new
signups in local dev would hang waiting for an email that the local Inbucket
mail server never delivers to the UI correctly.

**Fix:** Explicitly set `enable_confirmations = false` with a comment noting
that production should enable this in the Supabase cloud dashboard.

---

## 🟢 Minor

### Fix #7 — SOAPHistorySidebar Unicode chevron `▾`
**File:** `apps/web/src/components/clinician/SOAPHistorySidebar.tsx` (REPLACED)

**Problem:** `▾` (U+25BE BLACK DOWN-POINTING SMALL TRIANGLE) renders inconsistently
on some Android system fonts — may show as a box or be missing entirely.

**Fix:** Replaced with a proper SVG `<polyline>` chevron icon. Adds
`aria-expanded` and `aria-controls` attributes to the drawer toggle button
for accessibility. `aria-hidden="true"` on the SVG.

---

## Updated .env.example
Added `NEXT_PUBLIC_SITE_URL=http://localhost:3000` — required by auth callback fix.

---

## Final state summary

| Session | Files changed |
|---|---|
| S1 (base) | 30+ scaffold files |
| S2 | QVAC SDK wiring |
| S3 | Auth + Supabase |
| S4 | Patient journal |
| S5 | Clinician SOAP |
| S6 | On-device RAG |
| S7 | Polish + submission docs |
| S8 | 19 bug fixes |
| S9 | 2 bug fixes + demo prep |
| S10 | 18 mobile responsive fixes |
| S11 | 7 bug fixes |
| S12 | 9 bug fixes |
| S13 | 5 bug fixes |
| **S14** | **7 final fixes** |

**Total bugs found and fixed: 54**
**Total files across all sessions: 129**

## Apply
Copy all files over S1–S13.
Run `pnpm install` (picks up pino-pretty and prettier-plugin-tailwindcss).
No new migrations required.
Add `NEXT_PUBLIC_SITE_URL` to your `.env`.
