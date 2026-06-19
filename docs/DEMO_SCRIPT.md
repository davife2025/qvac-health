# QVAC Health — Demo Video Script
## Target length: 6–8 minutes

---

## Pre-recording checklist

- [ ] `pnpm dev` running — web on :3000, API on :3001
- [ ] Browser DevTools open on Network tab, filter: Fetch/XHR
- [ ] Screen recorder ready (OBS or QuickTime)
- [ ] WiFi icon visible in menu bar (for offline scene)
- [ ] Microphone test done
- [ ] Browser zoom at 100% — readable on 1080p

---

## Scene 1 — Hook (0:00–0:30)

**Show:** Landing page at `localhost:3000`

**Say:**
> "Most AI tools for mental health send your most sensitive data to the cloud.
> QVAC Health doesn't. Every token of inference, every journal entry, every
> clinical note — stays on this device. I'm going to show you exactly how,
> and prove it with the network tab."

**Action:** Slowly scroll the landing page so judges see the tech stack grid
and the four privacy badges.

---

## Scene 2 — Sign up (0:30–1:00)

**Show:** `/auth/signup`

**Say:**
> "Two personas — patient and clinician. I'll demo both.
> First, the patient experience."

**Action:**
1. Fill in email + password, select "Patient" radio
2. Click "Create account"
3. Show redirect to `/journal`

---

## Scene 3 — Model loading (1:00–1:45)

**Show:** Model loader component on `/journal`

**Say:**
> "On first use, QVAC downloads MedPsy-1.7B — a medical and psychiatry-tuned
> model — directly to this device. About one gigabyte. After this it runs
> fully offline."

**Action:**
1. Click "Load AI Model"
2. Let progress bar fill — narrate the percentage
3. When it hits "✅ AI model ready" — pause

**Say:**
> "Notice the Network tab. The download comes from HuggingFace — that's a
> one-time model fetch. After this, every inference call goes to localhost only."

---

## Scene 4 — Patient journal — write + AI reflection (1:45–3:30)

**Show:** Journal editor

**Say:**
> "I'll write a journal entry. Watch the Network tab as the AI responds."

**Action:**
1. Pick mood — click "😟 Low"
2. Add tags: "work", "sleep"
3. Type entry (pre-written, paste it):
   > *"Had a really difficult week. The project deadline is looming and I keep
   > waking up at 3am with my mind racing. I feel like I can't switch off even
   > when I'm not at my desk."*
4. Click "Save & reflect"
5. **Zoom into Network tab** — show only `POST localhost:3001/ai/companion`
6. Watch tokens stream in the AI response panel

**Say:**
> "The only network call is to localhost. The MedPsy model is running right
> here, on this machine. No OpenAI. No Anthropic. No API bill."

**Show:** AI response fully rendered in the blue companion panel.

---

## Scene 5 — Related entries (semantic RAG) (3:30–4:00)

**Say:**
> "Now I'll write a second entry and show the semantic memory feature."

**Action:**
1. Start typing a new entry about similar themes (sleep, stress)
2. After ~100 chars — pause and point to the "Related past entries" panel appearing
3. Show the similarity percentage

**Say:**
> "That's GTE-Large running locally — embedding search over the vector store.
> No external API. All SQLite-vec on this device."

---

## Scene 6 — Offline proof (4:00–4:30)

**Say:**
> "Now the moment of truth — I'm going to disconnect from the internet."

**Action:**
1. Turn off WiFi (visible in menu bar)
2. Write another journal entry
3. Click "Save & reflect"
4. Show AI response streaming as normal
5. Turn WiFi back on

**Say:**
> "Full AI inference with no internet connection. That's edge AI."

---

## Scene 7 — Clinician SOAP notes (4:30–6:00)

**Say:**
> "Now the clinician side. I'll sign up as a clinician."

**Action:**
1. Open incognito tab → `/auth/signup` → select Clinician → sign up
2. Go to `/clinician`
3. Load SOAP_LLM model (MedPsy-4B) — show progress bar

**Say:**
> "MedPsy-4B — 2.5 gigabytes. More capable model for structured clinical output."

**Action (once loaded):**
1. Click "Load example" — paste clinical notes
2. Enter patient ref: "P-042"
3. Click "Generate SOAP note"
4. **Keep Network tab visible** — show only `POST localhost:3001/ai/soap`
5. Wait for the four-panel S/O/A/P result

**Say:**
> "Subjective, Objective, Assessment, Plan — structured from free-form session
> notes in under 60 seconds on this laptop. The raw notes and generated output
> never left this machine."

6. Click "Copy all" — paste into a text editor to show the full output

---

## Scene 8 — Semantic search (6:00–6:30)

**Action:**
1. Load the Embeddings model
2. Switch to the "Search" tab
3. Type: "anxiety and sleep disturbance"
4. Show results with similarity scores

**Say:**
> "Semantic search across all SOAP notes — by clinical concept, not keyword.
> The vector store is local SQLite-vec. Nothing leaves the device."

---

## Scene 9 — Architecture wrap-up (6:30–7:00)

**Show:** `/settings` page

**Say:**
> "The privacy architecture is explicit in the settings page. Health content
> in IndexedDB — device only. AI inference — QVAC SDK — device only.
> Semantic vectors — SQLite-vec — device only. Supabase only sees metadata:
> IDs, timestamps, content hashes."

**Show:** DevTools → Application → IndexedDB → qvac-health → journal_content

**Say:**
> "And here's the proof — the actual journal text, stored locally in IndexedDB.
> Supabase has the hash. The words belong to the user."

---

## Scene 10 — Close (7:00–7:30)

**Show:** Landing page

**Say:**
> "QVAC Health — local-first mental health AI. Open source, MIT licensed.
> Built entirely on the QVAC SDK — on-device LLM, embeddings, RAG — proving
> that privacy-preserving AI is production-ready today."

**Action:** Show GitHub repo README briefly.

---

## Post-recording

- Trim dead air during model loading
- Add captions for the network tab callouts
- Export at 1080p minimum
- Upload to YouTube (unlisted) or Loom — paste URL into Dorahacks submission
