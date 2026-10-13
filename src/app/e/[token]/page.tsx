import type { Metadata } from "next";
import { Phone, AlertTriangle, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ageLabel, SPECIES_LABEL, SEX_LABEL } from "@/lib/api/pets";
import { formatDate } from "@/lib/utils";
import type { EmergencyCard } from "@/types/db";
import { SightingForm } from "@/components/emergencia/SightingForm";

export const metadata: Metadata = { title: "Ficha de emergencia" };
export const dynamic = "force-dynamic";

async function loadCard(token: string): Promise<EmergencyCard | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("pet_emergency_card", { p_token: token });
    if (error) return null;
    const rows = (data ?? []) as EmergencyCard[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "warn" | "danger" }) {
  const valueTone = tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-on";
  return (
    <div className="rounded-control bg-surface-2 px-3 py-3">
      <div className="text-[12px] font-semibold text-on-variant">{label}</div>
      <div className={`mt-0.5 text-[17px] font-bold leading-tight ${valueTone}`}>{value}</div>
    </div>
  );
}

function CallLink({ phone, label }: { phone: string; label: string }) {
  return (
    <a
      href={`tel:${phone.replace(/\s+/g, "")}`}
      className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-[17px] font-bold text-on-primary active:scale-[0.97]"
    >
      <Phone size={20} aria-hidden="true" />
      {label}
    </a>
  );
}

export default async function EmergencyCardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await loadCard(token);

  if (!card) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-on-variant">
          <PawPrint size={30} aria-hidden="true" />
        </span>
        <h1 className="font-display text-[26px] text-on">Enlace no válido</h1>
        <p className="text-[16px] text-on-variant">Esta ficha no existe o el enlace venció. Pide al dueño que lo comparta de nuevo.</p>
      </main>
    );
  }

  const lost = card.lost_alert && card.lost_alert.status === "active" ? card.lost_alert : null;
  const contactPhone = lost?.contact_phone ?? card.emergency_contact?.phone ?? null;
  const ownerLabel = card.owner_name ?? "Dueño";
  const subtitle = [SPECIES_LABEL[card.species], card.breed, SEX_LABEL[card.sex], ageLabel(card.birth_date)].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col gap-4 bg-bg px-4 pt-[max(20px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      {lost && (
        <section className="rounded-card-lg bg-danger px-4 py-4 text-white shadow-2" role="alert">
          <div className="flex items-center gap-2 font-display text-[20px] leading-tight">
            <AlertTriangle size={22} aria-hidden="true" />
            Esta mascota está reportada como perdida
          </div>
          <p className="mt-1 text-[15px]">
            Desde {formatDate(lost.last_seen_at.slice(0, 10))}
            {lost.address ? ` · ${lost.address}` : ""}
            {lost.message ? ` · ${lost.message}` : ""}
          </p>
          {lost.contact_phone && (
            <a href={`tel:${lost.contact_phone.replace(/\s+/g, "")}`} className="mt-3 flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-white text-[17px] font-bold text-danger active:scale-[0.97]">
              <Phone size={20} aria-hidden="true" /> Llamar {lost.contact_phone}
            </a>
          )}
          <div className="mt-2">
            <SightingForm alertId={lost.id} contactPhone={lost.contact_phone} />
          </div>
        </section>
      )}

      <header className="flex items-center gap-4">
        {card.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.photo_url} alt={card.pet_name} className="h-24 w-24 shrink-0 rounded-full object-cover shadow-1" />
        ) : (
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <PawPrint size={40} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-on-variant">Ficha de emergencia · Paw</div>
          <h1 className="font-display text-[32px] leading-none text-on">{card.pet_name}</h1>
          <p className="mt-1 text-[15px] text-on-variant">{subtitle}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2">
        <Cell label="Peso" value={card.weight ? `${card.weight} kg` : "Sin dato"} />
        <Cell label="Microchip" value={card.microchip ?? "Sin registrar"} />
        <Cell label="Alergias" value={card.allergies?.length ? card.allergies.join(", ") : "Ninguna conocida"} tone={card.allergies?.length ? "warn" : undefined} />
        <Cell label="Condiciones" value={card.conditions?.length ? card.conditions.join(", ") : "Ninguna conocida"} tone={card.conditions?.length ? "warn" : undefined} />
        <Cell label="Grupo sanguíneo" value={card.blood_type ?? "Sin dato"} />
        <Cell label="Esterilización" value={card.neutered ? "Sí" : "No"} />
      </section>

      <section className="rounded-card-lg border border-outline-variant bg-surface p-4">
        <h2 className="font-display text-[18px] text-on">Medicación activa</h2>
        {card.active_medications?.length ? (
          <ul className="mt-2 flex flex-col gap-2">
            {card.active_medications.map((m, i) => (
              <li key={i} className="text-[16px] text-on">
                <span className="font-bold">{m.name}</span>
                <span className="text-on-variant"> · {m.dose} · {m.frequency}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[15px] text-on-variant">Ninguna registrada</p>
        )}
      </section>

      <section className="rounded-card-lg border border-outline-variant bg-surface p-4">
        <h2 className="font-display text-[18px] text-on">Últimas vacunas</h2>
        {card.last_vaccines?.length ? (
          <ul className="mt-2 flex flex-col gap-2">
            {card.last_vaccines.slice(0, 5).map((v, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 text-[16px] text-on">
                <span className="font-bold">{v.name}</span>
                <span className="shrink-0 text-[14px] text-on-variant">{v.last ? formatDate(v.last) : "sin fecha"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[15px] text-on-variant">Sin registro</p>
        )}
      </section>

      <section className="rounded-card-lg border border-outline-variant bg-surface p-4">
        <h2 className="font-display text-[18px] text-on">Contacto</h2>
        <p className="mt-1 text-[16px] text-on">
          <span className="font-bold">{ownerLabel}</span>
          {card.emergency_contact?.name ? <span className="text-on-variant"> · emergencia: {card.emergency_contact.name}</span> : null}
        </p>
        <div className="mt-3">
          {contactPhone ? <CallLink phone={contactPhone} label={`Llamar ${contactPhone}`} /> : <p className="text-[15px] text-on-variant">Sin teléfono registrado</p>}
        </div>
      </section>

      <p className="text-center text-[13px] text-on-variant">Si está herida, llévala a la veterinaria de urgencias más cercana y avisa al dueño.</p>
    </main>
  );
}
