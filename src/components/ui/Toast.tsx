"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

export interface ToastMessage {
  id: string;
  message: string;
  onRetry?: () => void;
  tone?: "default" | "success" | "error";
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const tone = toast.tone === "success" ? "border-ok" : toast.tone === "error" ? "border-danger" : "border-outline-variant";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      role="status"
      className={`mb-2 flex w-[min(92vw,360px)] items-center gap-3 rounded-card-lg border bg-surface px-4 py-3 text-on shadow-3 ${tone}`}
    >
      <span className="flex-1 text-[14px] font-semibold">{toast.message}</span>
      {toast.onRetry && (
        <button
          type="button"
          onClick={() => {
            toast.onRetry?.();
            onDismiss(toast.id);
          }}
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[13px] font-bold text-on-primary"
        >
          Reintentar
        </button>
      )}
      <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Cerrar aviso" className="shrink-0 text-on-variant">
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[9999] flex flex-col-reverse items-center">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

let _showToast: ((msg: string, onRetry?: () => void, tone?: ToastMessage["tone"]) => void) | null = null;

export function registerToastHandler(handler: (msg: string, onRetry?: () => void, tone?: ToastMessage["tone"]) => void) {
  _showToast = handler;
}

export function showToast(msg: string, onRetry?: () => void, tone?: ToastMessage["tone"]) {
  if (_showToast) _showToast(msg, onRetry, tone);
  else console.warn("[Toast]", msg);
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = (message: string, onRetry?: () => void, tone?: ToastMessage["tone"]) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, onRetry, tone }]);
  };

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    registerToastHandler(show);
    return () => registerToastHandler(() => {});
  }, []);

  return { toasts, show, dismiss };
}

export function Toast() {
  return null;
}
