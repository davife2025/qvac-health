/**
 * Model registry for qvac-health.
 *
 * LLM choices (confirmed from HuggingFace qvac/MedPsy collection):
 *   - MedPsy-1.7B-GGUF  ~1GB   → patient companion (runs on phones/low-RAM)
 *   - MedPsy-4B-GGUF    ~2.5GB → clinician SOAP notes (laptop+)
 *
 * The SDK built-in registry may not yet carry MedPsy constants, so we use
 * direct HuggingFace HTTPS URLs — the SDK handles caching/checksums for these.
 * Q4_K_M is the recommended quantization per QVAC docs ("best size/quality trade-off").
 *
 * Embeddings: GTE_LARGE_FP16 is a built-in SDK constant, so we use it directly.
 */

// ─── HuggingFace GGUF URLs ────────────────────────────────────────────────────

export const MEDPSY_1_7B_URL =
  "https://huggingface.co/qvac/MedPsy-1.7B-GGUF/resolve/main/medpsy-1.7b-q4_k_m.gguf";

export const MEDPSY_4B_URL =
  "https://huggingface.co/qvac/MedPsy-4B-GGUF/resolve/main/medpsy-4b-q4_k_m.gguf";

// ─── Model registry ───────────────────────────────────────────────────────────

export const MODEL_REGISTRY = {
  /**
   * Patient companion — MedPsy-1.7B Q4_K_M (~1GB).
   * Medical/psych tuned, fast enough for mobile devices.
   * Uses HF URL since MedPsy may not be in SDK built-in constants yet.
   */
  COMPANION_LLM: {
    src: MEDPSY_1_7B_URL,
    type: "llm" as const,
    label: "MedPsy-1.7B (Companion)",
    minRamMb: 1200,
  },

  /**
   * Clinician SOAP notes — MedPsy-4B Q4_K_M (~2.5GB).
   * Higher quality clinical output, requires a laptop/desktop.
   */
  SOAP_LLM: {
    src: MEDPSY_4B_URL,
    type: "llm" as const,
    label: "MedPsy-4B (Clinician)",
    minRamMb: 3000,
  },

  /**
   * Embeddings for RAG — built-in SDK constant.
   * GTE_LARGE_FP16 gives high semantic search quality.
   */
  EMBEDDINGS: {
    src: "GTE_LARGE_FP16", // resolved from SDK exports at load time
    type: "embeddings" as const,
    label: "GTE-Large (Embeddings)",
    minRamMb: 700,
  },
} as const;

export type ModelKey = keyof typeof MODEL_REGISTRY;

// ─── RAG workspaces ───────────────────────────────────────────────────────────

export const RAG_WORKSPACES = {
  JOURNAL: "journal-entries",
  SOAP: "soap-notes",
} as const;

// ─── System prompts ───────────────────────────────────────────────────────────

export const SYSTEM_PROMPTS = {
  COMPANION: `You are a compassionate, non-judgmental mental health companion.
Your role is to listen, reflect, and gently support the user through their journal entries.
Never diagnose. Never prescribe medications. Always encourage professional help for serious concerns.
Keep responses warm, concise (2-4 sentences), and emotionally validating.
All conversations are private and stay on this device.`,

  SOAP_GENERATOR: `You are a clinical documentation assistant helping a licensed mental health professional.
Given raw session notes or a transcript, generate a structured SOAP note.
Output ONLY valid JSON with no preamble, no markdown fences, no commentary:
{
  "subjective": "Patient's own words, reported symptoms, history",
  "objective": "Clinician's observations, mental status exam findings",
  "assessment": "Clinical impression, diagnosis considerations",
  "plan": "Treatment plan, next steps, referrals, follow-up"
}
Be precise, clinical, and professional. Do not add any text outside the JSON object.`,
} as const;
