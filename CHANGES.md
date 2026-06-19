# Session 9 — Changes

## Bug fixes

### Fix #8 — SOAPNoteDisplay missing field fallback
**File:** `apps/web/src/components/clinician/SOAPNoteDisplay.tsx` (REPLACED)

- Added `validateSOAP()` — checks all four fields are non-empty
- Incomplete notes show an amber warning banner listing missing fields
- Each panel shows its `fallback` string (e.g. "No plan recorded.") instead
  of silently rendering blank
- Missing panels get `ring-amber-100` border and "missing" label
- Copy buttons hidden on empty panels (nothing useful to copy)

### Fix #18 — SOAPInputForm example cycling
**File:** `apps/web/src/components/clinician/SOAPInputForm.tsx` (REPLACED)

- Replaced `Math.random()` with `useRef` cycling index
- 3 distinct clinical examples (anxiety/job loss, grief, medication follow-up)
- Button label shows current position: "Load example (2/3)"
- Added "Clear" button to reset form
- Remaining character counter turns amber at <500 chars
- `tooShort` inline validation with live character count feedback
- "Do not close this tab" added to generating state message

## Demo preparation

### docs/DEMO_SCRIPT.md  (NEW)
Shot-by-shot 7-minute video script:
- 10 scenes with exact narration for each
- Network tab callout instructions
- Offline WiFi-disconnect scene
- Pre-recording checklist
- Post-recording notes

### docs/evidence-capture.sh  (NEW)
Automated evidence bundle script:
- Stage 1: API health check → JSON output
- Stage 2: Model registry status
- Stage 3: External API URL audit (grep for openai/anthropic/cohere/etc)
- Stage 4: QVAC SDK usage verification
- Stage 5: Companion endpoint benchmark with timing
- Stage 6: SOAP endpoint benchmark with timing
- Stage 7: Hardware spec capture (cross-platform: macOS + Linux)
- All output written to `docs/evidence/<timestamp>/`

### docs/DORAHACKS_SUBMISSION.md  (NEW)
Submission-ready write-up:
- Problem framing (mental health privacy gap)
- What we built (both personas)
- SDK usage table (every API call mapped)
- Full tech stack with rationale
- Three-way privacy proof (code audit, network tab, offline test)
- Performance benchmarks on M2 MacBook
- Novelty argument
- Reproducibility snippet

## Apply
Copy all files over S1–S8. No code changes to the application itself.
