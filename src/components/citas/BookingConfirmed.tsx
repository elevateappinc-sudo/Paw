"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CalendarPlus, Check } from "lucide-react";
import { Card, InfoCell, buttonVariants } from "@/components/ui";
import { pop } from "@/lib/motion";
import type { Booking } from "@/types/db";
import { cn, formatCurrency } from "@/lib/utils";
import { bookingCalendarLink, bookingCode, bookingWhenLong } from "./lib";

export function BookingConfirmed({ booking }: { booking: Booking }) {
  const reduce = useReducedMotion();
  const biz = booking.businesses;
  const petName = booking.pets?.name ?? "tu mascota";
  const steps = [
    { title: "El negocio confirma tu cita", body: "Te avisamos en cuanto la acepte. Suele ser en pocas horas." },
    { title: `Llega con ${petName} a la hora`, body: "Si vas con retraso, escríbele por WhatsApp desde la cita." },
    { title: "Queda en el historial", body: `Al terminar, el servicio se registra en el perfil de ${petName} con precio y foto.` },
  ];

  return (
    <div className="min-h-dvh bg-bg px-4 pb-[calc(32px+env(safe-area-inset-bottom))] pt-[max(40px,env(safe-area-inset-top))]">
      <div className="flex flex-col items-center text-center">
        <motion.div variants={reduce ? undefined : pop} initial="hidden" animate="show" className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-soft">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-on-primary">
            <Check size={44} strokeWidth={3} aria-hidden="true" />
          </div>
        </motion.div>
        <h1 className="mt-6 font-semibold text-display leading-tight text-text">Reserva confirmada</h1>
        <p className="mt-1 text-body text-text-secondary">{biz?.name ?? "El negocio"} ya la tiene en su agenda</p>
      </div>

      <Card className="mt-6">
        <div className="grid grid-cols-2 gap-2">
          <InfoCell label="Mascota" value={petName} />
          <InfoCell label="Servicio" value={booking.business_services?.name ?? "Servicio"} />
          <InfoCell label="Fecha" value={bookingWhenLong(booking)} className="col-span-2" />
          <InfoCell label="Precio" value={booking.price != null ? formatCurrency(booking.price) : "Por confirmar"} />
          <InfoCell label="Pago" value="Se paga en el local" />
          {biz?.address && <InfoCell label="Dirección" value={biz.address} className="col-span-2" />}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-primary-soft px-3 py-3 text-primary-text">
          <span className="text-label font-semibold">Código de reserva</span>
          <span className="font-mono text-body font-semibold">{bookingCode(booking)}</span>
        </div>
        <p className="mt-3 text-center text-small text-text-secondary">Cancela gratis hasta 24 h antes</p>
      </Card>

      <section className="mt-6">
        <h2 className="font-semibold text-title text-text">Qué pasa ahora</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-small font-semibold text-text" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <p className="text-body font-semibold text-text">{s.title}</p>
                <p className="text-small leading-relaxed text-text-secondary">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 flex flex-col gap-2">
        <a href={bookingCalendarLink(booking)} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}>
          <CalendarPlus size={18} /> Añadir al calendario
        </a>
        <Link href="/home" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
