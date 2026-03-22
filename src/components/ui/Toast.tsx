"use client";
import { useEffect, useState } from "react";
import { Button } from "./Button";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
  onRetry?: () => void;
}

const TYPE_BORDER: Record<ToastType, string> = {
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "rgba(255,255,255,0.12)",
};

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  const type: ToastType = toast.type ?? "info";
  const borderColor = TYPE_BORDER[type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 6000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      style={{
        background: "#2c2c2e",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 8,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 280,
        maxWidth: 340,
        animation: "slideUp 0.2s ease-out",
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <span style={{ fontSize: 14, color: "rgba(235,235,245,0.9)", flex: 1 }}>
        {toast.message}
      </span>
      {toast.onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            toast.onRetry?.();
            onDismiss(toast.id);
          }}
        >
          Reintentar
        </Button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(235,235,245,0.4)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column-reverse",
        alignItems: "center",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Hook
let _showToast: ((msg: string, type?: ToastType, onRetry?: () => void) => void) | null = null;

export function registerToastHandler(
  handler: (msg: string, type?: ToastType, onRetry?: () => void) => void
) {
  _showToast = handler;
}

export function showToast(msg: string, type?: ToastType, onRetry?: () => void) {
  if (_showToast) _showToast(msg, type, onRetry);
  else console.warn("[Toast]", msg);
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = (message: string, type?: ToastType, onRetry?: () => void) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type: type ?? "info", onRetry }]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    registerToastHandler(show);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { toasts, dismiss };
}
