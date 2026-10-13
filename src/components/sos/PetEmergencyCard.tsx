"use client";
import { FileText } from "lucide-react";
import { Button, Card, InfoCell, Skeleton } from "@/components/ui";
import { PetAvatar } from "@/components/pets/PetAvatar";
import type { Pet } from "@/types";
import type { SosPetDetails } from "./sosData";
import { medicationLabel } from "./sosData";
import { formatDate } from "@/lib/utils";

function joinOrDash(list: string[] | null | undefined, empty: string): string {
  return list && list.length ? list.join(", ") : empty;
}

export function PetEmergencyCard({ pet, details, loading, onSummary, summaryLoading }: {
  pet: Pet;
  details: SosPetDetails | null;
  loading: boolean;
  onSummary: () => void;
  summaryLoading: boolean;
}) {
  const row = details?.pet ?? null;
  const subtitle = [pet.name, row?.breed ?? pet.breed, row?.weight ? `${row.weight} kg` : pet.weight ? `${pet.weight} kg` : null].filter(Boolean).join(" · ");
  const meds = details?.medications ?? [];

  return (
    <Card>
      <div className="flex items-center gap-3">
        {row?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.photo_url} alt={pet.name} className="h-14 w-14 shrink-0 rounded-full object-cover" />
        ) : (
          <PetAvatar pet={pet} size="md" style={{ width: 56, height: 56, borderRadius: "50%" }} />
        )}
        <div className="min-w-0">
          <div className="font-display text-[18px] leading-tight text-on">Ficha de {pet.name}</div>
          <div className="truncate text-[13px] text-on-variant">{subtitle}</div>
        </div>
      </div>

      {loading && !details ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[58px] rounded-control" />
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <InfoCell label="Alergias" tone={row?.allergies?.length ? "warn" : undefined} value={joinOrDash(row?.allergies, "Ninguna conocida")} />
          <InfoCell label="Grupo sanguíneo" value={row?.blood_type ?? "Sin dato"} />
          <InfoCell
            label="Medicación activa"
            tone={meds.length ? "warn" : undefined}
            value={meds.length ? meds.map(medicationLabel).join("; ") : "Ninguna"}
            className="col-span-2"
          />
          <InfoCell label="Condiciones" value={joinOrDash(row?.conditions, "Ninguna conocida")} />
          <InfoCell label="Microchip" value={row?.microchip ?? "Sin registrar"} />
          <InfoCell
            label="Última vacuna"
            value={details?.lastVaccine ? `${details.lastVaccine.name} · ${formatDate(details.lastVaccine.last_done_at)}` : "Sin registro"}
            className="col-span-2"
          />
        </div>
      )}

      <Button variant="tonal" full className="mt-3" leading={<FileText size={18} aria-hidden="true" />} onClick={onSummary} loading={summaryLoading} disabled={!row}>
        Resumen clínico para el veterinario
      </Button>
    </Card>
  );
}
