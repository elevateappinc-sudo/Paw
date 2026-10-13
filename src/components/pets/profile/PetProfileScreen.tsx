"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Share2 } from "lucide-react";
import { Tabs, Tag, Button, EmptyState, showToast } from "@/components/ui";
import { SOSButton } from "@/components/layout/SOSButton";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { fetchPet, fetchWeightLogs } from "@/lib/api/pets";
import { fetchCareCycles } from "@/lib/api/careCycles";
import { useStore } from "@/store";
import { isMissingRelation, petProfileMeta, petStatusChips, rowToPet } from "@/components/pets/petHelpers";
import type { CareCycle, PetRow, WeightLog } from "@/types/db";
import { PetProfileSkeleton } from "./PetProfileSkeleton";
import { SummaryTab } from "./SummaryTab";
import { HealthTab } from "./HealthTab";
import { RoutineTab } from "./RoutineTab";
import { HistoryTab } from "./HistoryTab";
import { ExpensesTab } from "./ExpensesTab";
import { EditPetSheet } from "./EditPetSheet";
import { WeightSheet } from "./WeightSheet";

type TabId = "resumen" | "salud" | "rutina" | "historial" | "gastos";
const TABS: { value: TabId; label: string }[] = [
  { value: "resumen", label: "Resumen" },
  { value: "salud", label: "Salud" },
  { value: "rutina", label: "Rutina" },
  { value: "historial", label: "Historial" },
  { value: "gastos", label: "Gastos" },
];

export function PetProfileScreen({ petId, userId }: { petId: string; userId: string }) {
  const router = useRouter();
  const { selectedPetId, selectPet } = useStore();
  const [pet, setPet] = useState<PetRow | null | undefined>(undefined);
  const [cycles, setCycles] = useState<CareCycle[] | null>(null);
  const [weights, setWeights] = useState<WeightLog[] | null>(null);
  const [tab, setTab] = useState<TabId>("resumen");
  const [editing, setEditing] = useState(false);
  const [weighing, setWeighing] = useState(false);
  const toasted = useRef(false);

  useEffect(() => {
    if (selectedPetId !== petId) selectPet(petId);
  }, [petId, selectedPetId, selectPet]);

  const load = useCallback(async () => {
    try {
      const row = await fetchPet(petId);
      setPet(row);
    } catch {
      setPet(null);
      return;
    }
    const [c, w] = await Promise.allSettled([fetchCareCycles(petId), fetchWeightLogs(petId)]);
    setCycles(c.status === "fulfilled" ? c.value : []);
    setWeights(w.status === "fulfilled" ? w.value : []);
    if ((c.status === "rejected" || w.status === "rejected") && !toasted.current) {
      toasted.current = true;
      const err = c.status === "rejected" ? c.reason : w.status === "rejected" ? w.reason : null;
      showToast(isMissingRelation(err) ? "Algunas secciones aún no están disponibles" : "No pudimos cargar parte del perfil", undefined, "error");
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

  if (pet === undefined) return <PetProfileSkeleton />;
  if (pet === null) {
    return (
      <div className="pt-[max(14px,env(safe-area-inset-top))]">
        <EmptyState
          tone="danger"
          title="No encontramos esta mascota"
          description="Puede que ya no tengas acceso o que el enlace esté roto."
          action={<Button full onClick={() => router.push("/mascotas")}>Ir a mis mascotas</Button>}
          secondary={<button type="button" onClick={() => void load()}>Reintentar</button>}
        />
      </div>
    );
  }

  const chips = cycles ? petStatusChips(cycles) : [];

  return (
    <div className="pb-6">
      {/* Cabecera con foto a sangre */}
      <div className="relative h-[300px] w-full overflow-hidden bg-surface-3">
        {pet.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pet.photo_url} alt={`Foto de ${pet.name}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PetAvatar pet={rowToPet(pet)} size="lg" style={{ width: 180, height: 180, borderRadius: 48 }} />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <button type="button" onClick={() => router.back()} aria-label="Volver" className="glass flex h-11 w-11 items-center justify-center rounded-full text-on shadow-1 active:scale-95">
            <ChevronLeft size={24} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void share()} aria-label="Compartir ficha" className="glass flex h-11 w-11 items-center justify-center rounded-full text-on shadow-1 active:scale-95">
              <Share2 size={20} aria-hidden="true" />
            </button>
            <SOSButton />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-[30px] leading-[1.1] text-on">{pet.name}</h1>
            <p className="mt-1 text-[14px] text-on-variant">{petProfileMeta(pet)}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)} leading={<Pencil size={16} aria-hidden="true" />}>
            Editar
          </Button>
        </div>
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <Tag key={c.label} tone={c.tone}>
                {c.label}
              </Tag>
            ))}
          </div>
        )}
      </div>

      <Tabs ariaLabel="Secciones del perfil" options={TABS} value={tab} onChange={setTab} className="mt-4 px-2" />

      {tab === "resumen" && <SummaryTab pet={pet} cycles={cycles} weights={weights} onAddWeight={() => setWeighing(true)} />}
      {tab === "salud" && <HealthTab petId={pet.id} petName={pet.name} cycles={cycles} onRefresh={() => void load()} />}
      {tab === "rutina" && <RoutineTab petId={pet.id} />}
      {tab === "historial" && <HistoryTab petId={pet.id} />}
      {tab === "gastos" && <ExpensesTab petId={pet.id} />}

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
