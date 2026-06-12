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
  // Content stays LOCAL — only metadata in Supabase
  contentHash: string; // SHA-256 of local content for integrity check
  mood: MoodLevel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLocal extends JournalEntry {
  content: string; // Lives in local SQLite only
  aiResponse?: string; // QVAC-generated reflection
}

// ─── Clinical SOAP Notes ──────────────────────────────────────────────────────

export interface SOAPNote {
  id: string;
  clinicianId: string;
  patientRef: string; // Anonymous reference, not real ID
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  rawTranscript?: string;
  generatedAt: string;
}

// ─── QVAC / AI ───────────────────────────────────────────────────────────────

export type ModelType = "llm" | "embeddings" | "tts";

export interface ModelStatus {
  modelId: string;
  modelType: ModelType;
  loaded: boolean;
  progress?: number;
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

// ─── API Response wrappers ────────────────────────────────────────────────────

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
