# Session 4 — Changes

## What's new / changed

### apps/api/src/routes/journal.ts  (NEW)
- GET    /journal/entries       — list entry metadata (Supabase only)
- POST   /journal/entries       — save new metadata (content_hash + mood + tags)
- PUT    /journal/entries/:id   — update mood/tags
- DELETE /journal/entries/:id   — delete metadata record
- Auth + patient-role guarded on all routes
- User ID always sourced from verified JWT, never request body

### apps/api/src/server.ts  (REPLACED)
- Registers journalRoutes

### apps/web/src/lib/local-journal-store.ts  (NEW)
- IndexedDB wrapper for on-device journal content
- saveContent(), getContent(), getAllContent(), deleteContent()
- hashContent() — SHA-256 via Web Crypto API (for metadata sync)
- No external dependencies

### apps/web/src/hooks/useJournal.ts  (NEW)
- Merges Supabase metadata rows with IndexedDB content into LocalEntry[]
- saveEntry()       — hashes content, POSTs metadata, saves local content
- attachAIResponse() — saves AI response locally only (never to cloud)
- deleteEntry()     — removes from both Supabase and IndexedDB
- loadEntries()     — fetches metadata + merges with local on mount

### apps/web/src/hooks/useCompanionStream.ts  (NEW)
- SSE stream hook for companion LLM
- AbortController for cancellation
- Accumulates tokens into full text string
- onToken / onDone / onError callbacks

### apps/web/src/components/journal/MoodPicker.tsx  (NEW)
- 5-level mood selector with emoji + labels
- MoodBadge component for display in entry cards

### apps/web/src/components/journal/TagInput.tsx  (NEW)
- Comma/Enter separated tag input
- Backspace to remove last tag
- Max 10 tags, max 30 chars each

### apps/web/src/components/journal/AIResponsePanel.tsx  (NEW)
- Streaming token display with animated cursor
- Bouncing dots "thinking" indicator
- "on-device · private" badge
- Error state with retry

### apps/web/src/components/journal/MoodSparkline.tsx  (NEW)
- SVG line chart of last 30 entries mood trend
- Gradient fill, colored dots per mood level
- Average mood label ("Great week", "Tough stretch", etc.)

### apps/web/src/components/journal/JournalEditor.tsx  (NEW)
- Full write experience: textarea + MoodPicker + TagInput
- Saves entry then immediately streams AI companion response
- Resets form after save
- Character counter (5000 limit)

### apps/web/src/components/journal/JournalEntryCard.tsx  (NEW)
- Past entry display with expand/collapse for long content
- Collapsible AI response panel
- Hover-reveal delete with confirmation step
- Tags + mood badge display

### apps/web/src/components/journal/JournalView.tsx  (NEW)
- Main client orchestrator component
- ModelLoader gate (must be ready before writing)
- MoodSparkline (shows when ≥2 entries)
- JournalEditor + entry list
- Search/filter across content and tags

### apps/web/src/app/journal/page.tsx  (REPLACED)
- Now a thin server component: auth check → renders JournalView

## Apply instructions
Copy all files over S1–S3 codebase. No new npm packages needed.
pnpm dev runs everything.
