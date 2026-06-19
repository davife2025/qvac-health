"use client";

interface AIResponsePanelProps {
  streaming: boolean;
  text: string;
  error: string | null;
  onRetry?: () => void;
}

export function AIResponsePanel({
  streaming,
  text,
  error,
  onRetry,
}: AIResponsePanelProps) {
  if (!streaming && !text && !error) return null;

  return (
    <div className="rounded-2xl bg-calm-50 p-4 ring-1 ring-calm-100 space-y-2">
      {/* Header — wraps gracefully on narrow screens */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-calm-600 text-white text-xs font-bold">
            Q
          </div>
          <span className="text-xs font-semibold text-calm-700 whitespace-nowrap">
            QVAC Companion
          </span>
        </div>

        {streaming && (
          <span className="flex items-center gap-1 text-xs text-calm-500">
            <span className="inline-flex gap-0.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1 h-1 rounded-full bg-calm-400 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
            <span>thinking…</span>
          </span>
        )}

        <span className="ml-auto text-[10px] text-calm-400 bg-calm-100 rounded-full px-2 py-0.5 whitespace-nowrap">
          on-device · private
        </span>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-sm text-red-600 space-y-2">
          <p>{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs underline hover:no-underline text-red-500"
            >
              Try again
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-calm-900 leading-relaxed whitespace-pre-wrap break-words">
          {text}
          {streaming && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-calm-500 animate-pulse align-text-bottom" />
          )}
        </p>
      )}
    </div>
  );
}
