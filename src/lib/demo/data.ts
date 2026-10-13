/**
 * Conjunto de datos de ejemplo. Todo es ficticio.
 * Las fechas se calculan relativas a hoy para que "mañana", "vence pronto", etc. siempre tengan sentido.
 */
import { DEMO_USER_ID } from "./index";

export type Row = Record<string, unknown>;
export type Dataset = Record<string, Row[]>;

const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (n: number, base = new Date()) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};
const day = (n: number) => localDate(addDays(n));
const at = (n: number, h: number, m = 0) => {
  const d = addDays(n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const yearsAgo = (y: number, m = 0) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - y);
  d.setMonth(d.getMonth() - m);
  return localDate(d);
};
const monthsAgo = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return localDate(d);
};

/** Imágenes de ejemplo (servicios públicos de placeholders con semilla fija) */
export const IMG = {
  luna: "https://loremflickr.com/640/640/golden,retriever,dog?lock=101",
  milo: "https://loremflickr.com/640/640/grey,kitten?lock=102",
  coco: "https://loremflickr.com/640/640/black,dog?lock=103",
  lunaGallery: [
    "https://loremflickr.com/800/800/golden,retriever?lock=104",
    "https://loremflickr.com/800/800/golden,retriever,beach?lock=105",
    "https://loremflickr.com/800/800/golden,retriever,puppy?lock=106",
    "https://loremflickr.com/800/800/dog,park?lock=107",
  ],
  tomas: "https://loremflickr.com/640/640/beagle?lock=108",
  andrea: "https://i.pravatar.cc/120?img=47",
  carlos: "https://i.pravatar.cc/120?img=12",
  marcela: "https://i.pravatar.cc/120?img=32",
  biz: (seed: number, kw: string) => `https://loremflickr.com/800/500/${kw}?lock=${seed}`,
  event: (seed: number, kw: string) => `https://loremflickr.com/900/500/${kw}?lock=${seed}`,
};

const U = { andrea: DEMO_USER_ID, carlos: "demo-user-carlos", marcela: "demo-user-marcela" };
const P = { luna: "pet-luna", milo: "pet-milo", coco: "pet-coco", tomas: "pet-tomas" };

export const DEMO_USER = {
  id: U.andrea,
  email: "andrea@demo.paw",
  user_metadata: { full_name: "Andrea Gómez", name: "Andrea", avatar_url: IMG.andrea, onboarding_completed: true },
  app_metadata: { provider: "demo" },
  aud: "authenticated",
  role: "authenticated",
  created_at: monthsAgo(8) + "T10:00:00.000Z",
};

function uid(prefix: string, i: number) {
  return `${prefix}-${i}`;
}

export function buildDataset(): Dataset {
  const users: Row[] = [
    { id: U.andrea, email: "andrea@demo.paw", display_name: "Andrea Gómez", avatar_url: IMG.andrea, migration_completed: true, google_linked: false, created_at: monthsAgo(8) },
    { id: U.carlos, email: "carlos@demo.paw", display_name: "Carlos Ruiz", avatar_url: IMG.carlos, migration_completed: true, google_linked: false, created_at: monthsAgo(6) },
    { id: U.marcela, email: "marcela@demo.paw", display_name: "Marcela Torres", avatar_url: IMG.marcela, migration_completed: true, google_linked: false, created_at: monthsAgo(3) },
  ];

  const pets: Row[] = [
    {
      id: P.luna, user_id: U.andrea, name: "Luna", species: "perro", breed: "Golden retriever", birth_date: yearsAgo(3, 7), weight: 28.4, emoji: "🐾", color: "#357050",
      avatar_config: null, sex: "female", neutered: true, microchip: "941000024118", allergies: ["Pollo"], conditions: ["Dermatitis atópica"], blood_type: "DEA 1.1 negativo",
      emergency_contact: { name: "Carlos Ruiz", phone: "+57 315 555 0980" }, photo_url: IMG.luna, activity_level: "medium",
      food: { brand: "Royal Canin", product: "Medium Adult", bag_kg: 15, opened_at: day(-17), grams_per_day: 320, meals: [{ time: "08:00", grams: 120 }, { time: "14:00", grams: 80 }, { time: "20:00", grams: 120 }], snacks_per_day: 3, changes: [{ date: monthsAgo(2), from: "Royal Canin Pollo", to: "Royal Canin Salmón", reason: "Picor en la piel" }] },
      reproductive: null, created_at: monthsAgo(8), updated_at: day(0),
    },
    {
      id: P.milo, user_id: U.andrea, name: "Milo", species: "gato", breed: "Europeo gris", birth_date: monthsAgo(4), weight: 1.9, emoji: "🐾", color: "#2F6F8F",
      avatar_config: null, sex: "male", neutered: false, microchip: "941000031207", allergies: [], conditions: [], blood_type: "A",
      emergency_contact: { name: "Carlos Ruiz", phone: "+57 315 555 0980" }, photo_url: IMG.milo, activity_level: "high",
      food: { brand: "Hill's", product: "Science Diet Kitten", bag_kg: 3, opened_at: day(-9), grams_per_day: 55, meals: [{ time: "07:30", grams: 15 }, { time: "12:00", grams: 10 }, { time: "17:00", grams: 15 }, { time: "21:30", grams: 15 }], snacks_per_day: 1, changes: [] },
      reproductive: null, created_at: monthsAgo(2), updated_at: day(0),
    },
    {
      id: P.coco, user_id: U.andrea, name: "Coco", species: "perro", breed: "Mestizo", birth_date: yearsAgo(5, 2), weight: 12.1, emoji: "🐾", color: "#8A5A00",
      avatar_config: null, sex: "male", neutered: true, microchip: null, allergies: [], conditions: [], blood_type: null,
      emergency_contact: null, photo_url: IMG.coco, activity_level: "high",
      food: { brand: "Pro Plan", product: "Small Adult", bag_kg: 7.5, opened_at: day(-30), grams_per_day: 180, meals: [{ time: "08:00", grams: 90 }, { time: "19:00", grams: 90 }], snacks_per_day: 2, changes: [] },
      reproductive: null, created_at: monthsAgo(5), updated_at: day(0),
    },
    // mascota de otra usuaria (para la alerta de perdida)
    { id: P.tomas, user_id: U.marcela, name: "Tomás", species: "perro", breed: "Beagle", birth_date: yearsAgo(4), weight: 11, emoji: "🐾", color: "#357050", avatar_config: null, sex: "male", neutered: true, microchip: null, allergies: [], conditions: [], blood_type: null, emergency_contact: null, photo_url: IMG.tomas, activity_level: "medium", food: null, reproductive: null, created_at: monthsAgo(3), updated_at: day(0) },
  ];

  const pet_members: Row[] = [
    { id: "pm-1", pet_id: P.luna, user_id: U.carlos, invited_by: U.andrea, role: "co_owner", service_type: null, business_id: null, status: "active", invited_at: monthsAgo(6), accepted_at: monthsAgo(6), created_at: monthsAgo(6) },
    { id: "pm-2", pet_id: P.luna, user_id: U.marcela, invited_by: U.andrea, role: "service_provider", service_type: "vet", business_id: "biz-1", status: "active", invited_at: monthsAgo(1), accepted_at: monthsAgo(1), created_at: monthsAgo(1) },
  ];
  const pet_member_permissions: Row[] = [
    { id: "pmp-1", pet_member_id: "pm-1", module: "itinerario", permission: "edit" },
    { id: "pmp-2", pet_member_id: "pm-1", module: "gastos", permission: "edit" },
    { id: "pmp-3", pet_member_id: "pm-2", module: "historial_clinico", permission: "edit" },
  ];

  // ── Ciclos de cuidado ────────────────────────────────────────────────────
  type C = [string, string, string, number, number | null, number, string?, string?];
  const cyc = (pet: string, list: C[]) =>
    list.map(([id, kind, name, interval, last, next, product, dose]) => ({
      id, pet_id: pet, user_id: U.andrea, kind, name, interval_days: interval, interval_value: interval % 30 === 0 && interval >= 30 ? interval / 30 : interval % 7 === 0 && interval >= 7 ? interval / 7 : interval, interval_unit: (interval % 30 === 0 && interval >= 30 ? "months" : interval % 7 === 0 && interval >= 7 ? "weeks" : "days") as "days" | "weeks" | "months",
      last_done_at: last === null ? null : day(last), next_due_at: day(next), product: product ?? null, dose: dose ?? null, notes: null,
      source: "catalog", protocol_id: null, active: true, created_at: monthsAgo(6), updated_at: day(0),
    }));
  const care_cycles: Row[] = [
    ...cyc(P.luna, [
      ["cy-l1", "deworm_external", "Antipulgas y garrapatas", 30, -29, 1, "NexGard 25 a 50 kg", "1 tableta"],
      ["cy-l2", "vaccine", "Antirrábica", 365, -354, 11],
      ["cy-l3", "vaccine", "Polivalente (múltiple)", 365, -215, 150],
      ["cy-l4", "vaccine", "Tos de las perreras", 365, -215, 150],
      ["cy-l5", "deworm_internal", "Desparasitación interna", 90, -64, 26, "Drontal Plus", "1 comprimido"],
      ["cy-l6", "bath", "Baño", 21, -17, 4],
      ["cy-l7", "nails", "Uñas", 21, -17, 4],
      ["cy-l8", "ears", "Oídos", 7, -7, 0],
      ["cy-l9", "dental", "Dientes", 1, -1, 0],
      ["cy-l10", "grooming", "Corte de pelo", 56, -37, 19],
      ["cy-l11", "checkup", "Control veterinario", 365, -165, 200],
      ["cy-l12", "weight", "Control de peso", 30, -4, 26],
    ]),
    ...cyc(P.milo, [
      ["cy-m1", "deworm_internal", "Desparasitación interna", 15, -14, 1, "Milbemax gatitos", "½ comprimido"],
      ["cy-m2", "vaccine", "Triple felina", 21, -15, 6],
      ["cy-m3", "deworm_external", "Antipulgas", 30, -22, 8, "Pipeta gatitos"],
      ["cy-m4", "weight", "Control de peso", 7, -4, 3],
      ["cy-m5", "nails", "Uñas", 21, -11, 10],
      ["cy-m6", "dental", "Dientes", 1, -1, 0],
      ["cy-m7", "checkup", "Control veterinario", 90, -67, 23],
      ["cy-m8", "vaccine", "Antirrábica", 365, null, 40],
    ]),
    ...cyc(P.coco, [
      ["cy-c1", "deworm_external", "Antipulgas y garrapatas", 30, -12, 18, "Bravecto"],
      ["cy-c2", "vaccine", "Antirrábica", 365, -100, 265],
      ["cy-c3", "vaccine", "Polivalente (múltiple)", 365, -100, 265],
      ["cy-c4", "deworm_internal", "Desparasitación interna", 90, -80, 10],
      ["cy-c5", "bath", "Baño", 21, -20, 1],
      ["cy-c6", "nails", "Uñas", 21, -20, 1],
      ["cy-c7", "dental", "Dientes", 1, -1, 0],
      ["cy-c8", "checkup", "Control veterinario", 365, -100, 265],
      ["cy-c9", "weight", "Control de peso", 30, -10, 20],
    ]),
  ];

  const care_cycle_logs: Row[] = [
    { id: "cl-1", cycle_id: "cy-l1", pet_id: P.luna, user_id: U.andrea, done_at: day(-29), product: "NexGard 25 a 50 kg", dose: "1 tableta", cost: 68000, business_id: null, booking_id: null, photo_url: null, notes: null, created_at: day(-29) },
    { id: "cl-2", cycle_id: "cy-l6", pet_id: P.luna, user_id: U.andrea, done_at: day(-17), product: null, dose: null, cost: 65000, business_id: "biz-2", booking_id: "bk-2", photo_url: IMG.lunaGallery[1], notes: "Pelos y Patas · Baño y corte de verano", created_at: day(-17) },
    { id: "cl-3", cycle_id: "cy-l7", pet_id: P.luna, user_id: U.andrea, done_at: day(-17), product: null, dose: null, cost: null, business_id: "biz-2", booking_id: "bk-2", photo_url: null, notes: "Pelos y Patas · Uñas", created_at: day(-17) },
    { id: "cl-4", cycle_id: "cy-l3", pet_id: P.luna, user_id: U.andrea, done_at: day(-215), product: "Nobivac DHPPi", dose: null, cost: 55000, business_id: "biz-1", booking_id: null, photo_url: null, notes: "Clínica Huellas · Vacuna polivalente", created_at: day(-215) },
    { id: "cl-5", cycle_id: "cy-l5", pet_id: P.luna, user_id: U.andrea, done_at: day(-64), product: "Drontal Plus", dose: "1 comprimido", cost: 32000, business_id: null, booking_id: null, photo_url: null, notes: null, created_at: day(-64) },
    { id: "cl-6", cycle_id: "cy-m1", pet_id: P.milo, user_id: U.andrea, done_at: day(-14), product: "Milbemax gatitos", dose: "½ comprimido", cost: null, business_id: null, booking_id: null, photo_url: null, notes: null, created_at: day(-14) },
    { id: "cl-7", cycle_id: "cy-m2", pet_id: P.milo, user_id: U.andrea, done_at: day(-15), product: "Triple felina 1.ª dosis", dose: null, cost: 50000, business_id: "biz-14", booking_id: null, photo_url: null, notes: "Gatos y Más · Triple felina", created_at: day(-15) },
    { id: "cl-8", cycle_id: "cy-c5", pet_id: P.coco, user_id: U.andrea, done_at: day(-20), product: null, dose: null, cost: 45000, business_id: "biz-2", booking_id: null, photo_url: null, notes: "Pelos y Patas · Baño", created_at: day(-20) },
  ];

  const weight_logs: Row[] = [
    ...[-150, -120, -90, -60, -30, -4].map((n, i) => ({ id: uid("wl-l", i), pet_id: P.luna, user_id: U.andrea, weight_kg: [27.8, 28.1, 27.9, 28.6, 28.3, 28.4][i], measured_at: day(n), notes: null, created_at: day(n) })),
    ...[-28, -21, -14, -7, -4].map((n, i) => ({ id: uid("wl-m", i), pet_id: P.milo, user_id: U.andrea, weight_kg: [1.2, 1.4, 1.6, 1.75, 1.9][i], measured_at: day(n), notes: null, created_at: day(n) })),
    ...[-90, -45, -10].map((n, i) => ({ id: uid("wl-c", i), pet_id: P.coco, user_id: U.andrea, weight_kg: [12.6, 12.3, 12.1][i], measured_at: day(n), notes: null, created_at: day(n) })),
  ];

  const medications: Row[] = [
    { id: "med-1", pet_id: P.luna, user_id: U.andrea, name: "Apoquel", dose_amount: 16, dose_unit: "mg", frequency_value: 1, frequency_unit: "times_per_day", start_date: day(-15), end_date: day(13), duration_days: 28, vet_name: "Dra. Pérez", reason: "Dermatitis atópica", notes: "Con la cena", active: true, created_at: day(-15), updated_at: day(-15) },
  ];
  const medication_logs: Row[] = Array.from({ length: 16 }, (_, i) => {
    const n = -15 + i;
    const administered = n < 0;
    return { id: uid("ml", i), medication_id: "med-1", pet_id: P.luna, user_id: U.andrea, scheduled_at: at(n, 20), administered_at: administered ? at(n, 20, 12) : null, status: administered ? "administered" : "pending", notes: null, created_at: at(n, 0) };
  });

  const clinical_records: Row[] = [
    { id: "cr-1", pet_id: P.luna, user_id: U.andrea, created_by_role: "vet", visit_date: day(-6), visit_type: "consulta_general", vet_name: "Dra. Pérez", clinic_name: "Clínica Huellas", diagnosis: "Dermatitis atópica, brote leve", treatment: "Apoquel 16 mg 1 al día por 28 días. Baños con shampoo hipoalergénico.", notes: "Control en 4 semanas.", vaccine_id: null, created_at: day(-6), updated_at: day(-6) },
    { id: "cr-2", pet_id: P.luna, user_id: U.andrea, created_by_role: "owner", visit_date: yearsAgo(2, 1), visit_type: "cirugia", vet_name: "Dr. Mendoza", clinic_name: "Clínica Huellas", diagnosis: "Esterilización", treatment: "Ovariohisterectomía sin complicaciones.", notes: null, vaccine_id: null, created_at: yearsAgo(2, 1), updated_at: yearsAgo(2, 1) },
    { id: "cr-3", pet_id: P.milo, user_id: U.andrea, created_by_role: "vet", visit_date: day(-21), visit_type: "control_rutina", vet_name: "Dra. Salazar", clinic_name: "Gatos y Más", diagnosis: "Gatito sano", treatment: "Plan de vacunación y desparasitación.", notes: "Peso 1,4 kg.", vaccine_id: null, created_at: day(-21), updated_at: day(-21) },
    { id: "cr-4", pet_id: P.coco, user_id: U.andrea, created_by_role: "owner", visit_date: day(-100), visit_type: "control_rutina", vet_name: "Dr. Pata", clinic_name: "Dr. Pata Veterinaria", diagnosis: "Chequeo anual sin hallazgos", treatment: "Vacunas al día.", notes: null, vaccine_id: null, created_at: day(-100), updated_at: day(-100) },
  ];
  const clinical_documents: Row[] = [
    { id: "cd-1", clinical_record_id: "cr-1", file_name: "resultado-alergias.pdf", file_url: "#", file_type: "application/pdf", storage_path: "demo/resultado-alergias.pdf", file_size_bytes: 182000, created_at: day(-6) },
    { id: "cd-2", clinical_record_id: "cr-1", file_name: "foto-brote.jpg", file_url: IMG.lunaGallery[2], file_type: "image/jpeg", storage_path: "demo/foto-brote.jpg", file_size_bytes: 420000, created_at: day(-6) },
  ];

  const expenses: Row[] = [
    { id: "ex-1", pet_id: P.luna, user_id: U.andrea, monto: 189000, fecha: day(-17), categoria: "Comida", descripcion: "Royal Canin 15 kg", quien_pago: "Yo", created_at: day(-17) },
    { id: "ex-2", pet_id: P.luna, user_id: U.andrea, monto: 65000, fecha: day(-17), categoria: "Baño", descripcion: "Pelos y Patas · Baño y corte", quien_pago: "Carlos", created_at: day(-17) },
    { id: "ex-3", pet_id: P.luna, user_id: U.andrea, monto: 80000, fecha: day(-6), categoria: "Veterinario", descripcion: "Clínica Huellas · Consulta", quien_pago: "Yo", created_at: day(-6) },
    { id: "ex-4", pet_id: P.luna, user_id: U.andrea, monto: 142000, fecha: day(-6), categoria: "Salud", descripcion: "Apoquel 16 mg x 28", quien_pago: "Yo", created_at: day(-6) },
    { id: "ex-5", pet_id: P.luna, user_id: U.andrea, monto: 68000, fecha: day(-29), categoria: "Salud", descripcion: "NexGard", quien_pago: "Yo", created_at: day(-29) },
    { id: "ex-6", pet_id: P.luna, user_id: U.andrea, monto: 24000, fecha: day(-40), categoria: "Juguetes", descripcion: "Pelota Kong", quien_pago: "Carlos", created_at: day(-40) },
    { id: "ex-7", pet_id: P.luna, user_id: U.andrea, monto: 189000, fecha: day(-62), categoria: "Comida", descripcion: "Royal Canin 15 kg", quien_pago: "Yo", created_at: day(-62) },
    { id: "ex-8", pet_id: P.milo, user_id: U.andrea, monto: 70000, fecha: day(-21), categoria: "Veterinario", descripcion: "Gatos y Más · Control", quien_pago: "Yo", created_at: day(-21) },
    { id: "ex-9", pet_id: P.milo, user_id: U.andrea, monto: 52000, fecha: day(-9), categoria: "Comida", descripcion: "Hill's Kitten 3 kg", quien_pago: "Yo", created_at: day(-9) },
    { id: "ex-10", pet_id: P.coco, user_id: U.andrea, monto: 45000, fecha: day(-20), categoria: "Baño", descripcion: "Pelos y Patas · Baño", quien_pago: "Yo", created_at: day(-20) },
  ];

  const itinerary: Row[] = [
    { id: "it-1", pet_id: P.luna, user_id: U.andrea, tipo: "comida", nombre: "Desayuno", hora: "08:00", dias: [0, 1, 2, 3, 4, 5, 6], cantidad: "120 g", notas: null, created_at: monthsAgo(6), updated_at: monthsAgo(6) },
    { id: "it-2", pet_id: P.luna, user_id: U.andrea, tipo: "salida", nombre: "Paseo largo", hora: "18:00", dias: [0, 1, 2, 3, 4, 5, 6], cantidad: "40 min", notas: "Parque El Virrey", created_at: monthsAgo(6), updated_at: monthsAgo(6) },
    { id: "it-3", pet_id: P.luna, user_id: U.andrea, tipo: "comida", nombre: "Cena", hora: "20:00", dias: [0, 1, 2, 3, 4, 5, 6], cantidad: "120 g", notas: "Con Apoquel", created_at: monthsAgo(6), updated_at: monthsAgo(6) },
    { id: "it-4", pet_id: P.coco, user_id: U.andrea, tipo: "salida", nombre: "Paseo", hora: "07:00", dias: [1, 2, 3, 4, 5], cantidad: "30 min", notas: null, created_at: monthsAgo(4), updated_at: monthsAgo(4) },
  ];
  const itinerary_records: Row[] = [
    { id: "ir-1", pet_id: P.luna, item_id: "it-1", fecha: day(0), completado: true, completado_por: U.andrea, created_at: at(0, 8, 5) },
    { id: "ir-2", pet_id: P.luna, item_id: "it-1", fecha: day(-1), completado: true, completado_por: U.andrea, created_at: at(-1, 8, 2) },
    { id: "ir-3", pet_id: P.luna, item_id: "it-2", fecha: day(-1), completado: true, completado_por: U.carlos, created_at: at(-1, 18, 40) },
    { id: "ir-4", pet_id: P.luna, item_id: "it-3", fecha: day(-1), completado: true, completado_por: U.andrea, created_at: at(-1, 20, 10) },
  ];

  const training_sessions: Row[] = [
    { id: "ts-1", pet_id: P.luna, user_id: U.andrea, tipo_ejercicio: "comportamental", modalidad: "clase", fecha: day(-9), entrenador: "Julián R.", temas: "Quedarse quieta con distracciones", ejercicios: "Sit-stay con distancia, 3 series de 5", avances: "Aguanta 20 segundos a 5 metros", notas: null, created_at: day(-9), updated_at: day(-9) },
    { id: "ts-2", pet_id: P.luna, user_id: U.andrea, tipo_ejercicio: "fisico", modalidad: "practica", fecha: day(-2), entrenador: null, temas: "Trote suave", ejercicios: "20 min de trote en el parque", avances: "Sin jadeo excesivo", notas: null, created_at: day(-2), updated_at: day(-2) },
  ];
  const training_tasks: Row[] = [
    { id: "tt-1", session_id: "ts-1", descripcion: "Practicar stay 2 veces al día", estado: "en_progreso" },
    { id: "tt-2", session_id: "ts-1", descripcion: "Subir a 30 segundos", estado: "pendiente" },
    { id: "tt-3", session_id: "ts-2", descripcion: "Repetir el miércoles", estado: "completado" },
  ];

  const notifications: Row[] = [
    { id: "nt-1", user_id: U.andrea, pet_id: P.luna, tipo: "alerta", titulo: "Antipulgas de Luna mañana", mensaje: "NexGard toca mañana. Márcalo como hecho o reserva en un negocio cercano.", leida: false, scheduled_at: null, created_at: at(0, 6) },
    { id: "nt-2", user_id: U.andrea, pet_id: P.luna, tipo: "nota", titulo: "Reserva confirmada", mensaje: "Pelos y Patas confirmó baño y uñas para el sábado 10:30.", leida: false, scheduled_at: null, created_at: at(-1, 15) },
    { id: "nt-3", user_id: U.andrea, pet_id: P.milo, tipo: "logro", titulo: "Milo ganó 700 g este mes", mensaje: "Crece según lo esperado para su edad.", leida: true, scheduled_at: null, created_at: at(-4, 9) },
  ];

  // ── Negocios ─────────────────────────────────────────────────────────────
  const H = (slots: Record<string, [string, string][]>) => slots;
  const std = H({ mon: [["08:00", "20:00"]], tue: [["08:00", "20:00"]], wed: [["08:00", "20:00"]], thu: [["08:00", "20:00"]], fri: [["08:00", "20:00"]], sat: [["08:00", "18:00"]], sun: [["09:00", "14:00"]] });
  const shop = H({ mon: [["09:00", "19:00"]], tue: [["09:00", "19:00"]], wed: [["09:00", "19:00"]], thu: [["09:00", "19:00"]], fri: [["09:00", "19:00"]], sat: [["08:00", "17:00"]] });
  const long = H({ mon: [["08:00", "21:00"]], tue: [["08:00", "21:00"]], wed: [["08:00", "21:00"]], thu: [["08:00", "21:00"]], fri: [["08:00", "21:00"]], sat: [["08:00", "21:00"]], sun: [["10:00", "18:00"]] });
  const biz = (
    id: string, name: string, type: string, categories: string[], description: string, address: string, neighborhood: string, lat: number, lng: number,
    hours: Record<string, [string, string][]> | null, emergency: boolean, priceFrom: number | null, verified: boolean, writes: boolean, promo: string | null, cover: string, rating: number, count: number, whatsapp = "573105550101", owner: string | null = null,
  ): Row => ({
    id, owner_user_id: owner, name, type, categories, description, phone: "+57 601 555 0101", email: null, whatsapp, address, neighborhood, city: "Bogotá", lat, lng,
    hours, emergency_24h: emergency, price_level: 2, price_from: priceFrom, claimed: !!owner, verified, rating_avg: rating, rating_count: count,
    logo_url: null, cover_url: cover, photos: [cover, IMG.biz(900 + Number(id.split("-")[1]), "dog"), IMG.biz(950 + Number(id.split("-")[1]), "pet")], writes_history: writes, promo_text: promo, active: true, qr_code: `qr-${id}`, created_at: monthsAgo(10), updated_at: day(0),
  });
  const businesses: Row[] = [
    biz("biz-1", "Clínica Huellas", "veterinaria", ["veterinaria", "urgencias"], "Clínica veterinaria con urgencias 24 horas, laboratorio y cirugía.", "Cra. 15 n.º 93-40", "Chapinero Alto", 4.6765, -74.0485, std, true, 80000, true, true, null, IMG.biz(201, "veterinarian,dog"), 4.8, 212),
    biz("biz-2", "Pelos y Patas", "peluqueria", ["peluqueria"], "Baño, corte y spa para perros y gatos. Secado sin jaula.", "Cra. 11 n.º 86-30", "Chapinero Alto", 4.6702, -74.0548, shop, false, 45000, true, true, "-20 % primer baño", IMG.biz(202, "dog,grooming"), 4.6, 98, "573105550102"),
    biz("biz-3", "Animalia Tienda", "tienda", ["tienda", "farmacia"], "Alimento, farmacia veterinaria y accesorios con entrega el mismo día.", "Cl. 85 n.º 12-15", "Chapinero Alto", 4.6688, -74.0531, long, false, 12000, false, false, "Entrega hoy", IMG.biz(203, "pet,shop"), 4.5, 64, "573105550103"),
    biz("biz-4", "Dr. Pata Veterinaria", "veterinaria", ["veterinaria"], "Consulta general, vacunación y odontología.", "Cra. 7 n.º 70-20", "Chapinero", 4.656, -74.058, H({ mon: [["08:00", "18:00"]], tue: [["08:00", "18:00"]], wed: [["08:00", "18:00"]], thu: [["08:00", "18:00"]], fri: [["08:00", "18:00"]], sat: [["09:00", "13:00"]] }), false, 60000, true, true, null, IMG.biz(204, "veterinary,cat"), 4.7, 143),
    biz("biz-5", "Guardería Parque Canino", "guarderia", ["guarderia", "paseador"], "Guardería de día con patio y paseos grupales.", "Cl. 72 n.º 9-55", "Chapinero", 4.6598, -74.0601, H({ mon: [["07:00", "19:00"]], tue: [["07:00", "19:00"]], wed: [["07:00", "19:00"]], thu: [["07:00", "19:00"]], fri: [["07:00", "19:00"]] }), false, 40000, false, false, null, IMG.biz(205, "dogs,playing"), 4.4, 51),
    biz("biz-6", "Julián Entrena", "entrenador", ["entrenador"], "Obediencia básica, socialización y modificación de conducta.", "Parque de los Hippies", "Chapinero", 4.6538, -74.0617, H({ mon: [["07:00", "12:00"], ["15:00", "19:00"]], wed: [["07:00", "12:00"], ["15:00", "19:00"]], sat: [["07:00", "12:00"]] }), false, 70000, true, false, null, IMG.biz(206, "dog,training"), 4.9, 37),
    biz("biz-7", "Paseos Felices", "paseador", ["paseador"], "Paseos individuales y grupales con reporte por WhatsApp.", "Cl. 90 n.º 14-20", "Chicó", 4.673, -74.052, H({ mon: [["06:00", "18:00"]], tue: [["06:00", "18:00"]], wed: [["06:00", "18:00"]], thu: [["06:00", "18:00"]], fri: [["06:00", "18:00"]], sat: [["07:00", "12:00"]] }), false, 25000, false, false, null, IMG.biz(207, "dog,walk"), 4.3, 29),
    biz("biz-8", "Café Bigotes", "pet_friendly", ["pet_friendly"], "Café con terraza, agua para perros y menú para mascotas.", "Cra. 4a n.º 57-30", "Chapinero", 4.644, -74.062, H({ mon: [["08:00", "20:00"]], tue: [["08:00", "20:00"]], wed: [["08:00", "20:00"]], thu: [["08:00", "20:00"]], fri: [["08:00", "22:00"]], sat: [["09:00", "22:00"]], sun: [["09:00", "18:00"]] }), false, null, false, false, null, IMG.biz(208, "cafe,dog"), 4.6, 88),
    biz("biz-9", "Veterinaria Usaquén 24h", "urgencias", ["urgencias", "veterinaria"], "Urgencias y hospitalización las 24 horas.", "Cra. 6 n.º 117-20", "Usaquén", 4.695, -74.031, null, true, 120000, true, true, null, IMG.biz(209, "veterinary,hospital"), 4.5, 170),
    biz("biz-10", "Spa Canino Cedritos", "peluqueria", ["peluqueria"], "Peluquería canina y felina con recogida a domicilio.", "Cl. 140 n.º 11-45", "Cedritos", 4.723, -74.04, shop, false, 50000, false, true, null, IMG.biz(210, "dog,bath"), 4.4, 42),
    biz("biz-11", "MascoMarket Chicó", "tienda", ["tienda"], "Alimento premium, juguetes y camas. Programa de recompra.", "Cl. 93 n.º 13-10", "Chicó", 4.676, -74.0505, long, false, 15000, false, false, null, IMG.biz(211, "pet,store"), 4.2, 33),
    biz("biz-12", "Farmacia Vet Express", "farmacia", ["farmacia", "tienda"], "Medicamentos veterinarios con receta y antiparasitarios.", "Cra. 13 n.º 79-35", "Chapinero", 4.665, -74.057, std, false, 20000, true, false, null, IMG.biz(212, "pharmacy"), 4.6, 58),
    biz("biz-13", "Adiós con Amor", "funeraria", ["funeraria"], "Cremación individual y acompañamiento.", "Av. Cl. 100 n.º 19-50", "Chicó", 4.683, -74.049, null, true, 250000, true, false, null, IMG.biz(213, "candle,flowers"), 4.9, 21),
    biz("biz-14", "Gatos y Más", "veterinaria", ["veterinaria", "peluqueria"], "Clínica exclusiva para gatos. Ambiente sin perros.", "Cl. 65 n.º 5-40", "Chapinero", 4.649, -74.06, shop, false, 70000, true, true, null, IMG.biz(214, "cat,clinic"), 4.8, 76),
    biz("biz-15", "Hotel Canino El Virrey", "guarderia", ["guarderia"], "Hospedaje por noche con cámaras y paseos diarios.", "Cl. 88 n.º 15-60", "Chicó", 4.671, -74.05, long, false, 60000, true, false, null, IMG.biz(215, "dog,hotel"), 4.5, 47),
  ];

  type S = [string, string, string, string, number, number, string | null, string | null];
  const svcs: S[] = [
    ["bs-1", "biz-1", "Consulta general", "30 min · crea registro de consulta", 80000, 30, "checkup", "Control veterinario"],
    ["bs-2", "biz-1", "Vacuna antirrábica", "15 min · completa el ciclo Rabia", 45000, 15, "vaccine", "Antirrábica"],
    ["bs-3", "biz-1", "Vacuna polivalente", "15 min", 55000, 15, "vaccine", "Polivalente (múltiple)"],
    ["bs-4", "biz-1", "Desparasitación", "15 min", 30000, 15, "deworm_internal", "Desparasitación interna"],
    ["bs-5", "biz-1", "Urgencia 24 h", "Sin cita · triage en 10 min", 150000, 60, null, null],
    ["bs-6", "biz-2", "Baño + uñas", "75 min · completa 2 ciclos de higiene", 70000, 75, "bath", "Baño"],
    ["bs-7", "biz-2", "Baño", "45 min · secado y perfume", 45000, 45, "bath", "Baño"],
    ["bs-8", "biz-2", "Corte completo", "90 min · incluye baño", 95000, 90, "grooming", "Corte de pelo"],
    ["bs-9", "biz-2", "Uñas", "15 min", 20000, 15, "nails", "Uñas"],
    ["bs-10", "biz-4", "Consulta general", "30 min", 60000, 30, "checkup", "Control veterinario"],
    ["bs-11", "biz-4", "Vacuna antirrábica", "15 min", 40000, 15, "vaccine", "Antirrábica"],
    ["bs-12", "biz-4", "Limpieza dental", "60 min · con sedación", 220000, 60, "dental", "Dientes"],
    ["bs-13", "biz-5", "Día de guardería", "8 h con paseo", 40000, 480, null, null],
    ["bs-14", "biz-6", "Clase individual", "60 min a domicilio", 70000, 60, null, null],
    ["bs-15", "biz-6", "Clase grupal en parque", "60 min · máx. 6 perros", 35000, 60, null, null],
    ["bs-16", "biz-7", "Paseo individual", "45 min", 25000, 45, null, null],
    ["bs-17", "biz-9", "Urgencia", "Triage inmediato", 120000, 60, null, null],
    ["bs-18", "biz-10", "Baño", "45 min", 50000, 45, "bath", "Baño"],
    ["bs-19", "biz-10", "Corte", "90 min", 100000, 90, "grooming", "Corte de pelo"],
    ["bs-20", "biz-14", "Consulta felina", "30 min", 70000, 30, "checkup", "Control veterinario"],
    ["bs-21", "biz-14", "Triple felina", "15 min", 50000, 15, "vaccine", "Triple felina"],
    ["bs-22", "biz-15", "Noche de hospedaje", "Incluye 2 paseos", 60000, 1440, null, null],
  ];
  const business_services: Row[] = svcs.map(([id, business_id, name, description, price, duration_min, kind, cname], i) => ({ id, business_id, name, description, price, duration_min, care_cycle_kind: kind, care_cycle_name: cname, active: true, sort: i, created_at: monthsAgo(10) }));

  const reviews: Row[] = [
    { id: "rv-1", business_id: "biz-1", user_id: U.marcela, pet_id: P.tomas, rating: 5, body: "Llegamos a las 2 a. m. con una torsión y lo operaron en el momento. La vacuna quedó en la app sola.", reply: "Gracias Marcela, nos alegra que Tomás esté bien.", replied_at: day(-2), created_at: day(-3) },
    { id: "rv-2", business_id: "biz-1", user_id: U.carlos, pet_id: P.luna, rating: 5, body: "Dra. Pérez explica todo con calma. Precios claros antes de empezar.", reply: null, replied_at: null, created_at: day(-40) },
    { id: "rv-3", business_id: "biz-2", user_id: U.marcela, pet_id: P.tomas, rating: 5, body: "Trataron a Tomás con paciencia aunque no le gusta el secador. El baño quedó registrado en la app al salir.", reply: null, replied_at: null, created_at: day(-3) },
    { id: "rv-4", business_id: "biz-2", user_id: U.carlos, pet_id: P.luna, rating: 4, body: "Buen corte, un poco de espera un sábado.", reply: "Los sábados estamos a tope, mejor reservar con un día.", replied_at: day(-10), created_at: day(-12) },
    { id: "rv-5", business_id: "biz-14", user_id: U.andrea, pet_id: P.milo, rating: 5, body: "Sin perros en la sala. Milo entró tranquilo.", reply: null, replied_at: null, created_at: day(-20) },
  ];

  // próximo sábado 10:30
  const sat = (() => {
    const d = new Date();
    const diff = (6 - d.getDay() + 7) % 7 || 7;
    return diff;
  })();
  const bookings: Row[] = [
    { id: "bk-1", business_id: "biz-2", service_id: "bs-6", pet_id: P.luna, user_id: U.andrea, starts_at: at(sat, 10, 30), ends_at: at(sat, 11, 45), status: "confirmed", price: 70000, notes: null, business_notes: null, completed_at: null, created_at: at(-1, 14), updated_at: at(-1, 15) },
    { id: "bk-2", business_id: "biz-2", service_id: "bs-8", pet_id: P.luna, user_id: U.andrea, starts_at: at(-17, 10), ends_at: at(-17, 11, 30), status: "completed", price: 65000, notes: null, business_notes: "Corte de verano", completed_at: at(-17, 11, 35), created_at: at(-20, 9), updated_at: at(-17, 11, 35) },
    { id: "bk-3", business_id: "biz-1", service_id: "bs-1", pet_id: P.luna, user_id: U.andrea, starts_at: at(-6, 16), ends_at: at(-6, 16, 30), status: "completed", price: 80000, notes: "Picor en patas", business_notes: null, completed_at: at(-6, 16, 40), created_at: at(-8, 12), updated_at: at(-6, 16, 40) },
    { id: "bk-4", business_id: "biz-1", service_id: "bs-2", pet_id: P.luna, user_id: U.andrea, starts_at: at(11, 9), ends_at: at(11, 9, 15), status: "requested", price: 45000, notes: null, business_notes: null, completed_at: null, created_at: at(0, 8), updated_at: at(0, 8) },
  ];

  const events: Row[] = [
    { id: "ev-1", business_id: null, created_by: U.marcela, organizer_name: "Fundación Patitas", title: "Jornada de adopción · Parque El Virrey", description: "32 perros y 15 gatos buscan familia. Trae tu cédula y, si vienes con tu mascota, su carnet de vacunas.", category: "adopcion", starts_at: at(sat, 9), ends_at: at(sat, 14), address: "Parque El Virrey, Cl. 88 con Cra. 15", city: "Bogotá", lat: 4.6738, lng: -74.0528, price: 0, capacity: null, cover_url: IMG.event(301, "dog,adoption"), species: ["perro", "gato"], active: true, created_at: day(-20) },
    { id: "ev-2", business_id: null, created_by: U.carlos, organizer_name: "Club Trote Canino", title: "Canicross 5K · Parque Simón Bolívar", description: "Carrera con tu perro. Inscripción hasta el viernes. Vacunas al día obligatorias.", category: "carrera", starts_at: at(sat + 1, 7), ends_at: at(sat + 1, 10), address: "Parque Simón Bolívar, entrada Cl. 63", city: "Bogotá", lat: 4.658, lng: -74.094, price: 35000, capacity: 200, cover_url: IMG.event(302, "dog,running"), species: ["perro"], active: true, created_at: day(-30) },
    { id: "ev-3", business_id: "biz-6", created_by: null, organizer_name: "Julián Entrena", title: "Clase grupal de obediencia básica", description: "6 cupos. Perros de todas las edades. Trae premios pequeños.", category: "clase", starts_at: at(sat + 4, 18, 30), ends_at: at(sat + 4, 19, 30), address: "Parque de los Hippies", city: "Bogotá", lat: 4.6538, lng: -74.0617, price: 35000, capacity: 6, cover_url: IMG.event(303, "dog,training"), species: ["perro"], active: true, created_at: day(-10) },
    { id: "ev-4", business_id: null, created_by: U.marcela, organizer_name: "Feria Pet Friendly Usaquén", title: "Feria Pet Friendly · Usaquén", description: "40 marcas y vacunación gratuita con Clínica Huellas.", category: "feria", starts_at: at(sat + 7, 10), ends_at: at(sat + 7, 18), address: "Plaza de Usaquén", city: "Bogotá", lat: 4.6955, lng: -74.0313, price: 0, capacity: null, cover_url: IMG.event(304, "pet,fair"), species: ["perro", "gato"], active: true, created_at: day(-15) },
  ];
  const event_rsvps: Row[] = [
    { event_id: "ev-1", user_id: U.carlos, pet_id: P.luna, status: "going", created_at: day(-2) },
    { event_id: "ev-1", user_id: U.marcela, pet_id: P.tomas, status: "going", created_at: day(-5) },
    ...Array.from({ length: 84 }, (_, i) => ({ event_id: "ev-1", user_id: `demo-guest-${i}`, pet_id: null, status: "going", created_at: day(-1) })),
    ...Array.from({ length: 23 }, (_, i) => ({ event_id: "ev-2", user_id: `demo-runner-${i}`, pet_id: null, status: "going", created_at: day(-1) })),
    ...Array.from({ length: 4 }, (_, i) => ({ event_id: "ev-3", user_id: `demo-class-${i}`, pet_id: null, status: "going", created_at: day(-1) })),
  ];

  const lost_pet_alerts: Row[] = [
    { id: "la-1", pet_id: P.tomas, user_id: U.marcela, status: "active", last_seen_at: at(0, 7, 15), lat: 4.6712, lng: -74.0555, location: null, radius_m: 3000, address: "Parque El Virrey, cerca de la Cl. 88", message: "Se soltó del arnés en el parque. Lleva collar azul con placa. Es muy sociable.", contact_phone: "+57 312 555 0442", photo_url: IMG.tomas, reward: 200000, resolved_at: null, created_at: at(0, 7, 30) },
  ];

  const share_tokens: Row[] = [
    { id: "st-1", token: "demo-luna", user_id: U.andrea, pet_id: P.luna, expires_at: "2099-12-31T00:00:00.000Z", scope: "emergency", created_at: monthsAgo(1) },
  ];

  const assistant_messages: Row[] = [
    { id: "am-1", user_id: U.andrea, pet_id: P.luna, role: "user", content: "¿Le puedo dar un poco de pollo asado a Luna?", actions: null, created_at: at(-1, 19, 40) },
    { id: "am-2", user_id: U.andrea, pet_id: P.luna, role: "assistant", content: "**Mejor no.** Luna tiene alergia al pollo registrada hace dos meses, cuando cambiaste su dieta a salmón. Si quieres un premio, zanahoria o un trozo de salmón cocido sin sal van bien.", actions: [{ type: "book", category: "tienda", label: "Comprar snacks cerca" }], created_at: at(-1, 19, 40) },
  ];

  const pet_photos: Row[] = IMG.lunaGallery.map((url, i) => ({ id: uid("ph", i), pet_id: P.luna, user_id: U.andrea, storage_path: `demo/luna-${i}.jpg`, photo_url: url, photo_migration_failed: false, original_filename: `luna-${i}.jpg`, created_at: day(-60 + i * 15) }));
  pet_photos.push({ id: "ph-m1", pet_id: P.milo, user_id: U.andrea, storage_path: "demo/milo-0.jpg", photo_url: IMG.milo, photo_migration_failed: false, original_filename: "milo.jpg", created_at: day(-20) });
  pet_photos.push({ id: "ph-c1", pet_id: P.coco, user_id: U.andrea, storage_path: "demo/coco-0.jpg", photo_url: IMG.coco, photo_migration_failed: false, original_filename: "coco.jpg", created_at: day(-40) });

  const marketplace_plans: Row[] = [
    { id: "plan-free", name: "free", price_monthly: 0, max_listings: 1, max_images: 3, commission_rate: 0.08, has_analytics: false, has_featured: false, has_verified_badge: false, created_at: monthsAgo(12) },
    { id: "plan-pro", name: "pro", price_monthly: 119000, max_listings: null, max_images: 10, commission_rate: 0.03, has_analytics: true, has_featured: false, has_verified_badge: true, created_at: monthsAgo(12) },
    { id: "plan-business", name: "business", price_monthly: 299000, max_listings: null, max_images: null, commission_rate: 0, has_analytics: true, has_featured: true, has_verified_badge: true, created_at: monthsAgo(12) },
  ];

  return {
    users, pets, pet_members, pet_member_permissions, care_cycles, care_cycle_logs, care_protocols: [], weight_logs,
    medications, medication_logs, clinical_records, clinical_documents, expenses, itinerary, itinerary_records,
    training_sessions, training_tasks, notifications, notification_preferences: [], push_subscriptions: [], notification_queue: [],
    businesses, business_services, reviews, bookings, events, event_rsvps, saved_businesses: [{ user_id: U.andrea, business_id: "biz-1", created_at: day(-30) }],
    lost_pet_alerts, lost_pet_sightings: [], user_locations: [], share_tokens, assistant_messages, pet_photos, pet_videos: [],
    user_storage_usage: [{ user_id: U.andrea, bytes_used: 48_000_000, quota_bytes: 500_000_000 }],
    marketplace_plans, business_subscriptions: [], marketplace_listings: [], listing_analytics: [], calendar_integrations: [], storage_cleanup_queue: [], vaccines: [],
  };
}
