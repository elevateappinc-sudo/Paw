"use client";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PetRow } from "@/types/db";

interface Row {
  label: string;
  value: string;
  warn?: boolean;
  mono?: boolean;
}

/**
 * Ficha médica (antes "Datos clave"), al estilo de la Ficha Médica de iOS:
 * tarjeta blanca sin sombra, filas etiqueta / valor separadas por una línea
 * fina y solo los datos que existen. Las alergias van primero y en color de
 * advertencia; el contacto de emergencia lleva su botón de llamar.
 */
export function PetTag({ pet }: { pet: PetRow }) {
  const candidates: (Row | null)[] = [
    pet.allergies?.length ? { label: "Alergias", value: pet.allergies.join(", "), warn: true } : null,
    pet.conditions?.length ? { label: "Condiciones", value: pet.conditions.join(", ") } : null,
    pet.blood_type ? { label: "Sangre", value: pet.blood_type } : null,
    pet.microchip ? { label: "Microchip", value: pet.microchip, mono: true } : null,
  ];
  const rows = candidates.filter((r): r is Row => r !== null);
  const contact = pet.emergency_contact?.phone ? pet.emergency_contact : null;

  return (
    <section aria-labelledby="pet-medical-id" className="overflow-hidden rounded-xl border border-border bg-surface">
      <h3 id="pet-medical-id" className="px-4 pt-4 pb-1 text-subtitle font-semibold text-text">
        Ficha médica
      </h3>
      {rows.length === 0 && !contact ? (
        <p className="px-4 pb-4 text-small text-text-secondary">Sin datos todavía. Agrégalos con el lápiz de arriba.</p>
      ) : (
        <dl>
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-4 border-t border-border px-4 py-3 first:border-t-0">
              <dt className="shrink-0 text-small text-text-secondary">{r.label}</dt>
              <dd className={cn("min-w-0 text-right text-body font-semibold", r.warn ? "text-warning-text" : "text-text", r.mono && "font-mono tracking-wider")}>{r.value}</dd>
            </div>
          ))}
          {contact && (
            <div className="flex items-center justify-between gap-4 border-t border-border py-2 pr-2 pl-4">
              <dt className="shrink-0 text-small text-text-secondary">Emergencia</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <span className="truncate text-body font-semibold text-text">{contact.name}</span>
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                  aria-label={`Llamar a ${contact.name || "contacto de emergencia"}`}
                  className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-success-text"
                >
                  <Phone size={18} aria-hidden="true" />
                </a>
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
