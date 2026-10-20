"use client";
import { RotateCw } from "lucide-react";
import { Button, Card } from "@/components/ui";

/** Error de una sección de Inicio con reintento (sin rojo: el rojo es solo SOS) */
export function HomeSectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card role="alert" className="enter-soft flex items-center gap-3">
      <p className="min-w-0 flex-1 text-body text-text-secondary">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry} leading={<RotateCw size={14} aria-hidden="true" />}>
        Reintentar
      </Button>
    </Card>
  );
}
