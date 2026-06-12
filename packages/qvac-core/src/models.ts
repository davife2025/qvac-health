/**
 * Model registry for qvac-health.
 *
 * We use two model families:
 *   - MedPsy models (QVAC's own medical/psych-tuned LLMs) for clinical features
 *   - Llama 3.2 1B for lightweight patient-facing companion responses
 *   - GTE Large for on-device RAG / semantic search over journal entries
 *
 * NOTE: Import the actual SDK constants — don't hardcode HuggingFace URLs.
 * The SDK handles caching and P2P distribution automatically.
 */

// We use dynamic imports so this module can be tested without the native SDK
// bindings present (the SDK requires platform-specific native addons).

export const MODEL_REGISTRY = {
  /**
   * Patient companion — lightweight, fast, runs on any device.
   * LLAMA_3_2_1B_INST_Q4_0 ~600 MB, works on phones.
   */
  COMPANION_LLM: "LLAMA_3_2_1B_INST_Q4_0" as const,

  /**
   * Clinician SOAP notes — higher quality output, needs a laptop+.
   * We'll use the MedPsy model once we confirm the exact SDK constant
   * from the QVAC HuggingFace collection in S2.
   * Placeholder: LLAMA_3_2_3B or medpsy variant.
   */
  SOAP_LLM: "LLAMA_3_2_1B_INST_Q4_0" as const, // upgraded in S2

  /**
   * Embeddings model for RAG over journal entries.
   * GTE_LARGE_FP16 gives high-quality semantic search.
   */
  EMBEDDINGS: "GTE_LARGE_FP16" as const,
} as const;

export type ModelKey = keyof typeof MODEL_REGISTRY;

export const SYSTEM_PROMPTS = {
  COMPANION: `You are a compassionate, non-judgmental mental health companion.
Your role is to listen, reflect, and gently support the user through their journal entries.
Never diagnose. Never prescribe. Always encourage professional help for serious concerns.
Keep responses warm, concise (2-4 sentences), and validating.
All conversations are private and stay on this device.`,

  SOAP_GENERATOR: `You are a clinical documentation assistant helping a licensed mental health professional.
Given raw session notes or a transcript, generate a structured SOAP note.
Output ONLY valid JSON in this exact format:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}
Be precise, clinical, and use professional terminology. Do not add commentary outside the JSON.`,
} as const;
