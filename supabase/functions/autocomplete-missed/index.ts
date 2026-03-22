// PAW · autocomplete-missed Edge Function
// F-MEDICATIONS · Sprint 2
// Deno.cron: daily at 00:00 UTC
// Marks pending medication logs as 'missed' if their scheduled_at is in the past.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function autocompleteMissed() {
  const { data, error } = await supabase
    .from("medication_logs")
    .update({ status: "missed" })
    .lt("scheduled_at", new Date().toISOString())
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("[autocomplete-missed] Error updating logs:", error);
    throw error;
  }

  console.log(`[autocomplete-missed] Marked ${data?.length ?? 0} logs as missed`);
  return data?.length ?? 0;
}

// Scheduled: run daily at 00:00 UTC
Deno.cron("autocomplete-missed-daily", "0 0 * * *", async () => {
  try {
    const count = await autocompleteMissed();
    console.log(`[autocomplete-missed] Done. ${count} logs marked as missed.`);
  } catch (err) {
    console.error("[autocomplete-missed] Cron failed:", err);
  }
});

// Also handle HTTP requests for manual triggers / testing
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
    const count = await autocompleteMissed();
    return new Response(
      JSON.stringify({ message: "Completed", missed_count: count }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
