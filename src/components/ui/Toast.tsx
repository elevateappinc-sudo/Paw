"use client";
import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  message: string;
  onRetry?: () => void;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
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
      }}
    >
      <span style={{ fontSize: 14, color: "rgba(235,235,245,0.9)", flex: 1 }}>
        {toast.message}
      </span>
      {toast.onRetry && (
        <button
          onClick={() => {
            toast.onRetry?.();
            onDismiss(toast.id);
          }}
          style={{
            background: "#ff375f",
            border: "none",
            borderRadius: 8,
            padding: "6px 12px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Reintentar
        </button>
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
let _showToast: ((msg: string, onRetry?: () => void) => void) | null = null;

export function registerToastHandler(
  handler: (msg: string, onRetry?: () => void) => void
) {
  _showToast = handler;
}

export function showToast(msg: string, onRetry?: () => void) {
  if (_showToast) _showToast(msg, onRetry);
  else console.warn("[Toast]", msg);
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = (message: string, onRetry?: () => void) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, onRetry }]);
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
