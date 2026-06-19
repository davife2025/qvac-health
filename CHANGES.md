# Session 7 — Changes (Final)

## What's new / changed

### apps/web/src/app/global-error.tsx  (NEW)
- Top-level error boundary — catches unhandled errors across the entire app
- Shows error message, digest ref, Try again + Go home actions
- Reassures user their local data is safe

### apps/web/src/app/journal/error.tsx  (NEW)
### apps/web/src/app/clinician/error.tsx  (NEW)
- Route-level error boundaries for journal and clinician pages
- Prevents a single route error from crashing the whole app

### apps/web/src/app/not-found.tsx  (NEW)
- Clean 404 page

### apps/web/src/app/journal/loading.tsx  (NEW)
### apps/web/src/app/clinician/loading.tsx  (NEW)
- Skeleton loading states (animated pulse) for both main routes
- Match the actual layout to prevent layout shift

### apps/web/src/app/settings/page.tsx  (NEW)
- Account info (email, role, member since)
- Privacy architecture breakdown (what goes where)
- Local data warning (no cloud backup by design)
- Sign out with data-safety note

### apps/web/src/app/page.tsx  (REPLACED)
- Full polished landing page
- Hero with value prop headline
- Privacy badge strip
- Smart CTA: if logged in → go to role-appropriate page
- Feature cards for both personas
- Tech stack grid for judges
- Powered by QVAC footer

### apps/web/src/app/layout.tsx  (REPLACED)
- Wraps app in ToastProvider
- Full OpenGraph + meta tags added
- Template title format: "%s · QVAC Health"

### apps/web/src/app/globals.css  (REPLACED)
- Added active:scale-[0.98] to buttons for tactile feedback
- animate-in + slide-in-from-bottom-2 keyframes for Toast
- line-clamp-4 utility for SOAP search results
- -webkit-tap-highlight-color removed for mobile
- touch-action: manipulation on interactive elements

### apps/web/src/components/Nav.tsx  (REPLACED)
- Sticky + backdrop-blur on scroll
- Mobile responsive: icon-only for Settings/Sign out on small screens
- Settings link added

### apps/web/src/components/ui/Toast.tsx  (NEW)
- ToastProvider + useToast hook
- Success / error / info variants
- Auto-dismiss after 3s with slide-in animation

### apps/web/src/components/ui/EmptyState.tsx  (NEW)
- Reusable empty state component with icon, title, description, action slot

### apps/web/src/components/ui/Spinner.tsx  (NEW)
- Consistent loading spinner in sm/md/lg sizes

### apps/api/src/config/env.ts  (REPLACED)
- Added RATE_LIMIT_MAX + RATE_LIMIT_WINDOW_MS env vars
- Added WEB_URL validation

### apps/api/src/plugins/logger.ts  (NEW)
- onResponse hook: logs method, path, status, duration, userId
- Never logs request bodies (privacy)

### apps/api/src/server.ts  (REPLACED)
- Registers loggerPlugin
- Startup banner showing all available routes
- Uses env.WEB_URL in CORS origin (production-safe)

### .env.example  (REPLACED)
- All vars documented with comments
- Rate limiting vars added

### .prettierrc  (NEW)
- Consistent formatting config with prettier-plugin-tailwindcss

### eslint.config.mjs  (NEW)
- Flat ESLint config (ESLint v9)
- TypeScript rules, no-console warn, unused vars error

### .github/workflows/ci.yml  (NEW)
- Typecheck + lint on every push/PR to main
- Note explaining why inference tests don't run in CI

### README.md  (REPLACED — FINAL)
- Architecture diagram (ASCII art)
- Full model table with sizes and sources
- Quickstart from zero to running
- Complete API reference table
- Evidence bundle link
- Privacy audit SQL snippet

### docs/EVIDENCE.md  (NEW)
- Stage 1: code verification — SDK usage map, no-cloud-inference audit
- Stage 2: demo recording checklist — patient flow + clinician flow + offline demo
- Stage 3: technical verification — env specs, model checksums, benchmark curl commands
- Dorahacks submission checklist
- Strategy write-up template for judges

### CONTRIBUTING.md  (NEW)
- Privacy ground rules
- Branch conventions
- PR checklist

## Apply
Copy all files over S1–S6. Run:
  pnpm install   (picks up prettier-plugin-tailwindcss if not already present)

## Submission checklist
- [ ] Push to GitHub (public repo, MIT license)
- [ ] Record demo video following docs/EVIDENCE.md Stage 2
- [ ] Take Network tab screenshots (offline inference proof)
- [ ] Submit on Dorahacks with repo URL + video + strategy write-up
- [ ] Join QVAC Discord and share your submission
