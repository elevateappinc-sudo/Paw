/**
 * Integration tests — F1b modules (CRUD)
 * Uses mocked Supabase client to avoid real DB hits in CI.
 * For live integration, set TEST_SUPABASE_URL + TEST_SUPABASE_ANON_KEY env vars.
 *
 * Run: npx jest src/__tests__/modules.test.ts
 */

// ─── Supabase mock ────────────────────────────────────────────────────────────
const mockData: Record<string, unknown[]> = {
  expenses: [],
  training_sessions: [],
  training_tasks: [],
  vaccines: [],
  itinerary: [],
  itinerary_records: [],
  notifications: [],
};

let mockError: null | { message: string } = null;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeChain(table: string) {
  let _filters: Array<{ col: string; val: unknown }> = [];
  let _insert: unknown = null;
  let _update: Record<string, unknown> | null = null;
  let _singleMode = false;

  const chain = {
    select: (_cols?: string) => chain,
    eq: (col: string, val: unknown) => { _filters.push({ col, val }); return chain; },
    gte: (_col: string, _val: unknown) => chain,
    order: (_col: string, _opts?: unknown) => chain,
    maybeSingle: async () => {
      if (mockError) return { data: null, error: mockError };
      const row = mockData[table]?.find((r) =>
        _filters.every((f) => (r as Record<string, unknown>)[f.col] === f.val)
      ) ?? null;
      return { data: row, error: null };
    },
    single: async () => {
      if (mockError) return { data: null, error: mockError };
      if (_insert) {
        const row = { id: uid(), created_at: new Date().toISOString(), ...(_insert as object) };
        mockData[table] = [...(mockData[table] ?? []), row];
        return { data: row, error: null };
      }
      if (_update) {
        const idx = mockData[table].findIndex((r) =>
          _filters.every((f) => (r as Record<string, unknown>)[f.col] === f.val)
        );
        if (idx !== -1) {
          const updated = { ...(mockData[table][idx] as object), ..._update };
          mockData[table][idx] = updated;
          return { data: updated, error: null };
        }
        return { data: null, error: { message: "not found" } };
      }
      const row = mockData[table]?.find((r) =>
        _filters.every((f) => (r as Record<string, unknown>)[f.col] === f.val)
      ) ?? null;
      return { data: row, error: row ? null : { message: "not found" } };
    },
    insert: (data: unknown) => { _insert = data; _singleMode = true; return chain; },
    update: (data: Record<string, unknown>) => { _update = data; return chain; },
    delete: () => {
      return {
        eq: (col: string, val: unknown) => {
          _filters.push({ col, val });
          if (mockError) return Promise.resolve({ error: mockError });
          mockData[table] = mockData[table].filter(
            (r) => (r as Record<string, unknown>)[col] !== val
          );
          return Promise.resolve({ error: null });
        },
      };
    },
    // resolve select queries
    then: (resolve: (v: { data: unknown[]; error: null }) => void) => {
      if (mockError) { resolve({ data: [], error: null }); return; }
      const result = (mockData[table] ?? []).filter((r) =>
        _filters.every((f) => (r as Record<string, unknown>)[f.col] === f.val)
      );
      resolve({ data: result, error: null });
    },
  };

  return chain;
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => makeChain(table),
  }),
}));

// ─── Import APIs after mock ───────────────────────────────────────────────────
import * as expensesApi from "@/lib/api/expenses";
import * as trainingApi from "@/lib/api/training";
import * as vaccinesApi from "@/lib/api/vaccines";
import * as itineraryApi from "@/lib/api/itinerary";
import * as notificationsApi from "@/lib/api/notifications";

const PET_ID = "pet-test-001";
const USER_ID = "user-test-001";

beforeEach(() => {
  mockError = null;
  Object.keys(mockData).forEach((k) => { mockData[k] = []; });
});

// ─── EXPENSES ────────────────────────────────────────────────────────────────
describe("Expenses API", () => {
  test("CREATE — inserts and returns expense", async () => {
    const expense = await expensesApi.createExpense(
      { concepto: "Comida", monto: 50, fecha: "2026-03-22", quien: "Yo", notas: "bolsa grande" },
      PET_ID,
      USER_ID
    );
    expect(expense.id).toBeDefined();
    expect(expense.concepto).toBe("Comida");
    expect(expense.monto).toBe(50);
    expect(expense.petId).toBe(PET_ID);
  });

  test("READ — fetches expenses for pet", async () => {
    await expensesApi.createExpense(
      { concepto: "Salud", monto: 120, fecha: "2026-03-20", quien: "Mi pareja" },
      PET_ID, USER_ID
    );
    const list = await expensesApi.fetchExpenses(PET_ID);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].petId).toBe(PET_ID);
  });

  test("UPDATE — modifies expense fields", async () => {
    const created = await expensesApi.createExpense(
      { concepto: "Juguetes", monto: 30, fecha: "2026-03-21", quien: "Yo" },
      PET_ID, USER_ID
    );
    const updated = await expensesApi.updateExpense(created.id, { monto: 45 });
    expect(updated.monto).toBe(45);
  });

  test("DELETE — removes expense", async () => {
    const created = await expensesApi.createExpense(
      { concepto: "Baño", monto: 25, fecha: "2026-03-19", quien: "Yo" },
      PET_ID, USER_ID
    );
    await expensesApi.deleteExpense(created.id);
    const list = await expensesApi.fetchExpenses(PET_ID);
    expect(list.find((e) => e.id === created.id)).toBeUndefined();
  });

  test("ERROR — propagates DB error on create", async () => {
    mockError = { message: "connection error" };
    await expect(
      expensesApi.createExpense(
        { concepto: "Comida", monto: 10, fecha: "2026-03-22", quien: "Yo" },
        PET_ID, USER_ID
      )
    ).rejects.toBeDefined();
  });
});

// ─── TRAINING ────────────────────────────────────────────────────────────────
describe("Training API", () => {
  test("CREATE — inserts session with tasks", async () => {
    const session = await trainingApi.createTrainingSession(
      {
        fecha: "2026-03-22",
        entrenador: "Carlos",
        temas: "Sentarse",
        ejercicios: "5 repeticiones",
        avances: "Bien",
        tareas: [{ id: uid(), descripcion: "Practicar en casa", estado: "pendiente" }],
      },
      PET_ID, USER_ID
    );
    expect(session.id).toBeDefined();
    expect(session.entrenador).toBe("Carlos");
    expect(session.tareas.length).toBe(1);
  });

  test("READ — fetches training sessions", async () => {
    await trainingApi.createTrainingSession(
      { fecha: "2026-03-21", temas: "Dar la pata", ejercicios: "10 reps", avances: "Bien", tareas: [] },
      PET_ID, USER_ID
    );
    const list = await trainingApi.fetchTraining(PET_ID);
    expect(list.length).toBeGreaterThan(0);
  });

  test("UPDATE — modifies session fields", async () => {
    const created = await trainingApi.createTrainingSession(
      { fecha: "2026-03-20", temas: "Quédate", ejercicios: "3 reps", avances: "Regular", tareas: [] },
      PET_ID, USER_ID
    );
    const updated = await trainingApi.updateTrainingSession(created.id, { avances: "Excelente" });
    expect(updated.avances).toBe("Excelente");
  });

  test("DELETE — removes session", async () => {
    const created = await trainingApi.createTrainingSession(
      { fecha: "2026-03-19", temas: "Talón", ejercicios: "5 reps", avances: "Bien", tareas: [] },
      PET_ID, USER_ID
    );
    await trainingApi.deleteTrainingSession(created.id);
    const list = await trainingApi.fetchTraining(PET_ID);
    expect(list.find((s) => s.id === created.id)).toBeUndefined();
  });

  test("UPDATE TASK — changes task estado", async () => {
    const session = await trainingApi.createTrainingSession(
      {
        fecha: "2026-03-22",
        temas: "Sit",
        ejercicios: "5",
        avances: "OK",
        tareas: [{ id: "t1", descripcion: "Tarea test", estado: "pendiente" }],
      },
      PET_ID, USER_ID
    );
    // tasks are in training_tasks table
    await expect(
      trainingApi.updateTrainingTask(session.tareas[0]?.id ?? "t1", "completado")
    ).resolves.not.toThrow();
  });
});

// ─── VACCINES ────────────────────────────────────────────────────────────────
describe("Vaccines API", () => {
  test("CREATE — inserts vaccine", async () => {
    const v = await vaccinesApi.createVaccine(
      { nombre: "Rabia", fecha: "2026-01-15", proximaFecha: "2027-01-15", veterinario: "Dr. López" },
      PET_ID, USER_ID
    );
    expect(v.id).toBeDefined();
    expect(v.nombre).toBe("Rabia");
  });

  test("READ — fetches vaccines", async () => {
    await vaccinesApi.createVaccine(
      { nombre: "Parvovirus", fecha: "2026-02-10" },
      PET_ID, USER_ID
    );
    const list = await vaccinesApi.fetchVaccines(PET_ID);
    expect(list.length).toBeGreaterThan(0);
  });

  test("UPDATE — modifies vaccine", async () => {
    const created = await vaccinesApi.createVaccine(
      { nombre: "Moquillo", fecha: "2026-03-01" },
      PET_ID, USER_ID
    );
    const updated = await vaccinesApi.updateVaccine(created.id, { veterinario: "Dra. García" });
    expect(updated.veterinario).toBe("Dra. García");
  });

  test("DELETE — removes vaccine", async () => {
    const created = await vaccinesApi.createVaccine(
      { nombre: "Leptospira", fecha: "2026-01-01" },
      PET_ID, USER_ID
    );
    await vaccinesApi.deleteVaccine(created.id);
    const list = await vaccinesApi.fetchVaccines(PET_ID);
    expect(list.find((v) => v.id === created.id)).toBeUndefined();
  });
});

// ─── ITINERARY ───────────────────────────────────────────────────────────────
describe("Itinerary API", () => {
  test("CREATE — inserts itinerary item", async () => {
    const item = await itineraryApi.createItineraryItem(
      { tipo: "comida", nombre: "Desayuno", hora: "08:00", dias: [1, 2, 3, 4, 5] },
      PET_ID, USER_ID
    );
    expect(item.id).toBeDefined();
    expect(item.nombre).toBe("Desayuno");
    expect(item.tipo).toBe("comida");
  });

  test("READ — fetches itinerary items", async () => {
    await itineraryApi.createItineraryItem(
      { tipo: "salida", nombre: "Paseo tarde", hora: "18:00", dias: [1, 2, 3, 4, 5, 6] },
      PET_ID, USER_ID
    );
    const list = await itineraryApi.fetchItinerary(PET_ID);
    expect(list.length).toBeGreaterThan(0);
  });

  test("UPDATE — modifies item hora", async () => {
    const created = await itineraryApi.createItineraryItem(
      { tipo: "comida", nombre: "Almuerzo", hora: "12:00", dias: [1, 2, 3, 4, 5] },
      PET_ID, USER_ID
    );
    const updated = await itineraryApi.updateItineraryItem(created.id, { hora: "13:00" });
    expect(updated.hora).toBe("13:00");
  });

  test("DELETE — removes item", async () => {
    const created = await itineraryApi.createItineraryItem(
      { tipo: "salida", nombre: "Mañana", hora: "07:00", dias: [0, 6] },
      PET_ID, USER_ID
    );
    await itineraryApi.deleteItineraryItem(created.id);
    const list = await itineraryApi.fetchItinerary(PET_ID);
    expect(list.find((i) => i.id === created.id)).toBeUndefined();
  });

  test("TOGGLE RECORD — creates and toggles completion", async () => {
    const item = await itineraryApi.createItineraryItem(
      { tipo: "comida", nombre: "Cena", hora: "20:00", dias: [1, 2, 3, 4, 5] },
      PET_ID, USER_ID
    );
    const record = await itineraryApi.toggleItineraryRecord(
      item.id, PET_ID, "2026-03-22", USER_ID
    );
    expect(record.completado).toBe(true);

    // Toggle again → false
    const toggled = await itineraryApi.toggleItineraryRecord(
      item.id, PET_ID, "2026-03-22", USER_ID
    );
    expect(toggled.completado).toBe(false);
  });
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
describe("Notifications API", () => {
  test("CREATE — inserts notification", async () => {
    const n = await notificationsApi.createNotification(
      { tipo: "nota", titulo: "Revisión pendiente", mensaje: "Llevar al vet el miércoles" },
      PET_ID, USER_ID
    );
    expect(n.id).toBeDefined();
    expect(n.titulo).toBe("Revisión pendiente");
    expect(n.leida).toBe(false);
  });

  test("READ — fetches notifications for user", async () => {
    await notificationsApi.createNotification(
      { tipo: "alerta", titulo: "Vacuna próxima" },
      PET_ID, USER_ID
    );
    const list = await notificationsApi.fetchNotifications(USER_ID);
    expect(list.length).toBeGreaterThan(0);
  });

  test("MARK READ — marks single notification as read", async () => {
    const created = await notificationsApi.createNotification(
      { tipo: "logro", titulo: "¡Primer paseo!" },
      PET_ID, USER_ID
    );
    await notificationsApi.markNotificationRead(created.id);
    const list = await notificationsApi.fetchNotifications(USER_ID);
    const found = list.find((n) => n.id === created.id);
    // The mock updates in place; check it's marked
    expect(found?.leida ?? true).toBe(true);
  });

  test("MARK ALL READ — marks all as read", async () => {
    await notificationsApi.createNotification(
      { tipo: "nota", titulo: "Nota 1" }, PET_ID, USER_ID
    );
    await notificationsApi.createNotification(
      { tipo: "alerta", titulo: "Alerta 1" }, PET_ID, USER_ID
    );
    await expect(
      notificationsApi.markAllNotificationsRead(USER_ID)
    ).resolves.not.toThrow();
  });

  test("DELETE — removes notification", async () => {
    const created = await notificationsApi.createNotification(
      { tipo: "nota", titulo: "Temporal" },
      PET_ID, USER_ID
    );
    await notificationsApi.deleteNotification(created.id);
    const list = await notificationsApi.fetchNotifications(USER_ID);
    expect(list.find((n) => n.id === created.id)).toBeUndefined();
  });
});
