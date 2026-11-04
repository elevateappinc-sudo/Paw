/**
 * Edad legible de una mascota: "1 año y 8 meses", "4 meses", "3 años",
 * "2 semanas", "recién nacido". Nunca abrevia ("20 mes…").
 *
 * `birthDate` es una fecha ISO (YYYY-MM-DD o con hora). `now` es inyectable
 * para pruebas.
 */
export function formatPetAge(birthDate: string | null | undefined, now: Date = new Date()): string | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const birth = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (birth.getTime() > today.getTime()) return null;

  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months--;

  if (months < 1) {
    const days = Math.round((today.getTime() - birth.getTime()) / 86400000);
    const weeks = Math.floor(days / 7);
    if (weeks < 1) return "recién nacido";
    return `${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  }

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const monthsText = `${rest} ${rest === 1 ? "mes" : "meses"}`;
  if (years === 0) return monthsText;
  const yearsText = `${years} ${years === 1 ? "año" : "años"}`;
  return rest === 0 ? yearsText : `${yearsText} y ${monthsText}`;
}
