# Session 5 — Changes

## What's new / changed

### apps/api/src/routes/soap.ts  (NEW)
- GET    /soap/notes       — list SOAP metadata for authed clinician
- POST   /soap/notes       — save metadata (patient_ref + content_hash)
- DELETE /soap/notes/:id   — delete metadata record
- Clinician-role gated on all routes

### apps/api/src/server.ts  (REPLACED)
- Registers soapRoutes

### apps/web/src/lib/local-soap-store.ts  (NEW)
- IndexedDB store for SOAP content (bumps DB_VERSION to 2)
- Adds "soap_content" object store with patientRef index
- saveSOAPNote(), getSOAPNote(), getAllSOAPNotes(), deleteSOAPNote()
- hashContent() shared utility

### apps/web/src/hooks/useSOAP.ts  (NEW)
- generate() — calls /api/ai/soap, saves local, POSTs metadata
- deleteNote() — removes from Supabase + IndexedDB
- GenerationState type: idle | generating | done | error

### apps/web/src/components/clinician/SOAPInputForm.tsx  (NEW)
- Raw notes textarea (10k char limit)
- Anonymous patient ref input (warns against real names)
- Load example button (2 realistic clinical examples)
- Generating state with bouncing dots + estimated time warning
- Inline validation before calling generate

### apps/web/src/components/clinician/SOAPNoteDisplay.tsx  (NEW)
- Four-panel grid: Subjective / Objective / Assessment / Plan
- Per-section Copy button + Copy all button
- Generation metadata: timestamp, duration, model label
- Privacy footer: "Generated locally · never sent to cloud"

### apps/web/src/components/clinician/SOAPHistorySidebar.tsx  (NEW)
- Notes grouped by patient reference
- Search/filter by patient ref
- Click to select and view in main panel
- Hover-reveal delete with confirm step

### apps/web/src/components/clinician/ClinicianView.tsx  (NEW)
- ModelLoader gate (SOAP_LLM must load first)
- New / History tab switcher
- Two-column layout on desktop: form+result | sidebar
- Stats card: total notes + unique patients

### apps/web/src/app/clinician/page.tsx  (REPLACED)
- Thin server component: auth + role check → renders ClinicianView

## Apply
Copy all files over S1–S4 codebase. No new packages needed.
supabase db push not required (schema unchanged from S3).
