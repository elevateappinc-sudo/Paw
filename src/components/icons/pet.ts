import { createLucideIcon, type IconNode } from "lucide-react";

/**
 * Íconos propios de mascotas, con la misma grilla (24 × 24), trazo y API
 * que lucide-react, para que todo lo que representa un cuidado o un
 * servicio se lea como "de mascota" y no como algo humano (oreja, mano,
 * sonrisa, zapatos…). Se usan igual que un ícono de Lucide:
 * <PetEar size={20} aria-hidden="true" />.
 */

/** Huellita pequeña centrada en (cx, cy); `s` = escala (1 ≈ 5 px de ancho) */
function paw(cx: number, cy: number, s = 1, key = "paw"): IconNode {
  const f = { fill: "currentColor", stroke: "none" };
  return [
    ["ellipse", { cx: String(cx), cy: String(cy + 0.9 * s), rx: String(1.5 * s), ry: String(1.2 * s), ...f, key: `${key}-pad` }],
    ["circle", { cx: String(cx - 1.6 * s), cy: String(cy - 0.6 * s), r: String(0.65 * s), ...f, key: `${key}-t1` }],
    ["circle", { cx: String(cx), cy: String(cy - 1.3 * s), r: String(0.7 * s), ...f, key: `${key}-t2` }],
    ["circle", { cx: String(cx + 1.6 * s), cy: String(cy - 0.6 * s), r: String(0.65 * s), ...f, key: `${key}-t3` }],
  ];
}

/** Oídos: cara de perro con orejas caídas */
export const PetEar = createLucideIcon("PetEar", [
  ["path", { d: "M7 9c0-2.8 2.2-5 5-5s5 2.2 5 5v5a5 5 0 0 1-10 0Z", key: "face" }],
  ["path", { d: "M7 9C5 7.5 3 8.6 3 11.2 3 13.8 4.3 16 6 16c.6 0 1-.4 1-1", key: "ear-l" }],
  ["path", { d: "M17 9c2-1.5 4-.4 4 2.2 0 2.6-1.3 4.8-3 4.8-.6 0-1-.4-1-1", key: "ear-r" }],
  ["path", { d: "M10 10.5h.01M14 10.5h.01", key: "eyes" }],
  ["path", { d: "M11 14.5h2l-1 1Z", key: "nose" }],
]);

/** Uñas: pata con garras */
export const PetNails = createLucideIcon("PetNails", [
  ["path", { d: "M12 12.5c-2.5 0-4.5 2.4-4.5 4.4 0 1.4 1 2.1 2.2 2.1 1 0 1.5-.5 2.3-.5s1.3.5 2.3.5c1.2 0 2.2-.7 2.2-2.1 0-2-2-4.4-4.5-4.4Z", key: "pad" }],
  ["circle", { cx: "5.5", cy: "11.5", r: "1.6", key: "t1" }],
  ["circle", { cx: "9.3", cy: "7.8", r: "1.6", key: "t2" }],
  ["circle", { cx: "14.7", cy: "7.8", r: "1.6", key: "t3" }],
  ["circle", { cx: "18.5", cy: "11.5", r: "1.6", key: "t4" }],
  ["path", { d: "M4.6 8.6 4 7M8.9 4.6 8.6 3M15.1 4.6l.3-1.6M19.4 8.6 20 7", key: "claws" }],
]);

/** Dientes: hueso para morder */
export const PetDental = createLucideIcon("PetDental", [
  ["path", { d: "M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z", key: "bone" }],
]);

/** Baño: mascota asomada en la tina, con burbujas */
export const PetBath = createLucideIcon("PetBath", [
  ["path", { d: "M3 13h18v1a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z", key: "tub" }],
  ["path", { d: "m7 19-1 2M17 19l1 2", key: "legs" }],
  ["path", { d: "M9 13v-2.6c0-.8.9-1.2 1.5-.7L12 11l1.5-1.3c.6-.5 1.5-.1 1.5.7V13", key: "ears" }],
  ["circle", { cx: "5.5", cy: "8", r: "1.5", key: "b1" }],
  ["circle", { cx: "18.5", cy: "7.5", r: "1.5", key: "b2" }],
  ["circle", { cx: "16", cy: "3.5", r: "1", key: "b3" }],
]);

/** Peluquería: peine con huellita */
export const PetGrooming = createLucideIcon("PetGrooming", [
  ["path", { d: "M4 12h16v3H4Z", key: "comb" }],
  ["path", { d: "M6 15v5M9 15v5M12 15v5M15 15v5M18 15v5", key: "teeth" }],
  ...paw(12, 6, 1.4, "p"),
]);

/** Antipulgas: escudo con huellita */
export const PetFlea = createLucideIcon("PetFlea", [
  ["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", key: "shield" }],
  ...paw(12, 11.5, 1.3, "p"),
]);

/** Desparasitación interna: cápsula y huellita */
export const PetDeworm = createLucideIcon("PetDeworm", [
  ["path", { d: "M4 8a3 3 0 0 1 3-3h10a3 3 0 0 1 0 6H7a3 3 0 0 1-3-3Z", key: "capsule" }],
  ["path", { d: "M12 5v6", key: "split" }],
  ...paw(12, 17, 1.3, "p"),
]);

/** Vacuna: jeringa con huellita */
export const PetVaccine = createLucideIcon("PetVaccine", [
  ["path", { d: "m18 2 4 4M17 7l3-3M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6", key: "syringe" }],
  ...paw(18.5, 17.5, 0.9, "p"),
]);

/** Salud / veterinaria: corazón con huellita */
export const PetHealth = createLucideIcon("PetHealth", [
  ["path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z", key: "heart" }],
  ...paw(12, 11, 1.3, "p"),
]);

/** Medicamentos: frasco con huellita */
export const PetMedication = createLucideIcon("PetMedication", [
  ["path", { d: "M7 8h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z", key: "bottle" }],
  ["path", { d: "M6 3h12v5H6Z", key: "cap" }],
  ...paw(12, 14, 1.2, "p"),
]);

/** Peso: báscula con huellita */
export const PetWeight = createLucideIcon("PetWeight", [
  ["rect", { x: "3", y: "4", width: "18", height: "16", rx: "3", key: "body" }],
  ["path", { d: "M8.5 9.5a3.5 3.5 0 0 1 7 0", key: "dial" }],
  ["path", { d: "m12 9.5 1.3-1.8", key: "needle" }],
  ...paw(12, 15, 1.2, "p"),
]);

/** Comida: plato con croquetas */
export const PetFood = createLucideIcon("PetFood", [
  ["path", { d: "M3 13h18l-1.4 5.2a2 2 0 0 1-1.9 1.3H6.3a2 2 0 0 1-1.9-1.3Z", key: "bowl" }],
  ["circle", { cx: "8", cy: "10", r: "1.3", key: "k1" }],
  ["circle", { cx: "12", cy: "8.5", r: "1.3", key: "k2" }],
  ["circle", { cx: "16", cy: "10", r: "1.3", key: "k3" }],
  ["circle", { cx: "10", cy: "5.5", r: "1.1", key: "k4" }],
]);

/** Paseo / paseador: dos huellas caminando */
export const PetWalk = createLucideIcon("PetWalk", [...paw(7.5, 15.5, 1.6, "a"), ...paw(16.5, 7, 1.6, "b")]);

/** Guardería: casita de perro */
export const PetDaycare = createLucideIcon("PetDaycare", [
  ["path", { d: "M3 11 12 4l9 7", key: "roof" }],
  ["path", { d: "M5 9.5V20h14V9.5", key: "walls" }],
  ["path", { d: "M9.5 20v-3.5a2.5 2.5 0 0 1 5 0V20", key: "door" }],
  ...paw(12, 10, 0.9, "p"),
]);

/** Entrenamiento: huella con estrella (truco aprendido) */
export const PetTraining = createLucideIcon("PetTraining", [
  ["path", { d: "M10 13c-2.5 0-4.5 2.4-4.5 4.4 0 1.4 1 2.1 2.2 2.1 1 0 1.5-.5 2.3-.5s1.3.5 2.3.5c1.2 0 2.2-.7 2.2-2.1 0-2-2-4.4-4.5-4.4Z", key: "pad" }],
  ["circle", { cx: "4", cy: "11.5", r: "1.5", key: "t1" }],
  ["circle", { cx: "7.6", cy: "8.3", r: "1.5", key: "t2" }],
  ["circle", { cx: "12.4", cy: "8.3", r: "1.5", key: "t3" }],
  ["circle", { cx: "16", cy: "11.5", r: "1.5", key: "t4" }],
  ["path", { d: "m18 2 .9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1L15 4.2l2.1-.3Z", key: "star" }],
]);

/** Actividad: pelota de juguete */
export const PetActivity = createLucideIcon("PetActivity", [
  ["circle", { cx: "12", cy: "12", r: "9", key: "ball" }],
  ["path", { d: "M6 5.6c3.2 2.2 3.2 10.6 0 12.8M18 5.6c-3.2 2.2-3.2 10.6 0 12.8", key: "seams" }],
]);

/** Tienda: bolsa con huellita */
export const PetShop = createLucideIcon("PetShop", [
  ["path", { d: "M5.5 8h13l1 12a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1Z", key: "bag" }],
  ["path", { d: "M9 8V6.5a3 3 0 0 1 6 0V8", key: "handle" }],
  ...paw(12, 14, 1.3, "p"),
]);

/** Urgencias: cruz médica con huellita */
export const PetEmergency = createLucideIcon("PetEmergency", [
  ["path", { d: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z", key: "cross" }],
  ...paw(12, 12, 1, "p"),
]);
