// PAW · chronic-refill Edge Function
// F-MEDICATIONS · Sprint 2
// Deno.cron: daily
// Detects chronic medications with ≤7 days of pending logs and generates 30 more days.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MedicationRow {
  id: string;
  pet_id: string;
  user_id: string;
  name: string;
  dose_amount: number;
  dose_unit: string;
  frequency_value: number;
  frequency_unit: "hours" | "days" | "times_per_day" | "weekly";
  start_date: string;
  end_date: string | null;
}

function intervalMinutes(
  frequencyValue: number,
  frequencyUnit: MedicationRow["frequency_unit"],
): number {
  switch (frequencyUnit) {
    case "hours":
      return frequencyValue * 60;
    case "days":
      return frequencyValue * 24 * 60;
    case "times_per_day":
      return Math.round((24 / frequencyValue) * 60);
    case "weekly":
      return frequencyValue * 7 * 24 * 60;
  }
}

async function refillChronicMedication(med: MedicationRow): Promise<number> {
  // Find the latest pending log for this medication
  const { data: lastLog } = await supabase
    .from("medication_logs")
    .select("scheduled_at")
    .eq("medication_id", med.id)
    .eq("status", "pending")
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .single();

  // Start from after the last pending log, or from now if none exist
  const startFrom = lastLog
    ? new Date(lastLog.scheduled_at)
    : new Date();

  const intervalMs = intervalMinutes(med.frequency_value, med.frequency_unit) * 60 * 1000;
  const endDate = new Date(startFrom.getTime() + 30 * 24 * 60 * 60 * 1000);

  const logRows: Array<{
    medication_id: string;
    pet_id: string;
    user_id: string;
    scheduled_at: string;
    status: string;
  }> = [];

  let current = new Date(startFrom.getTime() + intervalMs);
  while (current <= endDate && logRows.length < 500) {
    logRows.push({
      medication_id: med.id,
      pet_id: med.pet_id,
      user_id: med.user_id,
      scheduled_at: current.toISOString(),
      status: "pending",
    });
    current = new Date(current.getTime() + intervalMs);
  }

  if (logRows.length === 0) return 0;

  // Insert logs in batches
  for (let i = 0; i < logRows.length; i += 100) {
    const batch = logRows.slice(i, i + 100);
    const { data: insertedLogs, error } = await supabase
      .from("medication_logs")
      .insert(batch)
      .select("id, scheduled_at");

    if (error) {
      console.error(`[chronic-refill] Failed to insert logs for ${med.id}:`, error);
      continue;
    }

    // Queue notifications
    const notifRows = (insertedLogs ?? []).map((log: { id: string; scheduled_at: string }) => ({
      user_id: med.user_id,
      pet_id: med.pet_id,
      type: "medication_reminder",
      title: `💊 Dosis de ${med.name}`,
      body: `Hora de dar ${med.dose_amount} ${med.dose_unit} a tu mascota`,
      data: JSON.stringify({
        medication_id: med.id,
        medication_log_id: log.id,
        pet_id: med.pet_id,
      }),
      scheduled_for: log.scheduled_at,
      status: "pending",
    }));

    if (notifRows.length > 0) {
      await supabase.from("notification_queue").insert(notifRows);
    }
  }

  return logRows.length;
}

async function runChronicRefill() {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Find chronic medications (no end_date, active=true)
  const { data: chronicMeds, error: medsError } = await supabase
    .from("medications")
    .select("*")
    .is("end_date", null)
    .eq("active", true);

  if (medsError || !chronicMeds) {
    console.error("[chronic-refill] Failed to fetch medications:", medsError);
    throw medsError;
  }

  let totalRefilled = 0;

  for (const med of chronicMeds as MedicationRow[]) {
    // Count pending logs in the next 7 days
    const { count } = await supabase
      .from("medication_logs")
      .select("id", { count: "exact", head: true })
      .eq("medication_id", med.id)
      .eq("status", "pending")
      .gte("scheduled_at", now)
      .lte("scheduled_at", sevenDaysFromNow);

    if ((count ?? 0) <= 7) {
      console.log(`[chronic-refill] Refilling medication ${med.id} (${med.name}), pending logs: ${count}`);
      const added = await refillChronicMedication(med);
      totalRefilled += added;
    }
  }

  return totalRefilled;
}

// Scheduled: run daily at 01:00 UTC (after autocomplete-missed)
Deno.cron("chronic-refill-daily", "0 1 * * *", async () => {
  try {
    const count = await runChronicRefill();
    console.log(`[chronic-refill] Done. Generated ${count} new logs total.`);
  } catch (err) {
    console.error("[chronic-refill] Cron failed:", err);
  }
});

// HTTP handler for manual trigger / testing
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const count = await runChronicRefill();
    return new Response(
      JSON.stringify({ message: "Chronic refill completed", logs_generated: count }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
