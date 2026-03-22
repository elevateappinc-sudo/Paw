"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Pet, Gasto, ClaseEntrenamiento, TareaEntrenamiento,
  TaskStatus, ActiveModule, Vacuna, ItinerarioItem, RegistroItinerario, Notificacion,
} from "@/types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_CONCEPTOS = ["Comida", "Baño", "Juguetes", "Salud", "Entrenamiento", "Veterinario", "Otros"];
const DEFAULT_PERSONAS  = ["Yo", "Mi pareja", "Familiar"];

interface PawStore {
  // Pets
  pets: Pet[];
  selectedPetId: string | null;
  addPet: (p: Omit<Pet, "id" | "ownerId" | "sharedWith" | "photos" | "createdAt">, ownerId?: string) => void;
  addPetPhoto: (petId: string, dataUrl: string) => void;
  deletePetPhoto: (petId: string, index: number) => void;
  updatePet: (id: string, p: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  selectPet: (id: string | null) => void;

  // Navigation
  activeModule: ActiveModule;
  setActiveModule: (m: ActiveModule) => void;

  // Gastos
  gastos: Gasto[];
  conceptos: string[];
  personas: string[];
  addGasto: (g: Omit<Gasto, "id" | "petId" | "createdAt">) => void;
  updateGasto: (id: string, g: Partial<Gasto>) => void;
  deleteGasto: (id: string) => void;
  addConcepto: (c: string) => void;
  addPersona: (p: string) => void;

  // Entrenamiento
  clases: ClaseEntrenamiento[];
  addClass: (c: Omit<ClaseEntrenamiento, "id" | "petId" | "createdAt">) => void;
  updateClass: (id: string, c: Partial<ClaseEntrenamiento>) => void;
  deleteClass: (id: string) => void;
  updateTarea: (claseId: string, tareaId: string, estado: TaskStatus) => void;

  // Vacunas
  vacunas: Vacuna[];
  addVacuna: (v: Omit<Vacuna, "id" | "petId" | "createdAt">) => void;
  updateVacuna: (id: string, v: Partial<Vacuna>) => void;
  deleteVacuna: (id: string) => void;

  // Itinerario
  itinerario: ItinerarioItem[];
  registros: RegistroItinerario[];
  addItinerarioItem: (i: Omit<ItinerarioItem, "id" | "petId" | "createdAt">) => void;
  updateItinerarioItem: (id: string, i: Partial<ItinerarioItem>) => void;
  deleteItinerarioItem: (id: string) => void;
  toggleRegistro: (itemId: string, fecha: string, userId: string) => void;

  // Notificaciones
  notificaciones: Notificacion[];
  addNotificacion: (n: Omit<Notificacion, "id" | "petId" | "autorId" | "leida" | "createdAt">, petId: string, autorId: string) => void;
  marcarLeida: (id: string) => void;
  deleteNotificacion: (id: string) => void;
  marcarTodasLeidas: () => void;
}

export const useStore = create<PawStore>()(
  persist(
    (set, get) => ({
      // ── Pets ──────────────────────────────────────────────
      pets: [],
      selectedPetId: null,

      addPet: (p, ownerId = "") => {
        const newId = uid();
        const pet: Pet = {
          ...p,
          id: newId,
          ownerId,
          sharedWith: [],
          photos: [],
          // If no avatar_config provided, lazy init will handle it in PetAvatar
          avatar_config: p.avatar_config ?? null,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ pets: [...s.pets, pet], selectedPetId: pet.id }));
      },

      updatePet: (id, p) => set((s) => ({ pets: s.pets.map((x) => x.id === id ? { ...x, ...p } : x) })),

      deletePet: (id) =>
        set((s) => ({
          pets: s.pets.filter((x) => x.id !== id),
          gastos: s.gastos.filter((x) => x.petId !== id),
          clases: s.clases.filter((x) => x.petId !== id),
          vacunas: s.vacunas.filter((x) => x.petId !== id),
          itinerario: s.itinerario.filter((x) => x.petId !== id),
          registros: s.registros.filter((x) => x.petId !== id),
          notificaciones: s.notificaciones.filter((x) => x.petId !== id),
          selectedPetId: s.selectedPetId === id ? null : s.selectedPetId,
        })),

      selectPet: (id) => set({ selectedPetId: id, activeModule: "dashboard" }),

      addPetPhoto: (petId, dataUrl) =>
        set((s) => ({
          pets: s.pets.map((p) => p.id === petId ? { ...p, photos: [...(p.photos ?? []), dataUrl] } : p),
        })),

      deletePetPhoto: (petId, index) =>
        set((s) => ({
          pets: s.pets.map((p) => p.id === petId ? { ...p, photos: (p.photos ?? []).filter((_, i) => i !== index) } : p),
        })),

      // ── Navigation ───────────────────────────────────────
      activeModule: "dashboard",
      setActiveModule: (m) => set({ activeModule: m }),

      // ── Gastos ───────────────────────────────────────────
      gastos: [],
      conceptos: DEFAULT_CONCEPTOS,
      personas: DEFAULT_PERSONAS,

      addGasto: (g) => {
        const { selectedPetId } = get();
        if (!selectedPetId) return;
        set((s) => ({ gastos: [...s.gastos, { ...g, id: uid(), petId: selectedPetId, createdAt: new Date().toISOString() }] }));
      },
      updateGasto: (id, g) => set((s) => ({ gastos: s.gastos.map((x) => x.id === id ? { ...x, ...g } : x) })),
      deleteGasto: (id) => set((s) => ({ gastos: s.gastos.filter((x) => x.id !== id) })),
      addConcepto: (c) => set((s) => ({ conceptos: s.conceptos.includes(c) ? s.conceptos : [...s.conceptos, c] })),
      addPersona: (p) => set((s) => ({ personas: s.personas.includes(p) ? s.personas : [...s.personas, p] })),

      // ── Entrenamiento ────────────────────────────────────
      clases: [],
      addClass: (c) => {
        const { selectedPetId } = get();
        if (!selectedPetId) return;
        set((s) => ({ clases: [...s.clases, { ...c, id: uid(), petId: selectedPetId, createdAt: new Date().toISOString() }] }));
      },
      updateClass: (id, c) => set((s) => ({ clases: s.clases.map((x) => x.id === id ? { ...x, ...c } : x) })),
      deleteClass: (id) => set((s) => ({ clases: s.clases.filter((x) => x.id !== id) })),
      updateTarea: (claseId, tareaId, estado) =>
        set((s) => ({
          clases: s.clases.map((c) =>
            c.id === claseId
              ? { ...c, tareas: c.tareas.map((t: TareaEntrenamiento) => t.id === tareaId ? { ...t, estado } : t) }
              : c
          ),
        })),

      // ── Vacunas ──────────────────────────────────────────
      vacunas: [],
      addVacuna: (v) => {
        const { selectedPetId } = get();
        if (!selectedPetId) return;
        set((s) => ({ vacunas: [...s.vacunas, { ...v, id: uid(), petId: selectedPetId, createdAt: new Date().toISOString() }] }));
      },
      updateVacuna: (id, v) => set((s) => ({ vacunas: s.vacunas.map((x) => x.id === id ? { ...x, ...v } : x) })),
      deleteVacuna: (id) => set((s) => ({ vacunas: s.vacunas.filter((x) => x.id !== id) })),

      // ── Itinerario ───────────────────────────────────────
      itinerario: [],
      registros: [],

      addItinerarioItem: (i) => {
        const { selectedPetId } = get();
        if (!selectedPetId) return;
        set((s) => ({
          itinerario: [...s.itinerario, { ...i, id: uid(), petId: selectedPetId, createdAt: new Date().toISOString() }],
        }));
      },
      updateItinerarioItem: (id, i) =>
        set((s) => ({ itinerario: s.itinerario.map((x) => x.id === id ? { ...x, ...i } : x) })),
      deleteItinerarioItem: (id) =>
        set((s) => ({
          itinerario: s.itinerario.filter((x) => x.id !== id),
          registros: s.registros.filter((x) => x.itemId !== id),
        })),

      toggleRegistro: (itemId, fecha, userId) => {
        const { registros, selectedPetId } = get();
        const existing = registros.find((r) => r.itemId === itemId && r.fecha === fecha);
        if (existing) {
          set((s) => ({
            registros: s.registros.map((r) =>
              r.id === existing.id ? { ...r, completado: !r.completado } : r
            ),
          }));
        } else {
          set((s) => ({
            registros: [...s.registros, {
              id: uid(), petId: selectedPetId!, itemId, fecha,
              completado: true, completadoPor: userId,
              createdAt: new Date().toISOString(),
            }],
          }));
        }
      },

      // ── Notificaciones ───────────────────────────────────
      notificaciones: [],

      addNotificacion: (n, petId, autorId) => {
        set((s) => ({
          notificaciones: [{
            ...n, id: uid(), petId, autorId,
            leida: false, createdAt: new Date().toISOString(),
          }, ...s.notificaciones],
        }));
      },
      marcarLeida: (id) =>
        set((s) => ({ notificaciones: s.notificaciones.map((n) => n.id === id ? { ...n, leida: true } : n) })),
      deleteNotificacion: (id) =>
        set((s) => ({ notificaciones: s.notificaciones.filter((n) => n.id !== id) })),
      marcarTodasLeidas: () =>
        set((s) => ({ notificaciones: s.notificaciones.map((n) => ({ ...n, leida: true })) })),
    }),
    { name: "paw-store-v3" }
  )
);
