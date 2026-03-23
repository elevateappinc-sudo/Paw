"use client";
import { create } from "zustand";
import type {
  Pet, Gasto, ClaseEntrenamiento, TareaEntrenamiento,
  TaskStatus, ActiveModule, Vacuna, ItinerarioItem, RegistroItinerario, Notificacion,
} from "@/types";

import * as expensesApi from "@/lib/api/expenses";
import * as trainingApi from "@/lib/api/training";
import * as vaccinesApi from "@/lib/api/vaccines";
import * as itineraryApi from "@/lib/api/itinerary";
import * as notificationsApi from "@/lib/api/notifications";
// Toast import deferred to avoid SSR hydration issues
function showToast(msg: string, retry?: () => void) {
  if (typeof window !== "undefined") {
    import("@/components/ui/Toast").then(({ showToast: st }) => st(msg, retry));
  }
}

const DEFAULT_CONCEPTOS = ["Comida", "Baño", "Juguetes", "Salud", "Entrenamiento", "Veterinario", "Otros"];
const DEFAULT_PERSONAS  = ["Yo", "Mi pareja", "Familiar"];

// ─── helpers ────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toastErr(modulo: string, retry: () => void) {
  showToast(`Error al guardar ${modulo}. Reintentar`, retry);
}

// ─── Store interface ────────────────────────────────────────────────────────
interface PawStore {
  // Pets (kept in Zustand — managed by auth + server actions from F1a)
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

  // Auth (current user — set on login)
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;

  // ── Loading states per module ──
  loadingExpenses: boolean;
  loadingTraining: boolean;
  loadingVaccines: boolean;
  loadingItinerary: boolean;
  loadingNotifications: boolean;

  // ── Gastos ──────────────────────────────────────────
  gastos: Gasto[];
  conceptos: string[];
  personas: string[];
  fetchGastos: () => Promise<void>;
  addGasto: (g: Omit<Gasto, "id" | "petId" | "createdAt">) => Promise<void>;
  updateGasto: (id: string, g: Partial<Gasto>) => Promise<void>;
  deleteGasto: (id: string) => Promise<void>;
  addConcepto: (c: string) => void;
  addPersona: (p: string) => void;

  // ── Entrenamiento ────────────────────────────────────
  clases: ClaseEntrenamiento[];
  fetchClases: () => Promise<void>;
  addClass: (c: Omit<ClaseEntrenamiento, "id" | "petId" | "createdAt">) => Promise<void>;
  updateClass: (id: string, c: Partial<ClaseEntrenamiento>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  updateTarea: (claseId: string, tareaId: string, estado: TaskStatus) => Promise<void>;

  // ── Vacunas ──────────────────────────────────────────
  vacunas: Vacuna[];
  fetchVacunas: () => Promise<void>;
  addVacuna: (v: Omit<Vacuna, "id" | "petId" | "createdAt">) => Promise<void>;
  updateVacuna: (id: string, v: Partial<Vacuna>) => Promise<void>;
  deleteVacuna: (id: string) => Promise<void>;

  // ── Itinerario ───────────────────────────────────────
  itinerario: ItinerarioItem[];
  registros: RegistroItinerario[];
  fetchItinerario: () => Promise<void>;
  addItinerarioItem: (i: Omit<ItinerarioItem, "id" | "petId" | "createdAt">) => Promise<void>;
  updateItinerarioItem: (id: string, i: Partial<ItinerarioItem>) => Promise<void>;
  deleteItinerarioItem: (id: string) => Promise<void>;
  toggleRegistro: (itemId: string, fecha: string, userId: string) => Promise<void>;

  // ── Notificaciones ───────────────────────────────────
  notificaciones: Notificacion[];
  fetchNotificaciones: () => Promise<void>;
  addNotificacion: (n: Omit<Notificacion, "id" | "petId" | "autorId" | "leida" | "createdAt">, petId: string, autorId: string) => Promise<void>;
  marcarLeida: (id: string) => Promise<void>;
  deleteNotificacion: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
}

// ─── Store implementation ────────────────────────────────────────────────────
export const useStore = create<PawStore>()((set, get) => ({
  // ── Pets ─────────────────────────────────────────────
  pets: [],
  selectedPetId: null,

  // ── Auth ─────────────────────────────────────────────
  currentUserId: null,
  setCurrentUserId: (id) => set({ currentUserId: id }),

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

  // ── Loading states ───────────────────────────────────
  loadingExpenses: false,
  loadingTraining: false,
  loadingVaccines: false,
  loadingItinerary: false,
  loadingNotifications: false,

  // ── Gastos ───────────────────────────────────────────
  gastos: [],
  conceptos: DEFAULT_CONCEPTOS,
  personas: DEFAULT_PERSONAS,

  fetchGastos: async () => {
    const { selectedPetId } = get();
    if (!selectedPetId) return;
    set({ loadingExpenses: true });
    try {
      const gastos = await expensesApi.fetchExpenses(selectedPetId);
      set({ gastos });
    } catch {
      // Silently fail on fetch — data stays stale
    } finally {
      set({ loadingExpenses: false });
    }
  },

  addGasto: async (g) => {
    const { selectedPetId, currentUserId } = get();
    if (!selectedPetId || !currentUserId) return;
    const optimistic: Gasto = { ...g, id: uid(), petId: selectedPetId, createdAt: new Date().toISOString() };
    set((s) => ({ gastos: [...s.gastos, optimistic] }));
    try {
      const created = await expensesApi.createExpense(g, selectedPetId, currentUserId);
      set((s) => ({ gastos: s.gastos.map((x) => x.id === optimistic.id ? created : x) }));
    } catch {
      set((s) => ({ gastos: s.gastos.filter((x) => x.id !== optimistic.id) }));
      toastErr("gastos", () => get().addGasto(g));
    }
  },

  updateGasto: async (id, g) => {
    const prev = get().gastos.find((x) => x.id === id);
    set((s) => ({ gastos: s.gastos.map((x) => x.id === id ? { ...x, ...g } : x) }));
    try {
      await expensesApi.updateExpense(id, g);
    } catch {
      if (prev) set((s) => ({ gastos: s.gastos.map((x) => x.id === id ? prev : x) }));
      toastErr("gastos", () => get().updateGasto(id, g));
    }
  },

  deleteGasto: async (id) => {
    const prev = get().gastos.find((x) => x.id === id);
    set((s) => ({ gastos: s.gastos.filter((x) => x.id !== id) }));
    try {
      await expensesApi.deleteExpense(id);
    } catch {
      if (prev) set((s) => ({ gastos: [...s.gastos, prev] }));
      toastErr("gastos", () => get().deleteGasto(id));
    }
  },

  addConcepto: (c) => set((s) => ({ conceptos: s.conceptos.includes(c) ? s.conceptos : [...s.conceptos, c] })),
  addPersona: (p) => set((s) => ({ personas: s.personas.includes(p) ? s.personas : [...s.personas, p] })),

  // ── Entrenamiento ────────────────────────────────────
  clases: [],

  fetchClases: async () => {
    const { selectedPetId } = get();
    if (!selectedPetId) return;
    set({ loadingTraining: true });
    try {
      const clases = await trainingApi.fetchTraining(selectedPetId);
      set({ clases });
    } catch {
      // Silently fail
    } finally {
      set({ loadingTraining: false });
    }
  },

  addClass: async (c) => {
    const { selectedPetId, currentUserId } = get();
    if (!selectedPetId || !currentUserId) return;
    const optimistic: ClaseEntrenamiento = { ...c, id: uid(), petId: selectedPetId, createdAt: new Date().toISOString() };
    set((s) => ({ clases: [...s.clases, optimistic] }));
    try {
      const created = await trainingApi.createTrainingSession(c, selectedPetId, currentUserId);
      set((s) => ({ clases: s.clases.map((x) => x.id === optimistic.id ? created : x) }));
    } catch {
      set((s) => ({ clases: s.clases.filter((x) => x.id !== optimistic.id) }));
      toastErr("entrenamiento", () => get().addClass(c));
    }
  },

  updateClass: async (id, c) => {
    const prev = get().clases.find((x) => x.id === id);
    set((s) => ({ clases: s.clases.map((x) => x.id === id ? { ...x, ...c } : x) }));
    try {
      await trainingApi.updateTrainingSession(id, c);
    } catch {
      if (prev) set((s) => ({ clases: s.clases.map((x) => x.id === id ? prev : x) }));
      toastErr("entrenamiento", () => get().updateClass(id, c));
    }
  },

  deleteClass: async (id) => {
    const prev = get().clases.find((x) => x.id === id);
    set((s) => ({ clases: s.clases.filter((x) => x.id !== id) }));
    try {
      await trainingApi.deleteTrainingSession(id);
    } catch {
      if (prev) set((s) => ({ clases: [...s.clases, prev] }));
      toastErr("entrenamiento", () => get().deleteClass(id));
    }
  },

  updateTarea: async (claseId, tareaId, estado) => {
    set((s) => ({
      clases: s.clases.map((c) =>
        c.id === claseId
          ? { ...c, tareas: c.tareas.map((t: TareaEntrenamiento) => t.id === tareaId ? { ...t, estado } : t) }
          : c
      ),
    }));
    try {
      await trainingApi.updateTrainingTask(tareaId, estado);
    } catch {
      toastErr("entrenamiento", () => get().updateTarea(claseId, tareaId, estado));
    }
  },

  // ── Vacunas ──────────────────────────────────────────
  vacunas: [],

  fetchVacunas: async () => {
    const { selectedPetId } = get();
    if (!selectedPetId) return;
    set({ loadingVaccines: true });
    try {
      const vacunas = await vaccinesApi.fetchVaccines(selectedPetId);
      set({ vacunas });
    } catch {
      // Silently fail
    } finally {
      set({ loadingVaccines: false });
    }
  },

  addVacuna: async (v) => {
    const { selectedPetId, currentUserId } = get();
    if (!selectedPetId || !currentUserId) return;
    const optimistic: Vacuna = { ...v, id: uid(), petId: selectedPetId, createdAt: new Date().toISOString() };
    set((s) => ({ vacunas: [...s.vacunas, optimistic] }));
    try {
      const created = await vaccinesApi.createVaccine(v, selectedPetId, currentUserId);
      set((s) => ({ vacunas: s.vacunas.map((x) => x.id === optimistic.id ? created : x) }));
    } catch {
      set((s) => ({ vacunas: s.vacunas.filter((x) => x.id !== optimistic.id) }));
      toastErr("vacunas", () => get().addVacuna(v));
    }
  },

  updateVacuna: async (id, v) => {
    const prev = get().vacunas.find((x) => x.id === id);
    set((s) => ({ vacunas: s.vacunas.map((x) => x.id === id ? { ...x, ...v } : x) }));
    try {
      await vaccinesApi.updateVaccine(id, v);
    } catch {
      if (prev) set((s) => ({ vacunas: s.vacunas.map((x) => x.id === id ? prev : x) }));
      toastErr("vacunas", () => get().updateVacuna(id, v));
    }
  },

  deleteVacuna: async (id) => {
    const prev = get().vacunas.find((x) => x.id === id);
    set((s) => ({ vacunas: s.vacunas.filter((x) => x.id !== id) }));
    try {
      await vaccinesApi.deleteVaccine(id);
    } catch {
      if (prev) set((s) => ({ vacunas: [...s.vacunas, prev] }));
      toastErr("vacunas", () => get().deleteVacuna(id));
    }
  },

  // ── Itinerario ───────────────────────────────────────
  itinerario: [],
  registros: [],

  fetchItinerario: async () => {
    const { selectedPetId } = get();
    if (!selectedPetId) return;
    set({ loadingItinerary: true });
    try {
      const [items, records] = await Promise.all([
        itineraryApi.fetchItinerary(selectedPetId),
        itineraryApi.fetchItineraryRecords(selectedPetId),
      ]);
      set({ itinerario: items, registros: records });
    } catch {
      // Silently fail
    } finally {
      set({ loadingItinerary: false });
    }
  },

  addItinerarioItem: async (i) => {
    const { selectedPetId, currentUserId } = get();
    if (!selectedPetId || !currentUserId) return;
    const optimistic: ItinerarioItem = { ...i, id: uid(), petId: selectedPetId, createdAt: new Date().toISOString() };
    set((s) => ({ itinerario: [...s.itinerario, optimistic] }));
    try {
      const created = await itineraryApi.createItineraryItem(i, selectedPetId, currentUserId);
      set((s) => ({ itinerario: s.itinerario.map((x) => x.id === optimistic.id ? created : x) }));
    } catch {
      set((s) => ({ itinerario: s.itinerario.filter((x) => x.id !== optimistic.id) }));
      toastErr("itinerario", () => get().addItinerarioItem(i));
    }
  },

  updateItinerarioItem: async (id, i) => {
    const prev = get().itinerario.find((x) => x.id === id);
    set((s) => ({ itinerario: s.itinerario.map((x) => x.id === id ? { ...x, ...i } : x) }));
    try {
      await itineraryApi.updateItineraryItem(id, i);
    } catch {
      if (prev) set((s) => ({ itinerario: s.itinerario.map((x) => x.id === id ? prev : x) }));
      toastErr("itinerario", () => get().updateItinerarioItem(id, i));
    }
  },

  deleteItinerarioItem: async (id) => {
    const prev = get().itinerario.find((x) => x.id === id);
    set((s) => ({
      itinerario: s.itinerario.filter((x) => x.id !== id),
      registros: s.registros.filter((x) => x.itemId !== id),
    }));
    try {
      await itineraryApi.deleteItineraryItem(id);
    } catch {
      if (prev) set((s) => ({ itinerario: [...s.itinerario, prev] }));
      toastErr("itinerario", () => get().deleteItinerarioItem(id));
    }
  },

  toggleRegistro: async (itemId, fecha, userId) => {
    const { selectedPetId, registros } = get();
    if (!selectedPetId) return;
    const existing = registros.find((r) => r.itemId === itemId && r.fecha === fecha);
    // Optimistic
    if (existing) {
      set((s) => ({
        registros: s.registros.map((r) =>
          r.id === existing.id ? { ...r, completado: !r.completado } : r
        ),
      }));
    } else {
      const optimistic: RegistroItinerario = {
        id: uid(), petId: selectedPetId, itemId, fecha,
        completado: true, completadoPor: userId, createdAt: new Date().toISOString(),
      };
      set((s) => ({ registros: [...s.registros, optimistic] }));
    }
    try {
      const updated = await itineraryApi.toggleItineraryRecord(itemId, selectedPetId, fecha, userId);
      set((s) => ({
        registros: existing
          ? s.registros.map((r) => r.itemId === itemId && r.fecha === fecha ? updated : r)
          : s.registros.map((r) => r.petId === updated.petId && r.itemId === updated.itemId && r.fecha === updated.fecha ? updated : r),
      }));
    } catch {
      // Revert optimistic
      if (existing) {
        set((s) => ({
          registros: s.registros.map((r) =>
            r.id === existing.id ? existing : r
          ),
        }));
      } else {
        set((s) => ({
          registros: s.registros.filter((r) => !(r.itemId === itemId && r.fecha === fecha && r.petId === selectedPetId)),
        }));
      }
      toastErr("itinerario", () => get().toggleRegistro(itemId, fecha, userId));
    }
  },

  // ── Notificaciones ───────────────────────────────────
  notificaciones: [],

  fetchNotificaciones: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    set({ loadingNotifications: true });
    try {
      const notificaciones = await notificationsApi.fetchNotifications(currentUserId);
      set({ notificaciones });
    } catch {
      // Silently fail
    } finally {
      set({ loadingNotifications: false });
    }
  },

  addNotificacion: async (n, petId, autorId) => {
    const optimistic: Notificacion = {
      ...n, id: uid(), petId, autorId, leida: false, createdAt: new Date().toISOString(),
    };
    set((s) => ({ notificaciones: [optimistic, ...s.notificaciones] }));
    try {
      const created = await notificationsApi.createNotification(n, petId, autorId);
      set((s) => ({ notificaciones: s.notificaciones.map((x) => x.id === optimistic.id ? created : x) }));
    } catch {
      set((s) => ({ notificaciones: s.notificaciones.filter((x) => x.id !== optimistic.id) }));
      toastErr("notificaciones", () => get().addNotificacion(n, petId, autorId));
    }
  },

  marcarLeida: async (id) => {
    set((s) => ({ notificaciones: s.notificaciones.map((n) => n.id === id ? { ...n, leida: true } : n) }));
    try {
      await notificationsApi.markNotificationRead(id);
    } catch {
      toastErr("notificaciones", () => get().marcarLeida(id));
    }
  },

  deleteNotificacion: async (id) => {
    const prev = get().notificaciones.find((x) => x.id === id);
    set((s) => ({ notificaciones: s.notificaciones.filter((n) => n.id !== id) }));
    try {
      await notificationsApi.deleteNotification(id);
    } catch {
      if (prev) set((s) => ({ notificaciones: [...s.notificaciones, prev] }));
      toastErr("notificaciones", () => get().deleteNotificacion(id));
    }
  },

  marcarTodasLeidas: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    set((s) => ({ notificaciones: s.notificaciones.map((n) => ({ ...n, leida: true })) }));
    try {
      await notificationsApi.markAllNotificationsRead(currentUserId);
    } catch {
      toastErr("notificaciones", () => get().marcarTodasLeidas());
    }
  },
}));
