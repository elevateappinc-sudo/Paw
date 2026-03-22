// PAW · sync-to-gcal Edge Function
// Sprint 3 · T004
// Triggered by Supabase Database Webhook on itinerary_events (INSERT/UPDATE/DELETE)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const GOOGLE_CALENDAR_ENCRYPTION_KEY = Deno.env.get("GOOGLE_CALENDAR_ENCRYPTION_KEY")!;
const NEXT_PUBLIC_URL = Deno.env.get("NEXT_PUBLIC_URL") ?? "https://app.paw.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: ItineraryEvent | null;
  old_record: ItineraryEvent | null;
  schema: string;
}

interface ItineraryEvent {
  id: string;
  user_id: string;
  pet_id: string;
  title: string;
  event_type: string;
  scheduled_at: string;
  duration_minutes?: number;
  notes?: string;
}

interface CalendarIntegration {
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  gcal_calendar_id: string;
  sync_enabled: boolean;
  synced_event_types: string[];
}

// ─── Token helpers ────────────────────────────────────────────────────────────

async function decryptToken(encryptedToken: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("decrypt_calendar_token", {
      p_token: encryptedToken,
      p_key: GOOGLE_CALENDAR_ENCRYPTION_KEY,
    });
    if (error || !data) return encryptedToken;
    return data as string;
  } catch {
    return encryptedToken;
  }
}

async function getValidAccessToken(
  userId: string,
  integration: CalendarIntegration
): Promise<string> {
  const expiresAt = new Date(integration.token_expires_at);
  const bufferMs = 5 * 60 * 1000;

  const decryptedAccess = await decryptToken(integration.access_token);
  if (Date.now() + bufferMs < expiresAt.getTime()) {
    return decryptedAccess;
  }

  // Refresh
  const decryptedRefresh = await decryptToken(integration.refresh_token);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: decryptedRefresh,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);

  const { access_token, expires_in } = await res.json();
  const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  await supabase
    .from("calendar_integrations")
    .update({ access_token: access_token, token_expires_at: newExpiresAt })
    .eq("user_id", userId);

  return access_token;
}

// ─── GCal helpers ─────────────────────────────────────────────────────────────

function buildGCalEvent(event: ItineraryEvent, petName: string) {
  const startDt = new Date(event.scheduled_at);
  const durationMs = (event.duration_minutes ?? 30) * 60 * 1000;
  const endDt = new Date(startDt.getTime() + durationMs);
  const deepLink = `${NEXT_PUBLIC_URL}/itinerario?event=${event.id}`;

  return {
    summary: `[PAW - ${petName}] ${event.title}`,
    description: `${event.notes ? event.notes + "\n\n" : ""}Ver en PAW: ${deepLink}`,
    start: { dateTime: startDt.toISOString() },
    end: { dateTime: endDt.toISOString() },
  };
}

async function gcalRequest(
  method: string,
  url: string,
  accessToken: string,
  body?: unknown
): Promise<Response> {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createGCalEvent(
  accessToken: string,
  calendarId: string,
  eventData: ReturnType<typeof buildGCalEvent>
): Promise<string> {
  const res = await gcalRequest(
    "POST",
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    accessToken,
    eventData
  );
  if (!res.ok) throw new Error(`GCal create failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.id;
}

async function updateGCalEvent(
  accessToken: string,
  calendarId: string,
  gcalEventId: string,
  eventData: Partial<ReturnType<typeof buildGCalEvent>>
): Promise<void> {
  const res = await gcalRequest(
    "PATCH",
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(gcalEventId)}`,
    accessToken,
    eventData
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`GCal update failed (${res.status}): ${await res.text()}`);
  }
}

async function deleteGCalEvent(
  accessToken: string,
  calendarId: string,
  gcalEventId: string
): Promise<void> {
  const res = await gcalRequest(
    "DELETE",
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(gcalEventId)}`,
    accessToken
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`GCal delete failed (${res.status}): ${await res.text()}`);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    const event = payload.record ?? payload.old_record;

    if (!event) {
      return new Response("No event data", { status: 400 });
    }

    const userId = event.user_id;

    // 1. Fetch calendar integration for this user
    const { data: integration, error: intError } = await supabase
      .from("calendar_integrations")
      .select("access_token, refresh_token, token_expires_at, gcal_calendar_id, sync_enabled, synced_event_types")
      .eq("user_id", userId)
      .maybeSingle();

    if (intError || !integration) {
      // No integration — nothing to sync
      return new Response("No calendar integration", { status: 200 });
    }

    // 2. Check sync_enabled and event_type filter
    if (!integration.sync_enabled) {
      return new Response("Sync disabled", { status: 200 });
    }

    if (
      payload.type !== "DELETE" &&
      event.event_type &&
      !integration.synced_event_types.includes(event.event_type)
    ) {
      return new Response("Event type not in sync list", { status: 200 });
    }

    // 3. Get pet name for event title
    let petName = "mascota";
    if (event.pet_id) {
      const { data: pet } = await supabase
        .from("pets")
        .select("name")
        .eq("id", event.pet_id)
        .maybeSingle();
      if (pet?.name) petName = pet.name;
    }

    // 4. Get valid access token
    const accessToken = await getValidAccessToken(userId, integration);

    // 5. Handle INSERT / UPDATE / DELETE
    if (payload.type === "INSERT") {
      const gcalEventData = buildGCalEvent(event, petName);
      const gcalEventId = await createGCalEvent(
        accessToken,
        integration.gcal_calendar_id,
        gcalEventData
      );

      // Save mapping
      await supabase.from("calendar_event_mappings").upsert(
        {
          user_id: userId,
          paw_event_id: event.id,
          paw_event_type: event.event_type,
          gcal_event_id: gcalEventId,
          last_synced_at: new Date().toISOString(),
          gcal_deleted: false,
        },
        { onConflict: "user_id,paw_event_id" }
      );

      return new Response(JSON.stringify({ action: "created", gcalEventId }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (payload.type === "UPDATE") {
      // Find existing mapping
      const { data: mapping } = await supabase
        .from("calendar_event_mappings")
        .select("gcal_event_id")
        .eq("user_id", userId)
        .eq("paw_event_id", event.id)
        .maybeSingle();

      if (mapping?.gcal_event_id) {
        const gcalEventData = buildGCalEvent(event, petName);
        await updateGCalEvent(
          accessToken,
          integration.gcal_calendar_id,
          mapping.gcal_event_id,
          gcalEventData
        );
        await supabase
          .from("calendar_event_mappings")
          .update({ last_synced_at: new Date().toISOString(), gcal_deleted: false })
          .eq("user_id", userId)
          .eq("paw_event_id", event.id);
      } else {
        // No mapping — create a new GCal event
        const gcalEventData = buildGCalEvent(event, petName);
        const gcalEventId = await createGCalEvent(
          accessToken,
          integration.gcal_calendar_id,
          gcalEventData
        );
        await supabase.from("calendar_event_mappings").upsert(
          {
            user_id: userId,
            paw_event_id: event.id,
            paw_event_type: event.event_type,
            gcal_event_id: gcalEventId,
            last_synced_at: new Date().toISOString(),
            gcal_deleted: false,
          },
          { onConflict: "user_id,paw_event_id" }
        );
      }

      return new Response(JSON.stringify({ action: "updated" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (payload.type === "DELETE") {
      const { data: mapping } = await supabase
        .from("calendar_event_mappings")
        .select("gcal_event_id")
        .eq("user_id", userId)
        .eq("paw_event_id", event.id)
        .maybeSingle();

      if (mapping?.gcal_event_id) {
        await deleteGCalEvent(
          accessToken,
          integration.gcal_calendar_id,
          mapping.gcal_event_id
        );
        await supabase
          .from("calendar_event_mappings")
          .update({ gcal_deleted: true, last_synced_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("paw_event_id", event.id);
      }

      return new Response(JSON.stringify({ action: "deleted" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Unhandled event type", { status: 400 });
  } catch (err) {
    console.error("sync-to-gcal error:", err);
    return new Response(`Error: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
    });
  }
});
