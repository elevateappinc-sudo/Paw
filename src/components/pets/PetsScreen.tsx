"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight, Plus } from "lucide-react";
import { PageHeader, Card, Tag, EmptyState, Button, buttonVariants, showToast } from "@/components/ui";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { fadeUp, stagger } from "@/lib/motion";
import { fetchMyPets } from "@/lib/api/pets";
import { fetchCareCycles } from "@/lib/api/careCycles";
import { useStore } from "@/store";
import type { CareCycle, PetRow } from "@/types/db";
import { petMetaLine, petStatusChips, rowToPet, type StatusChip } from "./petHelpers";
import { PetsListSkeleton } from "./PetsListSkeleton";

interface Item {
  row: PetRow;
  chips: StatusChip[] | null;
}

export function PetsScreen() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const selectPet = useStore((s) => s.selectPet);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setItems(null);
    let rows: PetRow[];
    try {
      rows = await fetchMyPets();
    } catch {
      setError(true);
      return;
    }
    setItems(rows.map((row) => ({ row, chips: null })));
    const results = await Promise.allSettled(rows.map((r) => fetchCareCycles(r.id)));
    let failed = false;
    setItems(
      rows.map((row, i) => {
        const r = results[i];
        if (r.status === "fulfilled") return { row, chips: petStatusChips(r.value as CareCycle[]) };
        failed = true;
        return { row, chips: [] };
      })
    );
    if (failed) showToast("No pudimos calcular el estado de cuidados", undefined, "error");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function open(id: string) {
    selectPet(id);
    router.push(`/mascotas/${id}`);
  }

  return (
    <div className="pb-6">
      <PageHeader title="Mis mascotas" eyebrow={items ? `${items.length} ${items.length === 1 ? "mascota" : "mascotas"}` : undefined} />
      {error ? (
        <EmptyState
          tone="danger"
          title="No pudimos cargar tus mascotas"
          description="Revisa tu conexión e inténtalo de nuevo."
          action={<Button full onClick={() => void load()}>Reintentar</Button>}
        />
      ) : items === null ? (
        <PetsListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aún no tienes mascotas"
          description="Añade la primera y armamos su plan de cuidados."
          action={<Button full size="lg" onClick={() => router.push("/mascotas/nueva")}>Añadir mi primera mascota</Button>}
          secondary={<Link href="/join">Tengo un código de invitación</Link>}
        />
      ) : (
        <motion.ul className="flex flex-col gap-3 px-4 pt-2" variants={reduce ? undefined : stagger()} initial={reduce ? false : "hidden"} animate="show">
          {items.map(({ row, chips }) => (
            <motion.li key={row.id} variants={reduce ? undefined : fadeUp}>
              <Card padded={false} interactive onClick={() => open(row.id)} role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && open(row.id)} className="flex items-center gap-4 p-3">
                <div className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[20px] bg-surface-3">
                  {row.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <PetAvatar pet={rowToPet(row)} size="lg" style={{ width: "100%", height: "100%", borderRadius: 20 }} />
                  )}
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <div className="truncate font-display text-[20px] leading-tight text-on">{row.name}</div>
                  <div className="mt-0.5 truncate text-[13px] text-on-variant">{petMetaLine(row)}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {chips === null ? (
                      <span className="skeleton h-6 w-28 rounded-full" aria-hidden="true" />
                    ) : (
                      chips.map((c) => (
                        <Tag key={c.label} tone={c.tone} size="xs">
                          {c.label}
                        </Tag>
                      ))
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="shrink-0 text-on-variant" aria-hidden="true" />
              </Card>
            </motion.li>
          ))}
          <motion.li variants={reduce ? undefined : fadeUp} className="pt-1">
            <Link href="/mascotas/nueva" className={buttonVariants({ variant: "tonal", size: "lg", full: true })}>
              <Plus size={20} aria-hidden="true" />
              Añadir mascota
            </Link>
          </motion.li>
        </motion.ul>
      )}
    </div>
  );
}
