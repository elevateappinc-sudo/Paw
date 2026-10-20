"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, CloudOff, Pencil, Plus, SearchX, Share2, Users } from "lucide-react";
import PetMembersPanel from "@/components/pets/PetMembersPanel";
import { cn } from "@/lib/utils";
import { SegmentedControl, Sheet, Button, EmptyState, PageHeader, buttonVariants, showToast, SkeletonSwap } from "@/components/ui";
import { SOSButton } from "@/components/layout/SOSButton";
import { formatPetAge } from "@/lib/age";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { fetchPet, fetchWeightLogs, SPECIES_LABEL } from "@/lib/api/pets";
import { fetchCareCycles } from "@/lib/api/careCycles";
import { useStore } from "@/store";
import { isMissingRelation, rowToPet } from "@/components/pets/petHelpers";
import type { CareCycle, PetRow, WeightLog } from "@/types/db";
import { PetProfileSkeleton } from "./PetProfileSkeleton";
import { WeightCard } from "./WeightCard";
import { PetTag } from "./PetTag";
import { HealthTab } from "./HealthTab";
import { RoutineTab } from "./RoutineTab";
import { HistoryTab } from "./HistoryTab";
import { EditPetSheet } from "./EditPetSheet";
import { WeightSheet } from "./WeightSheet";

/** Tres secciones (antes cinco): Resumen se repartió en Salud y Gastos vive en Historial */
type TabId = "salud" | "rutina" | "historial";
const TABS: { value: TabId; label: string }[] = [
  { value: "salud", label: "Salud" },
  { value: "rutina", label: "Rutina" },
  { value: "historial", label: "Historial" },
];
/** Enlaces viejos (?tab=resumen, ?tab=gastos) siguen funcionando */
const LEGACY_TAB: Record<string, TabId> = { resumen: "salud", gastos: "historial" };

export function PetProfileScreen({ petId, userId }: { petId: string; userId: string }) {
  const { selectedPetId, selectPet, pets } = useStore();
  const [pet, setPet] = useState<PetRow | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [cycles, setCycles] = useState<CareCycle[] | null>(null);
  const [weights, setWeights] = useState<WeightLog[] | null>(null);
  const [tab, setTab] = useState<TabId>("salud");
  const [membersOpen, setMembersOpen] = useState(false);
  // ?tab=salud abre directo una pestaña (enlaces desde otras pantallas)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    const mapped = t ? (LEGACY_TAB[t] ?? t) : null;
    if (mapped && TABS.some((x) => x.value === mapped)) setTab(mapped as TabId);
  }, []);
  const [editing, setEditing] = useState(false);
  const [weighing, setWeighing] = useState(false);
  const toasted = useRef(false);

  useEffect(() => {
    if (selectedPetId !== petId) selectPet(petId);
  }, [petId, selectedPetId, selectPet]);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const row = await fetchPet(petId);
      setPet(row);
    } catch {
      setLoadError(true);
      return;
    }
    const [c, w] = await Promise.allSettled([fetchCareCycles(petId), fetchWeightLogs(petId)]);
    setCycles(c.status === "fulfilled" ? c.value : []);
    setWeights(w.status === "fulfilled" ? w.value : []);
    if ((c.status === "rejected" || w.status === "rejected") && !toasted.current) {
      toasted.current = true;
      const err = c.status === "rejected" ? c.reason : w.status === "rejected" ? w.reason : null;
      showToast(isMissingRelation(err) ? "Algunas secciones aún no están disponibles" : "No pudimos cargar parte del perfil", () => {
        toasted.current = false;
        void load();
      }, "error");
    }
  }, [petId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function share() {
    const url = `${window.location.origin}/mascotas/${petId}`;
    try {
      if (navigator.share) await navigator.share({ title: pet?.name ?? "Mascota", url });
      else {
        await navigator.clipboard.writeText(url);
        showToast("Enlace copiado", undefined, "success");
      }
    } catch {
      /* cancelado */
    }
  }

  const loading = pet === undefined && !loadError;
  // Todas las salidas van envueltas en el mismo SkeletonSwap para que React
  // conserve la instancia y haga el fundido cruzado skeleton → contenido.
  const wrap = (node: React.ReactNode) => (
    <SkeletonSwap loading={loading} skeleton={<PetProfileSkeleton />} label="Cargando perfil">
      {node}
    </SkeletonSwap>
  );
  if (loading) return wrap(null);

  if (loadError || !pet) {
    return wrap(
      <div className="pb-6">
        <PageHeader title="Mascota" back />
        {loadError ? (
          <EmptyState
            icon={<CloudOff size={28} aria-hidden="true" />}
            title="No pudimos cargar su perfil"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button full onClick={() => void load()}>
                Reintentar
              </Button>
            }
            secondary={
              <Link href="/mascotas" className="inline-flex min-h-11 items-center">
                Ir a mis mascotas
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={<SearchX size={28} aria-hidden="true" />}
            title="No encontramos esta mascota"
            description="Puede que ya no tengas acceso o que el enlace esté roto."
            action={
              <Link href="/mascotas" className={buttonVariants({ full: true })}>
                Ir a mis mascotas
              </Link>
            }
          />
        )}
      </div>
    );
  }

  const tone = pet.color || "var(--color-primary)";
  const stats = [
    { label: "Sexo", value: pet.sex === "male" ? "Macho" : pet.sex === "female" ? "Hembra" : "—", bg: "bg-pastel-mint" },
    { label: "Edad", value: formatPetAge(pet.birth_date) ?? "—", bg: "bg-pastel-lilac" },
    { label: "Peso", value: pet.weight ? `${pet.weight.toLocaleString("es-CO")} kg` : "—", bg: "bg-pastel-mint" },
  ];
  const iconBtn = "pressable flex h-11 w-11 items-center justify-center rounded-full bg-pastel-glass text-text backdrop-blur";

  return wrap(
    <div className="enter-soft pb-6">
      {/* Selector de mascotas (reemplaza la lista) y SOS arriba a la derecha */}
      <div className="flex items-center gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <nav aria-label="Cambiar de mascota" className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
          {pets.map((p) => {
            const active = p.id === petId;
            return (
              <Link
                key={p.id}
                href={`/mascotas/${p.id}`}
                replace
                aria-label={p.name}
                aria-current={active ? "page" : undefined}
                className={cn("pressable shrink-0 rounded-full p-[2px]", active ? "bg-accent" : "bg-transparent opacity-70")}
              >
                <span className="block rounded-full bg-bg p-[2px]">
                  <PetAvatar pet={p} size="md" style={{ width: 40, height: 40, borderRadius: "var(--radius-full)" }} />
                </span>
              </Link>
            );
          })}
          <Link
            href="/mascotas/nueva"
            aria-label="Añadir mascota"
            className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border text-text-secondary"
          >
            <Plus size={18} aria-hidden="true" />
          </Link>
        </nav>
        <SOSButton />
      </div>

      {/* Foto grande con compartir encima */}
      <div className="px-4 pt-3">
        <div
          className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-xl"
          style={{ background: `color-mix(in oklab, ${tone} 22%, var(--color-surface))` }}
        >
          <PetAvatar
            pet={rowToPet(pet)}
            size="lg"
            style={{ width: "100%", height: "100%", borderRadius: 0 }}
          />
          <div className="absolute right-0 top-0 p-3">
            <button type="button" onClick={() => void share()} aria-label="Compartir ficha" className={iconBtn}>
              <Share2 size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <h1 className="break-words text-display font-semibold text-text">{pet.name}</h1>
          <p className="text-small text-text-secondary">{pet.breed || SPECIES_LABEL[pet.species]}</p>
        </div>
        <button type="button" onClick={() => setEditing(true)} aria-label={`Editar a ${pet.name}`} className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary">
          <Pencil size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Sexo, edad y peso en mosaicos pastel */}
      <dl className="mt-4 grid grid-cols-3 gap-3 px-4">
        {stats.map((st) => (
          <div key={st.label} className={`rounded-lg px-3 py-3 ${st.bg}`}>
            <dt className="text-label text-text-secondary">{st.label}</dt>
            <dd className="mt-1 text-body font-semibold text-text">{st.value}</dd>
          </div>
        ))}
      </dl>

      {/* Acceso compartido: función ocasional, una sola fila que abre una hoja */}
      <button
        type="button"
        onClick={() => setMembersOpen(true)}
        className="pressable mx-4 mt-3 flex min-h-12 w-[calc(100%-32px)] items-center gap-3 rounded-full border border-border bg-surface px-4 text-left"
      >
        <Users size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
        <span className="flex-1 text-small font-semibold text-text">Personas con acceso</span>
        <ChevronRight size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
      </button>

      <div className="mt-5 px-4">
        <SegmentedControl<TabId> ariaLabel="Secciones del perfil" options={TABS} value={tab} onChange={setTab} />
      </div>

      {/* Cambio de pestaña: fundido cruzado */}
      <div key={tab} className="enter-soft">
        {tab === "salud" && (
          <>
            <HealthTab petId={pet.id} petName={pet.name} cycles={cycles} onRefresh={() => void load()} />
            <div className="flex flex-col gap-4 px-4 pt-4">
              <PetTag pet={pet} />
              <WeightCard weights={weights} onAddWeight={() => setWeighing(true)} />
            </div>
          </>
        )}
        {tab === "rutina" && <RoutineTab petId={pet.id} />}
        {tab === "historial" && <HistoryTab petId={pet.id} />}
      </div>

      <Sheet open={membersOpen} onClose={() => setMembersOpen(false)} title="Personas con acceso">
        <PetMembersPanel petId={pet.id} />
      </Sheet>
      <EditPetSheet open={editing} onClose={() => setEditing(false)} pet={pet} userId={userId} onSaved={setPet} />
      <WeightSheet
        open={weighing}
        onClose={() => setWeighing(false)}
        petId={pet.id}
        userId={userId}
        onSaved={(log) => {
          setWeights((w) => [...(w ?? []), log].sort((a, b) => a.measured_at.localeCompare(b.measured_at)));
          setPet((p) => (p ? { ...p, weight: Number(log.weight_kg) } : p));
        }}
      />
    </div>
  );
}
