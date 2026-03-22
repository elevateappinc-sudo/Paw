"use client";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Lock body scroll & capture trigger element
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      // Move focus to first focusable element inside modal on next frame
      const raf = requestAnimationFrame(() => {
        const first = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)[0];
        first?.focus();
      });
      return () => cancelAnimationFrame(raf);
    } else {
      document.body.style.overflow = "";
      // Return focus to the trigger when modal closes
      triggerRef.current?.focus();
      triggerRef.current = null;
    }
  }, [open]);

  // Focus-trap: keep Tab / Shift+Tab inside the modal
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!open) return;

    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (e.key !== "Tab") return;

    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? []
    ).filter((el) => el.offsetParent !== null); // exclude hidden

    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{
          background: "#1a1a1e",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 id="modal-title" className="font-semibold text-white text-base">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.08)" }}
            aria-label="Cerrar modal"
          >
            <X size={14} style={{ color: "#8e8e98" }} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
