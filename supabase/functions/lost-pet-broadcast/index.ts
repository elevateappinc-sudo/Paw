// PAW · lost-pet-broadcast Edge Function
// Invocada por el cliente al crear una alerta de mascota perdida.
// Encola un push a cada usuario cuya última ubicación conocida esté dentro del radio.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MAX_RECIPIENTS = 500;

Deno.serve(async (req: Request) => {
  try {
    const { alert_id } = (await req.json()) as { alert_id?: string };
    if (!alert_id) return new Response(JSON.stringify({ error: "alert_id required" }), { status: 400 });

    const { data: alert, error } = await supabase
      .from("lost_pet_alerts")
      .select("id, pet_id, user_id, lat, lng, radius_m, message, contact_phone, pets(name, breed)")
      .eq("id", alert_id)
      .single();
    if (error || !alert) return new Response(JSON.stringify({ error: "alert not found" }), { status: 404 });
    if (alert.lat == null || alert.lng == null) return new Response(JSON.stringify({ queued: 0, reason: "no location" }));

    // Usuarios con ubicación dentro del radio (PostGIS)
    const { data: users, error: uErr } = await supabase.rpc("users_within_radius", {
      p_lat: alert.lat,
      p_lng: alert.lng,
      p_radius_m: alert.radius_m ?? 3000,
      p_limit: MAX_RECIPIENTS,
    });
    if (uErr) {
      console.error("[lost-pet-broadcast] users_within_radius", uErr);
      return new Response(JSON.stringify({ queued: 0, error: uErr.message }), { status: 200 });
    }

    const pet = (alert as unknown as { pets: { name: string; breed: string | null } | null }).pets;
    const title = `Mascota perdida cerca de ti: ${pet?.name ?? "una mascota"}`;
    const body = `${pet?.breed ?? ""} ${alert.message ?? ""}`.trim() || "Si la ves, avisa desde Paw.";

    let queued = 0;
    for (const u of (users ?? []) as { user_id: string }[]) {
      if (u.user_id === alert.user_id) continue;
      const { error: insErr } = await supabase.from("notification_queue").insert({
        user_id: u.user_id,
        type: "lost_pet",
        title,
        body,
        data: { alert_id: alert.id, pet_id: alert.pet_id, url: `/perdida` },
        scheduled_for: new Date().toISOString(),
      });
      if (!insErr) queued++;
    }
    return new Response(JSON.stringify({ queued }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[lost-pet-broadcast]", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
