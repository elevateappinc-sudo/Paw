"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, MessageCircle, Navigation, XCircle } from "lucide-react";
import { Button, Card, EmptyState, InfoCell, PageHeader, Sheet, Tag, buttonVariants, showToast } from "@/components/ui";
import { useStore } from "@/store";
import { STATUS_LABEL, fetchMyBookings, updateBookingStatus } from "@/lib/api/bookings";
import type { Booking } from "@/types/db";
import { cn, formatCurrency } from "@/lib/utils";
import { directionsLink, friendlyError, toastOnce, whatsappLink } from "@/components/explorar/lib";
import { BookingConfirmed } from "./BookingConfirmed";
import { CitaDetailSkeleton } from "./CitasSkeleton";
import { STATUS_TONE, bookingCalendarLink, bookingCode, bookingTitle, bookingWhenLong, canCancel } from "./lib";

export function BookingDetail({ id }: { id: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const isNew = sp.get("nueva") === "1";
  const userId = useStore((s) => s.currentUserId);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMyBookings(userId)
      .then((rows) => !cancelled && setBooking(rows.find((b) => b.id === id) ?? null))
      .catch((e) => {
        if (cancelled) return;
        const msg = friendlyError(e);
        setError(msg);
        toastOnce("citas.detalle", msg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, id, reload]);

  const cancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      const updated = await updateBookingStatus(booking.id, "cancelled");
      setBooking(updated);
      setConfirmCancel(false);
      showToast("Cita cancelada", undefined, "success");
    } catch (e) {
      showToast(friendlyError(e), cancel, "error");
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !userId) return <CitaDetailSkeleton />;

  if (error || !booking) {
    return (
      <div className="min-h-dvh bg-bg">
        <PageHeader title="Cita" back backHref="/citas" />
        <EmptyState
          title={error ? "No pudimos cargar la cita" : "No encontramos esta cita"}
          description={error ?? "Puede que la hayas cancelado o que ya no exista."}
          action={error ? <Button full variant="secondary" onClick={() => setReload((n) => n + 1)}>Reintentar</Button> : <Button full variant="secondary" onClick={() => router.push("/citas")}>Ver mis citas</Button>}
        />
      </div>
    );
  }

  if (isNew) return <BookingConfirmed booking={booking} />;

  const biz = booking.businesses;
  const photo = biz?.cover_url ?? biz?.logo_url ?? null;
  const wa = whatsappLink(biz?.whatsapp ?? biz?.phone, `Hola, tengo una cita el ${bookingWhenLong(booking)} (${bookingCode(booking)})`);
  const dir = directionsLink(biz?.lat, biz?.lng, biz?.address);

  return (
    <div className="min-h-dvh bg-bg pb-[calc(32px+env(safe-area-inset-bottom))]">
      <PageHeader title="Tu cita" back backHref="/citas" />
      <div className="flex flex-col gap-4 px-4 pt-2">
        <Card padded={false} className="overflow-hidden">
          <div className="relative h-36 bg-border">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-surface-elevated to-primary-soft" aria-hidden="true" />
            )}
            <Tag tone={STATUS_TONE[booking.status]} className="absolute left-3 top-3">
              {STATUS_LABEL[booking.status]}
            </Tag>
          </div>
          <div className="p-4">
            <h2 className="font-semibold text-title leading-tight text-text">{bookingTitle(booking)}</h2>
            {biz && (
              <Link href={`/negocios/${biz.id}`} className="mt-1 inline-block text-body font-semibold text-primary-text">
                {biz.name}
              </Link>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <InfoCell label="Fecha" value={bookingWhenLong(booking)} className="col-span-2" />
              <InfoCell label="Precio" value={booking.price != null ? formatCurrency(booking.price) : "Por confirmar"} />
              <InfoCell label="Código" value={<span className="font-mono">{bookingCode(booking)}</span>} />
              {biz?.address && <InfoCell label="Dirección" value={biz.address} className="col-span-2" />}
            </div>
            {booking.business_notes && (
              <div className="mt-3 rounded-md bg-surface-elevated px-3 py-2">
                <p className="text-label font-semibold text-text-secondary">Nota del negocio</p>
                <p className="mt-1 text-small text-text">{booking.business_notes}</p>
              </div>
            )}
            {canCancel(booking) && <p className="mt-3 text-small text-text-secondary">Cancela gratis hasta 24 h antes.</p>}
          </div>
        </Card>

        <div className="flex gap-2">
          {dir && (
            <a href={dir} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "secondary" }), "flex-1")}>
              <Navigation size={18} /> Cómo llegar
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "secondary" }), "flex-1")}>
              <MessageCircle size={18} /> WhatsApp
            </a>
          )}
        </div>

        {booking.status !== "cancelled" && (
          <a href={bookingCalendarLink(booking)} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
            <CalendarPlus size={18} /> Añadir al calendario
          </a>
        )}

        {canCancel(booking) && (
          <Button full variant="dangerTonal" onClick={() => setConfirmCancel(true)} leading={<XCircle size={18} />}>
            Cancelar cita
          </Button>
        )}
      </div>

      <Sheet
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="¿Cancelar la cita?"
        subtitle={bookingWhenLong(booking)}
        footer={
          <div className="flex flex-col gap-2">
            <Button full variant="destructive" onClick={cancel} loading={cancelling}>
              Sí, cancelar
            </Button>
            <Button full variant="ghost" onClick={() => setConfirmCancel(false)}>
              Mantener la cita
            </Button>
          </div>
        }
      >
        <p className="text-body leading-relaxed text-text-secondary">
          Avisaremos a {biz?.name ?? "el negocio"}. Si faltan menos de 24 h, es posible que te cobren una parte.
        </p>
      </Sheet>
    </div>
  );
}
