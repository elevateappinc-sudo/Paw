"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Navigation, Phone, ClipboardCheck } from "lucide-react";
import { Button, Card, EmptyState, Rating, Verified, buttonVariants } from "@/components/ui";
import { useActivePet } from "@/hooks/useActivePet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useStore } from "@/store";
import {
  closesAtLabel,
  distanceLabel,
  fetchBusiness,
  fetchBusinessServices,
  fetchReviews,
  fetchSavedBusinessIds,
  isOpenNow,
  toggleSavedBusiness,
} from "@/lib/api/businesses";
import { fetchCareCycles } from "@/lib/api/careCycles";
import { BUSINESS_CATEGORY_LABEL, type Business, type BusinessService, type CareCycle, type Review } from "@/types/db";
import { cn } from "@/lib/utils";
import { directionsLink, friendlyError, haversineM, toastOnce, whatsappLink } from "@/components/explorar/lib";
import { showToast } from "@/components/ui/Toast";
import { Gallery } from "./Gallery";
import { ServicesCard, cycleNeedsSoon, matchCycle } from "./ServicesCard";
import { HoursCard } from "./HoursCard";
import { ReviewsCard } from "./ReviewsCard";
import { BookingBar } from "./BookingBar";
import { BusinessSkeleton } from "./BusinessSkeleton";

export function BusinessDetail({ id }: { id: string }) {
  const { pet, pets } = useActivePet();
  const userId = useStore((s) => s.currentUserId);
  const geo = useGeolocation();

  const [biz, setBiz] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<BusinessService[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [cycles, setCycles] = useState<CareCycle[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedBusy, setSavedBusy] = useState(false);
  const [reload, setReload] = useState(0);

  // Ficha, servicios y reseñas
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchBusiness(id)
      .then((b) => {
        if (cancelled) return;
        setBiz(b);
      })
      .catch((e) => !cancelled && setError(friendlyError(e)))
      .finally(() => !cancelled && setLoading(false));
    fetchBusinessServices(id)
      .then((s) => !cancelled && setServices(s))
      .catch((e) => {
        if (cancelled) return;
        toastOnce("negocio.servicios", friendlyError(e));
      });
    fetchReviews(id)
      .then((r) => !cancelled && setReviews(r))
      .catch((e) => {
        if (cancelled) return;
        setReviewsError("No pudimos cargar las reseñas.");
        toastOnce("negocio.resenas", friendlyError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [id, reload]);

  // Guardado
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchSavedBusinessIds(userId)
      .then((ids) => !cancelled && setSaved(ids.includes(id)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, id]);

  // Ciclos de la mascota activa
  useEffect(() => {
    if (!pet) return;
    let cancelled = false;
    fetchCareCycles(pet.id)
      .then((c) => !cancelled && setCycles(c))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pet]);

  // Preselección: servicio que completa un ciclo que vence pronto; si no, el primero
  useEffect(() => {
    if (services.length === 0 || selectedServiceId) return;
    const urgent = services.find((s) => cycleNeedsSoon(matchCycle(s, cycles)));
    setSelectedServiceId((urgent ?? services[0]).id);
  }, [services, cycles, selectedServiceId]);

  const selectedService = useMemo(() => services.find((s) => s.id === selectedServiceId) ?? null, [services, selectedServiceId]);

  const onToggleSaved = async () => {
    if (!userId) {
      showToast("Inicia sesión para guardar lugares", undefined, "error");
      return;
    }
    const next = !saved;
    setSaved(next);
    setSavedBusy(true);
    try {
      await toggleSavedBusiness(userId, id, next);
      showToast(next ? "Guardado en tus lugares" : "Quitado de tus lugares", undefined, "success");
    } catch (e) {
      setSaved(!next);
      showToast(friendlyError(e), undefined, "error");
    } finally {
      setSavedBusy(false);
    }
  };

  if (loading) return <BusinessSkeleton />;

  if (error || !biz) {
    return (
      <div className="flex min-h-dvh flex-col bg-bg">
        <div className="px-4 pt-[max(16px,env(safe-area-inset-top))]">
          <Link href="/explorar" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Volver a Explorar
          </Link>
        </div>
        <EmptyState
          title={error ? "No pudimos cargar este lugar" : "No encontramos este lugar"}
          description={error ?? "Puede que ya no esté disponible."}
          action={error ? <Button full variant="secondary" onClick={() => setReload((n) => n + 1)}>Reintentar</Button> : undefined}
        />
      </div>
    );
  }

  const photos = [biz.cover_url, ...(biz.photos ?? [])].filter((p): p is string => !!p);
  const distance = geo.lat != null && geo.lng != null && biz.lat != null && biz.lng != null ? haversineM(geo.lat, geo.lng, biz.lat, biz.lng) : null;
  const categories = (biz.categories?.length ? biz.categories : [biz.type]).map((c) => BUSINESS_CATEGORY_LABEL[c] ?? c).join(", ");
  const meta = [categories, biz.address, distance != null ? distanceLabel(distance) : null].filter(Boolean).join(" · ");
  const open = isOpenNow(biz.hours, biz.emergency_24h);
  const closes = closesAtLabel(biz.hours);
  const wa = whatsappLink(biz.whatsapp ?? biz.phone, `Hola, quiero información sobre ${biz.name}`);
  const dir = directionsLink(biz.lat, biz.lng, biz.address);
  const tel = biz.phone ? `tel:${biz.phone.replace(/\s+/g, "")}` : null;

  const actionCls = cn(buttonVariants({ variant: "secondary", size: "md" }), "flex-1 aria-disabled:opacity-50 aria-disabled:pointer-events-none");

  return (
    <div className="min-h-dvh bg-bg pb-[calc(120px+env(safe-area-inset-bottom))]">
      <Gallery photos={photos} name={biz.name} saved={saved} onToggleSaved={onToggleSaved} savedBusy={savedBusy} />

      <div className="flex flex-col gap-4 px-4 pt-4">
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-display leading-[1.1] text-text">{biz.name}</h1>
            {biz.verified && <Verified />}
          </div>
          <p className="mt-1 text-body text-text-secondary">{meta}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-body">
            {biz.rating_count > 0 ? <Rating value={biz.rating_avg} count={biz.rating_count} className="text-body" /> : <span className="text-text-secondary">Sin reseñas aún</span>}
            <span className="text-border" aria-hidden="true">·</span>
            {biz.emergency_24h ? (
              <span className="font-semibold text-success-text">Abierto 24 h</span>
            ) : open ? (
              <span className="font-semibold text-success-text">
                Abierto{closes ? <span className="font-semibold text-text-secondary"> · {closes}</span> : null}
              </span>
            ) : (
              <span className="font-semibold text-text-secondary">Cerrado{closes ? ` · ${closes}` : ""}</span>
            )}
          </div>
        </header>

        <div className="flex gap-2">
          <a href={tel ?? undefined} aria-disabled={!tel} className={actionCls}>
            <Phone size={18} /> Llamar
          </a>
          <a href={wa ?? undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!wa} className={actionCls}>
            <MessageCircle size={18} /> WhatsApp
          </a>
          <a href={dir ?? undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!dir} className={actionCls}>
            <Navigation size={18} /> Cómo llegar
          </a>
        </div>

        {biz.writes_history && (
          <Card tone="info" elevation={0} className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-surface text-success-text">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <p className="text-body font-semibold">Escribe en el historial de {pet?.name ?? "tu mascota"}</p>
              <p className="mt-1 text-small leading-relaxed">Al terminar el servicio, el negocio lo registra con fecha, precio y foto. Tú no tienes que anotar nada.</p>
            </div>
          </Card>
        )}

        <ServicesCard services={services} selectedId={selectedServiceId} onSelect={setSelectedServiceId} cycles={cycles} petName={pet?.name ?? null} />

        <HoursCard hours={biz.hours} emergency={biz.emergency_24h} />

        <ReviewsCard
          businessId={biz.id}
          businessName={biz.name}
          reviews={reviews}
          onReviewSaved={(r) => setReviews((prev) => [r, ...prev.filter((x) => x.id !== r.id)])}
          userId={userId}
          pets={pets}
          activePetId={pet?.id ?? null}
          error={reviewsError}
        />

        {biz.description && (
          <Card>
            <p className="text-body leading-relaxed text-text">{biz.description}</p>
          </Card>
        )}
      </div>

      <BookingBar businessId={biz.id} service={selectedService} petName={pet?.name ?? null} whatsappHref={wa} />
    </div>
  );
}
