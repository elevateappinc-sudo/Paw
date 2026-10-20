import { daysUntil, cycleUrgency, cycleProgress, dueLabel } from "@/lib/api/careCycles";
import { availableSlots } from "@/lib/api/bookings";
import { dailyGrams, restockEstimate, ageLabel, lifeStage } from "@/lib/api/pets";
import { isOpenNow, distanceLabel } from "@/lib/api/businesses";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

describe("ciclos de cuidado", () => {
  test("daysUntil cuenta días de calendario", () => {
    expect(daysUntil(iso(addDays(0)))).toBe(0);
    expect(daysUntil(iso(addDays(3)))).toBe(3);
    expect(daysUntil(iso(addDays(-2)))).toBe(-2);
  });

  test("urgencia según días", () => {
    expect(cycleUrgency({ next_due_at: iso(addDays(-1)), interval_days: 30 })).toBe("overdue");
    expect(cycleUrgency({ next_due_at: iso(addDays(2)), interval_days: 30 })).toBe("soon");
    expect(cycleUrgency({ next_due_at: iso(addDays(7)), interval_days: 30 })).toBe("soon");
    expect(cycleUrgency({ next_due_at: iso(addDays(10)), interval_days: 30 })).toBe("upcoming");
    expect(cycleUrgency({ next_due_at: iso(addDays(40)), interval_days: 90 })).toBe("ok");
  });

  test("progreso llega a 1 al vencer", () => {
    expect(cycleProgress({ next_due_at: iso(addDays(0)), interval_days: 30 })).toBe(1);
    expect(cycleProgress({ next_due_at: iso(addDays(15)), interval_days: 30 })).toBeCloseTo(0.5);
  });

  test("dueLabel en español", () => {
    expect(dueLabel(iso(addDays(0)))).toBe("Hoy");
    expect(dueLabel(iso(addDays(1)))).toBe("Mañana");
    expect(dueLabel(iso(addDays(-1)))).toBe("Venció ayer");
    expect(dueLabel(iso(addDays(4)))).toBe("En 4 días");
  });
});

describe("reservas", () => {
  test("franjas respetan horario, duración y ocupadas", () => {
    const date = "2030-01-15"; // futuro, sin filtro de hora pasada
    const slots = availableSlots({
      date,
      hours: [["09:00", "11:00"]],
      durationMin: 60,
      taken: [{ starts_at: `${date}T09:30:00`, ends_at: `${date}T10:30:00` }],
      stepMin: 30,
    });
    expect(slots.map((s) => s.time)).toEqual(["09:00", "09:30", "10:00"]);
    expect(slots.map((s) => s.available)).toEqual([false, false, false]);
  });

  test("sin horario no hay franjas", () => {
    expect(availableSlots({ date: "2030-01-15", hours: undefined, durationMin: 30, taken: [] })).toEqual([]);
  });
});

describe("alimentación y perfil", () => {
  test("ración diaria razonable para perro adulto esterilizado", () => {
    const g = dailyGrams(28.4, { stage: "adult", neutered: true, activity: "medium" });
    expect(g).toBeGreaterThan(250);
    expect(g).toBeLessThan(400);
  });

  test("recompra estimada", () => {
    const opened = new Date();
    opened.setDate(opened.getDate() - 10);
    const r = restockEstimate({ bag_kg: 15, opened_at: iso(opened), grams_per_day: 320 });
    expect(r).not.toBeNull();
    expect(r!.daysLeft).toBeGreaterThan(30);
    expect(r!.pctLeft).toBeLessThan(1);
  });

  test("edad y etapa", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    expect(ageLabel(iso(d))).toBe("3 años");
    expect(lifeStage("perro", iso(d))).toBe("adult");
    const old = new Date();
    old.setFullYear(old.getFullYear() - 9);
    expect(lifeStage("perro", iso(old))).toBe("senior");
    expect(lifeStage("gato", iso(old))).toBe("adult");
  });
});

describe("negocios", () => {
  test("abierto ahora según horario", () => {
    const monday10 = new Date(2030, 0, 7, 10, 0); // lunes
    expect(isOpenNow({ mon: [["09:00", "18:00"]] }, false, monday10)).toBe(true);
    expect(isOpenNow({ mon: [["11:00", "18:00"]] }, false, monday10)).toBe(false);
    expect(isOpenNow(null, true, monday10)).toBe(true);
  });

  test("distancia legible", () => {
    expect(distanceLabel(650)).toBe("650 m");
    expect(distanceLabel(1200)).toBe("1,2 km");
  });
});
