"use client";
import { Phone, Eye, PawPrint, MapPin, Clock } from "lucide-react";
import { Button, Card, Tag } from "@/components/ui";
import { distanceLabel } from "@/lib/api/businesses";
import { relativeTime } from "@/lib/relativeTime";
import { formatCurrency } from "@/lib/utils";
import type { NearbyLostPet } from "@/types/db";

export function LostPetCard({ item, onSighting }: { item: NearbyLostPet; onSighting: (item: NearbyLostPet) => void }) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex gap-3 p-4">
        {item.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo_url} alt={item.pet_name} className="h-20 w-20 shrink-0 rounded-card object-cover" />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-card bg-surface-2 text-on-variant">
            <PawPrint size={30} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-display text-[18px] leading-tight text-on">{item.pet_name}</div>
              <div className="truncate text-[13px] text-on-variant">{item.breed ?? "Sin raza registrada"}</div>
            </div>
            {item.reward ? <Tag tone="warn" size="xs">Recompensa {formatCurrency(Number(item.reward))}</Tag> : null}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-on-variant">
            <span className="inline-flex items-center gap-1"><Clock size={13} aria-hidden="true" /> {relativeTime(item.last_seen_at)}</span>
            <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" /> a {distanceLabel(item.distance_m)}</span>
          </div>
          {item.address && <div className="mt-0.5 truncate text-[13px] text-on-variant">{item.address}</div>}
          {item.message && <p className="mt-1.5 line-clamp-3 text-[14px] text-on">{item.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-outline-variant p-3">
        {item.contact_phone ? (
          <a href={`tel:${item.contact_phone.replace(/\s+/g, "")}`} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-4 text-[15px] font-bold text-on-primary active:scale-[0.97]">
            <Phone size={18} aria-hidden="true" /> Llamar
          </a>
        ) : (
          <Button variant="secondary" disabled>Sin teléfono</Button>
        )}
        <Button variant="tonal" leading={<Eye size={18} aria-hidden="true" />} onClick={() => onSighting(item)}>
          La vi
        </Button>
      </div>
    </Card>
  );
}
