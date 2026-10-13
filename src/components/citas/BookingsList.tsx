"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Button, EmptyState, PageHeader, SegmentedControl } from "@/components/ui";
import { useStore } from "@/store";
import { fetchMyBookings } from "@/lib/api/bookings";
import { fadeUp, stagger } from "@/lib/motion";
import type { Booking } from "@/types/db";
import { friendlyError, toastOnce } from "@/components/explorar/lib";
import { BookingRow } from "./BookingRow";
import { SkeletonBookingRow } from "./CitasSkeleton";
import { isUpcoming } from "./lib";

type Segment = "upcoming" | "past";

export function BookingsList() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const userId = useStore((s) => s.currentUserId);
  const [segment, setSegment] = useState<Segment>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMyBookings(userId)
      .then((rows) => !cancelled && setBookings(rows))
      .catch((e) => {
        if (cancelled) return;
        const msg = friendlyError(e);
        setError(msg);
        toastOnce("citas.lista", msg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, reload]);

  const list = useMemo(() => {
    const up = bookings.filter((b) => isUpcoming(b)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const past = bookings.filter((b) => !isUpcoming(b)).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
    return segment === "upcoming" ? up : past;
  }, [bookings, segment]);

  return (
    <div className="min-h-dvh bg-bg">
      <PageHeader title="Citas" />
      <div className="px-4 pt-1">
        <SegmentedControl<Segment>
          ariaLabel="Citas"
          value={segment}
          onChange={setSegment}
          options={[
            { value: "upcoming", label: "Próximas" },
            { value: "past", label: "Pasadas" },
          ]}
        />
      </div>
      <div className="px-4 pt-4">
        {loading || !userId ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <SkeletonBookingRow />
            <SkeletonBookingRow />
            <SkeletonBookingRow />
          </div>
        ) : error ? (
          <EmptyState tone="danger" title="No pudimos cargar tus citas" description={error} action={<Button full variant="secondary" onClick={() => setReload((n) => n + 1)}>Reintentar</Button>} />
        ) : list.length === 0 ? (
          <EmptyState
            title={segment === "upcoming" ? "Sin citas" : "Sin citas pasadas"}
            description={segment === "upcoming" ? "Reserva baño, vacunas o consulta en los lugares cerca de ti." : "Cuando completes una cita aparecerá aquí."}
            action={segment === "upcoming" ? <Button full onClick={() => router.push("/explorar")}>Explorar servicios</Button> : undefined}
          />
        ) : (
          <motion.ul variants={reduce ? undefined : stagger()} initial="hidden" animate="show" className="flex flex-col gap-3" aria-label={segment === "upcoming" ? "Próximas citas" : "Citas pasadas"}>
            {list.map((b) => (
              <motion.li key={b.id} variants={reduce ? undefined : fadeUp}>
                <BookingRow booking={b} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
