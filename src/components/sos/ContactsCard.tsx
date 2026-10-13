"use client";
import { Phone, User, Heart } from "lucide-react";
import { Card, CardHeader, Row, Divider } from "@/components/ui";
import type { EmergencyContact } from "@/types/db";

function CallButton({ phone, label }: { phone: string | null | undefined; label: string }) {
  if (!phone) return null;
  return (
    <a
      href={`tel:${phone.replace(/\s+/g, "")}`}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary active:scale-95"
    >
      <Phone size={20} aria-hidden="true" />
    </a>
  );
}

export function ContactsCard({ ownerName, ownerPhone, contact }: { ownerName: string | null; ownerPhone?: string | null; contact: EmergencyContact | null | undefined }) {
  return (
    <Card padded={false}>
      <CardHeader title="Contactos" className="px-4 pt-4 mb-0" />
      <Row icon={<User size={20} aria-hidden="true" />} iconTone="primary" title={ownerName ?? "Dueño"} subtitle="Dueño" trailing={<CallButton phone={ownerPhone} label={`Llamar a ${ownerName ?? "dueño"}`} />} />
      <Divider />
      {contact?.phone ? (
        <Row icon={<Heart size={20} aria-hidden="true" />} iconTone="danger" title={contact.name || "Contacto de emergencia"} subtitle={`Emergencia · ${contact.phone}`} trailing={<CallButton phone={contact.phone} label={`Llamar a ${contact.name}`} />} />
      ) : (
        <Row icon={<Heart size={20} aria-hidden="true" />} iconTone="container" title="Sin contacto de emergencia" subtitle="Agrégalo en el perfil de la mascota" href="/mascotas" />
      )}
    </Card>
  );
}
