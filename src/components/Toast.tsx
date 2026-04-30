"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; text: string; Icon: typeof CheckCircle }> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    Icon: CheckCircle,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    Icon: AlertCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs = 3500) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant, durationMs }]);
    },
    [],
  );

  const success = useCallback((m: string, d?: number) => show(m, "success", d), [show]);
  const error = useCallback((m: string, d?: number) => show(m, "error", d ?? 5000), [show]);
  const info = useCallback((m: string, d?: number) => show(m, "info", d), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastItemView key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItemView({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) {
  const style = VARIANT_STYLES[toast.variant];
  const Icon = style.Icon;

  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.durationMs);
    return () => clearTimeout(t);
  }, [toast.id, toast.durationMs, onRemove]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 pr-2 rounded-xl shadow-lg border ${style.bg} ${style.border} animate-slide-up`}
      role="alert"
    >
      <Icon size={18} className={`${style.text} flex-shrink-0 mt-0.5`} />
      <p className={`flex-1 text-sm leading-snug ${style.text}`}>{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className={`p-1 rounded-md hover:bg-white/60 ${style.text}`}
        aria-label="닫기"
      >
        <X size={14} />
      </button>
    </div>
  );
}
