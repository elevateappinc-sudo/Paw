/**
 * Modo demo: el cliente simulado debe responder a las mismas consultas que usan las pantallas.
 */
process.env.NEXT_PUBLIC_PAW_DEMO = "1";

import { fetchCareCycles, fetchUpcomingCycles, completeCareCycle, fetchCycleLogs, daysUntil } from "@/lib/api/careCycles";
import { fetchMyPets, fetchPet, fetchWeightLogs, addWeightLog } from "@/lib/api/pets";
import { fetchNearbyBusinesses, fetchBusiness, fetchBusinessServices, fetchReviews, searchBusinesses, fetchNearestEmergency, fetchPopularBusinesses } from "@/lib/api/businesses";
import { fetchMyBookings, createBooking, updateBookingStatus } from "@/lib/api/bookings";
import { fetchUpcomingEvents, rsvpEvent } from "@/lib/api/events";
import { fetchNearbyLostPets, fetchEmergencyCard, ensureEmergencyToken } from "@/lib/api/lostPets";
import { fetchExpenses } from "@/lib/api/expenses";
import { fetchTraining } from "@/lib/api/training";
import { createClient } from "@/lib/supabase/client";
import { DEMO_USER_ID } from "@/lib/demo";
import { resetDemoData } from "@/lib/demo/client";

const LUNA = "pet-luna";
const CHAPINERO = { lat: 4.6533, lng: -74.0567 };

beforeEach(() => resetDemoData());

describe("demo · mascotas y ciclos", () => {
  test("mascotas de la usuaria con foto", async () => {
    const pets = await fetchMyPets();
    expect(pets.map((p) => p.name)).toEqual(expect.arrayContaining(["Luna", "Milo", "Coco"]));
    const luna = await fetchPet(LUNA);
    expect(luna?.photo_url).toMatch(/^https?:/);
    expect(luna?.allergies).toContain("Pollo");
  });

  test("ciclos ordenados por fecha y próximos entre mascotas", async () => {
    const cycles = await fetchCareCycles(LUNA);
    expect(cycles.length).toBeGreaterThanOrEqual(10);
    for (let i = 1; i < cycles.length; i++) expect(cycles[i].next_due_at >= cycles[i - 1].next_due_at).toBe(true);
    const up = await fetchUpcomingCycles([LUNA, "pet-milo"], 5);
    expect(up).toHaveLength(5);
    expect(up.some((c) => c.kind === "dental")).toBe(false);
  });

  test("completar un ciclo registra el log y mueve la fecha", async () => {
    const before = (await fetchCareCycles(LUNA)).find((c) => c.id === "cy-l1")!;
    expect(daysUntil(before.next_due_at)).toBe(1);
    await completeCareCycle("cy-l1", { cost: 68000, product: "NexGard" });
    const after = (await fetchCareCycles(LUNA)).find((c) => c.id === "cy-l1")!;
    expect(daysUntil(after.next_due_at)).toBe(30);
    const logs = await fetchCycleLogs(LUNA, { kinds: ["deworm_external"] });
    expect(logs[0].care_cycles?.kind).toBe("deworm_external");
    expect(logs[0].cost).toBe(68000);
  });

  test("peso: lectura y alta", async () => {
    const before = await fetchWeightLogs(LUNA);
    await addWeightLog(LUNA, DEMO_USER_ID, 28.6);
    const after = await fetchWeightLogs(LUNA);
    expect(after.length).toBe(before.length + 1);
    const luna = await fetchPet(LUNA);
    expect(luna?.weight).toBe(28.4); // el trigger de BD no existe en demo; el valor base se mantiene
  });
});

describe("demo · directorio", () => {
  test("negocios cercanos con distancia, categoría y abierto", async () => {
    const all = await fetchNearbyBusinesses({ ...CHAPINERO, radiusM: 5000 });
    expect(all.length).toBeGreaterThan(8);
    expect(all[0].distance_m).toBeLessThanOrEqual(all[1].distance_m);
    const groomers = await fetchNearbyBusinesses({ ...CHAPINERO, radiusM: 5000, categories: ["peluqueria"] });
    expect(groomers.every((b) => b.categories.includes("peluqueria"))).toBe(true);
    expect(groomers.map((b) => b.name)).toContain("Pelos y Patas");
  });

  test("ficha, servicios y reseñas con embeds", async () => {
    const biz = await fetchBusiness("biz-1");
    expect(biz?.name).toBe("Clínica Huellas");
    const services = await fetchBusinessServices("biz-1");
    expect(services.some((s) => s.care_cycle_kind === "vaccine")).toBe(true);
    const reviews = await fetchReviews("biz-1");
    expect(reviews[0].users?.display_name).toBeTruthy();
    expect(reviews[0].pets?.name).toBeTruthy();
  });

  test("búsqueda por texto, populares y urgencia más cercana", async () => {
    const found = await searchBusinesses("pelos");
    expect(found.map((b) => b.name)).toContain("Pelos y Patas");
    const popular = await fetchPopularBusinesses();
    expect(popular[0].rating_count).toBeGreaterThanOrEqual(popular[1].rating_count);
    const er = await fetchNearestEmergency(CHAPINERO.lat, CHAPINERO.lng, 2);
    expect(er[0].emergency_24h).toBe(true);
  });
});

describe("demo · reservas y eventos", () => {
  test("citas con negocio, servicio y mascota embebidos", async () => {
    const bookings = await fetchMyBookings(DEMO_USER_ID);
    expect(bookings.length).toBeGreaterThanOrEqual(4);
    const confirmed = bookings.find((b) => b.status === "confirmed")!;
    expect(confirmed.businesses?.name).toBe("Pelos y Patas");
    expect(confirmed.business_services?.name).toBe("Baño + uñas");
    expect(confirmed.pets?.name).toBe("Luna");
  });

  test("crear y cancelar una reserva", async () => {
    const b = await createBooking({ business_id: "biz-1", service_id: "bs-2", pet_id: LUNA, user_id: DEMO_USER_ID, starts_at: new Date(Date.now() + 3 * 86400000).toISOString(), duration_min: 15, price: 45000 });
    expect(b.status).toBe("requested");
    expect(b.ends_at).toBeTruthy();
    const c = await updateBookingStatus(b.id, "cancelled");
    expect(c.status).toBe("cancelled");
  });

  test("eventos con conteo de asistentes y RSVP", async () => {
    const events = await fetchUpcomingEvents({ userId: DEMO_USER_ID });
    const adopcion = events.find((e) => e.id === "ev-1")!;
    expect(adopcion.going_count).toBe(86);
    expect(adopcion.my_status).toBeNull();
    await rsvpEvent("ev-1", DEMO_USER_ID, "going", LUNA);
    const again = await fetchUpcomingEvents({ userId: DEMO_USER_ID });
    expect(again.find((e) => e.id === "ev-1")!.my_status).toBe("going");
  });
});

describe("demo · emergencia y perdida", () => {
  test("mascota perdida cerca y ficha pública", async () => {
    const lost = await fetchNearbyLostPets(CHAPINERO.lat, CHAPINERO.lng);
    expect(lost[0].pet_name).toBe("Tomás");
    const card = await fetchEmergencyCard("demo-luna");
    expect(card?.pet_name).toBe("Luna");
    expect(card?.active_medications[0].name).toBe("Apoquel");
    expect(card?.last_vaccines.length).toBeGreaterThan(0);
    const token = await ensureEmergencyToken(LUNA, DEMO_USER_ID);
    expect(token).toBe("demo-luna");
  });
});

describe("demo · módulos heredados", () => {
  test("gastos, entrenamiento con tareas y logs de medicamentos", async () => {
    const gastos = await fetchExpenses(LUNA);
    expect(gastos.length).toBeGreaterThan(5);
    const clases = await fetchTraining(LUNA);
    expect(clases[0].tareas.length).toBeGreaterThan(0);
    const supabase = createClient();
    const { data } = await supabase.from("medication_logs").select("*").in("medication_id", ["med-1"]).order("scheduled_at", { ascending: false });
    expect((data ?? []).length).toBe(16);
    const { data: subs } = await supabase.from("business_subscriptions").select("status, marketplace_plans(name)").eq("business_id", "x").maybeSingle();
    expect(subs).toBeNull();
  });
});
