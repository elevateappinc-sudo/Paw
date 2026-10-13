// PAW · care-cycle-reminders Edge Function
// Cron diario (06:00 America/Bogota). Encola recordatorios push a 7, 3 y 0 días
// de cada ciclo de cuidado activo. El índice único uq_notification_queue_care_cycle
// evita duplicados aunque la función corra dos veces.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const OFFSETS = [7, 3, 0] as const;

const KIND_LABEL: Record<string, string> = {
  vaccine: "Vacuna",
  deworm_internal: "Desparasitación",
  deworm_external: "Antipulgas",
  bath: "Baño",
  grooming: "Corte",
  nails: "Uñas",
  ears: "Oídos",
  dental: "Dientes",
  food_restock: "Recompra de alimento",
  checkup: "Control veterinario",
  weight: "Control de peso",
  other: "Cuidado",
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface CycleRow {
  id: string;
  pet_id: string;
  user_id: string;
  kind: string;
  name: string;
  next_due_at: string;
  pets: { name: string } | null;
}

async function run(): Promise<{ queued: number; skipped: number }> {
  let queued = 0;
  let skipped = 0;
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  for (const offset of OFFSETS) {
    const target = new Date(today);
    target.setUTCDate(target.getUTCDate() + offset);
    const due = isoDate(target);

    const { data, error } = await supabase
      .from("care_cycles")
      .select("id, pet_id, user_id, kind, name, next_due_at, pets(name)")
      .eq("active", true)
      .eq("next_due_at", due)
      .neq("kind", "dental");
    if (error) {
      console.error("[care-cycle-reminders] select", error);
      continue;
    }

    for (const c of (data ?? []) as unknown as CycleRow[]) {
      // Dueño + miembros activos con permiso de salud/vacunas
      const { data: members } = await supabase
        .from("pet_members")
        .select("user_id")
        .eq("pet_id", c.pet_id)
        .eq("status", "active");
      const recipients = new Set<string>([c.user_id, ...(members ?? []).map((m: { user_id: string }) => m.user_id)]);

      const petName = c.pets?.name ?? "tu mascota";
      const label = KIND_LABEL[c.kind] ?? "Cuidado";
      const when = offset === 0 ? "hoy" : offset === 3 ? "en 3 días" : "en una semana";
      const title = offset === 0 ? `${label} de ${petName}: hoy` : `${label} de ${petName} ${when}`;
      const body = `${c.name} toca ${when}. Márcalo como hecho desde Paw o reserva en un negocio cercano.`;

      for (const userId of recipients) {
        const { error: insErr } = await supabase.from("notification_queue").insert({
          user_id: userId,
          type: "care_cycle",
          title,
          body,
          data: { cycle_id: c.id, pet_id: c.pet_id, due_at: c.next_due_at, offset_days: String(offset), url: `/salud?pet=${c.pet_id}` },
          scheduled_for: new Date().toISOString(),
        });
        if (insErr) {
          // 23505 = duplicado por el índice único: ya se encoló
          if ((insErr as { code?: string }).code === "23505") skipped++;
          else console.error("[care-cycle-reminders] insert", insErr);
        } else {
          queued++;
        }
      }
    }
  }
  return { queued, skipped };
}

Deno.serve(async () => {
  const result = await run();
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
});

// Cron: todos los días a las 11:00 UTC (06:00 Bogotá)
Deno.cron("care-cycle-reminders", "0 11 * * *", async () => {
  const r = await run();
  console.log("[care-cycle-reminders]", r);
});
