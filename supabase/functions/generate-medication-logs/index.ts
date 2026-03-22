// PAW · generate-medication-logs Edge Function
// F-MEDICATIONS · Sprint 2
// Called by client after inserting a medication record.
// Generates scheduled medication_logs and queues notification_queue entries.

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
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
}

/** Returns interval in minutes between doses */
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
      // N times per day → every (24/N) hours
      return Math.round((24 / frequencyValue) * 60);
    case "weekly":
      return frequencyValue * 7 * 24 * 60;
  }
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function generateScheduledTimes(med: MedicationRow): Date[] {
  const startDate = new Date(`${med.start_date}T08:00:00Z`); // Start at 08:00 UTC by default
  const intervalMs = intervalMinutes(med.frequency_value, med.frequency_unit) * 60 * 1000;

  let endDate: Date;
  if (med.end_date) {
    // Finite treatment: generate all logs from start to end_date
    endDate = new Date(`${med.end_date}T23:59:59Z`);
  } else {
    // Chronic: generate next 30 days
    endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const times: Date[] = [];
  let current = startDate;

  // Safety cap: max 500 entries per generation to avoid runaway loops
  while (current <= endDate && times.length < 500) {
    times.push(new Date(current));
    current = new Date(current.getTime() + intervalMs);
  }

  return times;
}

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
    const { medication_id } = await req.json() as { medication_id: string };

    if (!medication_id) {
      return new Response(
        JSON.stringify({ error: "medication_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch medication
    const { data: med, error: medError } = await supabase
      .from("medications")
      .select("*")
      .eq("id", medication_id)
      .single();

    if (medError || !med) {
      return new Response(
        JSON.stringify({ error: "Medication not found", detail: medError }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const scheduledTimes = generateScheduledTimes(med as MedicationRow);

    if (scheduledTimes.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled times generated", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Build medication_logs rows
    const logRows = scheduledTimes.map((t) => ({
      medication_id: med.id,
      pet_id: med.pet_id,
      user_id: med.user_id,
      scheduled_at: t.toISOString(),
      status: "pending",
    }));

    // Insert logs
    const { data: insertedLogs, error: logsError } = await supabase
      .from("medication_logs")
      .insert(logRows)
      .select("id, scheduled_at");

    if (logsError) {
      return new Response(
        JSON.stringify({ error: "Failed to insert medication_logs", detail: logsError }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Queue notifications for each log
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
      // Insert in batches of 100 to be safe
      for (let i = 0; i < notifRows.length; i += 100) {
        const batch = notifRows.slice(i, i + 100);
        const { error: notifError } = await supabase
          .from("notification_queue")
          .insert(batch);

        if (notifError) {
          console.error("Failed to insert notification_queue batch:", notifError);
          // Non-fatal: logs were already created
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Medication logs generated successfully",
        medication_id: med.id,
        logs_count: insertedLogs?.length ?? 0,
        notifications_queued: notifRows.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  } catch (err) {
    console.error("generate-medication-logs error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
