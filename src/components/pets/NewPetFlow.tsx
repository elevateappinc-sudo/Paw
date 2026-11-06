"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, ChevronLeft, ChevronRight, Info, PartyPopper, PawPrint } from "lucide-react";
import { ProgressBar, Input, SegmentedControl, Toggle, Button, Card, buttonVariants, showToast } from "@/components/ui";
import { ChipsInput } from "@/components/pets/ChipsInput";
import { uploadPetProfilePhoto } from "@/components/pets/petPhoto";
import { PhotoDropCircle } from "@/components/pets/PhotoDropCircle";
import { CARE_KIND_ICON } from "@/components/pets/petHelpers";
import { createPet, lifeStage, updatePetProfile } from "@/lib/api/pets";
import { fetchCareCycles, regenerateCycles, daysUntil, dueLabel } from "@/lib/api/careCycles";
import { cn } from "@/lib/utils";
import { PriorHistorySheet, cyclesWithoutHistory } from "@/components/salud/PriorHistorySheet";
import { ClipboardList } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { completeOnboarding } from "@/lib/supabase/updateUserMetadata";
import { useStore } from "@/store";
import { fadeUp } from "@/lib/motion";
import { today } from "@/lib/utils";
import type { CareCycle, Sex, Species } from "@/types/db";

type SpeciesOption = Extract<Species, "perro" | "gato" | "otro">;

interface Form {
  name: string;
  species: SpeciesOption;
  sex: Sex;
  birth_date: string;
  weight: string;
  breed: string;
  neutered: boolean;
  hasChip: boolean;
  microchip: string;
  allergies: string[];
}

/** Grupos de la lista del plan según los días que faltan */
const WEEK_GROUPS: { label: string; match: (days: number) => boolean }[] = [
  { label: "Esta semana", match: (d) => d <= 7 },
  { label: "Próximas semanas", match: (d) => d > 7 },
];

const INITIAL: Form = { name: "", species: "perro", sex: "unknown", birth_date: "", weight: "", breed: "", neutered: false, hasChip: false, microchip: "", allergies: [] };

function adviceFor(species: SpeciesOption, birth: string): string {
  const stage = lifeStage(species, birth || null);
  if (species === "gato") {
    if (stage === "puppy") return "Gatito: desparasitación cada 15 días hasta los 6 meses y triple felina en 3 dosis entre las 8 y 16 semanas.";
    if (stage === "senior") return "Gato senior: control veterinario semestral con analítica renal y control de peso quincenal.";
    return "Gato adulto: refuerzo anual de triple felina y antirrábica, antipulgas mensual y cepillado semanal.";
  }
  if (species === "perro") {
    if (stage === "puppy") return "Cachorro: desparasitación cada 15 días hasta los 6 meses y polivalente en 3 dosis entre las 6 y 16 semanas.";
    if (stage === "senior") return "Perro senior: control veterinario semestral con analítica y control de peso quincenal.";
    return "Perro adulto: refuerzo anual de vacunas, antipulgas mensual y desparasitación cada 3 meses.";
  }
  return "Armamos un plan básico con control veterinario semestral; podrás añadir cuidados a tu medida.";
}

export function NewPetFlow({ userId, mode = "new" }: { userId: string; mode?: "new" | "onboarding" }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { fetchPets, selectPet } = useStore();
  const push = usePushNotifications();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<Form>(INITIAL);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);
  const [plan, setPlan] = useState<CareCycle[] | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const nameOk = form.name.trim().length > 0;
  const advice = useMemo(() => adviceFor(form.species, form.birth_date), [form.species, form.birth_date]);

  async function persist(minimal: boolean) {
    if (!nameOk) {
      setNameError("Ponle un nombre al menos");
      setStep(1);
      return null;
    }
    setSaving(true);
    try {
      const weight = Number(form.weight.replace(",", "."));
      const pet = await createPet({
        user_id: userId,
        name: form.name.trim(),
        species: form.species,
        sex: form.sex,
        ...(minimal
          ? {}
          : {
              breed: form.breed.trim() || undefined,
              birth_date: form.birth_date || undefined,
              weight: weight > 0 ? Math.round(weight * 10) / 10 : undefined,
              neutered: form.neutered,
              microchip: form.hasChip && form.microchip.trim() ? form.microchip.trim() : undefined,
            }),
      });
      const extras: Parameters<typeof updatePetProfile>[1] = {};
      if (!minimal && form.allergies.length > 0) extras.allergies = form.allergies;
      if (photo) {
        try {
          extras.photo_url = await uploadPetProfilePhoto(photo, pet.id, userId);
        } catch {
          showToast("No pudimos subir la foto; la guardamos sin foto", undefined, "error");
        }
      }
      if (Object.keys(extras).length > 0) {
        try {
          await updatePetProfile(pet.id, extras);
        } catch {
          /* datos secundarios */
        }
      }
      try {
        await regenerateCycles(pet.id);
      } catch {
        /* el trigger de BD ya los genera */
      }
      completeOnboarding().catch(() => {});
      await fetchPets();
      selectPet(pet.id);
      return pet;
    } catch {
      showToast("No pudimos guardar a tu mascota", undefined, "error");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function later() {
    const pet = await persist(true);
    if (pet) router.push("/home");
  }

  async function createPlan() {
    const pet = await persist(false);
    if (!pet) return;
    setCreated({ id: pet.id, name: pet.name });
    setStep(3);
    try {
      const cycles = await fetchCareCycles(pet.id);
      setPlan(cycles.filter((c) => c.kind !== "dental"));
    } catch {
      setPlan([]);
    }
  }

  async function finish() {
    setFinishing(true);
    let enabled = false;
    try {
      // Nunca bloquear la entrada al Inicio: si el navegador tarda o falla, se sigue sin push
      if (push.isSupported && push.permission !== "denied") {
        enabled = await Promise.race([push.requestPermission(), new Promise<boolean>((r) => setTimeout(() => r(false), 15000))]);
      }
    } catch {
      /* sin push */
    } finally {
      setFinishing(false);
      // Solo avisar si dio permiso pero la suscripción falló (no si eligió "No permitir")
      if (!enabled && push.isSupported && typeof Notification !== "undefined" && Notification.permission === "granted") showToast("No pudimos activar los recordatorios; puedes hacerlo en Ajustes", undefined, "error");
      router.push("/home");
    }
  }

  const [priorOpen, setPriorOpen] = useState(false);
  const priorCount = cyclesWithoutHistory(plan).length;
  async function reloadPlan() {
    if (!created) return;
    try {
      const cycles = await fetchCareCycles(created.id);
      setPlan(cycles.filter((c) => c.kind !== "dental"));
    } catch {
      /* se mantiene el plan anterior */
    }
  }

  const title = step === 3 ? "Tu plan está listo" : "Cuéntanos de tu mascota";
  const subtitle = step === 3 ? "Te avisaremos antes de cada cuidado" : "Con especie, nacimiento y peso armamos su plan de vacunas y cuidados";
  const firstWeeks = plan ? plan.filter((c) => daysUntil(c.next_due_at) <= 28) : [];
  const rest = plan ? plan.length - firstWeeks.length : 0;

  return (
    <div className="flex min-h-dvh flex-col pb-[max(20px,env(safe-area-inset-bottom))]">
      {/* Cabecera compuesta como PageHeader: atrás controla el paso, "Después" guarda lo mínimo, SOS siempre */}
      <header className="flex items-center justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {step !== 3 && (
            <button
              type="button"
              onClick={() => (step === 2 ? setStep(1) : mode === "new" ? router.push("/mascotas") : router.back())}
              aria-label="Volver"
              className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
          )}
          <div className="eyebrow">Paso {step} de 3</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {step !== 3 && (
            <Button variant="ghost" size="sm" onClick={() => void later()} loading={saving}>
              Después
            </Button>
          )}
        </div>
      </header>
      <div className="px-4">
        <ProgressBar value={step / 3} />
      </div>
      <div className="px-4 pt-4">
        <h1 className="font-semibold text-display leading-[1.1] text-text">{title}</h1>
        <p className="mt-2 text-body text-text-secondary">{subtitle}</p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} variants={reduce ? undefined : fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }} className="flex flex-1 flex-col gap-4 px-4 pt-6">
          {step === 1 && (
            <>
              <div className="flex flex-col items-center gap-2">
                <PhotoDropCircle preview={preview} onFile={setPhoto} size="lg" />
                <span className="text-small text-text-secondary">{preview ? "Toca o arrastra para cambiar" : "Añadir foto (opcional): toca o arrastra"}</span>
              </div>
              <Input
                label="Nombre"
                placeholder="¿Cómo se llama?"
                value={form.name}
                error={nameError ?? undefined}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (nameError && e.target.value.trim()) setNameError(null);
                }}
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <span className="text-small font-semibold text-text-secondary">Especie</span>
                <SegmentedControl
                  ariaLabel="Especie"
                  value={form.species}
                  onChange={(v) => set("species", v)}
                  options={[
                    { value: "perro", label: "Perro" },
                    { value: "gato", label: "Gato" },
                    { value: "otro", label: "Otro" },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-small font-semibold text-text-secondary">Sexo</span>
                <SegmentedControl
                  ariaLabel="Sexo"
                  value={form.sex}
                  onChange={(v) => set("sex", v)}
                  options={[
                    { value: "male", label: "Macho" },
                    { value: "female", label: "Hembra" },
                    { value: "unknown", label: "No sé" },
                  ]}
                />
              </div>
              <div className="mt-auto pt-4">
                <Button full size="lg" onClick={() => (nameOk ? setStep(2) : setNameError("Ponle un nombre para continuar"))}>
                  Continuar
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Input label="Fecha de nacimiento" type="date" value={form.birth_date} max={today()} onChange={(e) => set("birth_date", e.target.value)} hint="Si no la sabes exacta, pon una aproximada" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Peso" type="number" inputMode="decimal" step="0.1" min="0.1" placeholder="12,4" value={form.weight} onChange={(e) => set("weight", e.target.value)} trailing={<span className="text-body text-text-secondary">kg</span>} />
                <Input label="Raza" placeholder="Criollo, labrador…" value={form.breed} onChange={(e) => set("breed", e.target.value)} />
              </div>
              <Toggle label="Esterilizado" checked={form.neutered} onChange={(v) => set("neutered", v)} />
              <Toggle label="Tiene microchip" checked={form.hasChip} onChange={(v) => set("hasChip", v)} />
              {form.hasChip && <Input label="Número de microchip" inputMode="numeric" placeholder="15 dígitos" value={form.microchip} onChange={(e) => set("microchip", e.target.value)} />}
              <ChipsInput label="Alergias" tone="warn" value={form.allergies} onChange={(v) => set("allergies", v)} placeholder="Pollo, polen… (opcional)" />
              <Card tone="info" elevation={0} className="flex items-start gap-3">
                <Info size={20} className="mt-1 shrink-0 text-info-text" aria-hidden="true" />
                <p className="text-body leading-relaxed">{advice}</p>
              </Card>
              <div className="mt-auto pt-4">
                <Button full size="lg" onClick={() => void createPlan()} loading={saving}>
                  Crear su plan
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Resumen del plan: tarjeta destacada (blanca en oscuro) */}
              <section className="hero-surface invert-dark rounded-xl p-4" aria-label="Resumen del plan">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-surface bg-primary-soft text-primary-text">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <PawPrint size={28} aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow">Plan de cuidados</p>
                    <p className="truncate text-title font-semibold text-text">{created?.name ?? "Tu mascota"}</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pastel-glass text-primary-text">
                    <PartyPopper size={20} aria-hidden="true" />
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-pastel-glass pt-3">
                  <div>
                    <dt className="text-small text-text-secondary">Próximas 4 semanas</dt>
                    <dd className="text-title font-semibold text-text">{plan === null ? "…" : firstWeeks.length}</dd>
                  </div>
                  <div>
                    <dt className="text-small text-text-secondary">Resto del año</dt>
                    <dd className="text-title font-semibold text-text">{plan === null ? "…" : rest}</dd>
                  </div>
                </dl>
              </section>

              {/* Historial previo: tarjeta propia con una sola acción */}
              {plan && plan.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPriorOpen(true)}
                  className="pressable invert-dark flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left shadow-1"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-primary-soft text-primary-text">
                    <ClipboardList size={22} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold text-text">{priorCount > 0 ? "¿Ya tiene vacunas?" : "Ajustar el plan"}</span>
                    <span className="block text-small text-text-secondary">Registra fechas previas o cambia frecuencias</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
                </button>
              )}

              {/* Cuidados de las primeras semanas: tarjetas separadas agrupadas por semana */}
              <section aria-labelledby="plan-first">
                <h2 id="plan-first" className="flex items-center gap-2 text-title font-semibold text-text">
                  Primeras 4 semanas
                  {plan !== null && (
                    <span className="rounded-full bg-primary-soft px-2 text-small font-semibold tabular-nums text-primary-text">{firstWeeks.length}</span>
                  )}
                </h2>
                {plan === null ? (
                  <div className="mt-3 flex flex-col gap-2" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                        <div className="skeleton h-12 w-12 shrink-0 rounded-lg" />
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="skeleton h-4 w-32" />
                          <div className="skeleton h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : firstWeeks.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-border bg-surface p-4 text-body text-text-secondary">
                    {plan.length === 0 ? "El plan se generará en cuanto esté disponible. Puedes añadir cuidados desde Salud." : "Nada urgente en las próximas 4 semanas."}
                  </p>
                ) : (
                  WEEK_GROUPS.map((g) => {
                    const items = firstWeeks.filter((c) => g.match(daysUntil(c.next_due_at)));
                    if (items.length === 0) return null;
                    return (
                      <div key={g.label} className="mt-3">
                        <h3 className="eyebrow mb-2">{g.label}</h3>
                        <ul className="enter-soft-list flex flex-col gap-2">
                          {items.map((c) => {
                            const Icon = CARE_KIND_ICON[c.kind];
                            const overdue = daysUntil(c.next_due_at) < 0;
                            return (
                              <li key={c.id} className="invert-dark flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-1">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-primary-soft text-primary-text">
                                  <Icon size={22} aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block break-words text-body font-semibold text-text">{c.name}</span>
                                  <span className={cn("flex items-center gap-1.5 text-small font-semibold", overdue ? "text-overdue-text" : "text-primary-text")}>
                                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", overdue ? "bg-current" : "bg-accent")} aria-hidden="true" />
                                    {dueLabel(c.next_due_at)}
                                  </span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })
                )}
                {rest > 0 && (
                  <p className="mt-3 text-center text-small text-text-secondary">
                    y {rest} {rest === 1 ? "cuidado más" : "cuidados más"} a lo largo del año
                  </p>
                )}
              </section>

              <div className="mt-auto flex flex-col gap-2 pt-4">
                <Button full size="lg" onClick={() => void finish()} loading={finishing} leading={<Bell size={18} aria-hidden="true" />}>
                  Activar recordatorios y empezar
                </Button>
                <Link href={created ? `/salud?pet=${created.id}` : "/salud"} className={buttonVariants({ variant: "ghost", size: "lg", full: true })}>
                  Revisar el plan primero
                </Link>
              </div>
              <PriorHistorySheet open={priorOpen} onClose={() => setPriorOpen(false)} cycles={plan ?? []} petName={created?.name ?? "tu mascota"} petId={created?.id} onSaved={() => void reloadPlan()} />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
