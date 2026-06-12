// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: "patient" | "clinician";
  createdAt: string;
}

// ─── Journal (Patient) ────────────────────────────────────────────────────────

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  id: string;
  userId: string;
  contentHash: string;
  mood: MoodLevel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLocal extends JournalEntry {
  content: string;
  aiResponse?: string;
}

// ─── Clinical SOAP Notes ──────────────────────────────────────────────────────

export interface SOAPFields {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface SOAPNote {
  id: string;
  clinicianId: string;
  patientRef: string;
  soap: SOAPFields;
  rawTranscript?: string;
  durationMs: number;
  generatedAt: string;
  modelLabel: string;
}

// ─── QVAC / AI ───────────────────────────────────────────────────────────────

export type ModelType = "llm" | "embeddings" | "tts" | "whisper";

export type ModelKey = "COMPANION_LLM" | "SOAP_LLM" | "EMBEDDINGS";

export interface ModelStatus {
  modelId: string;
  modelType: ModelType;
  loaded: boolean;
}

export interface CompletionRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  text: string;
  modelId: string;
  durationMs: number;
}

export interface RAGSearchRequest {
  query: string;
  topK?: number;
}

export interface RAGSearchResult {
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Health check ─────────────────────────────────────────────────────────────

export interface HealthCheckResponse {
  status: "ok" | "degraded";
  qvacReady: boolean;
  modelsLoaded: string[];
  uptime: number;
}
