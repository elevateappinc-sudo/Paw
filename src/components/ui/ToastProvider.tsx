"use client";
import { ToastContainer, useToasts } from "./Toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToasts();
  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
