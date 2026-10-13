"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Tag } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/api/bookings";
import type { Booking } from "@/types/db";
import { STATUS_TONE, bookingTitle, bookingWhen } from "./lib";

export function BookingRow({ booking }: { booking: Booking }) {
  const photo = booking.businesses?.cover_url ?? booking.businesses?.logo_url ?? null;
  return (
    <Link
      href={`/citas/${booking.id}`}
      className="flex min-h-[76px] items-center gap-3 rounded-card-lg border border-outline-variant bg-surface px-3 py-3 shadow-1 active:bg-surface-2"
      aria-label={`${bookingTitle(booking)}, ${bookingWhen(booking)}, ${STATUS_LABEL[booking.status]}`}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-card bg-surface-3">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-surface-2 to-surface-3" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-on">{bookingTitle(booking)}</p>
        <p className="truncate text-[13px] text-on-variant">{booking.businesses?.name ?? "Negocio"}</p>
        <p className="truncate text-[13px] text-on-variant">{bookingWhen(booking)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Tag tone={STATUS_TONE[booking.status]} size="xs">
          {STATUS_LABEL[booking.status]}
        </Tag>
        <ChevronRight size={18} className="text-outline" aria-hidden="true" />
      </div>
    </Link>
  );
}
