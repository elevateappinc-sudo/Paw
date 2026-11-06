"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Tag } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/api/bookings";
import type { Booking } from "@/types/db";
import { TaskDue } from "@/components/tasks/TaskRow";
import { STATUS_TONE, bookingRelative, bookingSeverity, bookingTitle, bookingWhen } from "./lib";

export function BookingRow({ booking }: { booking: Booking }) {
  const photo = booking.businesses?.cover_url ?? booking.businesses?.logo_url ?? null;
  const severity = bookingSeverity(booking);
  return (
    <Link
      href={`/citas/${booking.id}`}
      className="pressable flex min-h-19 items-center gap-3 rounded-md border border-border bg-surface px-3 py-3"
      aria-label={`${bookingTitle(booking)}, ${bookingWhen(booking)}, ${STATUS_LABEL[booking.status]}`}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-border">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-surface-elevated to-border" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-subtitle font-semibold text-text">{bookingTitle(booking)}</p>
        <p className="truncate text-small text-text-secondary">{booking.businesses?.name ?? "Negocio"}</p>
        <p className="flex min-w-0 items-center gap-2 text-small text-text-secondary">
          {severity && <TaskDue severity={severity} className="shrink-0">{bookingRelative(booking)}</TaskDue>}
          <span className="truncate">{bookingWhen(booking)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Tag tone={STATUS_TONE[booking.status]} size="xs">
          {STATUS_LABEL[booking.status]}
        </Tag>
        <ChevronRight size={18} className="text-text-secondary" aria-hidden="true" />
      </div>
    </Link>
  );
}
