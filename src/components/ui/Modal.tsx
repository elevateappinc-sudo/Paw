"use client";
import { Sheet } from "./Sheet";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Compat: los módulos antiguos usan Modal; ahora es una hoja inferior. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {children}
    </Sheet>
  );
}
