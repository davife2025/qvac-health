/**
 * @qvac-health/ui — shared React components across the monorepo.
 *
 * These components have no app-specific logic (no Supabase, no QVAC SDK).
 * They are pure presentational components safe to import from any app.
 */

export { EmptyState } from "./EmptyState.js";
export { Spinner } from "./Spinner.js";
export { ToastProvider, useToast } from "./Toast.js";
export type { ToastType } from "./Toast.js";
