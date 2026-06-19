"use client";

import {
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
} from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3
              text-sm font-medium shadow-lg ring-1 animate-in slide-in-from-bottom-2
              ${t.type === "success" ? "bg-green-600 text-white ring-green-700" : ""}
              ${t.type === "error" ? "bg-red-600 text-white ring-red-700" : ""}
              ${t.type === "info" ? "bg-blue-600 text-white ring-blue-700" : ""}
            `}
          >
            <span>
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
