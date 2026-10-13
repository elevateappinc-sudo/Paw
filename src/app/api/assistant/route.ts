import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { ageLabel, SPECIES_LABEL, SEX_LABEL } from "@/lib/api/pets";
import { CARE_KIND_LABEL, BUSINESS_CATEGORY_LABEL, type AssistantAction, type BusinessCategory, type CareCycle, type CareCycleKind, type PetRow } from "@/types/db";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-5-5";
const MAX_TOKENS = 800;
const HISTORY_LIMIT = 12;

interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  pet_id?: string;
  message?: string;
  history?: HistoryItem[];
}

interface Medication {
  name: string;
  dose_amount: number | null;
  dose_unit: string | null;
  frequency_value: number | null;
  frequency_unit: string | null;
  reason: string | null;
}
interface ClinicalRecord {
  visit_date: string;
  visit_type: string;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  clinic_name: string | null;
}
interface WeightLog {
  weight_kg: number;
  measured_at: string;
}

const NOT_CONFIGURED = "El asistente aún no está configurado. Pídele al equipo de Paw que active la clave de Anthropic.";

const SYSTEM_BASE = `Eres el asistente de cuidado de mascotas de Paw, una app colombiana para dueños de mascotas. Hablas en español neutro, de tú, cercano y claro, sin tecnicismos.

Reglas:
- Usa el contexto de la mascota (historial, ciclos de cuidado, alergias, medicación, peso) para personalizar cada respuesta y menciona datos concretos cuando ayuden.
- Nunca diagnosticas ni recetas. Puedes orientar, explicar qué suele significar un síntoma y qué observar, pero siempre recomiendas confirmar con el veterinario.
- Ante señales de alarma (dificultad para respirar, sangrado abundante, convulsiones, abdomen hinchado o duro, colapso, intoxicación, no puede orinar) di claramente que es una urgencia y que acuda ya a una veterinaria 24 h; incluye la acción "sos".
- Responde corto: máximo 120 palabras. Usa **negritas** para lo importante y listas con "- " cuando haya varios puntos. Sin encabezados ni tablas.
- No inventes datos que no estén en el contexto. Si falta información, dilo y sugiere registrarla en Paw.

Acciones: al final de la respuesta, en una única línea aparte y solo si aplica, agrega un JSON con acciones sugeridas con este formato exacto:
ACTIONS: [{"type":"remind","cycle_id":"<id de un ciclo del contexto>","label":"Recordar el martes","date":"YYYY-MM-DD"},{"type":"book","category":"tienda","label":"Comprar cerca"},{"type":"log","kind":"other","label":"Anotar en historial","note":"<texto breve>"},{"type":"sos","label":"Urgencia 24 h"}]
- "remind": solo con cycle_id de los ciclos listados en el contexto; "date" es opcional (si no, se usa el próximo martes).
- "book": category una de: ${Object.keys(BUSINESS_CATEGORY_LABEL).join(", ")}.
- "log": kind una de: ${Object.keys(CARE_KIND_LABEL).join(", ")}; incluye "note" con lo que se anota.
- Máximo 3 acciones. Si no hay acciones, no escribas la línea ACTIONS.`;

function buildContext(pet: PetRow, cycles: CareCycle[], meds: Medication[], records: ClinicalRecord[], weights: WeightLog[]): string {
  const lines: string[] = [];
  lines.push(`MASCOTA: ${pet.name} · ${SPECIES_LABEL[pet.species] ?? pet.species}${pet.breed ? ` · ${pet.breed}` : ""} · ${SEX_LABEL[pet.sex] ?? pet.sex}${pet.neutered ? " esterilizado/a" : ""} · ${ageLabel(pet.birth_date)}${pet.weight ? ` · ${pet.weight} kg` : ""} · actividad ${pet.activity_level}`);
  lines.push(`Alergias: ${pet.allergies?.length ? pet.allergies.join(", ") : "ninguna registrada"}. Condiciones: ${pet.conditions?.length ? pet.conditions.join(", ") : "ninguna registrada"}.${pet.blood_type ? ` Grupo sanguíneo ${pet.blood_type}.` : ""}${pet.microchip ? " Tiene microchip." : ""}`);
  if (pet.food && (pet.food.brand || pet.food.product || pet.food.grams_per_day)) {
    lines.push(`Alimento: ${[pet.food.brand, pet.food.product].filter(Boolean).join(" ")}${pet.food.grams_per_day ? ` · ${pet.food.grams_per_day} g/día` : ""}${pet.food.meals?.length ? ` · ${pet.food.meals.length} comidas` : ""}`);
  }
  if (pet.reproductive && (pet.reproductive.pregnant_since || pet.reproductive.last_heat_at)) {
    lines.push(`Reproductivo: ${pet.reproductive.pregnant_since ? `gestante desde ${pet.reproductive.pregnant_since}` : ""}${pet.reproductive.last_heat_at ? ` último celo ${pet.reproductive.last_heat_at}` : ""}`);
  }
  lines.push(`Hoy es ${new Date().toISOString().slice(0, 10)}.`);
  lines.push(`CICLOS DE CUIDADO ACTIVOS (${cycles.length}):`);
  for (const c of cycles) {
    lines.push(`- id=${c.id} · ${CARE_KIND_LABEL[c.kind] ?? c.kind}: ${c.name} · cada ${c.interval_days} días · última ${c.last_done_at ?? "nunca"} · próxima ${c.next_due_at}${c.product ? ` · producto ${c.product}` : ""}`);
  }
  lines.push(`MEDICACIÓN ACTIVA (${meds.length}):`);
  for (const m of meds) {
    lines.push(`- ${m.name} ${m.dose_amount ?? ""} ${m.dose_unit ?? ""} · ${m.frequency_value ?? ""} ${m.frequency_unit ?? ""}${m.reason ? ` · motivo: ${m.reason}` : ""}`);
  }
  lines.push(`ÚLTIMOS REGISTROS CLÍNICOS (${records.length}):`);
  for (const r of records) {
    lines.push(`- ${r.visit_date} · ${r.visit_type}${r.clinic_name ? ` · ${r.clinic_name}` : ""}${r.diagnosis ? ` · dx: ${r.diagnosis}` : ""}${r.treatment ? ` · tx: ${r.treatment}` : ""}${r.notes ? ` · ${r.notes}` : ""}`);
  }
  lines.push(`ÚLTIMOS PESOS: ${weights.length ? weights.map((w) => `${w.weight_kg} kg (${w.measured_at})`).join(", ") : "sin registros"}`);
  return lines.join("\n");
}

/** Separa la línea ACTIONS del texto y valida las acciones contra el contexto. */
function parseActions(raw: string, cycles: CareCycle[]): { text: string; actions: AssistantAction[] } {
  const match = raw.match(/^\s*ACTIONS:\s*(\[[\s\S]*\])\s*$/m);
  if (!match) return { text: raw.trim(), actions: [] };
  const text = raw.replace(match[0], "").trim();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    try {
      parsed = JSON.parse(match[1].replace(/'/g, '"'));
    } catch {
      parsed = null;
    }
  }
  if (!Array.isArray(parsed)) return { text, actions: [] };

  const cycleIds = new Set(cycles.map((c) => c.id));
  const actions: AssistantAction[] = [];
  for (const item of parsed as Record<string, unknown>[]) {
    if (!item || typeof item !== "object") continue;
    const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : null;
    switch (item.type) {
      case "remind": {
        let cycleId = typeof item.cycle_id === "string" ? item.cycle_id : null;
        if (cycleId && !cycleIds.has(cycleId)) {
          const byName = cycles.find((c) => c.name.toLowerCase() === cycleId!.toLowerCase());
          cycleId = byName?.id ?? null;
        }
        if (!cycleId) break;
        const date = typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : undefined;
        actions.push({ type: "remind", cycle_id: cycleId, label: label ?? "Recordar el martes", ...(date ? { date } : {}) } as AssistantAction);
        break;
      }
      case "book": {
        const category = typeof item.category === "string" && item.category in BUSINESS_CATEGORY_LABEL ? (item.category as BusinessCategory) : "tienda";
        actions.push({ type: "book", category, label: label ?? "Comprar cerca" });
        break;
      }
      case "log": {
        const kind = typeof item.kind === "string" && item.kind in CARE_KIND_LABEL ? (item.kind as CareCycleKind) : "other";
        const note = typeof item.note === "string" ? item.note : undefined;
        actions.push({ type: "log", kind, label: label ?? "Anotar en historial", note });
        break;
      }
      case "sos":
        actions.push({ type: "sos", label: label ?? "Urgencia 24 h" });
        break;
      default:
        break;
    }
    if (actions.length >= 3) break;
  }
  return { text, actions };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const petId = body.pet_id?.trim();
  const message = body.message?.trim();
  if (!petId || !message) return NextResponse.json({ error: "Faltan pet_id o message" }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "El mensaje es demasiado largo" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: petData, error: petError } = await supabase.from("pets").select("*").eq("id", petId).maybeSingle();
  if (petError || !petData) return NextResponse.json({ error: "Mascota no encontrada" }, { status: 404 });
  const pet = petData as PetRow;

  // Contexto (cada consulta tolera tablas ausentes)
  const [cyclesRes, medsRes, recordsRes, weightsRes, historyRes] = await Promise.all([
    supabase.from("care_cycles").select("*").eq("pet_id", petId).eq("active", true).order("next_due_at", { ascending: true }).limit(20),
    supabase.from("medications").select("name, dose_amount, dose_unit, frequency_value, frequency_unit, reason").eq("pet_id", petId).eq("active", true).limit(10),
    supabase.from("clinical_records").select("visit_date, visit_type, diagnosis, treatment, notes, clinic_name").eq("pet_id", petId).order("visit_date", { ascending: false }).limit(5),
    supabase.from("weight_logs").select("weight_kg, measured_at").eq("pet_id", petId).order("measured_at", { ascending: false }).limit(3),
    supabase.from("assistant_messages").select("role, content").eq("user_id", user.id).eq("pet_id", petId).order("created_at", { ascending: false }).limit(HISTORY_LIMIT),
  ]);

  const cycles = (cyclesRes.data ?? []) as CareCycle[];
  const meds = (medsRes.data ?? []) as Medication[];
  const records = (recordsRes.data ?? []) as ClinicalRecord[];
  const weights = ((weightsRes.data ?? []) as WeightLog[]).reverse();
  const tableMissing = !!historyRes.error && isMissingSchema(historyRes.error);
  const history: HistoryItem[] = historyRes.error
    ? (body.history ?? []).filter((h) => (h.role === "user" || h.role === "assistant") && typeof h.content === "string").slice(-HISTORY_LIMIT)
    : ((historyRes.data ?? []) as HistoryItem[]).reverse();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ content: NOT_CONFIGURED, actions: [], persisted: false });
  }

  // Historial alternado: el primer mensaje debe ser del usuario
  const messages: Anthropic.MessageParam[] = [];
  for (const h of history) {
    if (messages.length === 0 && h.role !== "user") continue;
    if (!h.content.trim()) continue;
    messages.push({ role: h.role, content: h.content });
  }
  messages.push({ role: "user", content: message });

  let text = "";
  let actions: AssistantAction[] = [];
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        { type: "text", text: SYSTEM_BASE },
        { type: "text", text: `CONTEXTO DE LA MASCOTA\n${buildContext(pet, cycles, meds, records, weights)}` },
      ],
      output_config: { effort: "low" },
      messages,
    });

    if (response.stop_reason === "refusal") {
      text = "No puedo ayudarte con eso. Si crees que es una urgencia, llama ya a una veterinaria 24 h.";
      actions = [{ type: "sos", label: "Urgencia 24 h" }];
    } else {
      const raw = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const parsed = parseActions(raw, cycles);
      text = parsed.text || "No pude responder esta vez. ¿Puedes repetir la pregunta?";
      actions = parsed.actions;
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ content: NOT_CONFIGURED, actions: [], persisted: false });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "El asistente está ocupado. Intenta en un momento." }, { status: 429 });
    }
    if (e instanceof Anthropic.APIConnectionError) {
      return NextResponse.json({ error: "No pudimos conectar con el asistente." }, { status: 502 });
    }
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: "El asistente no está disponible ahora." }, { status: 502 });
    }
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }

  // Persistir ambos mensajes con la sesión del usuario (RLS). Si la tabla no existe, seguimos.
  let persisted = false;
  if (!tableMissing) {
    const { error } = await supabase.from("assistant_messages").insert([
      { user_id: user.id, pet_id: petId, role: "user", content: message, actions: null },
      { user_id: user.id, pet_id: petId, role: "assistant", content: text, actions: actions.length ? actions : null },
    ]);
    persisted = !error;
  }

  return NextResponse.json({ content: text, actions, persisted });
}
