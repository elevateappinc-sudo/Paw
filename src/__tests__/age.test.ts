import { formatPetAge } from "@/lib/age";

const NOW = new Date(2026, 9, 14); // 14 oct 2026

describe("formatPetAge", () => {
  test("años y meses en singular y plural", () => {
    expect(formatPetAge("2025-02-14", NOW)).toBe("1 año y 8 meses");
    expect(formatPetAge("2024-09-14", NOW)).toBe("2 años y 1 mes");
    expect(formatPetAge("2025-09-14", NOW)).toBe("1 año y 1 mes");
  });

  test("años exactos sin meses en cero", () => {
    expect(formatPetAge("2023-10-14", NOW)).toBe("3 años");
    expect(formatPetAge("2025-10-14", NOW)).toBe("1 año");
  });

  test("solo meses por debajo del año", () => {
    expect(formatPetAge("2026-06-14", NOW)).toBe("4 meses");
    expect(formatPetAge("2026-09-14", NOW)).toBe("1 mes");
    // 20 meses no se trunca ni se queda en meses
    expect(formatPetAge("2025-02-01", NOW)).toBe("1 año y 8 meses");
  });

  test("no cuenta el mes si aún no llega el día", () => {
    expect(formatPetAge("2026-06-20", NOW)).toBe("3 meses");
  });

  test("menos de un mes", () => {
    expect(formatPetAge("2026-09-30", NOW)).toBe("2 semanas");
    expect(formatPetAge("2026-10-05", NOW)).toBe("1 semana");
    expect(formatPetAge("2026-10-12", NOW)).toBe("recién nacido");
  });

  test("sin fecha, inválida o futura", () => {
    expect(formatPetAge(null, NOW)).toBeNull();
    expect(formatPetAge("", NOW)).toBeNull();
    expect(formatPetAge("2027-01-01", NOW)).toBeNull();
  });
});
