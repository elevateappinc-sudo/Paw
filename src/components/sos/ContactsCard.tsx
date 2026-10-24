"use client";
import Link from "next/link";
import { Phone, Plus } from "lucide-react";
import type { EmergencyContact } from "@/types/db";

function initialOf(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase("es") || "?";
}

/** Contactos mínimos: inicial, nombre y botón de llamar */
function ContactRow({ name, role, phone }: { name: string; role: string; phone?: string | null }) {
  return (
    <li className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-body font-semibold text-primary-text" aria-hidden="true">
        {initialOf(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold text-text">{name}</span>
        <span className="block text-small text-text-secondary">{role}</span>
      </span>
      {phone && (
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          aria-label={`Llamar a ${name}`}
          className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-text"
        >
          <Phone size={18} aria-hidden="true" />
        </a>
      )}
    </li>
  );
}

export function ContactsCard({ ownerName, ownerPhone, contact }: { ownerName: string | null; ownerPhone?: string | null; contact: EmergencyContact | null | undefined }) {
  return (
    <section aria-labelledby="sos-contactos" className="overflow-hidden rounded-lg border border-border bg-surface">
      <h2 id="sos-contactos" className="px-4 pt-4 pb-2 text-subtitle font-semibold text-text">
        Contactos
      </h2>
      <ul className="flex flex-col">
        <ContactRow name={ownerName ?? "Dueño"} role="Dueño" phone={ownerPhone} />
        {contact?.phone ? (
          <ContactRow name={contact.name || "Contacto de emergencia"} role="Emergencia" phone={contact.phone} />
        ) : (
          <li className="border-t border-border">
            <Link href="/mascotas" className="flex min-h-14 items-center gap-3 px-4 text-label font-semibold text-primary-text">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border">
                <Plus size={18} aria-hidden="true" />
              </span>
              Agregar contacto de emergencia
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}
